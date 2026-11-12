/**
 * Tipos gerados do OpenAPI do koin-api (`npm run api:types`, arquivo openapi.gen.ts).
 * Prefira estes aos tipos escritos à mão em api.ts: mudou o schema na API, o TypeScript acusa.
 *
 *   import type { Schemas } from '@/types/schemas'
 *   type Card = Schemas['CreditCardResponse']
 */
import type { components, operations, paths } from './openapi.gen'

export type Schemas = components['schemas']
export type { operations, paths }
