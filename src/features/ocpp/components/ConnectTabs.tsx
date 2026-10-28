import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { Tab, Tabs } from "@mui/material";

export type ConnectTab = "overview" | "payments" | "sessions" | "reports" | "settings";

/** Cable Connect sections: the fleet overview, the charging revenue page and the live-charging pages. */
export default function ConnectTabs({ value }: { value: ConnectTab }) {
  const { t } = useTranslation();
  return (
    <Tabs
      value={value}
      aria-label={t("ocpp@payments.tabs.label")}
      variant="scrollable"
      allowScrollButtonsMobile
      sx={{ borderBottom: 1, borderColor: "divider", minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 700 } }}
    >
      <Tab value="overview" label={t("ocpp@payments.tabs.overview")} component={RouterLink} to="/cable-connect" />
      <Tab value="payments" label={t("ocpp@payments.tabs.payments")} component={RouterLink} to="/cable-connect/payments" />
      <Tab value="sessions" label={t("liveCharging@nav.sessions")} component={RouterLink} to="/charging-sessions" />
      <Tab value="reports" label={t("liveCharging@nav.plugReports")} component={RouterLink} to="/plug-reports" />
      <Tab value="settings" label={t("liveCharging@nav.settings")} component={RouterLink} to="/cable-connect/settings" />
    </Tabs>
  );
}
