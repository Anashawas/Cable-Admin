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
import { CampingSeason } from "../types/api";

interface CampingSeasonDeleteConfirmationDialogProps {
  open: boolean;
  campingSeason: CampingSeason | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CampingSeasonDeleteConfirmationDialog = ({
  open,
  campingSeason,
  isDeleting,
  onClose,
  onConfirm,
}: CampingSeasonDeleteConfirmationDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 10002 }}
    >
      <DialogTitle>{t("campingSeasons@deleteDialog.title")}</DialogTitle>
      <DialogContent>
        <Typography>
          {t("campingSeasons@deleteDialog.message", {
            name: campingSeason?.name || "",
          })}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={isDeleting}>
          {t("campingSeasons@deleteDialog.cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            t("campingSeasons@deleteDialog.confirm")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(CampingSeasonDeleteConfirmationDialog);
