import { memo } from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { User } from "../types/api";

interface UserBasicInfoProps {
  user: User;
}

const UserBasicInfo = ({ user }: UserBasicInfoProps) => {
  const { t } = useTranslation();

  return (
    <Card sx={{ boxShadow: 1, borderRadius: 1 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          {t("users@details.basicInformation")}
        </Typography>

        <Box display="flex" gap={2} mb={3}>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("users@details.name")}
            </Typography>
            <Typography variant="body1">
              {user.name || "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("users@details.userName")}
            </Typography>
            <Typography variant="body1">
              {user.userName || "-"}
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
              {t("users@details.email")}
            </Typography>
            <Typography
              variant="body1"
              sx={{ wordBreak: "break-word", fontSize: "0.875rem" }}
            >
              {user.email || "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("users@details.phone")}
            </Typography>
            <Typography variant="body1">
              {user.phone || "-"}
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
              {t("users@details.civilId")}
            </Typography>
            <Typography variant="body1">
              {user.civilId || "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("users@details.role")}
            </Typography>
            <Typography variant="body1">
              {user.role?.name || "-"}
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
              {t("users@details.governorate")}
            </Typography>
            <Typography variant="body1">
              {user.governorate?.name || "-"}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              {t("users@details.isLdap")}
            </Typography>
            <Chip
              label={user.isLdap ? t("users@details.yes") : t("users@details.no")}
              color={user.isLdap ? "primary" : "default"}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Box>

        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
          >
            {t("users@details.status")}
          </Typography>
          <Chip
            label={user.isActive ? t("users@details.active") : t("users@details.inactive")}
            color={user.isActive ? "success" : "error"}
            size="small"
            sx={{ mt: 0.5 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default memo(UserBasicInfo);
