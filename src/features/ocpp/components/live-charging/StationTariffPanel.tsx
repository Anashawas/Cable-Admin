import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Skeleton, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";
import { useLanguageStore, useSnackbarStore } from "../../../../stores";
import { LANGUAGE } from "../../../../constants/language-constants";
import { useRemoveStationTariff, useSetStationTariff, useStationTariff } from "../../hooks/use-live-charging";
import type { TouWindowDto } from "../../types/live-charging";
import { checkTariffWindows, fromClock, sameWindows, toClock } from "../../utils/live-charging";
import { useProblemToast } from "./live-ui";

const copy = (ws: TouWindowDto[]) => ws.map((w) => ({ ...w }));

/**
 * A station's own time-of-use price (4.4), same windows as the national tariff editor:
 * 24 h exactly, unique keys, tier, 1–9999 fils/kWh. When set it prices every session of the
 * station (live cost, final price, JOD limits); removing it goes back to the national tariff.
 */
export default function StationTariffPanel({ chargingPointId }: { chargingPointId: number }) {
  const { t } = useTranslation();
  const ar = useLanguageStore((s) => s.language) === LANGUAGE.AR;
  const q = useStationTariff(chargingPointId);
  const save = useSetStationTariff();
  const remove = useRemoveStationTariff();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const toastError = useProblemToast();

  const [rows, setRows] = useState<TouWindowDto[]>([]);
  const [note, setNote] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const base = q.data?.tariff.windows ?? [];
  const dirty = !sameWindows(rows, base);
  const check = checkTariffWindows(rows);

  useEffect(() => { if (q.data) setRows(copy(q.data.tariff.windows)); }, [q.data]);

  const edit = (i: number, patch: Partial<TouWindowDto>) => setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  const doSave = async () => {
    try {
      const r = await save.mutateAsync({ chargingPointId, windows: rows, note: note.trim() || null });
      openSuccessSnackbar({ message: t("liveCharging@tariff.saved", { version: r.tariff.version }) });
      setNote("");
    } catch (err) {
      await toastError(err);
    }
  };

  const doRemove = async () => {
    try {
      await remove.mutateAsync(chargingPointId);
      openSuccessSnackbar({ message: t("liveCharging@tariff.removed") });
      setConfirmRemove(false);
    } catch (err) {
      await toastError(err);
    }
  };

  if (q.isLoading) return <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2 }} />;
  if (q.isError || !q.data)
    return (
      <Alert severity="warning" action={<Button color="inherit" size="small" onClick={() => q.refetch()}>{t("liveCharging@retry")}</Button>}>
        {t("liveCharging@tariff.loadError")}
      </Alert>
    );

  const d = q.data;
  const pending = save.isPending || remove.isPending;

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip
            size="small" color={d.hasOwnTariff ? "primary" : "default"} variant={d.hasOwnTariff ? "filled" : "outlined"}
            label={d.hasOwnTariff ? t("liveCharging@tariff.own", { version: d.tariff.version }) : t("liveCharging@tariff.national")}
            sx={{ fontWeight: 700 }}
          />
          {d.now && <Typography variant="body2" color="text.secondary"><bdi>{ar ? d.now.textAr : d.now.textEn}</bdi></Typography>}
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button size="small" startIcon={<AddIcon />} disabled={pending}
            onClick={() => setRows((rs) => [...rs, { key: "", nameEn: "", nameAr: "", startMin: 0, endMin: 60, tier: "partial", priceFils: 0 }])}>
            {t("pricing@tariff.addWindow")}
          </Button>
          <Button size="small" startIcon={<RestartAltIcon />} disabled={!dirty || pending} onClick={() => setRows(copy(base))}>{t("pricing@tariff.discard")}</Button>
          {d.hasOwnTariff && (
            <Button size="small" color="warning" startIcon={<UndoIcon />} disabled={pending} onClick={() => setConfirmRemove(true)}>
              {t("liveCharging@tariff.backToNational")}
            </Button>
          )}
        </Stack>
      </Stack>
      {!d.hasOwnTariff && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>{t("liveCharging@tariff.startFromNational")}</Typography>
      )}

      <Box sx={{ overflowX: "auto", mt: 1.5 }}>
        <Table size="small" aria-label={t("liveCharging@tariff.title")}>
          <TableHead>
            <TableRow>
              <TableCell>{t("pricing@tariff.key")}</TableCell>
              <TableCell>{t("pricing@tariff.nameEn")}</TableCell>
              <TableCell>{t("pricing@tariff.nameAr")}</TableCell>
              <TableCell>{t("pricing@tariff.from")}</TableCell>
              <TableCell>{t("pricing@tariff.to")}</TableCell>
              <TableCell>{t("pricing@tariff.tier")}</TableCell>
              <TableCell>{t("pricing@tariff.price")}</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((w, i) => {
              const bad = check.invalidRows.includes(i);
              return (
                <TableRow key={i} sx={bad ? { bgcolor: "action.hover" } : undefined}>
                  <TableCell><TextField size="small" value={w.key} error={bad && !w.key.trim()} onChange={(e) => edit(i, { key: e.target.value })} inputProps={{ maxLength: 30, style: { fontFamily: "monospace" }, "aria-label": t("pricing@tariff.key") }} sx={{ width: 120 }} /></TableCell>
                  <TableCell><TextField size="small" value={w.nameEn} error={bad && !w.nameEn.trim()} onChange={(e) => edit(i, { nameEn: e.target.value })} inputProps={{ maxLength: 60, "aria-label": t("pricing@tariff.nameEn") }} sx={{ width: 140 }} /></TableCell>
                  <TableCell><TextField size="small" value={w.nameAr} error={bad && !w.nameAr.trim()} onChange={(e) => edit(i, { nameAr: e.target.value })} inputProps={{ maxLength: 60, "aria-label": t("pricing@tariff.nameAr") }} sx={{ width: 140 }} /></TableCell>
                  <TableCell><TextField size="small" type="time" value={toClock(w.startMin)} onChange={(e) => edit(i, { startMin: fromClock(e.target.value) })} inputProps={{ "aria-label": t("pricing@tariff.from") }} sx={{ width: 110 }} /></TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <TextField
                        size="small" type="time" value={toClock(w.endMin)} inputProps={{ "aria-label": t("pricing@tariff.to") }} sx={{ width: 110 }}
                        onChange={(e) => { const m = fromClock(e.target.value); edit(i, { endMin: m <= w.startMin ? m + 1440 : m }); }}
                      />
                      {w.endMin > 1440 && <Chip size="small" label={t("pricing@tariff.nextDay")} />}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <TextField select size="small" value={w.tier} onChange={(e) => edit(i, { tier: e.target.value as TouWindowDto["tier"] })} sx={{ width: 130 }} inputProps={{ "aria-label": t("pricing@tariff.tier") }}>
                      {(["offPeak", "partial", "peak"] as const).map((x) => <MenuItem key={x} value={x}>{t(`pricing@tier.${x}`)}</MenuItem>)}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small" type="number" value={w.priceFils} error={bad && (w.priceFils < 1 || w.priceFils > 9999)}
                      onChange={(e) => edit(i, { priceFils: Number(e.target.value) })} inputProps={{ min: 1, max: 9999, "aria-label": t("pricing@tariff.price") }} sx={{ width: 90 }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" aria-label={t("liveCharging@tariff.removeWindow")} onClick={() => setRows((rs) => rs.filter((_, k) => k !== i))}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      {check.coverage !== 1440 && <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>{t("pricing@tariff.coverage", { minutes: check.coverage })}</Alert>}
      {check.duplicateKeys && <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>{t("pricing@tariff.duplicateKeys")}</Alert>}
      {check.invalidRows.length > 0 && <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>{t("liveCharging@tariff.invalidRows")}</Alert>}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mt: 1.5 }}>
        <TextField size="small" label={t("pricing@tariff.note")} value={note} onChange={(e) => setNote(e.target.value)} inputProps={{ maxLength: 300 }} sx={{ flex: 1 }} />
        <Button
          variant="contained" onClick={doSave}
          disabled={!check.ok || pending || (d.hasOwnTariff && !dirty)}
          startIcon={save.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {d.hasOwnTariff ? t("liveCharging@tariff.saveVersion") : t("liveCharging@tariff.setOwn")}
        </Button>
      </Stack>

      <Dialog open={confirmRemove} onClose={() => !remove.isPending && setConfirmRemove(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("liveCharging@tariff.confirmRemoveTitle")}</DialogTitle>
        <DialogContent><Typography variant="body2">{t("liveCharging@tariff.confirmRemoveBody")}</Typography></DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setConfirmRemove(false)} disabled={remove.isPending} color="inherit">{t("cancel")}</Button>
          <Button variant="contained" color="warning" onClick={doRemove} disabled={remove.isPending}
            startIcon={remove.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}>{t("confirm")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
