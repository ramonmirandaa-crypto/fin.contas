# Auditoria do banco de dados

## Stack e esquema atuais
- O Worker Hono utiliza exclusivamente o binding D1 com consultas SQL, e o esquema oficial está versionado em migrations D1 (`migrations/0001_initial.sql`).
- O template de variáveis agora define `DATABASE_URL` para um Postgres padrão (`postgresql://postgres:postgres@postgres:5432/fincontas?schema=public`), além das chaves do Clerk utilizadas tanto no front-end quanto no Worker.【F:.env.example†L1-L11】
- A configuração do Wrangler já vincula o binding `DB` a uma instância Cloudflare D1, garantindo a disponibilidade do banco no Worker.【F:wrangler.jsonc†L1-L20】

## Rotinas de persistência
- Todas as rotas do worker (contas, transações, orçamentos, metas, despesas, cartões etc.) agora utilizam consultas SQL diretas sobre `c.env.DB`.
- O bootstrap do esquema ocorre via migrations D1 oficiais e não há execução de `prisma migrate` no build do Worker.

## Configurações existentes
- O README documenta a preparação do Prisma com PostgreSQL (`docker run postgres:15`, `prisma migrate dev`, `prisma generate`) e orienta exportar `DATABASE_URL`, chaves Clerk, API base do Worker, Pluggy e OpenAI nos ambientes de build/execução.【F:README.md†L13-L88】
- Não há variáveis específicas para o D1 além do binding do Wrangler; a sincronização D1 ↔ Prisma depende de scripts internos do Worker.

## Lacunas e riscos identificados
1. **Fonte única de verdade** – Com as rotas migradas para D1 e migrations oficiais versionadas, o Worker e o banco compartilham o mesmo contrato de dados. Ainda é importante manter o esquema em SQL sincronizado com qualquer documentação ou artefatos restantes de Prisma para evitar confusão histórica.
2. **Ambiente Worker** – O uso de D1 elimina a dependência do Prisma Client no edge, mas continua necessário monitorar limites de armazenamento/consulta do D1 conforme o produto crescer.
3. **Ferramentas auxiliares** – Scripts e documentação que ainda mencionam Prisma (`DATABASE_URL`, `prisma migrate`, etc.) devem ser revisados para refletir o fluxo atual baseado em migrations D1.

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
