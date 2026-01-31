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

interface UserFormHeaderProps {
  editMode: boolean;
  isSubmitting: boolean;
  onClose: () => void;
}

const UserFormHeader = ({
  editMode,
  isSubmitting,
  onClose,
}: UserFormHeaderProps) => {
  const { t } = useTranslation();

  return (
    <AppBar position="relative">
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onClose} disabled={isSubmitting}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
          {editMode ? t("users@form.editUser") : t("users@form.createUser")}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default memo(UserFormHeader);
