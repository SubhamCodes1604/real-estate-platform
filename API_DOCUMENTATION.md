# API Documentation — Phase 2

## Authentication & User Management

### Register
- **POST** `/api/accounts/register/`
- **Auth:** None
- **Body:** `{ "username", "email", "password", "role": "USER"|"AGENT" }`
- **Response 201:** `{ "id", "username", "email", "role" }`
- **Error 400:** Admin role rejected; duplicate username

### Login (JWT)
- **POST** `/api/accounts/login/`
- **Auth:** None
- **Body:** `{ "username", "password" }`
- **Response 200:** `{ "access", "refresh" }`
- **Error 401:** Invalid credentials

### Token Refresh
- **POST** `/api/accounts/token/refresh/`
- **Auth:** None
- **Body:** `{ "refresh" }`
- **Response 200:** `{ "access" }`

### Profile
- **GET** `/api/accounts/profile/`
- **Auth:** Bearer token required
- **Response 200:** `{ "id", "username", "email", "role" }`
- **Error 401:** Unauthenticated

---

## Property Management

### Create Property
- **POST** `/api/properties/create/`
- **Auth:** Bearer token (any role)
- **Body:** Multipart form — `title, description, property_type, price, bedrooms, bathrooms, area_sqft, address, city, state, pincode, image?`
- **Response 201:** Property object (`is_approved=false` by default)

### List Properties
- **GET** `/api/properties/list/`
- **Auth:** None
- **Query params:** `search, city, property_type, min_price, max_price, bedrooms, ordering`
- **Returns only approved properties**

### Property Detail
- **GET** `/api/properties/detail/<id>/`
- **Auth:** None
- **Returns 404 for unapproved properties**

### Update Property
- **PATCH/PUT** `/api/properties/update/<id>/`
- **Auth:** Bearer token (owner only)
- **Error 404:** Not owner

### Delete Property
- **DELETE** `/api/properties/delete/<id>/`
- **Auth:** Bearer token (owner only)

### My Properties
- **GET** `/api/properties/my-properties/`
- **Auth:** Bearer token

### Approve/Reject (Admin)
- **PATCH** `/api/properties/approve/<id>/` — Admin only
- **PATCH** `/api/properties/reject/<id>/` — Admin only
- **GET** `/api/properties/pending/` — Admin only
- **GET** `/api/properties/all/` — Admin only

---

## Bookmark Management

### Add Bookmark
- **POST** `/api/bookmarks/add/`
- **Auth:** Bearer token
- **Body:** `{ "property_id": <id> }`
- **Error 400:** Already bookmarked

### List Bookmarks
- **GET** `/api/bookmarks/list/`
- **Auth:** Bearer token
- **Returns only caller's bookmarks**

### Remove Bookmark
- **DELETE** `/api/bookmarks/remove/<id>/`
- **Auth:** Bearer token (owner only)

### Bookmark Status
- **GET** `/api/bookmarks/status/<property_id>/`
- **Auth:** Bearer token
- **Response 200:** `{ "is_bookmarked": bool }`

---

## Community Q&A

### Questions
- **GET** `/api/community/questions/` — Public; supports `search` query
- **POST** `/api/community/questions/` — Auth required; `{ "title", "body" }`
- **GET** `/api/community/questions/<id>/` — Public

### Answers
- **GET** `/api/community/questions/<id>/answers/` — Public
- **POST** `/api/community/questions/<id>/answers/` — Auth required; `{ "body" }`

### AI Answer
- **GET** `/api/community/questions/<id>/ai-answer/` — Public

### Voting
- **POST** `/api/community/answers/<id>/like/` — Auth required
- **POST** `/api/community/answers/<id>/dislike/` — Auth required

### Accept Answer
- **POST** `/api/community/answers/<id>/accept/` — Auth required (question owner only)

---

## Reviews & Ratings

### Add Review
- **POST** `/api/reviews/add/`
- **Auth:** Bearer token (USER role)
- **Body:** `{ "property": <id>, "rating": 1-5, "comment": "text" }`
- **Rules:** Cannot review own property; cannot review unapproved; one review per property per user

### List Property Reviews
- **GET** `/api/reviews/property/<property_id>/`
- **Auth:** None

### Average Rating
- **GET** `/api/reviews/property/<property_id>/average/`
- **Auth:** None
- **Response:** `{ "average", "total_reviews", "distribution", "approved" }`

### My Review
- **GET** `/api/reviews/property/<property_id>/my-review/`
- **Auth:** Bearer token
- **Response:** `{ "review": {...}|null, "is_owner": bool }`

### Edit/Delete Review
- **GET/PATCH/PUT/DELETE** `/api/reviews/<id>/`
- **Auth:** Bearer token (review author only)

