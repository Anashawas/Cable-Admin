import { memo } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ReservationResponse } from "../../reservations/types/api";

interface RefundPaymentInfoProps {
  refund: ReservationResponse;
}

const RefundPaymentInfo = ({ refund }: RefundPaymentInfoProps) => {
  const { t } = useTranslation();

  return (
    <Card sx={{ mb: 3, boxShadow: 1, borderRadius: 1 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          {t("refunds@details.paymentInfo")}
        </Typography>

        <Box display="flex" gap={2} mb={3}>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("refunds@details.paymentDate")}
            </Typography>
            <Typography variant="body1">
              {refund.paymentDate
                ? format(new Date(refund.paymentDate), "dd/MM/yyyy")
                : "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("refunds@details.paymentStatus")}
            </Typography>
            <Typography variant="body1">
              {refund.paymentStatus || "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("refunds@details.refundAmount")}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {refund.campingSeason.campingSeasonDetail.insuranceValue
                ? `${refund.campingSeason.campingSeasonDetail.insuranceValue} KWD`
                : "-"}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
          >
            {t("refunds@details.ibanNumber")}
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
          >
            {refund.ibanNumber || "-"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default memo(RefundPaymentInfo);
