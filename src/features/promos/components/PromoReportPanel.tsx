import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { fmtJod } from "../../../utils/api-error";
import { usePromoReport } from "../hooks/use-promos";
import { budgetUsedPercent } from "../utils/promo-rules";

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>
      <Typography variant="h6" fontWeight={800} sx={{ fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Paper>
  );
}

/** Claims, uses, the discount split Cable / partners, the budget left and the same per partner. */
export default function PromoReportPanel({ campaignId }: { campaignId: number }) {
  const { t } = useTranslation();
  const { data: r, isLoading, error } = usePromoReport(campaignId);

  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>;
  if (error || !r) return <Alert severity="error">{t("loadingFailed")}</Alert>;

  const usedPct = budgetUsedPercent(r.budgetJod, r.cableSpentJod);
  const n = (v: number) => v.toLocaleString("en-US");

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}><Kpi label={t("promos@report.claims")} value={n(r.claims)} hint={t("promos@report.assignedHint", { count: r.assigned })} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Kpi label={t("promos@report.uses")} value={n(r.uses)} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Kpi label={t("promos@report.totalDiscount")} value={fmtJod(r.totalDiscountJod)} hint={t("promos@report.onAmount", { amount: fmtJod(r.originalAmountJod) })} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Kpi label={t("promos@report.bonusPoints")} value={n(r.bonusPointsGiven)} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Kpi label={t("promos@report.cableShare")} value={fmtJod(r.cableShareJod)} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><Kpi label={t("promos@report.partnersShare")} value={fmtJod(r.providersShareJod)} /></Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>{t("promos@report.budget")}</Typography>
            {r.budgetJod == null ? (
              <Typography variant="h6" fontWeight={800}>{t("promos@report.noBudget")}</Typography>
            ) : (
              <>
                <Typography variant="h6" fontWeight={800}>
                  {fmtJod(r.budgetLeftJod)}{" "}
                  <Typography component="span" variant="caption" color="text.secondary">
                    {t("promos@report.leftOf", { spent: fmtJod(r.cableSpentJod), budget: fmtJod(r.budgetJod) })}
                  </Typography>
                </Typography>
                {usedPct != null && (
                  <LinearProgress variant="determinate" value={usedPct} color={usedPct >= 90 ? "error" : usedPct >= 70 ? "warning" : "primary"}
                    sx={{ mt: 1, height: 8, borderRadius: 4 }} />
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {(["available", "used", "expired", "revoked"] as const).map((k) => (
          <Chip key={k} variant="outlined" label={`${t(`promos@userStatus.${k.charAt(0).toUpperCase()}${k.slice(1)}`)}: ${n(r[k])}`} />
        ))}
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ px: 2, pt: 2 }}>{t("promos@report.byPartner")}</Typography>
        {r.byProvider.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{t("promos@report.noUses")}</Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t("promos@report.partner")}</TableCell>
                  <TableCell align="right">{t("promos@report.uses")}</TableCell>
                  <TableCell align="right">{t("promos@report.amount")}</TableCell>
                  <TableCell align="right">{t("promos@report.discount")}</TableCell>
                  <TableCell align="right">{t("promos@report.cableShare")}</TableCell>
                  <TableCell align="right">{t("promos@report.partnerShare")}</TableCell>
                  <TableCell align="right">{t("promos@report.bonusPoints")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {r.byProvider.map((p) => (
                  <TableRow key={`${p.providerType}-${p.providerId}`}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{p.providerName ?? `#${p.providerId}`}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t(p.providerType === "ChargingPoint" ? "promos@report.station" : "promos@report.provider")} · #{p.providerId}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{n(p.uses)}</TableCell>
                    <TableCell align="right">{fmtJod(p.originalAmountJod)}</TableCell>
                    <TableCell align="right">{fmtJod(p.discountJod)}</TableCell>
                    <TableCell align="right">{fmtJod(p.cableShareJod)}</TableCell>
                    <TableCell align="right">{fmtJod(p.providerShareJod)}</TableCell>
                    <TableCell align="right">{n(p.bonusPoints)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
