// Tradução das mensagens de erro do FastAPI (mesma lógica do web)
const errorMessages: Record<string, string> = {
  'String should have at least 8 characters': 'A senha deve ter pelo menos 8 caracteres',
  'String should have at least 2 characters': 'O nome deve ter pelo menos 2 caracteres',
  'String should have at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
  'value is not a valid email address': 'Email inválido',
  'Field required': 'Campo obrigatório',
  'Convite nao encontrado': 'Convite não encontrado',
  'Convite não encontrado': 'Convite não encontrado',
  'Convite expirado': 'Este convite expirou',
  'Email ja cadastrado': 'Este email já está cadastrado',
  'Email já cadastrado': 'Este email já está cadastrado',
}

type ErrorLike = {
  response?: {
    data?: {
      detail?: unknown
      title?: string
      message?: string
      errors?: (string | { msg?: string; message?: string })[]
      code?: string
      request_id?: string
    }
    status?: number
  }
  message?: string
  code?: string
}

export function getApiErrorMessage(error: unknown, defaultMessage: string): string {
  const err = error as ErrorLike

  if (!err?.response) {
    if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.'
    }
    if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
      return 'O servidor demorou para responder. Tente novamente.'
    }
    return defaultMessage
  }

  const data = err.response.data

  // RFC 9457 / Problem details: errors list
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    const first = data.errors[0]
    if (typeof first === 'string') return errorMessages[first] || first
    if (first && typeof first === 'object') {
      const msg = first.msg || first.message
      if (msg) return errorMessages[msg] || msg
    }
  }

  const detail = data?.detail

  if (typeof detail === 'string') return errorMessages[detail] || detail

  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    const obj = detail as { message?: string; errors?: string[] }
    if (obj.errors?.length) return obj.errors[0]
    if (obj.message) return obj.message
  }

  if (Array.isArray(detail) && detail[0]?.msg) {
    return errorMessages[detail[0].msg] || detail[0].msg
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return errorMessages[data.message] || data.message
  }

  if (typeof data?.title === 'string' && data.title.trim()) {
    return data.title
  }

  const status = err.response.status
  if (status === 404) return 'Recurso não encontrado'
  if (status === 429) return 'Muitas tentativas. Aguarde um momento e tente novamente.'
  if (status && status >= 500) return 'Erro no servidor. Tente novamente mais tarde.'

  return defaultMessage
}
