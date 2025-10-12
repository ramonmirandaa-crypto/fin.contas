# Auditoria do banco de dados

## Stack e esquema atuais
- O projeto usa Prisma com provider `sqlite` e espera a URL do banco em `DATABASE_URL`, definindo modelos para contas, transações, orçamentos, metas, despesas, configurações de usuário e webhooks.【F:prisma/schema.prisma†L1-L288】
- O template de variáveis expõe `DATABASE_URL` apontando para `file:./prisma/dev.db`, além das chaves do Clerk utilizadas tanto no front-end quanto no Worker.【F:.env.example†L1-L11】
- O Worker Hono inicializa um banco D1 via `ensureDatabaseSchema`, criando e migrando tabelas diretamente com SQL para as mesmas entidades do Prisma e para coleções adicionais como `credit_cards`, `investments`, `loans`, `credit_card_bills` e `transaction_categories`.【F:src/worker/index.ts†L48-L411】
- A configuração do Wrangler já vincula o binding `DB` a uma instância Cloudflare D1, garantindo a disponibilidade do banco no Worker.【F:wrangler.jsonc†L1-L20】

## Rotinas de persistência
- As rotas de contas, transações, orçamentos e metas utilizam o `PrismaClient` para ler e gravar dados (`findMany`, `create`, `updateMany`, `deleteMany`).【F:src/worker/index.ts†L1287-L1417】【F:src/worker/index.ts†L1638-L1712】
- Rotinas de despesas, cartões, investimentos, empréstimos, categorias, configurações de Pluggy e webhooks usam consultas SQL diretas no binding D1 (`c.env.DB.prepare(...).run()/all()`), coexistindo com o uso do Prisma nas mesmas APIs.【F:src/worker/index.ts†L1140-L1515】【F:src/worker/index.ts†L2093-L3128】
- O Dockerfile de produção executa `npx prisma migrate deploy` antes de servir o bundle, assumindo que a aplicação terá acesso a um banco compatível com o Prisma na inicialização.【F:Dockerfile†L1-L22】

## Configurações existentes
- O README documenta a preparação do Prisma local (`prisma migrate dev`/`generate`) e orienta exportar `DATABASE_URL`, chaves Clerk, API base do Worker, Pluggy e OpenAI nos ambientes de build/execução.【F:README.md†L13-L71】
- Não há variáveis específicas para o D1 além do binding do Wrangler; a sincronização D1 ↔ Prisma depende de scripts internos do Worker.

## Lacunas e riscos identificados
1. **Duas fontes de verdade para o esquema** – O Worker recria tabelas manualmente enquanto o Prisma mantém migrations separadas. Tabelas exclusivas do D1 (`credit_cards`, `investments`, etc.) não existem no schema Prisma, o que impede que `prisma migrate` replique essa estrutura em bancos externos.【F:src/worker/index.ts†L222-L347】【F:prisma/schema.prisma†L200-L288】
2. **Incompatibilidade de tipos** – `user_configs` armazena `created_at/updated_at` como `TEXT` na migração D1, enquanto o Prisma espera `DateTime`, o que pode gerar dados inválidos ao compartilhar o mesmo banco entre as duas camadas.【F:src/worker/index.ts†L371-L379】【F:prisma/schema.prisma†L227-L236】
3. **Ambiente Worker x Prisma** – Cloudflare Workers não suportam conexões SQLite locais; para usar Prisma é necessário apontar `DATABASE_URL` para um provedor acessível via HTTP (PostgreSQL/MySQL com Prisma Accelerate/Data Proxy). Caso contrário as rotas que usam `prisma.*` falharão no deploy edge, embora partes baseadas em D1 continuem funcionando.
4. **Migração de schema parcial** – `ensureDatabaseSchema` adiciona colunas via `ALTER TABLE` em tempo de execução (`addOptionalColumn`), escondendo evoluções de schema fora do controle do Prisma e dificultando reproduzir o estado do banco em outros ambientes.【F:src/worker/index.ts†L417-L448】

## Recomendações e opções de integração
1. **Padronizar no Cloudflare D1**
   - Migrar rotinas de contas/transações/orçamentos/metas para usar o binding D1 (ou adotar o `@prisma/adapter-d1` recém-lançado) e consolidar o schema SQL num único lugar.
   - Gerar migrations D1 explícitas (via `wrangler d1 migrations`) em vez de aplicar `ALTER TABLE` em tempo de execução.
   - Ajustar tipos (`DATETIME`) para manter compatibilidade entre análises e ferramentas.
   - Indicado se o alvo principal for o Worker edge e a carga transacional couber nos limites do D1.

2. **Padronizar no Prisma + banco gerenciado**
   - Escolher um provedor relacional (PostgreSQL/MySQL) e usar Prisma Accelerate/Data Proxy para permitir que o Worker faça chamadas HTTP para o banco, evitando limitações de TCP.
   - Reescrever as rotinas atualmente em SQL direto para usar modelos Prisma e incluir as novas tabelas (`credit_cards`, `investments`, etc.) no schema.
   - Remover o bootstrap manual `ensureDatabaseSchema` e confiar nas migrations do Prisma para qualquer ambiente (Docker, CI, produção).
   - Indicado se precisar de consultas complexas, integrações BI ou escalabilidade além dos limites do D1.

3. **Híbrido controlado (menos recomendado)**
   - Manter D1 apenas para funcionalidades desconectadas enquanto contas/transações vivem em outro banco. Isso exige sincronização explícita e aumenta a complexidade operacional; só considere se houver justificativa forte para manter dados separados.

Em todos os cenários, escolha uma fonte única para o schema e alinhe as migrations e rotinas de escrita a essa decisão. Hoje a mistura de Prisma e SQL manual pode gerar divergências difíceis de depurar.
