# BE Notes — Station Followers & Sent Notifications (Admin)

**Date:** 2026-09-15
**Feature:** In Cable-Admin → Charge Management, each station now shows its **followers** (users who favorited it) and the **notifications its owner sent** to those followers.

## ✅ Update: the endpoints already exist — admin now uses them directly

The admin was **rewired to the existing partner endpoints** (verified on live — they return `401` unauthenticated, i.e. they exist and need auth). No new endpoints required for the lists:

| Data | Endpoint (already live) |
|---|---|
| Followers list | `GET /api/provider/favorites/ChargingPoint/{id}?page=&pageSize=` |
| Sent notifications | `GET /api/provider/favorites/ChargingPoint/{id}/notifications?page=&pageSize=` |

Response shapes are the partner ones (`FansPage` / `PartnerNotificationsPage`) — items + `totalCount` + `hasNextPage`, camelCase or PascalCase both handled by the client.

## ⚠️ The only two open BE items

1. **Authorize the ADMIN role on those two provider endpoints.**
   They currently allow **owner / worker / admin**. Please confirm a platform **admin token** is accepted (not just the station's own owner) — otherwise the admin dialog will get `403`. If admin isn't already allowed, add the admin role to the auth policy on:
   - `GET /api/provider/favorites/{type}/{id}`
   - `GET /api/provider/favorites/{type}/{id}/notifications`

2. **Populate `favoritesCount` on `GetAllChargingPoints`.**
   The field is already in the response but returns **0 for all 211 stations** (checked on live). It drives the "Followers" count column in the stations table. Please compute it (same count the followers endpoint returns).
   *(Not blocking the dialog — the dialog reads the real list/count from the followers endpoint regardless. It only affects the at-a-glance column number.)*

## Notes
- Followers from this endpoint carry `{ userId, name, city, favoritedAt }` — **no phone/email** (backend omits them here). The admin UI shows name · city · date.
- Notifications carry `{ id, title, body, status, notificationTypeName, sentByName, sentAt, recipientCount, deliveredCount, readCount }`. The admin shows title, type, status chip (sent/pending/rejected), body, date, sender, recipients & read count.
