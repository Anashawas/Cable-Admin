import { memo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface RefundConfirmationDialogsProps {
  reservationNumber: string;
  showAcceptDialog: boolean;
  showRejectDialog: boolean;
  rejectReason: string;
  isPending: boolean;
  onAcceptDialogClose: () => void;
  onRejectDialogClose: () => void;
  onConfirmAccept: () => void;
  onConfirmReject: () => void;
  onRejectReasonChange: (value: string) => void;
}

const RefundConfirmationDialogs = ({
  reservationNumber,
  showAcceptDialog,
  showRejectDialog,
  rejectReason,
  isPending,
  onAcceptDialogClose,
  onRejectDialogClose,
  onConfirmAccept,
  onConfirmReject,
  onRejectReasonChange,
}: RefundConfirmationDialogsProps) => {
  const { t } = useTranslation();

  return (
    <>
      <Dialog
        open={showAcceptDialog}
        onClose={onAcceptDialogClose}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 10002 }}
      >
        <DialogTitle>
          {t("refunds@details.acceptConfirmTitle")}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t("refunds@details.acceptConfirmMessage")} {reservationNumber}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onAcceptDialogClose}
            color="inherit"
            disabled={isPending}
          >
            {t("refunds@details.cancel")}
          </Button>
          <Button
            onClick={onConfirmAccept}
            color="success"
            variant="contained"
            disabled={isPending}
          >
            {isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("refunds@details.accept")
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showRejectDialog}
        onClose={onRejectDialogClose}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 10002 }}
      >
        <DialogTitle>
          {t("refunds@details.rejectReasonTitle")}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("refunds@details.rejectReasonMessage")} {reservationNumber}:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label={t("refunds@details.rejectionReason")}
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={rejectReason}
            onChange={(e) => onRejectReasonChange(e.target.value)}
            placeholder={t("refunds@details.rejectionReasonPlaceholder")}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onRejectDialogClose}
            color="inherit"
            disabled={isPending}
          >
            {t("refunds@details.cancel")}
          </Button>
          <Button
            onClick={onConfirmReject}
            color="error"
            variant="contained"
            disabled={!rejectReason.trim() || isPending}
          >
            {isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("refunds@details.reject")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default memo(RefundConfirmationDialogs);
