import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useAdminSessions, useConnectorReports } from "../../hooks/use-live-charging";
import PlugReportsList from "./PlugReportsList";
import SessionsTable from "./SessionsTable";
import StationStickersPanel from "./StationStickersPanel";
import StationTariffPanel from "./StationTariffPanel";

const RECENT = 8;

function Section({ id, title, hint, action, children }: { id: string; title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, p: 2 }} component="section" aria-labelledby={id}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography id={id} variant="h6" fontWeight={800} component="h2">{title}</Typography>
          {hint && <Typography variant="caption" color="text.secondary" display="block">{hint}</Typography>}
        </Box>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

/**
 * The live-charging parts of a station's Cable Connect page: latest sessions, plug reports,
 * the CHG- plug stickers and the station's own tariff.
 */
export default function StationLiveChargingSections({ chargingPointId }: { chargingPointId: number }) {
  const { t } = useTranslation();
  const [reportStatus, setReportStatus] = useState<"open" | "all">("open");
  const recent = useAdminSessions({ chargingPointId, page: 1, pageSize: RECENT });
  // status "open" is the same query the station page uses for the plug badges, so it is shared.
  const reports = useConnectorReports({ status: reportStatus, chargingPointId });

  return (
    <>
      <Section
        id="station-recent-sessions" title={t("liveCharging@station.recentSessions")}
        action={
          <Button
            size="small" component={RouterLink} to={`/charging-sessions?station=${chargingPointId}`} endIcon={<OpenInNewIcon fontSize="small" />}
            sx={{ textTransform: "none", fontWeight: 600, flexShrink: 0 }}
          >
            {t("liveCharging@station.allSessions")}
          </Button>
        }
      >
        <SessionsTable rows={recent.data?.items ?? []} loading={recent.isLoading} hideStation emptyText={t("liveCharging@station.noSessions")} />
      </Section>

      <Section
        id="station-plug-reports" title={t("liveCharging@plugReports.title")} hint={t("liveCharging@station.reportsHint")}
        action={
          <ToggleButtonGroup size="small" exclusive value={reportStatus} onChange={(_e, v) => v && setReportStatus(v)} aria-label={t("liveCharging@filters.status")}>
            <ToggleButton value="open" sx={{ textTransform: "none", fontWeight: 700 }}>{t("liveCharging@plugReports.filterOpen")}</ToggleButton>
            <ToggleButton value="all" sx={{ textTransform: "none", fontWeight: 700 }}>{t("liveCharging@plugReports.filterAll")}</ToggleButton>
          </ToggleButtonGroup>
        }
      >
        <PlugReportsList
          groups={reports.data ?? []} loading={reports.isLoading} showStation={false}
          emptyText={reportStatus === "open" ? t("liveCharging@plugReports.emptyOpen") : t("liveCharging@plugReports.empty")}
        />
      </Section>

      <Section id="station-stickers" title={t("liveCharging@stickers.title")}>
        <StationStickersPanel chargingPointId={chargingPointId} />
      </Section>

      <Section id="station-tariff" title={t("liveCharging@tariff.title")} hint={t("liveCharging@tariff.hint")}>
        <StationTariffPanel chargingPointId={chargingPointId} />
      </Section>
    </>
  );
}
