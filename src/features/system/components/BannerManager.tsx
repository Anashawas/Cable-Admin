import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
  Stack,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import InsightsIcon from "@mui/icons-material/Insights";
import AnalyticsDialog from "../../analytics/components/AnalyticsDialog";
import LocationPicker from "../../charge-management/components/LocationPicker";
import {
  getAllBanners,
  addBanner,
  uploadBannerImage,
  deleteBanner,
} from "../services/banner-service";
import type { BannerDto, AddBannerRequest } from "../types/api";
import { useSnackbarStore } from "../../../stores";

/** The 12 canonical Jordan cities (must match the mobile app's whitelist). */
const JORDAN_CITIES = [
  "Amman", "Zarqa", "Irbid", "Salt", "Mafraq", "Madaba",
  "Jerash", "Ajloun", "Karak", "Tafilah", "Maan", "Aqaba",
];

const defaultForm: AddBannerRequest = {
  name: "",
  phone: "",
  email: "",
  startDate: "",
  endDate: "",
  actionType: null,
  actionUrl: null,
  targetType: "national",
  targetCity: null,
  centerLat: null,
  centerLng: null,
  radiusKm: 15,
  priority: 0,
};

/** Strips targeting fields that don't apply to the chosen target type. */
function buildBannerPayload(form: AddBannerRequest): AddBannerRequest {
  const payload: AddBannerRequest = { ...form };
  if (form.targetType === "national") {
    payload.targetCity = null;
    payload.centerLat = null;
    payload.centerLng = null;
    payload.radiusKm = null;
  } else if (form.targetType === "city") {
    payload.centerLat = null;
    payload.centerLng = null;
    payload.radiusKm = null;
  } else if (form.targetType === "radius") {
    payload.targetCity = null;
  }
  return payload;
}

