import { memo } from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ReservationResponse } from "../types/api";

interface ReservationReservationInfoProps {
  reservation: ReservationResponse;
}

const ReservationReservationInfo = ({ reservation }: ReservationReservationInfoProps) => {
  const { t } = useTranslation();

  return (
    <Card sx={{ mb: 3, boxShadow: 1, borderRadius: 1 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          {t("reservations@details.reservationInfo")}
        </Typography>

        <Box display="flex" gap={2} mb={3}>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("reservations@details.reservationNumber")}
            </Typography>
            <Typography variant="body1">
              {reservation.reservationNumber}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("reservations@details.status")}
            </Typography>
            <Chip
              label={reservation.reservationStatus?.name || "-"}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>

        <Box display="flex" gap={2} mb={3}>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("reservations@details.reservationDate")}
            </Typography>
            <Typography variant="body1">
              {reservation.reservationDate
                ? format(new Date(reservation.reservationDate), "dd/MM/yyyy")
                : "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("reservations@details.amount")}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {reservation.amount ? `${reservation.amount} KWD` : "-"}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={2}>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("reservations@details.campingSeason")}
            </Typography>
            <Typography variant="body1">
              {reservation.campingSeason?.name || "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("reservations@details.deleted")}
            </Typography>
            <Chip
              label={reservation.isDeleted ? t("yes") : t("no")}
              size="small"
              color={reservation.isDeleted ? "error" : "success"}
              variant="outlined"
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default memo(ReservationReservationInfo);
