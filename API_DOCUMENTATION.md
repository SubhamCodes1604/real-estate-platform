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
- **Error 403:** Buyer/Admin/blocked; inquiry belongs to another agent's property
- **Error 400:** Empty or missing response
