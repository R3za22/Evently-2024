# Evently (2024)

An event-platform starter: landing page, header with sign-in state, mobile navigation, and the data layer for events, categories, users and orders.

> **Course project (unfinished).** Built in 2024 while following the "Evently" tutorial from JavaScript Mastery. The design, folder structure and the server actions and models under `lib/` come from the tutorial. This repo stops early: only the home page and the authentication shell are implemented; "Create Event" and "My Profile" are placeholders.

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui (Radix), Clerk (auth), MongoDB + Mongoose, Stripe, UploadThing.

## Run the real app

Needs your own Clerk, MongoDB, Stripe and UploadThing keys in `.env.local` (not included).

```sh
npm install
npm run dev
```

## Static demo

```sh
npm run build:demo   # writes dist-demo/ for /demos/evently/
```

What the demo is and is not:

- It is a static export of the pages that exist: home, sign-in/sign-up, and the two placeholder pages.
- Clerk is replaced by a stub (`demo/stubs/clerk.tsx`): the visitor is a pre-signed-in demo user and the sign-in pages say sign-in is disabled.
- The events list on the home page uses six fixture events (`demo/fixtures/events.json`) with generated SVG covers. The real app had no events list yet.
- MongoDB, Stripe and UploadThing code is not part of the demo bundle; no request leaves the demo origin.
- `app/api` and `middleware.ts` are moved aside during the build (a static export cannot include them) and restored afterwards.
- A dismissible banner is added to every page.

Assets: icons and images are the tutorial's starter files; fixture covers are generated for this repo.
