# Aurora Store Library Desk — Implementation Plan

## Scope and architecture
A public, separate MERN library-management application linked to the user's new repository and (once access is available) its own Vercel project. The original Aurora Store website, repository, branding asset source and deployment are read-only references; they must not be changed. React/Vite uses the Express REST API. Production and any configured database use Mongoose/MongoDB for persistent books, members and circulation records. An explicitly opt-in, non-production `DEMO_MODE` with no `MONGODB_URI` uses a process-local fictional store behind the same REST routes so visitors can test librarian workflows without touching real data. Demo changes are ephemeral and labeled; the in-memory path is never used in production.

## Project structure
- `src/`: role selection, public catalog, protected librarian UI, forms, state and API client.
- `api/`: Express app, Mongoose models/routes/auth and isolated demo-only route store; Vercel function entry point.
- `shared/demo-data.js`: common fictional catalog/member examples used by the reader fallback and MongoDB empty-database seeding.
- `server-local.js`: local Express listener for development/demo mode.
- `public/`: the user's Aurora Store logo and static web assets.
- Root config: Vite, Vercel rewrites, npm scripts, environment example, README and route manifest.

## Product behavior
- Books: create, view, edit, delete, search/filter; display title, author, category, ISBN, total/available quantities and publication year.
- Members: create, view, edit, delete and search; store name, email, phone, address and membership date.
- Circulation: issue an available copy to a member, mark active loans returned, maintain history, and update stock in the same operations; refuse invalid or duplicate operations.
- Dashboard: totals for titles, members, active/returned loans and available copies, plus recent circulation and low-stock insight.
- Public reader catalog: sanitized catalog fields only. It can show clearly labeled fictional preview books with invented authors and correct years if the API database is not configured.
- Librarian access: signed HTTP-only session; demo login exists only in non-production memory mode. Production requires private credentials, persistent MongoDB, and `SESSION_SECRET`; a readiness notice explains missing setup and prevents a dead-end sign-in attempt.
- Sample data: seed fictional books/members/loans only on a genuinely empty MongoDB database, once; do not seed over a populated library.

## Design
- **Design movement:** Aurora Store's cinematic, literary editorial style, adapted from its dark branded landing page.
- **Core principles:** identifiable original brand; compact vertical rhythm; legible inventory information; interactions that clearly distinguish demo from persistent data.
- **Color philosophy:** espresso-black and charcoal create the existing reading-room mood; antique gold focuses key actions; warm ivory text preserves contrast and readability.
- **Layout paradigm:** compact logo-led front door; public book catalogue as a shelf grid; librarian desk with slim side rail, concise KPI strip and operational tables.
- **Signature elements:** exact circular feather/book Aurora Store emblem; warm gold chapter numerals and fine lines; book-cover tiles and sample-data seals.
- **Interaction philosophy:** direct create/edit/issue dialogs with validation, confirmation on removal, immediate inventory updates, visible demo-only label and actionable errors.
- **Animation:** restrained short transitions for hover and dialogs; no ornamental movement in data tables; honor reduced-motion preferences.
- **Typography:** DM Sans for UI/data, Playfair Display for literary headings; readable 13–16 px body/data text and high-contrast title hierarchy.
- **Brand essence:** a welcoming, dependable digital desk for the Aurora reading community. Personality: literary, warm, precise.
- **Brand voice:** concise and inviting. Examples: “Find a story worth keeping.” “Every page opens a door.”
- **Wordmark/logo:** reuse the exact supplied Aurora Store circular gold emblem from the user's read-only reference at https://my-project-evrj.vercel.app/; do not modify the original site.
- **Signature brand color:** antique Aurora gold `#d4a23e` against espresso-black `#090705`.

## Deployment constraints
The separate Vercel project now serves the React app and Express API. Full production operations need private `MONGODB_URI`, `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` server environment variables. A public repository must never contain these secrets. Project-scope access currently blocks environment updates, so keep the original deployment untouched and await reauthorization. Rotate the previously disclosed database credential before using it in production.
