import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Chip, Collapse, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import EvStationIcon from "@mui/icons-material/EvStation";
import { useOcppAlerts } from "../hooks/use-ocpp";
import type { OcppAlertDto, OcppAlertType } from "../types/api";
import { useDateFmt } from "./ocpp-ui";

const ICON: Record<OcppAlertType, React.ReactElement> = {
  ChargerOffline: <WifiOffIcon fontSize="small" />,
  ConnectorFaulted: <ReportProblemIcon fontSize="small" />,
  SessionTooLong: <HourglassBottomIcon fontSize="small" />,
  ParkedAfterCharging: <EvStationIcon fontSize="small" />,
};

export function AlertTypeChip({ type, resolved }: { type: OcppAlertType; resolved?: boolean }) {
  const { t } = useTranslation();
  const color = resolved ? "default" : type === "SessionTooLong" || type === "ParkedAfterCharging" ? "warning" : "error";
  return <Chip size="small" icon={ICON[type]} label={t(`ocpp@alerts.type.${type}`)} color={color} variant={resolved ? "outlined" : "filled"} sx={{ fontWeight: 700 }} />;
}

/**
 * Open findings of the 5-minute alert job (charger offline / plug Faulted / session too long),
 * each already pushed to admins and the station owner. Clicking a row opens the charger.
 */
export default function AlertsSection({ onOpenCharger }: { onOpenCharger: (id: number) => void }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const [showResolved, setShowResolved] = useState(false);
  const { data: alerts = [] } = useOcppAlerts({ openOnly: !showResolved, take: 50 });
  const open = alerts.filter((a) => !a.resolvedAt);

  if (alerts.length === 0 && !showResolved) return null;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, p: 2, border: 1, borderColor: open.length > 0 ? "error.main" : "divider" }}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
        <Stack direction="row" spacing={1} alignItems="center">
          <NotificationsActiveIcon color={open.length > 0 ? "error" : "disabled"} />
          <Typography variant="subtitle1" fontWeight={800}>{t("ocpp@alerts.title")}</Typography>
          {open.length > 0 && <Chip size="small" color="error" label={open.length} sx={{ fontWeight: 700 }} />}
        </Stack>
        <Button size="small" onClick={() => setShowResolved((v) => !v)}>{showResolved ? t("ocpp@alerts.hideResolved") : t("ocpp@alerts.showResolved")}</Button>
      </Stack>
      <Collapse in appear>
        <Box sx={{ overflowX: "auto", mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("ocpp@alerts.what")}</TableCell>
                <TableCell>{t("ocpp@columns.charger")}</TableCell>
                <TableCell>{t("ocpp@columns.station")}</TableCell>
                <TableCell>{t("ocpp@alerts.since")}</TableCell>
                <TableCell>{t("ocpp@alerts.notified")}</TableCell>
                <TableCell>{t("ocpp@alerts.resolved")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((a: OcppAlertDto) => (
                <TableRow key={a.id} hover sx={{ cursor: "pointer", opacity: a.resolvedAt ? 0.6 : 1 }} onClick={() => onOpenCharger(a.ocppChargePointId)}>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AlertTypeChip type={a.type} resolved={!!a.resolvedAt} />
                      {a.connectorId != null && a.connectorId > 0 && <Typography variant="caption">{t("ocpp@columns.connector")} {a.connectorId}</Typography>}
                      {a.details && <Typography variant="caption" color="text.secondary">{a.details}</Typography>}
                      {a.type === "ParkedAfterCharging" && (
                        <Typography variant="caption" color="text.secondary">
                          · {a.driverUserId ? t("ocpp@alerts.driverTold") : t("ocpp@alerts.noDriver")}{a.escalatedAt ? ` · ${t("ocpp@alerts.stationTold")}` : ""}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{a.displayName || a.chargePointId}</TableCell>
                  <TableCell>{a.stationName}</TableCell>
                  <TableCell><Typography variant="caption">{fmt.relative(a.conditionSince)}</Typography></TableCell>
                  <TableCell><Typography variant="caption">{fmt.full(a.notifiedAt)} · {t("ocpp@alerts.recipients", { count: a.recipients })}</Typography></TableCell>
                  <TableCell><Typography variant="caption">{a.resolvedAt ? fmt.relative(a.resolvedAt) : t("ocpp@alerts.open")}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Collapse>
    </Paper>
  );
}
