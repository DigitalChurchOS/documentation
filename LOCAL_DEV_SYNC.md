# Local Development Sync Guide

## Source of Truth
- Branch: codex/cloudflare-routing-clean
- Package manager: npm
- Dev command: npm run dev
- Preview URL: http://localhost:3000

## Before Switching Between AI Tools
1. Save all files.
2. Run `git status`.
3. Commit useful changes.
4. Pull latest changes in the other tool.
5. Stop old dev servers.
6. Restart the dev server from the project root.

## Standard Reset Command
```bash
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm ci
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

## Environment Requirements
- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`
- `VAULT_SECRET`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_TENANT_ID`

## Database Notes
Local SQLite database at `prisma/dev.db` is used for local development.
