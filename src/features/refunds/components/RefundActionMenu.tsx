import { memo } from "react";
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { Check as CheckIcon, Close as RejectIcon, CheckCircle as CompleteIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

interface RefundActionMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  onComplete?: () => void;
  showComplete?: boolean;
  showAcceptReject?: boolean;
}

const RefundActionMenu = ({
  anchorEl,
  onClose,
  onAccept,
  onReject,
  onComplete,
  showComplete = false,
  showAcceptReject = false,
}: RefundActionMenuProps) => {
  const { t } = useTranslation();

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      slotProps={{
        paper: {
          style: {
            maxHeight: '200px',
            minWidth: '160px',
            zIndex: 10001,
          },
        },
      }}
      MenuListProps={{
        'aria-labelledby': 'refund-actions-button',
      }}
      sx={{
        zIndex: 10001,
      }}
    >
      {showComplete && (
        <MenuItem onClick={onComplete}>
          <ListItemIcon>
            <CompleteIcon color="primary" />
          </ListItemIcon>
          <ListItemText>{t("refunds@details.complete.action")}</ListItemText>
        </MenuItem>
      )}
      {showAcceptReject && (
        <>
          <MenuItem onClick={onAccept}>
            <ListItemIcon>
              <CheckIcon color="success" />
            </ListItemIcon>
            <ListItemText>{t("refunds@details.accept")}</ListItemText>
          </MenuItem>
          <MenuItem onClick={onReject}>
            <ListItemIcon>
              <RejectIcon color="error" />
            </ListItemIcon>
            <ListItemText>{t("refunds@details.reject")}</ListItemText>
          </MenuItem>
        </>
      )}
    </Menu>
  );
};

export default memo(RefundActionMenu);
