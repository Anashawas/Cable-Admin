import { memo } from "react";
import { AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

interface CampingSeasonFormHeaderProps {
  editMode: boolean;
  isSubmitting: boolean;
  onClose: () => void;
}

const CampingSeasonFormHeader = ({
  editMode,
  isSubmitting,
  onClose,
}: CampingSeasonFormHeaderProps) => {
  const { t } = useTranslation();

  return (
    <AppBar position="relative">
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onClose} disabled={isSubmitting}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
          {editMode
            ? t("campingSeasons@form.editCampingSeason")
            : t("campingSeasons@form.createCampingSeason")}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default memo(CampingSeasonFormHeader);
