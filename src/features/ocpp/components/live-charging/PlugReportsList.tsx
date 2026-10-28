import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import {
  Box, Button, Checkbox, Chip, CircularProgress, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  Link, Paper, Skeleton, Stack, TextField, Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { useSnackbarStore } from "../../../../stores";
import { useResolveConnectorReport } from "../../hooks/use-live-charging";
import type { ConnectorReportDto, ConnectorReportGroupDto } from "../../types/live-charging";
import { useDateFmt } from "../ocpp-ui";
import { stationCableConnectPath } from "../StationCard";
import { Ltr, PlugReportBadge, useProblemToast } from "./live-ui";

/** "The plug is fixed": resolve every open report on the plug (or this report only), with an optional note. */
function ResolveDialog({ report, group, onClose }: { report: ConnectorReportDto; group: ConnectorReportGroupDto; onClose: () => void }) {
  const { t } = useTranslation();
  const resolve = useResolveConnectorReport();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const toastError = useProblemToast();
  const [note, setNote] = useState("");
  const [allOnPlug, setAllOnPlug] = useState(true);

  const submit = async () => {
    try {
      const n = await resolve.mutateAsync({ reportId: report.id, note: note.trim() || null, allOnPlug });
      openSuccessSnackbar({ message: t("liveCharging@plugReports.resolved", { count: n }) });
      onClose();
    } catch (err) {
      await toastError(err);
    }
  };

  return (
    <Dialog open onClose={() => !resolve.isPending && onClose()} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{t("liveCharging@plugReports.resolveTitle")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2">
            <bdi>{t("liveCharging@plugReports.resolveBody", { charger: group.chargerName || group.chargePointId, plug: group.connectorId })}</bdi>
          </Typography>
          <TextField
            label={t("liveCharging@plugReports.note")} value={note} onChange={(e) => setNote(e.target.value)}
            multiline minRows={2} fullWidth inputProps={{ maxLength: 500 }} autoFocus
          />
          <FormControlLabel
            control={<Checkbox checked={allOnPlug} onChange={(e) => setAllOnPlug(e.target.checked)} />}
            label={t("liveCharging@plugReports.allOnPlug", { count: group.openReports })}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={resolve.isPending} color="inherit">{t("cancel")}</Button>
        <Button
          onClick={submit} variant="contained" color="success" disabled={resolve.isPending}
          startIcon={resolve.isPending ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineIcon />}
        >
          {t("liveCharging@plugReports.resolve")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ReportRow({ r, onResolve }: { r: ConnectorReportDto; onResolve?: () => void }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const answer = [r.commandStatus, r.commandResultStatus, r.commandErrorCode].filter(Boolean).join(" · ");
  return (
    <Box sx={{ py: 1, borderTop: 1, borderColor: "divider" }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Typography variant="body2" fontWeight={700}><bdi>{r.reasonText || t(`liveCharging@reportReason.${r.reason}`, { defaultValue: r.reason })}</bdi></Typography>
        {r.resolvedAt
          ? <Chip size="small" color="success" variant="outlined" label={t("liveCharging@plugReports.isResolved")} sx={{ height: 20, fontSize: 11 }} />
          : <Chip size="small" color="warning" variant="outlined" label={t("liveCharging@plugReports.isOpen")} sx={{ height: 20, fontSize: 11 }} />}
        {!r.chargerOnline && (
          <Chip size="small" variant="outlined" icon={<WifiOffIcon />} label={t("liveCharging@plugReports.chargerOffline")} sx={{ height: 20, fontSize: 11, "& .MuiChip-icon": { fontSize: 14 } }} />
        )}
        <Typography variant="caption" color="text.secondary">{fmt.full(r.createdAt)}</Typography>
        <Box sx={{ flex: 1 }} />
        {!r.resolvedAt && onResolve && (
          <Button size="small" color="success" onClick={onResolve} sx={{ textTransform: "none", fontWeight: 600 }}>{t("liveCharging@plugReports.resolve")}</Button>
        )}
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block">
        {r.reporter?.displayName && <bdi>{r.reporter.displayName}</bdi>}
        {r.reporter?.phoneMasked && <> · <Ltr>{r.reporter.phoneMasked}</Ltr></>}
        {answer && <> · {t("liveCharging@plugReports.chargerAnswered")} <Ltr>{answer}</Ltr></>}
        {r.connectorStatus && <> · {t("liveCharging@plugReports.plugWas")} <Ltr>{[r.connectorStatus, r.connectorErrorCode !== "NoError" ? r.connectorErrorCode : null].filter(Boolean).join(" · ")}</Ltr></>}
      </Typography>
      {r.note && <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>{r.note}</Typography>}
      {r.resolvedAt && (
        <Typography variant="caption" color="success.main" display="block" sx={{ mt: 0.25 }}>
          {t("liveCharging@plugReports.resolvedBy", { name: r.resolvedByName ?? "—", at: fmt.full(r.resolvedAt) })}
          {r.resolutionNote && <> — <bdi>{r.resolutionNote}</bdi></>}
        </Typography>
      )}
    </Box>
  );
}

/** One plug: counts, the warning, the latest reports (expandable) and "fixed". */
function GroupCard({ g, showStation }: { g: ConnectorReportGroupDto; showStation: boolean }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const [expanded, setExpanded] = useState(g.suspectedIssue);
  const [resolving, setResolving] = useState<ConnectorReportDto | null>(null);
  const firstOpen = g.latest.find((r) => !r.resolvedAt) ?? null;
  const panelId = `plug-reports-${g.chargerId}-${g.connectorId}`;

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderRadius: 3, borderInlineStartWidth: g.suspectedIssue ? 3 : 1, borderInlineStartColor: g.suspectedIssue ? "warning.main" : "divider" }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="subtitle1" fontWeight={800} component="h3">
              <bdi>{g.chargerName || g.chargePointId}</bdi> · <bdi>{t("liveCharging@plugN", { n: g.connectorId })}</bdi>
            </Typography>
            <PlugReportBadge stat={{ openReports: g.openReports, reportsToday: g.reportsToday, suspectedIssue: g.suspectedIssue, lastReportAt: g.lastReportAt }} />
          </Stack>
          {showStation && (
            <Link component={RouterLink} to={stationCableConnectPath(g.chargingPointId)} underline="hover" variant="body2" fontWeight={600}>
              <bdi>{g.stationName}</bdi>
            </Link>
          )}
          <Typography variant="caption" color="text.secondary" display="block">
            <bdi>{t("liveCharging@plugReports.counts", { open: g.openReports, today: g.reportsToday, total: g.totalReports })}</bdi>
            {" · "}{t("liveCharging@plugReports.last", { ago: fmt.relative(g.lastReportAt) })}
            {" · "}<bdi>{t(`liveCharging@reportReason.${g.lastReason}`, { defaultValue: g.lastReason })}</bdi>
            {g.lastCommandResult && <> · <Ltr>{g.lastCommandResult}</Ltr></>}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {firstOpen && (
            <Button
              size="small" variant="contained" color="success" startIcon={<CheckCircleOutlineIcon />} onClick={() => setResolving(firstOpen)}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              {t("liveCharging@plugReports.markFixed")}
            </Button>
          )}
          <Button
            size="small" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-controls={panelId}
            endIcon={expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />} sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {t(expanded ? "liveCharging@plugReports.hideReports" : "liveCharging@plugReports.showReports")}
          </Button>
        </Stack>
      </Stack>
      <Collapse in={expanded} unmountOnExit>
        <Box id={panelId} sx={{ mt: 1 }}>
          {g.latest.map((r) => <ReportRow key={r.id} r={r} onResolve={() => setResolving(r)} />)}
        </Box>
      </Collapse>
      {resolving && <ResolveDialog report={resolving} group={g} onClose={() => setResolving(null)} />}
    </Paper>
  );
}

/** Reports grouped per plug (the API orders the busiest plugs first). */
export default function PlugReportsList({
  groups, loading, showStation = true, emptyText,
}: { groups: ConnectorReportGroupDto[]; loading?: boolean; showStation?: boolean; emptyText?: string }) {
  const { t } = useTranslation();
  if (loading && groups.length === 0)
    return <Stack spacing={1.5}>{[0, 1].map((i) => <Skeleton key={i} variant="rounded" height={90} sx={{ borderRadius: 3 }} />)}</Stack>;
  if (groups.length === 0)
    return (
      <Paper variant="outlined" sx={{ borderRadius: 3, p: 4, textAlign: "center" }}>
        <Typography color="text.secondary" fontWeight={600}>{emptyText ?? t("liveCharging@plugReports.empty")}</Typography>
      </Paper>
    );
  return (
    <Stack spacing={1.5} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {groups.map((g) => (
        <Box component="li" key={`${g.chargerId}-${g.connectorId}`}><GroupCard g={g} showStation={showStation} /></Box>
      ))}
    </Stack>
  );
}
