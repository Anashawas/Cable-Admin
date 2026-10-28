import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Button, Chip, CircularProgress, Link, MenuItem, Paper, Stack, TextField, Typography,
} from "@mui/material";
import EvStationIcon from "@mui/icons-material/EvStation";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SaveIcon from "@mui/icons-material/Save";
import { useLanguageStore, useSnackbarStore } from "../../../stores";
import { LANGUAGE } from "../../../constants/language-constants";
import { updateComplaintStatus } from "../services/complaints-service";
import { ComplaintStatus, type UserComplaintDto } from "../types/api";
import { fmtJod } from "../../ocpp/utils/live-charging";
import { fmtDay, fmtNum, fmtTime12 } from "../../ocpp/utils/payments-format";
import { Field, Ltr, StartMethodChip, useProblemToast } from "../../ocpp/components/live-charging/live-ui";
import { sessionDetailPath } from "../../ocpp/components/live-charging/SessionsTable";

const caption = { textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.65rem", fontWeight: 700 } as const;
const REPLY_MAX = 1000;

/** The charging session behind a "problem with this session" complaint, with a link to its detail. */
export function ComplaintSessionCard({ complaint }: { complaint: UserComplaintDto }) {
  const { t } = useTranslation();
  const ar = useLanguageStore((s) => s.language) === LANGUAGE.AR;
  const s = complaint.session;
  const sessionId = s?.sessionId ?? complaint.ocppTransactionId ?? null;

  return (
    <Paper elevation={0} sx={{ mt: 1.5, p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }} component="section" aria-label={t("complaints@session.title")}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        <EvStationIcon sx={{ fontSize: 18, color: "primary.main" }} aria-hidden />
        <Typography variant="caption" color="text.disabled" sx={caption}>{t("complaints@session.title")}</Typography>
        {complaint.reason && (
          <Chip size="small" color="warning" variant="outlined" label={t(`liveCharging@issueReason.${complaint.reason}`, { defaultValue: complaint.reason })} sx={{ height: 22, fontWeight: 700 }} />
        )}
        <Box sx={{ flex: 1 }} />
        {sessionId != null && (
          <Button size="small" component={RouterLink} to={sessionDetailPath(sessionId)} endIcon={<OpenInNewIcon fontSize="small" />} sx={{ textTransform: "none", fontWeight: 700 }}>
            {t("complaints@session.open")}
          </Button>
        )}
      </Stack>
      {!s ? (
        <Typography variant="body2" color="text.secondary">{sessionId != null ? <Ltr>#{sessionId}</Ltr> : "—"}</Typography>
      ) : (
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
          <Field label={t("complaints@session.id")}>
            <Link component={RouterLink} to={sessionDetailPath(s.sessionId)} underline="hover" fontWeight={800}><Ltr>#{s.sessionId}</Ltr></Link>
          </Field>
          <Field label={t("complaints@session.station")}>{complaint.chargingPoint?.name ? <bdi>{complaint.chargingPoint.name}</bdi> : null}</Field>
          <Field label={t("complaints@session.charger")}><bdi>{s.chargerName || `#${s.chargerId}`}</bdi></Field>
          <Field label={t("complaints@session.plug")}><bdi>{t("liveCharging@plugN", { n: s.connectorId })}</bdi></Field>
          <Field label={t("complaints@session.time")}>
            <bdi>{fmtDay(s.startedAt, ar, true)} · {fmtTime12(s.startedAt, ar)} – {s.stoppedAt ? fmtTime12(s.stoppedAt, ar) : "…"}</bdi>
          </Field>
          <Field label={t("complaints@session.energy")}><Ltr>{s.energyKwh != null ? `${fmtNum(s.energyKwh, 2)} kWh` : "—"}</Ltr></Field>
          <Field label={t("complaints@session.cost")}><Ltr>{fmtJod(s.costJod)}</Ltr></Field>
          <Field label={t("complaints@session.method")}><StartMethodChip method={s.startMethod} /></Field>
          <Field label={t("complaints@session.stopReason")}>{s.stopReasonText ? <bdi>{s.stopReasonText}</bdi> : null}</Field>
          <Field label={t("complaints@session.receiptNo")} mono>{s.receiptNo ? <Ltr>{s.receiptNo}</Ltr> : null}</Field>
          <Field label={t("complaints@session.photo")} mono>{complaint.imageFileName ? <Ltr>{complaint.imageFileName}</Ltr> : null}</Field>
        </Box>
      )}
    </Paper>
  );
}

/**
 * Status + the reply the driver sees in the app (PATCH UpdateUserComplaintStatus { status, reply }).
 * On a charging-session complaint every change pushes the driver.
 */
export function ComplaintReplyPanel({
  complaint, statuses, statusLabel,
}: { complaint: UserComplaintDto; statuses: ComplaintStatus[]; statusLabel: (s: ComplaintStatus) => string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const toastError = useProblemToast();
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [reply, setReply] = useState("");

  useEffect(() => { setStatus(complaint.status); setReply(""); }, [complaint.id, complaint.status]);

  const save = useMutation({
    mutationFn: () => updateComplaintStatus(complaint.id, status, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      openSuccessSnackbar({ message: t(reply.trim() ? "complaints@replyPanel.saved" : "complaints@statusUpdated") });
      setReply("");
    },
    onError: (err) => { void toastError(err); },
  });

  const changed = status !== complaint.status || (reply.trim() !== "" && reply.trim() !== (complaint.reply ?? "").trim());
  const session = complaint.kind === "ChargingSession";

  return (
    <Paper elevation={0} sx={{ mt: 1.5, p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }} component="section" aria-label={t("complaints@replyPanel.title")}>
      <Typography variant="caption" color="text.disabled" sx={{ ...caption, display: "block", mb: 0.75 }}>{t("complaints@replyPanel.title")}</Typography>
      {complaint.reply && (
        <Box sx={{ mb: 1.25, p: 1.25, borderRadius: 1.5, bgcolor: "action.hover" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>{t("complaints@replyPanel.current")}</Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{complaint.reply}</Typography>
        </Box>
      )}
      <Stack spacing={1.25}>
        <TextField
          label={t("complaints@replyPanel.reply")} value={reply} onChange={(e) => setReply(e.target.value)}
          multiline minRows={2} fullWidth size="small" inputProps={{ maxLength: REPLY_MAX }}
          helperText={session ? t("complaints@replyPanel.hintSession") : t("complaints@replyPanel.hint")}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
          <TextField
            select size="small" label={t("complaints@status")} value={status} sx={{ minWidth: 200 }}
            onChange={(e) => setStatus(Number(e.target.value) as ComplaintStatus)}
          >
            {statuses.map((st) => <MenuItem key={st} value={st}>{statusLabel(st)}</MenuItem>)}
          </TextField>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained" onClick={() => save.mutate()} disabled={!changed || save.isPending}
            startIcon={save.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            {t("complaints@replyPanel.save")}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
