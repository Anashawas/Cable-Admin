import { useState } from "react";
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
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ScienceIcon from "@mui/icons-material/Science";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import CancelIcon from "@mui/icons-material/Cancel";
import DownloadIcon from "@mui/icons-material/Download";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { useSnackbarStore } from "../../../stores";
import { formatShortDate } from "../../../utils/date-format";
import { apiErrorMessage, fmtJod, saveBlob } from "../../../utils/api-error";
import { downloadReceipt } from "../../subscriptions/services/subscriptions-service";
import { useCancelPlanSubscription, usePlanSubscriptions } from "../hooks/use-billing";
import type { BillingProviderType, PlanSubscriptionDto } from "../types/api";
import BreakEvenMeter from "./BreakEvenMeter";
import PlanStatusChip from "./PlanStatusChip";
import PlanSubscriptionDialog, { type PlanSubscriptionDialogMode } from "./PlanSubscriptionDialog";

const ENDED = ["Cancelled", "Upgraded", "Renewed", "Expired"];

interface PlanSubscriptionsPanelProps {
  providerType: BillingProviderType;
  providerId: number;
  providerName?: string | null;
  ownerUserAccountId?: number | null;
  ownerName?: string | null;
  enabled?: boolean;
}

/**
 * Partner / provider profile → every subscription record (purchase, renewal,
 * trial, bundle) with New subscription / Trial / Upgrade / Cancel.
 */
export default function PlanSubscriptionsPanel({
  providerType,
  providerId,
  providerName,
  ownerUserAccountId,
  ownerName,
  enabled = true,
}: PlanSubscriptionsPanelProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isAr = lang.startsWith("ar");
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data: records = [], isLoading, error } = usePlanSubscriptions(providerType, providerId, enabled);
  const cancel = useCancelPlanSubscription();

  const [dialog, setDialog] = useState<{ mode: PlanSubscriptionDialogMode; record?: PlanSubscriptionDto } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PlanSubscriptionDto | null>(null);
  const [reason, setReason] = useState("");
  const [downloading, setDownloading] = useState<number | null>(null);

  const handleReceipt = async (r: PlanSubscriptionDto) => {
    if (!r.paymentId) return;
    setDownloading(r.id);
    try {
      saveBlob(await downloadReceipt(r.paymentId), `${r.paymentReferenceNo ?? `receipt-${r.paymentId}`}.pdf`);
    } catch (err) {
      openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) });
    } finally {
      setDownloading(null);
    }
  };

  const handleCancel = () => {
    if (!cancelTarget || !reason.trim()) return;
    cancel.mutate(
      { id: cancelTarget.id, reason: reason.trim() },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("billing@records.cancelled") });
          setCancelTarget(null);
        },
        onError: (err) => openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) }),
      }
    );
  };

  const period = (r: PlanSubscriptionDto) =>
    `${formatShortDate(r.startsAt, lang)} → ${r.endsAt ? formatShortDate(r.endsAt, lang) : t("billing@records.noEnd")}`;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
          <WorkspacePremiumIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={800}>{t("billing@records.title.panel")}</Typography>
        </Stack>
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ mode: "new" })}>
          {t("billing@records.new")}
        </Button>
        <Button size="small" variant="outlined" startIcon={<ScienceIcon />} onClick={() => setDialog({ mode: "trial" })}>
          {t("billing@records.trialAction")}
        </Button>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>
      ) : error ? (
        <Alert severity="error">{apiErrorMessage(error, t("loadingFailed"))}</Alert>
      ) : records.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>{t("billing@records.empty")}</Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("billing@records.plan")}</TableCell>
                <TableCell>{t("billing@records.status")}</TableCell>
                <TableCell>{t("billing@records.period")}</TableCell>
                <TableCell>{t("billing@records.scans")}</TableCell>
                <TableCell align="right">{t("billing@records.paidCol")}</TableCell>
                <TableCell align="right">{t("actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((r) => {
                const ended = ENDED.includes(r.status);
                return (
                  <TableRow key={r.id} sx={{ opacity: ended ? 0.7 : 1 }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{isAr ? r.planNameAr : r.planNameEn}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t(`billing@category.${r.planCategory}`)} · {t(`billing@source.${r.source}`, { defaultValue: r.source })} · #{r.id}
                      </Typography>
                      {r.cancelReason && (
                        <Typography variant="caption" color="error" display="block">{r.cancelReason}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                        <PlanStatusChip status={r.status} />
                        {r.isTrial && <Chip size="small" color="info" variant="outlined" label={t("billing@records.trial")} />}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography variant="body2">{period(r)}</Typography>
                      {r.graceEndsAt && (
                        <Typography variant="caption" color="warning.main">{t("billing@records.graceEnds", { date: formatShortDate(r.graceEndsAt, lang) })}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.planCategory === "Loyalty" ? (
                        <Stack spacing={0.5}>
                          <Typography variant="body2">
                            {r.scansIncluded != null
                              ? t("billing@records.scansOf", { used: r.scansUsed, total: r.scansIncluded })
                              : t("billing@records.scansUnlimited", { used: r.scansUsed })}
                          </Typography>
                          {r.scansCarriedOver > 0 && (
                            <Typography variant="caption" color="text.secondary">{t("billing@records.carried", { count: r.scansCarriedOver })}</Typography>
                          )}
                          {r.isOn && !r.isTrial && <BreakEvenMeter planSubscriptionId={r.id} compact />}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Typography variant="body2" fontWeight={700}>{fmtJod(r.pricePaidJod)}</Typography>
                      {r.creditAppliedJod > 0 && (
                        <Typography variant="caption" color="success.main" display="block">{t("billing@records.credit", { amount: fmtJod(r.creditAppliedJod) })}</Typography>
                      )}
                      {r.paymentReferenceNo && <Typography variant="caption" color="text.secondary">{r.paymentReferenceNo}</Typography>}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {r.paymentId && (
                        <Tooltip title={t("subscriptions@downloadReceipt")}>
                          <span>
                            <IconButton size="small" onClick={() => handleReceipt(r)} disabled={downloading === r.id}>
                              {downloading === r.id ? <CircularProgress size={16} /> : <DownloadIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {r.isOn && !ended && (
                        <Tooltip title={t("billing@records.upgrade")}>
                          <IconButton size="small" color="primary" onClick={() => setDialog({ mode: "upgrade", record: r })}>
                            <UpgradeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!ended && (
                        <Tooltip title={t("billing@records.cancel")}>
                          <IconButton size="small" color="error" onClick={() => {
                            setReason("");
                            setCancelTarget(r);
                          }}>
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      <PlanSubscriptionDialog
        open={!!dialog}
        mode={dialog?.mode ?? "new"}
        fromRecord={dialog?.record ?? null}
        onClose={() => setDialog(null)}
        providerType={providerType}
        providerId={providerId}
        providerName={providerName}
        ownerUserAccountId={ownerUserAccountId}
        ownerName={ownerName}
      />

      <Dialog open={!!cancelTarget} onClose={() => !cancel.isPending && setCancelTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t("billing@records.cancelTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>{t("billing@records.cancelHint")}</Typography>
          <TextField autoFocus fullWidth multiline minRows={2} required label={t("billing@records.reason")} value={reason}
            onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setCancelTarget(null)} disabled={cancel.isPending}>{t("close")}</Button>
          <Button variant="contained" color="error" onClick={handleCancel} disabled={cancel.isPending || !reason.trim()}
            startIcon={cancel.isPending ? <CircularProgress size={18} color="inherit" /> : <CancelIcon />}>
            {t("billing@records.cancel")}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
