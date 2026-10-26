import Feather from '@expo/vector-icons/Feather'
import { router } from 'expo-router'
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { darkTheme } from '@/theme/colors'

interface QuickActionsModalProps {
  visible: boolean
  onClose: () => void
}

export function QuickActionsModal({ visible, onClose }: QuickActionsModalProps) {
  const insets = useSafeAreaInsets()

  const handleNewTransaction = () => {
    onClose()
    router.push('/transaction/new')
  }

  const handleImportDocument = () => {
    onClose()
    router.push('/invoice/import' as any)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Alça do bottom sheet */}
          <View style={styles.handle} />

          {/* Título */}
          <Text style={styles.title}>O que você quer registrar?</Text>

          {/* Opção 1: Nova transação */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nova transação"
            onPress={handleNewTransaction}
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
          >
            <View style={styles.iconWrapper}>
              <Feather name="plus" size={20} color={darkTheme.accent} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Nova transação</Text>
              <Text style={styles.actionSubtitle}>
                Despesa, receita ou transferência
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={darkTheme.textMuted} />
          </Pressable>

          {/* Opção 2: Importar documento */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Importar documento"
            onPress={handleImportDocument}
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
          >
            <View style={styles.iconWrapper}>
              <Feather name="upload" size={20} color={darkTheme.accent} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Importar documento</Text>
              <Text style={styles.actionSubtitle}>
                Fatura ou cupom · foto ou PDF
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={darkTheme.textMuted} />
          </Pressable>

          {/* Botão Cancelar */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
            onPress={onClose}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(8, 5, 18, 0.67)',
  },
  scrim: {
    flex: 1,
  },
  sheet: {
    backgroundColor: darkTheme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: darkTheme.border,
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 14,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 3,
    backgroundColor: darkTheme.textSecondary,
    alignSelf: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: darkTheme.text,
    letterSpacing: -0.5,
    paddingBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  actionRowPressed: {
    opacity: 0.75,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
    gap: 3,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkTheme.text,
  },
  actionSubtitle: {
    fontSize: 12,
    color: darkTheme.textSecondary,
  },
  cancelButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: darkTheme.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: darkTheme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  cancelButtonPressed: {
    opacity: 0.75,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: darkTheme.text,
  },
})

