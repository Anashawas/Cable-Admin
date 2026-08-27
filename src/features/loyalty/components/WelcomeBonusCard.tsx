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
  Chip,
} from "@mui/material";
import RedeemIcon from "@mui/icons-material/Redeem";
import { getWelcomeBonus, setWelcomeBonus } from "../services/boosts-service";
import { useSnackbarStore } from "../../../stores";

/**
 * Admin control for the once-ever "welcome bonus" — the multiplier applied to a
 * user's first charge. 1 disables it; server default is 2 (double). Backed by
 * GET/PUT api/settings/welcome-bonus.
 */
export default function WelcomeBonusCard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data, isLoading } = useQuery({
    queryKey: ["welcome-bonus"],
    queryFn: ({ signal }) => getWelcomeBonus(signal),
  });

  const [value, setValue] = useState<string>("");
  useEffect(() => {
    if (data?.multiplier != null) setValue(String(data.multiplier));
  }, [data?.multiplier]);

  const saveMutation = useMutation({
    mutationFn: (m: number) => setWelcomeBonus(m),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["welcome-bonus"] });
      openSuccessSnackbar({ message: t("loyalty@boosts.welcomeSaved") });
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const handleSave = () => {
    const m = Number(value);
    if (!Number.isFinite(m) || m < 1 || m > 10) {
      openErrorSnackbar({ message: t("loyalty@boosts.welcomeRange") });
      return;
    }
    saveMutation.mutate(m);
  };

  const current = data?.multiplier ?? 1;
  const dirty = value !== "" && value !== String(current);
  const willDisable = Number(value) <= 1;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap">
          <RedeemIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={600}>
            {t("loyalty@boosts.welcomeTitle")}
          </Typography>
          <Chip
            size="small"
            color={current > 1 ? "success" : "default"}
            label={current > 1 ? t("loyalty@boosts.on") : t("loyalty@boosts.off")}
          />
          {data?.isDefault && (
            <Chip size="small" variant="outlined" label={t("loyalty@boosts.default")} />
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("loyalty@boosts.welcomeDesc")}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <TextField
            type="number"
            size="small"
            label={t("loyalty@boosts.multiplier")}
            value={value}
            disabled={isLoading}
            onChange={(e) => setValue(e.target.value)}
            helperText={
              willDisable ? t("loyalty@boosts.welcomeOffHint") : t("loyalty@boosts.welcomeRangeHint")
            }
            inputProps={{ min: 1, max: 10, step: 0.5 }}
            sx={{ maxWidth: 220 }}
          />
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saveMutation.isPending || isLoading || !dirty}
            sx={{ mt: 0.5 }}
          >
            {saveMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("loyalty@boosts.save")
            )}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
