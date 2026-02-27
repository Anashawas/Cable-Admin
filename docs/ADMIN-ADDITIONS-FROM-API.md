# What We Can Add to the Admin (Based on the API Plan)

Based on the **Cable Complete Feature Plan** APIs, here is what can be added to the admin portal. Each item lists the **API** and the **admin UI** to build.

---

## 1. Generate Settlement (quick add)

**API (already in codebase):**

- `POST /api/offers/admin/GenerateSettlement`  
  Body: `{ year: number, month: number }`  
  Returns: e.g. count of settlement records created.

**What’s missing:** The Settlements screen has no way to trigger this. The service and `useGenerateSettlement` hook already exist.

**Add:**

- On the **Settlements** screen: year dropdown, month dropdown, and a **“Generate settlement”** button.
- On success: show a success message (e.g. “Settlement generated for Jan 2025”) and refresh the settlements list/summary.

**Effort:** Small (one form + one button + wiring).

---

## 2. Partners Module (Phase 2 – full add)

**APIs (not yet in admin):**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/partners/admin/GetAllPartnerAgreements` | List all partner agreements (optional query: `isActive`) |
| POST | `/api/partners/admin/CreatePartnerAgreement` | Create a new agreement |
| PUT | `/api/partners/admin/UpdatePartnerAgreement/{id}` | Update agreement (rates, expiry, note, etc.) |
| PUT | `/api/partners/admin/DeactivatePartnerAgreement/{id}` | Deactivate (soft disable) |

**Agreement payload (from plan):**

- `providerType`: `"ChargingPoint"` | `"ServiceProvider"`
- `providerId`: number (station id or service provider id)
- `commissionPercentage`: number
- `pointsRewardPercentage`: number
- `pointsConversionRateId`: number (optional)
- `codeExpiryMinutes`: number (e.g. 30)
- `isActive`: boolean
- `note`: string (optional)

**Add in admin:**

1. **New feature folder**  
   `src/features/partners/`: types (from API), service (4 calls above), hooks (usePartnerAgreements, useCreate, useUpdate, useDeactivate), components.

2. **Partners list screen**  
   - Route: e.g. `/partners`.
   - Table: provider name, type (Charging Point / Service Provider), commission %, points %, code expiry, active, actions (Edit, Deactivate).
   - Filters: active / inactive.
   - “Add partner” button → open create form.

3. **Create / Edit partner form (dialog or page)**  
   - Provider type: dropdown (Charging Point, Service Provider).
   - Provider: searchable dropdown (load stations if ChargingPoint, load service providers if ServiceProvider).
   - Commission %, points reward %, conversion rate (from existing conversion rates API), code expiry (minutes), note.
   - Create: call `CreatePartnerAgreement`. Edit: call `UpdatePartnerAgreement/{id}`.

4. **Deactivate action**  
   - Row action “Deactivate” → call `DeactivatePartnerAgreement/{id}` → refresh list.

5. **Navigation**  
   - Sidebar: new item “Partners” under **Offers** (or a new “Partners” group). Path: `/partners`.

**Note:** Settlements already combine offers + partners on the backend; no change needed there once partners exist.

**Cable Partner app:** Partners (B2B) use the **Cable Partner** app to look up and confirm PTR codes. In the admin you only manage partner agreements (create, edit, deactivate); the actual transaction flow happens in the Cable Partner app.

**Effort:** Medium (new feature, list + form + 4 API calls).

---

## 3. Charging Point: Verify + Offers (optional, if backend supports)

**APIs (only if implemented on backend):**

- `PUT /api/charging-points/VerifyChargingPoint/{id}` or similar – set station as verified.
- Offers for stations use the **existing** offer APIs with `providerType: "ChargingPoint"` and `providerId: stationId`:
  - `GET /api/offers/GetActiveOffers?providerType=ChargingPoint&providerId={id}`
  - `PUT /api/offers/admin/UpdateOffer/{id}` (already in admin)
  - `PUT /api/offers/admin/DeactivateOffer/{id}` (already in admin)

**What to add:**

- **Charge Management (station list):**
  - **Verify** button per row (if backend has verify endpoint): call verify API, then refresh list.
  - **View offers** action: open a dialog that loads offers for `providerType: "ChargingPoint"` and `providerId: station.id` (reuse same offer list/edit UI as in Service Providers).

**Effort:** Small–medium (depends on whether backend exposes verify and offer-by-provider for ChargingPoint).

---

## 4. Summary Table

| # | Addition | API / Backend | Admin UI | Effort |
|---|----------|----------------|----------|--------|
| 1 | Generate Settlement | Already in app | Button + year/month on Settlements | Small |
| 2 | Partners | New: 4 admin endpoints | New Partners module (list, create, edit, deactivate) | Medium |
| 3 | Station verify + offers | Optional (verify + existing offer APIs) | Verify button + “View offers” on station list | Small–Medium |

Implementing **1** and **2** gives full coverage of the plan’s admin APIs. **3** is optional and depends on backend support.
