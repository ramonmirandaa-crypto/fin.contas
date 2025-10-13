# FinContas

FinContas é um gerenciador financeiro moderno que combina um front-end React com um worker Hono/Cloudflare para processar dados, autenticação via Clerk e sincronização bancária com Pluggy. O projeto foi desenhado para rodar em ambientes serverless (Cloudflare Workers) ou como contêiner Docker pronto para implantação em provedores como o Dockploy.

## Funcionalidades em destaque
- Autenticação de usuários com Clerk (sign-in, sign-up e proteção de rotas).
- Sincronização de contas, transações, objetivos e orçamentos com base em PostgreSQL via Prisma.
- Conectores Pluggy para importar dados bancários (contas, transações e webhooks).
- Painéis e visualizações construídos com React, Tailwind CSS e componentes reutilizáveis.
- Worker Cloudflare responsável por APIs financeiras, agregações e webhooks.

## Stack tecnológica
- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) no front-end.
- [Hono](https://hono.dev/) executando como Cloudflare Worker (rota `/src/worker`).
- [Clerk](https://clerk.com/) para autenticação e gestão de sessão.
- [Prisma](https://www.prisma.io/) + PostgreSQL para persistência de dados.
- [Tailwind CSS](https://tailwindcss.com/) e [Headless UI](https://headlessui.com/) para UI.
- [Pluggy](https://pluggy.ai/) para integração bancária.

## Pré-requisitos
- Node.js 20.x (recomendado) e npm 10+
- Banco PostgreSQL 15 (local ou gerenciado)
- Docker (opcional) para subir serviços auxiliares rapidamente

## Configuração rápida
1. Clone o repositório e instale as dependências:
   ```bash
   npm install
   ```
2. Copie o arquivo de variáveis e ajuste os valores conforme seu ambiente:
   ```bash
   cp .env.example .env
   ```
3. Garanta que um PostgreSQL esteja disponível. Para subir um contêiner localmente:
   ```bash
   docker run --name fincontas-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=fincontas -p 5432:5432 -d postgres:15
   ```
4. Execute as migrations e gere o client do Prisma:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

## Executando localmente
- Inicie o modo desenvolvimento:
  ```bash
  npm run dev
  ```
- Rodando atrás de um proxy restritivo? Defina `VITE_CLOUDFLARE_INSPECTOR_DISABLED=true` antes de iniciar o dev server. É possível configurar a porta do inspector com `VITE_CLOUDFLARE_INSPECTOR_PORT`.

### Scripts úteis
- `npm run lint` – executa ESLint.
- `npm run build` – gera o bundle de produção (front-end + worker).
- `npm run preview` – executa o servidor de preview com o build gerado.
- `npm run check` – compila o TypeScript, builda o front-end e faz um dry-run do deploy Wrangler.
- `npm run cf-typegen` – atualiza os tipos de bindings do Cloudflare Worker.

## Variáveis de ambiente
| Variável | Contexto | Descrição |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | build/runtime | Chave pública do Clerk usada pelo front-end (Next/Vite). |
| `CLERK_SECRET_KEY` | runtime (worker) | Chave secreta do Clerk utilizada para validar sessões no Worker. |
| `VITE_CLERK_PUBLISHABLE_KEY` | build (opcional) | Apenas necessária caso scripts legados Vite ainda dependam dessa variável. |
| `VITE_API_BASE_URL` | build (opcional) | URL do worker quando hospedado fora do mesmo domínio do front-end. |
| `DATABASE_URL` | runtime | String de conexão PostgreSQL consumida pelo Prisma. |
| `OPENAI_API_KEY` | runtime (opcional) | Necessário para recursos de insights por IA. |
| `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` | runtime (opcional) | Credenciais para sincronização bancária via Pluggy. |

## Prisma & Banco de dados
- Para aplicar migrations em produção execute `npx prisma migrate deploy` apontando para o banco configurado.
- Utilize `npx prisma studio` para inspecionar dados localmente.
- O Worker garante o schema chamando `ensureDatabaseSchema` em cada request, evitando tabelas divergentes.

## Estrutura principal de diretórios
```
src/
├── app/                # Rotas e páginas do front-end React
├── components/         # Componentes compartilhados (UI)
├── react-app/          # Entrypoint SPA
├── shared/             # Tipagens compartilhadas entre app/worker
└── worker/             # Código do Worker Hono + integrações Pluggy/Prisma
```

## Deploy com Docker / Dockploy
O repositório possui um `Dockerfile` multi-stage que instala dependências (`npm ci --include=dev`), executa `npm run build` e publica os artefatos usando `vite preview` na porta `4173`.

Para publicar no [Dockploy](https://app.dockploy.io):
1. Configure as variáveis de ambiente (build/exec) no painel: `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_API_BASE_URL` (opcional), `DATABASE_URL`, `OPENAI_API_KEY` (opcional) e credenciais Pluggy.
2. Crie uma aplicação do tipo *Dockerfile* apontando para este repositório. O Dockploy detectará o arquivo automaticamente.
3. Comandos sugeridos:
   - Build: `docker build --build-arg VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY --build-arg VITE_API_BASE_URL=$VITE_API_BASE_URL -t fincontas .`
   - Execução: `docker run -p 4173:4173 --env-file <arquivo-env> fincontas`
4. Exponha a porta `4173` (ou utilize a variável `PORT` disponível na plataforma – o script `npm run preview` a detecta automaticamente).
5. Durante a inicialização, `npx prisma migrate deploy` é executado garantindo que o schema esteja atualizado antes de servir as requisições.

## Suporte e comunidade
Para dúvidas ou para conversar com a comunidade, participe do nosso [Discord](https://discord.gg/shDEGBSe2d).
