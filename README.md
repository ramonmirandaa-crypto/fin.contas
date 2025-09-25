## Financeito

Financeito é um gerenciador financeiro com autenticação gerenciada pelo [Clerk](https://clerk.com).

Para suporte adicional ou para conversar com a comunidade, acesse nosso [Discord](https://discord.gg/shDEGBSe2d).

To run the devserver:
```
npm install
npm run dev
```

### Autenticação Clerk

Configure as seguintes variáveis de ambiente (veja `.env.example`):

```
VITE_CLERK_PUBLISHABLE_KEY="pk_test_xxx"
CLERK_SECRET_KEY="sk_test_xxx"
VITE_API_BASE_URL="https://seu-worker.exemplo"
```

O `publishable key` é utilizado no front-end e o `secret key` mantém a validação de sessões no Worker.
`VITE_API_BASE_URL` é opcional; defina-o quando o Worker estiver hospedado em um domínio diferente para que o front-end consiga chamar a API.

### Prisma tooling

This project uses Prisma with a SQLite datasource stored under `prisma/dev.db`. To set it up locally:

1. Copy the environment template and adjust if needed:
   ```bash
   cp .env.example .env
   ```
2. Run database migrations (the `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` flag helps when engine checksums are unavailable):
   ```bash
   PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma migrate dev
   ```
3. Regenerate the Prisma client whenever the schema changes:
   ```bash
   PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
   ```

### Deploy no Dockploy

O repositório já contém um `Dockerfile` preparado para gerar uma imagem de produção a partir do projeto Vite + Worker. Esse `Dockerfile`
executa `npm ci --include=dev`, roda o build (`npm run build`) e, no estágio final, publica os artefatos em um servidor `vite preview`
expondo a aplicação na porta `4173`.

Para publicar no [Dockploy](https://app.dockploy.io):

1. Certifique-se de que as variáveis de ambiente abaixo estejam configuradas no painel da plataforma (seu valor será injetado na etapa de *build* ou execução conforme indicado):
   - **VITE_CLERK_PUBLISHABLE_KEY** (build): chave pública do Clerk, usada pelo front-end.
   - **CLERK_SECRET_KEY** (execução): chave secreta do Clerk, utilizada pelo Worker.
   - **VITE_API_BASE_URL** (build/opcional): URL pública do Worker quando hospedado fora do Dockploy.
   - **DATABASE_URL** (execução): string de conexão que o Prisma usará. Em produção utilize um banco persistente (por exemplo, PostgreSQL ou MySQL).
   - **OPENAI_API_KEY** (execução/opcional): requerido somente se as rotas de insights alimentadas por IA forem utilizadas.
   - **PLUGGY_CLIENT_ID** e **PLUGGY_CLIENT_SECRET** (execução/opcional): necessários para habilitar a integração com o Pluggy.
2. Crie uma nova aplicação do tipo “Dockerfile” no Dockploy apontando para este repositório. A plataforma detectará o `Dockerfile` na raiz.
3. Configure os comandos padrão caso queira executá-los manualmente:
   - Comando de build: `docker build --build-arg VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY --build-arg VITE_API_BASE_URL=$VITE_API_BASE_URL -t financeito .`
   - Comando de execução: `docker run -p 4173:4173 --env-file <arquivo-env> financeito` (no Dockploy a plataforma monta automaticamente a exposição da porta informada).
4. Defina a porta de exposição como `4173` (ou utilize a variável `PORT` que o Dockploy disponibiliza – o script `npm run preview` a reconhece automaticamente).

> **Dica:** Em ambientes locais com `NODE_ENV=production`, execute `npm install --include=dev` antes de rodar `npm run build` para garantir que as dependências de desenvolvimento (como o próprio Vite) sejam instaladas.
