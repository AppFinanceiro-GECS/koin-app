import { secureStorage } from '@/lib/storage'

// v1: tutorial do fluxo "o cartão nasce da fatura". Mudou o tutorial? Suba a versão.
const key = (userId: number) => `koin.onboarding.v1.${userId}`

export async function hasSeenOnboarding(userId: number): Promise<boolean> {
  try {
    return (await secureStorage.get(key(userId))) === 'done'
  } catch {
    // sem acesso ao armazenamento seguro, não prende a pessoa no tutorial
    return true
  }
}

export async function markOnboardingSeen(userId: number): Promise<void> {
  try {
    await secureStorage.set(key(userId), 'done')
  } catch {
    // ignora: no pior caso o tutorial aparece de novo
  }
}
