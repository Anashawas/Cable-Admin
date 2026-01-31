import { memo } from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ReservationResponse } from "../types/api";

interface ReservationLocationInfoProps {
  reservation: ReservationResponse;
}

const ReservationLocationInfo = ({
  reservation,
}: ReservationLocationInfoProps) => {
  const { t } = useTranslation();

  return (
    <Card sx={{ boxShadow: 1, borderRadius: 1 }}>
      <CardContent
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          {t("reservations@details.locationInfo")}
        </Typography>

        <Box display="flex" gap={2} mb={2}>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("reservations@details.location")}
            </Typography>
            <Typography variant="body1">
              {reservation.campingSeasonLocation?.name || "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("reservations@details.safeDistanceCamps")}
            </Typography>
            <Typography variant="body1">
              {reservation.campingSeason?.safeDistanceCamps || "-"}
            </Typography>
          </Box>
        </Box>

        {reservation.campingSeason?.campingSeasonDetail && (
          <Box sx={{ flex: 1, overflow: "auto" }}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              sx={{ mb: 1 }}
            >
              {t("reservations@details.seasonDetails")}
            </Typography>
            <Box
              key={reservation.campingSeason?.campingSeasonDetail.id}
              sx={{
                mb: 2,
                p: 1.5,
                bgcolor: "action.hover",
                borderRadius: 1,
              }}
            >
              <Box display="flex" gap={2} mb={1}>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    {t("reservations@details.role")}
                  </Typography>
                  <Typography variant="body2">
                    {reservation.campingSeason?.campingSeasonDetail.role?.name || "-"}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    {t("reservations@details.insuranceValue")}
                  </Typography>
                  <Typography variant="body2">
                    {reservation.campingSeason?.campingSeasonDetail.insuranceValue
                      ? `${reservation.campingSeason?.campingSeasonDetail.insuranceValue} KWD`
                      : "-"}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={2}>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    {t("reservations@details.maxAreaSize")}
                  </Typography>
                  <Typography variant="body2">
                    {reservation.campingSeason?.campingSeasonDetail.maxAreaSize || "-"}
                  </Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary">
                    {t("reservations@details.allowedReservationTimes")}
                  </Typography>
                  <Typography variant="body2">
                    {reservation.campingSeason?.campingSeasonDetail.allowedReservationTimes || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(ReservationLocationInfo);
