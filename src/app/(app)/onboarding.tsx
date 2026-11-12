import Feather from '@expo/vector-icons/Feather'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useRef, useState } from 'react'
import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { KoinLogoMark } from '@/components/KoinLogo'
import { markOnboardingSeen } from '@/lib/onboarding'
import { useAuthStore } from '@/stores/authStore'
import { darkTheme } from '@/theme/colors'

interface Slide {
  key: string
  eyebrow: string
  title: string
  text: string
  art: () => React.ReactElement
}

/* ---------- Ilustrações feitas com as mesmas peças das telas do app ---------- */

function WelcomeArt() {
  return (
    <View style={art.center}>
      <View style={art.glow} />
      <KoinLogoMark size={2.2} />
    </View>
  )
}

function InvoiceArt() {
  const rows: { icon: keyof typeof Feather.glyphMap; label: string; tag: string; value: string }[] = [
    { icon: 'shopping-cart', label: 'Mercado', tag: 'Compra', value: 'R$ 184,90' },
    { icon: 'layers', label: 'Geladeira', tag: 'Parcela 3 de 10', value: 'R$ 289,00' },
    { icon: 'repeat', label: 'Streaming', tag: 'Assinatura', value: 'R$ 39,90' },
  ]
  return (
    <View style={art.center}>
      <View style={art.pdf}>
        <View style={art.pdfHeader}>
          <Feather name="file-text" size={16} color={darkTheme.accent} />
          <Text style={art.pdfTitle}>fatura-novembro.pdf</Text>
        </View>
        {[0.9, 0.7, 0.8].map((w, i) => (
          <View key={i} style={[art.pdfLine, { width: `${w * 100}%` }]} />
        ))}
      </View>
      <View style={art.arrow}>
        <Feather name="arrow-down" size={18} color={darkTheme.accent} />
      </View>
      <View style={art.list}>
        {rows.map((r) => (
          <View key={r.label} style={art.row}>
            <View style={art.rowIcon}>
              <Feather name={r.icon} size={14} color={darkTheme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={art.rowLabel}>{r.label}</Text>
              <Text style={art.rowTag}>{r.tag}</Text>
            </View>
            <Text style={art.rowValue}>{r.value}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function OutlookArt() {
  const bars = [0.95, 0.75, 0.6, 0.45, 0.3, 0.2]
  const months = ['nov', 'dez', 'jan', 'fev', 'mar', 'abr']
  return (
    <View style={art.center}>
      <View style={art.panel}>
        <Text style={art.panelLabel}>Já comprometido nos próximos 6 meses</Text>
        <Text style={art.panelValue}>R$ 2.418,00</Text>
        <View style={art.bars}>
          {bars.map((h, i) => (
            <View key={months[i]} style={art.barCol}>
              <View style={art.barTrack}>
                <View style={[art.bar, { height: `${h * 100}%` }, i === 0 && art.barNow]} />
              </View>
              <Text style={[art.barMonth, i === 0 && art.barMonthNow]}>{months[i]}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={[art.panel, art.panelSmall]}>
        <Feather name="credit-card" size={16} color={darkTheme.accent} />
        <Text style={art.smallText}>Nubank final 1234 · vence dia 12</Text>
        <Text style={art.smallValue}>R$ 812,40</Text>
      </View>
    </View>
  )
}

function FamilyArt() {
  return (
    <View style={art.center}>
      <View style={art.avatars}>
        <View style={[art.avatar, { backgroundColor: '#7c3aed' }]}>
          <Text style={art.avatarText}>A</Text>
        </View>
        <View style={[art.avatar, art.avatarOverlap, { backgroundColor: '#14b8a6' }]}>
          <Text style={art.avatarText}>B</Text>
        </View>
        <View style={[art.avatar, art.avatarOverlap, { backgroundColor: '#f97316' }]}>
          <Feather name="home" size={20} color="#ffffff" />
        </View>
      </View>
      <View style={art.chips}>
        <View style={[art.chip, art.chipOn]}>
          <Text style={art.chipOnText}>Só eu</Text>
        </View>
        <View style={art.chip}>
          <Text style={art.chipText}>Família</Text>
        </View>
      </View>
      <View style={art.panel}>
        <View style={art.splitRow}>
          <Text style={art.rowLabel}>Faturas da casa</Text>
          <Text style={art.rowValue}>R$ 3.120,00</Text>
        </View>
        <View style={art.split}>
          <View style={[art.splitPart, { flex: 0.58, backgroundColor: '#7c3aed' }]} />
          <View style={[art.splitPart, { flex: 0.42, backgroundColor: '#14b8a6' }]} />
        </View>
        <Text style={art.rowTag}>Cada um vê o que é seu e o que é da casa</Text>
      </View>
    </View>
  )
}

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    eyebrow: 'Bem-vindo ao Koin',
    title: 'Suas faturas, entendidas',
    text: 'O Koin organiza o cartão de crédito por você: o que vem na próxima fatura, as parcelas e quem gastou o quê.',
    art: WelcomeArt,
  },
  {
    key: 'invoice',
    eyebrow: '1 · Mande a fatura',
    title: 'Foto ou PDF, o Koin lê',
    text: 'Compras, parcelas e assinaturas saem separadas. O cartão é reconhecido pela própria fatura: banco, final, fechamento e vencimento.',
    art: InvoiceArt,
  },
  {
    key: 'outlook',
    eyebrow: '2 · Veja o que vem',
    title: 'Sem susto no fim do mês',
    text: 'O Início mostra quanto vence em cada cartão e quanto das parcelas já está comprometido nos próximos meses.',
    art: OutlookArt,
  },
  {
    key: 'family',
    eyebrow: '3 · Em família',
    title: 'A casa inteira no mesmo lugar',
    text: 'Convide quem divide as contas. Cada um manda as suas faturas e vocês alternam entre "Só eu" e "Família".',
    art: FamilyArt,
  },
]

export default function OnboardingScreen() {
  const { width } = useWindowDimensions()
  const userId = useAuthStore((s) => s.user?.id)
  // useState (e não useRef) porque o valor é lido durante a renderização
  const [scrollX] = useState(() => new Animated.Value(0))
  const listRef = useRef<{ scrollToOffset: (p: { offset: number; animated?: boolean }) => void } | null>(null)
  const [index, setIndex] = useState(0)
  const isLast = index === SLIDES.length - 1

  const finish = async (to: '/invoice/import' | '/') => {
    if (userId) await markOnboardingSeen(userId)
    router.replace('/')
    if (to !== '/') router.push(to)
  }

  const goTo = (i: number) => listRef.current?.scrollToOffset({ offset: i * width, animated: true })

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width))

  return (
    <LinearGradient colors={['#130a26', darkTheme.background, darkTheme.background]} style={styles.flex}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <View style={styles.topBar}>
          <Text style={styles.step}>
            {index + 1} de {SLIDES.length}
          </Text>
          {!isLast && (
            <Pressable accessibilityRole="button" hitSlop={10} onPress={() => finish('/')}>
              <Text style={styles.skip}>Pular</Text>
            </Pressable>
          )}
        </View>

        <Animated.FlatList
          ref={(node) => {
            listRef.current = node as unknown as typeof listRef.current
          }}
          data={SLIDES}
          keyExtractor={(s) => s.key}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
          renderItem={({ item, index: i }) => {
            const range = [(i - 1) * width, i * width, (i + 1) * width]
            const artStyle = {
              opacity: scrollX.interpolate({ inputRange: range, outputRange: [0, 1, 0], extrapolate: 'clamp' }),
              transform: [
                {
                  translateX: scrollX.interpolate({
                    inputRange: range,
                    outputRange: [width * 0.25, 0, -width * 0.25],
                    extrapolate: 'clamp',
                  }),
                },
                {
                  scale: scrollX.interpolate({ inputRange: range, outputRange: [0.9, 1, 0.9], extrapolate: 'clamp' }),
                },
              ],
            }
            const Art = item.art
            return (
              <View style={[styles.slide, { width }]}>
                <Animated.View style={[styles.artBox, artStyle]}>
                  <Art />
                </Animated.View>
                <View style={styles.texts}>
                  <Text style={styles.eyebrow}>{item.eyebrow}</Text>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.text}>{item.text}</Text>
                </View>
              </View>
            )
          }}
        />

        <View style={styles.dots}>
          {SLIDES.map((s, i) => {
            const range = [(i - 1) * width, i * width, (i + 1) * width]
            return (
              <Animated.View
                key={s.key}
                style={[
                  styles.dot,
                  {
                    opacity: scrollX.interpolate({ inputRange: range, outputRange: [0.35, 1, 0.35], extrapolate: 'clamp' }),
                    transform: [
                      {
                        scaleX: scrollX.interpolate({ inputRange: range, outputRange: [1, 2.6, 1], extrapolate: 'clamp' }),
                      },
                    ],
                  },
                ]}
              />
            )
          })}
        </View>

        <View style={styles.footer}>
          {isLast ? (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => finish('/invoice/import')}
                style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
              >
                <Feather name="upload" size={18} color="#ffffff" />
                <Text style={styles.primaryText}>Enviar minha primeira fatura</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => finish('/')} style={styles.secondary}>
                <Text style={styles.secondaryText}>Explorar o app</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => goTo(index + 1)}
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            >
              <Text style={styles.primaryText}>{index === 0 ? 'Começar' : 'Próximo'}</Text>
              <Feather name="arrow-right" size={18} color="#ffffff" />
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    height: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  step: { fontSize: 13, color: darkTheme.textMuted, fontWeight: '600' },
  skip: { fontSize: 15, color: darkTheme.textSecondary, fontWeight: '600' },
  slide: { flex: 1, paddingHorizontal: 24 },
  artBox: { flex: 1, justifyContent: 'center' },
  texts: { gap: 10, paddingBottom: 12 },
  eyebrow: { fontSize: 13, fontWeight: '700', color: darkTheme.accent, letterSpacing: 0.4 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: darkTheme.text },
  text: { fontSize: 16, lineHeight: 23, color: darkTheme.textSecondary },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 14, paddingVertical: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: darkTheme.primary },
  footer: { paddingHorizontal: 24, paddingBottom: 8, gap: 6 },
  primary: {
    height: 54,
    borderRadius: 16,
    backgroundColor: darkTheme.primary,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  secondary: { height: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '600', color: darkTheme.accent },
  pressed: { opacity: 0.85 },
})

const art = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
  },
  pdf: {
    width: '78%',
    padding: 14,
    gap: 8,
    borderRadius: 14,
    backgroundColor: darkTheme.surfaceSecondary,
    borderWidth: 1,
    borderColor: darkTheme.border,
  },
  pdfHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pdfTitle: { fontSize: 13, color: darkTheme.text, fontWeight: '600' },
  pdfLine: { height: 6, borderRadius: 3, backgroundColor: darkTheme.border },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 14, fontWeight: '600', color: darkTheme.text },
  rowTag: { fontSize: 12, color: darkTheme.textMuted },
  rowValue: { fontSize: 14, fontWeight: '600', color: darkTheme.text },
  panel: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: darkTheme.surface,
    borderWidth: 1,
    borderColor: darkTheme.border,
    padding: 16,
    gap: 6,
  },
  panelSmall: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panelLabel: { fontSize: 12, color: darkTheme.textSecondary },
  panelValue: { fontSize: 24, fontWeight: '700', color: darkTheme.text },
  bars: { flexDirection: 'row', gap: 10, height: 96, alignItems: 'flex-end', marginTop: 6 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { width: '100%', height: 72, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6, backgroundColor: 'rgba(124, 58, 237, 0.55)' },
  barNow: { backgroundColor: darkTheme.primary },
  barMonth: { fontSize: 11, color: darkTheme.textMuted },
  barMonthNow: { color: darkTheme.accent, fontWeight: '700' },
  smallText: { flex: 1, fontSize: 13, color: darkTheme.text },
  smallValue: { fontSize: 14, fontWeight: '700', color: darkTheme.text },
  avatars: { flexDirection: 'row', marginBottom: 4 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: darkTheme.background,
  },
  avatarOverlap: { marginLeft: -14 },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: darkTheme.border,
    backgroundColor: darkTheme.surface,
  },
  chipOn: { borderColor: darkTheme.primary, backgroundColor: 'rgba(124, 58, 237, 0.19)' },
  chipText: { fontSize: 13, color: darkTheme.textSecondary },
  chipOnText: { fontSize: 13, color: darkTheme.accent, fontWeight: '600' },
  splitRow: { flexDirection: 'row', justifyContent: 'space-between' },
  split: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 3 },
  splitPart: { height: 10 },
})
