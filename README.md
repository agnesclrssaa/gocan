# GoCan

## Project structure

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

```powershell
Set-Location frontend
npm install
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
