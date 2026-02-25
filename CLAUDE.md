# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Damascus Fly Finder — an Arabic-language (RTL) flight search app for Damascus and Aleppo airports. Built with React + TypeScript frontend and Cloudflare Pages Functions backend, using the Amadeus API for live flight data.

## Commands

```sh
npm run dev          # Vite dev server (port 8080, frontend only)
npm run dev:full     # Full stack: Wrangler Pages Functions + Vite (API on 8788, frontend on 8080)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest in watch mode
```

For full-stack development (when working on `functions/` or anything that calls `/api/*`), use `npm run dev:full`. Frontend-only changes can use `npm run dev`.

## Architecture

### Frontend (src/)
- **React 18 + Vite** with SWC compiler, path alias `@/` → `./src/`
- **Pages** (`src/pages/`): Route components — Index, Search, Explore, Airlines, Book
- **Hooks** (`src/hooks/`): Each major feature has a hook wrapping TanStack React Query (useFlightSearch, useFlightCalendar, useBooking, useBookingOptions)
- **API client** (`src/lib/api.ts`): All backend calls go through typed functions here. Throws `FlightSearchError` with status codes
- **Data mapping** (`src/lib/flightMapper.ts`): Transforms raw Amadeus API responses into `LiveFlight` UI types
- **UI components**: shadcn/ui (in `src/components/ui/`) configured via `components.json`. Domain components in `src/components/flight/` and `src/components/layout/`
- **State**: React Context for currency (CurrencyContext with localStorage persistence), TanStack React Query for server state (5-min stale for flights, 10-min for calendar)

### Backend (functions/api/)
Cloudflare Pages Functions — each file is a serverless endpoint:
- `flights.ts` — flight search (POST, calls Amadeus flight offers)
- `calendar.ts` — price calendar per route
- `booking-options.ts` — single offer pricing
- `book.ts` — create a booking order
- `geo.ts` — geolocation via Cloudflare headers
- `_amadeus.ts` — shared Amadeus API client (OAuth token management, CORS headers, response helpers)

All endpoints use `amadeusFetch()` from `_amadeus.ts` for authenticated Amadeus API calls. The `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET` env vars are required (set in `.dev.vars` locally, Cloudflare dashboard for production). Optionally set `AMADEUS_API_URL` to override the base URL (defaults to `https://test.api.amadeus.com`; set to `https://api.amadeus.com` for production).

### Data Flow
Frontend → `/api/*` (proxied via Vite in dev) → Cloudflare Function → Amadeus API → response mapped by `flightMapper.ts` → rendered in page components via React Query hooks.

### Routing
React Router v6: `/` (home), `/search` (results), `/explore/:airportCode` (calendar), `/airlines`, `/book/:offerId`.

## Key Conventions

- **All user-facing text is Arabic.** Error messages, labels, formatting — everything. Use Arabic strings, not English.
- **RTL layout.** The HTML root is `dir="rtl" lang="ar"`. CSS and component layout must respect RTL.
- **Currency handling**: Three currencies (USD, AED, SAR) with distinct formatting rules in `src/lib/currency.ts` and `src/lib/formatters.ts`. Currency symbol placement varies ($ before amount, ر.س after).
- **Fonts**: Inter (Latin), Tajawal and Cairo (Arabic) — defined in Tailwind config.
- **Types** are in `src/types/flight.ts` — this is the single source of truth for Flight, booking, and API types.
- **TypeScript config** is loose (`noImplicitAny: false`, `strictNullChecks: false`).

## Environment Variables

**Frontend** (`.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
**Backend** (`.dev.vars`): `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`, optionally `AMADEUS_API_URL`

## Deployment

Cloudflare Pages with Node 18. Build output in `dist/`. Functions auto-deployed from `functions/` directory.
