# Loyalty Admin — Backend Requirements (Master, detailed)

**Audience:** Backend team + Admin portal
**Owner:** Admin portal (Cable-Admin)
**Last updated:** 2026-07-07

Single source of truth with **full contracts**. **Part A** = delivered on dev
(exact shapes, for the portal to integrate against). **Part B** = still open
(proposed shapes for BE).

## Status legend
- ✅ **Delivered** on dev (BE response 2026-07-07) · 🟡 **Partial / decision** · 🔴 **Pending**

## Cross-cutting rules (✅ implemented)
- **Auth:** Bearer from an **Admin-role** user (Role id 2). No token → `401`; non-admin → `403 "Admin role required."` Not owner-gated (any `userId`/`providerId`).
- **Paging:** every list endpoint → `{ "items": [...], "totalCount": <int>, "page": <int>, "pageSize": <int> }`. Query `page` (default `1`), `pageSize` (default `20`, max `200`). Empty = empty page, never `404`.
- **Dates:** `from`/`to` query params are **UTC ISO-8601**; response timestamps are **Jordan local time** (global converter).
- **Enrichment:** rows carry `userId` + `userName`; admin-initiated rows carry `performedByUserId` + `performedByUserName` (`null` for the account owner's own activity).

## Shared enums
```
transactionType:   1=Earn  2=Redeem  3=Expired  4=AdminAdjust  5=SeasonBonus
activityType:      "Offer" | "Partner" | "Redemption"   (B3 also "PointsAdjustment")
redemption status: 1=Pending  2=Fulfilled  3=Cancelled
providerType:      "ChargingPoint" | "ServiceProvider"
points sign:       Earn/Award = +   |   Redeem/Deduct/Spend = −
```

---

# Part A — Delivered on dev (exact contracts)

## A1 ✅ `GET /api/loyalty/admin/GetUserLoyaltyAccount/{userId}`
One user's full account. `404` only if the **user id** doesn't exist (a user with no
loyalty yet returns the zero/Bronze snapshot).

**Response — `LoyaltyAccountDto`:**
```json
{
  "totalPointsEarned": 5000,
  "totalPointsRedeemed": 0,
  "currentBalance": 5000,
  "currentTierName": "Bronze",
  "currentMultiplier": 1.0,
  "seasonPointsEarned": 5000,
  "seasonName": "Launch Season",
  "isBlocked": false,
  "blockedUntil": null,
  "blockReason": null
}
```

## A2 ✅ `GET /api/loyalty/admin/GetUserPointsHistory/{userId}`
**Query:** `transactionType?` (int), `seasonId?` (int), `from?`, `to?`, `page`, `pageSize`.

**Response — paged `AdminPointsHistoryDto`:**
```json
{
  "items": [{
    "id": 9001,
    "userId": 45,
    "userName": "Ali",
    "transactionType": 4,
    "points": 5000,
    "balanceAfter": 5000,
    "referenceType": null,
    "referenceId": null,
    "note": "Welcome bonus",
    "actionName": null,
    "providerName": null,
    "performedByUserId": 2,
    "performedByUserName": "Admin",
    "createdAt": "2026-04-04T10:54:22"
  }],
  "totalCount": 137, "page": 1, "pageSize": 20
}
```

## A3 ✅ Per-user redemptions — via **D1** `GET …/GetAllRedemptions?userId={id}` (no separate route).

## B1 ✅ `GET /api/loyalty/admin/GetProviderActivity`
Unified Offer + Partner + Redemption feed for one provider, merged & sorted by
`createdAt` desc; `totalCount` = combined.
**Query:** `providerType` (req), `providerId` (req), `activityType?` (`Offer|Partner|Redemption`, omit=all), `from?`, `to?`, `page`, `pageSize`.

**Response — paged rows:**
```json
{
  "items": [{
    "activityType": "Partner",
    "transactionId": 123,
    "userId": 45, "userName": "Ali",
    "code": "PTR-XXXXXX",
    "status": 2, "statusName": "Completed",
    "points": 35,
    "amount": 3.500, "currencyCode": "JOD",
    "createdAt": "2026-07-02T14:20:00",
    "completedAt": "2026-07-02T14:21:00"
  }],
  "totalCount": 1, "page": 1, "pageSize": 20
}
```

## B3 ✅ `GET /api/loyalty/admin/GetTransactionDetail?activityType={...}&id={int}`
`400` unknown `activityType`; `404` unknown id.
Semantics: `points` signed (Partner `+pointsAwarded`, Offer `−pointsDeducted`,
Redemption `−pointsSpent`); Redemption rows → `amount`/`commissionAmount` = `null`,
`note` = reward name, `completedAt` = `fulfilledAt`; `performedBy` = staff who
confirmed (Offer/Partner) or admin who fulfilled/cancelled (Redemption).

**Response:**
```json
{
  "activityType": "Partner",
  "transactionId": 123,
  "status": 2, "statusName": "Completed",
  "user":     { "userId": 45, "userName": "Ali", "phone": "+9627..." },
  "provider": { "providerType": "ServiceProvider", "providerId": 17, "providerName": "Cable Cafe" },
  "code": "PTR-XXXXXX",
  "amount": 3.500, "currencyCode": "JOD", "commissionAmount": 0.350,
  "points": 35, "note": null,
  "performedByUserId": 8, "performedByUserName": "Cafe Staff",
  "createdAt": "2026-07-02T14:20:00", "completedAt": "2026-07-02T14:21:00"
}
```

## C1 ✅ `GET /api/loyalty/admin/GetAllPointsTransactions`
Global ledger. **Query:** `transactionType?`, `userId?`, `seasonId?`, `providerType?`,
`providerId?`, `from?`, `to?`, `page`, `pageSize`. Row = same as **A2** item.

## D1 ✅ `GET /api/loyalty/admin/GetAllRedemptions`
**Query:** `status?`, `providerType?`, `providerId?`, `userId?`, `from?`, `to?`, `page`, `pageSize`.
**Row** = `RedemptionDto` + `userId`, `userName`, `providerName`:
```json
{
  "id": 501, "rewardId": 12, "rewardName": "Free Coffee",
  "userId": 45, "userName": "Ali",
  "pointsSpent": 200, "status": 1, "redemptionCode": "RDM-ABC123",
  "providerType": "ServiceProvider", "providerId": 17, "providerName": "Cable Cafe",
  "redeemedAt": "2026-07-02T14:20:00", "fulfilledAt": null
}
```
> Existing `GetProviderRedemptions` now also includes `userId`.

## I1 ✅ `GET /api/loyalty/admin/GetLoyaltySummary`
**Query:** `seasonId?`, `from?`, `to?`. Liability is always **"now"** (Σ current
balances ÷ default conversion rate) regardless of filters; other aggregates honor
`seasonId`/`from`/`to`; daily series defaults to last 30 days.
```json
{
  "outstandingLiabilityPoints": 5107,
  "estimatedLiabilityValue": 102.140,
  "liabilityCurrencyCode": "JOD",
  "totalPointsIssued": 5107, "totalPointsRedeemed": 0,
  "totalPointsExpired": 0, "totalPointsAdminAdjusted": 5000,
  "redemptionRatePct": 0, "totalRedemptions": 0,
  "activeMembers": 3, "blockedUsers": 0,
  "issuedVsRedeemedDaily": [ { "day": "2026-07-01", "issued": 1200, "redeemed": 400 } ],
  "topEarners": [ { "userId": 45, "userName": "Ali", "points": 3200 } ]
}
```

## I2 ✅ `GET /api/loyalty/admin/GetRewardPerformance?from=&to=`
```json
[{ "rewardId": 12, "rewardName": "Free Coffee", "isActive": true,
   "pointsCost": 200, "redemptions": 40, "cancelledRedemptions": 2,
   "pointsSpent": 8000, "remainingStock": null }]
```
`remainingStock` null = unlimited; includes zero-redemption rewards.

## F1 ✅ `GET /api/loyalty/admin/GetBlockedUsers`
```json
[{ "userId": 45, "userName": "Ali", "reason": "Fraud",
   "blockedAt": "2026-07-01T10:00:00", "blockedUntil": null,
   "blockedByUserId": 2, "blockedByUserName": "Admin" }]
```
Only **currently** blocked (expired temporary blocks excluded).

## F2 ✅ `GET /api/loyalty/admin/GetBlockedProviders`
```json
[{ "providerType": "ServiceProvider", "providerId": 17, "providerName": "Cable Cafe",
   "reason": "Abuse", "blockedAt": "...", "blockedUntil": null, "blockedByUserId": 2 }]
```

## H1 🟡 `GET /api/loyalty/admin/GetAllTiers` (read-only delivered)
```json
[{ "id": 1, "name": "Bronze", "minPoints": 0, "multiplier": 1.0,
   "bonusPoints": 0, "iconUrl": null, "isActive": true }]
```
Ordered by `minPoints`. **CRUD pending → B-1a.**

## H2 🟡 `GET /api/loyalty/admin/GetUpcomingExpiries?from=&to=` (default next 90d)
```json
{ "fromUtc": "...", "toUtc": "...", "totalPointsExpiring": 0, "usersAffected": 0,
  "users": [ { "userId": 45, "userName": "Ali", "pointsExpiring": 300, "earliestExpiry": "..." } ] }
```
> ⚠️ Returns empty until an **expiry policy** stamps `ExpiresAt` on earns → **B-1b.**

## J1 ✅ `POST /api/loyalty/admin/BulkAwardPoints`
**≥1 filter required** (guards against awarding everyone). `points` 1–100,000. Blocked
accounts skipped (counted). Each award = a row-locked AdminAdjust ledger entry with
the admin actor.
```json
// request
{ "carTypeId": null, "carModelId": null, "city": "Amman", "tierId": null, "points": 100, "note": "Eid bonus" }
// response
{ "targetedUsers": 500, "awardedUsers": 498, "skippedBlockedUsers": 2, "pointsAwardedTotal": 49800 }
```

## K1 🟡 `POST /api/loyalty/admin/ReverseTransaction` (points side)
Idempotent (a tx reverses once). Offer/Partner must be **Completed**; **Pending**
redemption → use `CancelRedemption`; **Fulfilled** redemption → cancelled + stock
freed; a reversal can't be reversed; never pushes balance below zero. **Points only —
wallet/settlement not touched → B-1c.**
```json
// request
{ "activityType": "Offer | Partner | Redemption | PointsAdjustment", "transactionId": 123, "reason": "duplicate scan" }
// response
{ "reversalTransactionId": 9100, "pointsDelta": -35, "newBalance": 4965 }
```

## K2 🟡 `GET /api/loyalty/admin/GetAdjustmentReasons` + `AdjustPoints.reasonCode`
Codes: `COMPENSATION, CORRECTION, PROMOTION, CAMPAIGN, FRAUD_CLAWBACK, SUPPORT_GOODWILL, OTHER`.
`POST /admin/AdjustPoints` now accepts optional `reasonCode` (validated; stamped as `[CODE] note`).
**Needs localized labels → B-2d.**

## L1 ✅ `GET /api/loyalty/admin/GetFlaggedActivity?windowHours=24`
Rules: `EARN_VELOCITY` (≥10 earns/window), `REDEMPTION_VELOCITY` (≥3/window),
`BALANCE_SWING` (≥1000 net non-admin/window). Thresholds tunable via query.
```json
[{ "ruleCode": "EARN_VELOCITY", "ruleName": "High earn velocity",
   "userId": 45, "userName": "Ali", "metric": 14, "windowHours": 24 }]
```

## G ✅ Reconciled routes (fixed in portal)
| Was (wrong) | Correct — source of truth |
|---|---|
| `PUT /admin/EndSeason/{id}` | **`POST /api/loyalty/admin/EndSeason`** — no id/body; ends the active season |
| `PUT /admin/FulfillRedemption/{id}` | **`PATCH …/FulfillRedemption/{id}`** |
| `PUT /admin/CancelRedemption/{id}` | **`PATCH …/CancelRedemption/{id}`** |
| `GetAllSeasons` = `[{ id, name, description, startDate, endDate, isActive, createdAt }]` | now real |
| `GetAllRedemptions` | now real (see D1) |

> All pre-existing loyalty admin writes are now Admin-role gated;
> `GetProviderRedemptions` stays token-only (provider owners use it).

---

# Part B — Still needed (proposed contracts)

> **New findings** from the admin's screen-by-screen review are appended under
> **§4 New findings** below (dated). Everything above §4 is the original request set.


## 1a. 🔴 Tier CRUD  *(product decided: editable)* — **P0**
```
POST   /api/loyalty/admin/CreateTier      body: TierDto (no id) -> new id
PUT    /api/loyalty/admin/UpdateTier/{id}  body: TierDto
DELETE /api/loyalty/admin/DeleteTier/{id}
```
`TierDto = { id, name, minPoints, multiplier, bonusPoints, iconUrl, isActive }`.
Rules: `minPoints` unique & ≥ 0; deleting a tier with members → reassign or `400`.

## 1b. 🔴 Expiry policy — **P0**
```
GET /api/loyalty/admin/GetExpiryPolicy   -> { "monthsToExpire": 12, "isEnabled": true }
PUT /api/loyalty/admin/UpdateExpiryPolicy body: { "monthsToExpire": 12, "isEnabled": true }
```
When enabled, earn flow stamps `ExpiresAt = earnedAt + monthsToExpire` so H2 populates.
**Confirm default: 12 months rolling.**

## 1c. 🔴 Money-side reversal (extends K1) — **P1**
Add optional `"reverseWallet": true` to `ReverseTransaction`; when set and the tx has a
linked wallet entry, reverse it and flag/adjust the **settlement** (respecting locking).
Response adds `walletTransactionId`, `settlementId` (null when not applicable).

## 2a. 🔴 Server-side user search (general) — **P1**
```
GET /api/users/search?q={name|email|phone|id}&page=&pageSize=
-> paged [{ id, name, email, phone, city, isBlockedLoyalty? }]
```
Replaces client-side filtering of `GetAllUsers` in the loyalty user-picker & bulk-award preview.

## 2b. 🟡 `GetLoyaltySummary` — return the window used — **P2**
Add `"fromUtc"`, `"toUtc"` (the actual daily-series window) to the response for precise chart labels.

## 2c. 🟡 Confirm enum domains — **P2**
Publish/confirm the value sets for `activityType`, transaction `status`, and
`transactionType` so the portal renders fixed filter chips.

## 2d. 🔴 Reason codes — localized labels — **P1**
`GetAdjustmentReasons` → `[{ "code": "COMPENSATION", "label": "Compensation", "labelAr": "تعويض" }]`.

## 3a. 🔴 Loyalty notifications/triggers — **P2**
Points-expiring reminder (needs 1b), tier-upgrade congrats, large-adjustment notice —
BE-emitted, or expose segments for admin-triggered campaigns.

## 3b. 🔴 Export — **P2**
`?format=csv` (streamed, ignores paging) on `GetAllPointsTransactions`,
`GetAllRedemptions`, and settlement lists — for finance/audit.

## 3c. 🟡 `performedBy` completeness — **P2**
Ensure offer/partner `confirmedByUser` staff actor is consistently populated in
`GetTransactionDetail` and the ledger (some rows may be null where a staff actor exists).

## 4. New findings (screen-by-screen review)

_As the admin reviews each screen, new backend needs are logged here with a date._

<!-- Append new items below, e.g.:
### 4.x 🔴 <short title>  — found on <screen> (YYYY-MM-DD)  — P?
<what's missing / needed> · <proposed endpoint or field> · <why>
-->

### 4.1 🟢 Welcome bonus + Loyalty boosts admin UI — built (2026-08-20) — **confirm DTO shapes**
New admin screen **Loyalty Boosts** (`/loyalty-boosts`, under Loyalty System) built against the
2026-08-19 API changes. It consumes the documented endpoints; below is the **exact request/response
shape the UI now assumes** — BE please confirm field names or correct here so we can adjust.

**A. Welcome bonus** — `GET/PUT api/settings/welcome-bonus`
- GET response consumed: `{ "multiplier": number, "isEnabled"?: bool, "isDefault"?: bool }`
  (only `multiplier` is required; `isEnabled`/`isDefault` are used for badges — safe to omit).
- PUT body sent: `{ "multiplier": number }` (1–10; 1 disables). UI already blocks <1 / >10 before sending.

**B. Loyalty boosts** — `api/loyalty/boosts`
- `GET api/loyalty/boosts` → array of:
  ```json
  { "id": 1, "name": "Weekend x2", "multiplier": 2.0,
    "startsAt": "2026-08-22T00:00:00Z", "endsAt": "2026-08-31T21:00:00Z",
    "dailyStartMinute": 1080, "dailyEndMinute": 1380,
    "daysOfWeekMask": 65, "isActive": true }
  ```
  - `startsAt`/`endsAt`: **UTC ISO**, nullable (null = unbounded). UI sends them as UTC (`toISOString()`).
  - `dailyStartMinute`/`dailyEndMinute`: minutes from midnight **Jordan local**, nullable (null = all-day).
  - `daysOfWeekMask`: bitmask, **bit 0 = Sunday** … bit 6 = Saturday. UI sends `0` to mean *every day*
    (no day restriction) — **please confirm 0 = every day** (vs. "no days / never"); if BE treats 0 as
    "never", tell us and we'll send 127 instead.
  - `isActive`: read-only in UI (toggled off only via the deactivate endpoint).
- `POST api/loyalty/boosts` body = the object above **without** `id`/`isActive`.
- `PUT api/loyalty/boosts/{id}` = same body (UI blocks editing a *running* boost client-side; BE should
  still reject it authoritatively).
- `PUT api/loyalty/boosts/{id}/deactivate` (no body).
- **RESOLVED 2026-08-20 from the 08-19 doc's create body** — earlier the UI omitted the scoping/caps
  fields and the BE 400'd. The full body is now sent: `name`, `nameAr`, `multiplier`, `startsAt`, `endsAt`,
  `dailyStartMinute`, `dailyEndMinute`, `daysOfWeekMask`, `appliesToAllProviders`,
  `providers: [{ providerType, providerId }]`, `priority`, `maxBonusPointsPerUser`, `maxTotalBonusPoints`.
  A boost must declare scope (`appliesToAllProviders: true` OR a non-empty `providers` list) — the UI enforces this.
  Only lingering behavioral check: mask `0` = every day (UI sends 0 for "no day restriction").

---

## Priority (open items)
| Priority | Items |
|---|---|
| **P0** | 1a Tier CRUD · 1b Expiry policy |
| **P1** | 2a User search · 2d Reason labels · 1c Money-side reversal |
| **P2** | 2b Summary window · 2c Enum domains · 3a Notifications · 3b Export · 3c performedBy |

## Admin portal UI status
| Area | State |
|---|---|
| User loyalty account + history (A1/A2) | ✅ `/users/:id/points` |
| Loyalty dashboard / liability (I1) | ✅ `/loyalty-dashboard` |
| Season leaderboard | ✅ `/loyalty-leaderboard` |
| Provider redemptions (`GetProviderRedemptions`) | ✅ dialog on providers/stations |
| Verb/route fixes (G) | ✅ done |
| Global points feed (C1) + tx detail (B3) | 🔴 next |
| Provider activity (B1) | 🔴 next |
| Reason codes (K2) · blocked lists (F1/F2) | 🔴 next |
| Bulk award (J1) · reverse (K1) · reward perf (I2) · fraud (L1) · tiers (H1) | 🔴 next |
