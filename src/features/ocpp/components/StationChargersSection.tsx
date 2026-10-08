import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useOcppChargePoints } from "../hooks/use-ocpp";
import SubscriptionPanel from "../../subscriptions/components/SubscriptionPanel";
import ChargersTable from "./ChargersTable";
import ChargerDetailDialog from "./ChargerDetailDialog";
import RegisterChargerDialog from "./RegisterChargerDialog";
import AuthorizedTagsSection from "./AuthorizedTagsSection";
import LiveVisibilityPanel from "./LiveVisibilityPanel";

interface StationChargersSectionProps {
  chargingPointId: number;
  stationName?: string | null;
  ownerUserAccountId?: number | null;
  ownerName?: string | null;
}

/**
 * The "Cable Connect" tab of a station: its chargers, the Cable Connect subscription
 * (record / renew / switch off — same panel as station premium, entity type
 * OcppConnect) and the allowed cards.
 */
export default function StationChargersSection({ chargingPointId, stationName, ownerUserAccountId, ownerName }: StationChargersSectionProps) {
  const { t } = useTranslation();
  const [viewId, setViewId] = useState<number | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const list = useOcppChargePoints({ chargingPointId, pageSize: 100 });
  const items = list.data?.items ?? [];

  return (
    <Stack spacing={3} divider={<Divider flexItem />}>
      <Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={800}>{t("ocpp@station.chargers")}</Typography>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setRegisterOpen(true)} sx={{ textTransform: "none", fontWeight: 700 }}>{t("ocpp@addCharger")}</Button>
        </Stack>
        <ChargersTable items={items} loading={list.isLoading} onView={setViewId} hideStation emptyText={t("ocpp@station.noChargers")} />
      </Box>

      {/* Subscription: the gate for showing this station's charger data in the apps. */}
      <Box>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>{t("ocpp@subscription.title")}</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>{t("ocpp@subscription.hint")}</Typography>
        <SubscriptionPanel
          entityType="OcppConnect"
          entityId={chargingPointId}
          entityName={stationName}
          ownerUserAccountId={ownerUserAccountId}
          ownerName={ownerName}
          enabled
        />
      </Box>

      {/* N-2: who decides whether drivers see this station's live plug states. */}
      <LiveVisibilityPanel chargingPointId={chargingPointId} />

      <AuthorizedTagsSection chargingPointId={chargingPointId} />

      <ChargerDetailDialog id={viewId} onClose={() => setViewId(null)} />
      <RegisterChargerDialog open={registerOpen} onClose={() => setRegisterOpen(false)} chargingPointId={chargingPointId} onRegistered={setViewId} />
    </Stack>
  );
}
