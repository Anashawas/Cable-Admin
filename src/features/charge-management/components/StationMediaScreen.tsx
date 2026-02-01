import { useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Grid,
  Typography,
  Avatar,
  CircularProgress,
  Paper,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { getStationById } from "../services/station-form-service";
import {
  getStationPhotos,
  uploadStationIcon,
  uploadStationPhotos,
  type StationAttachmentDto,
} from "../services/station-media-service";
import { useSnackbarStore } from "../../../stores";

function getPhotoUrl(photo: StationAttachmentDto): string | null {
  return photo.url ?? photo.attachmentUrl ?? null;
}

export default function StationMediaScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const stationId = id ? Number(id) : 0;
  const iconInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  const { data: station, isLoading: isLoadingStation } = useQuery({
    queryKey: ["charge-management", "station", stationId],
    queryFn: ({ signal }) => getStationById(stationId, signal),
    enabled: stationId > 0,
  });

  const { data: photos = [], isLoading: isLoadingPhotos, refetch: refetchPhotos } = useQuery({
    queryKey: ["charge-management", "station-photos", stationId],
    queryFn: ({ signal }) => getStationPhotos(stationId, signal),
    enabled: stationId > 0,
  });

  const uploadIconMutation = useMutation({
    mutationFn: ({ id: sid, file }: { id: number; file: File }) =>
      uploadStationIcon(sid, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-management", "station", stationId] });
      openSuccessSnackbar({ message: t("chargeManagement@media.iconUploaded") });
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const uploadPhotosMutation = useMutation({
    mutationFn: ({ id: sid, files }: { id: number; files: File[] }) =>
      uploadStationPhotos(sid, files),
    onSuccess: () => {
      refetchPhotos();
      openSuccessSnackbar({ message: t("chargeManagement@media.photosUploaded") });
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const handleChangeIconClick = useCallback(() => {
    iconInputRef.current?.click();
  }, []);

  const handleIconFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && stationId > 0) {
        uploadIconMutation.mutate({ id: stationId, file });
      }
      e.target.value = "";
    },
    [stationId, uploadIconMutation]
  );

  const handleAddPhotosClick = useCallback(() => {
    photosInputRef.current?.click();
  }, []);

  const handlePhotosFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length > 0 && stationId > 0) {
        uploadPhotosMutation.mutate({ id: stationId, files });
      }
      e.target.value = "";
    },
    [stationId, uploadPhotosMutation]
  );

  if (!id || stationId <= 0) {
    return (
      <AppScreenContainer>
        <Box p={2}>
          <Typography color="text.secondary">{t("notFound")}</Typography>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/charge-management")} sx={{ mt: 2 }}>
            {t("back")}
          </Button>
        </Box>
      </AppScreenContainer>
    );
  }

  if (isLoadingStation && !station) {
    return (
      <AppScreenContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      </AppScreenContainer>
    );
  }

  const stationName = station?.name ?? t("chargeManagement@unnamed");

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 900, mx: "auto" }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/charge-management")}
            size="small"
          >
            {t("back")}
          </Button>
          <Typography variant="h5" fontWeight="bold">
            {t("chargeManagement@media.title")}: {stationName}
          </Typography>
        </Stack>

        {/* Section 1: Main Icon */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            {t("chargeManagement@media.mainIcon")}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Avatar
              src={station?.iConUrl ?? undefined}
              alt={stationName}
              sx={{ width: 120, height: 120 }}
              variant="rounded"
            />
            <Box>
              <input
                ref={iconInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleIconFileChange}
              />
              <Button
                variant="contained"
                onClick={handleChangeIconClick}
                disabled={uploadIconMutation.isPending}
              >
                {uploadIconMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  t("chargeManagement@media.changeIcon")
                )}
              </Button>
            </Box>
          </Stack>
        </Paper>

        {/* Section 2: Photo Gallery */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="600">
              {t("chargeManagement@media.photoGallery")}
            </Typography>
            <Box>
              <input
                ref={photosInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handlePhotosFileChange}
              />
              <Button
                variant="outlined"
                startIcon={<AddPhotoAlternateIcon />}
                onClick={handleAddPhotosClick}
                disabled={uploadPhotosMutation.isPending}
              >
                {uploadPhotosMutation.isPending ? (
                  <CircularProgress size={20} />
                ) : (
                  t("chargeManagement@media.addPhotos")
                )}
              </Button>
            </Box>
          </Stack>

          {isLoadingPhotos ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : photos.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
              {t("chargeManagement@media.noPhotos")}
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {photos.map((photo, index) => {
                const url = getPhotoUrl(photo);
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={photo.id ?? index}>
                    <Box
                      sx={{
                        position: "relative",
                        borderRadius: 1,
                        overflow: "hidden",
                        bgcolor: "action.hover",
                        aspectRatio: "1",
                      }}
                    >
                      {url ? (
                        <Box
                          component="img"
                          src={url}
                          alt=""
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {t("NA")}
                          </Typography>
                        </Box>
                      )}
                      <Tooltip title={t("chargeManagement@media.deleteUnavailable")}>
                        <span>
                          <IconButton
                            size="small"
                            disabled
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              bgcolor: "background.paper",
                              "&:hover": { bgcolor: "action.hover" },
                              "&.Mui-disabled": {
                                bgcolor: "background.paper",
                                color: "text.disabled",
                              },
                            }}
                            aria-label={t("chargeManagement@media.deleteUnavailable")}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Paper>
      </Box>
    </AppScreenContainer>
  );
}
