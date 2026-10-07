import { useTranslation } from "react-i18next";
import {
  Box, Chip, IconButton, Link, Paper, Skeleton, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BoltIcon from "@mui/icons-material/Bolt";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { useNavigate } from "react-router-dom";
import { useSnackbarStore } from "../../../stores";
import { useSetChargePointEnabled } from "../hooks/use-ocpp";
import type { OcppChargePointListItemDto } from "../types/api";
import { ConnectionChip, OnboardingChip, SubscriptionChip, errMessage, useDateFmt } from "./ocpp-ui";

interface ChargersTableProps {
  items: OcppChargePointListItemDto[];
  loading?: boolean;
  onView: (id: number) => void;
  /** Hide the station column when the table already lives inside a station page. */
  hideStation?: boolean;
  emptyText: string;
}

export default function ChargersTable({ items, loading, onView, hideStation, emptyText }: ChargersTableProps) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const navigate = useNavigate();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const setEnabled = useSetChargePointEnabled();

  const toggle = async (row: OcppChargePointListItemDto, isEnabled: boolean) => {
    try {
      await setEnabled.mutateAsync({ id: row.id, isEnabled });
      openSuccessSnackbar({ message: t(isEnabled ? "ocpp@toast.enabled" : "ocpp@toast.disabled") });
    } catch (err) {
      openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) });
    }
  };

  if (loading) return <Skeleton variant="rounded" height={220} />;
  if (items.length === 0)
    return (
      <Paper variant="outlined" sx={{ borderRadius: 3, p: 5, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary" fontWeight={600}>{emptyText}</Typography>
      </Paper>
    );

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "action.hover" } }}>
              <TableCell>{t("ocpp@columns.charger")}</TableCell>
              {!hideStation && <TableCell>{t("ocpp@columns.station")}</TableCell>}
              <TableCell>{t("ocpp@columns.state")}</TableCell>
              <TableCell>{t("ocpp@columns.plugs")}</TableCell>
              <TableCell>{t("ocpp@columns.sessions")}</TableCell>
              <TableCell>{t("ocpp@columns.subscription")}</TableCell>
              <TableCell>{t("ocpp@columns.lastSeen")}</TableCell>
              <TableCell align="center">{t("ocpp@columns.enabled")}</TableCell>
              <TableCell align="right">{t("ocpp@columns.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id} hover sx={{ cursor: "pointer", opacity: row.isEnabled ? 1 : 0.6 }} onClick={() => onView(row.id)}>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>{row.displayName || row.chargePointId}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                    {row.chargePointId}{row.vendor ? ` · ${row.vendor}${row.model ? ` ${row.model}` : ""}` : ""}
                  </Typography>
                </TableCell>
                {!hideStation && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Link component="button" variant="body2" fontWeight={600} onClick={() => navigate(`/charge-management/${row.chargingPointId}`)} sx={{ textAlign: "start" }}>
                      {row.stationName}
                    </Link>
                    <Typography variant="caption" color="text.secondary" display="block">#{row.chargingPointId}</Typography>
                  </TableCell>
                )}
                <TableCell>
                  {row.onboardingState && row.isEnabled
                    ? <Tooltip title={row.onboardingReason ?? ""}><span><OnboardingChip state={row.onboardingState} /></span></Tooltip>
                    : <ConnectionChip state={row.connectionState} isEnabled={row.isEnabled} lockedUntil={row.lockedUntil} />}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Chip size="small" variant="outlined" color={row.freeConnectors > 0 ? "success" : "default"} label={`${row.freeConnectors}/${row.connectorCount}`} sx={{ fontWeight: 700 }} />
                    {row.faultedConnectors > 0 && (
                      <Tooltip title={t("ocpp@kpi.faulted")}><Chip size="small" color="error" icon={<ReportProblemIcon />} label={row.faultedConnectors} sx={{ fontWeight: 700 }} /></Tooltip>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  {row.openSessions > 0
                    ? <Chip size="small" color="primary" icon={<BoltIcon />} label={row.openSessions} sx={{ fontWeight: 700 }} />
                    : <Typography variant="caption" color="text.disabled">—</Typography>}
                </TableCell>
                <TableCell><SubscriptionChip sub={row.subscription} /></TableCell>
                <TableCell>
                  <Tooltip title={fmt.full(row.lastMessageAt)}>
                    <Typography variant="caption" sx={{ whiteSpace: "nowrap" }}>{row.lastMessageAt ? fmt.relative(row.lastMessageAt) : "—"}</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <Switch size="small" checked={row.isEnabled} disabled={setEnabled.isPending} onChange={(e) => toggle(row, e.target.checked)} />
                </TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title={t("ocpp@actions.view")}><IconButton size="small" onClick={() => onView(row.id)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}
