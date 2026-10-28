import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import GridOnIcon from "@mui/icons-material/GridOn";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import BackButton from "../../../components/BackButton";
import { useSnackbarStore } from "../../../stores";
import { apiErrorMessage } from "../../../utils/api-error";
import { usePlanFeatures, usePlans, useSaveFeatureMatrix } from "../hooks/use-billing";

/**
 * "مميزات الباقات": feature × plan matrix for the subscription plans. Saving
 * applies at once to every current subscriber (no app release) and is logged
 * per plan.
 */
export default function FeatureMatrixScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith("ar");
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data: plans = [], isLoading: loadingPlans } = usePlans(false);
  const { data: features = [], isLoading: loadingFeatures } = usePlanFeatures();
  const save = useSaveFeatureMatrix();

  const columns = useMemo(
    () => plans.filter((p) => p.category === "Subscription").sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [plans]
  );
  const [matrix, setMatrix] = useState<Record<number, string[]>>({});
  const [note, setNote] = useState("");

  useEffect(() => {
    setMatrix(Object.fromEntries(columns.map((p) => [p.id, [...p.features]])));
  }, [columns]);

  const dirty = columns.some((p) => {
    const now = [...(matrix[p.id] ?? [])].sort().join(",");
    return now !== [...p.features].sort().join(",");
  });

  const toggle = (planId: number, key: string) =>
    setMatrix((m) => {
      const cur = m[planId] ?? [];
      return { ...m, [planId]: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] };
    });

  const handleSave = () => {
    const changed = columns
      .filter((p) => [...(matrix[p.id] ?? [])].sort().join(",") !== [...p.features].sort().join(","))
      .map((p) => ({ planId: p.id, features: matrix[p.id] ?? [] }));
    save.mutate(
      { plans: changed, note: note.trim() || null },
      {
        onSuccess: (results) => {
          const affected = results.reduce((s, r) => s + (r.affectedSubscribers ?? 0), 0);
          openSuccessSnackbar({ message: t("billing@matrix.saved", { count: affected }) });
          setNote("");
        },
        onError: (err) => openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) }),
      }
    );
  };

  const loading = loadingPlans || loadingFeatures;

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2} sx={{ maxWidth: 1180, mx: "auto" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <BackButton fallback="/billing/plans" />
            <GridOnIcon color="primary" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={800}>{t("billing@matrix.title")}</Typography>
              <Typography variant="body2" color="text.secondary">{t("billing@matrix.subtitle")}</Typography>
            </Box>
          </Stack>

          <Alert severity="warning" sx={{ borderRadius: 2 }}>{t("billing@matrix.appliesNow")}</Alert>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
          ) : (
            <Paper variant="outlined" sx={{ borderRadius: 2, overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>{t("billing@matrix.feature")}</TableCell>
                    {columns.map((p) => (
                      <TableCell key={p.id} align="center" sx={{ fontWeight: 800, borderTop: `3px solid ${p.badgeColor || "transparent"}` }}>
                        {isAr ? p.nameAr : p.nameEn}
                        <Typography variant="caption" color="text.secondary" display="block">
                          {t("billing@plan.subscribers", { count: p.subscriberCount })}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {features.map((f) => (
                    <TableRow key={f.key} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{isAr ? f.nameAr : f.nameEn}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{f.key}</Typography>
                      </TableCell>
                      {columns.map((p) => (
                        <TableCell key={p.id} align="center">
                          <Checkbox checked={(matrix[p.id] ?? []).includes(f.key)} onChange={() => toggle(p.id, f.key)} disabled={save.isPending} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
              <TextField size="small" label={t("billing@plan.note")} value={note} onChange={(e) => setNote(e.target.value)} sx={{ flex: 1 }} />
              <Button variant="contained" onClick={handleSave} disabled={!dirty || save.isPending}
                startIcon={save.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}>
                {t("save")}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
