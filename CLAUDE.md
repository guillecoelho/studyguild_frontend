# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server (proxies /api and /ws to localhost:8000)
npm run build     # tsc + vite build
npm run lint      # eslint
npm run preview   # preview production build
```

No test runner configured.

## Architecture

React 19 + TypeScript + Vite. Tailwind v4 (via `@tailwindcss/vite` plugin, no config file).

**`src/App.tsx`** — single root component. Owns all shared state (auth, reunions, flash messages) and passes callbacks down as props. Routing via `react-router-dom` v7 `<Routes>`. All page-level state lives here unless it's purely local to one page.

**`src/pages/`** — page composition only; no direct API calls.

**`src/components/`** — reusable UI pieces.

**`src/services/`** — all API/network logic.
- `fetchWithAuth.ts` — wraps `fetch`, intercepts 401s, silently refreshes JWT, retries once. Fires `sessionexpired` window event when refresh fails.
- `tokenStore.ts` — JWT in `localStorage` (`sg_access`, `sg_refresh`). Use `authHeader()` to get the `Authorization` header.
- `reunionsApi.ts` / `authApi.ts` / `newsletterApi.ts` / `issueReportsApi.ts` — domain-specific calls.

**`src/types/`** — DTO and domain types. Define types here first before writing service or UI code.

**`src/i18n/`** — i18next setup. Locales at `src/i18n/locales/en.ts` and `es.ts`. Keys are hierarchical (`section.subsection.label`). Both locale files must stay structurally aligned.

## Key Conventions

**API URL**: `VITE_API_BASE_URL` for production; in dev, Vite proxies `/api` → `http://localhost:8000` and `/ws` → `ws://localhost:8000`, so `API_BASE_URL` is `''` in dev. The `buildApiUrl(path)` helper in each service handles both environments.

**WebSocket**: native `WebSocket` (not ActionCable). `subscribeToReunionMessages` in `reunionsApi.ts` manages the WS connection for reunion chat.

**Auth flow**: JWT access+refresh tokens in localStorage. `App.tsx` listens for the `sessionexpired` custom event to clear `currentUser`.

**i18n is mandatory**: every user-facing string must use `useTranslation` / `t()` and be added to both `en.ts` and `es.ts`. Never hardcode UI strings.

**New feature order**: types → service → component → page → App.tsx wiring → both locale files.
