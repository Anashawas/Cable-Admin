import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Alert, Box, Breadcrumbs, Button, Chip, CircularProgress, IconButton, Link, Paper, Skeleton, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import EvStationIcon from "@mui/icons-material/EvStation";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AppScreenContainer from "../../../app/components/AppScreenContainer";
import BackButton from "../../../../components/BackButton";
import { useLanguageStore, useSnackbarStore } from "../../../../stores";
import { LANGUAGE } from "../../../../constants/language-constants";
import { useAdminSession } from "../../hooks/use-live-charging";
import { downloadSessionReceipt } from "../../services/live-charging-service";
import type { OcppTransactionDto } from "../../types/api";
import type { AdminSessionDetailDto } from "../../types/live-charging";
import { carNameOf, fmtJod, saveBlob, sessionWho } from "../../utils/live-charging";
import { fmtDurationLong, fmtNum, stopReasonLabel } from "../../utils/payments-format";
import { fmtSocRange, useDateFmt } from "../ocpp-ui";
import { ChargeLimitChip } from "../ChargeLimitControls";
import ChargerDetailDialog from "../ChargerDetailDialog";
import LiveSessionPanel from "../LiveSessionPanel";
import { stationCableConnectPath } from "../StationCard";
import SessionSeriesChart from "./SessionSeriesChart";
import { Field, Ltr, PointsChip, SectionTitle, SessionStateChip, StartMethodChip, useProblemToast } from "./live-ui";

const flipInRtl = { transform: (th: { direction: string }) => (th.direction === "rtl" ? "scaleX(-1)" : "none") } as const;
const card = { p: 2, borderRadius: 3, height: "100%" } as const;
const grid = { display: "grid", gap: 1.5, gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" } as const;

function Shell({ title, children }: { title: ReactNode; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <BackButton fallback="/charging-sessions" size="small" />
            <Breadcrumbs aria-label={t("liveCharging@detail.breadcrumb")} separator={<ChevronRightIcon fontSize="small" sx={flipInRtl} />}>
              <Link component={RouterLink} to="/charging-sessions" underline="hover" color="text.secondary" variant="body2" fontWeight={600}>
                {t("liveCharging@sessions.title")}
              </Link>
              <Typography variant="body2" color="text.primary" fontWeight={700} aria-current="page">{title}</Typography>
            </Breadcrumbs>
          </Stack>
          {children}
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}

/** The admin row as the transaction shape LiveSessionPanel expects (a running session). */
const asTransaction = (d: AdminSessionDetailDto): OcppTransactionDto => ({
  id: d.session.id,
  connectorId: d.session.connectorId,
  idTag: d.session.idTag,
  startedAt: d.session.startedAt,
  stoppedAt: d.session.stoppedAt,
  durationSec: d.session.durationSec,
  meterStartWh: 0,
  energyKwh: d.session.energyKwh,
  stopReason: d.session.stopReason,
  isOpen: d.session.isOpen,
  isStale: d.session.isStale,
  isOrphan: !!d.session.isOrphan,
  wasRejected: !!d.session.wasRejected,
  startSource: d.session.startSource,
  costFils: d.session.costFils,
  costJod: d.session.costJod,
  socStartPercent: d.session.socStartPercent,
  socEndPercent: d.session.socEndPercent,
  chargeLimit: d.session.chargeLimit,
});

/** Route /charging-sessions/:sessionId — one session with everything the admin may see. */
export default function ChargingSessionDetailScreen() {
  const { t } = useTranslation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const id = Number(sessionId);
  const valid = Number.isInteger(id) && id > 0;
  const q = useAdminSession(valid ? id : null);

  if (!valid || (q.isError && (q.error as any)?.response?.status === 404))
    return (
      <Shell title={valid ? `#${id}` : "—"}>
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 5, textAlign: "center" }}>
          <Typography fontWeight={600} color="text.secondary">{t("liveCharging@detail.notFound")}</Typography>
        </Paper>
      </Shell>
    );

  return (
    <Shell title={<Ltr>#{id}</Ltr>}>
      {q.isLoading ? (
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={90} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />
        </Stack>
      ) : q.isError || !q.data ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => q.refetch()}>{t("liveCharging@retry")}</Button>}>
          {t("liveCharging@detail.loadError")}
        </Alert>
      ) : (
        <SessionDetail d={q.data} refetch={() => q.refetch()} fetching={q.isFetching} />
      )}
    </Shell>
  );
}

