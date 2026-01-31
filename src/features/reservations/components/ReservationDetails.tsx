import { memo, useState } from "react";
import { Dialog, DialogContent, Box, Card, CardContent, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReservationResponse } from "../types/api";
import ReservationDetailsHeader from "./ReservationDetailsHeader";
import ReservationReservationInfo from "./ReservationReservationInfo";
import ReservationUserInfo from "./ReservationUserInfo";
import ReservationLocationInfo from "./ReservationLocationInfo";
import ReservationMap from "./ReservationMap";
import ReservationActionMenu from "./ReservationActionMenu";
import ReservationCancelDialog from "./ReservationCancelDialog";
import { cancelReservationLicense } from "../services/cancel-license-service";
import useSnackbarStore from "../../../stores/snackbar-store";
import { useTranslation } from "react-i18next";

interface ReservationDetailsProps {
  open: boolean;
  reservation: ReservationResponse | null;
  onClose: () => void;
}

const ReservationDetails = ({
  open,
  reservation,
  onClose,
}: ReservationDetailsProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((state) => state.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((state) => state.openErrorSnackbar);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelNote, setCancelNote] = useState("");

  const cancelLicenseMutation = useMutation({
    mutationFn: cancelReservationLicense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      openSuccessSnackbar({ message: t("reservations@details.cancelSuccess") });
      setShowCancelDialog(false);
      setCancelNote("");
      onClose();
    },
    onError: () => {
      openErrorSnackbar({ message: t("reservations@details.cancelError") });
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewLicense = () => {
    if (reservation) {
      const licensePath = window.env?.host?.licensePath || "https://dev.openware.com.kw/km/camping-v2/client/print/reservation/";
      const url = `${licensePath}${reservation.reservationNumber}`;
      window.open(url, "_blank");
    }
  };

  const handleViewInvoice = () => {
    if (reservation) {
      const invoicePath = window.env?.host?.invoicePath || "https://dev.openware.com.kw/km/camping-v2/client/print/invoice/";
      const url = `${invoicePath}${reservation.reservationNumber}`;
      window.open(url, "_blank");
    }
  };

  const handleCancelLicense = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!reservation || !cancelNote.trim()) return;

    try {
      await cancelLicenseMutation.mutateAsync({
        id: reservation.id,
        note: cancelNote.trim(),
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
    setCancelNote("");
  };


  if (!reservation) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={false}
      sx={{
        "& .MuiDialog-paper": {
          width: "60vw",
          height: "100vh",
          zIndex: 9999,
        },
        zIndex: 9999,
        "& .MuiBackdrop-root": {
          zIndex: 9998,
        },
      }}
    >
      <ReservationDetailsHeader
        reservation={reservation}
        onClose={onClose}
        onMenuOpen={handleMenuOpen}
      />

      <ReservationActionMenu
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        onViewLicense={handleViewLicense}
        onViewInvoice={handleViewInvoice}
        onCancelLicense={handleCancelLicense}
        reservationStatusId={reservation.reservationStatus.id}
      />

      <ReservationCancelDialog
        open={showCancelDialog}
        reservationNumber={reservation.reservationNumber}
        cancelNote={cancelNote}
        isPending={cancelLicenseMutation.isPending}
        onClose={handleCancelDialogClose}
        onConfirm={handleConfirmCancel}
        onNoteChange={setCancelNote}
      />

      <DialogContent sx={{ p: 3, height: "100%", overflow: "auto" }}>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3} mb={3}>
          <Box flex={1}>
            <ReservationReservationInfo reservation={reservation} />
            <ReservationUserInfo reservation={reservation} />
          </Box>

          <Box flex={1}>
            <ReservationMap reservation={reservation} />
          </Box>
        </Box>

        <Box>
          <ReservationLocationInfo reservation={reservation} />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ReservationDetails);