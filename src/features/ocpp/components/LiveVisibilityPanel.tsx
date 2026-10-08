import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel,
  Paper, Stack, Switch, TextField, Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useSnackbarStore } from "../../../stores";
import { useLiveVisibility, useSetLiveStatusBlocked, useSetShareLiveStatus } from "../hooks/use-ocpp";
import { errMessage, useDateFmt } from "./ocpp-ui";

function Gate({ ok, label, detail }: { ok: boolean; label: string; detail?: string | null }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {ok ? <CheckCircleIcon fontSize="small" color="success" /> : <CancelIcon fontSize="small" color="error" />}
      <Typography variant="body2" fontWeight={600}>{label}</Typography>
      {detail && <Typography variant="caption" color="text.secondary">· {detail}</Typography>}
    </Stack>
  );
}

/**
 * N-2 — whether drivers see this station's live plug states. Three gates on the station
 * (subscription · owner's sharing switch · admin block) plus per-charger freshness. The admin
 * block is a veto: it can hide what the owner shares, it cannot share what the owner hid.
 */
export default function LiveVisibilityPanel({ chargingPointId }: { chargingPointId: number }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const { data: v, isLoading } = useLiveVisibility(chargingPointId);
  const block = useSetLiveStatusBlocked();
  const share = useSetShareLiveStatus();
  const [blockDialog, setBlockDialog] = useState(false);
  const [reason, setReason] = useState("");
  const busy = block.isPending || share.isPending;

  const run = async (action: () => Promise<unknown>, successKey: string) => {
    try { await action(); openSuccessSnackbar({ message: t(successKey) }); }
    catch (err) { openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) }); }
  };

  if (isLoading || !v) return <Box display="flex" justifyContent="center" py={2}><CircularProgress size={20} /></Box>;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, borderColor: v.visibleToDrivers ? "success.main" : "divider" }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        {v.visibleToDrivers ? <VisibilityIcon color="success" /> : <VisibilityOffIcon color="disabled" />}
        <Typography variant="subtitle1" fontWeight={800}>{t("ocpp@visibility.title")}</Typography>
        <Chip size="small" color={v.visibleToDrivers ? "success" : "default"} variant={v.visibleToDrivers ? "filled" : "outlined"} sx={{ fontWeight: 700 }}
          label={v.visibleToDrivers ? t("ocpp@visibility.visible") : t("ocpp@visibility.hidden")} />
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{t("ocpp@visibility.hint")}</Typography>

      <Stack spacing={1} sx={{ mt: 1.5 }}>
        <Gate ok={v.subscriptionOn} label={t("ocpp@visibility.gateSubscription")} />
        <Gate ok={v.ownerSharing} label={t("ocpp@visibility.gateOwner")} detail={v.ownerDecidedAt ? `${t("ocpp@visibility.decided")} ${fmt.full(v.ownerDecidedAt)}` : t("ocpp@visibility.notDecided")} />
        <Gate ok={!v.adminBlocked} label={t("ocpp@visibility.gateAdmin")} detail={v.adminBlocked ? `${v.adminBlockReason ?? ""} · ${fmt.full(v.adminBlockedAt)}` : null} />
        <Gate ok label={t("ocpp@visibility.gateFresh")} />
      </Stack>

      <Divider sx={{ my: 1.5 }} />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between">
        <FormControlLabel
          control={<Switch checked={v.ownerSharing} disabled={busy}
            onChange={(e) => run(() => share.mutateAsync({ chargingPointId, share: e.target.checked }), e.target.checked ? "ocpp@visibility.sharedOn" : "ocpp@visibility.sharedOff")} />}
          label={<Box><Typography variant="body2" fontWeight={700}>{t("ocpp@visibility.ownerSwitch")}</Typography><Typography variant="caption" color="text.secondary">{t("ocpp@visibility.ownerSwitchHint")}</Typography></Box>}
        />
        {v.adminBlocked
          ? <Button size="small" variant="contained" color="success" disabled={busy} onClick={() => run(() => block.mutateAsync({ chargingPointId, blocked: false }), "ocpp@visibility.unblocked")}>{t("ocpp@visibility.unblock")}</Button>
          : <Button size="small" variant="outlined" color="error" disabled={busy} onClick={() => { setReason(""); setBlockDialog(true); }}>{t("ocpp@visibility.block")}</Button>}
      </Stack>

      <Dialog open={blockDialog} onClose={() => !busy && setBlockDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("ocpp@visibility.blockTitle")}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>{t("ocpp@visibility.blockBody")}</Typography>
          <TextField label={t("ocpp@visibility.reason")} value={reason} onChange={(e) => setReason(e.target.value)} fullWidth multiline minRows={2} inputProps={{ maxLength: 300 }} autoFocus />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setBlockDialog(false)} disabled={busy} color="inherit">{t("cancel")}</Button>
          <Button variant="contained" color="error" disabled={busy || !reason.trim()}
            onClick={() => run(async () => { await block.mutateAsync({ chargingPointId, blocked: true, reason: reason.trim() }); setBlockDialog(false); }, "ocpp@visibility.blocked")}>
            {t("confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
