import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'

import { InstallmentRow } from '@/components/installments/InstallmentRow'
import { MonthlyForecast } from '@/components/installments/MonthlyForecast'
import { darkTheme } from '@/theme/colors'
import type { InstallmentSeriesResponse } from '@/types/installment'

type StatusFilter = 'active' | 'completed' | null

const MOCK_DATA: InstallmentSeriesResponse[] = [
  {
    id: 1,
    description: 'Notebook Dell',
    merchant_name: 'Eletrônicos Brasil',
    total_amount: 2400,
    installment_amount: 200,
    installment_count: 12,
    paid_count: 5,
    remaining_count: 7,
    remaining_amount: 1400,
    first_installment_date: '2024-11-15',
    purchase_date: '2024-11-15',
    account_id: 1,
    category_id: 5,
    first_transaction_id: 101,
    status: 'active',
    created_at: '2024-11-15T10:00:00Z',
    updated_at: '2024-11-15T10:00:00Z',
  },
  {
    id: 2,
    description: 'Monitor 27"',
    merchant_name: 'Tech Store',
    total_amount: 1800,
    installment_amount: 300,
    installment_count: 6,
    paid_count: 2,
    remaining_count: 4,
    remaining_amount: 1200,
    first_installment_date: '2024-11-20',
    purchase_date: '2024-11-20',
    account_id: 1,
    category_id: 5,
    first_transaction_id: 102,
    status: 'active',
    created_at: '2024-11-20T10:00:00Z',
    updated_at: '2024-11-20T10:00:00Z',
  },
  {
    id: 3,
    description: 'Geladeira',
    merchant_name: 'Brastemp',
    total_amount: 3200,
    installment_amount: 320,
    installment_count: 10,
    paid_count: 3,
    remaining_count: 7,
    remaining_amount: 2240,
    first_installment_date: '2024-11-10',
    purchase_date: '2024-11-10',
    account_id: 1,
    category_id: 6,
    first_transaction_id: 103,
    status: 'active',
    created_at: '2024-11-10T10:00:00Z',
    updated_at: '2024-11-15T10:00:00Z',
  },
  {
    id: 4,
    description: 'Fone de ouvido',
    merchant_name: 'Audio Pro',
    total_amount: 600,
    installment_amount: 200,
    installment_count: 3,
    paid_count: 0,
    remaining_count: 3,
    remaining_amount: 600,
    first_installment_date: '2024-11-25',
    purchase_date: '2024-11-25',
    account_id: 1,
    category_id: 7,
    first_transaction_id: 104,
    status: 'active',
    created_at: '2024-11-25T10:00:00Z',
    updated_at: '2024-11-25T10:00:00Z',
  },
  {
    id: 5,
    description: 'Teclado Mecânico',
    merchant_name: 'Periféricos Tech',
    total_amount: 800,
    installment_amount: 200,
    installment_count: 4,
    paid_count: 4,
    remaining_count: 0,
    remaining_amount: 0,
    first_installment_date: '2024-09-10',
    purchase_date: '2024-09-10',
    account_id: 1,
    category_id: 5,
    first_transaction_id: 105,
    status: 'completed',
    created_at: '2024-09-10T10:00:00Z',
    updated_at: '2024-10-10T10:00:00Z',
  },
  {
    id: 6,
    description: 'Mouse Gamer',
    merchant_name: 'Periféricos Tech',
    total_amount: 450,
    installment_amount: 150,
    installment_count: 3,
    paid_count: 3,
    remaining_count: 0,
    remaining_amount: 0,
    first_installment_date: '2024-08-15',
    purchase_date: '2024-08-15',
    account_id: 1,
    category_id: 7,
    first_transaction_id: 106,
    status: 'completed',
    created_at: '2024-08-15T10:00:00Z',
    updated_at: '2024-09-15T10:00:00Z',
  },
  {
    id: 7,
    description: 'Webcam HD',
    merchant_name: 'Tech Store',
    total_amount: 350,
    installment_amount: 175,
    installment_count: 2,
    paid_count: 2,
    remaining_count: 0,
    remaining_amount: 0,
    first_installment_date: '2024-07-20',
    purchase_date: '2024-07-20',
    account_id: 1,
    category_id: 5,
    first_transaction_id: 107,
    status: 'completed',
    created_at: '2024-07-20T10:00:00Z',
    updated_at: '2024-08-20T10:00:00Z',
  },
]

export default function InstallmentsScreen() {
  const insets = useSafeAreaInsets()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')

  let series = MOCK_DATA
  const isLoading = false

  if (statusFilter) {
    series = MOCK_DATA.filter((item) => item.status === statusFilter)
  }

  const handleFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter)
  }

  const handleSeriesPress = (seriesId: number) => {
    router.push(`/installments/${seriesId}`)
  }

  const currentMonth = 'novembro'
  const totalMonthly = series.reduce((sum, item) => sum + item.installment_amount, 0)
  const activeCount = MOCK_DATA.filter((item) => item.status === 'active').length
  const completedCount = MOCK_DATA.filter((item) => item.status === 'completed').length

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={24} color={darkTheme.text} />
        </Pressable>
        <Text style={styles.title}>Parcelamentos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={darkTheme.primary} />
        </View>
      ) : !series || series.length === 0 ? (
        <View style={styles.centerContent}>
          <Feather name="inbox" size={48} color={darkTheme.textMuted} />
          <Text style={styles.emptyText}>Nenhum parcelamento</Text>
        </View>
      ) : (
        <FlatList
          data={series}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <InstallmentRow series={item} onPress={() => handleSeriesPress(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Summary Card */}
              <LinearGradient
                colors={['#0f0b1e', '#1f0c3b', '#0a0414']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCard}
              >
                <Text style={styles.summaryLabel}>Compromido com parcelas</Text>
                <Text style={styles.summaryAmount}>
                  R$ {totalMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.summaryMonth}>em {currentMonth}</Text>
              </LinearGradient>

              {/* Monthly Forecast */}
              <MonthlyForecast />

              {/* Filters */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContainer}
                scrollEventThrottle={16}
                pointerEvents="box-none"
              >
                <View pointerEvents="box-only">
                  <Pressable
                    onPress={() => handleFilterChange('active')}
                    style={[
                      styles.filterChip,
                      statusFilter === 'active' && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        statusFilter === 'active' && styles.filterChipTextActive,
                      ]}
                    >
                      Em andamento ({activeCount})
                    </Text>
                  </Pressable>
                </View>
                <View pointerEvents="box-only">
                  <Pressable
                    onPress={() => handleFilterChange('completed')}
                    style={[
                      styles.filterChip,
                      statusFilter === 'completed' && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        statusFilter === 'completed' && styles.filterChipTextActive,
                      ]}
                    >
                      Quitados ({completedCount})
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>

              {/* Section Title */}
              <Text style={styles.sectionTitle}>Seus parcelamentos</Text>
            </>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: darkTheme.text,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  filterChipActive: {
    backgroundColor: darkTheme.primary,
    borderColor: darkTheme.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: darkTheme.text,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  summaryCard: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 16,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: darkTheme.textMuted,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  summaryMonth: {
    fontSize: 12,
    color: darkTheme.textMuted,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: darkTheme.textMuted,
  },
  errorText: {
    fontSize: 14,
    color: darkTheme.textMuted,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
    marginTop: 12,
    marginBottom: 8,
  },
})
