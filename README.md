# Aurora Library Management System

A MERN library desk built with React, Express, Node.js and MongoDB/Mongoose. The first screen offers a public reader catalog or administrator sign-in. Visitors can browse a privacy-limited catalog; member records, inventory editing, dashboard metrics and circulation operations require an administrator session.

## Run locally

```bash
npm install
cp .env.example .env
# Set MONGODB_URI, SESSION_SECRET, ADMIN_EMAIL, and ADMIN_PASSWORD in .env
npm run dev
```

Vite runs at `http://localhost:5173`; the Express API runs at `http://localhost:3001`. Keep `.env` private and never commit it. Use a fresh 32+ character `SESSION_SECRET` and a strong administrator password.

To try the complete fictional librarian demo without MongoDB, run `DEMO_MODE=true SESSION_SECRET="$(openssl rand -hex 32)" npm run dev` with no `MONGODB_URI`. This is a non-production preview mode; the UI marks it clearly and its changes live only in the current API process. For an HTTPS-hosted preview that proxies this local server, also set `PUBLIC_HTTPS_PREVIEW=true` so the administrator session cookie uses `Secure; SameSite=None`. The production service never allows demo login.

The visual identity and logo use the user's original [Aurora Store site](https://my-project-evrj.vercel.app/) as a read-only reference; no changes are made to that original website or project.

## Sample library data

On the first API request, the app seeds a **fictional demo library** only if the MongoDB database has no books, members, or loans. It creates six clearly marked imaginary titles, three test-only members, one active sample loan and one returned sample loan so the catalog, dashboard, inventory counts and circulation screens have example activity. Sample emails use the reserved `.test` domain. The seed is recorded once; deleting the samples later will not make them reappear. To disable first-run seeding, set `SEED_DEMO_DATA=false` before the first API request.

For a **fully interactive local preview**, set `DEMO_MODE=true` with no `MONGODB_URI` and run outside production. The API then uses the same REST paths for in-memory fictional books, members and loans, and the staff sign-in screen offers **Enter librarian demo**. Add/edit/delete, issue/return, stock counts, validation, search and dashboard summaries all work; changes last for the lifetime of that preview process and reset when it restarts. Demo access is disabled automatically in production and whenever MongoDB is configured. If demo mode is off and MongoDB is absent, the public reader page still shows a clearly labeled read-only fallback; administrator writes require the database.

## API

- Public: `GET /api/health`, `GET /api/auth/session`, `POST /api/auth/admin/login`, `POST /api/auth/admin/demo-login` (interactive non-production demo only), `POST /api/auth/logout`, `GET /api/public/books`
- Administrator session required: `GET /api/dashboard`; `GET|POST /api/books`, `PATCH|DELETE /api/books/:id`; `GET|POST /api/members`, `PATCH|DELETE /api/members/:id`; `GET|POST /api/loans`, `PATCH /api/loans/:id/return`

Admin sessions are signed, HTTP-only cookies with a 12-hour lifetime. Login credentials and the signing secret are runtime environment variables. The public book endpoint returns only catalog fields, never member contact details or private circulation records.

Issue/return endpoints adjust available inventory and guard against over-issuing, duplicate returns, quantity reductions below checked-out copies, and deletion of records with active loans. ISBNs and member emails are unique.

## Deploy

Create a new Vercel project linked to this repository and add `MONGODB_URI`, `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` as private server environment variables. `api/index.js` serves the Express API through a Vercel function; `vercel.json` preserves REST paths, and Vite builds the React frontend. Configure these values only in the host’s encrypted environment or a local ignored `.env` file.

## Data model

Book: title, author, category, ISBN, quantity, availableQuantity and publicationYear. Member: name, email, phone, address and membershipDate. Loan: book, member, issuedAt, dueAt, returnedAt and status.
