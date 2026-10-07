import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Button, Chip, CircularProgress, IconButton, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Tooltip, Typography,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import { useSnackbarStore } from "../../../stores";
import { useChangeConfiguration, useGetConfiguration } from "../hooks/use-ocpp";
import type { OcppChargePointDetailDto, OcppConfigurationKey } from "../types/api";
import { errMessage, useDateFmt } from "./ocpp-ui";

/** Keys that decide how the pilot behaves; shown first and highlighted. */
const IMPORTANT = new Set([
  "SupportedFeatureProfiles", "HeartbeatInterval", "MeterValueSampleInterval", "MeterValuesSampledData",
  "AuthorizeRemoteTxRequests", "LocalAuthListEnabled", "LocalAuthListMaxLength", "LocalAuthorizeOffline",
  "LocalPreAuthorize", "AllowOfflineTxForUnknownId", "WebSocketPingInterval", "NumberOfConnectors",
]);

function KeyRow({ k, cpId, disabled, onChanged }: { k: OcppConfigurationKey; cpId: number; disabled: boolean; onChanged: (key: string, value: string) => void }) {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const change = useChangeConfiguration();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(k.value ?? "");

  const save = async () => {
    try {
      const r = await change.mutateAsync({ id: cpId, key: k.key, value });
      if (r.status === "Answered" && (r.resultStatus === "Accepted" || r.resultStatus === "RebootRequired")) {
        openSuccessSnackbar({ message: `${k.key}: ${r.resultStatus === "RebootRequired" ? t("ocpp@config.rebootRequired") : t("ocpp@config.saved")}` });
        onChanged(k.key, value);
        setEditing(false);
      } else {
        openErrorSnackbar({ message: `${k.key}: ${r.resultStatus ?? r.errorDescription ?? t(`ocpp@commands.status.${r.status}`, { defaultValue: r.status })}` });
      }
    } catch (err) {
      openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) });
    }
  };

  return (
    <TableRow hover sx={{ bgcolor: IMPORTANT.has(k.key) ? "action.selected" : undefined }}>
      <TableCell sx={{ fontFamily: "monospace", fontWeight: IMPORTANT.has(k.key) ? 700 : 500, whiteSpace: "nowrap" }}>{k.key}</TableCell>
      <TableCell sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
        {editing
          ? <TextField size="small" value={value} onChange={(e) => setValue(e.target.value)} fullWidth inputProps={{ maxLength: 500 }} autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} />
          : (k.value ?? <Typography variant="caption" color="text.disabled">—</Typography>)}
      </TableCell>
      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
        {k.readonly
          ? <Tooltip title={t("ocpp@config.readonly")}><LockIcon fontSize="small" color="disabled" /></Tooltip>
          : editing ? (
            <>
              <Tooltip title={t("save")}><span><IconButton size="small" color="primary" onClick={save} disabled={change.isPending}>{change.isPending ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}</IconButton></span></Tooltip>
              <IconButton size="small" onClick={() => { setEditing(false); setValue(k.value ?? ""); }} disabled={change.isPending}><CloseIcon fontSize="small" /></IconButton>
            </>
          ) : (
            <Tooltip title={t("ocpp@actions.edit")}><span><IconButton size="small" onClick={() => setEditing(true)} disabled={disabled}><EditIcon fontSize="small" /></IconButton></span></Tooltip>
          )}
      </TableCell>
    </TableRow>
  );
}

/**
 * Phase 2 — the unit's own configuration (GetConfiguration / ChangeConfiguration).
 * Nothing is cached server-side: "Read settings" asks the charger right now, so the
 * table is always what the unit really has. The first thing to read on a new unit is
 * SupportedFeatureProfiles — it decides which later features are possible.
 */
export default function ChargerConfigPanel({ cp }: { cp: OcppChargePointDetailDto }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const get = useGetConfiguration();
  const [keys, setKeys] = useState<OcppConfigurationKey[] | null>(null);
  const [unknown, setUnknown] = useState<string[]>([]);
  const [readAt, setReadAt] = useState<string | null>(null);
  const offline = !cp.isConnected;

  const read = async () => {
    try {
      const r = await get.mutateAsync({ id: cp.id });
      if (r.status !== "Answered" || !r.responsePayload) {
        openErrorSnackbar({ message: `${t("ocpp@config.read")}: ${r.errorDescription ?? t(`ocpp@commands.status.${r.status}`, { defaultValue: r.status })}` });
        return;
      }
      const body = JSON.parse(r.responsePayload) as { configurationKey?: OcppConfigurationKey[]; unknownKey?: string[] };
      const list = [...(body.configurationKey ?? [])].sort((a, b) => Number(IMPORTANT.has(b.key)) - Number(IMPORTANT.has(a.key)) || a.key.localeCompare(b.key));
      setKeys(list);
      setUnknown(body.unknownKey ?? []);
      setReadAt(new Date().toISOString());
    } catch (err) {
      openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) });
    }
  };

  const profiles = keys?.find((k) => k.key === "SupportedFeatureProfiles")?.value?.split(",").map((p) => p.trim()).filter(Boolean) ?? [];

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap gap={1}>
        <Box>
          <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>{t("ocpp@config.title")}</Typography>
          {readAt && <Typography variant="caption" color="text.secondary">{t("ocpp@config.readAt")} {fmt.full(readAt)}</Typography>}
        </Box>
        <Button size="small" variant={keys ? "outlined" : "contained"} startIcon={get.isPending ? <CircularProgress size={14} color="inherit" /> : <SettingsIcon />}
          disabled={get.isPending || offline} onClick={read}>
          {keys ? t("ocpp@config.reread") : t("ocpp@config.read")}
        </Button>
      </Stack>

      {!keys ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{offline ? t("ocpp@commands.offlineHint") : t("ocpp@config.hint")}</Typography>
      ) : (
        <>
          {profiles.length > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5, alignSelf: "center" }}>{t("ocpp@config.profiles")}:</Typography>
              {profiles.map((p) => <Chip key={p} size="small" label={p} color="primary" variant="outlined" />)}
            </Stack>
          )}
          <Box sx={{ overflowX: "auto", mt: 1.5 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t("ocpp@config.key")}</TableCell>
                  <TableCell>{t("ocpp@config.value")}</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {keys.map((k) => (
                  <KeyRow key={k.key} k={k} cpId={cp.id} disabled={offline}
                    onChanged={(key, value) => setKeys((prev) => prev?.map((x) => (x.key === key ? { ...x, value } : x)) ?? prev)} />
                ))}
              </TableBody>
            </Table>
          </Box>
          {unknown.length > 0 && <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>{t("ocpp@config.unknown")}: {unknown.join(", ")}</Typography>}
        </>
      )}
    </Paper>
  );
}
