import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import { useSnackbarStore } from "../../../stores";
import { apiErrorMessage } from "../../../utils/api-error";
import { usePlans, useSellBundle } from "../hooks/use-billing";
import type { BillingModel, BillingProviderType } from "../types/api";
import { optionLabel, type MarginVerdict } from "../utils/plan-rules";
import MarginCalculator from "./MarginCalculator";

interface SellBundleDialogProps {
  open: boolean;
  onClose: () => void;
  agreementId: number;
  providerType: BillingProviderType;
  providerId: number;
  providerName?: string | null;
  billingModel?: BillingModel | null;
  initialPlanId?: number | null;
  initialPriceOptionId?: number | null;
  upgradeRequestId?: number | null;
}

/**
 * "بيع حزمة": a loyalty plan sold on a partner agreement. The price is debited
 * from the provider wallet; renewing adds the previous bundle's leftover scans.
 * The margin check uses this provider's last 90 days of transactions.
 */
export default function SellBundleDialog({
  open,
  onClose,
  agreementId,
  providerType,
  providerId,
  providerName,
  billingModel,
  initialPlanId,
  initialPriceOptionId,
  upgradeRequestId,
}: SellBundleDialogProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith("ar");
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const { data: plans = [] } = usePlans(false);
  const sell = useSellBundle();

  const [planId, setPlanId] = useState<number | "">("");
  const [optionId, setOptionId] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [verdict, setVerdict] = useState<MarginVerdict | null>(null);
  const [acceptLoss, setAcceptLoss] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPlanId(initialPlanId ?? "");
    setOptionId(initialPriceOptionId ?? "");
    setNote("");
    setAcceptLoss(false);
  }, [open, initialPlanId, initialPriceOptionId]);

  const loyaltyPlans = useMemo(
    () => plans.filter((p) => p.category === "Loyalty" && p.isActive && p.appliesTo.includes(providerType)),
    [plans, providerType]
  );
  const plan = loyaltyPlans.find((p) => p.id === planId);
  const options = (plan?.priceOptions ?? []).filter((o) => o.isActive);
  const option = options.find((o) => o.id === optionId);

  useEffect(() => {
    if (plan && options.length === 1 && optionId === "") setOptionId(options[0].id);
  }, [plan, options, optionId]);

  const calcOptions = option
    ? [{ months: option.months ?? null, priceJod: option.priceJod, scans: option.scans ?? null, unlimited: option.isUnlimited }]
    : [];
  const canSubmit = !!plan && !!option && (verdict !== "loss" || acceptLoss);

  const handleSubmit = () => {
    if (!plan || !option) return;
    sell.mutate(
      { agreementId, planId: plan.id, priceOptionId: option.id, upgradeRequestId: upgradeRequestId ?? null, note: note.trim() || null },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("billing@bundle.sold") });
          onClose();
        },
        onError: (err) => openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) }),
      }
    );
  };

  return (
    <Dialog open={open} onClose={() => !sell.isPending && onClose()} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {t("billing@bundle.sellTitle")}
        <Typography variant="caption" color="text.secondary" display="block">{providerName ?? `#${providerId}`}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {billingModel === "percentage" && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>{t("billing@bundle.percentageWarning")}</Alert>
          )}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField select fullWidth size="small" label={t("billing@bundle.plan")} value={planId}
              onChange={(e) => {
                setPlanId(Number(e.target.value));
                setOptionId("");
              }}>
              {loyaltyPlans.length === 0 && <MenuItem disabled value="">{t("billing@records.noPlans")}</MenuItem>}
              {loyaltyPlans.map((p) => (
                <MenuItem key={p.id} value={p.id}>{isAr ? p.nameAr : p.nameEn}</MenuItem>
              ))}
            </TextField>
            <TextField select fullWidth size="small" label={t("billing@records.option")} value={optionId} disabled={!plan}
              onChange={(e) => setOptionId(Number(e.target.value))}>
              {options.map((o) => (
                <MenuItem key={o.id} value={o.id}>{optionLabel(o, t)}</MenuItem>
              ))}
            </TextField>
          </Stack>

          <Alert severity="info" sx={{ borderRadius: 2 }}>{t("billing@bundle.walletHint")}</Alert>

          {plan && option && (
            <>
              <Typography variant="subtitle2" fontWeight={800}>{t("billing@margin.title")}</Typography>
              <MarginCalculator
                pointsRule={plan.pointsRule}
                options={calcOptions}
                selectedIndex={0}
                hideOptionPicker
                targetMarginPercent={plan.targetMarginPercent}
                provider={{ type: providerType, id: providerId }}
                onVerdict={setVerdict}
              />
              {verdict === "loss" && (
                <FormControlLabel control={<Checkbox checked={acceptLoss} onChange={(e) => setAcceptLoss(e.target.checked)} />}
                  label={t("billing@bundle.acceptLoss")} />
              )}
            </>
          )}

          <TextField fullWidth size="small" multiline minRows={2} label={t("billing@records.note")} value={note}
            onChange={(e) => setNote(e.target.value)} inputProps={{ maxLength: 500 }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button color="inherit" onClick={onClose} disabled={sell.isPending}>{t("cancel")}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit || sell.isPending}
          startIcon={sell.isPending ? <CircularProgress size={18} color="inherit" /> : <ShoppingCartCheckoutIcon />}>
          {t("billing@bundle.sell")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
