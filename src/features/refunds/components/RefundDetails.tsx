import { memo, useState } from "react";
import { Dialog, DialogContent, DialogActions, Box, Card, CardContent, Typography, Button, CircularProgress } from "@mui/material";
import { Check as CheckIcon, Close as RejectIcon, CheckCircle as CompleteIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReservationResponse } from "../../reservations/types/api";
import { getAttachmentsByReservationId } from "../services/attachments-service";
import { getRefundHistoryByReservationId } from "../services/timeline-service";
import { getRefundCommentsByReservationId } from "../services/comments-service";
import { updateCampingRefund } from "../services/refund-update-service";
import { uploadAttachments } from "../services/attachment-upload-service";
import { RESERVATION_STATUS } from "../../../constants/reservation-status-constants";
import { PRIVILEGES } from "../../../constants/privileges-constants";
import useSnackbarStore from "../../../stores/snackbar-store";
import PrivilegeComponentProtection from "../../../components/PrivilegeComponentProtection";
import RefundDetailsHeader from "./RefundDetailsHeader";
import RefundReservationInfo from "./RefundReservationInfo";
import RefundPaymentInfo from "./RefundPaymentInfo";
import RefundUserInfo from "./RefundUserInfo";
import RefundTimeline from "./RefundTimeline";
import RefundComments from "./RefundComments";
import RefundAttachments from "./RefundAttachments";
import RefundConfirmationDialogs from "./RefundConfirmationDialogs";
import RefundCompleteDialog from "./RefundCompleteDialog";

interface RefundDetailsProps {
  open: boolean;
  refund: ReservationResponse | null;
  onClose: () => void;
}

