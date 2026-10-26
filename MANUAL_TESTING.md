# 🧪 Manual Testing - Installments Integration

## 🚀 Quick Start

**✅ Status Atual**: Todos os erros TypeScript foram corrigidos! O app está rodando.

1. **Servidor de dev já está rodando**:
   ```bash
   npm start  # ou Ctrl+C e `npm start` se precisar reiniciar
   ```

2. **Abra em simulador/device**
   - iOS Simulator: `i`
   - Android Emulator: `a`
   - Web: `w`

3. **Navegue para Installments** (no menu principal ou na aba de Tabs))

---

## 📱 Test Cases

### Test 1: Listar Installments
**Objetivo**: Validar `GET /installments`

**Steps**:
1. Abra a tela de Installments
2. Espere o carregamento
3. Verifique se lista aparece

**Esperado**:
- ✅ Lista com 4+ séries
- ✅ Cada série mostra: descrição, valor total, status
- ✅ Sem erros no console

**Debug**:
- Abra DevTools (F12)
- Network tab → procure por `/installments` request
- Status deve ser 200 (ou fallback para mock)

---

### Test 2: Abrir Detalhe de Série
**Objetivo**: Validar `GET /installments/:id`

**Steps**:
1. Na lista, clique em qualquer série
2. Verifique a tela de detalhe

**Esperado**:
- ✅ Tela mostra dados completos:
  - Nome do estabelecimento
  - Descrição
  - Valor total e por parcela
  - Data da primeira parcela
  - Parcelas pagas vs pendentes
- ✅ Botões de ação disponíveis

**Debug**:
- Network tab → `/installments/:id`
- Verifique se `paid_count` e `remaining_count` conferem

---

### Test 3: Visualizar Parcelas
**Objetivo**: Validar `GET /installments/:id/details`

**Steps**:
1. Na tela de detalhe, role para ver lista de parcelas
2. Verifique cada parcela

**Esperado**:
- ✅ Lista mostra todas as parcelas:
  - Número (ex: Parcela 1 de 6)
  - Status (paga ✓ ou pendente)
  - Data esperada/de pagamento
- ✅ Parcelas pagas aparecem marcadas
- ✅ Parcelas pendentes aparecem normais

**Debug**:
- Network tab → `/installments/:id/details`
- Conte: `paid_count` deve ter checkmark ✓

---

### Test 4: Adiantar Parcela
**Objetivo**: Validar `POST /installments/mark-paid` e `POST /installments/create-future`

**Steps**:
1. Na tela de detalhe, clique no botão "Adiantar"
2. Tela abre: `/installments/:id/advance`
3. Selecione uma parcela futura
4. Clique em "Prosseguir"
5. Tela de confirmação: `/installments/:id/advance/confirm`
6. Revise os dados
7. Clique em "Confirmar adiantamento"
8. Aguarde tela de sucesso

**Esperado**:
- ✅ Após confirmar, tela de sucesso aparece
- ✅ Botão "Voltar para Série" funciona
- ✅ Dados atualizados na tela anterior:
  - `paid_count` incrementa
  - `remaining_count` decrementa
  - Novas parcelas criadas se necessário

**Debug**:
- Network → `POST /installments/mark-paid` (200)
- Network → `POST /installments/create-future` (200)
- Refreshe a página e verifique se mudanças persistem

---

### Test 5: Editar Série
**Objetivo**: Validar `PATCH /installments/:id`

**Steps**:
1. Na tela de detalhe, clique em "Editar"
2. Tela abre: `/installments/:id/edit`
3. Modifique:
   - Nome do estabelecimento (ex: "Tech Store" → "New Tech Store")
   - Descrição (ex: "Notebook" → "Notebook Gamer")
4. Clique em "Prosseguir"
5. Tela de revisão: `/installments/:id/edit/confirm`
6. Revise as mudanças
7. Clique em "Confirmar alterações"
8. Aguarde tela de sucesso

**Esperado**:
- ✅ Tela de confirmação mostra mudanças
- ✅ Após confirmar, tela de sucesso aparece
- ✅ Botão "Voltar para Série" funciona
- ✅ Mudanças persistem após recarregar

