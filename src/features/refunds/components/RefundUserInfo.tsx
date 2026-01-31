import { memo } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ReservationResponse } from "../../reservations/types/api";

interface RefundUserInfoProps {
  refund: ReservationResponse;
}

const RefundUserInfo = ({ refund }: RefundUserInfoProps) => {
  const { t } = useTranslation();

  return (
    <Card sx={{ boxShadow: 1, borderRadius: 1 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          {t("refunds@details.userInfo")}
        </Typography>

        <Box display="flex" gap={2} mb={3}>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("refunds@details.userName")}
            </Typography>
            <Typography variant="body1">
              {refund.user?.name || "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("refunds@details.civilId")}
            </Typography>
            <Typography variant="body1">
              {refund.user?.civilId || "-"}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={2} mb={3}>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("refunds@details.phone")}
            </Typography>
            <Typography variant="body1">
              {refund.user?.phone || "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("refunds@details.email")}
            </Typography>
            <Typography
              variant="body1"
              sx={{ wordBreak: "break-word", fontSize: "0.875rem" }}
            >
              {refund.user?.email || "-"}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
          >
            {t("refunds@details.applicationRole")}
          </Typography>
          <Typography variant="body1">
            {refund.user?.applicationRole?.name || "-"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default memo(RefundUserInfo);
