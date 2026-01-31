import { memo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface UserDeleteConfirmationDialogProps {
  userName: string;
  open: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const UserDeleteConfirmationDialog = ({
  userName,
  open,
  isPending,
  onClose,
  onConfirm,
}: UserDeleteConfirmationDialogProps) => {
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
        {t("users@deleteConfirmTitle")}
      </DialogTitle>
      <DialogContent>
        <Typography>
          {t("users@deleteConfirmMessage")} {userName}?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="inherit"
          disabled={isPending}
        >
          {t("users@cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={isPending}
        >
          {isPending ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            t("users@delete")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(UserDeleteConfirmationDialog);
