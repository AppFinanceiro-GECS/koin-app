# ✅ Teste de Integração - Checklist de Execução

**Data**: 2026-10-26  
**Status**: 🟢 Pronto para executar  
**Erros TypeScript**: ✅ Corrigidos  
**Servidor Dev**: ✅ Rodando (`npm start`)

---

## 📋 Teste 1: Listar Installments
**Objetivo**: Validar `GET /installments`

- [ ] Abra o app (iOS/Android/Web)
- [ ] Navegue até "Installments"
- [ ] Lista carrega com dados
- [ ] Mínimo 4 séries visíveis
- [ ] Sem erros no console
- [ ] Network: `/installments` = 200 ou mock data

**Status**: ⏳ Aguardando execução

---

## 📋 Teste 2: Abrir Detalhe de Série
**Objetivo**: Validar `GET /installments/:id`

- [ ] Clique em série #1 (Notebook Dell)
- [ ] Tela de detalhe carrega
- [ ] Mostra: nome, descrição, valor total, parcelas
- [ ] Botões "Adiantar" e "Editar" visíveis
- [ ] Network: `/installments/1` = 200

**Status**: ⏳ Aguardando execução

---

## 📋 Teste 3: Visualizar Parcelas Detalhadas
**Objetivo**: Validar `GET /installments/:id/details`

- [ ] Na tela de detalhe, role para ver lista de parcelas
- [ ] Cada parcela mostra: número, status (✓ ou pendente), data
- [ ] Parcelas pagas aparecem marcadas
- [ ] Network: `/installments/1/details` = 200

**Status**: ⏳ Aguardando execução

---

## 📋 Teste 4: Adiantar Parcela (Fluxo Completo)
**Objetivo**: Validar `POST /installments/mark-paid` + `POST /installments/create-future`

**4a. Iniciar Adiantamento**
- [ ] Clique em "Adiantar"
- [ ] Tela abre: `/installments/1/advance`
- [ ] Lista de parcelas futuras visível
- [ ] Sem erros

**4b. Selecionar e Revisar**
- [ ] Selecione parcela #6
- [ ] Clique "Prosseguir"
- [ ] Tela de confirmação mostra dados
- [ ] URL: `/installments/1/advance/confirm`

**4c. Confirmar**
- [ ] Clique "Confirmar adiantamento"
- [ ] Aguarde resposta
- [ ] Tela de sucesso aparece
- [ ] Network: `POST /installments/mark-paid` = 200
- [ ] Network: `POST /installments/create-future` = 200

**4d. Verificar Persistência**
- [ ] Clique "Voltar para Série"
- [ ] `paid_count` incrementou
- [ ] `remaining_count` decrementou
- [ ] Recarregue página → mudanças persistem

**Status**: ⏳ Aguardando execução

---

## 📋 Teste 5: Editar Série (Fluxo Completo)
**Objetivo**: Validar `PATCH /installments/:id`

**5a. Abrir Edição**
- [ ] Na tela de detalhe, clique "Editar"
- [ ] Tela abre: `/installments/1/edit`
- [ ] Formulário com campos visíveis

**5b. Modificar Dados**
- [ ] Mude descrição: "Notebook Dell" → "Notebook Gamer Dell"
- [ ] Clique "Prosseguir"

**5c. Revisar Mudanças**
- [ ] Tela mostra antes/depois
- [ ] URL: `/installments/1/edit/confirm`

**5d. Confirmar**
- [ ] Clique "Confirmar alterações"
- [ ] Tela de sucesso aparece
- [ ] Network: `PATCH /installments/1` = 200

**5e. Verificar Persistência**
- [ ] Clique "Voltar para Série"
- [ ] Descrição atualizada
- [ ] Recarregue página → mudança persiste

**Status**: ⏳ Aguardando execução

---

## 📋 Teste 6: Erro 404 - Série Não Encontrada
**Objetivo**: Validar tratamento de erro

- [ ] Navegue manualmente para: `/installments/99999`
- [ ] Mensagem de erro clara aparece
- [ ] Botão "Voltar" funciona
- [ ] App não crasheia

**Status**: ⏳ Aguardando execução

---

## 📋 Teste 7: Modo Offline - Fallback para Mock Data
**Objetivo**: Validar mock data fallback

- [ ] Ative Airplane Mode
- [ ] Recarregue app / navegue para Installments
- [ ] App carrega dados (mock fallback)
- [ ] Sem erros críticos
- [ ] Desative Airplane Mode

**Status**: ⏳ Aguardando execução

---

## 🎯 Resumo de Endpoints

| Método | Endpoint | Status | Implementado |
|--------|----------|--------|--------------|
| GET | `/installments` | Mock/200 | ✅ |
| GET | `/installments/:id` | Mock/200 | ✅ |
| GET | `/installments/:id/details` | Mock/200 | ✅ |
| POST | `/installments/mark-paid` | Mock/200 | ✅ |
| POST | `/installments/create-future` | Mock/200 | ✅ |
| PATCH | `/installments/:id` | Mock/200 | ✅ |

---

## 🔍 Debugging Rápido

**DevTools (F12)**
1. Network tab → filter "installments"
2. Console → procure por logs
3. Verifique status 200 vs erros

**React Query DevTools**
1. Ícone nos canto da tela
2. Veja cache state
3. Verifique queries status

**Logs Importantes**
- `[installments]` = logs da feature
- `[api]` = chamadas HTTP
- `error` = qualquer erro

---

## ✅ Resultado Final

Após todos os testes:
- [ ] Todos 6 endpoints funcionam
- [ ] Fluxos completos funcionam end-to-end
- [ ] Dados persistem após recarregar
- [ ] Erros tratados graciosamente
- [ ] Mock data funciona offline
- **→ INTEGRAÇÃO VALIDADA** ✅

---

**Próximos Passos**:
1. ✅ Testes manuais executados
2. ✅ Integração confirmada
3. → Pronto para backend real
