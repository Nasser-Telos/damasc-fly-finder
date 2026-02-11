# Damascus Fly Finder

Flight search app for Damascus and Aleppo airports. Browse airlines, explore destinations, and search for flights — fully in Arabic with RTL support.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Supabase (database)
- TanStack React Query

## Local Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

## Environment Variables

Create a `.env` file:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
```

## Deployment

Deployed on Cloudflare Pages. Build settings:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js version | 18 (`NODE_VERSION=18`) |
