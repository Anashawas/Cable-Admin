import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Skeleton,
  Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import HistoryIcon from "@mui/icons-material/History";
import PaymentsIcon from "@mui/icons-material/Payments";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { useSnackbarStore } from "../../../stores";
import { usePremiumHistory, useRecordPremiumPayment } from "../hooks/use-premium";
import type { ChargingPointDto } from "../types/api";

interface PremiumDialogProps {
  open: boolean;
  station: ChargingPointDto | null;
  onClose: () => void;
}

function fmtDate(v?: string | null): string {
  if (!v) return "—";
  return new Date(v).toLocaleDateString();
}

export default function PremiumDialog({ open, station, onClose }: PremiumDialogProps) {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const id = station?.id ?? null;
  const { data: history, isLoading } = usePremiumHistory(id, open);
  const recordMutation = useRecordPremiumPayment();

  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  // Reset the form each time the dialog opens for a station.
  useEffect(() => {
    if (open) { setPaymentDate(new Date()); setExpiresAt(null); setAmount(""); setNote(""); }
  }, [open, id]);

  const handleSubmit = useCallback(() => {
    if (id == null) return;
    if (!paymentDate) { openErrorSnackbar({ message: t("chargeManagement@premium.paymentDateRequired") }); return; }
    if (!expiresAt) { openErrorSnackbar({ message: t("chargeManagement@premium.expiresAtRequired") }); return; }
    if (expiresAt.getTime() <= paymentDate.getTime()) { openErrorSnackbar({ message: t("chargeManagement@premium.expiryAfterPayment") }); return; }
    const amt = amount.trim() === "" ? 0 : Number(amount);
    if (isNaN(amt) || amt < 0) { openErrorSnackbar({ message: t("chargeManagement@premium.amountInvalid") }); return; }
    if (note.length > 500) { openErrorSnackbar({ message: t("chargeManagement@premium.noteTooLong") }); return; }

    recordMutation.mutate(
      { id, body: { paymentDate: paymentDate.toISOString(), expiresAt: expiresAt.toISOString(), amount: amt, note: note.trim() || null } },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("chargeManagement@premium.saved") });
          setExpiresAt(null); setAmount(""); setNote("");
        },
        onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
      }
    );
  }, [id, paymentDate, expiresAt, amount, note, recordMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const isActive = history?.isPremiumActive ?? false;

  return (
    <Dialog open={open} onClose={() => !recordMutation.isPending && onClose()} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
      <Box sx={{ background: "linear-gradient(135deg, #f9a825 0%, #f57f17 100%)", px: 3, py: 2.25, color: "#fff" }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar variant="rounded" sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 42, height: 42 }}><WorkspacePremiumIcon /></Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} noWrap>{t("chargeManagement@premium.title")}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>{station?.name ?? "—"} · #{id}</Typography>
          </Box>
        </Stack>
      </Box>

      <DialogTitle sx={{ py: 1.5 }}>
        {/* Current status */}
        {isLoading ? (
          <Skeleton variant="rounded" height={40} />
        ) : (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip
              icon={<WorkspacePremiumIcon sx={{ fontSize: "16px !important" }} />}
              label={isActive ? t("chargeManagement@premium.active") : t("chargeManagement@premium.inactive")}
              color={isActive ? "success" : "default"}
              sx={{ fontWeight: 700 }}
            />
            {history?.currentExpiresAt && (
              <Typography variant="body2" color="text.secondary">
                {t("chargeManagement@premium.expiresOn")}: <b>{fmtDate(history.currentExpiresAt)}</b>
              </Typography>
            )}
          </Stack>
        )}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="subtitle2" fontWeight={700}>{t("chargeManagement@premium.recordPayment")}</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <DatePicker
              label={t("chargeManagement@premium.paymentDate")}
              value={paymentDate}
              onChange={setPaymentDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
            <DatePicker
              label={t("chargeManagement@premium.expiresAt")}
              value={expiresAt}
              onChange={setExpiresAt}
              minDate={paymentDate ?? undefined}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Stack>
          <TextField
            label={t("chargeManagement@premium.amount")}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start"><PaymentsIcon fontSize="small" color="action" /></InputAdornment>,
              endAdornment: <InputAdornment position="end">JOD</InputAdornment>,
            }}
          />
          <TextField
            label={t("chargeManagement@premium.note")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline rows={2} size="small" fullWidth
            inputProps={{ maxLength: 500 }}
            InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}><EditNoteIcon fontSize="small" color="action" /></InputAdornment> }}
          />

          <Divider />

          {/* History */}
          <Stack direction="row" spacing={0.75} alignItems="center">
            <HistoryIcon fontSize="small" color="action" />
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">{t("chargeManagement@premium.history")}</Typography>
          </Stack>
          {isLoading ? (
            <Stack spacing={1}>{[0, 1].map((i) => <Skeleton key={i} variant="rounded" height={48} />)}</Stack>
          ) : !history || history.history.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>{t("chargeManagement@premium.noHistory")}</Alert>
          ) : (
            <Stack spacing={1}>
              {history.history.map((h) => (
                <Box key={h.id} sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: "divider" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" fontWeight={600}>
                      {fmtDate(h.paymentDate)} → {fmtDate(h.expiresAt)}
                    </Typography>
                    <Chip label={`${h.amount} JOD`} size="small" color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
                  </Stack>
                  {h.note && <Typography variant="caption" color="text.secondary">{h.note}</Typography>}
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={recordMutation.isPending} color="inherit">{t("cancel")}</Button>
        <Button
          onClick={handleSubmit} variant="contained" color="warning" disabled={recordMutation.isPending}
          startIcon={recordMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <WorkspacePremiumIcon />}
        >
          {history?.history.length ? t("chargeManagement@premium.renew") : t("chargeManagement@premium.record")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
