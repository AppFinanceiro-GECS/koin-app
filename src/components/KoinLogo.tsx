import { StyleSheet, Text, View } from 'react-native'

import { darkTheme } from '@/theme/colors'

interface KoinLogoProps {
  size?: number
  showText?: boolean
}

export function KoinLogoMark({ size = 1 }: { size?: number }) {
  return (
    <View style={[styles.markContainer, { gap: Math.round(7 * size) }]}>
      <View
        style={[
          styles.palm,
          {
            width: Math.round(9 * size),
            height: Math.round(40 * size),
            borderRadius: Math.round(4 * size),
          },
        ]}
      />
      <View
        style={[
          styles.coin,
          {
            width: Math.round(18 * size),
            height: Math.round(18 * size),
            borderRadius: Math.round(9 * size),
          },
        ]}
      />
      <View
        style={[
          styles.palm,
          {
            width: Math.round(9 * size),
            height: Math.round(40 * size),
            borderRadius: Math.round(4 * size),
          },
        ]}
      />
    </View>
  )
}

export function KoinLogo({ size = 1, showText = true }: KoinLogoProps) {
  return (
    <View style={[styles.logoContainer, { gap: Math.round(16 * size) }]}>
      <KoinLogoMark size={size} />
      {showText && (
        <Text style={[styles.logoText, { fontSize: Math.round(30 * size) }]}>
          Koin
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  palm: {
    backgroundColor: darkTheme.accentLight,
  },
  coin: {
    backgroundColor: darkTheme.accent,
  },
  logoText: {
    fontWeight: '700',
    color: '#ffffff',
  },
})

