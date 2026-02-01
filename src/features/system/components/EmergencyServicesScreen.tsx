import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PhoneIcon from "@mui/icons-material/Phone";
import RefreshIcon from "@mui/icons-material/Refresh";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import {
  getAll,
  add,
  update,
  remove,
  uploadIcon,
} from "../services/emergency-service";
import type { EmergencyServiceDto, EmergencyServicePayload } from "../types/api";
import { useSnackbarStore } from "../../../stores";

const defaultPayload: EmergencyServicePayload = {
  title: "",
  description: null,
  imageUrl: null,
  subscriptionType: 1,
  priceDetails: null,
  actionUrl: null,
  openFrom: null,
  openTo: null,
  phoneNumber: null,
  whatsAppNumber: null,
  isActive: true,
  sortOrder: 1,
};

export default function EmergencyServicesScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmergencyServiceDto | null>(null);
  const [form, setForm] = useState<EmergencyServicePayload>(defaultPayload);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<EmergencyServiceDto | null>(null);

  const { data: services = [], isLoading, error, refetch } = useQuery({
    queryKey: ["emergency-services"],
    queryFn: ({ signal }) => getAll(signal),
  });

  const addMutation = useMutation({
    mutationFn: (body: EmergencyServicePayload) => add(body),
    onError: (err: Error) =>
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: EmergencyServicePayload }) =>
      update(id, body),
    onError: (err: Error) =>
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadIcon(id, file),
    onError: (err: Error) =>
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-services"] });
      openSuccessSnackbar({ message: t("platform@emergency.deleted") });
      setDeleteOpen(false);
      setServiceToDelete(null);
    },
    onError: (err: Error) =>
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["emergency-services"] });
  }, [queryClient]);

  const handleOpenAdd = useCallback(() => {
    setEditing(null);
    setForm(defaultPayload);
    setImageFile(null);
    setModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((s: EmergencyServiceDto) => {
    setEditing(s);
    setForm({
      title: s.title ?? "",
      description: s.description ?? null,
      imageUrl: s.imageUrl ?? null,
      subscriptionType: s.subscriptionType ?? 1,
      priceDetails: s.priceDetails ?? null,
      actionUrl: s.actionUrl ?? null,
      openFrom: s.openFrom ?? null,
      openTo: s.openTo ?? null,
      phoneNumber: s.phoneNumber ?? null,
      whatsAppNumber: s.whatsAppNumber ?? null,
      isActive: s.isActive ?? true,
      sortOrder: s.sortOrder ?? 1,
    });
    setImageFile(null);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    if (!addMutation.isPending && !updateMutation.isPending && !uploadMutation.isPending) {
      setModalOpen(false);
      setEditing(null);
      setForm(defaultPayload);
      setImageFile(null);
    }
  }, [addMutation.isPending, updateMutation.isPending, uploadMutation.isPending]);

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) {
      openErrorSnackbar({ message: t("platform@emergency.titleRequired") });
      return;
    }
    const payload: EmergencyServicePayload = {
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() || null,
      phoneNumber: form.phoneNumber?.trim() || null,
      whatsAppNumber: form.whatsAppNumber?.trim() || null,
      openFrom: form.openFrom?.trim() || null,
      openTo: form.openTo?.trim() || null,
      actionUrl: form.actionUrl?.trim() || null,
      priceDetails: form.priceDetails?.trim() || null,
    };

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, body: payload },
        {
          onSuccess: async () => {
            if (imageFile) {
              try {
                const filePath = await uploadIcon(editing.id, imageFile);
                await update(editing.id, { ...payload, imageUrl: filePath });
                invalidate();
                openSuccessSnackbar({ message: t("platform@emergency.updated") });
                handleCloseModal();
              } catch (e) {
                openErrorSnackbar({ message: (e as Error)?.message ?? t("loadingFailed") });
              }
            } else {
              invalidate();
              openSuccessSnackbar({ message: t("platform@emergency.updated") });
              handleCloseModal();
            }
          },
        }
      );
    } else {
      addMutation.mutate(payload, {
        onSuccess: async (newId) => {
          if (imageFile) {
            try {
              const filePath = await uploadIcon(newId, imageFile);
              await update(newId, { ...payload, imageUrl: filePath });
              invalidate();
              openSuccessSnackbar({ message: t("platform@emergency.added") });
              handleCloseModal();
            } catch (e) {
              openErrorSnackbar({ message: (e as Error)?.message ?? t("loadingFailed") });
            }
          } else {
            invalidate();
            openSuccessSnackbar({ message: t("platform@emergency.added") });
            handleCloseModal();
          }
        },
      });
    }
  }, [
    form,
    editing,
    imageFile,
    addMutation,
    updateMutation,
    invalidate,
    openSuccessSnackbar,
    openErrorSnackbar,
    t,
    handleCloseModal,
  ]);

  const handleDeleteClick = useCallback((s: EmergencyServiceDto) => {
    setServiceToDelete(s);
    setDeleteOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (serviceToDelete) deleteMutation.mutate(serviceToDelete.id);
  }, [serviceToDelete, deleteMutation]);

  const isSaving =
    addMutation.isPending || updateMutation.isPending || uploadMutation.isPending;

  if (error) {
    return (
      <AppScreenContainer>
        <Box p={2}>
          <Typography color="error">{t("loadingFailed")}</Typography>
        </Box>
      </AppScreenContainer>
    );
  }

  return (
    <AppScreenContainer>
      <Box sx={{ width: "100%", minWidth: 0, p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <ScreenHeader
            title={t("platform@emergency.title")}
            actions={[
              {
                id: "refresh",
                icon: <RefreshIcon />,
                label: t("refresh"),
                onClick: () => refetch(),
              },
            ]}
          />

          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
              {t("platform@emergency.add")}
            </Button>
          </Stack>

          <Grid container spacing={2}>
            {isLoading ? (
              <Grid size={12}>
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              </Grid>
            ) : services.length === 0 ? (
              <Grid size={12}>
                <Typography color="text.secondary" sx={{ py: 4 }}>
                  {t("platform@emergency.noServices")}
                </Typography>
              </Grid>
            ) : (
              services.map((s) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={s.id}>
                  <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="600">
                        {s.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {s.description ?? "—"}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                        <Chip
                          size="small"
                          label={s.isActive ? t("platform@emergency.active") : t("platform@emergency.inactive")}
                          color={s.isActive ? "success" : "default"}
                        />
                        <Chip size="small" label={`${t("platform@emergency.type")}: ${s.subscriptionType}`} variant="outlined" />
                      </Stack>
                      {s.phoneNumber && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {t("platform@emergency.phone")}: {s.phoneNumber}
                        </Typography>
                      )}
                      {s.whatsAppNumber && (
                        <Typography variant="body2">
                          WhatsApp: {s.whatsAppNumber}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions disableSpacing sx={{ justifyContent: "flex-end" }}>
                      {s.phoneNumber && (
                        <IconButton
                          component="a"
                          href={`tel:${s.phoneNumber}`}
                          size="small"
                          color="primary"
                          aria-label={t("platform@emergency.call")}
                        >
                          <PhoneIcon />
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={() => handleOpenEdit(s)} aria-label={t("edit")}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(s)}
                        disabled={deleteMutation.isPending}
                        aria-label={t("delete")}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Stack>
      </Box>

      {/* Add/Edit modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editing ? t("platform@emergency.edit") : t("platform@emergency.add")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t("platform@emergency.titleLabel")}
              required
              fullWidth
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <TextField
              label={t("platform@emergency.description")}
              fullWidth
              multiline
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))}
            />
            <TextField
              label={t("platform@emergency.subscriptionType")}
              type="number"
              required
              fullWidth
              value={form.subscriptionType}
              onChange={(e) => setForm((f) => ({ ...f, subscriptionType: Number(e.target.value) || 1 }))}
              inputProps={{ min: 1 }}
            />
            <TextField
              label={t("platform@emergency.sortOrder")}
              type="number"
              required
              fullWidth
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
              inputProps={{ min: 0 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  color="primary"
                />
              }
              label={t("platform@emergency.isActive")}
            />
            <TextField
              label={t("platform@emergency.phone")}
              fullWidth
              value={form.phoneNumber ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value || null }))}
            />
            <TextField
              label={t("platform@emergency.whatsApp")}
              fullWidth
              value={form.whatsAppNumber ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, whatsAppNumber: e.target.value || null }))}
            />
            <TextField
              label={t("platform@emergency.openFrom")}
              fullWidth
              placeholder="08:00"
              value={form.openFrom ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, openFrom: e.target.value || null }))}
            />
            <TextField
              label={t("platform@emergency.openTo")}
              fullWidth
              placeholder="22:00"
              value={form.openTo ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, openTo: e.target.value || null }))}
            />
            <TextField
              label={t("platform@emergency.actionUrl")}
              fullWidth
              placeholder="https://..."
              value={form.actionUrl ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, actionUrl: e.target.value || null }))}
            />
            <TextField
              label={t("platform@emergency.priceDetails")}
              fullWidth
              value={form.priceDetails ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, priceDetails: e.target.value || null }))}
            />
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t("platform@emergency.imageUpload")}
              </Typography>
              <Button variant="outlined" component="label" size="small">
                {t("platform@emergency.chooseFile")}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
              </Button>
              {(imageFile?.name || form.imageUrl) && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  {imageFile?.name ?? form.imageUrl}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit" disabled={isSaving}>
            {t("cancel")}
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t("save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onClose={() => !deleteMutation.isPending && setDeleteOpen(false)}>
        <DialogTitle>{t("platform@emergency.deleteTitle")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("platform@emergency.deleteMessage")} {serviceToDelete?.title}?
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
            {deleteMutation.isPending ? <CircularProgress size={20} /> : t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
