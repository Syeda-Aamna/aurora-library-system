# Aurora Library Management System

A MERN library desk built with React, Express, Node.js and MongoDB/Mongoose. It includes book and member registers, circulation, stock-aware issue/return workflows, and dashboard totals. This repository is intentionally separate from the pre-existing Aurora landing-page repository and deployment.

## Run locally

```bash
npm install
cp .env.example .env
# Set MONGODB_URI to a MongoDB Atlas or local MongoDB URI in .env
npm run dev
```

Vite runs at `http://localhost:5173`; the Express API runs at `http://localhost:3001`. The app expects a reachable MongoDB database. Do not commit `.env` or put database secrets in frontend variables.

## API

- `GET /api/health`, `GET /api/dashboard`
- `GET|POST /api/books`, `PATCH|DELETE /api/books/:id`
- `GET|POST /api/members`, `PATCH|DELETE /api/members/:id`
- `GET|POST /api/loans`, `PATCH /api/loans/:id/return`

Issue/return endpoints update available inventory and block over-issuing, duplicate returns, quantity reductions below checked-out copies, and removal of records with active loans. ISBNs and member emails are unique.

## Deploy to Vercel

Import this repository as a new Vercel project and add `MONGODB_URI` as an encrypted server environment variable for the environments you intend to use. The Express handler in `api/index.js` serves `/api/*`; the built Vite app serves all other paths. Never reuse or edit the existing Vercel project unless the owner explicitly requests it. The repository includes `vercel.json` for API and SPA routes.

## Data model

Book: title, author, category, ISBN, quantity, availableQuantity and publicationYear. Member: name, email, phone, address and membershipDate. Loan: book, member, issuedAt, dueAt, returnedAt and status.
