import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Avatar,
  Paper,
  Switch,
  CircularProgress,
  Skeleton,
  Divider,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LockIcon from "@mui/icons-material/Lock";
import BadgeIcon from "@mui/icons-material/Badge";
import DeleteIcon from "@mui/icons-material/Delete";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import { useSnackbarStore } from "../../../stores";
import {
  useWorker,
  useCreateWorker,
  useSetWorkerActive,
  useDeleteWorker,
} from "../hooks/use-workers";
import type { WorkerProviderType } from "../types/api";

interface WorkerDialogProps {
  open: boolean;
  onClose: () => void;
  providerType: WorkerProviderType;
  providerId: number;
  providerName?: string | null;
}

const emptyForm = { name: "", email: "", phone: "", password: "" };

export default function WorkerDialog({
  open,
  onClose,
  providerType,
  providerId,
  providerName,
}: WorkerDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: worker, isLoading } = useWorker(
    open ? providerType : null,
    open ? providerId : null
  );
  const createMutation = useCreateWorker(providerType, providerId);
  const setActiveMutation = useSetWorkerActive(providerType, providerId);
  const deleteMutation = useDeleteWorker(providerType, providerId);

  // Reset transient state whenever the dialog (re)opens or the target changes.
  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setShowPassword(false);
      setConfirmDelete(false);
    }
  }, [open, providerType, providerId]);

  const errorDetail = (err: any) =>
    err?.response?.data?.detail ||
    err?.response?.data?.title ||
    err?.message ||
    t("loadingFailed");

  const handleCreate = () => {
    if (!form.name.trim()) return openErrorSnackbar({ message: t("workers@nameRequired") });
    if (!form.email.trim()) return openErrorSnackbar({ message: t("workers@emailRequired") });
    if (!form.phone.trim()) return openErrorSnackbar({ message: t("workers@phoneRequired") });
    if (form.password.length < 6) return openErrorSnackbar({ message: t("workers@passwordTooShort") });

    createMutation.mutate(
      {
        providerType,
        providerId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      },
      {
        onSuccess: () => openSuccessSnackbar({ message: t("workers@created") }),
        onError: (err) => openErrorSnackbar({ message: errorDetail(err) }),
      }
    );
  };

  const handleToggleActive = (next: boolean) => {
    if (!worker) return;
    setActiveMutation.mutate(
      { providerManagerId: worker.providerManagerId, isActive: next },
      {
        onSuccess: () =>
          openSuccessSnackbar({ message: next ? t("workers@activated") : t("workers@deactivated") }),
        onError: (err) => openErrorSnackbar({ message: errorDetail(err) }),
      }
    );
  };

  const handleDelete = () => {
    if (!worker) return;
    deleteMutation.mutate(worker.providerManagerId, {
      onSuccess: () => {
        openSuccessSnackbar({ message: t("workers@deleted") });
        setConfirmDelete(false);
      },
      onError: (err) => openErrorSnackbar({ message: errorDetail(err) }),
    });
  };

  const busy = createMutation.isPending || setActiveMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog
      open={open}
      onClose={() => { if (!busy) onClose(); }}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <DialogTitle sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, color: "#fff", pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BadgeIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="#fff">{t("workers@title")}</Typography>
              {providerName && (
                <Typography variant="caption" sx={{ opacity: 0.8, color: "#fff" }}>{providerName}</Typography>
              )}
            </Box>
          </Stack>
          <IconButton size="small" onClick={onClose} disabled={busy} sx={{ color: "rgba(255,255,255,0.85)", "&:hover": { color: "#fff" } }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {isLoading ? (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={48} />
          </Stack>
        ) : worker ? (
          /* ── Existing worker card ── */
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 48, height: 48, bgcolor: "primary.main", fontWeight: 700 }}>
                  {worker.name.slice(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>{worker.name}</Typography>
                  <Stack direction="row" spacing={1.5} flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary"><EmailIcon sx={{ fontSize: 12, mr: 0.3, verticalAlign: "middle" }} />{worker.email}</Typography>
                    <Typography variant="caption" color="text.secondary"><PhoneIcon sx={{ fontSize: 12, mr: 0.3, verticalAlign: "middle" }} />{worker.phone}</Typography>
                  </Stack>
                </Box>
              </Stack>
            </Paper>

            <Paper
              variant="outlined"
              sx={{ px: 2, py: 1, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderColor: worker.isActive ? "success.light" : "divider" }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                {worker.isActive ? <CheckCircleOutlineIcon color="success" sx={{ fontSize: 20 }} /> : <BlockIcon color="disabled" sx={{ fontSize: 20 }} />}
                <Box>
                  <Typography variant="body2" fontWeight={600} color={worker.isActive ? "success.dark" : "text.secondary"}>
                    {worker.isActive ? t("active") : t("inactive")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{t("workers@activeHint")}</Typography>
                </Box>
              </Stack>
              <Switch
                checked={worker.isActive}
                onChange={(e) => handleToggleActive(e.target.checked)}
                color="success"
                disabled={setActiveMutation.isPending}
              />
            </Paper>

            {confirmDelete ? (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: "error.light", bgcolor: "#fff5f5" }}>
                <Typography variant="body2" color="error.dark" sx={{ mb: 1.5 }}>{t("workers@deleteConfirm")}</Typography>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" color="inherit" onClick={() => setConfirmDelete(false)} disabled={deleteMutation.isPending}>{t("cancel")}</Button>
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    startIcon={deleteMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon />}
                  >
                    {t("workers@delete")}
                  </Button>
                </Stack>
              </Paper>
            ) : (
              <Button color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(true)} sx={{ alignSelf: "flex-start" }}>
                {t("workers@delete")}
              </Button>
            )}
          </Stack>
        ) : (
          /* ── Create worker form ── */
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">{t("workers@createHint")}</Typography>
            <TextField
              label={t("workers@name")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth size="small"
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" color="action" /></InputAdornment> }}
            />
            <TextField
              label={t("workers@email")}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth size="small"
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" color="action" /></InputAdornment> }}
            />
            <TextField
              label={t("workers@phone")}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              fullWidth size="small"
              placeholder="0790000000"
              InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" color="action" /></InputAdornment> }}
            />
            <TextField
              label={t("workers@password")}
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              fullWidth size="small"
              helperText={t("workers@passwordHint")}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" color="action" /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword((s) => !s)} edge="end">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={busy}>{t("close")}</Button>
        {!isLoading && !worker && (
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ fontWeight: 600, minWidth: 120 }}
          >
            {t("workers@create")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
