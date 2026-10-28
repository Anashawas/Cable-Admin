import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { DecimalField } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import { apiErrorMessage } from "../../../utils/api-error";
import PayerPicker from "../../subscriptions/components/PayerPicker";
import { PAYMENT_METHOD, type PayerRef, type PaymentMethod } from "../../subscriptions/types/api";
import { useCreatePlanSubscription, usePlans, useUpgradePlanSubscription } from "../hooks/use-billing";
import type { AdminPaymentInput, BillingProviderType, PlanSubscriptionDto } from "../types/api";
import { optionLabel } from "../utils/plan-rules";

export type PlanSubscriptionDialogMode = "new" | "trial" | "upgrade";

interface PlanSubscriptionDialogProps {
  open: boolean;
  mode: PlanSubscriptionDialogMode;
  onClose: () => void;
  providerType: BillingProviderType;
  providerId: number;
  providerName?: string | null;
  ownerUserAccountId?: number | null;
  ownerName?: string | null;
  /** Upgrade: the record being upgraded. */
  fromRecord?: PlanSubscriptionDto | null;
  initialPlanId?: number | null;
  initialPriceOptionId?: number | null;
  /** Fulfils this partner request on success. */
  upgradeRequestId?: number | null;
}

/**
 * New subscription, trial or upgrade for one station / provider
 * (POST /api/admin/subscriptions and /{id}/upgrade). A subscription plan can be
 * paid (recorded through the existing payment engine with its receipt) or
 * complimentary; a loyalty plan is always debited from the provider wallet.
 */
