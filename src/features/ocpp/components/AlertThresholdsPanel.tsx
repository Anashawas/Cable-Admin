import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, CircularProgress, Grid, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useSnackbarStore } from "../../../stores";
import { useOcppAlertThresholds, useSetOcppAlertThresholds } from "../hooks/use-ocpp";
import type { OcppAlertThresholdDto, OcppAlertThresholdsDto } from "../types/api";
import { errMessage } from "./ocpp-ui";

type Key = "offline" | "faulted" | "longSession" | "parked";
const KEYS: Key[] = ["offline", "faulted", "longSession", "parked"];
type Form = Record<Key, string>;

const toForm = (d: OcppAlertThresholdsDto): Form => ({
  offline: d.offline.minutes?.toString() ?? "",
  faulted: d.faulted.minutes?.toString() ?? "",
  longSession: d.longSession.minutes?.toString() ?? "",
  parked: d.parked.minutes?.toString() ?? "",
});

/**
 * Per-station alert thresholds (minutes). Blank = the platform default shown as the
 * placeholder. The alert job reads them on every run, so a change applies within 5 minutes.
 */
export default function AlertThresholdsPanel({ chargingPointId }: { chargingPointId: number }) {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const { data, isLoading } = useOcppAlertThresholds(chargingPointId);
  const save = useSetOcppAlertThresholds();
  const [form, setForm] = useState<Form>({ offline: "", faulted: "", longSession: "", parked: "" });

  useEffect(() => { if (data) setForm(toForm(data)); }, [data]);

  if (isLoading || !data) return <Box display="flex" justifyContent="center" py={2}><CircularProgress size={20} /></Box>;

  const spec = (k: Key): OcppAlertThresholdDto => data[k];
  const parse = (v: string): number | null => (v.trim() === "" ? null : Number(v));
  const invalid = (k: Key) => {
    const n = parse(form[k]);
    if (n === null) return false;
    const s = spec(k);
    return !Number.isInteger(n) || n < s.minMinutes || n > s.maxMinutes;
  };
  const dirty = KEYS.some((k) => form[k] !== toForm(data)[k]);
  const anyInvalid = KEYS.some(invalid);
  const customised = KEYS.filter((k) => spec(k).minutes != null).length;

  const submit = async (values: Form) => {
    try {
      await save.mutateAsync({
        chargingPointId,
        offlineMinutes: parse(values.offline), faultedMinutes: parse(values.faulted),
        longSessionMinutes: parse(values.longSession), parkedMinutes: parse(values.parked),
      });
      openSuccessSnackbar({ message: t("ocpp@alertThresholds.saved") });
    } catch (err) {
      openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) });
    }
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <NotificationsActiveIcon color={customised > 0 ? "primary" : "disabled"} />
        <Typography variant="subtitle1" fontWeight={800}>{t("ocpp@alertThresholds.title")}</Typography>
        <Typography variant="caption" color="text.secondary">
          {customised > 0 ? t("ocpp@alertThresholds.customised", { count: customised }) : t("ocpp@alertThresholds.allDefault")}
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{t("ocpp@alertThresholds.hint")}</Typography>

      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        {KEYS.map((k) => (
          <Grid key={k} size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              size="small" fullWidth type="number"
              label={t(`ocpp@alertThresholds.${k}`)}
              value={form[k]}
              onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
              placeholder={String(spec(k).defaultMinutes)}
              error={invalid(k)}
              helperText={invalid(k)
                ? t("ocpp@alertThresholds.range", { min: spec(k).minMinutes, max: spec(k).maxMinutes })
                : t("ocpp@alertThresholds.default", { minutes: spec(k).defaultMinutes })}
              slotProps={{ input: { endAdornment: <InputAdornment position="end">{t("ocpp@alertThresholds.min")}</InputAdornment>, inputProps: { min: spec(k).minMinutes, max: spec(k).maxMinutes, step: 1 } } }}
            />
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1.5 }}>
        <Button size="small" color="inherit" startIcon={<RestartAltIcon />} disabled={save.isPending || customised === 0}
          onClick={() => submit({ offline: "", faulted: "", longSession: "", parked: "" })}>
          {t("ocpp@alertThresholds.reset")}
        </Button>
        <Button size="small" variant="contained" startIcon={save.isPending ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
          disabled={save.isPending || !dirty || anyInvalid} onClick={() => submit(form)}>
          {t("ocpp@alertThresholds.save")}
        </Button>
      </Stack>
    </Paper>
  );
}
