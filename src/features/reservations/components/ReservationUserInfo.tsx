import { memo } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ReservationResponse } from "../types/api";

interface ReservationUserInfoProps {
  reservation: ReservationResponse;
}

const ReservationUserInfo = ({ reservation }: ReservationUserInfoProps) => {
  const { t } = useTranslation();

  return (
    <Card sx={{ boxShadow: 1, borderRadius: 1 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          {t("reservations@details.userInfo")}
        </Typography>

        <Box display="flex" gap={2} mb={3}>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("reservations@details.userName")}
            </Typography>
            <Typography variant="body1">
              {reservation.user?.name || "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("reservations@details.civilId")}
            </Typography>
            <Typography variant="body1">
              {reservation.user?.civilId || "-"}
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
              {t("reservations@details.phone")}
            </Typography>
            <Typography variant="body1">
              {reservation.user?.phone || "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("reservations@details.email")}
            </Typography>
            <Typography
              variant="body1"
              sx={{ wordBreak: "break-word", fontSize: "0.875rem" }}
            >
              {reservation.user?.email || "-"}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
          >
            {t("reservations@details.applicationRole")}
          </Typography>
          <Typography variant="body1">
            {reservation.user?.applicationRole?.name || "-"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default memo(ReservationUserInfo);
