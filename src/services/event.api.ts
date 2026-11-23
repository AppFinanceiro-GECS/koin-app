import api from './api'
import type { Token } from '../types/api'
import type { Schemas } from '../types/schemas'

export type EventSignupStatus = Schemas['EventSignupStatus']

export interface EventSignupInput {
  code: string
  name: string
  email: string
  password: string
  accept_terms: true
  marketing_opt_in: boolean
}

// Cadastro pelo código do evento (stand). A conta já entra logada; o e-mail é confirmado depois.
export const eventApi = {
  signup: (data: EventSignupInput) => api.post<Token>('/auth/event-signup', data),
  status: () => api.get<EventSignupStatus>('/auth/event-signup/me'),
  verify: (code: string) => api.post<EventSignupStatus>('/auth/event-signup/verify', { code }),
  resend: () => api.post('/auth/event-signup/resend'),
  deliverGift: () => api.post<EventSignupStatus>('/auth/event-signup/gift'),
}
