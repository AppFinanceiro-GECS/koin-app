import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { KoinLogo } from '@/components/KoinLogo'
import { getApiErrorMessage } from '@/lib/errors'
import { authApi } from '@/services/auth.api'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'

export default function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null)

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const showSub = Keyboard.addListener(showEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setKeyboardVisible(true)
    })
    const hideSub = Keyboard.addListener(hideEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setKeyboardVisible(false)
    })

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const { data } = await authApi.login(email.trim().toLowerCase(), password)
      await signIn(data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'E-mail ou senha inválidos'))
    } finally {
      setLoading(false)
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
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.content,
            isKeyboardVisible && styles.contentKeyboardActive,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainContainer}>
            {/* Header / Brand lockup */}
            <View style={[styles.header, isKeyboardVisible && styles.headerCompact]}>
              <KoinLogo size={isKeyboardVisible ? 0.8 : 1} />
              <Text style={styles.title}>Entrar</Text>
              {!isKeyboardVisible && (
                <Text style={styles.subtitle}>
                  O acesso ao app é feito por convite. Já tem conta? Entre com seu e-mail.
                </Text>
              )}
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val)
                    if (error) setError(null)
                  }}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder="pedro@email.com"
                  placeholderTextColor={darkTheme.textMuted}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val)
                    if (error) setError(null)
                  }}
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  placeholder="••••••••"
                  placeholderTextColor={darkTheme.textMuted}
                  onSubmitEditing={handleSubmit}
                  returnKeyType="go"
                />
              </View>

              <Pressable
                onPress={() => router.push('/forgot-password' as any)}
                hitSlop={8}
                style={styles.forgotPasswordButton}
              >
                <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
              </Pressable>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Botão primário: Entrar */}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={darkTheme.text} />
                ) : (
                  <Text style={styles.primaryButtonText}>Entrar</Text>
                )}
              </Pressable>

              {/* Separador: ou */}
              <View style={styles.separatorContainer}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>ou</Text>
                <View style={styles.separatorLine} />
              </View>

              {/* Botão secundário: Tenho um convite */}
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
                onPress={() => router.push('/invite')}
              >
                <Text style={styles.secondaryButtonText}>Tenho um convite</Text>
              </Pressable>
            </View>
          </View>

          {/* Rodapé */}
          {!isKeyboardVisible && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Não tem convite? Peça a alguém do seu grupo familiar para enviar um.
              </Text>
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
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  contentKeyboardActive: {
    justifyContent: 'flex-start',
    paddingTop: 12,
    paddingBottom: 24,
  },
  mainContainer: {
    gap: 16,
  },
  header: {
    gap: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerCompact: {
    gap: 8,
    paddingTop: 0,
    paddingBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: darkTheme.text,
    letterSpacing: -0.5,
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
  inputError: {
    borderColor: darkTheme.error,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: darkTheme.accent,
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
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: darkTheme.border,
  },
  separatorText: {
    fontSize: 13,
    color: darkTheme.textSecondary,
  },
  footer: {
    paddingTop: 24,
    paddingBottom: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
})
