# Backend Requirement — Admin Dashboard Summary

**Audience:** Backend team
**Owner:** Admin portal (Cable-Admin)
**Date:** 2026-07-07
**Status:** 🔴 Requested — not implemented

## Why

The dashboard headline numbers are currently computed **client-side** by pulling
full lists (e.g. `GetAllUsers`) and filtering. With **20,000+ users** and growing
this is slow and doesn't scale — and some numbers (**QR scans**, cross-provider
totals) are **impossible** client-side because transactions are only queryable
per-provider. We need a **single server-side aggregate** endpoint.

## Endpoint

```
GET /api/dashboard/summary
```
- **Auth:** Admin role (Role id 2); `403` otherwise.
- **"Today"** = the current day in **Asia/Amman** (Jordan local), matching the rest of the app.
- **Must be a single call** computed with DB aggregates (no per-provider iteration / no N+1).
- Return `asOf` so the UI can show "updated X ago".

## Response

```json
{
  "asOf": "2026-07-07T09:30:00",
  "date": "2026-07-07",

  "actionRequired": {
    "pendingStationUpdateRequests": 12,
    "stationsPendingVerification": 8,
    "openComplaints": 17
  },

  "today": {
    "newUsers": 42,
    "qrScans": { "partner": 130, "offers": 54 },
    "pointsGiven": 5200,
    "usersEarnedPoints": 88,
    "newProviders": 1,
    "newPartners": 0,
    "newStations": 3
  }
}
```

## Field definitions & priority

Priority = how prominently the admin UI highlights it.

| Field | Priority | Definition |
|---|---|---|
| `actionRequired.pendingStationUpdateRequests` | 🔴🔴 **very high** | Count of charging-point update requests with status **Pending** (the admin approval queue). |
| `actionRequired.stationsPendingVerification` | 🔴🔴 **very high** | Count of charging points with `isVerified = false` (awaiting admin verification). |
| `actionRequired.openComplaints` | 🔴 **high** | Count of user complaints that are **not resolved** (open/new/follow-up states). |
| `today.newUsers` | 🔴 **high** | Users whose `createdAt` is today. |
| `today.qrScans.partner` | 🔴 **high** | **Partner** QR scans today (`ScanPartnerCode` — completed partner transactions created today). |
| `today.qrScans.offers` | 🔴 **high** | **Offer** QR scans today (`ScanOfferCode` — completed offer transactions created today). |
| `today.pointsGiven` | 🔴 **high** | Total loyalty **points awarded** today (sum of positive points ledger entries today). |
| `today.usersEarnedPoints` | 🔴 **high** | **Distinct** users who earned points today. |
| `today.newProviders` | ⚪ low | Service providers created today. |
| `today.newPartners` | ⚪ low | Partner agreements created today. |
| `today.newStations` | ⚪ low | Charging points created today (requires the new `ChargingPoint.CreatedAt` — see **Required change** below). |

> **Removed** (not needed on the dashboard): total users, total stations, active/inactive
> split, revenue/commission, loyalty liability, analytics views/calls, most-visited /
> by-city charts stay as-is (already client-side).

## Performance / freshness rules
- **Action-required counts** (`pendingStationUpdateRequests`, `stationsPendingVerification`,
  `openComplaints`) should be **near real-time** (these are operational queues an admin
  acts on) — no stale cache, or ≤ 30s.
- The **"today" counters** may be cached **1–5 min** (exact real-time not critical).
- One round trip; safe to call on every dashboard load.

## Required change — add `CreatedAt` to ChargingPoint 🔴

`ChargingPoint` currently has **no creation date**, so "new stations today" can't be
computed. Please **add `CreatedAt`** to the charging-point entity and:
- use it for `today.newStations` in this summary;
- expose it on **`GetAllChargingPointsDto`** and **`GetChargingPointByIdDto`** (ISO,
  Jordan-local like other dates) so the admin can also show/sort stations by
  "date added" later.

If the column doesn't exist yet, backfill existing rows with a sensible value (e.g.
first-seen / migration timestamp) so the field is non-null.

---

## Suggestions from the admin portal (nice-to-have, your call)

1. **Day-over-day deltas.** Each `today.*` number is far more useful with a comparison.
   Add `yesterday` values (or a `deltaPct`) so the UI can show `42 ▲ +40%`. Cheap to
   compute, high business value.
   ```json
   "today": { "newUsers": { "value": 42, "yesterday": 30 }, ... }
   ```
   *(If you prefer to keep it flat, a parallel `yesterday` block works too.)*

2. **Aging on the action queues.** For `pendingStationUpdateRequests` /
   `stationsPendingVerification`, also return the **oldest item age** (e.g.
   `oldestPendingDays`) so we can flag SLA breaches (a request pending 10 days is worse
   than 10 requests pending 1 hour).

3. **Points redeemed today** alongside points given — since offers *deduct* points and
   partners *award* them, showing both (`pointsGiven` / `pointsRedeemed`) gives the full
   daily loyalty picture with almost no extra cost.

4. **Total transaction value today** (JOD) next to QR scans — scans + money moved is a
   stronger "how's the platform doing today" signal than scan count alone.

5. **`asOf` + short cache** (already in the spec) so we can render "updated 2 min ago"
   and avoid hammering the DB.

6. **Drill-down alignment.** Each card will deep-link to the matching screen (pending
   verification → Stations filtered `isVerified=false`; open complaints → Complaints).
   Please make sure the counts here **match those screens' filters exactly** so numbers
   don't disagree.
