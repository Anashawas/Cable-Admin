# Dead Code Audit

This document lists files and lines you can safely delete or fix. It covers: unused components, ghost imports, dead interfaces/types, and obsolete mock data.

---

## 1. Unused components (safe to delete)

### Standalone unused `.tsx` (never imported)

| File | Notes |
|------|--------|
| `src/features/dashboard/components/Dashboard.tsx` | Never imported; app uses `DashboardScreen.tsx` instead. |

### Shared components (exported but never used by any feature)

| File | Notes |
|------|--------|
| `src/components/SelectedItemCardHeader.tsx` | Only uses `RippleBadge`; no other file imports it. |
| `src/components/RippleBadge.tsx` | Only used by `SelectedItemCardHeader.tsx`. |
| `src/components/EmptyList.tsx` | Exported from `components/index.ts` but never imported elsewhere. |

**Action:** Remove the three files above and drop their exports from `src/components/index.ts` (lines 1–3).

### Old user-management flow (replaced by UserListScreen + EditUserScreen)

The route `/users` now uses `UserListScreen`; the following are only used by the old `UsersScreen` (which is lazy-loaded in `AppContainer` but **never used in any route**). Safe to delete after removing the lazy import (see below).

| File | Notes |
|------|--------|
| `src/features/users/components/UsersScreen.tsx` | Old list/details/form screen. |
| `src/features/users/components/UsersScreenHeader.tsx` | Used only by `UsersScreen`. |
| `src/features/users/components/UsersDataGrid.tsx` | Used only by `UsersScreen`. |
| `src/features/users/components/UserDetails.tsx` | Used only by `UsersScreen`. |
| `src/features/users/components/UserDetailsHeader.tsx` | Used only by `UserDetails`. |
| `src/features/users/components/UserBasicInfo.tsx` | Used only by `UserDetails`. |
| `src/features/users/components/UserForm.tsx` | Used only by `UsersScreen`. |
| `src/features/users/components/UserFormHeader.tsx` | Used only by `UserForm`. |
| `src/features/users/components/UserDeleteConfirmationDialog.tsx` | Used only by `UsersScreen`. |
| `src/features/users/hooks/use-users-screen.ts` | Used only by `UsersScreen`. |
| `src/features/users/hooks/use-users.ts` | Used only by `use-users-screen.ts`. |
| `src/features/users/hooks/use-users-mutations.ts` | Used only by `use-users-screen.ts`. |
| `src/features/users/hooks/use-roles.ts` | Used only by `UserForm` and `use-users-screen.ts`. |
| `src/features/users/services/users-service.ts` | Old API (getAllUsers, createUser, updateUser, deleteUser); only used by above hooks. |
| `src/features/users/services/roles-service.ts` | Old roles API; **roles** and **camping-seasons** use their own `roles-service` in their feature folders. |

After deletion, update `src/features/users/index.ts`: remove exports for the deleted components, hooks, and services. Keep exports for `user-service`, `user-car-service`, and any types/hooks used by `UserListScreen` and `EditUserScreen`.

---

## 2. Ghost imports (remove unused symbols)

Fix by deleting the unused import or renaming to `_` where the rule allows.

