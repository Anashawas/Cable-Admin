import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, InputAdornment,
  Paper, Skeleton, Stack, Switch, TextField, Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import AppScreenContainer from "../../../app/components/AppScreenContainer";
import { useSnackbarStore } from "../../../../stores";
import { useLiveChargingSettings, useSetLiveChargingSettings } from "../../hooks/use-live-charging";
import type { LiveChargingSettingsDto } from "../../types/live-charging";
import { useDateFmt } from "../ocpp-ui";
import ConnectTabs from "../ConnectTabs";
import { useProblemToast } from "./live-ui";

const MIN_M = 10;
const MAX_M = 100_000;

/**
 * Cable Connect › Settings: the app-start proximity rule (radius, require the phone's position)
 * and automatic points when a driver's session ends (GET/PUT api/admin/ocpp/live-charging-settings).
 */
export default function LiveChargingSettingsScreen() {
  const { t } = useTranslation();
  const q = useLiveChargingSettings();

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} component="h1">{t("liveCharging@settings.title")}</Typography>
            <Typography variant="body2" color="text.secondary">{t("liveCharging@settings.subtitle")}</Typography>
          </Box>
          <ConnectTabs value="settings" />
          {q.isLoading ? (
            <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />
          ) : q.isError || !q.data ? (
            <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => q.refetch()}>{t("liveCharging@retry")}</Button>}>
              {t("liveCharging@settings.loadError")}
            </Alert>
          ) : (
            <SettingsForm s={q.data} />
          )}
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}

function SettingsForm({ s }: { s: LiveChargingSettingsDto }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const save = useSetLiveChargingSettings();
  const openSuccessSnackbar = useSnackbarStore((st) => st.openSuccessSnackbar);
  const toastError = useProblemToast();

  const [distance, setDistance] = useState(String(s.maxDistanceMeters));
  const [requireLocation, setRequireLocation] = useState(s.requireLocation);
  const [confirmPoints, setConfirmPoints] = useState<boolean | null>(null);

  useEffect(() => { setDistance(String(s.maxDistanceMeters)); setRequireLocation(s.requireLocation); }, [s.maxDistanceMeters, s.requireLocation]);

  const n = Number(distance);
  const distanceOk = distance.trim() !== "" && Number.isInteger(n) && n >= MIN_M && n <= MAX_M;
  const dirty = (distanceOk && n !== s.maxDistanceMeters) || requireLocation !== s.requireLocation;

  const saveProximity = async () => {
    try {
      await save.mutateAsync({
        maxDistanceMeters: n !== s.maxDistanceMeters ? n : null,
        requireLocation: requireLocation !== s.requireLocation ? requireLocation : null,
      });
      openSuccessSnackbar({ message: t("liveCharging@settings.saved") });
    } catch (err) {
      await toastError(err);
    }
  };

  const setPoints = async (on: boolean) => {
    try {
      await save.mutateAsync({ autoPointsEnabled: on });
      openSuccessSnackbar({ message: t(on ? "liveCharging@settings.pointsOn" : "liveCharging@settings.pointsOff") });
      setConfirmPoints(null);
    } catch (err) {
      await toastError(err);
    }
  };

  return (
    <>
      {/* Proximity */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }} component="section" aria-labelledby="lcs-proximity">
        <Typography id="lcs-proximity" variant="subtitle1" fontWeight={800} component="h2">{t("liveCharging@settings.proximityTitle")}</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>{t("liveCharging@settings.proximityHint")}</Typography>
        <Stack spacing={2} sx={{ maxWidth: 520 }}>
          <TextField
            size="small" type="number" label={t("liveCharging@settings.maxDistance")} value={distance}
            onChange={(e) => setDistance(e.target.value)} error={!distanceOk}
            helperText={distanceOk ? t("liveCharging@settings.maxDistanceHint") : t("liveCharging@settings.maxDistanceRange", { min: MIN_M, max: MAX_M })}
            slotProps={{
              input: { endAdornment: <InputAdornment position="end">{t("liveCharging@settings.meters")}</InputAdornment> },
              htmlInput: { min: MIN_M, max: MAX_M, step: 10, dir: "ltr", inputMode: "numeric" },
            }}
          />
          <Box>
            <FormControlLabel
              control={<Switch checked={requireLocation} onChange={(e) => setRequireLocation(e.target.checked)} />}
              label={<Typography fontWeight={600}>{t("liveCharging@settings.requireLocation")}</Typography>}
            />
            <Typography variant="caption" color="text.secondary" display="block">{t("liveCharging@settings.requireLocationHint")}</Typography>
          </Box>
          <Box>
            <Button
              variant="contained" onClick={saveProximity} disabled={!dirty || !distanceOk || save.isPending}
              startIcon={save.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
            >
              {t("save")}
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Automatic points */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }} component="section" aria-labelledby="lcs-points">
        <Typography id="lcs-points" variant="subtitle1" fontWeight={800} component="h2">{t("liveCharging@settings.pointsTitle")}</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>{t("liveCharging@settings.pointsHint")}</Typography>
        <FormControlLabel
          control={<Switch checked={s.autoPointsEnabled} disabled={save.isPending} onChange={(e) => setConfirmPoints(e.target.checked)} />}
          label={<Typography fontWeight={700}>{s.autoPointsEnabled ? t("liveCharging@settings.pointsEnabled") : t("liveCharging@settings.pointsDisabled")}</Typography>}
        />
        {s.autoPointsSince && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t(s.autoPointsEnabled ? "liveCharging@settings.onSince" : "liveCharging@settings.offSince", { at: fmt.full(s.autoPointsSince) })}
          </Typography>
        )}
        <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>{t("liveCharging@settings.pointsWarning")}</Alert>
      </Paper>

      <Dialog open={confirmPoints != null} onClose={() => !save.isPending && setConfirmPoints(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t(confirmPoints ? "liveCharging@settings.confirmOnTitle" : "liveCharging@settings.confirmOffTitle")}</DialogTitle>
        <DialogContent><Typography variant="body2">{t(confirmPoints ? "liveCharging@settings.confirmOnBody" : "liveCharging@settings.confirmOffBody")}</Typography></DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setConfirmPoints(null)} disabled={save.isPending} color="inherit">{t("cancel")}</Button>
          <Button
            variant="contained" disabled={save.isPending} onClick={() => confirmPoints != null && setPoints(confirmPoints)}
            startIcon={save.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {t("confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
