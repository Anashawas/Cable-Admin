import { memo } from "react";
import { useTranslation } from "react-i18next";

import Fade from "@mui/material/Fade";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BlockIcon from "@mui/icons-material/Block";
import { useLayoutStore } from "src/stores";

const EmptyAppScreens = () => {
  const { t } = useTranslation();
  const smallScreen = useLayoutStore((state) => state.smallScreen);

  return (
    <Fade in timeout={700}>
      <Box
        sx={{
          p: 1,
          ...(smallScreen && {
            pb: (theme) =>
              `calc(${theme.spacing(1)} + env(safe-area-inset-bottom))`,
          }),
        }}
        height={1}
        overflow="auto"
      >
        <Stack minHeight={1} alignItems="center" justifyContent="center">
          <BlockIcon sx={{ fontSize: 48 }} color="disabled" />
          <Typography pt={1} variant="subtitle2" textAlign="center">
            {t("app@emptyAppScreens")}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {t("app@emptyAppScreensTagline")}
          </Typography>
        </Stack>
      </Box>
    </Fade>
  );
};

export default memo(EmptyAppScreens);
