# AI Guidance for StudyGuild Frontend

This document is for AI agents and contributors working on this frontend.

Primary rule: keep the product easy to evolve. Favor clear React + TypeScript code, predictable data flow, and reusable UI building blocks over premature abstraction.

## 1) Project Snapshot

- Stack: React 19 + TypeScript + Vite
- Styling: Tailwind utilities and shared CSS classes in app styles
- Architecture:
  - App shell and routing-by-state in `src/App.tsx`
  - Page-level composition in `src/pages/`
  - Reusable UI pieces in `src/components/`
  - API calls and format helpers in `src/services/`
  - Domain types and form defaults in `src/types/`
  - i18n setup in `src/i18n/`

## 2) Core Product Flow

Current UX has two main screens:

- Homepage:
  - Loads and displays available reunions
  - Shows top-level stats
  - Navigates to reunion creation flow
- New Reunion Page:
  - Collects form data for a new reunion
  - Submits to backend and returns to Homepage on success

When extending behavior, preserve this flow unless the change request asks for a navigation redesign.

## 3) Code Organization Rules

When adding new code:

- Keep page composition in `src/pages/`; avoid large page logic in `src/App.tsx`.
- Put reusable and presentational UI in `src/components/`.
- Keep API/network logic in `src/services/`; do not fetch directly from UI components unless intentionally local.
- Keep DTO/domain/form types in `src/types/` and import them where needed.
- Prefer small pure helper functions over repeated inline transformations.

Avoid:

- Duplicating API response normalization in multiple components
- Mixing UI rendering with heavy data transformation when it can be extracted
- Ad-hoc global state for local page concerns

## 4) TypeScript and Data Safety

- Keep strict typing on API payloads and UI state.
- Narrow unknown API responses before usage.
- Preserve existing union types (`public | private`) and explicit payload fields for backend compatibility.
- Add types first when introducing new entities or endpoints.

## 5) API Integration Conventions

- Use `src/services/reunionsApi.ts` as source of truth for reunion-related calls.
- Keep `buildApiUrl` + proxy behavior intact for local dev and deploy environments.
- Parse non-2xx responses and expose useful messages to UI.
- When backend contracts change, update:
  - request/response types in `src/types/reunions.ts`
  - normalizers in `src/services/reunionsApi.ts`
  - impacted UI fields/messages

## 6) i18n Standards (Mandatory)

The app supports at least English (`en`) and Spanish (`es`).

Implementation baseline:

- i18n runtime initialization in `src/i18n/index.ts`
- Locale dictionaries in `src/i18n/locales/en.ts` and `src/i18n/locales/es.ts`
- UI strings must use translation keys through `react-i18next`

Rules:

- Do not hardcode user-facing strings in components.
- Add every new user-facing string to both locales.
- Reuse keys and keep naming hierarchical (`section.subsection.label`).
- Keep locale objects structurally aligned across languages.
- Use locale-aware formatting (`Intl`) for dates/times and numbers.
- Keep backend payload values language-agnostic (e.g. `visibility` values remain `public`/`private`).

## 7) UX and Accessibility Expectations

- Preserve responsive behavior for mobile and desktop.
- Keep interactive controls keyboard-accessible.
- Use semantic elements (`button`, `label`, `input`, `select`, `textarea`).
- Provide clear success/error states for async operations.

## 8) Styling and Visual Consistency

- Reuse established visual language (glass panels, rounded cards, shadow scale) unless redesign is requested.
- Prefer existing utility patterns and component-level class reuse.
- Avoid introducing a separate design system unless scope justifies it.

## 9) Change Checklist for AI Agents

Before coding:

- Identify impacted page/component/service/type files.
- Confirm whether change introduces new user-facing text (if yes, update i18n keys).

During coding:

- Keep concerns separated by folder convention.
- Update both English and Spanish locale files for each new string.
- Keep API and UI contracts type-safe.

After coding:

- Run lint/build when possible.
- Verify both languages render correctly.
- Verify success and error flows still behave correctly.

## 10) Preferred Extension Patterns

For new features:

1. Add types in `src/types/`.
2. Add or extend API functions in `src/services/`.
3. Build/extend components in `src/components/`.
4. Compose pages in `src/pages/`.
5. Wire app state transitions in `src/App.tsx`.
6. Add all labels/messages to both locale dictionaries.

## 11) Summary Rule

Choose the implementation that is easiest to understand for the next frontend engineer and easiest to localize without rewrites.