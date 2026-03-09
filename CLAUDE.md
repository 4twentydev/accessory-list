# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Accessory List Builder for Elward Systems — a Next.js 15 app for creating and managing accessory packing lists for construction job releases. Users authenticate via PIN, build lists of parts organized by system type (ACM panels, extrusions, hardware, sealants, etc.), and generate PDF packing slips.

## Commands

- **Dev server:** `pnpm dev` (uses Turbopack)
- **Build:** `pnpm build`
- **Lint:** `pnpm lint` (runs `biome check .`)
- **Lint + fix:** `pnpm lint:fix` (runs `biome check --write .`)
- **Install deps:** `pnpm install`

No test framework is configured.

## Architecture

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, better-sqlite3, Biome (linter/formatter)

**Path alias:** `@/*` maps to `./src/*`

### Key layers

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — Shared React components (dynamic-form, pin-pad, job-header, line-item-list, system-selector)
- `src/lib/` — Server-side utilities (db, schema, auth, pdf generation, inventory client)
- `src/types/index.ts` — All shared TypeScript interfaces
- `data/` — SQLite database files (gitignored, auto-created on first request)

### Data flow

1. **Auth:** PIN-based login → bcrypt verification → JWT session cookie (12h expiry). Roles: `admin`, `pm`, `handler`.
2. **Database:** SQLite via better-sqlite3 with lazy initialization. Schema auto-creates tables on first `getDb()` call. DB stored at `data/accessories.db`.
3. **Systems/Fields:** Each system type (ACM, SPL, HPL, DRY, PER, SRS, WET, HARDWARE, SEALANTS, RIVETS, MISC) defines dynamic fields stored in `system_fields`. The UI renders forms dynamically based on these field definitions.
4. **Lists:** Users build accessory lists with a job header + line items. Items store field values as JSON. Lists have statuses: draft → submitted → printed → shipped.
5. **PDF:** Server-side generation via jspdf/jspdf-autotable at `/api/pdf`.
6. **External inventory API:** `src/lib/inventory-client.ts` talks to `INVENTORY_API_URL` for stock checking and deduction.

### API routes (all under `src/app/api/`)

`auth`, `users`, `systems`, `parts`, `lists`, `import`, `inventory`, `pdf`

### Admin section

`/admin` — manage systems, parts, users, and bulk import. Only accessible to `admin` role users.

## Code Style

- Biome handles linting and formatting with **tab indentation**
- `useExhaustiveDependencies` is disabled
- `noArrayIndexKey` is off
- The `data/` directory is excluded from linting

## Environment Variables

- `JWT_SECRET` — Secret for signing JWT session tokens
- `INVENTORY_API_URL` — External inventory system base URL (default: `https://shop-inventory.4twenty.dev`)

Copy `.env.example` to `.env` to configure.
