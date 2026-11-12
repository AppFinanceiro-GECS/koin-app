import Feather from '@expo/vector-icons/Feather'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Clipboard from 'expo-clipboard'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/components/ScreenHeader'
import { getApiErrorMessage } from '@/lib/errors'
import { familyDisplayName } from '@/lib/family'
import { parseApiDate } from '@/lib/format'
import { familyApi } from '@/services/settings.api'
import { darkTheme } from '@/theme/colors'
import type { FamilyInviteResponse } from '@/types/api'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** "26/10 às 16:44" no fuso local. */
function formatExpiry(iso: string): string {
  const date = parseApiDate(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} às ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function FamilyInviteScreen() {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [sent, setSent] = useState<FamilyInviteResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const familyQuery = useQuery({
    queryKey: ['family', 'context'],
    queryFn: async () => (await familyApi.getContext()).data,
    retry: false,
  })
  const family = familyQuery.data
  const canInvite = Boolean(family?.can_invite) && (family?.member_count ?? 0) < (family?.max_members ?? 0)

  const invite = useMutation({
    mutationFn: async () =>
      (await familyApi.invite(email.trim(), nickname.trim() || undefined)).data,
    onSuccess: (data) => {
      setSent(data)
      queryClient.invalidateQueries({ queryKey: ['family'] })
    },
  })

  const emailValid = EMAIL_PATTERN.test(email.trim())
  const submitDisabled = !sent && (!emailValid || invite.isPending || !canInvite)

  const sentCode = sent?.code || sent?.token || ''

  const handleCopy = async () => {
    if (!sentCode) return
    await Clipboard.setStringAsync(sentCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleShare = async () => {
    if (!sentCode) return
    try {
      await Share.share({
        title: 'Código de convite do Koin',
        message: `Você foi convidado para o Koin!\n\nSeu código de convite:\n${sentCode}\n\nPara acessar:\n1. Baixe o aplicativo Koin\n2. Na tela de login, toque em "Tenho um convite"\n3. Cole o código acima para concluir o cadastro.`,
      })
    } catch (err) {
      console.warn('Erro ao compartilhar código:', err)
    }
  }

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
            A pessoa recebe o código de convite para criar a conta no aplicativo.
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

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Apelido ou primeiro nome (opcional)</Text>
          <TextInput
            accessibilityLabel="Apelido ou primeiro nome (opcional)"
            autoCapitalize="words"
            editable={!sent && !invite.isPending}
            onChangeText={setNickname}
            placeholder="Ex: Mãe, Pedro, Lucas"
            placeholderTextColor={darkTheme.textMuted}
            style={[styles.input, sent && styles.inputLocked]}
            value={nickname}
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
            <Text style={styles.infoLabel}>{sent ? 'Código de convite gerado' : 'Validade do convite'}</Text>
            <Text style={styles.infoValue}>{sent ? `Até ${formatExpiry(sent.expires_at)}` : '48 horas'}</Text>
            <Text style={styles.infoBody}>
              {sent
                ? `Convite gerado para ${sent.email}. Compartilhe o código abaixo com a pessoa.`
                : 'O código de convite gerado é válido por 48 horas.'}
            </Text>
          </LinearGradient>

          {Boolean(sentCode) && (
            <View style={styles.shareCard}>
              <Text style={styles.shareTitle}>Código de convite</Text>
              <Text style={styles.shareSubtitle}>
                A pessoa deve inserir este código no app Koin na opção {`"Tenho um convite"`}:
              </Text>

              <View style={styles.codeContainer}>
                <Text selectable style={styles.codeText}>{sentCode}</Text>
              </View>

              <View style={styles.shareButtonsRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Copiar código de convite"
                  onPress={handleCopy}
                  style={({ pressed }) => [styles.copyActionButton, pressed && styles.pressed]}
                >
                  <Feather
                    name={copied ? 'check' : 'copy'}
                    size={16}
                    color={copied ? '#4ade80' : darkTheme.accent}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.copyActionText, copied && { color: '#4ade80' }]}>
                    {copied ? 'Código copiado!' : 'Copiar código'}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Compartilhar código de convite"
                  onPress={handleShare}
                  style={({ pressed }) => [styles.shareActionButton, pressed && styles.pressed]}
                >
                  <Feather name="share-2" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.shareActionText}>Compartilhar</Text>
                </Pressable>
              </View>
            </View>
          )}
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
  shareCard: {
    backgroundColor: '#130d24',
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#3b1d6e',
  },
  shareTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: darkTheme.text,
    marginBottom: 4,
  },
  shareSubtitle: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  codeContainer: {
    backgroundColor: '#0c0717',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4c1d95',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#c084fc',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  shareButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shareActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  shareActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  copyActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  copyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.accent,
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
