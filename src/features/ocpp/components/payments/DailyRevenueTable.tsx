import { Fragment, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Chip, Collapse, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { avgPerKwh, costOf, sourceOf, type DayRow, type PaymentSession, type Totals } from "../../utils/payments";
import { fmtDay, fmtDurationLong, fmtNum, fmtTime12, stopReasonLabel } from "../../utils/payments-format";

const Ltr = ({ children }: { children: ReactNode }) => <bdi dir="ltr">{children}</bdi>;
const num = { textAlign: "end", whiteSpace: "nowrap" } as const;
const bold = { fontWeight: 700, fontVariantNumeric: "tabular-nums" } as const;
const head = { fontWeight: 700, color: "text.secondary", fontSize: 13, whiteSpace: "nowrap" } as const;

/** "35% → 44%" with "+9%" under it; "—" when the car didn't report battery. */
function Battery({ start, end }: { start?: number | null; end?: number | null }) {
  const known = (v?: number | null): v is number => v != null && v > 0;
  const a = known(start) ? Math.round(start) : null;
  const b = known(end) ? Math.round(end) : null;
  if (a == null && b == null) return <Typography variant="body2" color="text.disabled">—</Typography>;
  const gain = a != null && b != null ? b - a : null;
  return (
    <Box>
      <Typography variant="body2" sx={bold}>
        <bdi dir="ltr">{a != null ? `${a}%` : "—"} → {b != null ? `${b}%` : "…"}</bdi>
      </Typography>
      {gain != null && gain > 0 && (
        <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700 }}><bdi dir="ltr">+{gain}%</bdi></Typography>
      )}
    </Box>
  );
}

interface DailyRevenueTableProps {
  rows: DayRow[];
  totals: Totals;
  ar: boolean;
  stationName: (s: PaymentSession) => string;
  chargerName: (s: PaymentSession) => string;
  onOpenSession: (s: PaymentSession) => void;
}

