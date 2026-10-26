import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { IconTile } from '@/components/IconTile'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Tag } from '@/components/Tag'
import { WarningCard } from '@/components/WarningCard'
import { parseApiDate } from '@/lib/format'
import { documentsApi } from '@/services/documents.api'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'

/** "01/10/2026" no fuso local. */
function formatReceivedAt(iso: string): string {
  const date = parseApiDate(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.detailValue}>
        {value}
      </Text>
    </View>
  )
}

/**
 * Bloqueio de reenvio: o upload voltou 409 (documento já enviado por este usuário).
 * Recebe `documentId`, o id do documento original que a API devolve no 409.
 */
export default function DuplicateDocumentScreen() {
  const { documentId } = useLocalSearchParams<{ documentId?: string }>()
  const user = useAuthStore((s) => s.user)

  const id = Number(documentId)
  const original = useQuery({
    queryKey: ['documents', id],
    queryFn: async () => (await documentsApi.get(id)).data,
    enabled: Number.isInteger(id) && id > 0,
    retry: false,
  })

  const userName = user?.name ?? 'você'
  const placeholder = original.isLoading ? '…' : '—'
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/invoice/import'))

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ScreenHeader title="Importar fatura" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <IconTile icon="copy" />
        <Text style={styles.headline}>Este arquivo já foi recebido</Text>
        <Text style={styles.lead}>
          Encontramos o mesmo documento enviado por {userName}. O novo envio foi bloqueado.
        </Text>

        <View style={styles.card}>
          <Tag label="409 · Documento duplicado" />
          {original.isLoading ? (
            <ActivityIndicator color={darkTheme.accent} style={styles.loading} />
          ) : (
            <>
              <DetailRow label="Arquivo" value={original.data?.original_filename ?? placeholder} />
              <DetailRow label="Usuário" value={user?.name ?? placeholder} />
              <DetailRow
                label="Recebido em"
                value={original.data ? formatReceivedAt(original.data.created_at) : placeholder}
              />
            </>
          )}
          <Text style={styles.cardNote}>Nenhum novo processamento por IA.</Text>
        </View>

        <WarningCard title="Arquivo ≠ transação">
          Este bloqueio é do mesmo arquivo, para o mesmo usuário. Possíveis lançamentos duplicados são
          conferidos separadamente na revisão.
        </WarningCard>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={goBack}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>Escolher outro arquivo</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
  headline: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '700',
    color: darkTheme.text,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: darkTheme.textSecondary,
    marginTop: -6,
  },
  card: {
    gap: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
    padding: 16,
  },
  loading: {
    paddingVertical: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: darkTheme.textSecondary,
  },
  detailValue: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '500',
    color: darkTheme.text,
  },
  cardNote: {
    fontSize: 13,
    color: darkTheme.accent,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  button: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '500',
    color: darkTheme.text,
  },
})
