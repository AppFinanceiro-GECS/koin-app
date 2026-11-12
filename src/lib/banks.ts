import { banks, type Bank } from '@/data/banks'
import { BANK_LOGOS, CARD_BRAND_LOGOS } from '@/data/logos'
import { normalizeCardBrandToId } from '@/data/cardBrands'

/** Banco reconhecido de um cartão, com a cor da marca e o logo quando houver */
export interface BankIdentity {
  id: string
  name: string
  shortName: string
  /** cor oficial da marca */
  color: string
  /** cor para desenhar sobre o fundo escuro do app (marcas pretas ficam visíveis) */
  chartColor: string
  /** cor do texto sobre a cor da marca */
  onColor: string
  logo: string | null
}

const FALLBACK_COLOR = '#6B7280'

// Cartão sem banco reconhecido: usa a cor da bandeira
const BRAND_COLORS: Record<string, string> = {
  visa: '#1A1F71',
  mastercard: '#252525',
  elo: '#00A4E0',
  amex: '#016FD0',
  hipercard: '#B3131B',
  diners: '#004A97',
}

function norm(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

// Como o banco aparece nas faturas e nos apelidos (já normalizado)
const ALIASES: [string, string][] = [
  ['nupagamentos', 'nubank'],
  ['nubank', 'nubank'],
  ['roxinho', 'nubank'],
  ['itiitau', 'iti'],
  ['itau', 'itau'],
  ['personnalite', 'itau'],
  ['bradesco', 'bradesco'],
  ['santander', 'santander'],
  ['bancodobrasil', 'bb'],
  ['ourocard', 'bb'],
  ['caixaeconomica', 'caixa'],
  ['caixa', 'caixa'],
  ['bancointer', 'inter'],
  ['inter', 'inter'],
  ['c6bank', 'c6'],
  ['c6', 'c6'],
  ['btgpactual', 'btg'],
  ['btg', 'btg'],
  ['xpinvestimentos', 'xp'],
  ['xpvisa', 'xp'],
  ['mercadopago', 'mercadopago'],
  ['mercadolivre', 'mercadopago'],
  ['pagseguro', 'pagbank'],
  ['pagbank', 'pagbank'],
  ['picpay', 'picpay'],
  ['willbank', 'will'],
  ['bancopan', 'pan'],
  ['neon', 'neon'],
  ['next', 'next'],
  ['digio', 'digio'],
  ['bancooriginal', 'original'],
  ['sicredi', 'sicredi'],
  ['sicoob', 'sicoob'],
  ['banrisul', 'banrisul'],
  ['safra', 'safra'],
  ['bmg', 'bmg'],
  ['daycoval', 'daycoval'],
  ['sofisa', 'sofisa'],
  ['magalu', 'magalu'],
  ['magazineluiza', 'magalu'],
  ['amazon', 'amazon'],
  ['renner', 'renner'],
  ['riachuelo', 'riachuelo'],
  ['carrefour', 'carrefour'],
  ['samsung', 'samsung'],
  ['rappi', 'rappi'],
  ['99pay', '99pay'],
  ['bv', 'bv'],
]

const EXTRA_BANKS: Bank[] = [
  { id: 'samsung', name: 'Samsung Itaú', shortName: 'Samsung', domain: 'samsung.com.br', color: '#1428A0', hasLocalLogo: true },
]

function findBank(id: string): Bank | undefined {
  return banks.find((b) => b.id === id) ?? EXTRA_BANKS.find((b) => b.id === id)
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const n = parseInt(full.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Mistura a cor com branco (amount > 0) ou com preto (amount < 0) */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const target = amount > 0 ? 255 : 0
  const t = Math.abs(amount)
  return rgbToHex(r + (target - r) * t, g + (target - g) * t, b + (target - b) * t)
}

/** Cor com transparência, para fundos e trilhas */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function identity(id: string, name: string, shortName: string, color: string): BankIdentity {
  // marcas muito escuras (C6, XP) somem no fundo do app: clareia só para desenhar
  const lum = luminance(color)
  const chartColor = lum < 0.04 ? shade(color, 0.55) : color
  return {
    id,
    name,
    shortName,
    color,
    chartColor,
    onColor: lum > 0.45 ? '#111111' : '#ffffff',
    logo: BANK_LOGOS[id] ?? null,
  }
}

/**
 * Descobre o banco do cartão pelo bank_id e, se não houver, pelo nome ou apelido
 * ("Nubank Ultravioleta", "Inter Black"). Sem banco reconhecido, usa a cor do cartão.
 */
export function resolveBank(card: {
  bank_id?: string | null
  name?: string | null
  nickname?: string | null
  color?: string | null
  card_brand?: string | null
}): BankIdentity {
  const candidates = [card.bank_id, card.name, card.nickname].map(norm).filter(Boolean)
  for (const value of candidates) {
    const direct = findBank(value)
    if (direct && direct.id !== 'other') return identity(direct.id, direct.name, direct.shortName, direct.color)
    const alias = ALIASES.find(([key]) => value.includes(key))
    const bank = alias && findBank(alias[1])
    if (bank) return identity(bank.id, bank.name, bank.shortName, bank.color)
  }
  const label = card.nickname?.trim() || card.name?.trim() || 'Cartão'
  const brandId = normalizeCardBrandToId(card.card_brand)
  const brandColor = brandId ? BRAND_COLORS[brandId] : undefined
  const fallback = identity('other', label, label, card.color || brandColor || FALLBACK_COLOR)
  // sem banco, o logo da bandeira ocupa o lugar do logo do banco
  return { ...fallback, logo: brandId ? CARD_BRAND_LOGOS[brandId] ?? null : null }
}

/** Logo da bandeira (Visa, Mastercard...) quando houver */
export function cardBrandLogo(brand: string | null | undefined): string | null {
  const id = normalizeCardBrandToId(brand)
  return id ? CARD_BRAND_LOGOS[id] ?? null : null
}

// Segunda cor da marca, usada quando a principal se confunde com a de outro cartão
// (Itaú e Inter são laranja; Bradesco e Santander são vermelho)
const SECONDARY_COLORS: Record<string, string> = {
  itau: '#2D5BE3',
  bradesco: '#F2547A',
  santander: '#FF8A80',
  bb: '#3A6BD6',
  caixa: '#F39200',
  inter: '#FFB15C',
  nubank: '#B95CF4',
  c6: '#A3A3A3',
  btg: '#4C7BD9',
  xp: '#F5C518',
  pan: '#0A4DA2',
  mercadopago: '#FFE600',
  picpay: '#9BE7B4',
  neon: '#0090FF',
  will: '#3D3D3D',
}

function distance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

/**
 * Cor de cada cartão no gráfico: a do banco. Quando ela se confunde com a de um cartão
 * já colorido (outro cartão do mesmo banco, ou bancos de cores parecidas), usa a segunda
 * cor da marca ou um tom mais claro ou mais escuro da mesma cor.
 */
export function assignCardColors<K extends string | number>(
  items: { key: K; bank: BankIdentity }[]
): Map<K, string> {
  const used: string[] = []
  const result = new Map<K, string>()
  for (const { key, bank } of items) {
    const base = bank.chartColor
    const secondary = SECONDARY_COLORS[bank.id]
    const candidates = [base, secondary, shade(base, 0.4), shade(base, -0.35), secondary && shade(secondary, 0.35), shade(base, 0.65)]
      .filter((c): c is string => Boolean(c))
    const chosen = candidates.find((c) => used.every((u) => distance(u, c) >= 80)) ?? candidates[0]
    used.push(chosen)
    result.set(key, chosen)
  }
  return result
}
