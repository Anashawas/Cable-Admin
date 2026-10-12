import { useTranslation } from "react-i18next";
import {
  Box, IconButton, Link, Paper, Skeleton, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import { useNavigate } from "react-router-dom";
import { useSnackbarStore } from "../../../stores";
import { useSetChargePointEnabled } from "../hooks/use-ocpp";
import type { OcppChargePointListItemDto } from "../types/api";
import ChargerIcon, { iconPlugsFromCounts } from "./ChargerIcon";
import { ReliabilityText, StatusDotChip, SubscriptionQuietChip, errMessage, useDateFmt } from "./ocpp-ui";

interface ChargersTableProps {
  items: OcppChargePointListItemDto[];
  loading?: boolean;
  onView: (id: number) => void;
  /** Hide the station column when the table already lives inside a station page. */
  hideStation?: boolean;
  emptyText: string;
}

/** Less important columns step aside below the lg breakpoint; the table also scrolls in its own box. */
const WIDE_ONLY = { display: { xs: "none", lg: "table-cell" } } as const;

const SR_ONLY = {
  border: 0, clip: "rect(0 0 0 0)", height: "1px", width: "1px", margin: "-1px", overflow: "hidden", padding: 0, position: "absolute", whiteSpace: "nowrap",
} as const;

/** The charger's enabled switch (same action in the table and on the station's charger cards). */
export function ChargerEnabledSwitch({ row }: { row: Pick<OcppChargePointListItemDto, "id" | "isEnabled" | "displayName" | "chargePointId"> }) {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const setEnabled = useSetChargePointEnabled();

  const toggle = async (isEnabled: boolean) => {
    try {
      await setEnabled.mutateAsync({ id: row.id, isEnabled });
      openSuccessSnackbar({ message: t(isEnabled ? "ocpp@toast.enabled" : "ocpp@toast.disabled") });
    } catch (err) {
      openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) });
    }
  };

  return (
    <Switch
      size="small" checked={row.isEnabled}
      disabled={setEnabled.isPending}
      onChange={(e) => toggle(e.target.checked)}
      inputProps={{ "aria-label": t("ocpp@table.toggleEnabled", { name: row.displayName || row.chargePointId }) }}
    />
  );
}

export default function ChargersTable({ items, loading, onView, hideStation, emptyText }: ChargersTableProps) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const navigate = useNavigate();

  if (loading) return <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />;
  if (items.length === 0)
    return (
      <Paper variant="outlined" sx={{ borderRadius: 3, p: 5, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary" fontWeight={600}>{emptyText}</Typography>
      </Paper>
    );

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: hideStation ? 680 : 780, "& td, & th": { px: 1.5, py: 1 } }}>
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700, color: "text.secondary", bgcolor: "action.hover", whiteSpace: "nowrap", fontSize: 12.5 } }}>
              <TableCell>{t("ocpp@columns.charger")}</TableCell>
              {!hideStation && <TableCell>{t("ocpp@columns.station")}</TableCell>}
              <TableCell>{t("ocpp@columns.state")}</TableCell>
              <TableCell>{t("ocpp@columns.plugs")}</TableCell>
              <TableCell sx={WIDE_ONLY}>{t("ocpp@columns.sessions")}</TableCell>
              <TableCell>{t("ocpp@columns.subscription")}</TableCell>
              <TableCell sx={WIDE_ONLY}>{t("ocpp@columns.reliability")}</TableCell>
              <TableCell>{t("ocpp@columns.lastSeen")}</TableCell>
              <TableCell align="center">{t("ocpp@columns.enabled")}</TableCell>
              <TableCell align="right"><Box component="span" sx={SR_ONLY}>{t("ocpp@columns.actions")}</Box></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((row) => {
              const name = row.displayName || row.chargePointId;
              return (
                <TableRow
                  key={row.id} hover onClick={() => onView(row.id)}
                  sx={{ cursor: "pointer", "& td": { opacity: row.isEnabled ? 1 : 0.6 }, "&:last-child td": { borderBottom: 0 } }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                      <ChargerIcon plugs={iconPlugsFromCounts(row)} offline={!row.isConnected || !row.isEnabled} size={28} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 220 }}>{name}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 220 }}>
                          <bdi dir="ltr" style={{ fontFamily: "monospace" }}>{row.chargePointId}</bdi>
                          {row.vendor ? ` · ${row.vendor}${row.model ? ` ${row.model}` : ""}` : ""}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  {!hideStation && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Link
                        component="button" variant="body2" fontWeight={600} underline="hover"
                        onClick={() => navigate(`/charge-management/${row.chargingPointId}`)} sx={{ textAlign: "start" }}
                      >
                        {row.stationName}
                      </Link>
                      <Typography variant="caption" color="text.secondary" display="block"><bdi>#{row.chargingPointId}</bdi></Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    {row.onboardingState && row.isEnabled
                      ? (
                        <Tooltip title={row.onboardingReason ?? ""}>
                          <span><StatusDotChip state={row.connectionState} isEnabled={row.isEnabled} onboardingState={row.onboardingState} /></span>
                        </Tooltip>
                      )
                      : <StatusDotChip state={row.connectionState} isEnabled={row.isEnabled} lockedUntil={row.lockedUntil} />}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography variant="body2" fontWeight={600} color={row.freeConnectors > 0 ? "success.main" : "text.secondary"} component="span">
                      <bdi>{t("ocpp@table.plugsFree", { free: row.freeConnectors, total: row.connectorCount })}</bdi>
                    </Typography>
                    {row.faultedConnectors > 0 && (
                      <Typography variant="caption" color="error.main" fontWeight={700} display="block">
                        {t("ocpp@table.plugsFaulted", { count: row.faultedConnectors })}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={WIDE_ONLY}>
                    {row.openSessions > 0
                      ? (
                        <Tooltip title={t("ocpp@table.charging", { count: row.openSessions })}>
                          <Stack direction="row" spacing={0.25} alignItems="center" sx={{ color: "primary.main", width: "fit-content" }}>
                            <BoltIcon sx={{ fontSize: 16 }} aria-hidden />
                            <Typography variant="body2" fontWeight={700} component="span">{row.openSessions}</Typography>
                          </Stack>
                        </Tooltip>
                      )
                      : <Typography variant="body2" color="text.disabled" component="span">—</Typography>}
                  </TableCell>
                  <TableCell><SubscriptionQuietChip sub={row.subscription} /></TableCell>
                  <TableCell sx={WIDE_ONLY}><ReliabilityText pct={row.reliabilityPct} /></TableCell>
                  <TableCell>
                    {row.lastMessageAt ? (
                      <Tooltip title={fmt.full(row.lastMessageAt)}>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{fmt.relative(row.lastMessageAt)}</Typography>
                      </Tooltip>
                    ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <ChargerEnabledSwitch row={row} />
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={t("ocpp@actions.view")}>
                      <IconButton size="small" onClick={() => onView(row.id)} aria-label={t("ocpp@table.viewCharger", { name })}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}
