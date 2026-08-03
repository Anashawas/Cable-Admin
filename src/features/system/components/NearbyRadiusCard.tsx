import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import { getNearbyRadius, setNearbyRadius } from "../services/ads-settings-service";
import { useSnackbarStore } from "../../../stores";

/**
 * Admin control for the app-wide "nearby search radius" (km) — caps nearest
 * stations and radius-targeted banners. Backed by GET/PUT
 * api/settings/nearby-radius.
 */
export default function NearbyRadiusCard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data: radiusKm, isLoading } = useQuery({
    queryKey: ["nearby-radius"],
    queryFn: ({ signal }) => getNearbyRadius(signal),
  });

  const [value, setValue] = useState<string>("");
  useEffect(() => {
    if (radiusKm != null) setValue(String(radiusKm));
  }, [radiusKm]);

  const saveMutation = useMutation({
    mutationFn: (km: number) => setNearbyRadius(km),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nearby-radius"] });
      openSuccessSnackbar({ message: t("platform@banners.nearbyRadiusSaved") });
    },
    onError: (err: Error) =>
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const handleSave = () => {
    const km = Number(value);
    if (!Number.isFinite(km) || km <= 0) {
      openErrorSnackbar({ message: t("platform@banners.targetRadiusRequired") });
      return;
    }
    saveMutation.mutate(km);
  };

  const dirty = value !== "" && value !== String(radiusKm ?? "");

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <TravelExploreIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={600}>
            {t("platform@banners.nearbyRadiusTitle")}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("platform@banners.nearbyRadiusDesc")}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            type="number"
            size="small"
            label={t("platform@banners.radiusKm")}
            value={value}
            disabled={isLoading}
            onChange={(e) => setValue(e.target.value)}
            sx={{ maxWidth: 160 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">km</InputAdornment>,
            }}
          />
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saveMutation.isPending || isLoading || !dirty}
          >
            {saveMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("platform@banners.saveBtn")
            )}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
