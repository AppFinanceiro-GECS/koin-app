// O Expo Go e o EAS Update abrem o app com o endereço do projeto
// (exp://u.expo.dev/<id>?channel-name=preview), que o expo-router trataria como rota e
// mostraria "Esta tela não existe". Esses endereços vão para o início; deep links do
// próprio app (koin://invite?token=...) seguem como estão.
const EXPO_PROJECT_URL =
  /(^|[/.])expo\.dev([/?:]|$)|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return EXPO_PROJECT_URL.test(path) ? '/' : path
}
