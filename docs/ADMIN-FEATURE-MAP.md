# Cable Admin Portal – Feature Plan Mapping

This document maps the **Cable Complete Feature Plan** (Service Providers, Offers, Loyalty, Partners) to the existing admin portal and lists what can be applied next.

---

## 1. What the admin already has

### Phase 0: Service Providers & Categories ✅

| Document | Admin implementation |
|----------|----------------------|
| `GetAllServiceCategories` | **Service Categories** screen – list/manage categories |
| `CreateServiceCategory` / `UpdateServiceCategory` | ServiceCategoriesScreen |
| `GetAllServiceProviders` (with category filter) | **Service Providers** screen – list, filters, sort |
| `GetServiceProviderById` | Provider detail dialog |
| `VerifyServiceProvider` | Verify button on each row |
| `CreateServiceProvider` / `UpdateServiceProvider` / `DeleteServiceProvider` | Add/Edit/Delete provider dialogs |
| Provider offers | “View offers” per provider, edit offer dialog (title, commission %, dates, etc.) |

**Routes:** `/service-categories`, `/service-providers`

---

### Phase 0.5: Offers & Transactions ✅ (with one gap)

| Document | Admin implementation |
|----------|----------------------|
| Conversion rates: `GetAll`, `Create`, `Update` | **Conversion Rates** screen |
| `GetPendingOffers` | **Pending Offers** screen – list pending offers |
| `ApproveOffer` / `RejectOffer` (with note) | Approve / Reject actions + reject reason dialog |
| `UpdateOffer` / `DeactivateOffer` | Edit offer from Service Providers “View offers” |
| `GetSettlements` (filter by status, year, month) | **Settlements** screen – table + filters |
| `GetSettlementSummary` | Summary cards (e.g. total commission) |
| `UpdateSettlementStatus` | Update status (e.g. Pending → Invoiced → Paid) in Settlements |
| **`GenerateSettlement`** | **⚠️ API is in `offers-service` + `useGenerateSettlement` hook, but no UI button/dialog** |

**Routes:** `/conversion-rates`, `/pending-offers`, `/settlements`

**Recommendation:** Add a “Generate settlement” action on the Settlements screen (e.g. year/month picker + button) that calls `useGenerateSettlement`.

---

### Phase 1: Loyalty System ✅

| Document | Admin implementation |
|----------|----------------------|
| Seasons: `CreateSeason`, `EndSeason` | **Loyalty Management** – seasons (create/end) |
| Rewards: create/update (catalog) | Loyalty Management – rewards |
| Redemptions: list, `FulfillRedemption`, `CancelRedemption` | **Redemptions** screen |
| `GetProviderRedemptions` | Redemptions filters (e.g. by provider) |
| `AdjustPoints` | **Point Adjustments** screen |

**Routes:** `/loyalty-management`, `/redemptions`, `/point-adjustments`

---

### Phase 2: Partner Transactions (Permanent Partnerships) ❌ Not implemented

| Document endpoint | Status in admin |
|-------------------|-----------------|
| `GET /api/partners/admin/GetAllPartnerAgreements` | Not used |
| `POST /api/partners/admin/CreatePartnerAgreement` | Not used |
| `PUT /api/partners/admin/UpdatePartnerAgreement/{id}` | Not used |
| `PUT /api/partners/admin/DeactivatePartnerAgreement/{id}` | Not used |

**Difference from offers:** Partners are permanent (no approval flow); admin creates agreements directly; code prefix `PTR-XXXXXX`; commission/points work like offers but always-on.

**Recommendation:** Add a **Partners** module in the admin: list agreements, create/edit (provider type + provider id, commission %, points %, code expiry, active), and deactivate. Settlement already combines offers + partners on the backend, so no change needed there once partners exist. Partners use the **Cable Partner** app to confirm PTR transactions; the admin only manages the agreements.

---

## 2. Optional alignments with the document

- **Charging points (stations)**  
  The plan treats charging points similarly to service providers (ratings, favorites, offers). The admin already has:
  - Charge Management list with **Verified** column and filters.
  - No “Verify charging point” action or “View/Edit offers for this station” in the UI.  
  If the backend exposes:
  - `VerifyChargingPoint/{id}` and/or  
  - Offer listing/editing by `providerType: "ChargingPoint"` + `providerId`,  
  then you can add “Verify” and “View offers” (and optionally edit offers) from the station list, mirroring Service Providers.

- **Loyalty “GetAllSeasons”**  
  Already used in the admin (e.g. Loyalty Management) for listing seasons; no change needed.

---

## 3. Suggested implementation order

| Priority | Item | Effort | Notes |
|----------|------|--------|--------|
| 1 | **Generate Settlement UI** | Small | Add year/month + “Generate settlement” button on Settlements screen; call existing `useGenerateSettlement`. |
| 2 | **Partners module** | Medium | New feature: types, service, hooks, list screen, create/edit/deactivate agreement; add route and sidebar under e.g. “Offers” or new “Partners” group. |
| 3 | **Charging point verify + offers** | Small–Medium | Only if backend supports: “Verify” button and “View offers” (and edit) from Charge Management, reusing existing offer types/API. |

---

## 4. Summary

- **Already applied:** Service Providers & Categories, Offers (pending, approve/reject, update/deactivate), Conversion Rates, Settlements (list, summary, update status), Loyalty (seasons, rewards, redemptions, point adjustments).
- **Quick win:** Expose **Generate Settlement** on the Settlements screen.
- **Main gap:** **Partner agreements** (Phase 2) – new admin flows for create/update/deactivate and list.
- **Optional:** Charging point verify + offers from station list, if the API supports it.

Use this as the single reference for what is implemented and what to apply next in the admin portal.
