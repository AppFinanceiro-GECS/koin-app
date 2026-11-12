import Feather from '@expo/vector-icons/Feather'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
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

import { invalidateCreditCardQueries, linkedDataFromError } from '@/lib/creditCards'
import { getApiErrorMessage } from '@/lib/errors'
import { formatCurrency, parseAmount } from '@/lib/format'
import { cardBrands } from '@/schemas/creditCard.schema'
import { HouseCardToggle } from '@/components/family/HouseCardToggle'
import { creditCardsApi } from '@/services/accounts.api'
import { darkTheme } from '@/theme/colors'
import type { CreditCardDetail, CreditCardWrite } from '@/types/api'

/** "8000", "8.000", "8.000,50" e "8000,50" viram número; o resto, NaN */
function parseLimit(input: string): number {
  const trimmed = input.trim()
  if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) return Number(trimmed.replace(/\./g, ''))
  return parseAmount(trimmed)
}

function limitToInput(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',')
}

function parseDay(input: string): number | null {
  const day = Number(input)
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null
}

function ModalHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Feather name="chevron-left" size={24} color={darkTheme.text} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  )
}

export default function CreditCardModal() {
  // id: edita um cartão; sem id, os demais campos pré-preenchem um cartão novo (ex.: lido da fatura)
  const params = useLocalSearchParams<{
    id?: string
    name?: string
    digits?: string
    brand?: string
    limit?: string
    closingDay?: string
    dueDay?: string
  }>()
  const parsedId = params.id ? Number(params.id) : NaN
  const cardId = Number.isNaN(parsedId) ? null : parsedId

  const cardQuery = useQuery({
    queryKey: ['credit-card', cardId],
    queryFn: async () => (await creditCardsApi.get(cardId as number)).data,
    enabled: cardId !== null,
  })

  if (cardId !== null && !cardQuery.data) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <ModalHeader title="Editar cartão" />
        <View style={styles.centered}>
          {cardQuery.isError ? (
            <>
              <Text style={styles.subtitle}>
                {getApiErrorMessage(cardQuery.error, 'Não foi possível carregar o cartão.')}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => cardQuery.refetch()}
                style={({ pressed }) => [styles.secondaryButton, styles.retryButton, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryButtonText}>Tentar de novo</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator size="large" color={darkTheme.primary} />
          )}
        </View>
      </SafeAreaView>
    )
  }

  // key: o formulário nasce com os dados reais do cartão (sem efeito copiando para o estado)
  return (
    <CreditCardForm
      key={cardQuery.data?.id ?? 'novo'}
      cardId={cardId}
      card={cardQuery.data}
      prefill={cardId === null ? params : undefined}
      refetchCard={async () => {
        await cardQuery.refetch()
      }}
    />
  )
}

