import { memo } from "react";
import { Dialog, DialogContent, Box, CircularProgress } from "@mui/material";
import { CampingSeason } from "../types/api";
import { useCampingSeasonById } from "../hooks/use-camping-season-by-id";
import CampingSeasonDetailsHeader from "./CampingSeasonDetailsHeader";
import CampingSeasonBasicInfo from "./CampingSeasonBasicInfo";

interface CampingSeasonDetailsProps {
  open: boolean;
  campingSeason: CampingSeason | null;
  onClose: () => void;
}

const CampingSeasonDetails = ({
  open,
  campingSeason,
  onClose,
}: CampingSeasonDetailsProps) => {
  // Fetch full details when dialog is open
  const { data: fullDetails, isLoading } = useCampingSeasonById(
    campingSeason?.id || null,
    open
  );

  if (!campingSeason) return null;

  // Use full details if available, otherwise use the passed camping season
  const displayData = fullDetails || campingSeason;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{ zIndex: 10002 }}
    >
      <CampingSeasonDetailsHeader
        campingSeason={campingSeason}
        onClose={onClose}
      />

      <DialogContent sx={{ p: 3 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <CampingSeasonBasicInfo campingSeason={displayData} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default memo(CampingSeasonDetails);
