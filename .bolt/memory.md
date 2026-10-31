# Project memory

## Product intent & audience

- Real estate platform (Django backend + React frontend) named `real-estate-platform`
- GitHub repo: `SubhamCodes1604/real-estate-platform`
- Target branch for current work: `feature/inquiry-management`
- Phase 1 UI enhancements previously completed
- Phase 2 (Inquiry Management) now complete — agent response system implemented

## Brand personality & voice

- (Not yet inferred)

## Visual design & UX direction

- Frontend uses React (`.jsx` files under `frontend/src/pages/`)
- Key pages: `PropertyDetails.jsx` (inquiry creation), `Inquiries.jsx` (buyer view), `ReceivedInquiries.jsx` (agent view)
- CSS files colocated with page components (e.g., `Inquiries.css`, `ReceivedInquiries.css`)
- Frontend build: Vite-based, `npm run build` produces ~120 modules
- Buyer inquiry view shows agent response or "Pending" status
- Agent view includes response form with textarea, submit/update button, loading/error/success states

## Decisions, constraints & rationale

- Bolt sandbox has **no git repo, no GitHub CLI, no credentials** — agent cannot push or connect to GitHub directly
- GitHub integration is **UI-managed by project owner** via top-right GitHub icon; not controllable by the agent
- Importing an existing repo into Bolt creates a *new* Bolt project; connecting after the fact is limited
- Existing implementation must **not** be recreated or modified
- Push only to `feature/inquiry-management`; **never push to main or other branches**
- Agent must show changes and confirm target branch before committing/pushing
- Agent response endpoint: `PATCH /api/inquiries/<id>/respond/` — agents respond to inquiries on their own properties only
- `responded_at` set on first response, preserved on updates; `is_answered` is a computed read-only field
- Buyers and admins are blocked from responding; ownership strictly enforced
- No duplicate-inquiry prevention (matches existing behavior, not requested)
- ADMIN users have no inquiry workflow (consistent with existing authorization design)
- Django version mismatch: project built on 6.1, running 5.2.18 in sandbox — causes pre-existing W042 warnings (auto-created PK fields), unrelated to current work

## Open questions & assumptions

- All Phase 2 changes exist as files in Bolt workspace only — not yet committed or pushed anywhere
- Bolt GitHub integration must handle syncing to `feature/inquiry-management` (project owner action required)
- User has not confirmed whether to sync files manually or use Bolt GitHub integration
- User's local development environment and git workflow assumed but not confirmed
- No `.bolt/prompt` global instructions defined for this project yet
- API documentation file `API_DOCUMENTATION.md` created in sandbox — needs syncing with backend
- Database migration `0002_inquiry_responded_at_inquiry_response.py` needs to be applied on target environment