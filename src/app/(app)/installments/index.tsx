import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import { useQuery } from '@tanstack/react-query'
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
import { installmentsApi } from '@/services/transactions.api'
import { darkTheme } from '@/theme/colors'
import type { InstallmentSeriesResponse } from '@/types/installment'

type StatusFilter = 'active' | 'completed' | null

export default function InstallmentsScreen() {
  const insets = useSafeAreaInsets()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')

  const { data: allSeries = [], isLoading } = useQuery({
    queryKey: ['installments'],
    queryFn: async () => {
      const res = await installmentsApi.list()
      return (res.data || []) as InstallmentSeriesResponse[]
    },
  })

  const series = statusFilter
    ? allSeries.filter((item) => item.status === statusFilter)
    : allSeries

  const handleFilterChange = (filter: StatusFilter) => {
    setStatusFilter((prev) => (prev === filter ? null : filter))
  }

  const handleSeriesPress = (seriesId: number) => {
    router.push(`/installments/${seriesId}`)
  }

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long' })
  const totalMonthly = allSeries
    .filter((item) => item.status === 'active')
    .reduce((sum, item) => sum + (item.installment_amount || 0), 0)
  const activeCount = allSeries.filter((item) => item.status === 'active').length
  const completedCount = allSeries.filter((item) => item.status === 'completed').length

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
                <Text style={styles.summaryLabel}>Comprometido com parcelas</Text>
                <Text style={styles.summaryAmount}>
                  R$ {totalMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.summaryMonth}>em {currentMonth}</Text>
              </LinearGradient>

              {/* Monthly Forecast */}
              <MonthlyForecast series={allSeries} />

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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={40} color={darkTheme.textMuted} />
              <Text style={styles.emptyText}>
                {statusFilter === 'completed'
                  ? 'Nenhum parcelamento quitado'
                  : 'Nenhum parcelamento em andamento'}
              </Text>
            </View>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: darkTheme.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: darkTheme.textMuted,
  },
  filterChipTextActive: {
    color: darkTheme.primary,
    fontWeight: '600',
  },
  summaryCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: darkTheme.border,
    gap: 8,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
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
