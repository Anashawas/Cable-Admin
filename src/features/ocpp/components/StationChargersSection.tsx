import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useOcppChargePoints } from "../hooks/use-ocpp";
import { useOcppLive } from "../hooks/use-ocpp-live";
import SubscriptionPanel from "../../subscriptions/components/SubscriptionPanel";
import ChargersTable from "./ChargersTable";
import ChargerDetailDialog from "./ChargerDetailDialog";
import RegisterChargerDialog from "./RegisterChargerDialog";
import AuthorizedTagsSection from "./AuthorizedTagsSection";
import LiveVisibilityPanel from "./LiveVisibilityPanel";
import AlertThresholdsPanel from "./AlertThresholdsPanel";
import { stationCableConnectPath } from "./StationCard";

interface StationChargersSectionProps {
  chargingPointId: number;
  stationName?: string | null;
  ownerUserAccountId?: number | null;
  ownerName?: string | null;
  /** false on the Cable Connect station page, which lists the chargers itself; only the station settings remain. */
  showChargers?: boolean;
}

/**
 * The "Cable Connect" tab of a station: its chargers, the Cable Connect subscription
 * (record / renew / switch off — same panel as station premium, entity type
 * OcppConnect) and the allowed cards.
 */
export default function StationChargersSection({ chargingPointId, stationName, ownerUserAccountId, ownerName, showChargers = true }: StationChargersSectionProps) {
  const { t } = useTranslation();
  const [viewId, setViewId] = useState<number | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  // The station profile tab is live too; on the Cable Connect station page that screen holds the connection.
  useOcppLive(showChargers);
  const list = useOcppChargePoints({ chargingPointId, pageSize: 100 }, showChargers);
  const items = list.data?.items ?? [];

  return (
    <Stack spacing={3} divider={<Divider flexItem />}>
      {showChargers && (
        <Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={800}>{t("ocpp@station.chargers")}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                size="small" variant="outlined" color="inherit" component={RouterLink} to={stationCableConnectPath(chargingPointId)}
                startIcon={<OpenInNewIcon fontSize="small" />} sx={{ textTransform: "none", fontWeight: 600, borderColor: "divider" }}
              >
                {t("ocpp@stations.openInCableConnect")}
              </Button>
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setRegisterOpen(true)} sx={{ textTransform: "none", fontWeight: 700 }}>{t("ocpp@addCharger")}</Button>
            </Stack>
          </Stack>
          <ChargersTable items={items} loading={list.isLoading} onView={setViewId} hideStation emptyText={t("ocpp@station.noChargers")} />
        </Box>
      )}

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

      {/* Alert thresholds for this station (minutes); blank = platform default. */}
      <AlertThresholdsPanel chargingPointId={chargingPointId} />

      <AuthorizedTagsSection chargingPointId={chargingPointId} />

      <ChargerDetailDialog id={viewId} onClose={() => setViewId(null)} />
      <RegisterChargerDialog open={registerOpen} onClose={() => setRegisterOpen(false)} chargingPointId={chargingPointId} onRegistered={setViewId} />
    </Stack>
  );
}
