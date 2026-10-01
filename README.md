# koin-app

[![CI](https://github.com/AppFinanceiro-GECS/koin-app/actions/workflows/ci.yml/badge.svg)](https://github.com/AppFinanceiro-GECS/koin-app/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

App mobile (Android/iOS) do **Koin** (antigo Biveto), gestão financeira pessoal. React Native com Expo.

A API e a infraestrutura ficam em **[koin-api](https://github.com/AppFinanceiro-GECS/koin-api)**.

## Rodar

Requisitos: Node 20+, app **Expo Go** no celular (ou emulador Android / simulador iOS) e a API rodando.

```bash
# 1. API (no repositório koin-api)
make up
make create-admin email=voce@exemplo.com senha='SenhaForte123' nome='Seu Nome'

# 2. App
npm install
npm start          # abre o QR code: leia com a câmera (iOS) ou com o Expo Go (Android)
```

Atalhos no terminal do Expo: `a` abre no emulador Android, `i` no simulador iOS, `w` no navegador.

### Qual API o app usa

| Situação | URL |
|---|---|
| `EXPO_PUBLIC_API_URL` definida (arquivo `.env` ou `eas.json`) | ela |
| Desenvolvimento sem variável | IP da máquina que roda o Metro, porta 8000 (funciona no celular na mesma Wi-Fi) |
| Fallback | `http://localhost:8000` |

A URL em uso aparece na aba **Perfil**. Para forçar outra: `cp .env.example .env` e preencha. Emulador Android com API em localhost: `http://10.0.2.2:8000`.

## Scripts

| Comando | O quê |
|---|---|
| `npm start` | Metro + QR code |
| `npm run android` / `npm run ios` / `npm run web` | abre direto na plataforma |
| `npm run lint` | ESLint (eslint-config-expo) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run doctor` | expo-doctor (dependências e config) |

## Testar a homologação no celular (equipe e cliente)

O CI publica o app com **EAS Update** (projeto [`@superappkoin/koin`](https://expo.dev/accounts/superappkoin/projects/koin)): todo merge na `main` vai para o canal `preview` (API de homologação), e todo PR ganha um comentário com o QR code da sua versão. Não precisa de Mac ligado nem de estar na mesma rede.

1. Peça ao Grupo 1 um convite para a organização `superappkoin` no expo.dev (papel *Viewer*) e um usuário na API de homologação.
2. Instale o **Expo Go** e entre com a sua conta Expo.
3. Abra `exp://u.expo.dev/9d8026b4-723d-4f73-87f2-16c484f8585e?channel-name=preview` no celular (ou o QR code do PR).

A versão de runtime segue o SDK (`exposdk:57.0.0`) para funcionar no Expo Go. Mudou o SDK ou entrou módulo nativo fora do Expo Go? A atualização deixa de abrir nas versões instaladas: é preciso um build novo (`eas build --profile preview`).

## Build e publicação (EAS)

```bash
npm i -g eas-cli && eas login
eas build --profile preview --platform android   # APK para instalar direto no celular
eas build --profile production --platform all    # AAB (Play Store) e IPA (App Store)
eas submit --platform ios                        # envia para o TestFlight/App Store Connect
```

Perfis em [`eas.json`](eas.json): `preview` usa a API de homologação e `production` a de produção. A URL fica na variável `EXPO_PUBLIC_API_URL` dos environments do EAS (`eas env:list --environment preview`); troque lá quando houver domínio próprio. Identificador do app: `com.koin.app` (Android e iOS). O app se chamava Biveto (`com.biveto.app`, citado no `assetlinks.json` da antiga PWA/TWA); como ainda não foi publicado com o nome novo, o Koin entra nas lojas como um app novo.

## Estrutura

```
src/
  app/                    rotas (expo-router, baseado em arquivos)
    _layout.tsx           providers + guard de autenticação (Stack.Protected)
    (auth)/               login, cadastro por convite
    (app)/(tabs)/         Início, Transações, Contas, Perfil
    (app)/transaction/    nova transação (modal)
  components/             Button, TextField, Card, Chip, StateView, TransactionRow
  services/               clientes da API por domínio (vieram do web; api.ts faz o refresh do JWT)
  stores/                 Zustand (authStore: tokens no Keychain/Keystore via expo-secure-store)
  lib/                    config da API, formatação, erros, JWT
  types/api.ts            tipos espelhando os schemas do koin-api
  schemas/, data/         validações zod e dados estáticos (bancos, bandeiras) herdados do web
  theme/                  cores e espaçamentos da marca
docs/
  PORTING.md              o que já foi portado do web e o que falta
  web-legado/             docs do frontend web antigo (referência)
```

## Estado atual

Pronto: login, cadastro por convite (`koin://invite?token=...`), sessão persistente com refresh automático do token, dashboard mensal, lista de transações (busca, filtro e paginação), nova transação (despesa/receita), contas e perfil/logout.

O restante das telas do web (cartões, faturas, upload de documentos, orçamento, metas, chat...) está listado em **[docs/PORTING.md](docs/PORTING.md)**. Os `services/` de todos esses domínios já estão aqui, então portar uma tela é basicamente escrever a UI.

## Stack

Expo SDK 57, React Native 0.86, TypeScript, expo-router, TanStack Query, Zustand, axios, zod.

## Licença

[MIT](LICENSE)
