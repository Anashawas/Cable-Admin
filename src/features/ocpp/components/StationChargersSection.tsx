import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, Divider, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useOcppChargePoints } from "../hooks/use-ocpp";
import ChargersTable from "./ChargersTable";
import ChargerDetailDialog from "./ChargerDetailDialog";
import RegisterChargerDialog from "./RegisterChargerDialog";
import AuthorizedTagsSection from "./AuthorizedTagsSection";
import { SubscriptionChip, useDateFmt } from "./ocpp-ui";

/** The "Cable Connect" tab of a station: its chargers, subscription state and allowed cards. */
export default function StationChargersSection({ chargingPointId }: { chargingPointId: number }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const [viewId, setViewId] = useState<number | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const list = useOcppChargePoints({ chargingPointId, pageSize: 100 });
  const items = list.data?.items ?? [];
  const subscription = items[0]?.subscription;

  return (
    <Stack spacing={3} divider={<Divider flexItem />}>
      <Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>{t("ocpp@station.chargers")}</Typography>
            {subscription && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{t("ocpp@subscription.title")}:</Typography>
                <SubscriptionChip sub={subscription} />
                {subscription.expiresAt && <Typography variant="caption" color="text.secondary">{t("ocpp@subscription.expiresOn")} {fmt.full(subscription.expiresAt)}</Typography>}
              </Stack>
            )}
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setRegisterOpen(true)} sx={{ textTransform: "none", fontWeight: 700 }}>{t("ocpp@addCharger")}</Button>
        </Stack>

        {subscription && !subscription.isOn && items.length > 0 && (
          <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>{t("ocpp@subscription.hint")}</Alert>
        )}

        <ChargersTable items={items} loading={list.isLoading} onView={setViewId} hideStation emptyText={t("ocpp@station.noChargers")} />
      </Box>

      <AuthorizedTagsSection chargingPointId={chargingPointId} />

      <ChargerDetailDialog id={viewId} onClose={() => setViewId(null)} />
      <RegisterChargerDialog open={registerOpen} onClose={() => setRegisterOpen(false)} chargingPointId={chargingPointId} />
    </Stack>
  );
}
