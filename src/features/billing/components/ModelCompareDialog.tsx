import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
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
import { alpha, useTheme } from "@mui/material/styles";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import { formatShortDate } from "../../../utils/date-format";
import { apiErrorMessage, fmtJod } from "../../../utils/api-error";
import { useModelCompare, usePlans } from "../hooks/use-billing";
import type { BillingProviderType, ModelCompareRequest, ModelCompareResult } from "../types/api";
import { optionLabel } from "../utils/plan-rules";

interface ModelCompareDialogProps {
  open: boolean;
  onClose: () => void;
  providerType: BillingProviderType;
  providerId: number;
  providerName?: string | null;
}

const jod3 = (v: number) => Number(v).toFixed(3);
const perScan = (amount: number, scans: number) => (scans > 0 ? amount / scans : null);

/** The recommendation in the UI language (the server's text follows Accept-Language; it is the fallback). */
function recommendationText(r: ModelCompareResult, t: (key: string, values?: Record<string, unknown>) => string): string {
  const rec = r.recommendation;
  return t(`billing@compare.recommendation.${rec.code}`, {
    days: r.days,
    saving: jod3(rec.partnerSavingJod),
    extra: jod3(-rec.partnerSavingJod),
    loss: jod3(-r.bundle.cableMarginJod),
    margin: jod3(r.bundle.cableMarginJod),
    defaultValue: rec.text,
  });
}

/**
 * «حاسبة المقارنة» (§3.4) — a sales tool, internal to Cable: the partner's completed transactions of the
 * last 90 days as they were on the percentage model, next to the same period simulated on a scan bundle,
 * with a recommendation. POST /api/admin/plans/model-compare.
 */
