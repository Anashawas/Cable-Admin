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
  Stack,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  getAllBanners,
  addBanner,
  uploadBannerImage,
  deleteBanner,
} from "../services/banner-service";
import type { BannerDto, AddBannerRequest } from "../types/api";
import { useSnackbarStore } from "../../../stores";

const defaultForm: AddBannerRequest = {
  name: "",
  phone: "",
  email: "",
  startDate: "",
  endDate: "",
  actionType: null,
  actionUrl: null,
};

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
    addMutation.mutate(form);
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
                <CardActions disableSpacing sx={{ justifyContent: "flex-end" }}>
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
                label={t("platform@banners.actionUrl")}
                fullWidth
                placeholder="https://..."
                value={form.actionUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, actionUrl: e.target.value || null }))}
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
    </Box>
  );
}
