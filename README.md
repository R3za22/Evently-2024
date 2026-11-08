# Evently

An event platform: discover events (search, category filter, pagination), event pages with related events, create/edit events with an image upload, ticket checkout, "My tickets" (attending and organised), an organiser orders dashboard, sign-in, and a Persian/RTL home page.

> Based on the JSM (JavaScript Mastery) Evently tutorial. The data model and the original server actions come from the tutorial; the redesign ("Box Office"), the mock data layer, the security fixes, validation, tests and e2e flows are my own work.

**Stack:** Next.js 14.2 (App Router), TypeScript, Tailwind, Clerk, MongoDB/Mongoose, Stripe, uploadthing, zod, Vitest, Playwright.

## Run modes

| Mode | How | Needs |
|---|---|---|
| Mock (default for demo/tests) | `npm run dev:mock` | nothing: seeded events, categories and orders in localStorage, a mock sign-in, simulated Stripe, mocked upload |
| Live | `npm run dev` | `.env.local` from `.env.example` (Clerk, MongoDB, Stripe, uploadthing) |
| Static demo | `npm run build:demo` -> `dist-demo/` (base path `/demos/evently/`) | nothing |

`NEXT_PUBLIC_API_MODE=mock` selects the mock adapter (`lib/api/mock`) and mock auth (`lib/auth/mock.tsx`); otherwise the live adapter wraps the server actions in `lib/actions`. Simulated payments: card `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` is declined. "Reset demo data" is on the About & privacy page.

## Security fixes (server actions)

- The acting user comes from the Clerk session (`lib/server/session.ts`), never from client input; update/delete/orders check ownership.
- Checkout reads the price from the database; the client only names the event.
- Search and category regexes are escaped; ids and inputs are validated with zod.
- `clerkMiddleware` protects `/events/create`, `/events/edit`, `/tickets`, `/orders`, `/checkout`.
- `/api/webhook/stripe` verifies the Stripe signature on the raw body; the Clerk webhook uses the raw body too. User/order write helpers are no longer callable as server actions.

## Scripts

`npm test` (unit), `npm run test:e2e` (Playwright, mock mode), `npm run lint`, `npm run typecheck`, `npm run build`, `npm run build:demo`.
