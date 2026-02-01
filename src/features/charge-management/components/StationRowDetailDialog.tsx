import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Chip,
  Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ChargingPointDto } from "../types/api";

/** Parse service string (e.g. comma-separated) into list of labels. */
function parseServiceList(service: string | null | undefined): string[] {
  if (!service || typeof service !== "string") return [];
  return service
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Normalize image entry to URL string. */
function getImageUrl(entry: string | { url?: string }): string {
  if (typeof entry === "string") return entry;
  return entry?.url ?? "";
}

interface StationRowDetailDialogProps {
  open: boolean;
  onClose: () => void;
  station: ChargingPointDto | null;
}

export default function StationRowDetailDialog({
  open,
  onClose,
  station,
}: StationRowDetailDialogProps) {
  const { t } = useTranslation();
  const services = parseServiceList(station?.service ?? null);
  const imageUrls = (station?.images ?? [])
    .map(getImageUrl)
    .filter(Boolean) as string[];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {station?.name ?? "—"} — {station ? t("chargeManagement@detail.title") : ""}
      </DialogTitle>
      <DialogContent>
        {!station ? (
          <Typography color="text.secondary">No station selected.</Typography>
        ) : (
          <Stack spacing={2} sx={{ pt: 0 }}>
            {services.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("chargeManagement@detail.services")}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap>
                  {services.map((label, i) => (
                    <Chip key={i} label={label} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}
            {imageUrls.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t("chargeManagement@detail.images")}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
                  {imageUrls.map((url, i) => (
                    <Box
                      key={i}
                      component="img"
                      src={url}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 1,
                        objectFit: "cover",
                        bgcolor: "action.hover",
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
            {services.length === 0 && imageUrls.length === 0 && (
              <Typography color="text.secondary">No services or images.</Typography>
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
