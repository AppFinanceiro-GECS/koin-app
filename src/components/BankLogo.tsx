import { StyleSheet, Text, View } from 'react-native'
import { SvgXml } from 'react-native-svg'

import type { BankIdentity } from '@/lib/banks'

interface Props {
  bank: BankIdentity
  size?: number
}

/** Logo redondo do banco; sem logo, a inicial sobre a cor da marca */
export function BankLogo({ bank, size = 36 }: Props) {
  if (bank.logo) {
    return (
      <View style={{ width: size, height: size }} accessible accessibilityLabel={bank.name}>
        <SvgXml xml={bank.logo} width={size} height={size} />
      </View>
    )
  }
  const initials = bank.shortName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <View
      accessible
      accessibilityLabel={bank.name}
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bank.color },
      ]}
    >
      <Text style={[styles.initials, { color: bank.onColor, fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '700' },
})
