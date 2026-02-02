import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const Logo = () => {
  const { t } = useTranslation();
  return (
    <Box textAlign="center" p={4}>
      <img
        src={`${window.env.host.virtualPath}/images/Cable-Logo.png`}
        alt="Cable Admin Logo"
        style={{ height: "80px", marginBottom: "16px" }}
      />
      <Typography variant="h3" fontWeight="bold" color="background.default">
        {t("kmCamping")}
      </Typography>
    </Box>
  );
};

export default Logo;
