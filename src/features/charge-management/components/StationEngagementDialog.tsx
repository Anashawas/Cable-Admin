import { useState } from "react";
import { useTranslation } from "react-i18next";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PeopleIcon from "@mui/icons-material/People";
import CampaignIcon from "@mui/icons-material/Campaign";

import {
  StationFollowersPanel,
  StationNotificationsPanel,
} from "./StationEngagementPanels";

interface StationEngagementDialogProps {
  open: boolean;
  stationId: number | null;
  stationName?: string | null;
  onClose: () => void;
}

export default function StationEngagementDialog({
  open,
  stationId,
  stationName,
  onClose,
}: StationEngagementDialogProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: "85vh" } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {t("chargeManagement@engagement.title")}
            </Typography>
            {stationName ? (
              <Typography variant="caption" color="text.secondary">
                {stationName}
              </Typography>
            ) : null}
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          icon={<PeopleIcon fontSize="small" />}
          iconPosition="start"
          label={t("chargeManagement@engagement.followers")}
        />
        <Tab
          icon={<CampaignIcon fontSize="small" />}
          iconPosition="start"
          label={t("chargeManagement@engagement.notifications")}
        />
      </Tabs>

      <DialogContent sx={{ p: 0, minHeight: 320 }}>
        {tab === 0 ? (
          <StationFollowersPanel providerId={stationId} enabled={open} />
        ) : (
          <StationNotificationsPanel providerId={stationId} enabled={open} />
        )}
      </DialogContent>
    </Dialog>
  );
}
