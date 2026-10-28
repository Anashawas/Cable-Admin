import { useEffect, useState } from "react";
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
  Divider,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import SaveIcon from "@mui/icons-material/Save";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { DecimalField } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import { formatShortDate } from "../../../utils/date-format";
import { apiErrorMessage, fmtJod } from "../../../utils/api-error";
import { useAgreementBundles, useSetBillingModel } from "../hooks/use-billing";
import type { BillingModel, BillingProviderType } from "../types/api";
import BreakEvenMeter from "./BreakEvenMeter";
import PlanStatusChip from "./PlanStatusChip";
import SellBundleDialog from "./SellBundleDialog";

export interface AgreementRef {
  id: number;
  providerType: BillingProviderType;
  providerId: number;
  providerName?: string | null;
}

const BUNDLE_STATE_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  active: "success",
  low: "warning",
  exhausted: "error",
  expired: "default",
};

/**
 * The loyalty billing of one partner agreement: the model switch (percentage |
 * bundle), the current bundle, "sell a bundle" with the margin check, and the
 * bundle history with a break-even meter for every bundle that is on.
 */
export default function AgreementBillingDialog({ agreement, onClose }: { agreement: AgreementRef | null; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isAr = lang.startsWith("ar");
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data, isLoading, error } = useAgreementBundles(agreement?.id ?? null, !!agreement);
  const setModel = useSetBillingModel();
  const [model, setModelState] = useState<BillingModel>("percentage");
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [sellOpen, setSellOpen] = useState(false);
  const [openCodes, setOpenCodes] = useState<number | null>(null);

  useEffect(() => {
    if (!data) return;
    setModelState(data.billingModel);
    setMinAmount(data.minimumTransactionAmount ?? null);
  }, [data]);

  useEffect(() => {
    if (agreement) setOpenCodes(null);
  }, [agreement]);

  if (!agreement) return null;

  const modelDirty = !!data && (model !== data.billingModel || (minAmount ?? null) !== (data.minimumTransactionAmount ?? null));
  const current = data?.current;

  const saveModel = () =>
    setModel.mutate(
      { agreementId: agreement.id, billingModel: model, minimumTransactionAmount: minAmount },
      {
        onSuccess: (res) => {
          setOpenCodes(res.openPercentageCodes);
          openSuccessSnackbar({ message: t("billing@bundle.modelSaved") });
        },
        onError: (err) => openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) }),
      }
    );

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <QrCodeScannerIcon color="primary" />
          <span>{t("billing@bundle.title")}</span>
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block">
          {agreement.providerName ?? `#${agreement.providerId}`} · {t(`billing@providerType.${agreement.providerType}`)}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
        ) : error || !data ? (
          <Alert severity="error">{apiErrorMessage(error, t("loadingFailed"))}</Alert>
        ) : (
          <Stack spacing={2.5}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={800}>{t("billing@bundle.model")}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>{t("billing@bundle.modelHint")}</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <ToggleButtonGroup exclusive size="small" value={model} onChange={(_, v) => v && setModelState(v as BillingModel)}>
                  <ToggleButton value="percentage">{t("billing@bundle.percentage")}</ToggleButton>
                  <ToggleButton value="bundle">{t("billing@bundle.bundle")}</ToggleButton>
                </ToggleButtonGroup>
                {model === "bundle" && (
                  <DecimalField size="small" label={t("billing@bundle.minAmount")} value={minAmount} onValueChange={(n) => setMinAmount(n)}
                    helperText={t("billing@bundle.minAmountHint")} sx={{ maxWidth: 220 }}
                    InputProps={{ endAdornment: <InputAdornment position="end">JOD</InputAdornment> }} />
                )}
                <Box sx={{ flex: 1 }} />
                <Button variant="contained" startIcon={setModel.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  disabled={!modelDirty || setModel.isPending} onClick={saveModel}>
                  {t("save")}
                </Button>
              </Stack>
              {model !== data.billingModel && (
                <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
                  {model === "bundle" ? t("billing@bundle.switchToBundle") : t("billing@bundle.switchToPercentage")}
                </Alert>
              )}
              {openCodes != null && openCodes > 0 && (
                <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>{t("billing@bundle.openCodes", { count: openCodes })}</Alert>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ flex: 1 }}>{t("billing@bundle.current")}</Typography>
                <Button variant="contained" color="secondary" startIcon={<ShoppingCartCheckoutIcon />} onClick={() => setSellOpen(true)}>
                  {t("billing@bundle.sell")}
                </Button>
              </Stack>
              {!current ? (
                <Typography variant="body2" color="text.secondary">{t("billing@bundle.noBundle")}</Typography>
              ) : (
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="body1" fontWeight={800}>{current.planName}</Typography>
                    <Chip size="small" color={BUNDLE_STATE_COLOR[current.state] ?? "default"} label={t(`billing@bundle.state.${current.state}`, { defaultValue: current.state })} />
                    {current.isTrial && <Chip size="small" color="info" variant="outlined" label={t("billing@records.trial")} />}
                  </Stack>
                  {current.isUnlimited ? (
                    <Typography variant="body2">{t("billing@records.scansUnlimited", { used: current.scansUsed })}</Typography>
                  ) : (
                    <>
                      <Typography variant="body2">
                        {t("billing@bundle.remaining", { left: current.scansRemaining ?? 0, total: current.scansTotal ?? 0 })}
                      </Typography>
                      <LinearProgress variant="determinate" value={current.percentRemaining ?? 0}
                        color={BUNDLE_STATE_COLOR[current.state] === "error" ? "error" : BUNDLE_STATE_COLOR[current.state] === "warning" ? "warning" : "primary"}
                        sx={{ height: 8, borderRadius: 4 }} />
                    </>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {formatShortDate(current.startsAt, lang)} → {current.endsAt ? formatShortDate(current.endsAt, lang) : t("billing@records.noEnd")}
                  </Typography>
                  {!current.isTrial && <BreakEvenMeter planSubscriptionId={current.planSubscriptionId} />}
                </Stack>
              )}
            </Paper>

            <Box>
              <Typography variant="subtitle1" fontWeight={800} gutterBottom>{t("billing@bundle.history")}</Typography>
              {data.history.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t("billing@bundle.noHistory")}</Typography>
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("billing@records.plan")}</TableCell>
                        <TableCell>{t("billing@records.status")}</TableCell>
                        <TableCell>{t("billing@records.scans")}</TableCell>
                        <TableCell>{t("billing@records.period")}</TableCell>
                        <TableCell align="right">{t("billing@records.paidCol")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.history.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{isAr ? r.planNameAr : r.planNameEn}</Typography>
                            <Typography variant="caption" color="text.secondary">#{r.id}{r.isTrial ? ` · ${t("billing@records.trial")}` : ""}</Typography>
                          </TableCell>
                          <TableCell><PlanStatusChip status={r.status} /></TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {r.scansIncluded != null
                                ? t("billing@records.scansOf", { used: r.scansUsed, total: r.scansIncluded })
                                : t("billing@records.scansUnlimited", { used: r.scansUsed })}
                            </Typography>
                            {r.isOn && !r.isTrial && <BreakEvenMeter planSubscriptionId={r.id} compact />}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {formatShortDate(r.startsAt, lang)} → {r.endsAt ? formatShortDate(r.endsAt, lang) : t("billing@records.noEnd")}
                          </TableCell>
                          <TableCell align="right">{fmtJod(r.pricePaidJod)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
            <Divider />
            <Typography variant="caption" color="text.secondary">{t("billing@bundle.internalNote")}</Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>{t("close")}</Button>
      </DialogActions>

      <SellBundleDialog
        open={sellOpen}
        onClose={() => setSellOpen(false)}
        agreementId={agreement.id}
        providerType={agreement.providerType}
        providerId={agreement.providerId}
        providerName={agreement.providerName}
        billingModel={data?.billingModel}
      />
    </Dialog>
  );
}
