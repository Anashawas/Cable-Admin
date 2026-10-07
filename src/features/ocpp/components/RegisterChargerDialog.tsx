import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Alert, Autocomplete, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, IconButton, InputAdornment, Stack, Switch, TextField, Tooltip, Typography,
} from "@mui/material";
import { getAllChargingPoints } from "../../charge-management/services/charge-management-service";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import KeyIcon from "@mui/icons-material/Key";
import { useSnackbarStore } from "../../../stores";
import { useRegisterChargePoint } from "../hooks/use-ocpp";
import type { ChargerCredentials } from "../types/api";
import { errMessage, ocppBaseUrl } from "./ocpp-ui";

/** One copyable line of the credentials sheet. */
function CopyField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked — the value is still selectable */ }
  };
  return (
    <TextField
      label={label}
      value={value}
      fullWidth
      size="small"
      InputProps={{
        readOnly: true,
        sx: mono ? { fontFamily: "monospace", fontWeight: 600 } : undefined,
        endAdornment: (
          <InputAdornment position="end">
            <Tooltip title={copied ? t("ocpp@actions.copied") : t("ocpp@actions.copy")}>
              <IconButton size="small" onClick={copy}>{copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}</IconButton>
            </Tooltip>
          </InputAdornment>
        ),
      }}
      onFocus={(e) => e.target.select()}
    />
  );
}

/** Shown once after registering or rotating: the four values the technician types into the charger. */
export function CredentialsDialog({ open, credentials, onClose }: { open: boolean; credentials: ChargerCredentials | null; onClose: () => void }) {
  const { t } = useTranslation();
  if (!credentials) return null;
  // The server's own address wins; the admin config is only the fallback for an API without OcppServer:Url.
  const url = credentials.webSocketBaseUrl ?? `${ocppBaseUrl()}/ocpp16/`;
  const port = credentials.port ?? (url.startsWith("wss://") ? 443 : 80);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
        <KeyIcon color="primary" /> {t("ocpp@credentials.title")} — {credentials.chargePointId}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>{t("ocpp@credentials.warning")}</Alert>
          <CopyField label={t("ocpp@credentials.url")} value={url} />
          <Box>
            <CopyField label={t("ocpp@credentials.port")} value={String(port)} />
            <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>{t("ocpp@credentials.portHint", { port })}</Typography>
          </Box>
          <CopyField label={t("ocpp@credentials.chargePointId")} value={credentials.chargePointId} />
          <CopyField label={t("ocpp@credentials.username")} value={credentials.username} />
          {credentials.password
            ? <CopyField label={t("ocpp@credentials.password")} value={credentials.password} />
            : <Typography variant="body2" color="text.secondary">{t("ocpp@credentials.noPassword")}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">{t("ocpp@credentials.done")}</Button>
      </DialogActions>
    </Dialog>
  );
}

interface RegisterChargerDialogProps {
  open: boolean;
  onClose: () => void;
  /** When embedded in a station page the station is fixed. */
  chargingPointId?: number;
}

export default function RegisterChargerDialog({ open, onClose, chargingPointId }: RegisterChargerDialogProps) {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const register = useRegisterChargePoint();

  const [stationId, setStationId] = useState<number | null>(chargingPointId ?? null);
  const [chargePointId, setChargePointId] = useState("");

  // Station picker: the same full list the Charge Management screen caches (5-min stale time).
  const { data: stations = [], isLoading: loadingStations } = useQuery({
    queryKey: ["charge-management", "charging-points"],
    queryFn: ({ signal }) => getAllChargingPoints({ name: null, chargerPointTypeId: null, cityName: null }, signal),
    staleTime: 5 * 60 * 1000,
    enabled: open && !chargingPointId,
  });
  const stationOptions = useMemo(
    () => stations.map((s) => ({ id: s.id, name: s.name ?? t("chargeManagement@unnamed"), city: s.cityName ?? "" })),
    [stations, t]
  );
  const [displayName, setDisplayName] = useState("");
  const [heartbeat, setHeartbeat] = useState("60");
  // Default OFF: the pilot hardware (RH4) runs OCPP Security Profile 0 and cannot send Basic auth —
  // registering it with a password means 401 at the station. Turn on only for units that support it.
  const [requirePassword, setRequirePassword] = useState(false);
  const [credentials, setCredentials] = useState<ChargerCredentials | null>(null);

  useEffect(() => {
    if (open) {
      setStationId(chargingPointId ?? null);
      setChargePointId("");
      setDisplayName("");
      setHeartbeat("60");
      setRequirePassword(false);
    }
  }, [open, chargingPointId]);

  const canSubmit = stationId != null && stationId > 0 && !register.isPending;

  const submit = async () => {
    if (!canSubmit || stationId == null) return;
    try {
      const result = await register.mutateAsync({
        chargingPointId: stationId,
        chargePointId: chargePointId.trim() || null,
        displayName: displayName.trim() || null,
        requirePassword,
        heartbeatInterval: heartbeat ? Number(heartbeat) : null,
      });
      openSuccessSnackbar({ message: t("ocpp@register.success") });
      setCredentials(result);
      onClose();
    } catch (err) {
      openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={() => !register.isPending && onClose()} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("ocpp@register.title")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Autocomplete
              fullWidth
              disabled={!!chargingPointId}
              loading={loadingStations}
              options={stationOptions}
              getOptionLabel={(opt) => `${opt.name} (#${opt.id})${opt.city ? ` — ${opt.city}` : ""}`}
              value={stationOptions.find((s) => s.id === stationId) ?? (chargingPointId ? { id: chargingPointId, name: `#${chargingPointId}`, city: "" } : null)}
              onChange={(_, val) => setStationId(val?.id ?? null)}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              filterOptions={(options, { inputValue }) => {
                const q = inputValue.trim().toLowerCase();
                if (!q) return options;
                return options.filter((opt) => String(opt.id).includes(q) || opt.name.toLowerCase().includes(q) || opt.city.toLowerCase().includes(q));
              }}
              renderInput={(params) => (
                <TextField {...params} label={t("ocpp@register.station")} required helperText={t("ocpp@register.stationHint")}
                  InputProps={{ ...params.InputProps, endAdornment: (<>{loadingStations ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</>) }} />
              )}
            />
            <TextField
              label={t("ocpp@register.chargePointId")} value={chargePointId} onChange={(e) => setChargePointId(e.target.value)}
              fullWidth helperText={t("ocpp@register.chargePointIdHint")} inputProps={{ maxLength: 20, style: { fontFamily: "monospace" } }}
            />
            <TextField label={t("ocpp@register.displayName")} value={displayName} onChange={(e) => setDisplayName(e.target.value)} fullWidth inputProps={{ maxLength: 100 }} />
            <TextField label={t("ocpp@register.heartbeat")} value={heartbeat} onChange={(e) => setHeartbeat(e.target.value)} type="number" fullWidth inputProps={{ min: 10, max: 3600 }} />
            <Box>
              <FormControlLabel control={<Switch checked={requirePassword} onChange={(e) => setRequirePassword(e.target.checked)} />} label={t("ocpp@register.requirePassword")} />
              <Typography variant="caption" color="text.secondary" display="block">{t("ocpp@register.requirePasswordHint")}</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={onClose} disabled={register.isPending} color="inherit">{t("cancel")}</Button>
          <Button onClick={submit} variant="contained" disabled={!canSubmit}
            startIcon={register.isPending ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}>
            {t("ocpp@register.submit")}
          </Button>
        </DialogActions>
      </Dialog>

      <CredentialsDialog open={!!credentials} credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  );
}
