import type { SvgIconComponent } from "@mui/icons-material";
import EvStation from "@mui/icons-material/EvStation";
import ListAlt from "@mui/icons-material/ListAlt";
import Pending from "@mui/icons-material/Pending";
import People from "@mui/icons-material/People";
import Settings from "@mui/icons-material/Settings";
import LocalHospital from "@mui/icons-material/LocalHospital";
import NotificationsActive from "@mui/icons-material/NotificationsActive";

export interface DashboardMenuItem {
  path: string;
  titleKey: string;
  Icon: SvgIconComponent;
}

export interface DashboardSection {
  headerKey: string;
  items: DashboardMenuItem[];
}

/** Exactly 7 menu cards per spec (Charge Management → Send Notification). */
export const DASHBOARD_MENU_ITEMS: DashboardMenuItem[] = [
  { path: "/charge-management", titleKey: "chargeManagement", Icon: EvStation },
  { path: "/stations-request", titleKey: "stationsRequest", Icon: ListAlt },
  { path: "/pending-requests", titleKey: "pendingRequests", Icon: Pending },
  { path: "/users", titleKey: "userManagement", Icon: People },
  { path: "/car-management", titleKey: "systemDataManagement", Icon: Settings },
  { path: "/emergency-services", titleKey: "emergencyServices", Icon: LocalHospital },
  { path: "/send-notification", titleKey: "sendNotification", Icon: NotificationsActive },
];

/** Dashboard sections with headers and cards (grouped view). */
export const DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    headerKey: "chargeManagement",
    items: DASHBOARD_MENU_ITEMS.slice(0, 3),
  },
  {
    headerKey: "userManagement",
    items: DASHBOARD_MENU_ITEMS.slice(3, 4),
  },
  {
    headerKey: "systemAndOthers",
    items: DASHBOARD_MENU_ITEMS.slice(4, 7),
  },
];