### Recent Reviews
- **GET** `/api/reviews/recent/`
- **Auth:** None

---

## Inquiry Management

### Create Inquiry
- **POST** `/api/inquiries/create/`
- **Auth:** Bearer token (USER role only)
- **Body:** `{ "property": <id>, "message": "text" }`
- **Response 201:** Inquiry object
- **Rules:** Property must be approved; cannot inquire about own property; message trimmed; buyer set from request
- **Error 403:** Agent/Admin blocked, unapproved property, self-inquiry
- **Error 400:** Empty message, invalid property

### My Inquiries (Buyer)
- **GET** `/api/inquiries/my/`
- **Auth:** Bearer token (USER role only)
- **Returns:** Caller's inquiries with `response`, `responded_at`, `is_answered` fields
- **Error 403:** Agent/Admin blocked

### Received Inquiries (Agent)
- **GET** `/api/inquiries/received/`
- **Auth:** Bearer token (AGENT role only)
- **Returns:** Inquiries for agent's properties, newest first
- **Error 403:** User/Admin blocked

### Respond to Inquiry
- **PATCH** `/api/inquiries/<id>/respond/`
- **Auth:** Bearer token (AGENT role only)
- **Body:** `{ "response": "text" }`
- **Response 200:** Updated inquiry object
- **Rules:** Agent must own the property; response trimmed; first response sets `responded_at`; updates preserve original timestamp
- **Error 401:** Unauthenticated
- **Error 403:** Buyer or other non-agent roles
- **Error 404:** Inquiry does not exist, or belongs to another agent's property (same response, so existence is not revealed)
- **Error 400:** Empty or missing response

## Phase 4: Role-Based Access Control and Security

### Role Permission Classes
Defined in `accounts/permissions.py` and used across all apps. Roles come from the custom `role` field on the user, not Django's `is_staff` flag.

| Class | Allows |
|---|---|
| `IsAdminRole` | `role == ADMIN` |
| `IsAgentRole` | `role == AGENT` |
| `IsBuyerRole` | `role == USER` |
| `IsAgentOrAdmin` | `role` is `AGENT` or `ADMIN` |
| `IsOwnerOrAdmin` | Object owner (`created_by` or `user`) or `ADMIN` |

### Role Matrix
| Area | Anonymous | USER (buyer) | AGENT | ADMIN |
|---|---|---|---|---|
| Browse/detail properties | Approved only | Approved only | Approved + own (incl. pending) | All |
| Create property | 401 | 403 | Yes | 403 |
| Update/delete property | 401 | 404 for others' | Own only | All |
| Approve/reject, pending, all properties | 401 | 403 | 403 | Yes |
| Create inquiry | 401 | Yes (approved, not own) | 403 | 403 |
| My inquiries | 401 | Own | 403 | 403 |
| Received inquiries and respond | 401 | 403 | Own properties only (other: 404) | 403 |
| Bookmarks | 401 | Own only | Own only | Own only |
| Bookmark a property | 401 | Approved only | Approved only | Approved only |
| Reviews create/edit/delete | 401 | Own only for edit/delete | Own only for edit/delete | Own only for edit/delete |
| Admin users (list, detail, status) | 401 | 403 | 403 | Yes |
| Admin dashboard stats | 401 | 403 | 403 | Yes |
| Bulk upload | 401 | 403 | Yes | 403 |

### Security Changes
- Admin endpoints (users, dashboard, approve/reject, pending, all properties) require the `ADMIN` role. Accounts with only `is_staff` are denied.
- Creating a property requires `AGENT`. Buyers receive 403.
- Updating a property no longer reassigns ownership. Agents can update only their own listings; admins can update any listing.
- `is_featured` is read-only in the property API. Agents cannot set it on create or update.
- Agents can view other agents' approved properties. Pending listings stay hidden from everyone except their owner and admins.
- Bookmarking a pending property returns 400 with the same message used for missing properties.
- Inquiry respond returns 404 for both missing and non-owned inquiries.

### Validation Rules (Property)
- `price` must be greater than zero.
- `area_sqft` must be greater than zero.
- `bedrooms` and `bathrooms` cannot be negative.
- `property_type` must be one of FLAT, HOUSE, VILLA, PLOT.
- Existing bulk-upload protections are unchanged: ZIP size limit (50 MB), per-property image limit (10), image size limit (10 MB), allowed image extensions, and path traversal checks on every ZIP entry.

### Tests
- `accounts/test_permissions.py` covers role gating (admin role vs staff flag, anonymous, buyer create), property visibility and ownership, inquiry ownership, and bookmark eligibility and duplicates.
- Run: `python manage.py test accounts.test_permissions`
- Full suite: `python manage.py test`
- Status: not yet executed in this environment (Django is not installed here).
