import { memo } from "react";
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Cancel as CancelIcon,
  Description as LicenseIcon,
  Receipt as InvoiceIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { RESERVATION_STATUS } from "../../../constants/reservation-status-constants";
import { useAuthenticationStore } from "@/stores";
import { PRIVILEGES } from "@/constants/privileges-constants";

interface ReservationActionMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onViewLicense: () => void;
  onViewInvoice: () => void;
  onCancelLicense: () => void;
  reservationStatusId?: number;
}

const ReservationActionMenu = ({
  anchorEl,
  onClose,
  onViewLicense,
  onViewInvoice,
  onCancelLicense,
  reservationStatusId,
}: ReservationActionMenuProps) => {
  const { t } = useTranslation();
  const { user } = useAuthenticationStore();

  const showCancelLicense =
    reservationStatusId === RESERVATION_STATUS.PAID_AND_LICENSED &&
    user.privileges.includes(PRIVILEGES.MANAGE_RESERVATIONS);

  const handleViewLicense = () => {
    onViewLicense();
    onClose();
  };

  const handleViewInvoice = () => {
    onViewInvoice();
    onClose();
  };

  const handleCancelLicense = () => {
    onCancelLicense();
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      slotProps={{
        paper: {
          style: {
            maxHeight: "300px",
            minWidth: "220px",
            zIndex: 10001,
          },
        },
      }}
      MenuListProps={{
        "aria-labelledby": "reservation-actions-button",
      }}
      sx={{
        zIndex: 10001,
      }}
    >
      <MenuItem onClick={handleViewLicense}>
        <ListItemIcon>
          <LicenseIcon color="primary" />
        </ListItemIcon>
        <ListItemText>{t("reservations@details.viewLicense")}</ListItemText>
      </MenuItem>
      <MenuItem onClick={handleViewInvoice}>
        <ListItemIcon>
          <InvoiceIcon color="primary" />
        </ListItemIcon>
        <ListItemText>{t("reservations@details.viewInvoice")}</ListItemText>
      </MenuItem>
      {showCancelLicense && (
        <>
          <Divider />
          <MenuItem onClick={handleCancelLicense}>
            <ListItemIcon>
              <CancelIcon color="warning" />
            </ListItemIcon>
            <ListItemText>
              {t("reservations@details.cancelLicense")}
            </ListItemText>
          </MenuItem>
        </>
      )}
    </Menu>
  );
};

export default memo(ReservationActionMenu);
