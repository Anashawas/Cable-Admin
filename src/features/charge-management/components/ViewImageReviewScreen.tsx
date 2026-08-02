import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Chip,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  getPendingViewImages,
  reviewViewImage,
} from "../services/view-image-review-service";

export default function ViewImageReviewScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data: items = [], isLoading, error, refetch } = useQuery({
    queryKey: ["view-image-pending"],
    queryFn: ({ signal }) => getPendingViewImages(signal),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, approve }: { id: number; approve: boolean }) =>
      reviewViewImage(id, approve),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["view-image-pending"] });
      openSuccessSnackbar({
        message: vars.approve
          ? t("viewImageReview@approved")
          : t("viewImageReview@rejected"),
      });
    },
    onError: (err: Error) =>
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const busy = reviewMutation.isPending;

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <ScreenHeader title={t("viewImageReview@title")} />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {t("viewImageReview@subtitle")}
            </Typography>
            <Button startIcon={<RefreshIcon />} onClick={() => refetch()} size="small">
              {t("refresh")}
            </Button>
          </Stack>

          {error ? (
            <Typography color="error">{t("loadingFailed")}</Typography>
          ) : isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4 }}>
              {t("viewImageReview@empty")}
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {items.map((it) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={it.chargingPointId}>
                  <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <CardMedia
                      component="img"
                      height="160"
                      image={it.viewImage ?? undefined}
                      alt={it.stationName ?? `#${it.chargingPointId}`}
                      sx={{ objectFit: "cover", bgcolor: "grey.200" }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1" fontWeight={600} noWrap>
                          {it.stationName ?? `#${it.chargingPointId}`}
                        </Typography>
                        <Chip size="small" color="warning" label={t("viewImageReview@pending")} />
                      </Stack>
                      {it.cityName && (
                        <Typography variant="body2" color="text.secondary">
                          {it.cityName}
                        </Typography>
                      )}
                      {it.ownerName && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {it.ownerName}
                        </Typography>
                      )}
                      {it.uploadedAt && (
                        <Typography variant="caption" color="text.disabled" display="block">
                          {new Date(it.uploadedAt).toLocaleString()}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: "space-between" }}>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<CloseIcon />}
                        disabled={busy}
                        onClick={() => reviewMutation.mutate({ id: it.chargingPointId, approve: false })}
                      >
                        {t("viewImageReview@reject")}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                        disabled={busy}
                        onClick={() => reviewMutation.mutate({ id: it.chargingPointId, approve: true })}
                      >
                        {t("viewImageReview@approve")}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
