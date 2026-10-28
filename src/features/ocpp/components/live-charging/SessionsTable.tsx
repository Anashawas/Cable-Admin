import { useTranslation } from "react-i18next";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box, Chip, Link, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Tooltip, Typography,
} from "@mui/material";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import { useLanguageStore } from "../../../../stores";
import { LANGUAGE } from "../../../../constants/language-constants";
import type { AdminSessionRowDto } from "../../types/live-charging";
import { carNameOf, fmtJod, sessionWho } from "../../utils/live-charging";
import { fmtDay, fmtDurationLong, fmtNum, fmtTime12, stopReasonLabel } from "../../utils/payments-format";
import { fmtSocRange } from "../ocpp-ui";
import { ChargeLimitChip } from "../ChargeLimitControls";
import { stationCableConnectPath } from "../StationCard";
import { Ltr, PointsChip, SessionStateChip, StartMethodChip } from "./live-ui";

export const sessionDetailPath = (id: number) => `/charging-sessions/${id}`;

const head = { fontWeight: 700, color: "text.secondary", fontSize: 13, whiteSpace: "nowrap" } as const;
const num = { textAlign: "end", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" } as const;

/** Who charged: driver (name, phone, link to the user), the staff member, or the card. */
export function SessionWhoCell({ s, linkUser = true }: { s: AdminSessionRowDto; linkUser?: boolean }) {
  const { t } = useTranslation();
  const who = sessionWho(s);
  if (who.kind === "driver" || who.kind === "staff") {
    return (
      <Box sx={{ minWidth: 0 }}>
        {linkUser ? (
          <Link
            component={RouterLink} to={`/users/${who.userId}`} underline="hover" fontWeight={700} variant="body2"
            onClick={(e) => e.stopPropagation()}
          >
            <bdi>{who.name}</bdi>
          </Link>
        ) : <Typography variant="body2" fontWeight={700}><bdi>{who.name}</bdi></Typography>}
        {who.kind === "staff" && <Typography component="span" variant="caption" color="text.secondary"> · {t("liveCharging@who.staff")}</Typography>}
        {who.phone && <Typography variant="caption" color="text.secondary" display="block"><Ltr>{who.phone}</Ltr></Typography>}
      </Box>
    );
  }
  return (
    <Box sx={{ minWidth: 0 }}>
      {who.kind === "card" && who.label && <Typography variant="body2" fontWeight={700}><bdi>{who.label}</bdi></Typography>}
      <Typography variant="caption" color="text.secondary" display="block"><bdi dir="ltr" style={{ fontFamily: "monospace" }}>{who.idTag || "—"}</bdi></Typography>
    </Box>
  );
}

interface Props {
  rows: AdminSessionRowDto[];
  loading?: boolean;
  /** Station page: the station column shows the charger only. */
  hideStation?: boolean;
  /** User profile: the user is known. */
  hideWho?: boolean;
  emptyText?: string;
  paging?: {
    page: number; // 0-based for TablePagination
    pageSize: number;
    total: number;
    onPage: (page: number) => void;
    onPageSize?: (size: number) => void;
  };
}

/** Admin sessions as a table: a row opens the session detail. */
export default function SessionsTable({ rows, loading, hideStation, hideWho, emptyText, paging }: Props) {
  const { t } = useTranslation();
  const ar = useLanguageStore((s) => s.language) === LANGUAGE.AR;
  const navigate = useNavigate();
  const open = (id: number) => navigate(sessionDetailPath(id));

  if (loading && rows.length === 0) return <Skeleton variant="rounded" height={220} sx={{ borderRadius: 2 }} />;

  return (
    <Box>
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" aria-label={t("liveCharging@sessions.title")} sx={{ "& td, & th": { py: 1 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={head}>{t("liveCharging@columns.session")}</TableCell>
              <TableCell sx={head}>{t("liveCharging@columns.started")}</TableCell>
              <TableCell sx={head}>{hideStation ? t("liveCharging@columns.charger") : t("liveCharging@columns.where")}</TableCell>
              {!hideWho && <TableCell sx={head}>{t("liveCharging@columns.who")}</TableCell>}
              <TableCell sx={head}>{t("liveCharging@columns.method")}</TableCell>
              <TableCell sx={{ ...head, ...num }}>{t("liveCharging@columns.energy")}</TableCell>
              <TableCell sx={{ ...head, ...num }}>{t("liveCharging@columns.cost")}</TableCell>
              <TableCell sx={head}>{t("liveCharging@columns.battery")}</TableCell>
              <TableCell sx={head}>{t("liveCharging@columns.ended")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hideWho ? 8 : 9} sx={{ textAlign: "center", py: 4, color: "text.secondary", fontWeight: 600 }}>
                  {emptyText ?? t("liveCharging@sessions.empty")}
                </TableCell>
              </TableRow>
            ) : rows.map((s) => {
              const car = carNameOf(s);
              return (
                <TableRow
                  key={s.id} hover tabIndex={0} sx={{ cursor: "pointer" }}
                  aria-label={t("liveCharging@sessions.open", { id: s.id })}
                  onClick={() => open(s.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(s.id); } }}
                >
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="body2" fontWeight={800}><Ltr>#{s.id}</Ltr></Typography>
                      <SessionStateChip isOpen={s.isOpen} isStale={s.isStale} />
                      {s.openIssues > 0 && (
                        <Tooltip title={t("liveCharging@sessions.openIssues", { count: s.openIssues })}>
                          <Chip
                            size="small" color="error" variant="outlined" icon={<ReportProblemOutlinedIcon />}
                            label={<Ltr>{s.openIssues}</Ltr>} aria-label={t("liveCharging@sessions.openIssues", { count: s.openIssues })}
                            sx={{ height: 20, fontSize: 11, fontWeight: 700, "& .MuiChip-icon": { fontSize: 14 } }}
                          />
                        </Tooltip>
                      )}
                    </Stack>
                    {s.chargeLimit && <Box sx={{ mt: 0.5 }}><ChargeLimitChip limit={s.chargeLimit} /></Box>}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography variant="body2" fontWeight={700}><bdi>{fmtDay(s.startedAt, ar, true)} · {fmtTime12(s.startedAt, ar)}</bdi></Typography>
                    <Typography variant="caption" color="text.secondary"><bdi>{fmtDurationLong(s.durationSec, t)}</bdi></Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    {!hideStation && (
                      <Link
                        component={RouterLink} to={stationCableConnectPath(s.chargingPointId)} underline="hover" variant="body2" fontWeight={700}
                        onClick={(e) => e.stopPropagation()} display="block"
                      >
                        <bdi>{s.stationName}</bdi>
                      </Link>
                    )}
                    <Typography variant={hideStation ? "body2" : "caption"} color={hideStation ? undefined : "text.secondary"} fontWeight={hideStation ? 700 : undefined}>
                      <bdi>{s.chargerName || s.chargePointId}</bdi> · <bdi>{t("liveCharging@plugN", { n: s.connectorId })}</bdi>
                    </Typography>
                  </TableCell>
                  {!hideWho && <TableCell sx={{ minWidth: 140 }}><SessionWhoCell s={s} /></TableCell>}
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <StartMethodChip method={s.startMethod} />
                    {car && (
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5, color: "text.secondary" }}>
                        <DirectionsCarOutlinedIcon sx={{ fontSize: 14 }} aria-hidden />
                        <Typography variant="caption" noWrap><bdi>{car}</bdi></Typography>
                      </Stack>
                    )}
                    {s.pointsAwarded != null && <Box sx={{ mt: 0.5 }}><PointsChip points={s.pointsAwarded} /></Box>}
                  </TableCell>
                  <TableCell sx={{ ...num, fontWeight: 700 }}>{s.energyKwh != null ? <Ltr>{fmtNum(s.energyKwh, 2)} kWh</Ltr> : "—"}</TableCell>
                  <TableCell sx={{ ...num, fontWeight: 800, color: "primary.main", fontStyle: s.isOpen ? "italic" : undefined }}>
                    {s.costJod != null ? <Ltr>{fmtJod(s.costJod)}</Ltr> : "—"}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}><Ltr>{fmtSocRange(s.socStartPercent, s.socEndPercent)}</Ltr></TableCell>
                  <TableCell sx={{ minWidth: 140 }}>
                    {s.isOpen ? "—" : <Typography variant="body2" fontWeight={600}>{stopReasonLabel(s, ar)}</Typography>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {paging && (
        <TablePagination
          component="div"
          count={paging.total}
          page={paging.page}
          rowsPerPage={paging.pageSize}
          rowsPerPageOptions={paging.onPageSize ? [20, 50, 100] : [paging.pageSize]}
          onPageChange={(_e, p) => paging.onPage(p)}
          onRowsPerPageChange={(e) => paging.onPageSize?.(parseInt(e.target.value, 10))}
          labelRowsPerPage={t("tableRowsPerPage")}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${t("tableOf")} ${count}`}
          sx={{ borderTop: 1, borderColor: "divider" }}
        />
      )}
    </Box>
  );
}
