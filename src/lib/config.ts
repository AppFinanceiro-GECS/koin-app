import Constants from 'expo-constants'

/**
 * URL base da API.
 * 1. EXPO_PUBLIC_API_URL, se definida (builds de preview/produção via eas.json);
 * 2. em dev, o host do Metro na porta 8000 — o celular na mesma rede alcança a API do `make up`;
 * 3. fallback localhost (simulador iOS / web).
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL
  if (fromEnv) return fromEnv.replace(/\/+$/, '')

  const hostUri = Constants.expoConfig?.hostUri
  if (__DEV__ && hostUri) {
    const host = hostUri.split(':')[0]
    return `http://${host}:8000`
  }

  return 'http://localhost:8000'
}

export const API_URL = resolveApiUrl()
export const API_BASE_URL = `${API_URL}/api/v1`
export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0'

/**
 * Documentos legais e canal de suporte da tela "Privacidade e dados".
 * TODO: definir as URLs finais (aguardam validação do cliente); enquanto forem null a tela mostra "Em breve".
 */
export const LEGAL_LINKS: { privacy: string | null; terms: string | null; support: string | null } = {
  privacy: null,
  terms: null,
  support: null,
}