/** One row per day, newest first, with a totals row; a day expands to its sessions. */
export default function DailyRevenueTable({ rows, totals, ar, stationName, chargerName, onOpenSession }: DailyRevenueTableProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const thisYear = new Date().getFullYear();

  const toggle = (day: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });

  // "الأحد، 25 تشرين الأول" — the year only when it isn't this year.
  const dayLabel = (v: string) => {
    const full = fmtDay(v, ar);
    const withComma = ar ? full.replace(/^(\S+) /, "$1، ") : full;
    return v.startsWith(String(thisYear)) ? withComma.replace(/ \d{4}$/, "") : withComma;
  };

  const jod = (v: number | null | undefined) => (v == null ? "—" : <Ltr>{fmtNum(v, 3)} JOD</Ltr>);
  const kwh = (v: number | null | undefined) => (v == null ? "—" : <Ltr>{fmtNum(v, 2)} kWh</Ltr>);
  const perKwh = (x: Totals) => {
    const v = avgPerKwh(x);
    return v == null ? "—" : <Ltr>{fmtNum(v, 3)} JOD</Ltr>;
  };

  /** Card → its id tag; app → the driver's user id; staff → nothing. */
  const whoStarted = (s: PaymentSession) => {
    const src = sourceOf(s);
    if (src === "Card") return s.idTag || null;
    if (src === "App") return s.startedByUserId != null ? t("ocpp@payments.session.userId", { id: s.startedByUserId }) : null;
    return null;
  };

  return (
    <TableContainer>
      <Table aria-label={t("ocpp@payments.daily.title")} sx={{ "& td, & th": { py: 1.25 } }}>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            <TableCell sx={head}>{t("ocpp@payments.daily.date")}</TableCell>
            <TableCell sx={{ ...head, ...num }}>{t("ocpp@payments.daily.sessions")}</TableCell>
            <TableCell sx={{ ...head, ...num }}>{t("ocpp@payments.daily.energy")}</TableCell>
            <TableCell sx={{ ...head, ...num }}>{t("ocpp@payments.daily.revenue")}</TableCell>
            <TableCell sx={{ ...head, ...num }}>{t("ocpp@payments.daily.perKwh")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => {
            const expanded = open.has(r.day);
            const panelId = `pay-day-${r.day}`;
            return (
              <Fragment key={r.day}>
                <TableRow
                  hover onClick={() => toggle(r.day)}
                  sx={{ cursor: "pointer", bgcolor: expanded ? "action.selected" : undefined, "& > td": { borderBottom: expanded ? "none" : undefined } }}
                >
                  <TableCell padding="checkbox">
                    <IconButton
                      size="small" aria-expanded={expanded} aria-controls={panelId}
                      aria-label={t(expanded ? "ocpp@payments.daily.collapse" : "ocpp@payments.daily.expand", { day: fmtDay(r.day, ar) })}
                      onClick={(e) => { e.stopPropagation(); toggle(r.day); }}
                    >
                      {expanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                    </IconButton>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography component="span" variant="body2" sx={{ fontWeight: 800 }}><bdi>{dayLabel(r.day)}</bdi></Typography>
                    {r.open > 0 && (
                      <Chip size="small" color="primary" label={<bdi>{t("ocpp@payments.runningN", { n: r.open })}</bdi>} sx={{ height: 20, fontSize: 11, fontWeight: 700, marginInlineStart: 1 }} />
                    )}
                  </TableCell>
                  <TableCell sx={{ ...num, ...bold }}><Ltr>{r.sessions}</Ltr></TableCell>
                  <TableCell sx={{ ...num, ...bold }}>{kwh(r.energyKwh)}</TableCell>
                  <TableCell sx={{ ...num, ...bold, fontWeight: 800, color: "primary.main" }}>{jod(r.revenueJod)}</TableCell>
                  <TableCell sx={{ ...num, color: "text.secondary" }}>{perKwh(r)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} sx={{ p: 0, borderBottom: expanded ? undefined : "none" }}>
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      <Box id={panelId} sx={{ px: { xs: 1, sm: 2 }, py: 1.5, bgcolor: "action.hover", overflowX: "auto" }}>
                        <Table
                          size="small" aria-label={t("ocpp@payments.daily.sessionsOf", { day: fmtDay(r.day, ar) })}
                          sx={{ "& td, & th": { py: 1, borderBottomColor: "divider" } }}
                        >
                          <TableHead>
                            <TableRow>
                              <TableCell sx={head}>{t("ocpp@payments.session.time")}</TableCell>
                              <TableCell sx={head}>{t("ocpp@payments.session.where")}</TableCell>
                              <TableCell sx={head}>{t("ocpp@payments.session.startedBy")}</TableCell>
                              <TableCell sx={head}>{t("ocpp@payments.session.duration")}</TableCell>
                              <TableCell sx={head}>{t("ocpp@payments.session.battery")}</TableCell>
                              <TableCell sx={{ ...head, ...num }}>{t("ocpp@payments.daily.energy")}</TableCell>
                              <TableCell sx={{ ...head, ...num }}>{t("ocpp@payments.daily.revenue")}</TableCell>
                              <TableCell sx={head}>{t("ocpp@payments.session.ended")}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {r.items.map((s) => {
                              const who = whoStarted(s);
                              return (
                                <TableRow
                                  key={`${s.stationId}-${s.id}`} hover tabIndex={0} sx={{ cursor: "pointer" }}
                                  aria-label={t("ocpp@payments.session.open", { id: s.id })}
                                  onClick={() => onOpenSession(s)}
                                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenSession(s); } }}
                                >
                                  <TableCell sx={{ whiteSpace: "nowrap", ...bold }}>
                                    <bdi>{fmtTime12(s.startedAt, ar)} – {s.stoppedAt ? fmtTime12(s.stoppedAt, ar) : "…"}</bdi>
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}><bdi>{stationName(s)}</bdi></Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      <bdi>{chargerName(s)}</bdi> · <bdi>{t("ocpp@payments.session.plugN", { n: s.connectorId })}</bdi>
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                                    <Chip
                                      size="small" variant="outlined" sx={{ height: 22, fontSize: 11, fontWeight: 600 }}
                                      label={t(`ocpp@payments.source.${sourceOf(s)}`)}
                                    />
                                    {who && (
                                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                                        <bdi dir="ltr" style={{ fontFamily: "monospace" }}>{who}</bdi>
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell sx={{ whiteSpace: "nowrap" }}><bdi>{fmtDurationLong(s.durationSec, t)}</bdi></TableCell>
                                  <TableCell sx={{ whiteSpace: "nowrap" }}><Battery start={s.socStartPercent} end={s.socEndPercent} /></TableCell>
                                  <TableCell sx={{ ...num, ...bold }}>{kwh(s.energyKwh)}</TableCell>
                                  <TableCell sx={{ ...num, ...bold, color: "primary.main", fontStyle: s.isOpen ? "italic" : undefined }}>
                                    {s.costJod == null && s.costFils == null ? "—" : jod(costOf(s))}
                                  </TableCell>
                                  <TableCell sx={{ minWidth: 140 }}>
                                    {s.isOpen
                                      ? <Chip size="small" color="primary" label={t("ocpp@payments.runningSoFar")} sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
                                      : <Typography variant="body2" sx={{ fontWeight: 600 }}>{stopReasonLabel(s, ar)}</Typography>}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
          <TableRow sx={{ bgcolor: (th) => alpha(th.palette.primary.main, 0.06), "& > td": { fontWeight: 800, borderBottom: "none", fontSize: 15 } }}>
            <TableCell padding="checkbox" />
            <TableCell>{t("ocpp@payments.daily.total")}</TableCell>
            <TableCell sx={num}><Ltr>{totals.sessions}</Ltr></TableCell>
            <TableCell sx={num}>{kwh(totals.energyKwh)}</TableCell>
            <TableCell sx={{ ...num, color: "primary.main" }}>{jod(totals.revenueJod)}</TableCell>
            <TableCell sx={num}>{perKwh(totals)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
        {t("ocpp@payments.daily.hint")}
      </Typography>
    </TableContainer>
  );
}
