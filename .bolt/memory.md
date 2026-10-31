# Project memory

## Product intent & audience

- Real estate platform (Django backend + React frontend) named `real-estate-platform`
- GitHub repo: `SubhamCodes1604/real-estate-platform`
- Target branch for current work: `feature/inquiry-management`
- Phase 1 UI enhancements previously completed and pushed via Bolt GitHub integration
- Current phase: Inquiry Management feature

## Brand personality & voice

- (Not yet inferred)

## Visual design & UX direction

- Frontend uses React (`.jsx` files under `frontend/src/pages/`)
- Property details page (`PropertyDetails.jsx`) is a key user-facing page where inquiry functionality is surfaced
- (Further visual details not yet inferred)

## Decisions, constraints & rationale

- Bolt sandbox environment has **no git repo, no GitHub CLI, no credentials** — AI agent cannot push or connect to GitHub directly
- GitHub integration is **UI-managed by project owner** via top-right GitHub icon; not controllable by the agent
- Importing an existing repo into Bolt creates a *new* Bolt project (per Bolt docs); connecting after the fact is limited
- Existing implementation must **not** be recreated or modified
- Push only to `feature/inquiry-management`; **never push to main or other branches**
- Agent must show changes and confirm target branch before committing/pushing

## Open questions & assumptions

- Four completed Inquiry Management files live only in sandbox workspace (not yet committed anywhere):
  - `inquiries/views.py`
  - `inquiries/serializers.py`
  - `inquiries/tests.py`
  - `frontend/src/pages/PropertyDetails.jsx`
- User has not yet decided whether to sync files manually (Option A) or use Bolt GitHub integration (Option B)
- Agent offered to output full file contents for copy-paste; user response pending
- User's local development environment and git workflow (e.g., VS Code) assumed but not confirmed
- No `.bolt/prompt` global instructions defined for this project yet