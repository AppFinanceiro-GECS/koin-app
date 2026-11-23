import { router } from 'expo-router'

import { hasSeenOnboarding } from '@/lib/onboarding'

/**
 * Cadastro no stand (evento de ativação). Liga com EXPO_PUBLIC_EVENT_CODE no build/update
 * do evento: o login mostra "Criar conta" e o código já vem preenchido no cadastro.
 * Sem a variável, nada disso aparece. O código precisa ser o mesmo EVENT_SIGNUP_CODE da API.
 */
export const EVENT_CODE = process.env.EXPO_PUBLIC_EVENT_CODE?.trim() || null

/** Texto da caixa de novidades. Mudou o texto? Suba CONSENT_VERSION no koin-api. */
export const EVENT_CONSENT_TEXT =
  'Quero receber novidades do Koin por e-mail, como o aviso de lançamento nas lojas e pedidos ' +
  'de opinião sobre o app. Posso sair da lista quando quiser.'

// Depois do cadastro, o AppLayout leva para a confirmação do e-mail em vez do tutorial.
let pendingVerification = false

export function markEventSignupPending() {
  pendingVerification = true
}

export function isEventSignupPending(): boolean {
  return pendingVerification
}

/** Sai do fluxo do evento para o app: tutorial no primeiro acesso, senão o Início. */
export async function leaveEventFlow(userId: number | undefined) {
  pendingVerification = false
  const seen = userId ? await hasSeenOnboarding(userId) : true
  router.replace(seen ? '/' : '/onboarding')
}
