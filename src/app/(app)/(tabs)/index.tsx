import Feather from '@expo/vector-icons/Feather'
import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { formatCurrency } from '@/lib/format'
import { accountsApi } from '@/services/accounts.api'
import { analyticsApi } from '@/services/analytics.api'
import { notificationsApi } from '@/services/settings.api'
import { darkTheme } from '@/theme/colors'

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

export default function DashboardScreen() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const monthName = MONTH_NAMES[now.getMonth()]

  const [filterMode, setFilterMode] = useState<'me' | 'family'>('me')

  const summaryQuery = useQuery({
    queryKey: ['analytics', 'summary', currentYear, currentMonth],
    queryFn: async () => (await analyticsApi.summary(currentYear, currentMonth)).data,
  })

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await accountsApi.list()).data,
  })

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => (await notificationsApi.getUnreadCount()).data,
  })
  const unreadCount = notificationsQuery.data?.unread_count ?? 2

  const refreshing = summaryQuery.isRefetching || accountsQuery.isRefetching || notificationsQuery.isRefetching
  const onRefresh = () => {
    summaryQuery.refetch()
    accountsQuery.refetch()
    notificationsQuery.refetch()
  }

  const s = summaryQuery.data
  const totalExpense = s?.total_expense ?? 3240
  const totalIncome = s?.total_income ?? 6500
  const balance = s?.balance ?? 3260

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Barra superior */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Início</Text>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={() => router.push('/transactions')}
          >
            <Feather name="search" size={20} color={darkTheme.text} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificações"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={async () => {
              try {
                const list = (await notificationsApi.list({ limit: 5 })).data
                if (Array.isArray(list) && list.length > 0) {
                  Alert.alert(
                    'Notificações',
                    list.map((n: any) => `• ${n.title || n.message || 'Alerta'}`).join('\n\n')
                  )
                } else {
                  Alert.alert('Notificações', 'Você não possui notificações pendentes.')
                }
              } catch {
                Alert.alert('Notificações', 'Você possui alertas pendentes.')
              }
            }}
          >
            <Feather name="bell" size={20} color={darkTheme.text} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={darkTheme.accent}
            colors={[darkTheme.primary]}
          />
        }
      >
        {/* Tabs / Filter Chips */}
        <View style={styles.chipRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtrar por Só eu"
            onPress={() => setFilterMode('me')}
            style={[styles.chip, filterMode === 'me' ? styles.chipActive : styles.chipInactive]}
          >
            <Text
              style={[
                styles.chipLabel,
                filterMode === 'me' ? styles.chipLabelActive : styles.chipLabelInactive,
              ]}
            >
              Só eu
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtrar por Família"
            onPress={() => setFilterMode('family')}
            style={[styles.chip, filterMode === 'family' ? styles.chipActive : styles.chipInactive]}
          >
            <Text
              style={[
                styles.chipLabel,
                filterMode === 'family' ? styles.chipLabelActive : styles.chipLabelInactive,
              ]}
            >
              Família
            </Text>
          </Pressable>
        </View>

        {/* Alertas Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Alertas</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver todos os alertas"
            onPress={() => Alert.alert('Alertas', 'Exibindo todos os alertas')}
          >
            <Text style={styles.viewAllText}>Ver todos</Text>
          </Pressable>
        </View>

        <View style={styles.alertsContainer}>
          {/* Alerta 1 */}
          <View style={styles.alertCard}>
            <View style={styles.alertIconWrapper}>
              <Feather name="calendar" size={16} color={darkTheme.accent} />
            </View>
            <View style={styles.alertMessageWrapper}>
              <Text style={styles.alertTitle}>Nubank vence em 3 dias</Text>
              <Text style={styles.alertSubtitle}>R$ 2.380,00 em 04/10</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver alerta Nubank"
              onPress={() => router.push('/accounts')}
              style={({ pressed }) => [styles.alertActionPill, pressed && styles.buttonPressed]}
            >
              <Text style={styles.alertActionText}>Ver</Text>
            </Pressable>
          </View>

          {/* Alerta 2 */}
          <View style={styles.alertCard}>
            <View style={styles.alertIconWrapper}>
              <Feather name="file-text" size={16} color={darkTheme.accent} />
            </View>
            <View style={styles.alertMessageWrapper}>
              <Text style={styles.alertTitle}>Fatura Inter não chegou</Text>
              <Text style={styles.alertSubtitle}>Fechou em 28/09. Envie o PDF.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar PDF Inter"
              onPress={() => router.push('/profile')}
              style={({ pressed }) => [styles.alertActionPill, pressed && styles.buttonPressed]}
            >
              <Text style={styles.alertActionText}>Enviar</Text>
            </Pressable>
          </View>
        </View>

        {/* Cartão-resumo */}
        <LinearGradient
          colors={['#0f0b1e', '#1f0c3b', '#0a0414']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryMonth}>Despesas de {monthName}</Text>
          <Text style={styles.summaryTotal}>{formatCurrency(totalExpense)}</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryColumnLabel}>Receitas</Text>
              <Text style={styles.incomeValue}>{formatCurrency(totalIncome)}</Text>
            </View>

            <View style={styles.summaryColumn}>
              <Text style={styles.summaryColumnLabel}>Sobrou</Text>
              <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
            </View>
          </View>

          <Text style={styles.summaryNote}>Pagamentos de fatura ficam fora deste total.</Text>
        </LinearGradient>

        {/* Faturas Card */}
        <View style={styles.invoicesCard}>
          {/* Linha 1: Nubank */}
          <View style={styles.invoiceItem}>
            <View style={styles.invoiceIconWrapper}>
              <Feather name="credit-card" size={18} color={darkTheme.accent} />
            </View>
            <View style={styles.invoiceInfo}>
              <Text style={styles.invoiceTitle}>Nubank</Text>
              <Text style={styles.invoiceSubtitle}>Outubro • vence 04/10 • Fechada</Text>
            </View>
            <Text style={styles.invoiceAmount}>R$ 2.380,00</Text>
          </View>

          <View style={styles.invoiceDivider} />

          {/* Linha 2: Inter */}
          <View style={styles.invoiceItem}>
            <View style={styles.invoiceIconWrapper}>
              <Feather name="credit-card" size={18} color={darkTheme.accent} />
            </View>
            <View style={styles.invoiceInfo}>
              <Text style={styles.invoiceTitle}>Inter</Text>
              <Text style={styles.invoiceSubtitle}>Outubro • aguardando PDF • Estimada</Text>
            </View>
            <Text style={styles.invoiceAmount}>R$ 1.150,40</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.3,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  buttonPressed: {
    opacity: 0.75,
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: darkTheme.primary,
    borderWidth: 2,
    borderColor: darkTheme.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 16,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 12,
    fontWeight: '500',
  },
  chipLabelActive: {
    color: darkTheme.accent,
  },
  chipLabelInactive: {
    color: darkTheme.textSecondary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: darkTheme.text,
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 13,
    color: darkTheme.accent,
    fontWeight: '400',
  },
  alertsContainer: {
    gap: 8,
  },
  alertCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertMessageWrapper: {
    flex: 1,
    gap: 3,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  alertSubtitle: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  alertActionPill: {
    backgroundColor: 'rgba(124, 58, 237, 0.19)',
    borderWidth: 1,
    borderColor: darkTheme.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  alertActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: darkTheme.accent,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  summaryMonth: {
    fontSize: 13,
    color: darkTheme.textSecondary,
  },
  summaryTotal: {
    fontSize: 32,
    fontWeight: '600',
    color: darkTheme.text,
    letterSpacing: -0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  summaryColumn: {
    flex: 1,
    gap: 3,
  },
  summaryColumnLabel: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  incomeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.success,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
  },
  summaryNote: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  invoicesCard: {
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  invoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  invoiceIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceInfo: {
    flex: 1,
    gap: 3,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  invoiceSubtitle: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: darkTheme.border,
  },
})
