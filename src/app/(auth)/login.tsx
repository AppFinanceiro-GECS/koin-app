import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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

import { getApiErrorMessage } from '@/lib/errors'
import { authApi } from '@/services/auth.api'
import { useAuthStore } from '@/stores/authStore'

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

  function handleForgotPassword() {
    Alert.alert(
      'Recuperar senha',
      'Entre em contato com o suporte ou com seu grupo familiar para recuperar o acesso à sua conta.',
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
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
            {/* Top Logo box */}
            {!isKeyboardVisible && (
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>Logo</Text>
              </View>
            )}

            {/* Title & Subtitle */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Entrar</Text>
              <Text style={styles.subtitle}>
                O acesso ao app é feito por convite. Já tem conta? Entre com seu e-mail.
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder="pedro@email.com"
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  placeholder="••••••••"
                  placeholderTextColor="#999999"
                  onSubmitEditing={handleSubmit}
                  returnKeyType="go"
                />
              </View>

              <Pressable
                onPress={handleForgotPassword}
                hitSlop={8}
                style={styles.forgotPasswordButton}
              >
                <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
              </Pressable>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Primary button: Entrar */}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Entrar</Text>
                )}
              </Pressable>

              {/* Separator: ou */}
              <View style={styles.separatorContainer}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>ou</Text>
                <View style={styles.separatorLine} />
              </View>

              {/* Secondary button: Tenho um convite */}
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => router.push('/invite')}
              >
                <Text style={styles.secondaryButtonText}>Tenho um convite</Text>
              </Pressable>
            </View>
          </View>

          {/* Footer */}
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
    backgroundColor: '#ffffff',
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 16,
  },
  contentKeyboardActive: {
    justifyContent: 'flex-start',
    paddingTop: 16,
    paddingBottom: 24,
  },
  mainContainer: {
    gap: 18,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#e3e3e3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 12,
    color: '#737373',
    fontWeight: '400',
  },
  titleContainer: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#737373',
    lineHeight: 21,
  },
  form: {
    gap: 18,
  },
  fieldContainer: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#737373',
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cccccc',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-start',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#737373',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cccccc',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e3e3e3',
  },
  separatorText: {
    fontSize: 13,
    color: '#737373',
    fontWeight: '400',
  },
  footer: {
    paddingTop: 24,
    paddingBottom: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#737373',
    textAlign: 'center',
    lineHeight: 18,
  },
})
