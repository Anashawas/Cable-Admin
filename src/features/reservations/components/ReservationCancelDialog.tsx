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

interface ReservationCancelDialogProps {
  open: boolean;
  reservationNumber: string;
  cancelNote: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onNoteChange: (value: string) => void;
}

const ReservationCancelDialog = ({
  open,
  reservationNumber,
  cancelNote,
  isPending,
  onClose,
  onConfirm,
  onNoteChange,
}: ReservationCancelDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 10002 }}
    >
      <DialogTitle>
        {t("reservations@details.cancelLicenseTitle")}
      </DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          {t("reservations@details.cancelLicenseMessage")} {reservationNumber}:
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label={t("reservations@details.cancelReason")}
          type="text"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={cancelNote}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={t("reservations@details.cancelReasonPlaceholder")}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="inherit"
          disabled={isPending}
        >
          {t("cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          color="warning"
          variant="contained"
          disabled={!cancelNote.trim() || isPending}
        >
          {isPending ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            t("reservations@details.confirmCancel")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(ReservationCancelDialog);
