/**
 * O upload de um arquivo já enviado pelo mesmo usuário volta como
 * 409 { detail: { error: 'duplicate', document_id } }.
 * Devolve o id do documento original, ou null se o erro for outro.
 */
export function getDuplicateDocumentId(error: unknown): number | null {
  const response = (error as { response?: { status?: number; data?: { detail?: unknown } } })?.response
  if (response?.status !== 409) return null

  const detail = response.data?.detail
  if (detail && typeof detail === 'object') {
    const d = detail as { error?: string; document_id?: unknown }
    const id = Number(d.document_id)
    return Number.isInteger(id) && id > 0 ? id : null
  }
  return null
}
