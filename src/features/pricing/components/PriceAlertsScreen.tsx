import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, Grid, IconButton, MenuItem, Paper, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import BedtimeIcon from "@mui/icons-material/Bedtime";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useSnackbarStore } from "../../../stores";
import { usePriceAlertOverview, usePriceAlertPreview, useSetQuietHours, useUpdateTouTariff } from "../hooks/use-pricing";
import type { TouWindowDto } from "../services/pricing-service";

const toClock = (min: number) => `${String(Math.floor((min % 1440) / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const fromClock = (v: string) => { const [h, m] = v.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const errMessage = (err: any, fallback: string) => err?.response?.data?.detail || err?.response?.data?.title || err?.message || fallback;

/**
 * Price alerts: the time-of-use tariff (source of truth for the apps), the quiet hours, who is
 * subscribed, what was sent, and a dry run of the job for any Jordan time. Editing the tariff
 * creates a new version; user preferences stay theirs (only counts are shown here).
 */
export default function PriceAlertsScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const { data, isLoading } = usePriceAlertOverview();
  const update = useUpdateTouTariff();
  const quiet = useSetQuietHours();

  const [rows, setRows] = useState<TouWindowDto[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [note, setNote] = useState("");
  const [dirty, setDirty] = useState(false);
  const [quietFrom, setQuietFrom] = useState("23:30");
  const [quietTo, setQuietTo] = useState("06:30");
  const [previewAt, setPreviewAt] = useState("");
  const [previewOn, setPreviewOn] = useState(false);
  const preview = usePriceAlertPreview(previewAt || null, 10, previewOn);

  useEffect(() => {
    if (!data) return;
    if (!dirty) setRows(data.tariff?.windows.map((w) => ({ ...w })) ?? []);
    setQuietFrom(data.quietFrom);
    setQuietTo(data.quietTo);
  }, [data, dirty]);

  const coverage = useMemo(() => rows.reduce((s, w) => s + (w.endMin - w.startMin), 0), [rows]);
  const keysUnique = useMemo(() => new Set(rows.map((r) => r.key.trim())).size === rows.length, [rows]);
  const canSave = dirty && rows.length > 0 && coverage === 1440 && keysUnique && rows.every((r) => r.key.trim() && r.nameEn.trim() && r.nameAr.trim() && r.priceFils > 0 && r.endMin > r.startMin);

  const edit = (i: number, patch: Partial<TouWindowDto>) => { setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...patch } : r))); setDirty(true); };

  const save = async () => {
    try {
      const r = await update.mutateAsync({ windows: rows, effectiveFrom: effectiveFrom || null, note: note.trim() || null });
      openSuccessSnackbar({ message: t("pricing@tariff.saved", { version: r.version }) });
      setDirty(false); setNote("");
    } catch (err) { openErrorSnackbar({ message: errMessage(err, t("pricing@error")) }); }
  };

  const saveQuiet = async () => {
    try { await quiet.mutateAsync({ quietFrom, quietTo }); openSuccessSnackbar({ message: t("pricing@quiet.saved") }); }
    catch (err) { openErrorSnackbar({ message: errMessage(err, t("pricing@error")) }); }
  };

  if (isLoading || !data) return <AppScreenContainer><Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box></AppScreenContainer>;

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "primary.main", color: "primary.contrastText", display: "flex", alignItems: "center", justifyContent: "center" }}><PriceChangeIcon /></Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>{t("pricing@title")}</Typography>
              <Typography variant="body2" color="text.secondary">{t("pricing@subtitle")}</Typography>
            </Box>
          </Stack>

          {/* KPIs */}
          <Grid container spacing={1.5}>
            {[
              [t("pricing@kpi.version"), data.tariff ? `v${data.tariff.version}` : "—"],
              [t("pricing@kpi.enabledUsers"), data.enabledUsers],
              [t("pricing@kpi.quiet"), `${data.quietFrom} – ${data.quietTo}`],
              [t("pricing@kpi.sends14d"), data.recentSends.reduce((s, x) => s + x.users, 0)],
            ].map(([label, value]) => (
              <Grid key={String(label)} size={{ xs: 6, md: 3 }}>
                <Paper elevation={0} sx={{ p: 1.75, borderRadius: 3, border: 1, borderColor: "divider" }}>
                  <Typography variant="h6" fontWeight={800}>{value}</Typography>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Tariff editor */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: 1, borderColor: "divider" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap gap={1}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>{t("pricing@tariff.title")}</Typography>
                <Typography variant="caption" color="text.secondary">{t("pricing@tariff.hint")}</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button size="small" startIcon={<AddIcon />} onClick={() => { setRows((rs) => [...rs, { key: "", nameEn: "", nameAr: "", startMin: 0, endMin: 60, tier: "partial", priceFils: 0 }]); setDirty(true); }}>{t("pricing@tariff.addWindow")}</Button>
                <Button size="small" startIcon={<RestartAltIcon />} disabled={!dirty} onClick={() => { setDirty(false); setRows(data.tariff?.windows.map((w) => ({ ...w })) ?? []); }}>{t("pricing@tariff.discard")}</Button>
              </Stack>
            </Stack>
            <Box sx={{ overflowX: "auto", mt: 1.5 }}>
              <Table size="small">
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
                  {rows.map((w, i) => (
                    <TableRow key={i}>
                      <TableCell><TextField size="small" value={w.key} onChange={(e) => edit(i, { key: e.target.value })} inputProps={{ maxLength: 30, style: { fontFamily: "monospace" } }} sx={{ width: 120 }} /></TableCell>
                      <TableCell><TextField size="small" value={w.nameEn} onChange={(e) => edit(i, { nameEn: e.target.value })} inputProps={{ maxLength: 60 }} sx={{ width: 140 }} /></TableCell>
                      <TableCell><TextField size="small" value={w.nameAr} onChange={(e) => edit(i, { nameAr: e.target.value })} inputProps={{ maxLength: 60 }} sx={{ width: 140 }} /></TableCell>
                      <TableCell><TextField size="small" type="time" value={toClock(w.startMin)} onChange={(e) => edit(i, { startMin: fromClock(e.target.value) })} sx={{ width: 110 }} /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <TextField size="small" type="time" value={toClock(w.endMin)} onChange={(e) => { const m = fromClock(e.target.value); edit(i, { endMin: m <= w.startMin ? m + 1440 : m }); }} sx={{ width: 110 }} />
                          {w.endMin > 1440 && <Chip size="small" label={t("pricing@tariff.nextDay")} />}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <TextField select size="small" value={w.tier} onChange={(e) => edit(i, { tier: e.target.value as TouWindowDto["tier"] })} sx={{ width: 130 }}>
                          {(["offPeak", "partial", "peak"] as const).map((x) => <MenuItem key={x} value={x}>{t(`pricing@tier.${x}`)}</MenuItem>)}
                        </TextField>
                      </TableCell>
                      <TableCell><TextField size="small" type="number" value={w.priceFils} onChange={(e) => edit(i, { priceFils: Number(e.target.value) })} inputProps={{ min: 1, max: 9999 }} sx={{ width: 90 }} /></TableCell>
                      <TableCell><IconButton size="small" onClick={() => { setRows((rs) => rs.filter((_, k) => k !== i)); setDirty(true); }}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            {coverage !== 1440 && <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>{t("pricing@tariff.coverage", { minutes: coverage })}</Alert>}
            {!keysUnique && <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>{t("pricing@tariff.duplicateKeys")}</Alert>}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mt: 1.5 }}>
              <TextField size="small" type="datetime-local" label={t("pricing@tariff.effectiveFrom")} value={effectiveFrom} onChange={(e) => { setEffectiveFrom(e.target.value); setDirty(true); }} InputLabelProps={{ shrink: true }} sx={{ width: 240 }} />
              <TextField size="small" label={t("pricing@tariff.note")} value={note} onChange={(e) => { setNote(e.target.value); setDirty(true); }} inputProps={{ maxLength: 300 }} sx={{ flex: 1 }} />
              <Button variant="contained" startIcon={update.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />} disabled={!canSave || update.isPending} onClick={save}>{t("pricing@tariff.save")}</Button>
            </Stack>
            {data.versions.length > 0 && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                {t("pricing@tariff.versions")}: {data.versions.map((v) => `v${v.version}${v.isActive ? " ✓" : ""}`).join(" · ")}
              </Typography>
            )}
          </Paper>

          {/* Quiet hours + subscribers */}
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: 1, borderColor: "divider", height: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center"><BedtimeIcon color="action" /><Typography variant="subtitle1" fontWeight={800}>{t("pricing@quiet.title")}</Typography></Stack>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>{t("pricing@quiet.hint")}</Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <TextField size="small" type="time" label={t("pricing@quiet.from")} value={quietFrom} onChange={(e) => setQuietFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                  <TextField size="small" type="time" label={t("pricing@quiet.to")} value={quietTo} onChange={(e) => setQuietTo(e.target.value)} InputLabelProps={{ shrink: true }} />
                  <Button variant="outlined" size="small" disabled={quiet.isPending || (quietFrom === data.quietFrom && quietTo === data.quietTo)} onClick={saveQuiet}>{t("pricing@quiet.save")}</Button>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: 1, borderColor: "divider", height: "100%" }}>
                <Typography variant="subtitle1" fontWeight={800}>{t("pricing@subscribers.title")}</Typography>
                {data.subscribers.length === 0 ? <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t("pricing@subscribers.none")}</Typography> : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    {data.subscribers.map((s) => <Chip key={`${s.windowKey}-${s.leadMinutes}`} label={`${s.windowKey} · ${s.leadMinutes} ${t("pricing@min")} · ${s.users}`} variant="outlined" />)}
                  </Stack>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Dry run */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: 1, borderColor: "divider" }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between">
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>{t("pricing@preview.title")}</Typography>
                <Typography variant="caption" color="text.secondary">{t("pricing@preview.hint")}</Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField size="small" type="datetime-local" value={previewAt} onChange={(e) => setPreviewAt(e.target.value)} sx={{ width: 230 }} />
                <Button variant="contained" size="small" startIcon={<PlayCircleOutlineIcon />} onClick={() => { setPreviewOn(true); preview.refetch(); }}>{t("pricing@preview.run")}</Button>
              </Stack>
            </Stack>
            {previewOn && (
              <Box sx={{ mt: 1.5 }}>
                {preview.isFetching ? <CircularProgress size={20} /> : (preview.data?.length ?? 0) === 0 ? (
                  <Typography variant="body2" color="text.secondary">{t("pricing@preview.nothing")}</Typography>
                ) : (
                  <Table size="small">
                    <TableHead><TableRow>
                      <TableCell>{t("pricing@preview.window")}</TableCell><TableCell>{t("pricing@preview.at")}</TableCell><TableCell>{t("pricing@preview.lead")}</TableCell>
                      <TableCell>{t("pricing@preview.recipients")}</TableCell><TableCell>{t("pricing@preview.text")}</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {preview.data!.map((p, i) => (
                        <TableRow key={i} sx={{ opacity: p.quiet ? 0.55 : 1 }}>
                          <TableCell><Chip size="small" label={p.windowKey} /> {p.quiet && <Chip size="small" color="warning" variant="outlined" label={t("pricing@preview.quietCancelled")} />}</TableCell>
                          <TableCell>{new Date(p.alertAtLocal).toLocaleString()}</TableCell>
                          <TableCell>{p.leadMinutes} {t("pricing@min")}</TableCell>
                          <TableCell><Tooltip title={t("pricing@preview.recipientsHint", { sent: p.alreadySent, token: p.withToken })}><span>{p.subscribers}</span></Tooltip></TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{p.titleAr}</Typography><Typography variant="caption">{p.bodyAr}</Typography>
                            <Divider sx={{ my: 0.5 }} />
                            <Typography variant="body2" fontWeight={700}>{p.titleEn}</Typography><Typography variant="caption">{p.bodyEn}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
            )}
          </Paper>

          {/* Recent sends */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: 1, borderColor: "divider" }}>
            <Typography variant="subtitle1" fontWeight={800}>{t("pricing@sends.title")}</Typography>
            {data.recentSends.length === 0 ? <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t("pricing@sends.none")}</Typography> : (
              <Table size="small" sx={{ mt: 1 }}>
                <TableHead><TableRow><TableCell>{t("pricing@preview.window")}</TableCell><TableCell>{t("pricing@sends.date")}</TableCell><TableCell>{t("pricing@preview.lead")}</TableCell><TableCell>{t("pricing@sends.users")}</TableCell><TableCell>{t("pricing@sends.sentAt")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.recentSends.map((s, i) => (
                    <TableRow key={i}><TableCell>{s.windowKey}</TableCell><TableCell>{s.alertDate}</TableCell><TableCell>{s.leadMinutes} {t("pricing@min")}</TableCell><TableCell>{s.users}</TableCell><TableCell>{new Date(s.sentAt).toLocaleString()}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
