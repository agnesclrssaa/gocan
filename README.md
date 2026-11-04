# GoCan

## Project structure

<<<<<<< HEAD
- `frontend/` contains the React/Vite app, dependencies, and Playwright E2E tests.
- `backend/` contains the Express/Prisma API and the existing Supabase SQL setup.
- The frontend test `.env` stays in the repository root; the backend uses its own ignored `backend/.env`.

## Express backend (SQLite)

The backend scaffold provides JWT register/login routes, authenticated order
routes, a database health check, and Prisma models. The initial setup has
already been run for this repository. For reference, these are the one-time
commands for a new backend folder:

```powershell
Set-Location backend
npm init -y
npm install express cors bcryptjs jsonwebtoken prisma @prisma/client dotenv
npx prisma init --datasource-provider sqlite
```

The repository already includes `prisma/schema.prisma`, `.env.example`, and
the initial migration. Do not rerun `npm init` or `prisma init` in this
existing folder. On a fresh checkout, create `.env` only if it does not exist,
set a private `JWT_SECRET` of at least 32 characters, then create/start the
database and API:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npx prisma migrate dev --name init
npm run dev
```

The API listens on `http://localhost:5000`. Available endpoints:

- `GET /api/health`
- `POST /api/auth/register` and `POST /api/auth/login`
- `GET /api/orders` (Authorization Bearer token required)

Order `items` are stored as JSON text in SQLite. This adds a standalone
replacement authentication API; the existing React app still calls Supabase
and needs a separate frontend integration before Supabase authentication can
be removed end-to-end. Order creation is intentionally not exposed yet: the
backend needs a trusted menu catalog to calculate `totalPrice` instead of
accepting prices from the browser.

## End-to-end tests

Install frontend dependencies and the Playwright Chromium browser:
=======
- `frontend/` contains the React/Vite app and Playwright E2E tests.
- `backend/` contains the Express API and Prisma models for the local SQLite database.

## Local API and database

The frontend uses the Express API for authentication, menus, checkout, order
history, and order tracking. Application data is stored in SQLite through
Prisma.

On a fresh checkout, create `backend/.env` from `backend/.env.example` if it
does not exist. Set a private `JWT_SECRET` of at least 32 characters, then run:

```powershell
Set-Location backend
npm install
npx prisma migrate deploy
npm run prisma:generate
npm run seed
npm run dev
```

The API listens on `http://localhost:5001`. Start the frontend in a second
terminal:
>>>>>>> 8466e8d987e5d2648f68fd3799c0a99c630dbd0a

```powershell
Set-Location frontend
npm install
<<<<<<< HEAD
npx playwright install chromium
```

The Playwright config reads `GOCAN_TEST_EMAIL` and `GOCAN_TEST_PASSWORD` from
the Git-ignored root `.env`. Run `backend/supabase/setup_latest.sql` in the
Supabase SQL Editor before testing to apply the schema, seed data, and RLS
policies. Alternatively, set the account credentials in PowerShell:

```powershell
$env:GOCAN_TEST_EMAIL = "your-test-account@email"
$env:GOCAN_TEST_PASSWORD = "your-test-password"
npx playwright test
```

Run `npx playwright test` from `frontend/`. Playwright starts Vite at
`http://127.0.0.1:4174`. The test creates a real order in the configured
Supabase project, so use a test account and project.

To create or confirm the dedicated test account without email confirmation,
add `SUPABASE_SERVICE_ROLE_KEY` to the root `.env`, then run from `frontend/`:

```powershell
npm run create:test-user
npx playwright test
```

Get the private `service_role` key from the Supabase project settings. Never
use a `VITE_` prefix for it, expose it in browser code, or commit/share it.
The script assigns the customer role and confirms the test account through
the Supabase Admin API.

To prepare a canteen account for the inbox test, run:

```powershell
npm run create:test-canteen-user
npx playwright test
```

This creates a confirmed test account, links it to Kantin Bu Siti, and stores
the credentials only in the ignored root `.env`. The Playwright suite then
checks that the customer order appears in the canteen inbox.
=======
npm run dev
```

Available API endpoints include:

- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/auth/me`
- `GET /api/canteens` and `GET /api/canteens/:id/menus`
- `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders`, and
  `POST /api/orders/:id/cancel`

Order items and delivery details are stored with each order in SQLite.
Order tracking refreshes from the API periodically.

## End-to-end tests

Install the Playwright Chromium browser once:

```powershell
Set-Location frontend
npx playwright install chromium
npm run test:e2e
```

The API must be running with a migrated and seeded SQLite database before
running the tests. The seed includes local test accounts; override their
credentials with `GOCAN_TEST_EMAIL`, `GOCAN_TEST_PASSWORD`,
`GOCAN_CANTEEN_TEST_EMAIL`, and `GOCAN_CANTEEN_TEST_PASSWORD` if needed.
>>>>>>> 8466e8d987e5d2648f68fd3799c0a99c630dbd0a
