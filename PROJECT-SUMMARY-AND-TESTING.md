# Project Summary & Testing Guide

This document summarizes the work done on the Cable Admin app and how to test it.

---

## 1. What We Did (Summary)

### A. Dead Code Audit & Cleanup
- **Removed deprecated feature folders:** `camping-seasons`, `refunds`, `reservations`, `roles` (not used in the live system).
- **Removed old user-management flow:** Replaced by User List + Edit User. Deleted: UsersScreen, UsersScreenHeader, UsersDataGrid, UserDetails, UserForm, UserDeleteConfirmationDialog, related hooks (`use-users-screen`, `use-users`, `use-users-mutations`, `use-roles`), and old services (`users-service`, `roles-service`).
- **Routes & sidebar:** Only active features remain: Dashboard, Charge Management (Stations), Stations Request, Complaints, Users, Car Management, Banners, App Versions, Emergency Services, Send Notification. Removed routes for reservations, refunds, roles, camping-seasons, camping-areas.
- **Navigation:** "Stations Request" and "Pending Requests" were merged into a single **Stations Request** link. The dead **System Data Management** link (404) was removed; the dashboard "System Data Management" card now goes to Car Management.
- **i18n:** Removed namespaces for deleted features (reservations, refunds, roles, campingSeasons, etc.).

### B. App Version Management (Feature #17)
- **Service:** `version-service.ts` — GET all versions, POST add (with `forceUpdate` boolean), PUT update (with `updateForce` boolean), POST check version.
- **UI:** List of versions (Platform, Version, Force Update switch, Edit). Edit modal with version string and force-update toggle. **Semantic versioning** validation (e.g. `1.0.0`).
- **Inline Force Update:** Toggle switch in the table updates the version’s force-update flag without opening the modal.
- Route `/app-versions` and sidebar "App Versions" were already present; no structural change.

### C. Branding
- **App title:** Set to **"Cable Management || كيبل ادارة"** in header, sidebar, browser tab, and footer (en/ar locales and `index.html`).

### D. Global Search & Advanced Filtering (Power User)
- **Global Search (Cmd+K / Ctrl+K):**
  - Modal search across **Stations**, **Users**, and **Complaints**.
  - Command-palette style: type to filter, arrow keys to move, Enter to open (station edit, user edit, or complaints page).
  - Trigger: search icon in the main header or keyboard shortcut.
- **DataGrid (Stations & Users):**
  - Column filters enabled (`disableColumnFilter={false}`, `filterMode="client"`).
  - Toolbar with **Filter** button (`GridToolbarFilterButton`).
  - **Checkbox selection** for multiple rows.
- **Bulk Actions Bar:**
  - Floating bar at bottom when rows are selected: **Clear**, **Export** (CSV), **Delete** (Users only; Stations has no bulk-delete API).

---

## 2. How This Affects the App

| Area | Effect |
|------|--------|
| **Size & clarity** | Fewer routes and sidebar items; no dead links. Smaller bundle and less confusion. |
| **User management** | Single flow: list users → edit user (with cars). No old list/details/form screen. |
| **Stations** | One "Stations Request" entry; filter by status on that screen. |
| **System data** | No generic "System Data Management" page; first system item is Car Management. |
| **App versions** | Admins can manage min version and force update per platform (Android/iOS) with semver validation. |
| **Discovery** | Global search (Ctrl+K) and header icon let users jump to stations, users, or complaints quickly. |
| **DataGrids** | Stations and Users support column filters, filter toolbar, multi-select, and bulk export/delete (users). |
| **Branding** | Consistent "Cable Management || كيبل ادارة" across the app and tab. |

---

## 3. How to Test

