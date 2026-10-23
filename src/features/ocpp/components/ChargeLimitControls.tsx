import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, MenuItem, Stack, TextField, Tooltip, Typography,
  type ChipProps,
} from "@mui/material";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import { useLanguageStore, useSnackbarStore } from "../../../stores";
import { LANGUAGE } from "../../../constants/language-constants";
import { useSetSessionChargeLimit } from "../hooks/use-ocpp";
import type { OcppChargeLimitDto, OcppChargeLimitKind } from "../types/api";
import { CHARGE_LIMIT_KINDS, CHARGE_LIMIT_RANGES, checkChargeLimit, type ChargeLimitCheck } from "../utils/charge-limit";
import { errMessage, useDateFmt } from "./ocpp-ui";

/** The "stop at …" choice being edited: kind "" = no limit; value as typed. */
export function useChargeLimitForm(initial?: OcppChargeLimitDto | null) {
  const [kind, setKind] = useState<OcppChargeLimitKind | "">(initial?.kind ?? "");
  const [value, setValue] = useState(initial?.value != null ? String(initial.value) : "");
  return { kind, value, setKind, setValue, check: checkChargeLimit(kind, value) };
}

/** Kind select + value with its unit; the range is the hint, or the reason it is refused. */
export function ChargeLimitFields({
  form, label, disabled, autoFocus,
}: { form: ReturnType<typeof useChargeLimitForm>; label?: string; disabled?: boolean; autoFocus?: boolean }) {
  const { t } = useTranslation();
  const { kind, value, setKind, setValue, check } = form;
  const [touched, setTouched] = useState(false);
  const unit = kind ? t(`ocpp@limit.unit.${kind}`) : "";
  const range = kind ? CHARGE_LIMIT_RANGES[kind] : null;
  // Shown once something is typed (or the field was left empty), not while the admin has not started.
  const showError = !check.ok && (touched || value.trim() !== "");

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="flex-start">
      <TextField
        select size="small" label={label ?? t("ocpp@limit.title")} value={kind} disabled={disabled} autoFocus={autoFocus}
        onChange={(e) => { setKind(e.target.value as OcppChargeLimitKind | ""); setTouched(false); }}
        sx={{ minWidth: 190, flex: { sm: 1 } }}
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        fullWidth
      >
        <MenuItem value="">{t("ocpp@limit.none")}</MenuItem>
        {CHARGE_LIMIT_KINDS.map((k) => <MenuItem key={k} value={k}>{t(`ocpp@limit.kind.${k}`)}</MenuItem>)}
      </TextField>
      {kind && range && (
        <TextField
          size="small" type="number" label={t("ocpp@limit.value")} value={value} disabled={disabled}
          onChange={(e) => setValue(e.target.value)} onBlur={() => setTouched(true)}
          error={showError}
          helperText={showError ? limitErrorText(t, kind, check) : t("ocpp@limit.range", { min: range.min, max: range.max, unit })}
          sx={{ flex: { sm: 1 } }}
          fullWidth
          slotProps={{
            input: { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> },
            htmlInput: { min: range.min, max: range.max, step: range.step, dir: "ltr", inputMode: kind === "Soc" ? "numeric" : "decimal" },
          }}
        />
      )}
    </Stack>
  );
}

export function limitErrorText(t: TFunction, kind: OcppChargeLimitKind | "", check: ChargeLimitCheck): string {
  if (check.ok || !kind) return "";
  return t(`ocpp@limit.errors.${check.error}`, { min: check.min, max: check.max, unit: t(`ocpp@limit.unit.${kind}`) });
}

/** Small badge with the limit text ("7 JOD" / "7 دينار"); amber once reached. */
export function ChargeLimitChip({ limit, size = "small" }: { limit?: OcppChargeLimitDto | null; size?: ChipProps["size"] }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const ar = useLanguageStore((s) => s.language) === LANGUAGE.AR;
  if (!limit) return null;
  const text = (ar ? limit.textAr : limit.text) || limit.text;
  const reached = !!limit.reachedAt;
  const tip = reached ? `${t("ocpp@limit.reached")} · ${fmt.full(limit.reachedAt)}` : limit.setAt ? t("ocpp@limit.setAt", { ago: fmt.relative(limit.setAt) }) : "";
  return (
    <Tooltip title={tip}>
      <Chip
        size={size} variant="outlined" color={reached ? "warning" : "secondary"} icon={<FlagOutlinedIcon />}
        label={<bdi>{t("ocpp@limit.badge", { text })}</bdi>}
        sx={{ height: size === "small" ? 20 : undefined, fontSize: size === "small" ? 11 : undefined, fontWeight: 700, width: "fit-content" }}
      />
    </Tooltip>
  );
}

/** Set, change or remove the limit of a running session (PUT sessions/{id}/limit). */
export function ChargeLimitDialog({
  open, transactionId, current, onClose,
}: { open: boolean; transactionId: number; current?: OcppChargeLimitDto | null; onClose: () => void }) {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const save = useSetSessionChargeLimit();
  const form = useChargeLimitForm(current);
  const pending = save.isPending;
  const unchanged = form.check.ok && form.check.kind === (current?.kind ?? null) && form.check.value === (current?.value ?? null);

  const submit = async (kind: OcppChargeLimitKind | null, value: number | null) => {
    try {
      const r = await save.mutateAsync({ transactionId, kind, value });
      openSuccessSnackbar({ message: t(r ? "ocpp@limit.saved" : "ocpp@limit.cleared") });
      onClose();
    } catch (err) {
      openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) });
    }
  };

  return (
    <Dialog open={open} onClose={() => !pending && onClose()} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{t("ocpp@limit.dialogTitle", { session: transactionId })}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">{t("ocpp@limit.hint")}</Typography>
          <ChargeLimitFields form={form} disabled={pending} autoFocus />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {current && (
          <Button color="error" disabled={pending} onClick={() => submit(null, null)} sx={{ marginInlineEnd: "auto" }}>{t("ocpp@limit.clear")}</Button>
        )}
        <Button onClick={onClose} disabled={pending} color="inherit">{t("cancel")}</Button>
        <Button
          variant="contained" disabled={pending || !form.check.ok || unchanged || (!form.check.kind && !current)}
          onClick={() => form.check.ok && submit(form.check.kind, form.check.value)}
          startIcon={pending ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
