# Remaining outcomes

- [x] In the explicit non-production `DEMO_MODE` with no MongoDB URI, provide a clearly labeled fictional librarian login and a functional in-memory REST API for dashboard, book/member CRUD, search, issue and return. Preserve validation, duplicate detection, active-loan deletion rules, and automatic quantity updates; demo edits must not be represented as persistent.
- [x] Keep MongoDB/Mongoose as the only production persistence path; do not expose demo login or fake admin access in production or while a Mongo URI is configured.
- [x] Verify the browser role choice, public sample catalog, protected librarian sign-in, dashboard counts, book/member add and member edit, issue/return and quantity changes. Integration checks cover full CRUD, search, duplicate validation, deletion guards and production isolation.
- [x] When production database or administrator settings are missing, show safe readiness status and a clear setup-required screen instead of an unusable staff login form; keep the staff workspace locked until configuration is complete.
- [ ] After Vercel project-scope access is reauthorized and the disclosed MongoDB credential is rotated, set the new URI and administrator/session secrets as private production environment variables in the separate existing Vercel project and redeploy. Leave the original site and project unchanged.
