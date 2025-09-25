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
