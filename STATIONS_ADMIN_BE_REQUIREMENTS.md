# Backend Requirement — Stations (Charge Management) Admin

**Audience:** Backend team
**Owner:** Admin portal (Cable-Admin)
**Date:** 2026-07-07

---

## 1. 🔴 Station summary aggregate — `GET /api/charging-points/summary`

A single server-side aggregate for the Charge Management header (don't compute
client-side across the full stations list).

- **Auth:** Admin role (Role id 2) → `403` otherwise.
- One DB-aggregate call; safe on every screen load; may cache 1–5 min **except**
  the two "pending" action counts, which should be near real-time.

### Response
```json
{
  "totalStations": 180,
  "active": 180,
  "inactive": 0,
  "verified": 85,
  "pendingVerification": 95,
  "pendingApproval": 12,
  "partnerStations": 6,
  "premiumStations": 9,

  "byType":  [ { "typeId": 1, "name": "Fast",    "count": 120 } ],
  "byStatus":[ { "statusId": 1, "name": "Open",  "count": 150 } ],
  "byCity":  [ { "city": "Amman", "count": 70 } ],
  "byBrand": [ { "brandId": 2, "name": "ABB",    "count": 40 } ],
  "plugTypeDistribution": [ { "plugTypeId": 3, "name": "CCS 2", "count": 210 } ]
}
```

### Field definitions & priority
| Field | Priority | Definition |
|---|---|---|
| `totalStations` | high | All non-deleted charging points |
| `active` / `inactive` | high | By operational status (active = open/available) |
| `verified` | high | `isVerified = true` |
| `pendingVerification` | 🔴🔴 **very high** | `isVerified = false` (admin verification queue) |
| `pendingApproval` | 🔴🔴 **very high** | Charging-point **update requests** with status Pending (approval queue) |
| `partnerStations` | high | Stations that are Cable partners (`isPartner = true`) |
| `premiumStations` | high | Stations with premium station type |
| `byType` | breakdown | Count per charging-point type |
| `byStatus` | breakdown | Count per status |
| `byCity` | breakdown | Count per city — **top N** (e.g. top 10) + optional "Other" bucket |
| `byBrand` | breakdown | Count per charger brand |
| `plugTypeDistribution` | breakdown | Count per plug type across all stations |

> `pendingVerification` and `pendingApproval` must match the counts on the
> **Stations (isVerified=false)** and **Station Requests** screens exactly (the
> summary cards deep-link to those screens).

---

## 2. ✅ Per-station transactions & points — already available (no new work)

"See all transactions/points for a specific station" is served by the already-delivered
**`GET /api/loyalty/admin/GetProviderActivity`** (B1) with
`providerType=ChargingPoint&providerId={stationId}` — unified Offer + Partner +
Redemption feed, plus **`GetTransactionDetail`** (B3) for the per-row detail.
**Built in the admin** as the *Station Activity* dialog (📜 on each station row).

---

## 3. 🔴 Export stations (CSV) — `GET /api/charging-points/...?format=csv`

For 180+ rows: a streamed CSV export (ignores paging) of the station list with the
current filters (type/city/status/brand/verified). For finance/ops.

---

## Related (already logged elsewhere)
- **`CreatedAt` on ChargingPoint** → in `ADMIN_DASHBOARD_BE_REQUIREMENTS.md` (needed
  for "new stations today" and for showing/sorting "date added" here).
- Per-station **complaints** already available via `GetComplaintsByChargingPointId`
  (can be surfaced without new BE).