export default function BannerManager() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<AddBannerRequest>(defaultForm);
  const [newBannerId, setNewBannerId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<BannerDto | null>(null);
  const [analyticsBanner, setAnalyticsBanner] = useState<BannerDto | null>(null);

  const { data: banners = [], isLoading, error, refetch } = useQuery({
    queryKey: ["banners"],
    queryFn: ({ signal }) => getAllBanners(signal),
  });

  const addMutation = useMutation({
    mutationFn: (body: AddBannerRequest) => addBanner(body),
    onSuccess: (id) => {
      setNewBannerId(id);
      setAddStep(2);
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      uploadBannerImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      openSuccessSnackbar({ message: t("platform@banners.imageUploaded") });
      handleCloseAdd();
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      openSuccessSnackbar({ message: t("platform@banners.deleted") });
      setDeleteOpen(false);
      setBannerToDelete(null);
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const handleOpenAdd = useCallback(() => {
    setForm(defaultForm);
    setNewBannerId(null);
    setImageFile(null);
    setAddStep(1);
    setAddOpen(true);
  }, []);

  const handleCloseAdd = useCallback(() => {
    if (!addMutation.isPending && !uploadMutation.isPending) {
      setAddOpen(false);
      setAddStep(1);
      setForm(defaultForm);
      setNewBannerId(null);
      setImageFile(null);
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    }
  }, [addMutation.isPending, uploadMutation.isPending, queryClient]);

  const handleSubmitStep1 = useCallback(() => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.startDate || !form.endDate) {
      openErrorSnackbar({ message: t("platform@banners.requiredFields") });
      return;
    }
    // Targeting validation.
    if (form.targetType === "city" && !form.targetCity) {
      openErrorSnackbar({ message: t("platform@banners.targetCityRequired") });
      return;
    }
    if (
      form.targetType === "radius" &&
      (form.centerLat == null || form.centerLng == null || !form.radiusKm || form.radiusKm <= 0)
    ) {
      openErrorSnackbar({ message: t("platform@banners.targetRadiusRequired") });
      return;
    }
    addMutation.mutate(buildBannerPayload(form));
  }, [form, addMutation, openErrorSnackbar, t]);

  const handleUploadImage = useCallback(() => {
    if (newBannerId == null) return;
    if (imageFile) {
      uploadMutation.mutate({ id: newBannerId, file: imageFile });
    } else {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      openSuccessSnackbar({ message: t("platform@banners.created") });
      handleCloseAdd();
    }
  }, [newBannerId, imageFile, uploadMutation, queryClient, openSuccessSnackbar, t, handleCloseAdd]);

  const handleSkipImage = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["banners"] });
    openSuccessSnackbar({ message: t("platform@banners.created") });
    handleCloseAdd();
  }, [queryClient, openSuccessSnackbar, t, handleCloseAdd]);

  const handleDeleteClick = useCallback((banner: BannerDto) => {
    setBannerToDelete(banner);
    setDeleteOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (bannerToDelete) deleteMutation.mutate(bannerToDelete.id);
  }, [bannerToDelete, deleteMutation]);

  const firstImage = (b: BannerDto) =>
    b.bannerAttachments?.[0]?.filePath ?? null;
  const firstDuration = (b: BannerDto) =>
    b.bannerDurations?.[0];

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{t("loadingFailed")}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshIcon />} onClick={() => refetch()} size="small">
            {t("refresh")}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            {t("platform@banners.addBanner")}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        {isLoading ? (
          <Grid size={12}>
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          </Grid>
        ) : banners.length === 0 ? (
          <Grid size={12}>
            <Typography color="text.secondary" sx={{ py: 4 }}>
              {t("platform@banners.noBanners")}
            </Typography>
          </Grid>
        ) : (
          banners.map((b) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={b.id}>
              <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={firstImage(b) ?? undefined}
                  alt={b.name}
                  sx={{ objectFit: "cover", bgcolor: "grey.200" }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="600">
                    {b.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {b.phone}
                  </Typography>
                  {firstDuration(b) && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      {firstDuration(b).startDate} — {firstDuration(b).endDate}
                    </Typography>
                  )}
                </CardContent>
                <CardActions disableSpacing sx={{ justifyContent: "space-between" }}>
                  <Button
                    size="small"
                    color="success"
                    startIcon={<InsightsIcon />}
                    onClick={() => setAnalyticsBanner(b)}
                  >
                    {t("analytics@manage")}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteClick(b)}
                    disabled={deleteMutation.isPending}
                  >
                    {t("delete")}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Add Banner Modal — Step 1: metadata */}
      <Dialog open={addOpen} onClose={handleCloseAdd} maxWidth="sm" fullWidth>
        <DialogTitle>
          {addStep === 1 ? t("platform@banners.addBanner") : t("platform@banners.uploadImage")}
        </DialogTitle>
        <DialogContent>
          {addStep === 1 ? (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label={t("name")}
                required
                fullWidth
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <TextField
                label={t("platform@banners.phone")}
                required
                fullWidth
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <TextField
                label={t("platform@banners.email")}
                required
                fullWidth
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <TextField
                label={t("platform@banners.startDate")}
                required
                fullWidth
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
              <TextField
                label={t("platform@banners.endDate")}
                required
                fullWidth
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
              <TextField
                select
                label={t("platform@banners.actionType")}
                fullWidth
                value={form.actionType ?? 0}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    actionType: Number(e.target.value) || null,
                  }))
                }
              >
                <MenuItem value={0}>{t("platform@banners.actionNone")}</MenuItem>
                <MenuItem value={1}>{t("platform@banners.action1")}</MenuItem>
                <MenuItem value={2}>{t("platform@banners.action2")}</MenuItem>
                <MenuItem value={3}>{t("platform@banners.action3")}</MenuItem>
                <MenuItem value={4}>{t("platform@banners.action4")}</MenuItem>
                <MenuItem value={5}>{t("platform@banners.action5")}</MenuItem>
              </TextField>
              <TextField
                label={t("platform@banners.actionUrl")}
                fullWidth
                placeholder="https://..."
                value={form.actionUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, actionUrl: e.target.value || null }))}
              />

              <Divider textAlign="left">
                {t("platform@banners.targetingSection")}
              </Divider>

              <TextField
                select
                label={t("platform@banners.targetType")}
                fullWidth
                value={form.targetType ?? "national"}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    targetType: e.target.value as AddBannerRequest["targetType"],
                  }))
                }
              >
                <MenuItem value="national">{t("platform@banners.targetNational")}</MenuItem>
                <MenuItem value="city">{t("platform@banners.targetCityOpt")}</MenuItem>
                <MenuItem value="radius">{t("platform@banners.targetRadius")}</MenuItem>
              </TextField>

              {form.targetType === "city" && (
                <TextField
                  select
                  label={t("platform@banners.targetCity")}
                  fullWidth
                  value={form.targetCity ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, targetCity: e.target.value || null }))
                  }
                >
                  {JORDAN_CITIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              {form.targetType === "radius" && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    {t("platform@banners.pickCenterHint")}
                  </Typography>
                  <Box sx={{ height: 300, borderRadius: 1, overflow: "hidden" }}>
                    <LocationPicker
                      latitude={form.centerLat ?? 0}
                      longitude={form.centerLng ?? 0}
                      radiusMeters={(form.radiusKm ?? 0) * 1000}
                      onLocationSelect={(lat, lng) =>
                        setForm((f) => ({ ...f, centerLat: lat, centerLng: lng }))
                      }
                    />
                  </Box>
                  <TextField
                    label={t("platform@banners.radiusKm")}
                    type="number"
                    fullWidth
                    value={form.radiusKm ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        radiusKm: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                  />
                </>
              )}

              <TextField
                label={t("platform@banners.priority")}
                type="number"
                fullWidth
                helperText={t("platform@banners.priorityHint")}
                value={form.priority ?? 0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))
                }
              />
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t("platform@banners.uploadImageHint")}
              </Typography>
              <Button variant="outlined" component="label">
                {t("platform@banners.chooseFile")}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
              </Button>
              {imageFile && (
                <Typography variant="caption">{imageFile.name}</Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {addStep === 1 ? (
            <>
              <Button onClick={handleCloseAdd} color="inherit">
                {t("cancel")}
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitStep1}
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  t("next")
                )}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleSkipImage} color="inherit" disabled={uploadMutation.isPending}>
                {t("platform@banners.skip")}
              </Button>
              <Button
                variant="contained"
                onClick={handleUploadImage}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  t("platform@banners.upload")
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onClose={() => !deleteMutation.isPending && setDeleteOpen(false)}>
        <DialogTitle>{t("platform@banners.deleteConfirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("platform@banners.deleteConfirmMessage")} {bannerToDelete?.name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} color="inherit" disabled={deleteMutation.isPending}>
            {t("cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("delete")
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <AnalyticsDialog
        open={analyticsBanner != null}
        entityType="Banner"
        entityId={analyticsBanner?.id ?? null}
        entityName={analyticsBanner?.name ?? undefined}
        onClose={() => setAnalyticsBanner(null)}
      />
    </Box>
  );
}
