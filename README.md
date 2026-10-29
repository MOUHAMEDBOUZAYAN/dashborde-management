# 63 Agency — Client portal

Standalone Next.js app for clients of 63 Agency. It is separate from the internal dashboard. Each client will see only their own leads and the work done for them. Data comes from the existing NestJS API at `api.63agency.com`.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- axios, Zustand, React Hook Form, Zod, TanStack Query

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, copy the env file with:

```powershell
Copy-Item .env.example .env.local
```

Open [http://localhost:3000](http://localhost:3000).

`NEXT_PUBLIC_API_BASE_URL` is the NestJS origin (no trailing slash). The local default is `https://api.63agency.com`.

## Deploy

Same VPS approach as the internal dashboard: PM2 on its own port, nginx in front of a subdomain (for example `client.63agency.com`).

```bash
npm run build
pm2 start npm --name client-portal -- start -- -p 3001
```

Point the nginx server block for the subdomain at that port. Use a port that is not already taken by the internal dashboard.
