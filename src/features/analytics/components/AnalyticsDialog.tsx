import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, Box, Stack, Typography, Avatar, IconButton, Chip, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InsightsIcon from "@mui/icons-material/Insights";
import AnalyticsPanel from "./AnalyticsPanel";
import type { AnalyticsEntityType } from "../types/api";

interface AnalyticsDialogProps {
  open: boolean;
  entityType: AnalyticsEntityType;
  entityId: number | null;
  entityName?: string;
  onClose: () => void;
}

export default function AnalyticsDialog({ open, entityType, entityId, entityName, onClose }: AnalyticsDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
      <Box sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, color: "#fff", px: 3, py: 2.25, position: "relative" }}>
        <IconButton onClick={onClose} sx={{ position: "absolute", top: 8, right: 8, color: "rgba(255,255,255,0.85)" }}><CloseIcon /></IconButton>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar variant="rounded" sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 42, height: 42 }}><InsightsIcon /></Avatar>
          <Box sx={{ minWidth: 0, pr: 4 }}>
            <Typography variant="h6" fontWeight={800} noWrap>{t("analytics@title")}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" sx={{ opacity: 0.9 }} noWrap>{entityName ?? "—"}</Typography>
              <Chip label={`${t(`analytics@entity.${entityType}`)} #${entityId}`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600, height: 20 }} />
            </Stack>
          </Box>
        </Stack>
      </Box>
      <DialogContent sx={{ p: 2.5 }}>
        <AnalyticsPanel entityType={entityType} entityId={entityId} enabled={open} />
      </DialogContent>
    </Dialog>
  );
}
