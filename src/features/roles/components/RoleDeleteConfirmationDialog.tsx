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

interface RoleDeleteConfirmationDialogProps {
  roleName: string;
  open: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const RoleDeleteConfirmationDialog = ({
  roleName,
  open,
  isPending,
  onClose,
  onConfirm,
}: RoleDeleteConfirmationDialogProps) => {
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
        {t("roles@deleteConfirmTitle")}
      </DialogTitle>
      <DialogContent>
        <Typography>
          {t("roles@deleteConfirmMessage")} {roleName}?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="inherit"
          disabled={isPending}
        >
          {t("roles@cancel")}
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
            t("roles@delete")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(RoleDeleteConfirmationDialog);
