# Backend Requirement — Offers (Create / Update) Admin

**Audience:** Backend team
**Owner:** Admin portal (Cable-Admin)
**Date:** 2026-07-07

---

## 1. 🔴 New field on offers — `pointsPriceValue` (cash value of the points)

When creating/editing an offer we now capture **three** distinct money/points values.
Today the API only stores two; we need the third persisted.

| Field | Meaning | Who it's for |
|---|---|---|
| `pointsCost` | Points the **user** spends to redeem the offer | user side |
| **`pointsPriceValue`** 🆕 | **Cash value those points represent**, derived from the active **conversion rate** (e.g. 100 pts ÷ 50 pts-per-JOD = **2 JOD**) | what the points are *worth* |
| `monetaryValue` | Fixed amount **Cable pays the provider** per redemption (the agreed deal) | Cable ↔ provider settlement |

> `pointsPriceValue` and `monetaryValue` are **not** the same: the first is the
> monetary worth of the points to the user (via the conversion rate); the second
> is the payout Cable owes the provider. Both must be stored.

### The points ⇄ price link (already implemented in the admin UI)
The admin form links `pointsCost` and `pointsPriceValue` **bi-directionally** using
the **default active `ConversionRate`** for the offer's currency
(`GET /api/conversion-rates/GetAllConversionRates` → `pointsPerUnit`):

```
pointsPriceValue = pointsCost / pointsPerUnit      // e.g. 100 / 50 = 2.00 JOD
pointsCost       = round(pointsPriceValue * pointsPerUnit)
```

### What we need from BE
1. Add nullable **`pointsPriceValue` (decimal)** to:
   - `ProposeOffer` request body
   - `UpdateOffer` request body
   - `OfferDto` response (list + detail)
2. **Persist** it as sent by the admin.
3. **Recommended:** validate/compute it server-side from the active conversion
   rate so FE and BE never disagree — if the client omits it, derive it from
   `pointsCost / pointsPerUnit`; if present, it may be stored as-is (admin may
   round). Reject only if wildly inconsistent (optional).
4. It should flow through to **settlement / transaction** records if you want
   points-value reporting later (nice-to-have, not blocking).

### Example payload (ProposeOffer)
```json
{
  "title": "Free coffee",
  "providerType": "ServiceProvider",
  "providerId": 42,
  "pointsCost": 100,
  "pointsPriceValue": 2.00,
  "monetaryValue": 1.50,
  "currencyCode": "JOD",
  "validFrom": "2026-07-08"
}
```

---

## 2. Notes / already available
- The **conversion-rate** catalog already exists
  (`GET /api/conversion-rates/GetAllConversionRates`, returning `pointsPerUnit`,
  `isDefault`, `isActive`, `currencyCode`) and is managed in the admin's
  *Conversion Rates* screen — no new work there; this requirement only reuses it
  to derive `pointsPriceValue`.
- FE is already sending `pointsPriceValue` in the create/update payloads and
  reading it back from `OfferDto` (typed as optional). It's a no-op until BE
  stores/returns it, so shipping order is safe.
