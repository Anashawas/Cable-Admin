import { memo } from "react";

import Slide from "@mui/material/Slide";
import Paper from "@mui/material/Paper";

import { Fab, Tooltip, Zoom } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

import { LANGUAGE } from "src/constants";
import { useLanguageStore, useLayoutStore } from "src/stores";
import { useTranslation } from "react-i18next";

const AppSidePanel = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();

  const language = useLanguageStore((state) => state.language);

  const screensContainerVisible = useLayoutStore((state) => state.screensContainerVisible);
  const mapFullScreen = useLayoutStore((state) => state.mapFullScreen);
  const setMapFullScreen = useLayoutStore((state) => state.setMapFullScreen);

  return (
    <>
      <Slide
        in={screensContainerVisible && !mapFullScreen}
        direction={language === LANGUAGE.EN ? "right" : "left"}
        timeout={300}
      >
        <Paper
          sx={(theme) => ({
            position: "fixed",
            top: `calc(64px + ${theme.spacing(2)} + env(safe-area-inset-top))`,
            left: `calc(${theme.spacing(2)} + env(safe-area-inset-left))`,
            display: "grid",
            gridTemplateRows: "1fr max-content",
            width: 450,
            height: `calc(100% - (${theme.spacing(
              12
            )} + env(safe-area-inset-top) + env(safe-area-inset-bottom)))`,
            borderRadius: theme.spacing(1),
            overflow: "hidden",
            zIndex: +screensContainerVisible,
          })}
          elevation={3}
        >
          {children}
        </Paper>
      </Slide>
      <Zoom in={mapFullScreen} timeout={{ enter: 700, appear: 300 }}>
        <Tooltip title={t("map@exitFullScreen")} placement="left" arrow>
          <Fab
            sx={(theme) => ({
              position: "fixed",
              top: `calc(64px + ${theme.spacing(
                2
              )} + env(safe-area-inset-top))`,
              left: `calc(${theme.spacing(2)} + env(safe-area-inset-left))`,
              zIndex: 0,
            })}
            size="small"
            color="secondary"
            onClick={(_) => setMapFullScreen(!mapFullScreen)}
          >
            {language === LANGUAGE.EN ? (
              <ChevronRightIcon />
            ) : (
              <ChevronLeftIcon />
            )}
          </Fab>
        </Tooltip>
      </Zoom>
    </>
  );
};

export default memo(AppSidePanel);
