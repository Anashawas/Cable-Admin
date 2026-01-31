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

interface RoleFormHeaderProps {
  editMode: boolean;
  isSubmitting: boolean;
  onClose: () => void;
}

const RoleFormHeader = ({
  editMode,
  isSubmitting,
  onClose,
}: RoleFormHeaderProps) => {
  const { t } = useTranslation();

  return (
    <AppBar position="relative">
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onClose} disabled={isSubmitting}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
          {editMode ? t("roles@form.editRole") : t("roles@form.createRole")}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default memo(RoleFormHeader);
