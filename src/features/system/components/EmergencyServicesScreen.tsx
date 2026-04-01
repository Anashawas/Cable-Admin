import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Avatar,
  Paper,
  Divider,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PhoneIcon from "@mui/icons-material/Phone";
import RefreshIcon from "@mui/icons-material/Refresh";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LinkIcon from "@mui/icons-material/Link";
import SortIcon from "@mui/icons-material/Sort";
import CategoryIcon from "@mui/icons-material/Category";
import ImageIcon from "@mui/icons-material/Image";
import AppScreenContainer from "../../app/components/AppScreenContainer";
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

  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ["emergency-services"],
    queryFn: ({ signal }) => getAll(signal),
  });

  const addMutation = useMutation({
    mutationFn: (body: EmergencyServicePayload) => add(body),
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: EmergencyServicePayload }) => update(id, body),
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadIcon(id, file),
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-services"] });
      openSuccessSnackbar({ message: t("platform@emergency.deleted") });
      setDeleteOpen(false);
      setServiceToDelete(null);
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
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
  }, [form, editing, imageFile, addMutation, updateMutation, invalidate, openSuccessSnackbar, openErrorSnackbar, t, handleCloseModal]);

  const handleDeleteClick = useCallback((s: EmergencyServiceDto) => {
    setServiceToDelete(s);
    setDeleteOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (serviceToDelete) deleteMutation.mutate(serviceToDelete.id);
  }, [serviceToDelete, deleteMutation]);

  const isSaving = addMutation.isPending || updateMutation.isPending || uploadMutation.isPending;
  const activeCount = services.filter((s) => s.isActive).length;

  return (
    <AppScreenContainer>
      {/* ── Gradient Page Header ── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #b71c1c 0%, #e53935 60%, #ef5350 100%)",
          borderRadius: 3,
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: "absolute", top: -30, left: -30, width: 120, height: 120, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)" }} />
        <Box sx={{ position: "absolute", bottom: -20, left: 80, width: 80, height: 80, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)" }} />

        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.15)", width: 52, height: 52 }}>
              <LocalHospitalIcon sx={{ fontSize: 28, color: "#fff" }} />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#fff">
                {t("platform@emergency.title")}
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }} flexWrap="wrap">
                <Chip
                  label={`${services.length} ${t("platform@emergency.total") ?? "Total"}`}
                  size="small"
                  sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600 }}
                />
                <Chip
                  label={`${activeCount} ${t("platform@emergency.active")}`}
                  size="small"
                  sx={{ bgcolor: "rgba(76,175,80,0.3)", color: "#fff", fontWeight: 600 }}
                />
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title={t("refresh")}>
              <IconButton onClick={() => refetch()} sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.22)" } }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              sx={{
                bgcolor: "rgba(255,255,255,0.18)",
                color: "#fff",
                fontWeight: 700,
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.3)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
              }}
            >
              {t("platform@emergency.add")}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* ── Cards Grid ── */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="error" />
        </Box>
      ) : services.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            border: "2px dashed",
            borderColor: "error.200",
            borderRadius: 3,
            py: 8,
            textAlign: "center",
            bgcolor: "error.50",
          }}
        >
          <LocalHospitalIcon sx={{ fontSize: 56, color: "error.300", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            {t("platform@emergency.noServices")}
          </Typography>
          <Button variant="contained" color="error" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ mt: 2 }}>
            {t("platform@emergency.add")}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {services.map((s) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={s.id}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: s.isActive ? "error.100" : "divider",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: 6 },
                }}
              >
                {/* Card top strip */}
                <Box
                  sx={{
                    height: 6,
                    background: s.isActive
                      ? "linear-gradient(90deg, #e53935, #ef5350)"
                      : "linear-gradient(90deg, #9e9e9e, #bdbdbd)",
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                  }}
                />

                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  {/* Header row */}
                  <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Avatar
                      src={s.imageUrl ?? undefined}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: s.isActive ? "error.100" : "grey.200",
                        flexShrink: 0,
                      }}
                    >
                      <LocalHospitalIcon sx={{ color: s.isActive ? "error.main" : "grey.500" }} />
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="subtitle1" fontWeight={700} noWrap>
                        {s.title}
                      </Typography>
                      {s.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {s.description}
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  {/* Status + type chips */}
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
                    <Chip
                      size="small"
                      label={s.isActive ? t("platform@emergency.active") : t("platform@emergency.inactive")}
                      color={s.isActive ? "success" : "default"}
                      variant={s.isActive ? "filled" : "outlined"}
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      size="small"
                      icon={<CategoryIcon sx={{ fontSize: "14px !important" }} />}
                      label={`${t("platform@emergency.type")}: ${s.subscriptionType}`}
                      variant="outlined"
                      color="primary"
                    />
                    {s.sortOrder !== undefined && (
                      <Chip
                        size="small"
                        icon={<SortIcon sx={{ fontSize: "14px !important" }} />}
                        label={`#${s.sortOrder}`}
                        variant="outlined"
                        sx={{ color: "text.secondary" }}
                      />
                    )}
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Contact info */}
                  <Stack spacing={0.75}>
                    {s.phoneNumber && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneIcon sx={{ fontSize: 16, color: "primary.main", flexShrink: 0 }} />
                        <Typography variant="body2" fontWeight={500}>{s.phoneNumber}</Typography>
                      </Stack>
                    )}
                    {s.whatsAppNumber && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <WhatsAppIcon sx={{ fontSize: 16, color: "success.main", flexShrink: 0 }} />
                        <Typography variant="body2" fontWeight={500}>{s.whatsAppNumber}</Typography>
                      </Stack>
                    )}
                    {(s.openFrom || s.openTo) && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTimeIcon sx={{ fontSize: 16, color: "warning.main", flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary">
                          {s.openFrom ?? "—"} – {s.openTo ?? "—"}
                        </Typography>
                      </Stack>
                    )}
                    {s.priceDetails && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
                        {s.priceDetails}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>

                {/* Actions footer */}
                <Divider />
                <Stack direction="row" justifyContent="flex-end" spacing={0.5} sx={{ px: 1.5, py: 1 }}>
                  {s.phoneNumber && (
                    <Tooltip title={t("platform@emergency.call")}>
                      <IconButton component="a" href={`tel:${s.phoneNumber}`} size="small" color="primary">
                        <PhoneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title={t("edit")}>
                    <IconButton size="small" onClick={() => handleOpenEdit(s)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("delete")}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(s)}
                      disabled={deleteMutation.isPending}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Add / Edit Dialog ── */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, display: "flex", flexDirection: "column", maxHeight: "90vh" } }}
      >
        {/* Dialog gradient header */}
        <Box
          sx={{
            background: editing
              ? "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)"
              : "linear-gradient(135deg, #b71c1c 0%, #e53935 100%)",
            px: 3, py: 2.5, flexShrink: 0,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}>
              {editing ? <EditIcon /> : <AddIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#fff">
                {editing ? t("platform@emergency.edit") : t("platform@emergency.add")}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>
                {t("platform@emergency.title")}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ overflowY: "auto", flex: 1, p: 3 }}>
          <Stack spacing={3}>
            {/* Basic Info */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.5 }}>
                {t("platform@emergency.sectionBasic") ?? "Basic Information"}
              </Typography>
              <Stack spacing={2}>
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
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <TextField
                      label={t("platform@emergency.subscriptionType")}
                      type="number"
                      required
                      fullWidth
                      value={form.subscriptionType}
                      onChange={(e) => setForm((f) => ({ ...f, subscriptionType: Number(e.target.value) || 1 }))}
                      inputProps={{ min: 1 }}
                      InputProps={{ startAdornment: <InputAdornment position="start"><CategoryIcon fontSize="small" color="action" /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      label={t("platform@emergency.sortOrder")}
                      type="number"
                      required
                      fullWidth
                      value={form.sortOrder}
                      onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
                      inputProps={{ min: 0 }}
                      InputProps={{ startAdornment: <InputAdornment position="start"><SortIcon fontSize="small" color="action" /></InputAdornment> }}
                    />
                  </Grid>
                </Grid>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      color="success"
                    />
                  }
                  label={<Typography variant="body2" fontWeight={600}>{t("platform@emergency.isActive")}</Typography>}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Contact Info */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.5 }}>
                {t("platform@emergency.sectionContact") ?? "Contact Information"}
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label={t("platform@emergency.phone")}
                  fullWidth
                  value={form.phoneNumber ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value || null }))}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" color="action" /></InputAdornment> }}
                />
                <TextField
                  label={t("platform@emergency.whatsApp")}
                  fullWidth
                  value={form.whatsAppNumber ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, whatsAppNumber: e.target.value || null }))}
                  InputProps={{ startAdornment: <InputAdornment position="start"><WhatsAppIcon fontSize="small" color="action" /></InputAdornment> }}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Availability */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.5 }}>
                {t("platform@emergency.sectionAvailability") ?? "Availability"}
              </Typography>
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <TextField
                      label={t("platform@emergency.openFrom")}
                      fullWidth
                      placeholder="08:00"
                      value={form.openFrom ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, openFrom: e.target.value || null }))}
                      InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeIcon fontSize="small" color="action" /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      label={t("platform@emergency.openTo")}
                      fullWidth
                      placeholder="22:00"
                      value={form.openTo ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, openTo: e.target.value || null }))}
                      InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeIcon fontSize="small" color="action" /></InputAdornment> }}
                    />
                  </Grid>
                </Grid>
                <TextField
                  label={t("platform@emergency.priceDetails")}
                  fullWidth
                  value={form.priceDetails ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, priceDetails: e.target.value || null }))}
                />
                <TextField
                  label={t("platform@emergency.actionUrl")}
                  fullWidth
                  placeholder="https://..."
                  value={form.actionUrl ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, actionUrl: e.target.value || null }))}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon fontSize="small" color="action" /></InputAdornment> }}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Image Upload */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.5 }}>
                {t("platform@emergency.imageUpload")}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={imageFile ? URL.createObjectURL(imageFile) : (form.imageUrl ?? undefined)}
                  sx={{ width: 64, height: 64, bgcolor: "error.50", border: "2px dashed", borderColor: "error.200" }}
                >
                  <ImageIcon color="error" />
                </Avatar>
                <Box>
                  <Button variant="outlined" color="error" component="label" size="small">
                    {t("platform@emergency.chooseFile")}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    />
                  </Button>
                  {(imageFile?.name || form.imageUrl) && (
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {imageFile?.name ?? form.imageUrl}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <Divider sx={{ flexShrink: 0 }} />
        <DialogActions sx={{ px: 3, py: 2, gap: 1, flexShrink: 0 }}>
          <Button onClick={handleCloseModal} disabled={isSaving} size="large">
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            color={editing ? "primary" : "error"}
            size="large"
            onClick={handleSave}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : editing ? <EditIcon /> : <AddIcon />}
          >
            {isSaving ? t("saving") ?? "Saving..." : t("save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog
        open={deleteOpen}
        onClose={() => !deleteMutation.isPending && setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)",
            px: 3, py: 2.5,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}>
              <WarningAmberIcon sx={{ color: "#fff" }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700} color="#fff">
              {t("platform@emergency.deleteTitle")}
            </Typography>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography color="text.secondary">
            {t("platform@emergency.deleteMessage")}{" "}
            <Typography component="span" fontWeight={700} color="text.primary">
              {serviceToDelete?.title}
            </Typography>
            ?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleteMutation.isPending} size="large">
            {t("cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            size="large"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {deleteMutation.isPending ? t("deleting") ?? "Deleting..." : t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
