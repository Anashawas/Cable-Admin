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
import TimerIcon from "@mui/icons-material/Timer";
import { getImpressionWindow, setImpressionWindow } from "../services/ads-settings-service";
import { useSnackbarStore } from "../../../stores";

/**
 * Admin control for the impression de-duplication window (minutes) — how long a
 * repeat view by the same user for the same asset is ignored. Backed by
 * GET/PUT api/settings/impression-window (BE must expose it).
 */
export default function ImpressionWindowCard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data: minutes, isLoading } = useQuery({
    queryKey: ["impression-window"],
    queryFn: ({ signal }) => getImpressionWindow(signal),
  });

  const [value, setValue] = useState<string>("");
  useEffect(() => {
    if (minutes != null) setValue(String(minutes));
  }, [minutes]);

  const saveMutation = useMutation({
    mutationFn: (m: number) => setImpressionWindow(m),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["impression-window"] });
      openSuccessSnackbar({ message: t("platform@banners.impressionWindowSaved") });
    },
    onError: (err: Error) =>
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const handleSave = () => {
    const m = Number(value);
    if (!Number.isFinite(m) || m < 0) {
      openErrorSnackbar({ message: t("platform@banners.impressionWindowInvalid") });
      return;
    }
    saveMutation.mutate(m);
  };

  const dirty = value !== "" && value !== String(minutes ?? "");

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <TimerIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={600}>
            {t("platform@banners.impressionWindowTitle")}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("platform@banners.impressionWindowDesc")}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            type="number"
            size="small"
            label={t("platform@banners.minutes")}
            value={value}
            disabled={isLoading}
            onChange={(e) => setValue(e.target.value)}
            sx={{ maxWidth: 180 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {t("platform@banners.minAbbrev")}
                </InputAdornment>
              ),
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
