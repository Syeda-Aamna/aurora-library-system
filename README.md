# Library Desk

A professional MERN library-management portal built with React, Express, Node.js and MongoDB/Mongoose. Readers can search a real bibliographic catalog and see only recorded stock; authorized staff manage titles, members and circulation from a protected workspace. The original Aurora Store website and project are separate and untouched.

## Reader and staff experience

- **Public catalog:** search by title, author, category or ISBN; see a verified publication year, real ISBN, cover where available and current copy availability.
- **Staff workspace:** secure administrator sign-in, collection and member CRUD, circulation, due dates, return history and dashboard metrics for total physical copies, titles, members, active issues, returns and available copies.
- **Inventory integrity:** new and starter-catalog entries can begin at zero copies. An issue is allowed only for a counted, available copy and a registered member; issue and return operations reconcile available quantities.
- **No fabricated activity:** no fictional members, demo loans, fake stock or in-memory administrator mode. When MongoDB is not connected, the reader view can show only known real bibliographic metadata with **zero copies** and an explicit metadata-only notice; the staff view explains which production settings are missing.

The six verified starter titles are listed in [`CATALOG_SOURCES.md`](./CATALOG_SOURCES.md). Their real ISBN editions were checked against Open Library; the Covers API currently supplies images for five titles, while *The Adventures of Sherlock Holmes* uses a neutral icon fallback. Each displayed `publicationYear` is the work's original publication year, clearly distinguished from later paperback reprints. No title implies that the library owns a physical copy.

## Run locally

```bash
npm install
cp .env.example .env
# Fill in private values in .env (never commit .env)
npm run dev
```

Vite is available at `http://localhost:5173`; the Express API is on `http://localhost:3001`. Configure a MongoDB database, a random `SESSION_SECRET` of at least 32 characters, and the staff email/password as environment variables. For a local site without a database, the public catalog still shows the verified title metadata at zero stock; production administrator sign-in and writes remain unavailable until required settings are configured. There is **no local demo login**.

On the first database connection, the API adds the six verified bibliographic records only if the database has no books, members or loans. Each starts with `quantity: 0` and `availableQuantity: 0`. Populated databases are never overwritten, no member/loan examples are inserted, and the one-time seed can be skipped with `SEED_STARTER_CATALOG=false`.

## Private production setup

For the separate Vercel project, configure these values in its encrypted **Production Environment** settings and redeploy:

- `MONGODB_URI`
- `SESSION_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Do not put credential values in source code, GitHub, screenshots or chat. Any credential already disclosed in chat should be rotated before production use. `GET /api/health` reports only non-secret configuration/connection booleans; it never returns environment-variable values.

## API

- **Public:** `GET /api/health`, `GET /api/auth/session`, `POST /api/auth/admin/login`, `POST /api/auth/logout`, `GET /api/public/books`
- **Administrator session required:** `GET /api/dashboard`; `GET|POST /api/books`; `PATCH|DELETE /api/books/:id`; `GET|POST /api/members`; `PATCH|DELETE /api/members/:id`; `GET|POST /api/loans`; `PATCH /api/loans/:id/return`

Sessions use signed, HTTP-only cookies with a 12-hour lifetime. Login is rate-limited. Public endpoints omit member contact details and all private circulation records. ISBNs and member email addresses are unique; records with active loans cannot be deleted, and book quantity cannot be reduced below the copies currently on loan.

## Data model

- **Book:** title, author, category, ISBN, total quantity, available quantity, publication year.
- **Member:** name, email, phone, address, membership date.
- **Loan:** book, member, issue date, due date, returned date and status.

## Build and deployment

```bash
npm run check
npm run build
```

`api/index.js` serves the Express REST API through the Vercel function; `vercel.json` preserves API paths, while Vite builds the React app. The live project uses the separate URL [aurora-library-system.vercel.app](https://aurora-library-system.vercel.app/); its URL/repository name does not change the neutral Library Desk branding inside the application.
