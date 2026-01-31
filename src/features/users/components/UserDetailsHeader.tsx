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
import { User } from "../types/api";

interface UserDetailsHeaderProps {
  user: User;
  onClose: () => void;
}

const UserDetailsHeader = ({
  user,
  onClose,
}: UserDetailsHeaderProps) => {
  const { t } = useTranslation();

  return (
    <AppBar position="relative">
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onClose}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
          {t("users@details.title")}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default memo(UserDetailsHeader);
