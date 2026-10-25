import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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

import { darkTheme } from '@/theme/colors'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Informe seu e-mail para prosseguir.')
      return
    }

    setLoading(true)
    // Simula envio de instruções
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 800)
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
            onPress={() => router.back()}
          >
            <Feather name="chevron-left" size={24} color={darkTheme.text} />
          </Pressable>
          <Text style={styles.topBarTitle}>Recuperar senha</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.body}>
            <View style={styles.headerBlock}>
              {/* Key Icon Box */}
              <View style={styles.iconBox}>
                <Feather name="key" size={28} color={darkTheme.accent} />
              </View>

              <Text style={styles.title}>Vamos recuperar seu acesso</Text>
              <Text style={styles.subtitle}>
                Informe o e-mail usado para entrar no Koin.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="pedro@email.com"
                  placeholderTextColor={darkTheme.textMuted}
                  onSubmitEditing={handleSubmit}
                  returnKeyType="go"
                />
              </View>

              {/* Info Card */}
              <View style={styles.infoCard}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Após solicitar o envio</Text>
                </View>

                <Text style={styles.infoCardText}>
                  Se houver uma conta associada a esse e-mail, você receberá as
                  instruções para redefinir a senha.
                </Text>

                <Text style={styles.infoCardSubtext}>
                  Confira também a pasta de spam. Essa mensagem não confirma se o
                  e-mail está cadastrado.
                </Text>
              </View>

              <Text style={styles.exclusiveText}>
                O acesso continua sendo exclusivo para pessoas com convite.
              </Text>

              {/* Botões */}
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
                  <Text style={styles.primaryButtonText}>
                    {submitted ? 'Instruções enviadas!' : 'Enviar instruções'}
                  </Text>
                )}
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
  infoCard: {
    backgroundColor: darkTheme.surfaceSecondary,
    borderColor: darkTheme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#271c3d',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    color: darkTheme.accent,
    fontWeight: '600',
  },
  infoCardText: {
    fontSize: 13,
    color: darkTheme.text,
    lineHeight: 18,
  },
  infoCardSubtext: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    lineHeight: 17,
  },
  exclusiveText: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    lineHeight: 18,
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
})