function SessionDetail({ d, refetch, fetching }: { d: AdminSessionDetailDto; refetch: () => void; fetching: boolean }) {
  const { t } = useTranslation();
  const ar = useLanguageStore((s) => s.language) === LANGUAGE.AR;
  const fmt = useDateFmt();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const toastError = useProblemToast();
  const [chargerOpen, setChargerOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const s = d.session;
  const live = d.live;
  const who = sessionWho(s);
  const car = carNameOf(live) ?? carNameOf(s);
  const points = d.pointsAwarded ?? live.pointsAwarded ?? s.pointsAwarded ?? null;
  const limit = live.chargeLimit ?? s.chargeLimit;
  const limitText = limit ? ((ar ? limit.textAr : limit.text) || limit.text) : null;

  const receipt = async () => {
    setDownloading(true);
    try {
      const f = await downloadSessionReceipt(s.id);
      saveBlob(f.blob, f.fileName);
      openSuccessSnackbar({ message: t("liveCharging@detail.receiptDownloaded") });
      if (!s.receiptNo) refetch(); // the number is assigned at the first download
    } catch (err) {
      await toastError(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ md: "flex-start" }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="h5" fontWeight={800} component="h1"><bdi>{t("liveCharging@detail.title", { id: s.id })}</bdi></Typography>
            <SessionStateChip isOpen={s.isOpen} isStale={s.isStale} />
            <StartMethodChip method={s.startMethod} size="medium" />
            <ChargeLimitChip limit={limit} size="medium" />
            <PointsChip points={points} />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            <bdi>{s.stationName}</bdi> · <bdi>{s.chargerName || s.chargePointId}</bdi> · <bdi>{t("liveCharging@plugN", { n: s.connectorId })}</bdi>
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
          <Tooltip title={t("refresh")}>
            <span><IconButton onClick={refetch} disabled={fetching} aria-label={t("refresh")}><RefreshIcon /></IconButton></span>
          </Tooltip>
          <Button
            variant="outlined" color="inherit" size="small" startIcon={<EvStationIcon fontSize="small" />} onClick={() => setChargerOpen(true)}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, borderColor: "divider", height: 36 }}
          >
            {t("liveCharging@detail.openCharger")}
          </Button>
          <Tooltip title={s.isOpen ? t("liveCharging@detail.receiptWhenClosed") : s.receiptNo ?? ""}>
            <span>
              <Button
                variant="contained" size="small" onClick={receipt} disabled={s.isOpen || downloading}
                startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <ReceiptLongIcon fontSize="small" />}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, height: 36 }}
              >
                {t("liveCharging@detail.receipt")}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Running: live figures and the "stop at …" controls of the charger page */}
      {s.isOpen && !s.isStale && <LiveSessionPanel tx={asTransaction(d)} />}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
        {/* Who */}
        <Paper variant="outlined" sx={card} component="section" aria-labelledby="sd-who">
          <SectionTitle id="sd-who">{t("liveCharging@detail.who")}</SectionTitle>
          <Box sx={grid}>
            {who.kind === "driver" && (
              <Field label={t("liveCharging@detail.driver")}>
                <Link component={RouterLink} to={`/users/${who.userId}`} underline="hover" fontWeight={700}><bdi>{who.name}</bdi></Link>
                <Typography variant="caption" color="text.secondary" display="block"><Ltr>#{who.userId}</Ltr></Typography>
              </Field>
            )}
            {who.kind === "staff" && (
              <Field label={t("liveCharging@detail.staff")}>
                <Link component={RouterLink} to={`/users/${who.userId}`} underline="hover" fontWeight={700}><bdi>{who.name}</bdi></Link>
              </Field>
            )}
            {(who.kind === "driver" || who.kind === "staff") && who.phone && (
              <Field label={t("liveCharging@detail.phone")}>
                <Link href={`tel:${who.phone}`} underline="hover"><Ltr>{who.phone}</Ltr></Link>
              </Field>
            )}
            <Field label={t("liveCharging@detail.card")}>{s.cardLabel ? <bdi>{s.cardLabel}</bdi> : null}</Field>
            <Field label={t("liveCharging@detail.idTag")} mono><Ltr>{s.idTag || "—"}</Ltr></Field>
            <Field label={t("liveCharging@detail.method")}><StartMethodChip method={s.startMethod} /></Field>
            <Field label={t("liveCharging@detail.car")}>{car ? <bdi>{car}</bdi> : null}</Field>
            <Field label={t("liveCharging@detail.points")}>
              {points == null ? <Typography variant="body2" color="text.secondary">{t("liveCharging@points.notDecided")}</Typography> : <PointsChip points={points} />}
            </Field>
          </Box>
        </Paper>

        {/* Where */}
        <Paper variant="outlined" sx={card} component="section" aria-labelledby="sd-where">
          <SectionTitle id="sd-where">{t("liveCharging@detail.where")}</SectionTitle>
          <Box sx={grid}>
            <Field label={t("liveCharging@detail.station")}>
              <Link component={RouterLink} to={stationCableConnectPath(s.chargingPointId)} underline="hover" fontWeight={700}><bdi>{s.stationName}</bdi></Link>
            </Field>
            <Field label={t("liveCharging@detail.address")}>{d.stationAddress ? <bdi>{d.stationAddress}</bdi> : null}</Field>
            <Field label={t("liveCharging@detail.charger")}>
              <bdi>{s.chargerName || s.chargePointId}</bdi>
              <Typography variant="caption" color="text.secondary" display="block"><bdi dir="ltr" style={{ fontFamily: "monospace" }}>{s.chargePointId}</bdi></Typography>
            </Field>
            <Field label={t("liveCharging@detail.plug")}>
              <bdi>{t("liveCharging@plugN", { n: s.connectorId })}</bdi>
              {(d.plugTypeName || d.powerKw != null) && (
                <Typography variant="caption" color="text.secondary" display="block">
                  <bdi>{[d.plugTypeName, d.powerKw != null ? `${d.powerKw} kW` : null].filter(Boolean).join(" · ")}</bdi>
                </Typography>
              )}
            </Field>
          </Box>
        </Paper>

        {/* Time, energy and cost */}
        <Paper variant="outlined" sx={card} component="section" aria-labelledby="sd-figures">
          <SectionTitle id="sd-figures">{t("liveCharging@detail.figures")}</SectionTitle>
          <Box sx={grid}>
            <Field label={t("liveCharging@detail.started")}>{fmt.full(s.startedAt)}</Field>
            <Field label={t("liveCharging@detail.stopped")}>{s.isOpen ? "—" : fmt.full(s.stoppedAt)}</Field>
            <Field label={t("liveCharging@detail.duration")}><bdi>{fmtDurationLong(s.durationSec, t)}</bdi></Field>
            <Field label={t("liveCharging@detail.energy")}>
              <Ltr>{live.energyKwh != null ? `${fmtNum(live.energyKwh, 2)} kWh` : s.energyKwh != null ? `${fmtNum(s.energyKwh, 2)} kWh` : "—"}</Ltr>
            </Field>
            <Field label={s.isOpen ? t("liveCharging@detail.costSoFar") : t("liveCharging@detail.cost")}>
              <Box component="span" sx={{ color: "primary.main", fontWeight: 800 }}><Ltr>{fmtJod(live.costJod ?? s.costJod)}</Ltr></Box>
            </Field>
            <Field label={t("liveCharging@detail.battery")}><Ltr>{fmtSocRange(live.socStartPercent ?? s.socStartPercent, live.socEndPercent ?? s.socEndPercent)}</Ltr></Field>
            <Field label={t("liveCharging@detail.avgPower")}>{live.avgPowerW != null ? <Ltr>{fmtNum(live.avgPowerW / 1000, 1)} kW</Ltr> : null}</Field>
            <Field label={t("liveCharging@detail.maxPower")}>{live.maxPowerW != null ? <Ltr>{fmtNum(live.maxPowerW / 1000, 1)} kW</Ltr> : null}</Field>
            <Field label={t("liveCharging@detail.tariff")}>
              {live.tariffSource ? t(`liveCharging@tariff.source.${live.tariffSource}`, { defaultValue: live.tariffSource }) : null}
            </Field>
          </Box>
          {live.price && live.price.length > 0 && (
            <Box sx={{ mt: 2, overflowX: "auto" }}>
              <Table size="small" aria-label={t("liveCharging@detail.priceLines")}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t("liveCharging@detail.window")}</TableCell>
                    <TableCell align="right">kWh</TableCell>
                    <TableCell align="right">{t("liveCharging@detail.rate")}</TableCell>
                    <TableCell align="right">JOD</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {live.price.map((p) => (
                    <TableRow key={p.key}>
                      <TableCell><bdi>{ar ? p.nameAr || p.nameEn : p.nameEn}</bdi></TableCell>
                      <TableCell align="right"><Ltr>{fmtNum(p.kwh, 3)}</Ltr></TableCell>
                      <TableCell align="right"><Ltr>{t("liveCharging@detail.filsPerKwh", { v: p.priceFils })}</Ltr></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}><Ltr>{fmtNum(p.fils / 1000, 3)}</Ltr></TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} sx={{ fontWeight: 800 }}>{t("liveCharging@detail.total")}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "primary.main" }}>
                      <Ltr>{fmtNum(live.price.reduce((sum, p) => sum + p.fils, 0) / 1000, 3)}</Ltr>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>

        {/* Limit and stop */}
        <Paper variant="outlined" sx={card} component="section" aria-labelledby="sd-stop">
          <SectionTitle id="sd-stop">{t("liveCharging@detail.limitAndStop")}</SectionTitle>
          <Box sx={grid}>
            <Field label={t("liveCharging@detail.limit")}>{limitText ? <bdi>{limitText}</bdi> : t("liveCharging@detail.noLimit")}</Field>
            <Field label={t("liveCharging@detail.limitSetBy")}>{limit && d.limitSetByName ? <bdi>{d.limitSetByName}</bdi> : null}</Field>
            <Field label={t("liveCharging@detail.limitSetAt")}>{limit?.setAt ? fmt.full(limit.setAt) : null}</Field>
            <Field label={t("liveCharging@detail.limitReachedAt")}>{limit?.reachedAt ? fmt.full(limit.reachedAt) : null}</Field>
            <Field label={t("liveCharging@detail.stopReason")}>{s.isOpen ? null : <bdi>{stopReasonLabel(s, ar)}</bdi>}</Field>
            <Field label={t("liveCharging@detail.stoppedBy")}>
              {s.isOpen ? null : d.stoppedByLimit ? t("liveCharging@detail.stoppedByLimit") : d.stoppedByName ? <bdi>{d.stoppedByName}</bdi> : t("liveCharging@detail.stoppedAtCharger")}
            </Field>
            <Field label={t("liveCharging@detail.receiptNo")} mono>{s.receiptNo ? <Ltr>{s.receiptNo}</Ltr> : null}</Field>
          </Box>
        </Paper>
      </Box>

      {/* Readings */}
      <Paper variant="outlined" sx={card} component="section" aria-labelledby="sd-chart">
        <SectionTitle id="sd-chart">{t("liveCharging@detail.chart")}</SectionTitle>
        <SessionSeriesChart series={live.series ?? []} />
      </Paper>

      {/* Commands */}
      <Paper variant="outlined" sx={card} component="section" aria-labelledby="sd-commands">
        <SectionTitle id="sd-commands">{t("liveCharging@detail.commands")}</SectionTitle>
        {d.commands.length === 0 ? (
          <Typography variant="body2" color="text.secondary">{t("liveCharging@detail.noCommands")}</Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" aria-label={t("liveCharging@detail.commands")}>
              <TableHead>
                <TableRow>
                  <TableCell>{t("liveCharging@detail.cmd.action")}</TableCell>
                  <TableCell>{t("liveCharging@detail.cmd.when")}</TableCell>
                  <TableCell>{t("liveCharging@detail.cmd.answer")}</TableCell>
                  <TableCell>{t("liveCharging@detail.cmd.by")}</TableCell>
                  <TableCell align="right">{t("liveCharging@detail.cmd.ms")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {d.commands.map((c) => {
                  const ok = c.status === "Answered" && (!c.resultStatus || c.resultStatus === "Accepted");
                  return (
                    <TableRow key={c.id}>
                      <TableCell sx={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {t(`liveCharging@detail.cmd.${c.action}`, { defaultValue: c.action })}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}><Typography variant="caption">{fmt.full(c.createdAt)}</Typography></TableCell>
                      <TableCell>
                        <Chip
                          size="small" variant="outlined" color={ok ? "success" : "error"}
                          label={<Ltr>{[c.status, c.resultStatus].filter(Boolean).join(" · ")}</Ltr>}
                          sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                        />
                        {(c.errorCode || c.errorDescription) && (
                          <Typography variant="caption" color="error.main" display="block"><Ltr>{[c.errorCode, c.errorDescription].filter(Boolean).join(" — ")}</Ltr></Typography>
                        )}
                        {c.completedAt && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {t("liveCharging@detail.cmd.confirmed", { sec: c.confirmedAfterSec ?? 0 })}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{c.requestedByName ? <bdi>{c.requestedByName}</bdi> : "—"}</TableCell>
                      <TableCell align="right"><Ltr>{c.durationMs ?? "—"}</Ltr></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* Issues */}
      <Paper variant="outlined" sx={card} component="section" aria-labelledby="sd-issues">
        <SectionTitle id="sd-issues">{t("liveCharging@detail.issues")}</SectionTitle>
        {d.issues.length === 0 ? (
          <Typography variant="body2" color="text.secondary">{t("liveCharging@detail.noIssues")}</Typography>
        ) : (
          <Stack spacing={1}>
            {d.issues.map((i) => (
              <Paper key={i.issueId} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="body2" fontWeight={800}><Ltr>#{i.issueId}</Ltr></Typography>
                  <Chip size="small" variant="outlined" label={t(`liveCharging@issueReason.${i.reason ?? "Other"}`, { defaultValue: i.reason ?? "" })} sx={{ height: 20, fontSize: 11, fontWeight: 600 }} />
                  <Chip
                    size="small" color={i.status === "Resolved" ? "success" : i.status === "Closed" ? "default" : "warning"}
                    label={t(`liveCharging@issueStatus.${i.status}`, { defaultValue: i.status })} sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                  />
                  <Typography variant="caption" color="text.secondary">{fmt.full(i.createdAt)}</Typography>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    size="small" component={RouterLink} to={`/complaints?id=${i.issueId}`} endIcon={<OpenInNewIcon fontSize="small" />}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    {t("liveCharging@detail.openComplaint")}
                  </Button>
                </Stack>
                {i.note && <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>{i.note}</Typography>}
                {i.reply && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                    <b>{t("liveCharging@detail.reply")}:</b> {i.reply}
                  </Typography>
                )}
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <ChargerDetailDialog id={chargerOpen ? s.chargerId : null} onClose={() => setChargerOpen(false)} />
    </>
  );
}
