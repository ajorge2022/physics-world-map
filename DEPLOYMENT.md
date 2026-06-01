# Deployment

Recommended free setup:

- GitHub repository: `ajorge2022/physics-world-map`
- App hosting: Vercel Hobby plan
- Database: Supabase Free plan
- Optional GitHub Pages redirect: `ajorge2022.github.io`

Current production URLs:

- App: `https://physics-world-map.vercel.app`
- GitHub Pages redirect: `https://ajorge2022.github.io`
- Supabase project URL: `https://exmlmghqsitpwhgvowld.supabase.co`

## 1. Supabase

Create a Supabase project, then run these files in SQL Editor:

1. `supabase/schema.sql`
2. `supabase/seed.sql` if you want fake public test data

Copy these values from Supabase:

- Project URL
- `service_role` key

## 2. Vercel

Import the GitHub repository into Vercel as a Next.js project.

Add these environment variables in Vercel Project Settings:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PHYSICS_MAP_ACCESS_PASSWORD=melquiades
PHYSICS_MAP_ADMIN_PASSWORD=replace-with-a-private-admin-password
NEXT_PUBLIC_APP_URL=https://physics-world-map.vercel.app
```

Redeploy after adding environment variables.

## 3. GitHub Pages Redirect

GitHub Pages cannot host the full app because the project uses server-side API routes.

To use `https://ajorge2022.github.io`, create a repo named `ajorge2022.github.io` and upload:

```text
github-pages-redirect/index.html
```

Change the Vercel URL inside that file if your final Vercel project URL is different.
