import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/components/ScreenHeader'
import { getApiErrorMessage } from '@/lib/errors'
import { familyDisplayName } from '@/lib/family'
import { familyApi } from '@/services/settings.api'
import { darkTheme } from '@/theme/colors'
import type { FamilyInviteResponse } from '@/types/api'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** "26/10 às 16:44" no fuso local. */
function formatExpiry(iso: string): string {
  // A API devolve datetime UTC sem sufixo de fuso.
  const date = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} às ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function FamilyInviteScreen() {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<FamilyInviteResponse | null>(null)

  const familyQuery = useQuery({
    queryKey: ['family', 'context'],
    queryFn: async () => (await familyApi.getContext()).data,
    retry: false,
  })
  const family = familyQuery.data
  const canInvite = Boolean(family?.can_invite) && (family?.member_count ?? 0) < (family?.max_members ?? 0)

  const invite = useMutation({
    mutationFn: async () => (await familyApi.invite(email.trim())).data,
    onSuccess: (data) => {
      setSent(data)
      queryClient.invalidateQueries({ queryKey: ['family'] })
    },
  })

  const emailValid = EMAIL_PATTERN.test(email.trim())
  const submitDisabled = !sent && (!emailValid || invite.isPending || !canInvite)

  const onSubmit = () => {
    if (sent) return router.back()
    invite.mutate()
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ScreenHeader title="Convidar" variant="close" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headline}>
            Convide alguém para a {family ? familyDisplayName(family.members) : 'família'}
          </Text>
          <Text style={styles.lead}>
            A pessoa recebe um link por e-mail e só consegue criar a conta com ele.
          </Text>

          <Text style={styles.fieldLabel}>E-mail de quem você quer convidar</Text>
          <TextInput
            accessibilityLabel="E-mail de quem você quer convidar"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!sent && !invite.isPending}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="ana@email.com"
            placeholderTextColor={darkTheme.textMuted}
            style={[styles.input, sent && styles.inputLocked]}
            value={email}
          />

          <Text style={styles.sectionTitle}>O que essa pessoa pode fazer</Text>

          {/* A API ainda não recebe permissões no convite: todo convidado entra com o padrão (ver e lançar). */}
          <LinearGradient
            colors={['#120e1e', '#1a0f33']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.option, styles.optionSelected]}
          >
            <View accessibilityRole="radio" accessibilityState={{ selected: true }} style={styles.optionRow}>
              <View style={[styles.radio, styles.radioSelected]}>
                <View style={styles.radioDot} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Ver e lançar despesas compartilhadas</Text>
                <Text style={styles.optionSubtitle}>Para quem divide contas com o grupo</Text>
              </View>
            </View>
          </LinearGradient>

          <View
            accessibilityRole="radio"
            accessibilityState={{ selected: false, disabled: true }}
            style={[styles.option, styles.optionDisabled]}
          >
            <View style={styles.optionRow}>
              <View style={styles.radio} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Só ver o resumo da família</Text>
                <Text style={styles.optionSubtitle}>Não cria nem edita lançamentos</Text>
              </View>
              <View style={styles.soonBadge}>
                <Text style={styles.soonText}>Em breve</Text>
              </View>
            </View>
          </View>

          <LinearGradient
            colors={['#0f0b1e', '#1f0c3b', '#0a0414']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.infoCard}
          >
            <Text style={styles.infoLabel}>{sent ? 'Convite enviado' : 'Validade do convite'}</Text>
            {/* TODO: a API não devolve código de convite e a validade (48 h) é definida no backend. */}
            <Text style={styles.infoValue}>{sent ? `Até ${formatExpiry(sent.expires_at)}` : '48 horas'}</Text>
            <Text style={styles.infoBody}>
              {sent
                ? `Enviamos um link para ${sent.email}. Ele já preenche o cadastro.`
                : 'Enviamos um link por e-mail que já preenche o cadastro.'}
            </Text>
          </LinearGradient>
        </ScrollView>

        <View style={styles.footer}>
          {invite.isError && (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {getApiErrorMessage(invite.error, 'Não foi possível enviar o convite')}
            </Text>
          )}
          {!sent && family && !canInvite && (
            <Text style={styles.errorText}>
              {family.can_invite
                ? `Limite de ${family.max_members} membros atingido.`
                : 'Você não tem permissão para convidar membros.'}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: submitDisabled }}
            disabled={submitDisabled}
            onPress={onSubmit}
            style={({ pressed }) => [
              styles.submit,
              submitDisabled && styles.submitDisabled,
              pressed && styles.pressed,
            ]}
          >
            {invite.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>{sent ? 'Concluir' : 'Enviar convite'}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headline: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.5,
  },
  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: darkTheme.textSecondary,
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginTop: 20,
    marginBottom: 8,
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
  inputLocked: {
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.3,
    marginTop: 24,
    marginBottom: 12,
  },
  option: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: darkTheme.primary,
  },
  optionDisabled: {
    opacity: 0.55,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  optionSubtitle: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: darkTheme.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: darkTheme.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: darkTheme.accent,
  },
  soonBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: darkTheme.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  soonText: {
    fontSize: 11,
    color: darkTheme.textSecondary,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    padding: 16,
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  infoValue: {
    fontSize: 28,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.4,
    marginTop: 10,
  },
  infoBody: {
    fontSize: 13,
    lineHeight: 19,
    color: darkTheme.textSecondary,
    marginTop: 10,
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
  submit: {
    height: 52,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.45,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
})