export default function PlanSubscriptionDialog({
  open,
  mode,
  onClose,
  providerType,
  providerId,
  providerName,
  ownerUserAccountId,
  ownerName,
  fromRecord,
  initialPlanId,
  initialPriceOptionId,
  upgradeRequestId,
}: PlanSubscriptionDialogProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith("ar");
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const { data: plans = [] } = usePlans(false);
  const create = useCreatePlanSubscription();
  const upgrade = useUpgradePlanSubscription();

  const [planId, setPlanId] = useState<number | "">("");
  const [optionId, setOptionId] = useState<number | "">("");
  const [startsAt, setStartsAt] = useState("");
  const [paid, setPaid] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>(PAYMENT_METHOD.CliQ);
  const [amount, setAmount] = useState<number | null>(null);
  const [paidDate, setPaidDate] = useState("");
  const [payer, setPayer] = useState<PayerRef | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setPlanId(initialPlanId ?? "");
    setOptionId(initialPriceOptionId ?? "");
    setStartsAt("");
    setPaid(mode !== "trial");
    setMethod(PAYMENT_METHOD.CliQ);
    setAmount(null);
    setPaidDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setPayer(ownerUserAccountId ? { userAccountId: ownerUserAccountId, hasWhatsApp: true } : null);
    setNote("");
  }, [open, mode, initialPlanId, initialPriceOptionId, ownerUserAccountId]);

  const choices = useMemo(
    () =>
      plans.filter((p) => {
        if (!p.isActive || p.key === "free" || !p.appliesTo.includes(providerType)) return false;
        if (mode === "trial") return p.trialDays > 0 || p.trialScans > 0;
        if (mode === "upgrade") return !!fromRecord && p.category === fromRecord.planCategory && p.id !== fromRecord.planId;
        return true;
      }),
    [plans, providerType, mode, fromRecord]
  );
  const plan = choices.find((p) => p.id === planId);
  const options = (plan?.priceOptions ?? []).filter((o) => o.isActive);
  const option = options.find((o) => o.id === optionId);
  const loyalty = plan?.category === "Loyalty";
  const takesPayment = mode !== "trial" && !loyalty;

  // A single option is picked for the admin.
  useEffect(() => {
    if (plan && options.length === 1 && optionId === "") setOptionId(options[0].id);
  }, [plan, options, optionId]);

  const canSubmit =
    !!plan && (mode === "trial" || !!option) && (!takesPayment || !paid || (!!payer && !!paidDate));

  const handleSubmit = () => {
    if (!plan || !canSubmit) return;
    const payment: AdminPaymentInput | null =
      takesPayment && paid && payer
        ? { amount, method, paidDate: `${paidDate}:00`, payer, note: note.trim() || null }
        : null;
    const callbacks = {
      onSuccess: () => {
        openSuccessSnackbar({ message: t(`billing@records.done.${mode}`) });
        onClose();
      },
      onError: (err: unknown) => openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) }),
    };
    if (mode === "upgrade" && fromRecord) {
      upgrade.mutate({ id: fromRecord.id, body: { planId: plan.id, priceOptionId: option!.id, payment, note: note.trim() || null } }, callbacks);
    } else {
      create.mutate(
        {
          providerType,
          providerId,
          planId: plan.id,
          priceOptionId: mode === "trial" ? null : option?.id ?? null,
          startsAt: mode === "new" && startsAt && !loyalty ? `${startsAt}T00:00:00` : null,
          payment,
          isTrial: mode === "trial",
          upgradeRequestId: upgradeRequestId ?? null,
          note: note.trim() || null,
        },
        callbacks
      );
    }
  };

  const busy = create.isPending || upgrade.isPending;

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {t(`billing@records.title.${mode}`)}
        <Typography variant="caption" color="text.secondary" display="block">{providerName ?? `#${providerId}`}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {mode === "upgrade" && fromRecord && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              {t("billing@records.upgradeHint", { plan: isAr ? fromRecord.planNameAr : fromRecord.planNameEn })}
            </Alert>
          )}
          <TextField select fullWidth size="small" label={t("billing@records.plan")} value={planId}
            onChange={(e) => {
              setPlanId(Number(e.target.value));
              setOptionId("");
            }}>
            {choices.length === 0 && <MenuItem disabled value="">{t("billing@records.noPlans")}</MenuItem>}
            {choices.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {isAr ? p.nameAr : p.nameEn} · {t(`billing@category.${p.category}`)}
              </MenuItem>
            ))}
          </TextField>

          {mode === "trial" && plan && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              {plan.trialScans > 0
                ? t("billing@records.trialScansHint", { days: plan.trialDays, scans: plan.trialScans })
                : t("billing@records.trialHint", { days: plan.trialDays })}
            </Alert>
          )}

          {mode !== "trial" && plan && (
            <TextField select fullWidth size="small" label={t("billing@records.option")} value={optionId}
              onChange={(e) => setOptionId(Number(e.target.value))}>
              {options.map((o) => (
                <MenuItem key={o.id} value={o.id}>{optionLabel(o, t)}</MenuItem>
              ))}
            </TextField>
          )}

          {mode === "new" && plan && !loyalty && (
            <TextField size="small" type="date" label={t("billing@records.startsAt")} value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)} InputLabelProps={{ shrink: true }} helperText={t("billing@records.startsAtHint")} />
          )}

          {loyalty && mode !== "trial" && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>{t("billing@records.walletDebit")}</Alert>
          )}

          {takesPayment && plan && (
            <>
              <Divider />
              <ToggleButtonGroup exclusive size="small" value={paid ? "paid" : "free"} onChange={(_, v) => v && setPaid(v === "paid")}>
                <ToggleButton value="paid">{t("billing@records.paid")}</ToggleButton>
                <ToggleButton value="free">{t("billing@records.complimentary")}</ToggleButton>
              </ToggleButtonGroup>
              {paid ? (
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <DecimalField fullWidth size="small" label={t("billing@records.amount")} value={amount} onValueChange={(n) => setAmount(n)}
                      helperText={option ? t("billing@records.amountHint", { price: option.priceJod.toFixed(3) }) : undefined}
                      InputProps={{ endAdornment: <InputAdornment position="end">JOD</InputAdornment> }} />
                    <TextField fullWidth size="small" type="datetime-local" label={t("billing@records.paidDate")} value={paidDate}
                      onChange={(e) => setPaidDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Stack>
                  <ToggleButtonGroup exclusive size="small" value={method} onChange={(_, v) => v && setMethod(v as PaymentMethod)}>
                    <ToggleButton value={PAYMENT_METHOD.CliQ}>{t("subscriptions@method.cliq")}</ToggleButton>
                    <ToggleButton value={PAYMENT_METHOD.Cash}>{t("subscriptions@method.cash")}</ToggleButton>
                  </ToggleButtonGroup>
                  <PayerPicker value={payer} onChange={setPayer} ownerUserAccountId={ownerUserAccountId} ownerName={ownerName} disabled={busy} />
                </Stack>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>{t("billing@records.complimentaryHint")}</Alert>
              )}
            </>
          )}

          <TextField fullWidth size="small" multiline minRows={2} label={t("billing@records.note")} value={note}
            onChange={(e) => setNote(e.target.value)} inputProps={{ maxLength: 500 }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button color="inherit" onClick={onClose} disabled={busy}>{t("cancel")}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={busy || !canSubmit}
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}>
          {t(`billing@records.submit.${mode}`)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
