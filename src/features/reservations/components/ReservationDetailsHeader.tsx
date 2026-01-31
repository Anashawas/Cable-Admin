import { memo } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { ReservationResponse } from "../types/api";

interface ReservationDetailsHeaderProps {
  reservation: ReservationResponse;
  onClose: () => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
}

const ReservationDetailsHeader = ({
  reservation,
  onClose,
  onMenuOpen,
}: ReservationDetailsHeaderProps) => {
  const { t } = useTranslation();

  return (
    <AppBar position="relative">
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onClose}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
          {t("reservations@details.title")}
        </Typography>
        <Tooltip
          title={t("reservations@actions.openMenu")}
          placement="bottom"
          PopperProps={{
            modifiers: [
              {
                name: 'preventOverflow',
                options: {
                  boundary: 'viewport',
                },
              },
            ],
            sx: {
              zIndex: 10001,
            },
          }}
        >
          <IconButton
            color="inherit"
            onClick={onMenuOpen}
            aria-label="reservation actions menu"
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default memo(ReservationDetailsHeader);
