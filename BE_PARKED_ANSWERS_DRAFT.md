# Parked Items — Proposed Answers (Admin → Backend)

**Re:** the "Parked — waiting on answers" section of the BE responses
**Date:** 2026-07-09
**Status:** ⚠️ **DRAFT — business owner must confirm before sending.** These are the
admin/product-side *recommendations*; the numbers/rules in **bold** need sign-off.

---

## C5 — Settlement due-date grace (N days)

**Question:** due = settlement week end + **N days** — what is N?

**Proposed:** **N = 7 days.** A weekly settlement (Sun–Sat) becomes **due 7 days
after the week ends** (i.e. the following Saturday). Overdue = unpaid past that.

- Rationale: gives providers/finance one full week to reconcile before it's flagged
  overdue; matches the weekly cadence so due dates are predictable.
- Ship as a **computed `dueDate`** on the settlement DTO (no schema change, per BE).
- FE already shows "pending N days" from `createdAt`; it will switch to real
  overdue styling once `dueDate` lands.

> Confirm N (7?) with finance.

---

## C8 — Refund action (the money write)

**Question:** what gets refunded (points? wallet?), until when, who may do it.

**Proposed:**
- **What:** a refund reverses **one offer/partner transaction** end-to-end —
  the **user's points** are restored (reuse the K1 reversal path) **and** the
  **provider wallet** entry for that transaction is reversed (commission credited
  back / offer-payment debited back), so wallet + settlement stay consistent.
- **Until when:** only while the transaction's settlement is **Pending or
  Disputed**. Once the settlement is **Paid (locked)**, no refund — correct via a
  manual wallet adjustment instead. Also only for **Completed** transactions.
- **Who:** **Admin role only** (same gate as the rest of `/admin`).
- **Idempotent + audited:** a transaction can be refunded once; record the admin
  actor + reason.
- **API:** `POST /api/offers/RefundTransaction { transactionId, reason }` →
  `{ pointsRestored, walletDelta, newWalletBalance }`, plus the **`canRefund`**
  flag per wallet-history row (true only when the above conditions hold).

> FE is already forward-ready: the wallet row shows a **Refund** chip when
> `canRefund` is true; it's hidden until BE returns it.
> **Needs finance/product sign-off** (it moves money).

---

## C7 — Recompute trigger

**Question:** confirm recompute may only touch **Pending/Disputed** periods.

**Proposed / confirmed from our side:** **Yes — recompute must skip Paid
settlements.** Paid is a locked financial record; recomputing it would break the
invariant. Recompute should only re-derive **Pending/Disputed** periods (e.g. when
transactions changed after generation). A Paid period that genuinely needs
correction is handled by a manual wallet adjustment, not recompute.

---

## H2 — Loyalty points expiry policy

**Question:** months-to-expire rule needed before points can expire.

**Proposed:** **Points expire 12 months after they are earned** (rolling per-earn
expiry, not a hard calendar reset). Provide it as **config** so it's tunable:
`GET/PUT /api/loyalty/admin/ExpiryPolicy { monthsToExpire }` (default **12**).
Stamp `ExpiresAt = earnedAt + monthsToExpire` on each earn row so
`GetUpcomingExpiries` becomes live.

- Rationale: 12 months is the common loyalty default — long enough to feel fair,
  short enough to cap liability. Rolling expiry is easier for users to understand
  than a season wipe.
- Admin UI: once the config endpoint exists, we'll add a small "Expiry policy"
  setting screen + surface `GetUpcomingExpiries`.

> Confirm the **12-month** figure (and whether admin-adjusted points also expire —
> **recommendation: they do NOT expire**, since they're goodwill/corrections).

---

## H1 — Tier CRUD (editable tiers?)

**Question:** should tiers become business-editable?

**Proposed:** **Yes — make tiers admin-editable** (name, `minPoints`, `multiplier`,
`bonusPoints`, `iconUrl`, `isActive`) via standard CRUD
(`Create/Update/Delete/Reorder` under `/api/loyalty/admin/...`), with guards:
- `minPoints` must stay strictly increasing across active tiers (no gaps/overlap).
- Changing a tier **recomputes tier membership** going forward only (don't
  retroactively claw back multipliers already applied).
- Can't delete a tier that users currently sit in (deactivate instead).

- Rationale: marketing will want to tune thresholds/multipliers for campaigns
  without a deploy. It's Phase-3 scope per BE — fine to schedule after the money
  items.
- Admin UI: we'll build a Tiers management screen once CRUD lands (today
  `GetAllTiers` is read-only).

> Lower priority than the money items (C8) — schedule after.

---

## Suggested order back to BE
1. **C7** (just a confirmation — unblocks recompute).
2. **C5** (due-date N — trivial once N is set).
3. **C8** (refund — needs finance sign-off; highest business value).
4. **H2** (expiry policy — sets liability behaviour).
5. **H1** (tier CRUD — nice-to-have, schedule last).
