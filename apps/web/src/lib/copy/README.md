# Copy Module Conventions

This folder centralizes all UI microcopy used by the web app.

## Structure

- `navigation.ts` — navigation and route-action labels (`NAV_COPY`)
- `states.ts` — empty/not-found state labels and descriptions (`STATE_COPY`)
- `loading.ts` — loading titles (`LOADING_COPY`)
- `errors.ts` — error titles/descriptions/actions (`ERROR_COPY`)
- `cta.ts` — landing and CTA labels (`CTA_COPY`)
- `index.ts` — single public entrypoint for app imports

## Import Rule

Always import from the entrypoint:

- `import { NAV_COPY, ERROR_COPY } from "@/lib/copy";`

Avoid importing from domain files directly in app/components unless there is a strong technical reason.

This is enforced by ESLint (`no-restricted-imports`) in `apps/web/eslint.config.mjs`.

Additionally, CI runs a fast contract check with `npm run check:copy-imports` before the full quality gate.

## Editing Rule

When adding or changing text:

1. Update the correct domain file.
2. Keep keys stable and descriptive.
3. Prefer reusing existing keys over creating duplicates.
4. Validate with `npm --workspace @finalizabot/web run lint` and `npm --workspace @finalizabot/web run build`.

For a quick import-contract validation only, run `npm run check:copy-imports` from the repository root.
