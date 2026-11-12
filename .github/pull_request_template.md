## O que este PR faz

<!-- 2-3 frases: o problema e a solução. Closes #NN -->

## Como testar

<!-- Tela, passos, usuário de teste, se precisa de algum dado na API -->

## Checklist

- [ ] `npm run lint && npm run typecheck` passam
- [ ] Testado no Expo Go / emulador (Android e/ou iOS: diga qual)
- [ ] Estados de carregando, erro e vazio tratados
- [ ] Tipos em `src/types/api.ts` batem com o schema do koin-api
- [ ] `docs/PORTING.md` atualizado (se portou tela)

## Acessibilidade (#16)

- [ ] Todo elemento tocável tem `accessibilityRole` e `accessibilityLabel` (ícone sozinho também)
- [ ] Área de toque ≥ 44×44 pt / 48×48 dp (ou `hitSlop`)
- [ ] Cores do tema (`darkTheme`/`colors`), sem hexadecimal solto; texto pequeno com contraste ≥ 4,5:1
- [ ] A informação não depende só de cor (receita/despesa com sinal ou ícone; erro com texto)
- [ ] A tela funciona com a fonte do sistema no máximo (nada cortado ou sobreposto)
- [ ] Testado com TalkBack ou VoiceOver nas telas novas (se não deu, diga aqui)

## Prints

<!-- Antes/depois ou gravação curta -->
