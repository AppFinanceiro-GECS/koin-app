import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
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

import { PasswordInput } from '@/components/PasswordInput'
import { getApiErrorMessage } from '@/lib/errors'
import { EVENT_CODE, EVENT_CONSENT_TEXT, markEventSignupPending } from '@/lib/event'
import { eventApi } from '@/services/event.api'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Checkbox({
  checked,
  onToggle,
  children,
}: {
  checked: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <Pressable
      style={styles.checkboxRow}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={4}
    >
      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
        {checked && <Feather name="check" size={13} color={darkTheme.text} />}
      </View>
      <Text style={styles.checkboxLabel}>{children}</Text>
    </Pressable>
  )
}

/** Cadastro do stand: código do evento já preenchido, conta criada e já logada. */
export default function SignupScreen() {
  const signIn = useAuthStore((s) => s.signIn)

  const [code, setCode] = useState(EVENT_CODE ?? '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // LGPD: as duas caixas começam desmarcadas; só os termos são obrigatórios
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function clearError() {
    if (error) setError(null)
  }

  async function handleSubmit() {
    const cleanEmail = email.trim().toLowerCase()
    if (!code.trim()) return setError('Informe o código do evento')
    if (name.trim().length < 2) return setError('Informe seu nome')
    if (!EMAIL_RE.test(cleanEmail)) return setError('Informe um e-mail válido')
    if (password.length < 8) return setError('A senha precisa ter pelo menos 8 caracteres')
    if (!acceptTerms) return setError('Aceite os termos de uso para continuar')

    setError(null)
    setSubmitting(true)
    try {
      const { data } = await eventApi.signup({
        code: code.trim(),
        name: name.trim(),
        email: cleanEmail,
        password,
        accept_terms: true,
        marketing_opt_in: marketingOptIn,
      })
      markEventSignupPending()
      await signIn(data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível criar a conta'))
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
        <View style={styles.topBar}>
          <Pressable
            hitSlop={12}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
          >
            <Feather name="chevron-left" size={24} color={darkTheme.text} />
          </Pressable>
          <Text style={styles.topBarTitle}>Criar conta</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Crie sua conta e ganhe um bombom 🍫</Text>
            <Text style={styles.subtitle}>
              Depois é só confirmar o código que chega no seu e-mail e mostrar a tela no stand.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Código do evento</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={(v) => {
                  setCode(v)
                  clearError()
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Código impresso no banner"
                placeholderTextColor={darkTheme.textMuted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(v) => {
                  setName(v)
                  clearError()
                }}
                autoComplete="name"
                textContentType="name"
                placeholder="Como quer ser chamado"
                placeholderTextColor={darkTheme.textMuted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(v) => {
                  setEmail(v)
                  clearError()
                }}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="voce@email.com"
                placeholderTextColor={darkTheme.textMuted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Senha</Text>
              <PasswordInput
                style={styles.input}
                value={password}
                onChangeText={(v) => {
                  setPassword(v)
                  clearError()
                }}
                autoComplete="new-password"
                textContentType="newPassword"
                placeholder="Pelo menos 8 caracteres"
                placeholderTextColor={darkTheme.textMuted}
                onSubmitEditing={handleSubmit}
                returnKeyType="go"
              />
            </View>

            <Checkbox checked={acceptTerms} onToggle={() => setAcceptTerms((v) => !v)}>
              Li e aceito os termos de uso e a política de privacidade.
            </Checkbox>
            <Checkbox checked={marketingOptIn} onToggle={() => setMarketingOptIn((v) => !v)}>
              {EVENT_CONSENT_TEXT}
            </Checkbox>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                submitting && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
              accessibilityRole="button"
            >
              {submitting ? (
                <ActivityIndicator color={darkTheme.text} />
              ) : (
                <Text style={styles.primaryButtonText}>Criar conta</Text>
              )}
            </Pressable>

            <Pressable style={styles.linkButton} onPress={() => router.replace('/login')}>
              <Text style={styles.linkButtonText}>Já tenho uma conta</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: darkTheme.background },
  flex: { flex: 1 },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 16, fontWeight: '600', color: darkTheme.text },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 20 },
  headerBlock: { gap: 10 },
  title: { fontSize: 26, fontWeight: '600', color: darkTheme.text, letterSpacing: -0.5, lineHeight: 32 },
  subtitle: { fontSize: 14, color: darkTheme.textSecondary, lineHeight: 20 },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, color: darkTheme.textSecondary },
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
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 2 },
  checkbox: {
    width: 22,
    height: 22,
    marginTop: 1,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: darkTheme.primary, borderColor: darkTheme.primary },
  checkboxLabel: { flex: 1, fontSize: 13, color: darkTheme.textSecondary, lineHeight: 19 },
  errorBox: {
    backgroundColor: darkTheme.errorBackground,
    borderColor: darkTheme.errorBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: { color: darkTheme.error, fontSize: 13, textAlign: 'center' },
  primaryButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: { backgroundColor: darkTheme.primaryPressed },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: darkTheme.text },
  buttonDisabled: { opacity: 0.6 },
  linkButton: { alignItems: 'center', paddingVertical: 8 },
  linkButtonText: { fontSize: 14, color: darkTheme.accent, fontWeight: '500' },
})
