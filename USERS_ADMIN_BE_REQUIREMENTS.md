# Backend Requirement — Users (User Management) Admin

**Audience:** Backend team
**Owner:** Admin portal (Cable-Admin)
**Date:** 2026-07-07

> **Context / why now:** The admin currently loads the **entire** `GetAllUsers`
> response (~13,987 users today) on the Users screen *just* to show header counts
> and to run phone-search / city-filter **client-side**. That does not scale.
> This doc asks for (1) a cheap summary aggregate and (2) a proper server-side
> paged+filtered list. Item 2 matters more than item 1.

---

## 1. 🔴 User summary aggregate — `GET /api/users/summary`

One server-side aggregate for the Users header + insights strip (don't pull the
full user list to count).

- **Auth:** Admin role (Role id 2) → `403` otherwise.
- One DB-aggregate call; safe on every screen load; may cache 1–5 min.

### Response
```json
{
  "totalUsers": 13987,
  "active": 13960,
  "deleted": 27,
  "phoneVerified": 8400,
  "withVehicles": 5200,

  "newToday": 14,
  "newThisWeek": 96,
  "newThisMonth": 410,

  "byRole": [
    { "roleId": 3, "name": "User",     "count": 13980 },
    { "roleId": 2, "name": "Admin",    "count": 2 },
    { "roleId": 1, "name": "Provider", "count": 5 }
  ],
  "byCity": [ { "city": "Amman", "count": 3200 } ],
  "registrationTrend": [ { "day": "2026-06-08", "count": 12 } ]
}
```

### Field definitions & priority
| Field | Priority | Definition |
|---|---|---|
| `totalUsers` | high | All non-deleted users |
| `active` / `deleted` | high | Split by `isDeleted` (the real status signal; list has no `isActive`) |
| `phoneVerified` | med | `isPhoneVerified = true` |
| `withVehicles` | med | Users with ≥ 1 registered car |
| `newToday` / `newThisWeek` / `newThisMonth` | 🔴 high | Registrations in the period — **needs reliable `createdAt`** (see §4) |
| `byRole` | high | Count per role (drives the Providers/Admins/Users/All header tabs) |
| `byCity` | breakdown | Count per city — **top N** (e.g. top 10) + optional "Other" bucket |
| `registrationTrend` | med | Daily new-user counts for last 30 days (feeds the existing trend chart) |

> `byRole` counts must match the header tab badges exactly, and `active`/`deleted`
> must match the "Deleted Users" view.

---

## 2. 🔴🔴 Server-side paged + filtered lists — Users **and** Stations

**More important than §1.** Replace "fetch the whole list → filter in the browser"
for **both** the Users list (~14k rows) and the Stations / Charge-Management list.

### Pagination is **optional** (opt-in)
Support paging via query params, but when they are **omitted the endpoint returns
the full list** (current behavior) so nothing breaks. i.e. `page`/`pageSize` are
optional; if absent → return all. This lets us adopt paging screen-by-screen
without a hard cut-over.

### 2a. Users — `GET /api/users`
`GET /api/users?page=1&pageSize=25&search=&role=&city=&isDeleted=false&sort=createdAt_desc`

- **Auth:** Admin.
- `search` matches **name, email, phone, or id** (the admin has a dedicated
  phone-search field today — must be server-side).
- Filters: `role` (id), `city`, `isDeleted`.
- `sort`: at least `createdAt` and `name`, asc/desc.
- Keep the existing `UserSummaryDto` fields (id, name, userName, email, phone,
  city, role, isDeleted, isPhoneVerified, createdAt, userCars).

### 2b. Stations — `GET /api/charging-points`
Same optional-paging pattern with the station filters already used in the admin:
`search`, `type`, `city`, `status`, `brand`, `verified`, `plugType`, `sort`
(visitors/rating/name). Keep the existing station DTO fields.

### Paged envelope (both) — same shape as the loyalty admin endpoints
```json
{ "items": [ /* existing DTO */ ], "totalCount": 13987, "page": 1, "pageSize": 25 }
```
> When paging params are omitted, either return a plain array (as today) or this
> envelope with the full set — either is fine; just keep it consistent.

---

## 3. ⚠️ Dependency — reliable `createdAt` on users

The registration-date metrics (`newToday/Week/Month`, `registrationTrend`) and
the "Joined" column depend on `createdAt` being **populated for all users and
indexed**. The admin's User Insights panel already shows a fallback note when it
is missing — please confirm coverage/backfill before shipping §1's growth fields.

---

## 4. Already available — do NOT duplicate
- **Loyalty-side user metrics** (points in circulation, active members,
  redemption rate, blocked users, top earners) come from the existing
  **`GET /api/loyalty/admin/GetLoyaltySummary`** (I1) — already surfaced as the
  Users-list loyalty strip. Keep points/liability there, not in `/users/summary`.
- **Per-user loyalty account + points history** → `GetUserLoyaltyAccount` (A1) and
  `GetUserPointsHistory` (A2) — already powering the new User Profile screen.

---

## Priority summary
1. **§2 optional paged/filtered lists (users + stations)** — scale blocker at ~14k users.
2. **§1 summary aggregate** — cheap header/insights.
3. **§3 `createdAt` coverage** — unblocks growth metrics.