const RefundDetails = ({ open, refund, onClose }: RefundDetailsProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((state) => state.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((state) => state.openErrorSnackbar);
  const [fullscreen, setFullscreen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const {
    data: attachments,
    isLoading: isLoadingAttachments,
  } = useQuery({
    queryKey: ["refund-attachments", refund?.id],
    queryFn: ({ signal }) => getAttachmentsByReservationId(refund!.id, signal),
    enabled: open && !!refund,
  });

  const {
    data: timelineHistories,
    isLoading: isLoadingTimeline,
    error: timelineError,

  } = useQuery({
    queryKey: ["refund-timeline", refund?.id],
    queryFn: ({ signal }) =>
      getRefundHistoryByReservationId(refund!.id, signal),
    enabled: open && !!refund,
  });

  const {
    data: comments,
    isLoading: isLoadingComments,
    error: commentsError,

  } = useQuery({
    queryKey: ["refund-comments", refund?.id],
    queryFn: ({ signal }) =>
      getRefundCommentsByReservationId(refund!.id, signal),
    enabled: open && !!refund,
  });

  const updateRefundMutation = useMutation({
    mutationFn: updateCampingRefund,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["refund-timeline", refund?.id] });
      queryClient.invalidateQueries({ queryKey: ["refund-comments", refund?.id] });
      queryClient.invalidateQueries({ queryKey: ["refunds"] });

      const isAccept = variables.reservationStatusId === 12;
      const isComplete = variables.reservationStatusId === 8; // FEES_REFUNDED
      const successMessage = isComplete
        ? t("refunds@details.complete.success")
        : isAccept
        ? t("refunds@details.acceptSuccess")
        : t("refunds@details.rejectSuccess");

      openSuccessSnackbar({ message: successMessage });

      // Close dialog for all actions (accept, reject, complete)
      onClose();
    },
    onError: (_error, variables) => {
      const isAccept = variables.reservationStatusId === 12;
      const isComplete = variables.reservationStatusId === 8; // FEES_REFUNDED
      const errorMessage = isComplete
        ? t("refunds@details.complete.error")
        : isAccept
        ? t("refunds@details.acceptError")
        : t("refunds@details.rejectError");

      openErrorSnackbar({ message: errorMessage });
    },
  });

  const handleClose = () => {
    setFullscreen(false);
    onClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAccept = () => {
    setShowAcceptDialog(true);
  };

  const handleReject = () => {
    setShowRejectDialog(true);
  };

  const handleComplete = () => {
    setShowCompleteDialog(true);
  };

  const handleConfirmAccept = async () => {
    if (!refund) return;

    try {
      await updateRefundMutation.mutateAsync({
        id: refund.id,
        reservationStatusId: 12,
        note: null,
      });
      setShowAcceptDialog(false);
    } catch {
    }
  };

  const handleCancelAccept = () => {
    setShowAcceptDialog(false);
  };

  const handleConfirmReject = async () => {
    if (!refund || !rejectReason.trim()) return;

    try {
      await updateRefundMutation.mutateAsync({
        id: refund.id,
        reservationStatusId: 11,
        note: rejectReason.trim(),
      });
      setShowRejectDialog(false);
      setRejectReason("");
    } catch {
    }
  };

  const handleCancelReject = () => {
    setShowRejectDialog(false);
    setRejectReason("");
  };

  const handleConfirmComplete = async (attachmentIds: number[]) => {
    if (!refund) return;

    try {
      await updateRefundMutation.mutateAsync({
        id: refund.id,
        reservationStatusId: 8, // FEES_REFUNDED
        note: null,
      });
      setShowCompleteDialog(false);
    } catch (error) {
      // Error is handled by mutation's onError
    }
  };

  const handleCancelComplete = () => {
    setShowCompleteDialog(false);
  };

  const handleUploadAttachments = async (files: File[], reservationId: number): Promise<number[]> => {
    return await uploadAttachments(files, reservationId, "ReservationCamping");
  };

  const handleDownloadAttachment = (
    fileName: string,
    fileData: string,
    contentType: string
  ) => {
    const link = document.createElement("a");
    link.href = `data:${contentType};base64,${fileData}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!refund) return null;

  const showAcceptReject = refund?.reservationStatus?.id === RESERVATION_STATUS.REFUND_REQUEST_PENDING_FINANCE;
  const showComplete = refund?.reservationStatus?.id === RESERVATION_STATUS.REFUND_REQUEST_IN_PROCESS;
  const hasActions = showAcceptReject || showComplete;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullScreen={fullscreen}
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
      <RefundDetailsHeader
        refund={refund}
        onClose={handleClose}
        onMenuOpen={handleMenuOpen}
        showMenu={false}
      />

      <DialogContent sx={{ p: 3, height: "100%", overflow: "auto" }}>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3} mb={3}>
          <Box flex={1}>
            <RefundReservationInfo refund={refund} />
            <RefundPaymentInfo refund={refund} />
            <RefundUserInfo refund={refund} />
          </Box>

          <Box flex={1}>
            <Card sx={{ boxShadow: 1, borderRadius: 1, height: "765px" }}>
              <CardContent sx={{ height: "100%", overflow: "auto" }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  {t("refunds@details.refundTimeline")}
                </Typography>
                <RefundTimeline
                  histories={timelineHistories || []}
                  isLoading={isLoadingTimeline}
                  error={timelineError?.message || null}
                />
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Box display="flex" gap={3} flexDirection={{ xs: "column", md: "row" }}>
          <Card sx={{ flex: 1, boxShadow: 1, borderRadius: 1, height: "400px" }}>
            <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: "bold", mb: 2 }}
              >
                {t("refunds@details.commentsNotes")}
              </Typography>
              <Box sx={{ flex: 1, overflow: "auto" }}>
                <RefundComments
                  comments={comments || []}
                  isLoading={isLoadingComments}
                  error={commentsError?.message || null}
                />
              </Box>
            </CardContent>
          </Card>

          <RefundAttachments
            attachments={attachments}
            isLoading={isLoadingAttachments}
            onDownload={handleDownloadAttachment}
          />
        </Box>
      </DialogContent>

      {hasActions && (
        <PrivilegeComponentProtection requiredPrivileges={[PRIVILEGES.MANAGE_REFUNDS]}>
          <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
            {showAcceptReject && (
              <>
                <Button
                  onClick={handleReject}
                  color="error"
                  variant="outlined"
                  startIcon={<RejectIcon />}
                  disabled={updateRefundMutation.isPending}
                  size="large"
                  sx={{ minWidth: 150 }}
                >
                  {t("refunds@details.reject")}
                </Button>
                <Button
                  onClick={handleAccept}
                  color="success"
                  variant="contained"
                  startIcon={<CheckIcon />}
                  disabled={updateRefundMutation.isPending}
                  size="large"
                  sx={{ minWidth: 150 }}
                >
                  {updateRefundMutation.isPending ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    t("refunds@details.accept")
                  )}
                </Button>
              </>
            )}
            {showComplete && (
              <Button
                onClick={handleComplete}
                color="success"
                variant="contained"
                startIcon={<CompleteIcon />}
                disabled={updateRefundMutation.isPending}
                size="large"
                sx={{ minWidth: 200 }}
              >
                {t("refunds@details.complete.action")}
              </Button>
            )}
          </DialogActions>
        </PrivilegeComponentProtection>
      )}

      <RefundConfirmationDialogs
        reservationNumber={refund.reservationNumber}
        showAcceptDialog={showAcceptDialog}
        showRejectDialog={showRejectDialog}
        rejectReason={rejectReason}
        isPending={updateRefundMutation.isPending}
        onAcceptDialogClose={handleCancelAccept}
        onRejectDialogClose={handleCancelReject}
        onConfirmAccept={handleConfirmAccept}
        onConfirmReject={handleConfirmReject}
        onRejectReasonChange={setRejectReason}
      />

      <RefundCompleteDialog
        open={showCompleteDialog}
        reservationNumber={refund.reservationNumber}
        reservationId={refund.id}
        isPending={updateRefundMutation.isPending}
        onClose={handleCancelComplete}
        onConfirm={handleConfirmComplete}
        onUploadAttachments={handleUploadAttachments}
      />
    </Dialog>
  );
};

export default memo(RefundDetails);
