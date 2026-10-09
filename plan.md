# Library Desk — Rebuild Plan

## Scope and architecture
Rebuild only the separate `aurora-library-system` application as a neutral, professional library portal. Do not change the original Aurora Store site, repository, deployment or logo. Keep the existing React/Vite frontend and Express/Mongoose backend structure. Production catalog, members, loans and circulation remain MongoDB-backed; no in-memory production mode or fake login will remain.

## Project structure
- `src/`: neutral reader and staff entry, public searchable catalog, authenticated librarian desk, forms and API client.
- `api/`: Express/Vercel entry, Mongoose models, secure admin session, public catalog projection and REST routes.
- `shared/catalog-data.js`: a small set of real book/edition records sourced from Open Library for initial catalog population.
- `public/`: neutral book-mark favicon and normal frontend assets; remove the Aurora-specific logo.
- Root configs/docs: Vite, Vercel path routing, npm scripts, `.env.example`, README and route manifest.

## Product behavior
- Reader/user area: browse and search real catalog records, view accurate availability, return to the role chooser; readers do not issue or return inventory themselves.
- Staff area: secure administrator sign-in, dashboard, book/member CRUD, issue/return and quantity updates through the existing REST API.
- Starter catalog: add only verified real titles/authors/ISBNs/publication metadata. Set every initial physical-copy quantity and availability to zero because no actual holdings were supplied. Staff must record counted copies before any issue is possible.
- Seed the real catalog only when the connected MongoDB database is genuinely empty; never overwrite populated records. No fictional members or loans, sample labels, or preview demo sign-in. If the database is disconnected, show only verified real-title metadata at zero copies with a prominent metadata-only notice—never claim live holdings or availability.
- If production database/admin settings are absent, present a clear setup state rather than claiming that writes or login work. Keep environment values private and out of Git.

## Design
- **Design movement:** Modern civic-library editorial—quiet, trustworthy and operational rather than cinematic or brand-specific.
- **Core principles:** clear information hierarchy; real holdings only; reader-first discovery; staff controls that make circulation states obvious.
- **Color philosophy:** soft paper and cool white surfaces for long reading, deep ink/slate for navigation, restrained teal for available/confirmed states, and amber only for attention or due-date states.
- **Layout paradigm:** a broad searchable catalog with compact book-cover cards for readers; a compact left-rail staff workspace with KPI strip and operational tables.
- **Signature elements:** authentic edition covers keyed by ISBN with accessible icon fallback; concise availability chips; restrained shelf/category rules.
- **Interaction philosophy:** search and availability are obvious; issue/return is staff-controlled and quantity-aware; zero-stock records are clearly marked “No copies recorded”; destructive actions stay confirmed.
- **Animation:** short, low-motion transitions for menus and dialogs; no decorative motion; respect reduced-motion preferences.
- **Typography:** DM Sans for UI/data with a restrained bookish serif for headings; minimum 14px body/data text, strong contrast and clear numeric alignment.
- **Brand essence:** a dependable, welcoming digital library desk. Personality: calm, precise, accessible.
- **Brand voice:** direct and useful. Examples: “Search the catalog.” “Record copies before lending.”
- **Wordmark/logo:** generic open-book line icon with the neutral name “Library Desk”; no Aurora-specific imagery or invented institution.
- **Signature brand color:** deep library teal `#28645f` on warm paper and slate.

## Data sourcing and deployment constraints
Verify the chosen real editions through Open Library’s public catalog/cover services and cite the source in the README. The connected Vercel project already exists, but project-scope access previously returned 403; keep its environment secrets untouched until access is reauthorized. MongoDB and administrator/session values belong only in private Vercel production variables. Rotate credentials previously pasted into chat before production use.
