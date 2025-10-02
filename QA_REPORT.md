# QA Report

## Escopo
- Repositório: `fin.contas`
- Objetivo: Verificar se todas as funcionalidades expostas na página principal funcionam e se o banco de dados está preparado para armazenar as informações acessadas pelos componentes.
- Data da verificação: 2025-10-02

## Sumário Executivo
- ❌ **Build falha**: `npm run build` não compila por causa do uso de `c.env.DB.batch(...)` sem verificação de existência.
- ⚠️ **UI expõe ações sem backend correspondente**: Diversos botões abrem overlays que dependem de endpoints não implementados (por exemplo, cadastro/edição de investimentos, empréstimos e operações de faturas de cartão).
- ❌ **Banco de dados incompleto**: O schema Prisma cria apenas tabelas básicas (accounts, transactions, budgets, goals); tabelas usadas pelos endpoints de cartões, investimentos, empréstimos e faturas não existem, causando falhas de persistência.

## Detalhes

### Estado do Build
- Com `NODE_ENV=production`, foi necessário reinstalar dependências incluindo dev para rodar o build (`npm install --include=dev`).
- A compilação TypeScript ainda falha porque `batch` é opcional no tipo `D1Database`; falta checagem antes de chamar o método. 【F:src/worker/index.ts†L1805-L1839】

### Ações no Front-end
- A página inicial possui diversos botões/atalhos que abrem overlays, cada um associado a componentes específicos (gestão de contas, cartões, investimentos, empréstimos, relatórios etc.). 【F:src/react-app/pages/Home.tsx†L320-L493】【F:src/react-app/pages/homeConfig.tsx†L91-L175】
- Componentes como `InvestmentManager`, `LoanManager` e `CreditCardManager` oferecem formulários de criação/edição e ações extras (vincular contas, sincronizar faturas) que dependem de chamadas `POST/PUT/DELETE`. 【F:src/react-app/components/InvestmentManager.tsx†L20-L100】【F:src/react-app/components/LoanManager.tsx†L23-L107】【F:src/react-app/components/CreditCardManager.tsx†L61-L198】
- O componente `CreditCardBillManager` chama rotas inexistentes (`/api/credit-card-bills/:id/transactions`, `/api/credit-card-bills/sync-pluggy`), portanto os botões correspondentes retornarão erro. 【F:src/react-app/components/CreditCardBillManager.tsx†L49-L109】

### Cobertura do Backend
- O worker implementa apenas `GET` para investimentos, empréstimos e faturas de cartão; não há rotas `POST/PUT/DELETE`, logo ações de criação/edição/remoção exibidas no front não funcionam. 【F:src/worker/index.ts†L782-L821】
- A ausência das rotas citadas resulta em `404` quando o front tenta salvar ou sincronizar dados desses módulos.

### Schema do Banco de Dados
- A migração inicial do Prisma cria somente `accounts`, `transactions`, `budgets` e `goals`. Não há criação de `credit_cards`, `investments`, `loans`, `credit_card_bills` ou tabelas auxiliares exigidas pelos endpoints. 【F:prisma/migrations/000000000000_init/migration.sql†L1-L185】
- Sem essas tabelas, operações como `INSERT INTO credit_cards` ou `SELECT * FROM investments` falharão no banco.

## Recomendações
1. Ajustar o worker para verificar `c.env.DB.batch` ou usar alternativa (`Promise.all`) antes de chamar o método, garantindo que o build passe.
2. Implementar rotas REST completas (`POST`, `PUT`, `DELETE`, `/sync`) para investimentos, empréstimos e faturas de cartão, alinhando o backend com o que o front consome.
3. Acrescentar migrações (ou inicialização em runtime) para criar as tabelas `credit_cards`, `investments`, `loans`, `credit_card_bills`, além de relacionamentos necessários.
4. Depois das correções, executar novamente `npm run build` e testes adicionais para validar o fluxo ponta a ponta.

## Comandos Executados
- `npm install`
- `npm install --include=dev`
- `npm run build` (falhou conforme descrito)

