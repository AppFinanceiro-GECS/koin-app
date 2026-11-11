import Feather from '@expo/vector-icons/Feather'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import {
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

import { familyDisplayName, memberFirstName } from '@/lib/family'
import { formatCurrency, parseAmount } from '@/lib/format'
import { accountsApi } from '@/services/accounts.api'
import { familyApi } from '@/services/settings.api'
import { darkTheme } from '@/theme/colors'

const ACCOUNT_TYPES = [
  { label: 'Conta corrente', value: 'bank' },
  { label: 'Carteira', value: 'wallet' },
  { label: 'Investimento', value: 'investment' },
  { label: 'Cartão benefício', value: 'benefit_card' },
]

export default function AccountModal() {
  const queryClient = useQueryClient()
  const params = useLocalSearchParams<{
    id?: string
    name?: string
    balance?: string
    type?: string
    ownership_type?: string
  }>()
  const isEditing = Boolean(params.id)

  const [name, setName] = useState(params.name || (isEditing ? 'Conta' : ''))
  const [type, setType] = useState(params.type || 'bank')
  const [balance, setBalance] = useState(params.balance || '0')
  const [isShared, setIsShared] = useState(
    params.ownership_type === 'household' || params.ownership_type === 'family'
  )
  const [loading, setLoading] = useState(false)

  const familyQuery = useQuery({
    queryKey: ['family', 'context'],
    queryFn: async () => (await familyApi.getContext()).data,
    retry: false,
  })

  const family = familyQuery.data
  const hasFamily = Boolean(family && family.members && family.members.length > 0)

  const familySubtitle = useMemo(() => {
    if (!family || !family.members || family.members.length === 0) return ''
    const familyName = familyDisplayName(family.members)
    const memberNames = family.members.map(memberFirstName).filter(Boolean)
    if (memberNames.length === 0) return familyName
    if (memberNames.length === 1) {
      return `${familyName} · ${memberNames[0]} vê o que foi compartilhado.`
    }
    const namesList = `${memberNames.slice(0, -1).join(', ')} e ${memberNames[memberNames.length - 1]}`
    return `${familyName} · ${namesList} veem o que foi compartilhado.`
  }, [family])

  const parsedBal = parseAmount(balance)
  const displayBal = isNaN(parsedBal) ? 0 : parsedBal

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Informe o nome da conta.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        type,
        balance: displayBal,
        ownership_type: hasFamily && isShared ? 'household' : 'personal',
      }
      if (isEditing && params.id) {
        await accountsApi.update(Number(params.id), payload)
      } else {
        await accountsApi.create(payload)
      }
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
      Alert.alert(
        'Sucesso',
        isEditing ? 'Conta atualizada com sucesso!' : 'Conta cadastrada com sucesso!',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (err) {
      console.warn('Erro ao salvar conta:', err)
      Alert.alert('Erro', 'Não foi possível salvar a conta na API.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Feather name="chevron-left" size={24} color={darkTheme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Conta financeira</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Badge de status */}
          <View style={styles.badgeWrapper}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {isEditing ? `Edição · ${name || 'Conta'}` : 'Nova conta'}
              </Text>
            </View>
          </View>

          {/* Título e Orientação */}
          <View style={styles.titleGroup}>
            <Text style={styles.title}>Organize seus saldos</Text>
            <Text style={styles.subtitle}>
              Cadastre uma conta para registrar entradas e saídas. Não conecta nem abre uma conta no banco.
            </Text>
          </View>

          {/* Campo: Nome da conta */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nome da conta</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Conta Itaú, Carteira..."
              placeholderTextColor={darkTheme.textMuted}
            />
          </View>

          {/* Campo: Tipo */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tipo de conta</Text>
            <View style={styles.typeRow}>
              {ACCOUNT_TYPES.map((t) => {
                const active = type === t.value
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setType(t.value)}
                    style={[styles.typeChip, active ? styles.typeChipActive : styles.typeChipInactive]}
                  >
                    <Text
                      style={[
                        styles.typeChipLabel,
                        active ? styles.typeChipLabelActive : styles.typeChipLabelInactive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Campo: Saldo inicial */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Saldo inicial registrado</Text>
            <TextInput
              style={styles.input}
              value={balance}
              onChangeText={setBalance}
              keyboardType="numeric"
              placeholder="0,00"
              placeholderTextColor={darkTheme.textMuted}
            />
            <Text style={styles.fieldHint}>
              Equivale a {formatCurrency(displayBal)}
            </Text>
          </View>

          {/* Card: Fonte de liquidez permitida */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Fonte de liquidez permitida</Text>
            <Text style={styles.infoCardText}>
              O tipo {ACCOUNT_TYPES.find((t) => t.value === type)?.label} permite usar esta conta como origem de pagamentos e transferências.
            </Text>
            <Text style={styles.infoCardSubtext}>
              A elegibilidade é definida pelo tipo da conta. Não basta ser apenas um saldo.
            </Text>
          </View>

          {/* Card: Compartilhar com a família (apenas se pertencer a uma família) */}
          {hasFamily && (
            <Pressable
              onPress={() => setIsShared(!isShared)}
              style={styles.infoCard}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isShared }}
              accessibilityLabel="Compartilhar com a família"
            >
              <View style={styles.switchRow}>
                <View style={styles.switchTextCol}>
                  <Text style={styles.infoCardTitle}>Compartilhar com a família</Text>
                  <Text style={styles.infoCardText}>{familySubtitle}</Text>
                </View>
                <View style={[styles.checkbox, isShared && styles.checkboxActive]}>
                  {isShared && <Feather name="check" size={14} color="#ffffff" />}
                </View>
              </View>
            </Pressable>
          )}
        </ScrollView>

        {/* Rodapé com botões de ação */}
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Salvar conta"
            onPress={handleSave}
            disabled={loading}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Salvando...' : 'Salvar conta'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  badgeWrapper: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: darkTheme.surfaceSecondary,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    color: darkTheme.accent,
    fontWeight: '500',
  },
  titleGroup: {
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: darkTheme.textSecondary,
    lineHeight: 20,
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
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  typeChipActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.19)',
    borderWidth: 1,
    borderColor: darkTheme.primary,
  },
  typeChipInactive: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  typeChipLabel: {
    fontSize: 13,
  },
  typeChipLabelActive: {
    color: darkTheme.accent,
    fontWeight: '600',
  },
  typeChipLabelInactive: {
    color: darkTheme.textSecondary,
  },
  infoCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  infoCardText: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    lineHeight: 18,
  },
  infoCardSubtext: {
    fontSize: 12,
    color: darkTheme.textMuted,
    lineHeight: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchTextCol: {
    flex: 1,
    gap: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: darkTheme.primary,
    borderColor: darkTheme.primary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 10,
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
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: darkTheme.text,
  },
})

