const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatCurrency = (value: number | string) => currency.format(Number(value) || 0)

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export const monthLabel = (year: number, month: number) => `${MONTHS[month - 1]} ${year}`

/** Date -> "YYYY-MM-DD" no fuso local (o formato que a API espera). */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "YYYY-MM-DD" -> "DD/MM/YYYY" */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

/** Aceita "1.234,56", "1234,56" ou "1234.56". Retorna NaN se inválido. */
export function parseAmount(input: string): number {
  const cleaned = input.trim().replace(/\s|R\$/g, '')
  if (!cleaned) return NaN
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned
  return /^\d+(\.\d{1,2})?$/.test(normalized) ? Number(normalized) : NaN
}

/** Nome do mês em minúsculas, para frases ("compartilhado em outubro"). month: 1-12 */
export const monthName = (month: number) => MONTHS[month - 1].toLowerCase()

/** ["Marina"] -> "Marina"; ["Marina", "Lucas"] -> "Marina ou Lucas"; 3+ -> "A, B ou C". */
export function joinWithOr(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} ou ${items[items.length - 1]}`
}

/** A API devolve datetimes em UTC sem sufixo de fuso ("2026-10-01T13:05:00"); sem o "Z" o JS leria como horário local. */
export function parseApiDate(iso: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)
}
