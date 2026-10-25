import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { Tab, Tabs } from "@mui/material";

/** Cable Connect sections: the fleet overview and the charging revenue page. */
export default function ConnectTabs({ value }: { value: "overview" | "payments" }) {
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
    </Tabs>
  );
}
