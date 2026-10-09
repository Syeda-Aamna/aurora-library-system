# Rebuild outcomes

- [x] Replace Aurora-specific branding in the separate library app with a neutral, professional “Library Desk” identity; leave the original Aurora site/repository/deployment untouched.
- [x] Remove fictional/demo records, in-memory demo routes/login, fictional-member/loan seeding, and sample labels. If the database is not connected, display only verified real-title metadata at zero copies with a clear metadata-only notice; never claim live availability.
- [x] Add six verified real published book editions with real authors, edition ISBNs, categories, publication metadata, and cover references; initialize physical-copy and available counts to zero until actual holdings are supplied.
- [x] Seed the real catalog only into an empty MongoDB database; never overwrite populated library data. Keep issue/return staff-only and require recorded stock before an issue can be created.
- [x] Retain reader search/availability and the secure administrator portal for book/member CRUD, dashboard, issue/return and stock updates; show setup requirements rather than a broken sign-in when production is not ready.
- [ ] After Vercel project-scope access is reauthorized and exposed credentials are rotated, configure only private production environment variables and redeploy the separate project.
