import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert, Box, Button, CircularProgress, FormControlLabel, InputAdornment, Paper, Skeleton, Stack, Switch, TextField, Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import AppScreenContainer from "../../../app/components/AppScreenContainer";
import { useSnackbarStore } from "../../../../stores";
import { useLiveChargingSettings, useSetLiveChargingSettings } from "../../hooks/use-live-charging";
import type { LiveChargingSettingsDto } from "../../types/live-charging";
import ConnectTabs from "../ConnectTabs";
import { useProblemToast } from "./live-ui";

const MIN_M = 10;
const MAX_M = 100_000;

/**
 * Cable Connect › Settings: the app-start proximity rule — radius and "require the phone's position"
 * (GET/PUT api/admin/ocpp/live-charging-settings). Automatic points are not used, so there is no switch for them.
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
  const save = useSetLiveChargingSettings();
  const openSuccessSnackbar = useSnackbarStore((st) => st.openSuccessSnackbar);
  const toastError = useProblemToast();

  const [distance, setDistance] = useState(String(s.maxDistanceMeters));
  const [requireLocation, setRequireLocation] = useState(s.requireLocation);

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
    </>
  );
}
