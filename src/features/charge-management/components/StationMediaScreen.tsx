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
  Divider,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EvStationIcon from "@mui/icons-material/EvStation";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import UploadIcon from "@mui/icons-material/Upload";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { getStationById } from "../services/station-form-service";
import {
  getStationPhotos,
  uploadStationIcon,
  uploadStationPhotos,
  getStationAttachmentId,
  type StationAttachmentDto,
} from "../services/station-media-service";
import { deleteAttachment, UploadFileFolders } from "../../../services/file-service";
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

  const deletePhotoMutation = useMutation({
    mutationFn: (attachmentId: number) =>
      deleteAttachment(UploadFileFolders.CableAttachments, attachmentId),
    onSuccess: () => {
      refetchPhotos();
      openSuccessSnackbar({ message: t("chargeManagement@media.photoDeleted") });
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const deleteAllPhotosMutation = useMutation({
    mutationFn: async (attachmentIds: number[]) => {
      for (const aid of attachmentIds) {
        await deleteAttachment(UploadFileFolders.CableAttachments, aid);
      }
    },
    onSuccess: () => {
      refetchPhotos();
      openSuccessSnackbar({ message: t("chargeManagement@media.allPhotosDeleted") });
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const handleDeleteOnePhoto = useCallback(
    (attachmentId: number) => {
      if (!window.confirm(t("chargeManagement@media.confirmDelete") as string)) return;
      deletePhotoMutation.mutate(attachmentId);
    },
    [deletePhotoMutation, t]
  );

  const handleDeleteAllPhotos = useCallback(() => {
    if (!stationId || photos.length === 0) return;
    const ids = photos
      .map((p) => getStationAttachmentId(p))
      .filter((x): x is number => x != null);
    if (ids.length === 0) {
      openErrorSnackbar({ message: t("chargeManagement@media.deleteUnavailable") });
      return;
    }
    if (!window.confirm(t("chargeManagement@media.confirmDeleteAll") as string)) return;
    deleteAllPhotosMutation.mutate(ids);
  }, [stationId, photos, deleteAllPhotosMutation, t, openErrorSnackbar]);

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
      <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 960, mx: "auto" }}>

        {/* ── Gradient Banner ── */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
            borderRadius: 3,
            p: { xs: 2.5, md: 3.5 },
            mb: 3,
            position: "relative",
            overflow: "hidden",
            color: "white",
          }}
        >
          <Box sx={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/charge-management")}
                sx={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)", borderColor: "white" }, flexShrink: 0 }}
                variant="outlined"
                size="small"
              >
                {t("back")}
              </Button>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <EvStationIcon sx={{ fontSize: 26 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="white">{t("chargeManagement@media.title")}</Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>{stationName}</Typography>
                </Box>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <Box sx={{ background: "rgba(255,255,255,0.13)", borderRadius: 2, px: 2, py: 1, textAlign: "center", minWidth: 80 }}>
                <Typography variant="h6" fontWeight={700} color="white">{photos.length}</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("chargeManagement@media.photoGallery")}</Typography>
              </Box>
            </Stack>
          </Stack>
        </Box>

        {/* ── Station Icon Section ── */}
        <Paper elevation={1} sx={{ borderRadius: 3, overflow: "hidden", mb: 3 }}>
          <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1 }}>
            <EvStationIcon fontSize="small" color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>{t("chargeManagement@media.mainIcon")}</Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={3}>
              <Box sx={{ p: 1.5, borderRadius: 3, border: "2px dashed", borderColor: uploadIconMutation.isPending ? "primary.main" : "divider", bgcolor: "grey.50", flexShrink: 0, transition: "border-color 0.2s" }}>
                <Avatar
                  src={station?.iConUrl ?? undefined}
                  alt={stationName}
                  sx={{ width: 100, height: 100, borderRadius: 2 }}
                  variant="rounded"
                />
              </Box>
              <Box>
                <Typography variant="body1" fontWeight={600} gutterBottom>{stationName}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t("chargeManagement@media.iconHint")}
                </Typography>
                <input ref={iconInputRef} type="file" accept="image/*" hidden onChange={handleIconFileChange} />
                <Button
                  variant="contained"
                  startIcon={uploadIconMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
                  onClick={handleChangeIconClick}
                  disabled={uploadIconMutation.isPending}
                  sx={{
                    background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)",
                    "&:hover": { background: "linear-gradient(135deg, #0a3880 0%, #0d47a1 100%)" },
                    fontWeight: 600,
                  }}
                >
                  {uploadIconMutation.isPending ? t("uploading") : t("chargeManagement@media.changeIcon")}
                </Button>
              </Box>
            </Stack>
          </Box>
        </Paper>

        {/* ── Photo Gallery Section ── */}
        <Paper elevation={1} sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PhotoLibraryIcon fontSize="small" color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>{t("chargeManagement@media.photoGallery")}</Typography>
              {photos.length > 0 && (
                <Box sx={{ bgcolor: "primary.main", color: "white", borderRadius: 10, px: 1, py: 0.1, fontSize: "0.72rem", fontWeight: 700 }}>
                  {photos.length}
                </Box>
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              {photos.length > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={deleteAllPhotosMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
                  onClick={handleDeleteAllPhotos}
                  disabled={deleteAllPhotosMutation.isPending || deletePhotoMutation.isPending}
                  sx={{ fontWeight: 600, textTransform: "none", borderRadius: 2 }}
                >
                  {deleteAllPhotosMutation.isPending ? t("deleting") : t("chargeManagement@media.deleteAll")}
                </Button>
              )}
              <input ref={photosInputRef} type="file" accept="image/*" multiple hidden onChange={handlePhotosFileChange} />
              <Button
                variant="contained"
                startIcon={uploadPhotosMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <AddPhotoAlternateIcon />}
                onClick={handleAddPhotosClick}
                disabled={uploadPhotosMutation.isPending}
                sx={{
                  background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)",
                  "&:hover": { background: "linear-gradient(135deg, #0a3880 0%, #0d47a1 100%)" },
                  fontWeight: 600,
                }}
              >
                {uploadPhotosMutation.isPending ? t("uploading") : t("chargeManagement@media.addPhotos")}
              </Button>
            </Stack>
          </Stack>

          <Box sx={{ p: 3 }}>
            {isLoadingPhotos ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress />
              </Box>
            ) : photos.length === 0 ? (
              <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
                <PhotoLibraryIcon sx={{ fontSize: 48, color: "action.disabled" }} />
                <Typography variant="body2" color="text.secondary">{t("chargeManagement@media.noPhotos")}</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddPhotoAlternateIcon />}
                  onClick={handleAddPhotosClick}
                  size="small"
                >
                  {t("chargeManagement@media.addPhotos")}
                </Button>
              </Stack>
            ) : (
              <Grid container spacing={2}>
                {photos.map((photo, index) => {
                  const url = getPhotoUrl(photo);
                  const attachmentId = getStationAttachmentId(photo);
                  const deletePending =
                    deletePhotoMutation.isPending || deleteAllPhotosMutation.isPending;
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={attachmentId ?? photo.id ?? index}>
                      <Box
                        sx={{
                          position: "relative",
                          borderRadius: 2,
                          overflow: "hidden",
                          bgcolor: "action.hover",
                          aspectRatio: "1",
                          border: "1px solid",
                          borderColor: "divider",
                          "&:hover .overlay": { opacity: 1 },
                        }}
                      >
                        <Tooltip
                          title={
                            attachmentId == null
                              ? t("chargeManagement@media.deleteUnavailable")
                              : t("delete")
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={t("delete")}
                              sx={{
                                position: "absolute",
                                top: 6,
                                right: 6,
                                zIndex: 2,
                                bgcolor: "rgba(255,255,255,0.95)",
                                "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                              }}
                              disabled={attachmentId == null || deletePending}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (attachmentId != null) handleDeleteOnePhoto(attachmentId);
                              }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        {url ? (
                          <Box component="img" src={url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Typography variant="caption" color="text.secondary">{t("NA")}</Typography>
                          </Box>
                        )}
                        {url && (
                          <Box
                            className="overlay"
                            onClick={() => window.open(url, "_blank")}
                            sx={{
                              position: "absolute", inset: 0,
                              bgcolor: "rgba(0,0,0,0.3)", opacity: 0, transition: "opacity 0.2s",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Typography variant="caption" sx={{ color: "white", fontWeight: 700, bgcolor: "rgba(0,0,0,0.5)", px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: "0.7rem" }}>
                              {t("viewDetails")}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </Paper>
      </Box>
    </AppScreenContainer>
  );
}
