import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, Box, Stack, Typography, Avatar, IconButton, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ProviderActivityFeed from "./ProviderActivityFeed";

interface ProviderActivityDialogProps {
  open: boolean;
  providerType: "ChargingPoint" | "ServiceProvider";
  providerId: number | null;
  providerName?: string;
  onClose: () => void;
}

export default function ProviderActivityDialog({ open, providerType, providerId, providerName, onClose }: ProviderActivityDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
      <Box sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, color: "#fff", px: 3, py: 2.25, position: "relative" }}>
        <IconButton onClick={onClose} sx={{ position: "absolute", top: 8, right: 8, color: "rgba(255,255,255,0.85)" }}><CloseIcon /></IconButton>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar variant="rounded" sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 42, height: 42 }}><ReceiptLongIcon /></Avatar>
          <Box sx={{ minWidth: 0, pr: 4 }}>
            <Typography variant="h6" fontWeight={800} noWrap>{t("loyalty@activity")}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>{providerName ?? "—"} · #{providerId}</Typography>
          </Box>
        </Stack>
      </Box>
      <DialogContent sx={{ p: 2.5 }}>
        <ProviderActivityFeed providerType={providerType} providerId={providerId} enabled={open} />
      </DialogContent>
    </Dialog>
  );
}
