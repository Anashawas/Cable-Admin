import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Box, Stack, Typography, Chip, IconButton, Divider, Skeleton, Alert, Grid, Button, TextField, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import UndoIcon from "@mui/icons-material/Undo";
import { useTransactionDetail, useReverseTransaction } from "../hooks/use-loyalty";
import { useSnackbarStore } from "../../../stores";

interface TransactionDetailDialogProps {
  open: boolean;
  activityType: string | null;
  transactionId: number | null;
  onClose: () => void;
}

const REVERSIBLE = new Set(["Offer", "Partner", "Redemption"]);

const TYPE_COLOR: Record<string, "success" | "error" | "secondary"> = {
  Partner: "success", Offer: "error", Redemption: "secondary",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <Grid size={{ xs: 6 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{label}</Typography>
      <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-word" }}>{value}</Typography>
    </Grid>
  );
}

export default function TransactionDetailDialog({ open, activityType, transactionId, onClose }: TransactionDetailDialogProps) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useTransactionDetail(activityType, transactionId, open);
  const positive = (data?.points ?? 0) >= 0;

  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const reverseMutation = useReverseTransaction();
  const [reverseOpen, setReverseOpen] = useState(false);
  const [reason, setReason] = useState("");

  const canReverse = !!data && !!activityType && REVERSIBLE.has(activityType);

  const handleReverse = () => {
    if (!activityType || transactionId == null) return;
    if (!reason.trim()) { openErrorSnackbar({ message: t("loyalty@reverse.reasonRequired") }); return; }
    reverseMutation.mutate(
      { activityType: activityType as "Offer" | "Partner" | "Redemption", transactionId, reason: reason.trim() },
      {
        onSuccess: (res) => {
          openSuccessSnackbar({ message: t("loyalty@reverse.success", { balance: res.newBalance.toLocaleString() }) });
          setReverseOpen(false); setReason(""); onClose();
        },
        onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ReceiptLongIcon color="primary" />
          <Box flex={1}>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{t("loyalty@transactionDetail")}</Typography>
            {data && <Typography variant="caption" color="text.secondary">#{data.transactionId}</Typography>}
          </Box>
          {activityType && <Chip label={t(`loyalty@activity_${activityType}`)} size="small" color={TYPE_COLOR[activityType] ?? "default"} />}
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {isLoading ? (
          <Stack spacing={1}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={40} />)}</Stack>
        ) : error || !data ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>{t("loadingFailed")}</Alert>
        ) : (
          <Stack spacing={2}>
            <Box sx={{ textAlign: "center", py: 1 }}>
              <Typography variant="h4" fontWeight={800} color={positive ? "success.main" : "error.main"}>
                {positive ? "+" : ""}{data.points.toLocaleString()} <Typography component="span" variant="body2" color="text.secondary">{t("loyalty@pts")}</Typography>
              </Typography>
              {data.statusName && <Chip label={data.statusName} size="small" sx={{ mt: 0.5 }} />}
            </Box>
            <Divider />
            <Grid container spacing={1.5}>
              <Row label={t("loyalty@user")} value={data.user?.userName ?? `#${data.user?.userId}`} />
              <Row label={t("loyalty@phone")} value={data.user?.phone} />
              <Row label={t("loyalty@provider")} value={data.provider?.providerName} />
              <Row label={t("loyalty@code")} value={data.code} />
              <Row label={t("loyalty@amount")} value={data.amount != null ? `${data.amount.toFixed(3)} ${data.currencyCode ?? ""}` : null} />
              <Row label={t("loyalty@commission")} value={data.commissionAmount != null ? `${data.commissionAmount.toFixed(3)} ${data.currencyCode ?? ""}` : null} />
              <Row label={t("loyalty@note")} value={data.note} />
              <Row label={t("loyalty@performedBy")} value={data.performedByUserName} />
              <Row label={t("loyalty@createdAt")} value={new Date(data.createdAt).toLocaleString()} />
              <Row label={t("loyalty@completedAt")} value={data.completedAt ? new Date(data.completedAt).toLocaleString() : null} />
            </Grid>
          </Stack>
        )}
      </DialogContent>
      {canReverse && (
        <>
          <Divider />
          <DialogActions sx={{ px: 3, py: 1.5 }}>
            <Button color="error" variant="outlined" startIcon={<UndoIcon />} onClick={() => setReverseOpen(true)} sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}>
              {t("loyalty@reverse.action")}
            </Button>
          </DialogActions>
        </>
      )}

      {/* Reverse confirm */}
      <Dialog open={reverseOpen} onClose={() => setReverseOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t("loyalty@reverse.confirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>{t("loyalty@reverse.confirmMessage")}</DialogContentText>
          <TextField autoFocus fullWidth multiline rows={2} label={t("loyalty@reverse.reason")} value={reason} onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReverseOpen(false)}>{t("cancel")}</Button>
          <Button variant="contained" color="error" onClick={handleReverse} disabled={reverseMutation.isPending}
            startIcon={reverseMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <UndoIcon />}>
            {t("loyalty@reverse.action")}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
