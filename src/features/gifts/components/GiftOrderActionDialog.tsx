import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useSnackbarStore } from "../../../stores";
import { apiErrorMessage } from "../../../utils/api-error";
import { useCancelGiftOrder, useFulfillGiftOrder } from "../hooks/use-gifts";
import type { AdminGiftOrderDto } from "../types/api";

interface GiftOrderActionDialogProps {
  order: AdminGiftOrderDto | null;
  action: "fulfill" | "cancel" | null;
  onClose: () => void;
}

/**
 * Fulfil (optional note or voucher code, shown to the user in "My gifts") or
 * cancel (reason; every point goes back to the wallet). Pending orders only —
 * the server answers 409 ORDER_NOT_PENDING otherwise.
 */
export default function GiftOrderActionDialog({ order, action, onClose }: GiftOrderActionDialogProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith("ar");
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const fulfill = useFulfillGiftOrder();
  const cancel = useCancelGiftOrder();
  const [text, setText] = useState("");

  useEffect(() => {
    if (order) setText("");
  }, [order, action]);

  if (!order || !action) return null;
  const busy = fulfill.isPending || cancel.isPending;
  const isFulfill = action === "fulfill";
  const giftName = isAr ? order.giftNameAr : order.giftNameEn;

  const handleSubmit = () => {
    const value = text.trim() || null;
    const callbacks = {
      onSuccess: () => {
        openSuccessSnackbar({
          message: isFulfill
            ? t("gifts@orders.fulfilled", { code: order.orderCode })
            : t("gifts@orders.cancelled", { code: order.orderCode, points: order.pointsSpent }),
        });
        onClose();
      },
      onError: (err: unknown) => openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) }),
    };
    if (isFulfill) fulfill.mutate({ id: order.id, note: value }, callbacks);
    else cancel.mutate({ id: order.id, reason: value }, callbacks);
  };

  return (
    <Dialog open onClose={() => !busy && onClose()} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {isFulfill ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
          <span>{isFulfill ? t("gifts@orders.fulfillTitle") : t("gifts@orders.cancelTitle")}</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2">
            <b>{order.orderCode}</b> · {giftName} · {order.userName ?? `#${order.userId}`}
          </Typography>
          {isFulfill ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              {order.giftType === "Voucher" ? t("gifts@orders.fulfillVoucherHint") : t("gifts@orders.fulfillHint")}
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              {t("gifts@orders.cancelHint", { points: order.pointsSpent })}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label={isFulfill ? t("gifts@orders.fulfillmentNote") : t("gifts@orders.cancelReason")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            inputProps={{ maxLength: isFulfill ? 1000 : 500 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={busy} color="inherit">{t("close")}</Button>
        <Button
          variant="contained"
          color={isFulfill ? "success" : "error"}
          onClick={handleSubmit}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : isFulfill ? <CheckCircleIcon /> : <CancelIcon />}
        >
          {isFulfill ? t("gifts@orders.fulfill") : t("gifts@orders.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
