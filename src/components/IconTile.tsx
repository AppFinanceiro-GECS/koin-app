import Feather from '@expo/vector-icons/Feather'
import { StyleSheet, View } from 'react-native'

import { darkTheme } from '@/theme/colors'

interface IconTileProps {
  icon: keyof typeof Feather.glyphMap
  tone?: 'accent' | 'success'
}

/** Ícone grande num quadrado arredondado, no topo das telas de aviso/confirmação. */
export function IconTile({ icon, tone = 'accent' }: IconTileProps) {
  const success = tone === 'success'
  return (
    <View style={[styles.tile, success && styles.tileSuccess]}>
      <Feather name={icon} size={26} color={success ? darkTheme.success : darkTheme.accent} />
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: darkTheme.surfaceSecondary,
    borderWidth: 1,
    borderColor: darkTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileSuccess: {
    borderColor: darkTheme.successBorder,
    backgroundColor: darkTheme.successBackground,
  },
})
