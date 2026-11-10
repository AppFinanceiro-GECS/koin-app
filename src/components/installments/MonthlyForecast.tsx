import { StyleSheet, Text, View } from 'react-native'
import { darkTheme } from '@/theme/colors'
import type { InstallmentSeriesResponse } from '@/types/installment'

interface MonthlyForecastProps {
  series?: InstallmentSeriesResponse[]
}

export function MonthlyForecast({ series = [] }: MonthlyForecastProps) {
  const now = new Date()
  const activeSeries = series.filter((item) => item.status === 'active')

  const months = Array.from({ length: 6 }, (_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() + index, 1)
    const rawLabel = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
    const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)

    const value = activeSeries.reduce((sum, item) => {
      if (item.remaining_count > index) {
        return sum + (item.installment_amount || 0)
      }
      return sum
    }, 0)

    return { label, value }
  })

  const maxValue = Math.max(...months.map((m) => m.value), 1)

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {months.map((month, index) => {
          const heightPercent = month.value > 0 ? (month.value / maxValue) * 100 : 0
          return (
            <View key={index} style={styles.barWrapper}>
              <View style={styles.barColumn}>
                {month.value > 0 && (
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${heightPercent}%`,
                        backgroundColor: darkTheme.primary,
                      },
                    ]}
                  />
                )}
              </View>
              <Text style={styles.monthLabel}>{month.label}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: darkTheme.background,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
    gap: 8,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barColumn: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 4,
    minHeight: 4,
  },
  monthLabel: {
    fontSize: 11,
    color: darkTheme.textMuted,
    fontWeight: '500',
  },
})
