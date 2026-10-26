import type { HouseholdMember } from '@/types/api'

/** Primeiro nome do membro; o apelido, quando existe, tem prioridade. */
export function memberFirstName(member: HouseholdMember): string {
  const full = (member.nickname || member.user_name || member.user_email || '').trim()
  return full.split(/[\s@]/)[0] || 'Membro'
}

/**
 * O koin-api ainda não guarda o nome da família, então usamos o sobrenome do admin
 * ("Marina Andrade" -> "Família Andrade").
 * TODO: trocar por um campo de nome da família quando a API expuser.
 */
export function familyDisplayName(members: HouseholdMember[]): string {
  const owner = members.find((m) => m.role === 'owner')
  const words = (owner?.user_name ?? '').trim().split(/\s+/).filter(Boolean)
  return words.length > 1 ? `Família ${words[words.length - 1]}` : 'Minha família'
}
