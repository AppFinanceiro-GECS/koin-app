import { Feather } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getApiErrorMessage } from '@/lib/errors'
import { authApi } from '@/services/auth.api'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'

export default function InviteScreen() {
  const params = useLocalSearchParams<{ token?: string }>()
  const signIn = useAuthStore((s) => s.signIn)

  const [tokenInput, setTokenInput] = useState(params.token ?? '')
  const [submittedToken, setSubmittedToken] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null)

  // O token ativo é o digitado/submetido pelo usuário, ou o passado via deep link / query param
  const activeToken = submittedToken ?? params.token?.trim() ?? ''

  const invite = useQuery({
    queryKey: ['invite', activeToken],
    queryFn: async () => (await authApi.validateInvite(activeToken)).data,
    enabled: activeToken.length > 0,
    retry: false,
  })

  const isValidInvite = Boolean(invite.data?.is_valid)
  const isInvalidInvite = Boolean(
    activeToken.length > 0 &&
      !invite.isLoading &&
      (invite.error || (invite.data && !invite.data.is_valid)),
  )
  const inviteEmail = isValidInvite ? invite.data?.email : null

  function handleValidateToken() {
    const trimmed = tokenInput.trim()
    if (!trimmed) {
      setFormError('Cole ou digite o código do convite')
      return
    }
    setFormError(null)
    setSubmittedToken(trimmed)
  }

  function handleResetToken() {
    setSubmittedToken('')
    setTokenInput('')
    setFormError(null)
  }

  async function handleRegister() {
    if (name.trim().length < 2) {
      setFormError('Informe seu nome completo')
      return
    }
    if (password.length < 6) {
      setFormError('A senha deve ter pelo menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setFormError('As senhas não coincidem')
      return
    }
    if (!acceptTerms) {
      setFormError('Você precisa aceitar os termos de uso para continuar')
      return
    }

    setFormError(null)
    setSubmitting(true)
    try {
      const { data } = await authApi.registerWithInvite(activeToken, name.trim(), password)
      await signIn(data)
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Não foi possível concluir o cadastro'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <Pressable
            hitSlop={12}
            style={styles.backButton}
            onPress={() => {
              if (isValidInvite) {
                handleResetToken()
              } else if (router.canGoBack()) {
                router.back()
              } else {
                router.replace('/login')
              }
            }}
          >
            <Feather name="chevron-left" size={24} color={darkTheme.text} />
          </Pressable>
          <Text style={styles.topBarTitle}>
            {isValidInvite ? 'Criar conta' : 'Convite'}
          </Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {isValidInvite ? (
            /* ============================================================ */
            /* TELA 1 · A3: Criar conta com convite válido                  */
            /* ============================================================ */
            <View style={styles.body}>
              {/* Card Convite Válido */}
              <View style={styles.validCard}>
                <Feather
                  name="check-circle"
                  size={20}
                  color={darkTheme.success}
                  style={styles.validCardIcon}
                />
                <View style={styles.validCardContent}>
                  <Text style={styles.validCardTitle}>Convite válido</Text>
                  <Text style={styles.validCardText}>
                    Convite para{' '}
                    <Text style={styles.boldWhite}>{inviteEmail}</Text>. Conclua seu
                    cadastro para acessar o grupo.
                  </Text>
                </View>
              </View>

              {/* Formulário de Registro */}
              <View style={styles.form}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Nome</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={(val) => {
                      setName(val)
                      if (formError) setFormError(null)
                    }}
                    autoComplete="name"
                    placeholder="Pedro Andrade"
                    placeholderTextColor={darkTheme.textMuted}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>E-mail do convite</Text>
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={inviteEmail ?? ''}
                    editable={false}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Crie uma senha</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val)
                      if (formError) setFormError(null)
                    }}
                    secureTextEntry
                    autoComplete="new-password"
                    placeholder="••••••••"
                    placeholderTextColor={darkTheme.textMuted}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Confirme a senha</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val)
                      if (formError) setFormError(null)
                    }}
                    secureTextEntry
                    autoComplete="new-password"
                    placeholder="••••••••"
                    placeholderTextColor={darkTheme.textMuted}
                  />
                </View>

                {/* Termos de uso checkbox */}
                <Pressable
                  style={styles.checkboxContainer}
                  onPress={() => setAcceptTerms(!acceptTerms)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      acceptTerms && styles.checkboxActive,
                    ]}
                  >
                    {acceptTerms && (
                      <Feather name="check" size={13} color="#ffffff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Li e aceito os termos de uso e a política de privacidade.
                  </Text>
                </Pressable>

                {formError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{formError}</Text>
                  </View>
                ) : null}

                {/* Botão Criar conta e entrar */}
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed,
                    submitting && styles.buttonDisabled,
                  ]}
                  onPress={handleRegister}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={darkTheme.text} />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Criar conta e entrar
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : isInvalidInvite ? (
            /* ============================================================ */
            /* TELA: Convite inválido ou expirado                          */
            /* ============================================================ */
            <View style={styles.body}>
              <View style={styles.headerBlock}>
                <Text style={styles.title}>Este convite não pode ser usado</Text>
                <Text style={styles.subtitle}>
                  O código é inválido ou expirou. Confira o código ou peça um novo
                  a quem convidou você.
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Código do convite</Text>
                  <TextInput
                    style={[styles.input, styles.inputError]}
                    value={tokenInput}
                    onChangeText={setTokenInput}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="BIV-7K2Q-91"
                    placeholderTextColor={darkTheme.textMuted}
                  />
                  <Text style={styles.fieldErrorText}>
                    Convite inválido ou expirado.
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.errorCodeRow}>
                    <Text style={styles.errorCodeLabel}>Código de erro</Text>
                    <Text style={styles.errorCodeValue}>CONVITE_INVALIDO</Text>
                  </View>
                  <Text style={styles.infoCardText}>
                    Solicite um novo código à pessoa responsável pelo convite. Não há
                    cadastro aberto sem convite.
                  </Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed,
                  ]}
                  onPress={handleResetToken}
                >
                  <Text style={styles.primaryButtonText}>Tentar outro código</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryButtonPressed,
                  ]}
                  onPress={() => router.replace('/login')}
                >
                  <Text style={styles.secondaryButtonText}>Voltar ao login</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* ============================================================ */
            /* TELA 1 · A2: Digite seu código de convite                    */
            /* ============================================================ */
            <View style={styles.body}>
              <View style={styles.headerBlock}>
                {/* Mail Icon Box */}
                <View style={styles.iconBox}>
                  <Feather name="mail" size={28} color={darkTheme.accent} />
                </View>

                <Text style={styles.title}>Digite seu código de convite</Text>
                <Text style={styles.subtitle}>
                  Você recebeu o código por e-mail ou mensagem de quem convidou
                  você.
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Código do convite</Text>
                  <TextInput
                    style={[styles.input, styles.inputActive]}
                    value={tokenInput}
                    onChangeText={(val) => {
                      setTokenInput(val)
                      if (formError) setFormError(null)
                    }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="BIV-7K2Q-91"
                    placeholderTextColor={darkTheme.textMuted}
                    onSubmitEditing={handleValidateToken}
                    returnKeyType="go"
                  />
                </View>

                {/* Info Card */}
                <View style={styles.infoCardWithIcon}>
                  <Feather
                    name="info"
                    size={18}
                    color={darkTheme.accent}
                    style={styles.infoCardIcon}
                  />
                  <Text style={styles.infoCardText}>
                    Abriu o link do convite? O código já aparece preenchido e você
                    segue direto para criar a conta.
                  </Text>
                </View>

                {formError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{formError}</Text>
                  </View>
                ) : null}

                {/* Botão Validar convite */}
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.primaryButtonPressed,
                    invite.isFetching && styles.buttonDisabled,
                  ]}
                  onPress={handleValidateToken}
                  disabled={invite.isFetching}
                >
                  {invite.isFetching ? (
                    <ActivityIndicator color={darkTheme.text} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Validar convite</Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.linkButton}
                  onPress={() => router.push('/login')}
                >
                  <Text style={styles.linkButtonText}>Já tenho uma conta</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
  },
  topBarSpacer: {
    width: 44,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  body: {
    gap: 20,
  },
  headerBlock: {
    gap: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: darkTheme.text,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  fieldContainer: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: darkTheme.textSecondary,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
    paddingHorizontal: 14,
    fontSize: 15,
    color: darkTheme.text,
  },
  inputActive: {
    borderColor: darkTheme.borderFocus,
  },
  inputDisabled: {
    backgroundColor: '#181226',
    color: darkTheme.textSecondary,
  },
  inputError: {
    borderColor: darkTheme.error,
  },
  fieldErrorText: {
    color: darkTheme.error,
    fontSize: 12,
    marginTop: 2,
  },
  infoCardWithIcon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: darkTheme.surfaceSecondary,
    borderColor: darkTheme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  infoCardIcon: {
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: darkTheme.surfaceSecondary,
    borderColor: darkTheme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  errorCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorCodeLabel: {
    fontSize: 13,
    color: darkTheme.textSecondary,
  },
  errorCodeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: darkTheme.text,
  },
  infoCardText: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  validCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: darkTheme.successBackground,
    borderColor: darkTheme.successBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  validCardIcon: {
    marginTop: 2,
  },
  validCardContent: {
    flex: 1,
    gap: 4,
  },
  validCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: darkTheme.success,
  },
  validCardText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  boldWhite: {
    fontWeight: '700',
    color: '#ffffff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: darkTheme.primary,
    borderColor: darkTheme.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  errorContainer: {
    backgroundColor: darkTheme.errorBackground,
    borderColor: darkTheme.errorBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    color: darkTheme.error,
    fontSize: 13,
    textAlign: 'center',
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: darkTheme.primaryPressed,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: darkTheme.text,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    backgroundColor: darkTheme.border,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: darkTheme.text,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkButtonText: {
    fontSize: 14,
    color: darkTheme.accent,
    fontWeight: '500',
  },
})
