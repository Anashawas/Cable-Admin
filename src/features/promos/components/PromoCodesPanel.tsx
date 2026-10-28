import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, CircularProgress, Grid, Paper, Stack, TextField, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import { useSnackbarStore } from "../../../stores";
import { apiErrorMessage, saveBlob } from "../../../utils/api-error";
import { useGeneratePromoCodes } from "../hooks/use-promos";
import { exportPromoCodes } from "../services/promos-service";
import type { AdminPromoCampaignDto } from "../types/api";

const MAX_BATCH = 5000;

/** Unique mode: generate PRM- codes in batches and export them with who claimed each. */
export default function PromoCodesPanel({ campaign }: { campaign: AdminPromoCampaignDto }) {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const generate = useGeneratePromoCodes();
  const [count, setCount] = useState("100");
  const [exporting, setExporting] = useState(false);

  const n = Math.trunc(Number(count));
  const countValid = Number.isFinite(n) && n >= 1 && n <= MAX_BATCH;

  const handleExport = async () => {
    setExporting(true);
    try {
      saveBlob(await exportPromoCodes(campaign.id), `promo-${campaign.id}-codes.csv`);
    } catch (err) {
      openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) });
    } finally {
      setExporting(false);
    }
  };

  if (campaign.codeMode !== "Unique") {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        {t("promos@codes.publicMode", { code: campaign.publicCode ?? "—" })}
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        {[
          { label: t("promos@codes.total"), value: campaign.codesCount },
          { label: t("promos@codes.claimed"), value: campaign.codesClaimed },
          { label: t("promos@codes.unclaimed"), value: Math.max(0, campaign.codesCount - campaign.codesClaimed) },
        ].map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 4 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>{k.label}</Typography>
              <Typography variant="h5" fontWeight={800}>{k.value.toLocaleString("en-US")}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={800}>{t("promos@codes.generateTitle")}</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>{t("promos@codes.generateHint")}</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-start" }}>
          <TextField size="small" type="number" label={t("promos@codes.count")} value={count} onChange={(e) => setCount(e.target.value)}
            error={!countValid} helperText={countValid ? t("promos@codes.countHint") : t("promos@codes.countInvalid", { max: MAX_BATCH })}
            inputProps={{ min: 1, max: MAX_BATCH }} sx={{ width: 200 }} />
          <Button variant="contained" disabled={!countValid || generate.isPending}
            startIcon={generate.isPending ? <CircularProgress size={18} color="inherit" /> : <QrCode2Icon />}
            onClick={() =>
              generate.mutate(
                { id: campaign.id, count: n },
                {
                  onSuccess: (r) => openSuccessSnackbar({ message: t("promos@codes.generated", { generated: r.generated, total: r.totalCodes }) }),
                  onError: (err) => openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) }),
                }
              )
            }>
            {t("promos@codes.generate")}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" onClick={handleExport} disabled={exporting || campaign.codesCount === 0}
            startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}>
            {t("promos@codes.export")}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
