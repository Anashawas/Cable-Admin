import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Card,
  CardContent,
  Paper,
  Avatar,
  Typography,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  Divider,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
} from "@mui/material";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import EditNoteIcon from "@mui/icons-material/EditNote";
import GroupIcon from "@mui/icons-material/Group";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import StarsIcon from "@mui/icons-material/Stars";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import { useBulkAwardPoints, useAllTiers } from "../hooks/use-loyalty";
import { getAllCarModels } from "../../users/services/user-car-service";
import type { CarTypeWithModelsDto } from "../../users/types/api";
import { CITIES } from "../../charge-management/constants/options";
import type { BulkAwardResult } from "../types/api";

export default function BulkAwardScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const awardMutation = useBulkAwardPoints();
  const { data: tiers = [] } = useAllTiers();
  const { data: carTypes = [] } = useQuery<CarTypeWithModelsDto[]>({
    queryKey: ["car-types-with-models"],
    queryFn: ({ signal }) => getAllCarModels(signal),
    staleTime: 10 * 60 * 1000,
  });

  const [carTypeId, setCarTypeId] = useState<number | null>(null);
  const [carModelId, setCarModelId] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [tierId, setTierId] = useState<number | null>(null);
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<BulkAwardResult | null>(null);

  const selectedCarType = useMemo(() => carTypes.find((c) => c.id === carTypeId) ?? null, [carTypes, carTypeId]);
  const hasFilter = carTypeId != null || carModelId != null || city != null || tierId != null;
  const pointsNum = parseInt(points, 10);
  const validPoints = !isNaN(pointsNum) && pointsNum >= 1 && pointsNum <= 100000;

  const activeFilters = useMemo(() => {
    const f: string[] = [];
    if (selectedCarType) f.push(selectedCarType.name);
    if (carModelId) f.push(selectedCarType?.carModels.find((m) => m.id === carModelId)?.name ?? `#${carModelId}`);
    if (city) f.push(city);
    if (tierId) f.push(tiers.find((x) => x.id === tierId)?.name ?? `#${tierId}`);
    return f;
  }, [selectedCarType, carModelId, city, tierId, tiers]);

  const validate = useCallback(() => {
    if (!hasFilter) { openErrorSnackbar({ message: t("loyalty@bulkAward.noFilterError") }); return false; }
    if (!validPoints) { openErrorSnackbar({ message: t("loyalty@bulkAward.pointsRange") }); return false; }
    if (!note.trim()) { openErrorSnackbar({ message: t("loyalty@noteRequired") }); return false; }
    return true;
  }, [hasFilter, validPoints, note, openErrorSnackbar, t]);

  const handleAward = useCallback(() => {
    setConfirmOpen(false);
    awardMutation.mutate(
      { carTypeId, carModelId, city, tierId, points: pointsNum, note: note.trim() },
      {
        onSuccess: (res) => {
          setResult(res);
          openSuccessSnackbar({ message: t("loyalty@bulkAward.awardSuccess") });
        },
        onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
      }
    );
  }, [awardMutation, carTypeId, carModelId, city, tierId, pointsNum, note, openSuccessSnackbar, openErrorSnackbar, t]);

  const resetFilters = () => { setCarTypeId(null); setCarModelId(null); setCity(null); setTierId(null); };

  return (
    <AppScreenContainer>
      <ScreenHeader
        icon={<CardGiftcardIcon />}
        title={t("loyalty@bulkAward.title")}
        subtitle={t("loyalty@bulkAward.subtitle")}
      />

      <Stack spacing={3} sx={{ mt: 3, maxWidth: 760 }}>
        <Card elevation={4} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Paper elevation={0} sx={{ px: 3, py: 2.5, background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 46, height: 46 }}><CardGiftcardIcon /></Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="#fff">{t("loyalty@bulkAward.formTitle")}</Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("loyalty@bulkAward.formSubtitle")}</Typography>
                </Box>
              </Stack>
            </Paper>

            <Box sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>{t("loyalty@bulkAward.atLeastOneFilter")}</Alert>

                {/* Segment filters */}
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2" fontWeight={700} color="secondary.main">{t("loyalty@bulkAward.filters")}</Typography>
                  {hasFilter && <Button size="small" color="inherit" onClick={resetFilters} sx={{ textTransform: "none" }}>{t("chargeManagement@filters.clearAll")}</Button>}
                </Stack>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField select fullWidth label={t("loyalty@bulkAward.carType")} value={carTypeId ?? ""}
                      onChange={(e) => { const v = e.target.value ? Number(e.target.value) : null; setCarTypeId(v); setCarModelId(null); }}
                      InputProps={{ startAdornment: <InputAdornment position="start"><DirectionsCarIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
                    >
                      <MenuItem value=""><em>{t("loyalty@bulkAward.anyCarType")}</em></MenuItem>
                      {carTypes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField select fullWidth label={t("loyalty@bulkAward.carModel")} value={carModelId ?? ""} disabled={!selectedCarType}
                      onChange={(e) => setCarModelId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <MenuItem value=""><em>{t("loyalty@bulkAward.anyCarModel")}</em></MenuItem>
                      {(selectedCarType?.carModels ?? []).map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField select fullWidth label={t("loyalty@bulkAward.city")} value={city ?? ""}
                      onChange={(e) => setCity(e.target.value || null)}
                      InputProps={{ startAdornment: <InputAdornment position="start"><LocationCityIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
                    >
                      <MenuItem value=""><em>{t("loyalty@bulkAward.anyCity")}</em></MenuItem>
                      {CITIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField select fullWidth label={t("loyalty@bulkAward.tier")} value={tierId ?? ""}
                      onChange={(e) => setTierId(e.target.value ? Number(e.target.value) : null)}
                      InputProps={{ startAdornment: <InputAdornment position="start"><WorkspacePremiumIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
                    >
                      <MenuItem value=""><em>{t("loyalty@bulkAward.anyTier")}</em></MenuItem>
                      {tiers.map((tr) => <MenuItem key={tr.id} value={tr.id}>{tr.name}</MenuItem>)}
                    </TextField>
                  </Grid>
                </Grid>

                {activeFilters.length > 0 && (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    {activeFilters.map((f, i) => <Chip key={i} label={f} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 700 }} />)}
                  </Stack>
                )}

                <Divider />

                {/* Points + note */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField fullWidth type="number" label={t("loyalty@bulkAward.points")} value={points}
                      onChange={(e) => setPoints(e.target.value)} placeholder="100"
                      InputProps={{ startAdornment: <InputAdornment position="start"><StarsIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>, endAdornment: <InputAdornment position="end">{t("loyalty@pts")}</InputAdornment> }}
                      helperText={t("loyalty@bulkAward.pointsRange")}
                      inputProps={{ min: 1, max: 100000 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 7 }}>
                    <TextField fullWidth label={t("loyalty@note")} value={note} onChange={(e) => setNote(e.target.value)}
                      placeholder={t("loyalty@bulkAward.notePlaceholder")}
                      InputProps={{ startAdornment: <InputAdornment position="start"><EditNoteIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
                    />
                  </Grid>
                </Grid>

                <Alert severity="warning" sx={{ borderRadius: 2 }} icon={<BlockIcon />}>{t("loyalty@bulkAward.blockedSkippedInfo")}</Alert>

                <Button
                  variant="contained" color="secondary" size="large" fullWidth
                  disabled={awardMutation.isPending || !hasFilter || !validPoints || !note.trim()}
                  startIcon={awardMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <CardGiftcardIcon />}
                  onClick={() => { if (validate()) setConfirmOpen(true); }}
                  sx={{ py: 1.4, borderRadius: 2, fontWeight: 800 }}
                >
                  {awardMutation.isPending ? t("loyalty@processing") : t("loyalty@bulkAward.award")}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card elevation={4} sx={{ borderRadius: 3, border: "2px solid", borderColor: "success.main" }}>
            <CardContent>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="h6" fontWeight={800}>{t("loyalty@bulkAward.resultTitle")}</Typography>
              </Stack>
              <Grid container spacing={2}>
                {[
                  { label: t("loyalty@bulkAward.targetedUsers"), value: result.targetedUsers, icon: <GroupIcon />, color: "info" as const },
                  { label: t("loyalty@bulkAward.awardedUsers"), value: result.awardedUsers, icon: <CheckCircleIcon />, color: "success" as const },
                  { label: t("loyalty@bulkAward.skippedBlocked"), value: result.skippedBlockedUsers, icon: <BlockIcon />, color: "error" as const },
                  { label: t("loyalty@bulkAward.pointsTotal"), value: result.pointsAwardedTotal, icon: <StarsIcon />, color: "secondary" as const },
                ].map((c) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={c.label}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: `${c.color}.50`, border: 1, borderColor: `${c.color}.100`, textAlign: "center" }}>
                      <Box sx={{ color: `${c.color}.main`, display: "flex", justifyContent: "center", mb: 0.5 }}>{c.icon}</Box>
                      <Typography variant="h5" fontWeight={800} color={`${c.color}.dark`}>{c.value.toLocaleString()}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{c.label}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}
      </Stack>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t("loyalty@bulkAward.confirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("loyalty@bulkAward.confirmMessage", { points: pointsNum || 0, filters: activeFilters.join(", ") })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)}>{t("cancel")}</Button>
          <Button variant="contained" color="secondary" onClick={handleAward} startIcon={<CardGiftcardIcon />}>{t("loyalty@bulkAward.award")}</Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
