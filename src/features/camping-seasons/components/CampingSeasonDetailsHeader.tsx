import { memo } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { CampingSeason } from "../types/api";

interface CampingSeasonDetailsHeaderProps {
  campingSeason: CampingSeason;
  onClose: () => void;
}

const CampingSeasonDetailsHeader = ({
  campingSeason,
  onClose,
}: CampingSeasonDetailsHeaderProps) => {
  const { t } = useTranslation();

  return (
    <AppBar position="relative">
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onClose}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
          {t("campingSeasons@details.title")}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default memo(CampingSeasonDetailsHeader);
