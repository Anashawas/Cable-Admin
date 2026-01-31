import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface SuspenseFallbackProps {
  loadingText?: string;
}

const SuspenseFallback = ({ loadingText }: SuspenseFallbackProps) => {
  const { t } = useTranslation("common");
  loadingText = loadingText || t("loading");
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      gap={2}
    >
      <CircularProgress size={48} />
      <Typography variant="h6" color="text.secondary">
        {loadingText}
      </Typography>
    </Box>
  );
};

export default SuspenseFallback;
