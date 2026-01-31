import { memo } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Tooltip,
} from "@mui/material";
import { Close as CloseIcon, MoreVert as MoreVertIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { PRIVILEGES } from "../../../constants/privileges-constants";
import { RESERVATION_STATUS } from "../../../constants/reservation-status-constants";
import PrivilegeComponentProtection from "../../../components/PrivilegeComponentProtection";
import { ReservationResponse } from "../../reservations/types/api";

interface RefundDetailsHeaderProps {
  refund: ReservationResponse;
  onClose: () => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  showMenu?: boolean;
}

const RefundDetailsHeader = ({
  refund,
  onClose,
  onMenuOpen,
  showMenu = true,
}: RefundDetailsHeaderProps) => {
  const { t } = useTranslation();

  return (
    <AppBar position="relative">
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onClose}>
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
          {t("refunds@details.title")}
        </Typography>
        {showMenu && (
          <PrivilegeComponentProtection requiredPrivileges={[PRIVILEGES.MANAGE_REFUNDS]}>
            <Tooltip
              title={t("refunds@actions.openMenu")}
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
                aria-label="refund actions menu"
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </PrivilegeComponentProtection>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default memo(RefundDetailsHeader);
