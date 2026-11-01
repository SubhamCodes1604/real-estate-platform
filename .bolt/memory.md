# Project memory

## Product intent & audience

- Real estate platform (Django backend + React frontend) named `real-estate-platform`
- GitHub repo: `SubhamCodes1604/real-estate-platform`
- Phase 1 (UI enhancements) and Phase 2 (Inquiry Management) complete
- Phase 3 (Admin dashboard, bulk upload, gallery, migrations, regression) now complete

## Brand personality & voice

- (Not yet inferred)

## Visual design & UX direction

- Frontend uses React (`.jsx` files under `frontend/src/pages/`)
- Key pages: `PropertyDetails.jsx` (inquiry creation + gallery), `Inquiries.jsx` (buyer view), `ReceivedInquiries.jsx` (agent view)
- CSS files colocated with page components
- Frontend build: Vite-based; production build produces ~124 modules, ~399 KB JS / ~89 KB CSS
- Property Details page now has a responsive image gallery grid below the main image, with hover effects
- Gallery images sourced from `PropertyImage` model; property cards use the existing primary `image` field

## Decisions, constraints & rationale

- Bolt sandbox has **no git repo, no GitHub CLI, no credentials** — agent cannot push or connect to GitHub directly
- GitHub integration is **UI-managed by project owner** via top-right GitHub icon
- Existing implementation must **not** be recreated or modified unless fixing a genuine defect
- Agent must show changes and confirm target branch before committing/pushing
- Phase 2 work lives on `feature/inquiry-management`; Phase 3 work targets `feature/phase-3-frontend` — never push to main or merge branches
- **Bulk upload security fixes applied:**
  - Path traversal validator now checks `..` components and absolute paths instead of rejecting valid relative paths
  - All ZIP entries (not just image files) now checked for path traversal before processing
- Bulk upload limits: max 100 properties, max 10 images/property, max 50 MB ZIP; partial success allowed
- `PropertyImage` model already existed; property serializer updated to include gallery images in API responses
- Existing `Property.image` field retained for backward compatibility
- Admin user-management endpoints: list (search+filter), detail, activate/deactivate; self-deactivation prevented
- Migration `0004_alter_property_id` is auto-generated PK type change from Django version mismatch (5.2 vs 6.1), no data impact
- Similar pending migrations exist for reviews/community/bookmarks apps — same W042 root cause, not Phase 3 related

## Open questions & assumptions

- All Phase 3 changes exist as files in Bolt workspace only — not yet committed or pushed anywhere
- Project owner must sync to `feature/phase-3-frontend` via Bolt GitHub integration (agent cannot)
- Migration `0004` needs to be applied on target environment (test DB only was used)
- No `.bolt/prompt` global instructions defined for this project
- User's local development environment and git workflow assumed but not confirmed
- API documentation file `API_DOCUMENTATION.md` in sandbox may need syncing with latest backend changes
- 157 backend tests pass; frontend test framework status unconfirmed (build succeeds, no test framework found)