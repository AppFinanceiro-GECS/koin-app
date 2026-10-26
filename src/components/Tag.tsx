import { StyleSheet, Text, View } from 'react-native'

import { darkTheme } from '@/theme/colors'

/** Etiqueta pequena (pílula roxa) para contextualizar um card. */
export function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3b2a6b',
    backgroundColor: '#1d1536',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: darkTheme.accent,
  },
})