| File | Line | Unused symbol | Fix |
|------|------|----------------|-----|
| `src/components/ScreenHeader.tsx` | 3 | `MoreVert` | Remove from import. |
| `src/components/ScreenHeader.tsx` | 25–28 | `showMoreButton`, `onMoreClick`, `t` | Remove or prefix with `_`. |
| `src/features/app/components/AppCollapsibleSidebar.tsx` | 35 | `PRIVILEGES` | Remove from import. |
| `src/features/authentication/components/Login.tsx` | 8–9 | `useMediaQuery`, `useTheme` | Remove from import. |
| `src/features/camping-seasons/components/CampingSeasonDetailsHeader.tsx` | 20 | `campingSeason` (param) | Rename to `_campingSeason`. |
| `src/features/camping-seasons/components/CampingSeasonForm.tsx` | 24 | `CampingSeasonDetail` | Remove from import. |
| `src/features/charge-management/components/ChargeManagementScreen.tsx` | 18 | `DataGrid` | Remove from import. |
| `src/features/charge-management/components/LocationPicker.tsx` | 11 | Unused eslint-disable | Remove the directive. |
| `src/features/charge-management/components/StationFormScreen.tsx` | 50 | `parsePaymentString` | Remove from import. |
| `src/features/charge-management/components/StationsRequestScreen.tsx` | 13, 15 | `Grid`, `DataGrid` | Remove from imports. |
| `src/features/refunds/components/RefundDetails.tsx` | 38, 119, 173, 183 | `anchorEl`, `handleMenuClose`, `attachmentIds`, `error` | Remove or prefix with `_`. |
| `src/features/refunds/components/RefundDetailsHeader.tsx` | 12, 24 | `RESERVATION_STATUS`, `refund` (param) | Remove / rename to `_refund`. |
| `src/features/reservations/components/ReservationDetails.tsx` | 2 | `Card`, `CardContent`, `Typography` | Remove from import. |
| `src/features/reservations/components/ReservationDetailsHeader.tsx` | 23 | `reservation` (param) | Rename to `_reservation`. |
| `src/features/roles/components/RolesScreenHeader.tsx` | 2 | `FilterList` | Remove from import. |
| `src/features/users/components/UserDetailsHeader.tsx` | 20 | `user` (param) | Rename to `_user`. |
| `src/lib/@axios.ts` | 91 | `error` (param) | Rename to `_error`. |
| `src/pages/AppContainer.tsx` | 19 | `UsersScreen` (lazy) | **Delete the whole line** (lazy import). |
| `src/stores/basemap-store.ts` | 10 | `get` (param) | Rename to `_get`. |
| `src/stores/layers-list-store.ts` | 22 | `get` (param) | Rename to `_get`. |

Optional (warnings): `src/main.tsx` (lines 18–20) and a few other files have `console` statements; remove or guard with env if you want zero warnings.

---

## 3. Dead interfaces / types

### Only defined, never referenced elsewhere

- **`src/features/dashboard/constants/dashboard-menu.ts`**  
  - `DASHBOARD_SECTIONS` (and type `DashboardSection`) – only defined here; `DashboardScreen` uses `DASHBOARD_MENU_ITEMS` only. You can delete the `DASHBOARD_SECTIONS` export and, if nothing else uses `DashboardSection`, the type.

### In `src/features/users/types/api.ts` (after removing old user flow)

If you delete the old UsersScreen chain and `users-service.ts` / `roles-service.ts`, these types become dead and can be removed from `api.ts`:

- `Governorate`
- `Role` (the first one; keep `RoleDto` for the new flow)
- `User` (the old list/detail user; keep `UserSummaryDto` / `UserDetailDto`)
- `PaginationRequest`
- `GetAllUsersRequest`, `GetUsersResponse`
- `CreateUserRequest`, `UpdateUserRequest`, `ChangePasswordRequest`
- `UserFilters`
- `GetAllRolesRequest`, `RoleResponse`, `GetAllRolesResponse`

Do **not** remove: `RoleDto`, `UserSummaryDto`, `UserCarDto`, `UserDetailDto`, `UpdateUserRequestSpec`, `AddUserCarRequest`, `CarModelDto`, `CarTypeWithModelsDto`, `UserCarModelDto` (used by `user-service`, `user-car-service`, `UserListScreen`, `EditUserScreen`, `UserCarsSection`).

---

## 4. Mock data

- **`src/features/dashboard/types/api.ts`** – `MOCK_DASHBOARD_STATS` is used as an intentional fallback in `dashboard-service.ts` when the stats API fails. **Keep it** unless you remove the fallback behavior.
- No other `mockData.ts` or obsolete mock constants were found; the rest of the app uses real API services.

---

## 5. One-line fix to apply immediately

Remove the unused lazy import in `AppContainer.tsx`:

```ts
// DELETE THIS LINE:
const UsersScreen = lazy(() => import("../features/users/components/UsersScreen"));
```

This removes the ESLint error and confirms `UsersScreen` is not used in any route.

---

## Summary

| Category | Action |
|----------|--------|
| **Unused components** | Delete 1 dashboard component, 3 shared components, and the old user flow (9 components + 4 hooks + 2 services); update `components/index.ts` and `users/index.ts`. |
| **Ghost imports** | Remove or rename ~20 unused symbols across the listed files (and remove the `UsersScreen` lazy line). |
| **Dead types** | Remove `DASHBOARD_SECTIONS` (and optionally `DashboardSection`); after old user cleanup, remove the listed types from `users/types/api.ts`. |
| **Mock data** | None to delete; dashboard mock is intentional. |

Applying the one-line `UsersScreen` removal and the ghost-import fixes will clear the current ESLint errors; the rest can be done in a follow-up cleanup.
