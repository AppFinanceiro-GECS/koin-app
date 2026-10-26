import { StyleSheet, Text, View } from 'react-native'
import { darkTheme } from '@/theme/colors'

export function MonthlyForecast() {
  const months = [
    { label: 'Nov', value: 200 },
    { label: 'Dez', value: 320 },
    { label: 'Jan', value: 300 },
    { label: 'Fev', value: 200 },
    { label: 'Mar', value: 200 },
    { label: 'Abr', value: 0 },
  ]

  const maxValue = Math.max(...months.map((m) => m.value), 1)

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {months.map((month, index) => {
          const heightPercent = (month.value / maxValue) * 100
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
