# Repository Guidelines

Refer to [README.md](README.md) for product overview and environment setup context.

## Project Structure & Module Organization
- `app/`: Next.js App Router entry, including `layout.tsx`, `page.tsx`, and `globals.css`.
- `components/`: shadcn/ui primitives and feature fragments; keep new UI in matching subfolders.
- `lib/`: scoring, security, performance helpers—extend existing utilities rather than cloning logic.
- `src/ai/`: agent orchestration (`agents/`, `services/`, `utils/`) plus shared types; follow runbook patterns.
- `backend/`: FastAPI service powering live mode; align with `backend/README.md` for API changes.
- `__tests__/`: Jest suite mirroring core modules with lightweight fixtures.

## Build, Test, and Development Commands
- `npm run dev`: start the Next.js dev server on `localhost:3000`.
- `npm run build`: compile the production bundle and surface TypeScript errors.
- `npm run start`: serve the compiled app for smoke checks.
- `npm run lint` / `npm run type-check`: enforce ESLint (Next config) and strict TS before committing.
- `npm run test`, `npm run test:watch`, `npm run test:coverage`: run the Jest suite, watch mode, and coverage.
- `npm run warp-setup`: full validation pipeline; run before handing work to another contributor.

## Coding Style & Naming Conventions
- TypeScript-first with functional React components, two-space indentation, and absolute imports via `@/`.
- Component files use PascalCase (e.g., `IdeaScoreCard.tsx`); hooks/utilities stay camelCase.
- Prefer Tailwind utility classes; reserve `app/globals.css` for shared tokens.
- ESLint (`next lint`) governs formatting; there is no standalone Prettier profile.

## Testing Guidelines
- Write Jest specs in `__tests__/` using `*.test.ts`; mock outbound APIs with `jest.mock`.
- Use Testing Library (`@testing-library/jest-dom`) for UI assertions; avoid brittle snapshots when markup shifts.
- Cover scoring, security, and agent orchestration paths whenever modifying `lib/` or `src/ai/`.

## Commit & Pull Request Guidelines
- Follow history: leading emoji plus an imperative summary (e.g., `✨ Add scoring edge cases`).
- Reference related docs or issues in the body and link generated assets when relevant.
- PRs should describe impact, list validation commands run, and add screenshots/GIFs for UI updates.
- Keep feature branches rebased and ensure `npm run warp-setup` passes before requesting review.

## Security & Configuration Tips
- Store secrets in `.env.local` (frontend) or `backend/.env`; `.gitignore` already blocks common patterns.
- Update environment notes in `backend/README.md` when backend endpoints change; mention required services (Postgres, Redis).
- Sanitize user input through `lib/security.ts` to stay aligned with hardened defaults.
