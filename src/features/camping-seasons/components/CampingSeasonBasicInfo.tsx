import { memo } from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CampingSeason } from "../types/api";

interface CampingSeasonBasicInfoProps {
  campingSeason: CampingSeason;
}

const CampingSeasonBasicInfo = ({ campingSeason }: CampingSeasonBasicInfoProps) => {
  const { t } = useTranslation();

  return (
    <Card sx={{ boxShadow: 1, borderRadius: 1 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          {t("campingSeasons@details.basicInformation")}
        </Typography>

        <Box display="flex" gap={2} mb={3}>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("campingSeasons@details.name")}
            </Typography>
            <Typography variant="body1">
              {campingSeason.name || "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("campingSeasons@details.safeDistanceCamps")}
            </Typography>
            <Typography variant="body1">
              {campingSeason.safeDistanceCamps || "-"}
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
              {t("campingSeasons@details.fromDate")}
            </Typography>
            <Typography variant="body1">
              {campingSeason.fromDate || "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("campingSeasons@details.toDate")}
            </Typography>
            <Typography variant="body1">
              {campingSeason.toDate || "-"}
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
              {t("campingSeasons@details.status")}
            </Typography>
            <Typography variant="body1">
              {campingSeason.campingSeasonStatus?.name || "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("campingSeasons@details.isDeleted")}
            </Typography>
            <Chip
              label={
                campingSeason.isDeleted
                  ? t("campingSeasons@details.deleted")
                  : t("campingSeasons@details.active")
              }
              color={campingSeason.isDeleted ? "error" : "success"}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Box>

        {campingSeason.campingSeasonDetails && campingSeason.campingSeasonDetails.length > 0 && (
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              sx={{ fontWeight: "bold", mt: 2 }}
            >
              {t("campingSeasons@details.seasonDetails")}
            </Typography>
            <Box sx={{ mt: 1 }}>
              {campingSeason.campingSeasonDetails.map((detail, index) => (
                <Box
                  key={detail.id || index}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    backgroundColor: "action.hover",
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: "bold" }}>
                    {t("campingSeasons@details.detail")} #{index + 1}
                  </Typography>
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Box flex="1 1 45%">
                      <Typography variant="caption" color="text.secondary">
                        {t("campingSeasons@details.role")}
                      </Typography>
                      <Typography variant="body2">{detail.role?.name || "-"}</Typography>
                    </Box>
                    <Box flex="1 1 45%">
                      <Typography variant="caption" color="text.secondary">
                        {t("campingSeasons@details.insuranceValue")}
                      </Typography>
                      <Typography variant="body2">{detail.insuranceValue}</Typography>
                    </Box>
                    <Box flex="1 1 45%">
                      <Typography variant="caption" color="text.secondary">
                        {t("campingSeasons@details.feeValue")}
                      </Typography>
                      <Typography variant="body2">{detail.feeValue}</Typography>
                    </Box>
                    <Box flex="1 1 45%">
                      <Typography variant="caption" color="text.secondary">
                        {t("campingSeasons@details.maxAreaSize")}
                      </Typography>
                      <Typography variant="body2">{detail.maxAreaSize}</Typography>
                    </Box>
                    <Box flex="1 1 45%">
                      <Typography variant="caption" color="text.secondary">
                        {t("campingSeasons@details.allowedReservationTimes")}
                      </Typography>
                      <Typography variant="body2">{detail.allowedReservationTimes}</Typography>
                    </Box>
                    <Box flex="1 1 45%">
                      <Typography variant="caption" color="text.secondary">
                        {t("campingSeasons@details.startDate")}
                      </Typography>
                      <Typography variant="body2">{detail.startDate || "-"}</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(CampingSeasonBasicInfo);