**Debug**:
- Network → `PATCH /installments/:id` (200)
- Compare valores antes/depois
- Verifique `updated_at` na resposta

---

## 🔴 Error Cases

### Test 6: Série Não Encontrada
**Steps**:
1. Navegue manualmente para: `/installments/99999` (ID inexistente)

**Esperado**:
- ✅ Mensagem de erro clara
- ✅ Botão para voltar funciona
- ✅ Sem crash de app

**Debug**:
- Console deve ter erro 404 ou fallback para mock

---

### Test 7: Sem Conexão
**Steps**:
1. Ative "Airplane Mode" no device
2. Tente carregar lista/detalhe

**Esperado**:
- ✅ App usa mock data (fallback)
- ✅ Sem crash, carrega dados

**Debug**:
- Console não deve ter erros críticos

---

## ✅ Integration Checklist

Complete os testes abaixo e marque:

### API Endpoints
- [ ] `GET /installments` - funciona (mock fallback)
- [ ] `GET /installments/:id` - funciona (mock fallback)
- [ ] `GET /installments/:id/details` - funciona (mock fallback)
- [ ] `POST /installments/mark-paid` - funciona
- [ ] `POST /installments/create-future` - funciona
- [ ] `PATCH /installments/:id` - funciona

### UI/UX
- [ ] Lista carrega sem erros
- [ ] Detalhe carrega sem erros
- [ ] Todas as telas navegam corretamente
- [ ] Dados atualizam após ações
- [ ] Mensagens de sucesso aparecem
- [ ] Erros são tratados graciosamente

### Data
- [ ] `paid_count` + `remaining_count` = `installment_count`
- [ ] `remaining_amount` = `installment_amount` × `remaining_count`
- [ ] Datas das parcelas calculadas corretamente
- [ ] Status das parcelas consistente

### Performance
- [ ] Sem lag ao carregar lista
- [ ] Sem lag ao abrir detalhe
- [ ] Sem lag ao confirmar ações

---

## 📊 Test Data

**Series Disponíveis (Mock)**:
| ID | Descrição | Estabelecimento | Parcelas | Pagas | Status |
|---|---|---|---|---|---|
| 1 | Notebook Dell | Eletrônicos Brasil | 12 | 5 | active |
| 2 | Monitor 27" | Tech Store | 6 | 2 | active |
| 3 | Geladeira | Brastemp | 10 | 3 | active |
| 4 | Fone de ouvido | Audio Pro | 3 | 0 | active |
| 5 | Teclado Mecânico | Periféricos Tech | 4 | 4 | completed |

---

## 🐛 Debugging Tips

### Ver Requisições
1. Abra DevTools (F12)
2. Network tab
3. Filter: "installments"
4. Veja: URL, método, status, payload, response

### Ver Estado do React Query
1. Instale React Query DevTools (se não estiver)
2. App deve ter ícone em canto da tela
3. Clique para ver cache state

### Ver Logs
1. DevTools → Console
2. Procure por "installments" em cores diferentes
3. Verifique se há errors/warnings

### Testar com curl (opcional)
```bash
# Listar
curl http://localhost:3000/api/installments

# Detalhe
curl http://localhost:3000/api/installments/1

# Detalhes de parcelas
curl http://localhost:3000/api/installments/1/details

# Marcar como pago
curl -X POST http://localhost:3000/api/installments/mark-paid \
  -H "Content-Type: application/json" \
  -d '{"series_id": 1, "up_to_installment": 6}'

# Editar
curl -X PATCH http://localhost:3000/api/installments/1 \
  -H "Content-Type: application/json" \
  -d '{"description": "New description"}'
```

---

## 🎯 Próximas Etapas

Após passar em todos os testes:
1. ✅ Integração validada
2. ✅ Mock data funcionando
3. ✅ Pronto para conectar ao backend real

Se algum teste falhar:
1. Verifique Network tab
2. Verifique Console para erros
3. Verifique se API endpoints existem no backend
4. Compare com `installmentService.ts`

