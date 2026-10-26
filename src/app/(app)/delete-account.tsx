import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
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
  type TextInputProps,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { IconTile } from '@/components/IconTile'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Tag } from '@/components/Tag'
import { getApiErrorMessage } from '@/lib/errors'
import { familyDisplayName, memberFirstName } from '@/lib/family'
import { joinWithOr } from '@/lib/format'
import { authApi } from '@/services/auth.api'
import { familyApi } from '@/services/settings.api'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'

const CONFIRM_WORD = 'EXCLUIR'

/** Respostas de "rota inexistente": o koin-api ainda não tem a autoexclusão. */
const NOT_IMPLEMENTED_STATUSES = [404, 405, 501]
const UNAVAILABLE_MESSAGE =
  'A exclusão de conta ainda não está disponível. Nada foi apagado e você continua conectado.'

function Field({ label, ...input }: { label: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCorrect={false}
        placeholderTextColor={darkTheme.textMuted}
        style={styles.input}
        {...input}
      />
    </View>
  )
}

export default function DeleteAccountScreen() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')

  // Sem família a API responde 403; nesse caso o aviso sobre os outros membros some.
  const familyQuery = useQuery({
    queryKey: ['family', 'context'],
    queryFn: async () => (await familyApi.getContext()).data,
    retry: false,
  })
  const family = familyQuery.data
  const others = (family?.members ?? []).filter((m) => m.user_id !== user?.id)

  const deletion = useMutation({
    mutationFn: () => authApi.deleteAccount(password),
    onSuccess: async () => {
      // A tela final não tem guard: navega antes de encerrar a sessão.
      router.replace({
        pathname: '/account-deleted',
        params: family && others.length > 0 ? { family: familyDisplayName(family.members) } : {},
      })
      await signOut()
    },
  })

  const confirmed = password.length > 0 && confirmation.trim() === CONFIRM_WORD
  const submitDisabled = !confirmed || deletion.isPending

  const status = (deletion.error as { response?: { status?: number } } | null)?.response?.status
  const errorMessage = deletion.isError
    ? status && NOT_IMPLEMENTED_STATUSES.includes(status)
      ? UNAVAILABLE_MESSAGE
      : getApiErrorMessage(deletion.error, 'Não foi possível excluir a conta')
    : null

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ScreenHeader title="Excluir minha conta" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <IconTile icon="user-x" />
          <Text style={styles.headline}>Revise antes de excluir</Text>
          <Text style={styles.lead}>
            Você está solicitando a exclusão da conta de {user?.name ?? 'sua conta'}.
          </Text>

          <View style={styles.warningCard}>
            <Feather name="alert-triangle" size={18} color={WARNING} style={styles.warningIcon} />
            <View style={styles.warningBody}>
              <Text style={styles.warningTitle}>Seus dados pessoais</Text>
              <Text style={styles.warningText}>
                A exclusão encerra seu acesso. O tratamento dos registros pessoais e da retenção deve
                seguir a política ainda a validar.
              </Text>
            </View>
          </View>

          {family && others.length > 0 && (
            <View style={styles.familyCard}>
              <Tag label={familyDisplayName(family.members)} />
              <Text style={styles.familyText}>
                Esta ação não exclui as contas de {joinWithOr(others.map(memberFirstName))}. Dados
                compartilhados e direitos dos outros membros precisam ser considerados; não prometemos
                apagar registros de terceiros.
              </Text>
            </View>
          )}

          <Field
            autoCapitalize="none"
            autoComplete="current-password"
            editable={!deletion.isPending}
            label="Confirme sua senha do Koin"
            onChangeText={setPassword}
            secureTextEntry
            value={password}
          />
          <Field
            autoCapitalize="characters"
            editable={!deletion.isPending}
            label={`Digite ${CONFIRM_WORD} para confirmar`}
            onChangeText={setConfirmation}
            value={confirmation}
          />

          <Text style={styles.note}>
            A política de retenção ainda não está definida; não há prazo de remoção confirmado.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          {errorMessage && (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {errorMessage}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: submitDisabled }}
            disabled={submitDisabled}
            onPress={() => deletion.mutate()}
            style={({ pressed }) => [
              styles.primaryButton,
              submitDisabled && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {deletion.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Confirmar exclusão da minha conta</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Cancelar e manter conta</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const WARNING = '#fbbf24'

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: darkTheme.textSecondary,
    marginTop: -6,
  },
  warningCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#5b3a12',
    backgroundColor: '#1a120a',
    padding: 14,
  },
  warningIcon: {
    marginTop: 1,
  },
  warningBody: {
    flex: 1,
    gap: 4,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: WARNING,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 19,
    color: darkTheme.textSecondary,
  },
  familyCard: {
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
    padding: 16,
  },
  familyText: {
    fontSize: 13,
    lineHeight: 20,
    color: darkTheme.textSecondary,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
    paddingHorizontal: 16,
    fontSize: 15,
    color: darkTheme.text,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    color: darkTheme.textSecondary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    color: darkTheme.error,
    textAlign: 'center',
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: darkTheme.text,
  },
})
