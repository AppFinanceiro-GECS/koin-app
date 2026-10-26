import Feather from '@expo/vector-icons/Feather'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
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

import { formatCurrency, parseAmount } from '@/lib/format'
import { darkTheme } from '@/theme/colors'

const LINKED_ACCOUNTS = ['Sem vínculo', 'Conta Itaú', 'Conta Inter']

export default function CreditCardModal() {
  const params = useLocalSearchParams<{
    id?: string
    name?: string
    digits?: string
    limit?: string
    closingDay?: string
    dueDay?: string
  }>()
  const isEditing = Boolean(params.id)

  const [name, setName] = useState(params.name || (isEditing ? 'Nubank' : ''))
  const [digits, setDigits] = useState(params.digits || (isEditing ? '4821' : ''))
  const [linkedAccount, setLinkedAccount] = useState('Sem vínculo')
  const [limit, setLimit] = useState(params.limit || (isEditing ? '8000' : '5000'))
  const [closingDay, setClosingDay] = useState(params.closingDay || '24')
  const [dueDay, setDueDay] = useState(params.dueDay || '04')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Informe o nome do cartão.')
      return
    }
    if (digits.trim().length !== 4) {
      Alert.alert('Erro', 'Informe os 4 últimos dígitos do cartão.')
      return
    }

    setLoading(true)
    try {
      Alert.alert(
        'Sucesso',
        isEditing ? 'Cartão atualizado com sucesso!' : 'Cartão cadastrado com sucesso!',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } finally {
      setLoading(false)
    }
  }

  const parsedLimit = parseAmount(limit)
  const displayLimit = isNaN(parsedLimit) ? 0 : parsedLimit

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
          <Text style={styles.headerTitle}>Cartão de crédito</Text>
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
                {isEditing ? `Edição · ${name || 'Nubank'}` : 'Novo cartão'}
              </Text>
            </View>
          </View>

          {/* Orientação */}
          <Text style={styles.subtitle}>
            Use apenas os quatro últimos dígitos. Não informe número completo, CVV ou senha bancária.
          </Text>

          {/* Campo: Nome */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nome do cartão</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Nubank, Inter..."
              placeholderTextColor={darkTheme.textMuted}
            />
          </View>

          {/* Campo: Final do cartão */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Final do cartão</Text>
            <TextInput
              style={styles.input}
              value={digits}
              onChangeText={(t) => setDigits(t.replace(/\D/g, '').slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              placeholder="4821"
              placeholderTextColor={darkTheme.textMuted}
            />
          </View>

          {/* Campo: Conta vinculada */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Conta vinculada (opcional)</Text>
            <View style={styles.chipsRow}>
              {LINKED_ACCOUNTS.map((acc) => {
                const active = linkedAccount === acc
                return (
                  <Pressable
                    key={acc}
                    onPress={() => setLinkedAccount(acc)}
                    style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  >
                    <Text style={[styles.chipLabel, active ? styles.chipLabelActive : styles.chipLabelInactive]}>
                      {acc}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Campo: Limite total */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Limite total</Text>
            <TextInput
              style={styles.input}
              value={limit}
              onChangeText={setLimit}
              keyboardType="numeric"
              placeholder="8000"
              placeholderTextColor={darkTheme.textMuted}
            />
            <Text style={styles.fieldHint}>
              Limite de {formatCurrency(displayLimit)}
            </Text>
          </View>

          {/* Grupo de informações: Datas da fatura */}
          <View style={styles.infoCard}>
            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Fechamento</Text>
                <TextInput
                  style={styles.dayInput}
                  value={closingDay}
                  onChangeText={(t) => setClosingDay(t.replace(/\D/g, '').slice(0, 2))}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="24"
                  placeholderTextColor={darkTheme.textMuted}
                />
              </View>

              <View style={styles.dateCol}>
                <Text style={styles.dateLabel}>Vencimento</Text>
                <TextInput
                  style={styles.dayInput}
                  value={dueDay}
                  onChangeText={(t) => setDueDay(t.replace(/\D/g, '').slice(0, 2))}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="04"
                  placeholderTextColor={darkTheme.textMuted}
                />
              </View>
            </View>

            <Text style={styles.infoCardSubtext}>
              Essas datas definem o período da fatura. Compras após o fechamento entram na próxima fatura.
            </Text>
          </View>

          <Text style={styles.footerNote}>
            A conta usada para registrar pagamentos é escolhida no momento do pagamento, não neste vínculo.
          </Text>
        </ScrollView>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Salvar cartão"
            onPress={handleSave}
            disabled={loading}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Salvando...' : 'Salvar cartão'}
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
  footerNote: {
    fontSize: 13,
    color: darkTheme.textSecondary,
    lineHeight: 18,
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

