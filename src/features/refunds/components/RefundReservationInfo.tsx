import { memo } from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ReservationResponse } from "../../reservations/types/api";

interface RefundReservationInfoProps {
  refund: ReservationResponse;
}

const RefundReservationInfo = ({ refund }: RefundReservationInfoProps) => {
  const { t } = useTranslation();

  return (
    <Card sx={{ mb: 3, boxShadow: 1, borderRadius: 1 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          {t("refunds@details.reservationInfo")}
        </Typography>

        <Box display="flex" gap={2} mb={3}>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("refunds@details.reservationNumber")}
            </Typography>
            <Typography variant="body1">{refund.reservationNumber}</Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("refunds@details.status")}
            </Typography>
            <Chip
              label={refund.reservationStatus?.name || "-"}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
          
        </Box>

        <Box display="flex" gap={2}>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("refunds@details.reservationDate")}
            </Typography>
            <Typography variant="body1">
              {refund.reservationDate
                ? format(new Date(refund.reservationDate), "dd/MM/yyyy")
                : "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("refunds@details.campingSeason")}
            </Typography>
            <Typography variant="body1">
              {refund.campingSeason?.name || "-"}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default memo(RefundReservationInfo);
