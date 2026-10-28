import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import {
  Alert,
  Box,
  Grid,
  InputAdornment,
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorIcon from "@mui/icons-material/Error";
import { DecimalField } from "../../../components";
import { apiErrorMessage, fmtJod } from "../../../utils/api-error";
import { marginCheck } from "../services/billing-service";
import type { AmountMixEntry, BillingProviderType, MarginCheckRequest, PointsRule } from "../types/api";
import { marginVerdict, validatePointsRule, type MarginVerdict } from "../utils/plan-rules";

export interface MarginOption {
  months: number | null;
  priceJod: number | null;
  scans: number | null;
  unlimited: boolean;
}

interface MarginCalculatorProps {
  pointsRule: PointsRule | null | undefined;
  options: MarginOption[];
  targetMarginPercent?: number | null;
  /** Enables "this provider's last 90 days" as the amount mix. */
  provider?: { type: BillingProviderType; id: number } | null;
  /** Pre-selects an option (index into `options`). */
  selectedIndex?: number;
  /** Hides the option picker (the caller already chose one). */
  hideOptionPicker?: boolean;
  /** Reports the verdict up (e.g. to warn before selling a bundle). */
  onVerdict?: (verdict: MarginVerdict | null) => void;
}

type MixMode = "equal" | "manual" | "provider";

const VERDICT_ICON: Record<MarginVerdict, React.ReactElement> = {
  ok: <CheckCircleIcon />,
  warning: <WarningAmberIcon />,
  loss: <ErrorIcon />,
};

/**
 * Break-even and recommended scans for a loyalty price option (§2b.4b, points
 * cost only). Calls POST /api/admin/plans/margin-check as the inputs change.
 */
export default function MarginCalculator({
  pointsRule,
  options,
  targetMarginPercent,
  provider,
  selectedIndex,
  hideOptionPicker,
  onVerdict,
}: MarginCalculatorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [index, setIndex] = useState(selectedIndex ?? 0);
  const [mixMode, setMixMode] = useState<MixMode>(provider ? "provider" : "equal");
  const [mix, setMix] = useState<AmountMixEntry[]>([]);
  const [expectedMonthly, setExpectedMonthly] = useState<number | null>(null);
  const [target, setTarget] = useState<number | null>(targetMarginPercent ?? 20);

  useEffect(() => {
    if (selectedIndex != null) setIndex(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    if (targetMarginPercent != null) setTarget(targetMarginPercent);
  }, [targetMarginPercent]);

  // A manual mix row per tier, spread evenly to start with.
  const tierStarts = useMemo(
    () => (pointsRule?.mode === "Tiered" ? (pointsRule.tiers ?? []).map((x) => x.fromJod) : []),
    [pointsRule]
  );
  useEffect(() => {
    if (tierStarts.length === 0) return;
    setMix((prev) => {
      if (prev.length === tierStarts.length && prev.every((m, i) => m.fromJod === tierStarts[i])) return prev;
      const even = Math.floor(100 / tierStarts.length);
      return tierStarts.map((fromJod, i) => ({ fromJod, percent: i === 0 ? 100 - even * (tierStarts.length - 1) : even }));
    });
  }, [tierStarts]);

  const option = options[Math.min(index, Math.max(0, options.length - 1))];
  const ruleValid = !validatePointsRule(pointsRule);
  const mixTotal = mix.reduce((s, m) => s + (m.percent || 0), 0);

  const request = useMemo<MarginCheckRequest | null>(() => {
    if (!option || !pointsRule || !ruleValid || option.priceJod == null || option.priceJod <= 0) return null;
    const body: MarginCheckRequest = {
      priceJod: option.priceJod,
      scans: option.unlimited ? null : option.scans,
      months: option.months,
      pointsRule,
      targetMarginPercent: target,
      expectedMonthlyScans: option.unlimited ? expectedMonthly : null,
    };
    if (pointsRule.mode === "Tiered") {
      if (mixMode === "manual") body.amountMix = mix;
      if (mixMode === "provider" && provider) {
        body.providerId = provider.id;
        body.providerType = provider.type;
      }
    }
    return body;
  }, [option, pointsRule, ruleValid, target, expectedMonthly, mixMode, mix, provider]);

  const [debounced] = useDebounce(request, 400);
  const { data: result, error, isFetching } = useQuery({
    queryKey: ["billing", "margin-check", debounced],
    queryFn: ({ signal }) => marginCheck(debounced as MarginCheckRequest, signal),
    enabled: debounced != null && (mixMode !== "manual" || Math.round(mixTotal) === 100),
    staleTime: 60 * 1000,
    retry: false,
  });

  const verdict = request ? marginVerdict(result, option?.unlimited ? null : option?.scans) : null;
  useEffect(() => {
    onVerdict?.(verdict);
  }, [verdict, onVerdict]);

  const color =
    verdict === "loss" ? theme.palette.error.main : verdict === "warning" ? theme.palette.warning.main : theme.palette.success.main;

  if (options.length === 0) return <Alert severity="info">{t("billing@margin.noOptions")}</Alert>;

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        {!hideOptionPicker && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField select fullWidth size="small" label={t("billing@margin.option")} value={index} onChange={(e) => setIndex(Number(e.target.value))}>
              {options.map((o, i) => (
                <MenuItem key={i} value={i}>
                  {[
                    o.months != null ? t("billing@option.months", { count: o.months }) : null,
                    o.unlimited ? t("billing@option.unlimited") : o.scans != null ? t("billing@option.scans", { count: o.scans }) : null,
                    o.priceJod != null ? fmtJod(o.priceJod) : null,
                  ].filter(Boolean).join(" · ")}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <DecimalField fullWidth size="small" label={t("billing@margin.target")} value={target} onValueChange={(n) => setTarget(n)}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
        </Grid>
        {option?.unlimited && (
          <Grid size={{ xs: 6, sm: 3, md: 3 }}>
            <TextField fullWidth size="small" type="number" label={t("billing@margin.expectedMonthly")} value={expectedMonthly ?? ""}
              onChange={(e) => setExpectedMonthly(e.target.value === "" ? null : Math.trunc(Number(e.target.value)))} />
          </Grid>
        )}
        {pointsRule?.mode === "Tiered" && (
          <Grid size={{ xs: 12, md: 4 }}>
            <ToggleButtonGroup exclusive size="small" value={mixMode} onChange={(_, v) => v && setMixMode(v as MixMode)}>
              <ToggleButton value="equal">{t("billing@margin.mix.equal")}</ToggleButton>
              <ToggleButton value="manual">{t("billing@margin.mix.manual")}</ToggleButton>
              {provider && <ToggleButton value="provider">{t("billing@margin.mix.provider")}</ToggleButton>}
            </ToggleButtonGroup>
          </Grid>
        )}
      </Grid>

      {pointsRule?.mode === "Tiered" && mixMode === "manual" && (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ maxWidth: 420 }}>
            <TableHead>
              <TableRow>
                <TableCell>{t("billing@margin.tierFrom")}</TableCell>
                <TableCell>{t("billing@margin.share")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mix.map((m, i) => (
                <TableRow key={m.fromJod}>
                  <TableCell>{fmtJod(m.fromJod)}</TableCell>
                  <TableCell>
                    <DecimalField size="small" value={m.percent}
                      onValueChange={(n) => setMix(mix.map((x, j) => (j === i ? { ...x, percent: n ?? 0 } : x)))}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {Math.round(mixTotal) !== 100 && (
            <Typography variant="caption" color="error">{t("billing@margin.mixTotal", { total: mixTotal })}</Typography>
          )}
        </Box>
      )}

      {!ruleValid ? (
        <Alert severity="warning">{t("billing@margin.fixRule")}</Alert>
      ) : !request ? (
        <Alert severity="info">{t("billing@margin.enterPrice")}</Alert>
      ) : error ? (
        <Alert severity="error">{apiErrorMessage(error, t("loadingFailed"))}</Alert>
      ) : (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: result ? color : undefined, bgcolor: result ? alpha(color, 0.05) : undefined }}>
          {isFetching && <LinearProgress sx={{ mb: 1 }} />}
          {result && (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color }}>
                {verdict && VERDICT_ICON[verdict]}
                <Typography variant="subtitle1" fontWeight={800}>
                  {verdict ? t(`billing@margin.verdict.${verdict}`) : ""}
                </Typography>
              </Stack>
              <Typography variant="body2">
                {t("billing@margin.costLine", {
                  cost: result.costPerScanJod.toFixed(3),
                  price: result.pricePerScanJod != null ? result.pricePerScanJod.toFixed(3) : "—",
                })}
              </Typography>
              <Grid container spacing={1.5}>
                {[
                  { label: t("billing@margin.avgPoints"), value: Math.round(result.avgPointsPerScan).toLocaleString("en-US") },
                  { label: t("billing@margin.breakEven"), value: result.breakEvenScans ?? "—" },
                  { label: t("billing@margin.recommended"), value: result.recommendedScans ?? "—" },
                  ...(option?.unlimited
                    ? [
                        { label: t("billing@margin.breakEvenMonthly"), value: result.breakEvenScansPerMonth ?? "—" },
                        { label: t("billing@margin.suggestedCap"), value: result.suggestedDailySoftCap ?? "—" },
                      ]
                    : [{ label: t("billing@margin.aboveBreakEven"), value: result.scansAboveBreakEven ?? "—" }]),
                ].map((k) => (
                  <Grid key={k.label} size={{ xs: 6, sm: 4, md: 2.4 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">{k.label}</Typography>
                    <Typography variant="h6" fontWeight={800}>{k.value}</Typography>
                  </Grid>
                ))}
              </Grid>
              {verdict === "loss" && result.breakEvenScans != null && !option?.unlimited && (
                <Typography variant="body2" color="error" fontWeight={700}>
                  {t("billing@margin.lossLine", { n: result.breakEvenScans })}
                </Typography>
              )}
              {result.warning && <Typography variant="body2" color="error">{result.warning}</Typography>}
              <Typography variant="caption" color="text.secondary">
                {t("billing@margin.footnote", { source: t(`billing@margin.source.${result.mixSource}`), value: result.pointValueJod })}
              </Typography>
            </Stack>
          )}
        </Paper>
      )}
    </Stack>
  );
}
