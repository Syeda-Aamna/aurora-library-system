# Aurora Library — Implementation Plan

## Scope and architecture
A standalone MERN library-management application in a new private repository and separate Vercel project. The existing Aurora landing page, its repository, and its Vercel deployment are explicitly out of scope and will remain unchanged. The React/Vite client communicates with an Express REST API; Mongoose persists books, members, and circulation records in MongoDB. The app expects `MONGODB_URI` as a deployment secret and never embeds database credentials in client code.

## Project structure
- `src/`: React UI, page-state, components and API client.
- `api/`: Express app, Mongoose models, API routes, validation and domain rules; Vercel serverless entry point.
- `server-local.js`: local Express listener for development.
- `public/`: browser icon and static assets.
- Root config: Vite, Vercel rewrites, npm scripts, environment sample, README.

## Product behavior
- Books: create, view, edit, delete, search/filter, and track total/available quantity.
- Members: create, view, edit, delete, search and filter.
- Circulation: issue an available copy to an existing member; mark active loans returned; persist issue/return history and update inventory atomically with rollback-safe document writes.
- Dashboard: totals for book records, members, active issues, returned loans, and available copies, plus recent circulation.
- API validates required values, email/ISBN uniqueness, positive quantities and publication year; active circulation prevents deleting referenced books or members.

## Design
- **Design movement:** Literary editorial, with restrained archival-library cues.
- **Core principles:** calm hierarchy; high information clarity; warm, tactile accents; actions close to the records they affect.
- **Color philosophy:** deep ink and warm paper evoke a reading room; antique brass highlights selection and primary actions; muted sage/red communicate status without overpowering data.
- **Layout paradigm:** fixed slim navigation rail, flexible content canvas, dashboard KPI strip and dense but breathable record tables.
- **Signature elements:** small chapter/folio numerals; gold hairline dividers; rounded status seals.
- **Interaction philosophy:** low-friction create/edit dialogs; confirm destructive actions; clear empty/loading/error states; persistent feedback.
- **Animation:** short opacity/translate transitions for dialogs and page changes; subtle hover states; honor reduced-motion preferences.
- **Typography:** DM Sans for functional UI; Playfair Display for brand and page headings; tabular numerals for metrics.
- **Brand essence:** a composed digital circulation desk for librarians, blending an inviting literary identity with efficient daily operations. Personality: scholarly, warm, dependable.
- **Brand voice:** concise and helpful, never decorative at the expense of clarity. Example: “A good day to turn a new page.” “One copy is ready to lend.”
- **Wordmark/logo:** custom typographic Aurora Library lockup with a folio/stack glyph.
- **Signature brand color:** aged brass `#c99a45`.

## Deployment constraints
Vercel serves the built React app and Express API functions. `MONGODB_URI` is supplied privately at runtime through Vercel environment configuration; a production instance cannot persist records until a reachable MongoDB deployment URI is configured. The repository and Vercel project are new, distinct resources.