function CreditCardForm({
  cardId,
  card,
  prefill,
  refetchCard,
}: {
  cardId: number | null
  card: CreditCardDetail | undefined
  prefill?: { name?: string; digits?: string; brand?: string; limit?: string; closingDay?: string; dueDay?: string }
  refetchCard: () => Promise<void>
}) {
  const isEditing = cardId !== null
  const queryClient = useQueryClient()

  const [name, setName] = useState(card?.nickname || card?.account_name || prefill?.name || '')
  const [digits, setDigits] = useState(card?.last_four_digits || prefill?.digits || '')
  const [brand, setBrand] = useState<string | null>(card?.card_brand ?? prefill?.brand ?? null)
  const [limit, setLimit] = useState(
    card ? limitToInput(Number(card.credit_limit) || 0) : prefill?.limit ? limitToInput(Number(prefill.limit) || 0) : ''
  )
  const [closingDay, setClosingDay] = useState(card ? String(card.closing_day) : prefill?.closingDay || '')
  const [dueDay, setDueDay] = useState(card ? String(card.due_day) : prefill?.dueDay || '')
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)

  const parsedLimit = parseLimit(limit)
  const limitIsValid = !Number.isNaN(parsedLimit) && parsedLimit > 0

  const validate = (): string | null => {
    if (!name.trim()) return 'Informe o nome do cartão.'
    if (digits && digits.length !== 4) return 'O final do cartão precisa ter 4 dígitos, ou deixe em branco.'
    if (!limitIsValid) return 'Informe o limite total do cartão, por exemplo 5000 ou 5.000,00.'
    if (parseDay(closingDay) === null) return 'O dia de fechamento precisa estar entre 1 e 31.'
    if (parseDay(dueDay) === null) return 'O dia de vencimento precisa estar entre 1 e 31.'
    return null
  }

  const handleSave = async () => {
    const problem = validate()
    if (problem) {
      Alert.alert('Confira os dados', problem)
      return
    }

    const payload: CreditCardWrite = {
      name: name.trim(),
      nickname: name.trim(),
      credit_limit: parsedLimit,
      closing_day: parseDay(closingDay) as number,
      due_day: parseDay(dueDay) as number,
      last_four_digits: digits || null,
      card_brand: brand,
    }

    setSaving(true)
    try {
      if (isEditing) {
        await creditCardsApi.update(cardId as number, payload)
      } else {
        await creditCardsApi.create(payload)
      }
      await invalidateCreditCardQueries(queryClient)
      router.back()
    } catch (err) {
      Alert.alert('Não foi possível salvar', getApiErrorMessage(err, 'Tente de novo em instantes.'))
    } finally {
      setSaving(false)
    }
  }

  const finishRemoval = async (message: string) => {
    await invalidateCreditCardQueries(queryClient)
    queryClient.removeQueries({ queryKey: ['credit-card', cardId] })
    router.back()
    Alert.alert('Pronto', message)
  }

  const setActive = async (active: boolean) => {
    setBusy(true)
    try {
      await creditCardsApi.update(cardId as number, { is_active: active })
      if (active) {
        await invalidateCreditCardQueries(queryClient)
        await refetchCard()
      } else {
        await finishRemoval('Cartão desativado. O histórico continua salvo e você pode reativá-lo quando quiser.')
      }
    } catch (err) {
      Alert.alert('Não foi possível alterar o cartão', getApiErrorMessage(err, 'Tente de novo em instantes.'))
    } finally {
      setBusy(false)
    }
  }

  const deleteCard = async (force: boolean) => {
    setBusy(true)
    try {
      await creditCardsApi.delete(cardId as number, { force })
      await finishRemoval('Cartão excluído.')
    } catch (err) {
      const linked = linkedDataFromError(err)
      if (linked && !force) {
        const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
          { text: 'Cancelar', style: 'cancel' },
        ]
        if (card?.is_active !== false) {
          buttons.push({ text: 'Desativar', onPress: () => setActive(false) })
        }
        buttons.push({ text: 'Excluir tudo', style: 'destructive', onPress: () => deleteCard(true) })
        Alert.alert('O cartão tem dados vinculados', linked.message, buttons)
      } else {
        Alert.alert('Não foi possível excluir', getApiErrorMessage(err, 'Tente de novo em instantes.'))
      }
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = () => {
    const label = name.trim() || 'este cartão'
    Alert.alert('Excluir cartão?', `"${label}" e a conta dele no Koin serão removidos. Essa ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteCard(false) },
    ])
  }

  const confirmRemovePassword = () => {
    Alert.alert('Remover senha salva?', 'Na próxima fatura em PDF protegida, o Koin vai pedir a senha de novo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await creditCardsApi.deleteInvoicePassword(cardId as number)
            await refetchCard()
            await queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
          } catch (err) {
            Alert.alert('Não foi possível remover', getApiErrorMessage(err, 'Tente de novo em instantes.'))
          }
        },
      },
    ])
  }

  const inactive = isEditing && card?.is_active === false

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoid}>
        <ModalHeader title={isEditing ? 'Editar cartão' : 'Novo cartão'} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {inactive && (
            <View style={styles.inactiveBanner}>
              <Feather name="pause-circle" size={18} color={darkTheme.warning} />
              <Text style={styles.inactiveText}>
                Cartão desativado: não aparece para novos lançamentos, mas o histórico continua salvo.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reativar cartão"
                disabled={busy}
                onPress={() => setActive(true)}
                style={({ pressed }) => [styles.inactiveAction, pressed && styles.pressed]}
              >
                <Text style={styles.inactiveActionText}>Reativar</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.subtitle}>
            Use apenas os quatro últimos dígitos. Não informe número completo, CVV ou senha bancária.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nome do cartão</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              maxLength={50}
              placeholder="Ex: Nubank, Inter..."
              placeholderTextColor={darkTheme.textMuted}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Final do cartão (opcional)</Text>
            <TextInput
              style={styles.input}
              value={digits}
              onChangeText={(t) => setDigits(t.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="0000"
              placeholderTextColor={darkTheme.textMuted}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Bandeira (opcional)</Text>
            <View style={styles.chipsRow}>
              {cardBrands.map((item) => {
                const active = brand === item
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setBrand(active ? null : item)}
                    style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  >
                    <Text style={[styles.chipLabel, active ? styles.chipLabelActive : styles.chipLabelInactive]}>
                      {item}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Limite total</Text>
            <TextInput
              style={styles.input}
              value={limit}
              onChangeText={setLimit}
              keyboardType="decimal-pad"
              placeholder="5.000,00"
              placeholderTextColor={darkTheme.textMuted}
            />
            <Text style={[styles.fieldHint, limit && !limitIsValid && styles.fieldHintError]}>
              {limit && !limitIsValid ? 'Valor inválido' : `Limite de ${formatCurrency(limitIsValid ? parsedLimit : 0)}`}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Dia do fechamento</Text>
                <TextInput
                  style={styles.dayInput}
                  value={closingDay}
                  onChangeText={(t) => setClosingDay(t.replace(/\D/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="Ex: 24"
                  placeholderTextColor={darkTheme.textMuted}
                />
              </View>

              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Dia do vencimento</Text>
                <TextInput
                  style={styles.dayInput}
                  value={dueDay}
                  onChangeText={(t) => setDueDay(t.replace(/\D/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="Ex: 4"
                  placeholderTextColor={darkTheme.textMuted}
                />
              </View>
            </View>

            <Text style={styles.infoCardSubtext}>
              Essas datas definem o período da fatura. Compras após o fechamento entram na próxima fatura.
            </Text>
          </View>

          {isEditing && card && <HouseCardToggle card={card} />}

          {isEditing && card?.has_invoice_password && (
            <View style={styles.passwordRow}>
              <Feather name="lock" size={16} color={darkTheme.textSecondary} />
              <Text style={styles.passwordText}>Senha do PDF da fatura salva</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remover senha salva da fatura"
                onPress={confirmRemovePassword}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.linkDanger}>Remover</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.footerNote}>
            A conta usada para pagar a fatura é escolhida na hora do pagamento.
          </Text>

          {isEditing && (
            <View style={styles.dangerZone}>
              {!inactive && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Desativar cartão"
                  disabled={busy}
                  onPress={() =>
                    Alert.alert(
                      'Desativar cartão?',
                      'Ele some das listas de novos lançamentos, mas faturas e histórico continuam salvos.',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Desativar', onPress: () => setActive(false) },
                      ]
                    )
                  }
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryButtonText}>Desativar cartão</Text>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Excluir cartão"
                disabled={busy}
                onPress={confirmDelete}
                style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={darkTheme.error} />
                ) : (
                  <>
                    <Feather name="trash-2" size={16} color={darkTheme.error} />
                    <Text style={styles.dangerButtonText}>Excluir cartão</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Salvar cartão"
            onPress={handleSave}
            disabled={saving || busy}
            style={({ pressed }) => [styles.primaryButton, (saving || busy) && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>
              {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar cartão'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
  },
  headerSpacer: {
    width: 44,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  inactiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surfaceSecondary,
  },
  inactiveText: {
    flex: 1,
    fontSize: 13,
    color: darkTheme.textSecondary,
    lineHeight: 18,
  },
  inactiveAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: darkTheme.primary,
  },
  inactiveActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    lineHeight: 20,
    textAlign: 'left',
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: darkTheme.textSecondary,
  },
  fieldHint: {
    fontSize: 12,
    color: darkTheme.textMuted,
    paddingTop: 2,
  },
  fieldHintError: {
    color: darkTheme.error,
  },
  input: {
    height: 48,
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: darkTheme.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.19)',
    borderWidth: 1,
    borderColor: darkTheme.primary,
  },
  chipInactive: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  chipLabel: {
    fontSize: 13,
  },
  chipLabelActive: {
    color: darkTheme.accent,
    fontWeight: '600',
  },
  chipLabelInactive: {
    color: darkTheme.textSecondary,
  },
  infoCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateCol: {
    flex: 1,
    gap: 6,
  },
  dateLabel: {
    fontSize: 13,
    color: darkTheme.textSecondary,
  },
  dayInput: {
    height: 44,
    backgroundColor: darkTheme.surfaceSecondary,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: darkTheme.accent,
    fontWeight: '600',
  },
  infoCardSubtext: {
    fontSize: 12,
    color: darkTheme.textMuted,
    lineHeight: 16,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
  },
  passwordText: {
    flex: 1,
    fontSize: 14,
    color: darkTheme.text,
  },
  linkDanger: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.error,
  },
  footerNote: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    lineHeight: 18,
  },
  dangerZone: {
    gap: 10,
    paddingTop: 8,
  },
  dangerButton: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: darkTheme.errorBorder,
    backgroundColor: darkTheme.errorBackground,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: darkTheme.error,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: darkTheme.border,
    backgroundColor: darkTheme.background,
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: darkTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: darkTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: darkTheme.text,
  },
})
