import { useTranslation } from "react-i18next";
import { Box, Stack } from "@mui/material";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import BannerManager from "./BannerManager";

export default function BannersScreen() {
  const { t } = useTranslation();

  return (
    <AppScreenContainer>
      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          boxSizing: "border-box",
          p: { xs: 1, sm: 2 },
        }}
      >
        <Stack spacing={2}>
          <ScreenHeader title={t("platform@banners.title")} />
          <BannerManager />
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