### Prerequisites
- Dev server: `npm run dev` (e.g. http://127.0.0.1:3000).
- Log in with a user that has access to the relevant screens.

### 3.1 Dead Code & Navigation
1. **Sidebar:** Confirm only: Dashboard, Charge Management (Stations, Stations Request, User Complaints), User Management (Users), System Data (Car Management, Banners, App Versions, Emergency Services, Send Notification). No Reservations, Refunds, Roles, Camping Seasons, or "System Data Management".
2. **Routes:** Visit `/reservations`, `/refunds`, `/roles`, `/camping-seasons` — should hit **Not Found** (404).
3. **Stations Request:** Open "Stations Request" from Charge Management; use "Filter by Status". Confirm no duplicate "Pending Requests" in sidebar.
4. **Dashboard:** Click "System Data Management" card — should go to **Car Management** (not 404).

### 3.2 App Version Management
1. Go to **App Versions** (sidebar under System Data).
2. **List:** See table with Platform, Version, Force Update (switch), Actions (Edit).
3. **Add:** Add a version (e.g. Android `1.0.0`, Force Update off). Check it appears in the list.
4. **Validation:** Try invalid version (e.g. `1.0` or `x.y.z`) — should show error and disable Save.
5. **Edit:** Open Edit, change version (e.g. `1.0.1`) and/or toggle Force Update; save. Confirm row updates.
6. **Inline switch:** Toggle Force Update in the table; confirm it updates without opening the modal.

### 3.3 Branding
1. Check header title: **Cable Management || كيبل ادارة**.
2. Check browser tab title: same text.
3. Switch language (AR/EN) and confirm title still shows correctly.
4. Check footer: "Cable Management || كيبل ادارة" and version.

### 3.4 Global Search
1. **Open:** Click the **search icon** in the header, or press **Ctrl+K** (Windows/Linux) or **Cmd+K** (Mac). Modal should open.
2. **Empty state:** With empty input, message like "Type to search across Stations, Users, and Complaints."
3. **Search:** Type a station name, user name, or email. Results should appear grouped (stations, users, complaints) with icons.
4. **Keyboard:** Arrow Up/Down to move, **Enter** to select. Selection should navigate (station edit, user edit, or complaints).
5. **Mouse:** Click a result — same navigation.
6. **Close:** **Escape** or click outside — modal closes.

### 3.5 Advanced Filtering (Stations & Users)
1. **Stations** (`/charge-management`):
   - Toolbar above grid with **Filter** button; click it and use column filters.
   - Column headers: filter icon/panel where applicable.
   - Select several rows with checkboxes; **Bulk Actions** bar appears at bottom.
   - **Export:** Export selected; open CSV and confirm selected stations.
   - **Clear:** Clears selection; bar disappears.
   - **Delete:** (Stations) Only clears selection (no bulk delete API).
2. **Users** (`/users`):
   - Same: toolbar with Filter, column filters, checkboxes.
   - Select multiple users; bar appears.
   - **Export:** CSV with selected users.
   - **Delete:** Click Delete → confirmation "Delete X selected users?" → Confirm; users are deleted and list refreshes.

### 3.6 Quick Sanity Checklist
- [ ] Login works.
- [ ] Dashboard loads; cards navigate correctly.
- [ ] Stations list loads; add/edit station works.
- [ ] Stations Request loads; filter and actions work.
- [ ] Users list loads; edit user and user cars work.
- [ ] App Versions: add, edit, force-update switch work.
- [ ] Global Search opens (icon + Ctrl+K); search and navigation work.
- [ ] Stations/Users: column filter, toolbar, selection, bulk export/delete (users) work.
- [ ] No console errors on main flows.
- [ ] Build: `npm run build:dev` succeeds.

---

## 4. Commands Reference

| Command | Purpose |
|---------|--------|
| `npm run dev` | Start dev server |
| `npm run typecheck` | TypeScript check |
| `npm run build:dev` | Production-like build (development mode) |
| `npm run lint` | ESLint |

---

## 5. Key Files (for reference)

| Feature | Main files |
|---------|------------|
| Global Search | `src/components/GlobalSearch.tsx`, `src/stores/global-search-store.ts` |
| Bulk bar | `src/components/BulkActionsBar.tsx` |
| DataGrid options | `src/components/AppDataGrid.tsx` (enableColumnFilter, enableToolbar, checkboxSelection) |
| App versions | `src/features/system/services/version-service.ts`, `VersionControl.tsx`, `AppVersionsScreen.tsx` |
| Routes | `src/pages/AppContainer.tsx` |
| Sidebar | `src/features/app/components/AppCollapsibleSidebar.tsx` |
| Header (search icon) | `src/features/app/components/AppHeader.tsx` |
| Stations grid | `src/features/charge-management/components/ChargeManagementScreen.tsx` |
| Users grid | `src/features/users/components/UserListScreen.tsx` |

Use this summary for handover and the testing section to verify behavior after changes or deployments.
