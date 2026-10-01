import { Redirect } from 'expo-router'

import { useAuthStore } from '@/stores/authStore'

// Rota desconhecida ou protegida para o estado atual (ex.: o Android abre o app do Expo Go já
// em "/", que só existe para quem está logado): manda para o login ou para o início.
export default function NotFoundScreen() {
  const status = useAuthStore((s) => s.status)
  return <Redirect href={status === 'signedIn' ? '/' : '/login'} />
}
