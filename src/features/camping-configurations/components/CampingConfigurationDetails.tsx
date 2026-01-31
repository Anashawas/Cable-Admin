import { memo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface CampingConfigurationDetailsProps {
  open: boolean;
  campingConfiguration: any | null;
  onClose: () => void;
}

const CampingConfigurationDetails = ({
  open,
  campingConfiguration,
  onClose,
}: CampingConfigurationDetailsProps) => {
  const { t } = useTranslation();

  if (!campingConfiguration) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="camping-configuration-details-title"
      sx={{
        zIndex: 9999,
        "& .MuiDialog-paper": {
          zIndex: 9999,
        },
        "& .MuiBackdrop-root": {
          zIndex: 9998,
        },
      }}
    >
      <DialogTitle id="camping-configuration-details-title">
        <Typography variant="h5" component="h2">
          {t("campingConfigurations@details.title")}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t("campingConfigurations@details.placeholder")}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          {t("close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(CampingConfigurationDetails);