export default function ModelCompareDialog({ open, onClose, providerType, providerId, providerName }: ModelCompareDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isAr = lang.startsWith("ar");
  const theme = useTheme();
  const { data: plans = [] } = usePlans(false);

  const [planId, setPlanId] = useState<number | "">("");
  const [optionId, setOptionId] = useState<number | "">("");

  useEffect(() => {
    if (!open) return;
    setPlanId("");
    setOptionId("");
  }, [open, providerType, providerId]);

  const loyaltyPlans = useMemo(
    () => plans.filter((p) => p.category === "Loyalty" && p.isActive && p.appliesTo.includes(providerType)),
    [plans, providerType]
  );
  const plan = loyaltyPlans.find((p) => p.id === planId);
  const options = (plan?.priceOptions ?? []).filter((o) => o.isActive);

  const request: ModelCompareRequest = {
    providerType,
    providerId,
    bundlePlanId: planId === "" ? null : planId,
    priceOptionId: planId === "" || optionId === "" ? null : optionId,
  };
  const { data, isLoading, isFetching, error } = useModelCompare(request, open);

  const noData = data?.recommendation.model === "noData";
  const recommended = data && !noData ? data.recommendation.model : null;

  const colHead = (model: "percentage" | "bundle", label: string, sub?: ReactNode) => {
    const isRec = recommended === model;
    return (
      <TableCell
        align="right"
        sx={{ fontWeight: 800, verticalAlign: "bottom", bgcolor: isRec ? alpha(theme.palette.success.main, 0.1) : undefined, minWidth: 150 }}
      >
        <Stack alignItems="flex-end" spacing={0.5}>
          {isRec && <Chip size="small" color="success" icon={<ThumbUpAltOutlinedIcon />} label={t("billing@compare.recommended")} sx={{ fontWeight: 700 }} />}
          <span>{label}</span>
          {sub && <Typography variant="caption" color="text.secondary" fontWeight={500}>{sub}</Typography>}
        </Stack>
      </TableCell>
    );
  };

  const money = (v: number | null | undefined, opts: { strong?: boolean; signed?: boolean } = {}) => (
    <Typography
      variant="body2"
      component="span"
      fontWeight={opts.strong ? 800 : 600}
      color={opts.signed && v != null && v < 0 ? "error.main" : undefined}
      sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
    >
      <bdi dir="ltr">{fmtJod(v)}</bdi>
    </Typography>
  );

  const cell = (model: "percentage" | "bundle", content: ReactNode, caption?: ReactNode) => (
    <TableCell align="right" sx={{ bgcolor: recommended === model ? alpha(theme.palette.success.main, 0.05) : undefined }}>
      {content}
      {caption && <Typography variant="caption" color="text.secondary" display="block">{caption}</Typography>}
    </TableCell>
  );

  const num = (v: number | null | undefined) => (v == null ? "—" : <bdi dir="ltr">{Number(v).toLocaleString("en-US")}</bdi>);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CompareArrowsIcon color="primary" />
          <span>{t("billing@compare.title")}</span>
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block">
          {providerName ?? data?.providerName ?? `#${providerId}`} · {t(`billing@providerType.${providerType}`)}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">{t("billing@compare.subtitle", { days: data?.days ?? 90 })}</Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField select fullWidth size="small" label={t("billing@compare.plan")} value={planId}
              onChange={(e) => {
                const v = e.target.value as unknown as number | "";
                setPlanId(v === "" ? "" : Number(v));
                setOptionId("");
              }}
              SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}>
              <MenuItem value=""><em>{t("billing@compare.planDefault")}</em></MenuItem>
              {loyaltyPlans.map((p) => (
                <MenuItem key={p.id} value={p.id}>{isAr ? p.nameAr : p.nameEn}</MenuItem>
              ))}
            </TextField>
            <TextField select fullWidth size="small" label={t("billing@compare.option")} value={optionId} disabled={!plan}
              onChange={(e) => {
                const v = e.target.value as unknown as number | "";
                setOptionId(v === "" ? "" : Number(v));
              }}
              SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}>
              <MenuItem value=""><em>{t("billing@compare.optionDefault")}</em></MenuItem>
              {options.map((o) => (
                <MenuItem key={o.id} value={o.id}>{optionLabel(o, t, "Loyalty")}</MenuItem>
              ))}
            </TextField>
          </Stack>

          {isFetching && !isLoading && <LinearProgress sx={{ borderRadius: 1 }} />}

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
          ) : error || !data ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{apiErrorMessage(error, t("billing@compare.loadError"))}</Alert>
          ) : (
            <>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="caption" color="text.secondary">
                  {t("billing@compare.period", { from: formatShortDate(data.fromUtc, lang), to: formatShortDate(data.toUtc, lang) })}
                </Typography>
                <Typography variant="caption" color="text.secondary">·</Typography>
                <Typography variant="caption" color="text.secondary">{t("billing@compare.currentModel")}</Typography>
                <Chip size="small" variant="outlined"
                  label={t(`billing@bundle.${data.currentBillingModel === "bundle" ? "bundle" : "percentage"}`)} />
              </Stack>

              {noData ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>{recommendationText(data, t)}</Alert>
              ) : (
                <>
                  <Alert
                    severity={data.recommendation.code === "bundleLosesForCable" ? "warning" : "success"}
                    icon={<ThumbUpAltOutlinedIcon />}
                    sx={{ borderRadius: 2, "& .MuiAlert-message": { fontWeight: 600 } }}
                  >
                    {recommendationText(data, t)}
                  </Alert>

                  <Paper variant="outlined" sx={{ borderRadius: 2, overflowX: "auto" }}>
                    <Table size="small" aria-label={t("billing@compare.title")}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, color: "text.secondary", verticalAlign: "bottom" }}>{t("billing@compare.metric")}</TableCell>
                          {colHead("percentage", t("billing@compare.percentageCol"),
                            t("billing@compare.rows.commissionAt", { percent: data.percentage.commissionPercent }))}
                          {colHead("bundle", t("billing@compare.bundleCol"),
                            <>
                              <bdi>{data.bundle.planName}</bdi>
                              <br />
                              <bdi>{optionLabel({ months: data.bundle.months, scans: data.bundle.scans, priceJod: data.bundle.priceJod, isUnlimited: data.bundle.scans == null }, t, "Loyalty")}</bdi>
                            </>)}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>{t("billing@compare.rows.transactions")}</TableCell>
                          {cell("percentage", num(data.percentage.transactions))}
                          {cell("bundle", num(data.bundle.scansUsed), t("billing@compare.rows.scansUsed"))}
                        </TableRow>
                        <TableRow>
                          <TableCell>{t("billing@compare.rows.totalAmount")}</TableCell>
                          {cell("percentage", money(data.percentage.totalAmountJod),
                            t("billing@compare.rows.averageAmount") + ": " + fmtJod(data.percentage.averageAmountJod))}
                          {cell("bundle", "—", `${t("billing@compare.rows.minimum")}: ${fmtJod(data.bundle.minimumAmountJod)}`)}
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>{t("billing@compare.rows.partnerPays")}</TableCell>
                          {cell("percentage", money(data.percentage.commissionJod, { strong: true }))}
                          {cell("bundle", money(data.bundle.costJod, { strong: true }),
                            <bdi dir="ltr">{t("billing@compare.rows.bundlesNeeded", { count: data.bundle.bundlesNeeded, price: jod3(data.bundle.priceJod) })}</bdi>)}
                        </TableRow>
                        <TableRow>
                          <TableCell>{t("billing@compare.rows.perScan")}</TableCell>
                          {cell("percentage", money(perScan(data.percentage.commissionJod, data.percentage.transactions)))}
                          {cell("bundle", money(data.bundle.effectivePricePerScanJod),
                            data.bundle.pricePerScanJod != null ? t("billing@compare.rows.listPerScan", { price: jod3(data.bundle.pricePerScanJod) }) : undefined)}
                        </TableRow>
                        <TableRow>
                          <TableCell>{t("billing@compare.rows.points")}</TableCell>
                          {cell("percentage", num(data.percentage.points))}
                          {cell("bundle", num(data.bundle.points))}
                        </TableRow>
                        <TableRow>
                          <TableCell>{t("billing@compare.rows.pointsCost")}</TableCell>
                          {cell("percentage", money(data.percentage.pointsCostJod))}
                          {cell("bundle", money(data.bundle.pointsCostJod))}
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>{t("billing@compare.rows.margin")}</TableCell>
                          {cell("percentage", money(data.percentage.cableMarginJod, { strong: true, signed: true }))}
                          {cell("bundle", money(data.bundle.cableMarginJod, { strong: true, signed: true }))}
                        </TableRow>
                        <TableRow>
                          <TableCell>{t("billing@compare.rows.marginPerScan")}</TableCell>
                          {cell("percentage", money(perScan(data.percentage.cableMarginJod, data.percentage.transactions), { signed: true }))}
                          {cell("bundle", money(perScan(data.bundle.cableMarginJod, data.bundle.scansUsed), { signed: true }))}
                        </TableRow>
                        <TableRow>
                          <TableCell>{t("billing@compare.rows.leftOver")}</TableCell>
                          {cell("percentage", "—")}
                          {cell("bundle", data.bundle.scans == null ? t("billing@compare.rows.unlimited") : num(data.bundle.scansLeftOver))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Paper>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">{t("billing@compare.partnerSaving")}</Typography>
                      <Typography variant="h6" fontWeight={800} color={data.recommendation.partnerSavingJod < 0 ? "error.main" : "success.main"}>
                        <bdi dir="ltr">{fmtJod(data.recommendation.partnerSavingJod)}</bdi>
                      </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">{t("billing@compare.marginDifference")}</Typography>
                      <Typography variant="h6" fontWeight={800} color={data.recommendation.cableMarginDifferenceJod < 0 ? "error.main" : "success.main"}>
                        <bdi dir="ltr">{fmtJod(data.recommendation.cableMarginDifferenceJod)}</bdi>
                      </Typography>
                    </Paper>
                  </Stack>

                  {data.bundle.belowMinimumTransactions > 0 && (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      {t("billing@compare.belowMinimum", { count: data.bundle.belowMinimumTransactions, min: jod3(data.bundle.minimumAmountJod) })}
                    </Alert>
                  )}
                  {data.percentage.simulatedTransactions > 0 && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      {t("billing@compare.simulated", { count: data.percentage.simulatedTransactions })}
                    </Alert>
                  )}
                </>
              )}

              <Typography variant="caption" color="text.secondary">
                {t("billing@compare.footnote", { value: data.pointValueJod })}
              </Typography>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>{t("close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
