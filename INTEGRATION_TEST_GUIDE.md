# 📋 Guia de Teste de Integração - Installments

## Endpoints do Backend

### 1. **Listar Séries de Installments**
- **Endpoint**: `GET /installments`
- **Params**: `status_filter`, `limit`
- **Hook**: `useInstallmentsList()`
- **Usado em**: Tela principal de installments

#### ✅ Teste:
```
1. Abra a tela de Installments (/installments)
2. Verifique se a lista de séries aparece
3. Teste o filtro de status (ativo/concluído)
4. Verifique se carrega com limite correto
```

---

### 2. **Obter Detalhes da Série**
- **Endpoint**: `GET /installments/:id`
- **Hook**: `useInstallmentDetail()`
- **Usado em**: Detalhe de série, confirmação de edição

#### ✅ Teste:
```
1. Clique em uma série na lista
2. Verifique se todos os campos aparecem:
   - description, merchant_name, total_amount
   - installment_count, paid_count, remaining_count
   - first_installment_date, status
3. Teste com série ativa e concluída
```

---

### 3. **Obter Detalhes de Parcelas**
- **Endpoint**: `GET /installments/:id/details`
- **Hook**: `useInstallmentDetails()`
- **Usado em**: Tela de detalhe (lista de parcelas)

#### ✅ Teste:
```
1. Na tela de detalhe, scroll para ver as parcelas
2. Verifique se aparece:
   - Número da parcela
   - Status (paga/pendente)
   - Data esperada / data de pagamento
   - ID da transação
3. Parcelas pagas devem estar marcadas
```

---

### 4. **Marcar Parcelas como Pagas**
- **Endpoint**: `POST /installments/mark-paid`
- **Payload**: `{ series_id, up_to_installment }`
- **Hook**: `useMarkInstallmentsPaid()`
- **Usado em**: Tela de adiantamento

#### ✅ Teste:
```
1. Vá para Adiantamento (/installments/:id/advance)
2. Selecione uma parcela futura para adiantar
3. Clique em "Confirmar adiantamento"
4. Verifique se:
   - paid_count aumenta
   - remaining_count diminui
   - remaining_amount diminui
   - Lista de parcelas atualiza
```

---

### 5. **Criar Parcelas Futuras**
- **Endpoint**: `POST /installments/create-future`
- **Payload**: `{ series_id, from_installment }`
- **Hook**: `useCreateFutureInstallments()`
- **Usado em**: Fluxo de adiantamento

#### ✅ Teste:
```
1. Ao confirmar adiantamento
2. Verifique se:
   - Novas parcelas são criadas
   - installment_count aumenta
   - remaining_amount permanece correto
3. Consulte GET /installments/:id/details para ver as novas
```

---

### 6. **Atualizar Série**
- **Endpoint**: `PATCH /installments/:id`
- **Payload**: `{ description, merchant_name, not_duplicate_with }`
- **Hook**: `useUpdateSeries()`
- **Usado em**: Tela de edição de série

#### ✅ Teste:
```
1. Vá para Editar (/installments/:id/edit)
2. Modifique description e/ou merchant_name
3. Clique em "Confirmar alterações"
4. Verifique se:
   - Valores são atualizados na API
   - Tela de sucesso aparece
   - Ao voltar, dados atualizados aparecem
```

---

## 🧪 Fluxos Completos de Teste

### Fluxo 1: Visualizar Série
```
1. Abrir app → Abrir Installments
2. Listar série (/installments list)
3. Clicar em uma série → Detalhe (/installments/:id)
4. Verificar dados, parcelas pagas/pendentes
```

### Fluxo 2: Adiantamento de Parcela
```
1. Detalhe de série (/installments/:id)
2. Clicar em "Adiantar" → /installments/:id/advance
3. Selecionar parcela → /installments/:id/advance/confirm
4. Confirmar adiantamento
5. Verificar sucesso → /installments/:id/advance/success
```

### Fluxo 3: Edição de Série
```
1. Detalhe de série (/installments/:id)
2. Clicar em "Editar" → /installments/:id/edit
3. Modificar dados → /installments/:id/edit/confirm
4. Revisar mudanças
5. Confirmar edição
6. Verificar sucesso → /installments/:id/edit/success
```

---

## 🔍 Checklist de Integração

### API Endpoints
- [ ] `GET /installments` - Lista de séries
- [ ] `GET /installments/:id` - Detalhe de série
- [ ] `GET /installments/:id/details` - Detalhes de parcelas
- [ ] `POST /installments/mark-paid` - Marcar como pago
- [ ] `POST /installments/create-future` - Criar parcelas futuras
- [ ] `PATCH /installments/:id` - Atualizar série

### React Query (Caching)
- [ ] `useInstallmentsList()` - Cache de lista
- [ ] `useInstallmentDetail()` - Cache de detalhe
- [ ] `useInstallmentDetails()` - Cache de parcelas
- [ ] Invalidação após `useUpdateSeries()`
- [ ] Invalidação após `useMarkInstallmentsPaid()`
- [ ] Invalidação após `useCreateFutureInstallments()`

### Telas
- [ ] `/installments` - Lista funcional
- [ ] `/installments/:id` - Detalhe funcional
- [ ] `/installments/:id/advance` - Adiantamento funcional
- [ ] `/installments/:id/advance/confirm` - Confirmação funcional
- [ ] `/installments/:id/edit` - Edição funcional
- [ ] `/installments/:id/edit/confirm` - Revisão funcional
- [ ] Telas de sucesso funcionando

### Erros & Edge Cases
- [ ] Série não encontrada (404)
- [ ] Erro ao atualizar (500)
- [ ] Sem permissão (403)
- [ ] Parcela já paga
- [ ] Sem parcelas futuras para adiantar

---

## 📊 Dados de Teste

**URL Base**: Verificar em `src/services/api.ts`

**IDs Disponíveis (mock data)**:
- ID 1: Notebook Dell (12x, 5 pagas)
- ID 2: Monitor 27" (6x, 2 pagas)
- ID 3: Geladeira (10x, 3 pagas)
- ID 4: Fone de ouvido (3x, 0 pagas)
- ID 5: Teclado (4x, 4 pagas - CONCLUÍDO)

---

## 🚀 Como Testar

### 1. **Ambiente**
```bash
npm start  # ou expo start
# Abra em simulador/device
```

### 2. **Debug**
```
- Redux DevTools: State de installments
- Network tab: Verifique requisições
- Console: Verifique erros
```

### 3. **Dados Real vs Mock**
- Se a API responder: usa dados reais
- Se falhar: usa mock data (veja `installmentService.ts`)

---

## 📝 Notas

- Todos os endpoints usam fallback para mock data
- React Query com `staleTime: 30s`
- Mutations invalidam toda a chave `INSTALLMENTS_QUERY_KEY`
- Endpoints confirmados em `installmentService.ts`

