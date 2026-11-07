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
  Chip,
  Tooltip,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import KeyIcon from "@mui/icons-material/Key";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useSnackbarStore } from "../../../stores";
import {
  useWorkers,
  useCreateWorker,
  useSetWorkerActive,
  useDeleteWorker,
  useResetWorkerTempPassword,
  useUnlockWorker,
} from "../hooks/use-workers";
import type { WorkerCredentials, WorkerDto, WorkerProviderType } from "../types/api";

interface WorkerDialogProps {
  open: boolean;
  onClose: () => void;
  providerType: WorkerProviderType;
  providerId: number;
  providerName?: string | null;
}

const emptyForm = { name: "", email: "", phone: "" };

const statusColor = (s: WorkerDto["status"]) => (s === "active" ? "success" : s === "suspendedByPlan" ? "warning" : "default");
const loginColor = (s: WorkerDto["loginStatus"]) => (s === "active" ? "success" : s === "locked" ? "error" : "info");

/**
 * Admin support view of a provider's workers: the list with status and login state, suspend / resume, delete,
 * a new temporary password (shown once with the share message), unlock, and adding a worker on the owner's behalf.
 */
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
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [credentials, setCredentials] = useState<(WorkerCredentials & { name: string }) | null>(null);

  const { data: workers = [], isLoading } = useWorkers(open ? providerType : null, open ? providerId : null);
  const createMutation = useCreateWorker(providerType, providerId);
  const setActiveMutation = useSetWorkerActive(providerType, providerId);
  const deleteMutation = useDeleteWorker(providerType, providerId);
  const resetMutation = useResetWorkerTempPassword(providerType, providerId);
  const unlockMutation = useUnlockWorker(providerType, providerId);

  // Reset transient state whenever the dialog (re)opens or the target changes.
  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setAdding(false);
      setConfirmDelete(null);
      setCredentials(null);
    }
  }, [open, providerType, providerId]);

  const errorDetail = (err: any) =>
    err?.response?.data?.detail ||
    err?.response?.data?.title ||
    err?.message ||
    t("loadingFailed");

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); openSuccessSnackbar({ message: t("workers@copied") }); }
    catch { openErrorSnackbar({ message: t("loadingFailed") }); }
  };

  const handleCreate = () => {
    if (!form.name.trim()) return openErrorSnackbar({ message: t("workers@nameRequired") });
    if (!form.phone.trim()) return openErrorSnackbar({ message: t("workers@phoneRequired") });

    createMutation.mutate(
      { providerType, providerId, name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || null, privileges: [] },
      {
        onSuccess: (res) => {
          openSuccessSnackbar({ message: t("workers@created") });
          setCredentials({ ...res, name: form.name.trim() });
          setForm(emptyForm);
          setAdding(false);
        },
        onError: (err) => openErrorSnackbar({ message: errorDetail(err) }),
      }
    );
  };

  const handleToggleActive = (w: WorkerDto, next: boolean) =>
    setActiveMutation.mutate(
      { providerManagerId: w.providerManagerId, isActive: next },
      {
        onSuccess: () => openSuccessSnackbar({ message: next ? t("workers@activated") : t("workers@deactivated") }),
        onError: (err) => openErrorSnackbar({ message: errorDetail(err) }),
      }
    );

  const handleDelete = (w: WorkerDto) =>
    deleteMutation.mutate(w.providerManagerId, {
      onSuccess: () => { openSuccessSnackbar({ message: t("workers@deleted") }); setConfirmDelete(null); },
      onError: (err) => openErrorSnackbar({ message: errorDetail(err) }),
    });

  const handleReset = (w: WorkerDto) =>
    resetMutation.mutate(w.providerManagerId, {
      onSuccess: (res) => setCredentials({ ...res, name: w.name }),
      onError: (err) => openErrorSnackbar({ message: errorDetail(err) }),
    });

  const handleUnlock = (w: WorkerDto) =>
    unlockMutation.mutate(w.providerManagerId, {
      onSuccess: () => openSuccessSnackbar({ message: t("workers@unlocked") }),
      onError: (err) => openErrorSnackbar({ message: errorDetail(err) }),
    });

  const busy = createMutation.isPending || setActiveMutation.isPending || deleteMutation.isPending || resetMutation.isPending;

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
        {credentials && (
          /* ── Temporary password, shown once ── */
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2, borderColor: "success.light" }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{t("workers@shareTitle", { name: credentials.name })}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h5" fontWeight={800} dir="ltr" sx={{ fontFamily: "monospace", letterSpacing: 2 }}>{credentials.tempPassword}</Typography>
              <Tooltip title={t("workers@copy")}><IconButton size="small" onClick={() => copy(credentials.tempPassword)}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>{t("workers@validUntil", { date: new Date(credentials.tempPasswordExpiresAt).toLocaleString() })}</Typography>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "action.hover" }}>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{credentials.shareMessage}</Typography>
            </Paper>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => copy(credentials.shareMessage)}>{t("workers@copyMessage")}</Button>
              <Button size="small" color="inherit" onClick={() => setCredentials(null)}>{t("close")}</Button>
            </Stack>
          </Paper>
        )}

        {isLoading ? (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Skeleton variant="rounded" height={64} />
            <Skeleton variant="rounded" height={64} />
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            {workers.length === 0 && !adding && (
              <Typography variant="body2" color="text.secondary">{t("workers@none")}</Typography>
            )}

            {workers.map((w) => (
              <Paper key={w.providerManagerId} variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: w.isActive ? "divider" : "warning.light" }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ width: 44, height: 44, bgcolor: "primary.main", fontWeight: 700 }}>{w.name.slice(0, 2).toUpperCase()}</Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>{w.name}</Typography>
                    <Stack direction="row" spacing={1.5} flexWrap="wrap">
                      {w.phone && <Typography variant="caption" color="text.secondary" dir="ltr"><PhoneIcon sx={{ fontSize: 12, mr: 0.3, verticalAlign: "middle" }} />{w.phone}</Typography>}
                      {w.email && <Typography variant="caption" color="text.secondary"><EmailIcon sx={{ fontSize: 12, mr: 0.3, verticalAlign: "middle" }} />{w.email}</Typography>}
                    </Stack>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap">
                      <Chip size="small" label={t(`workers@status.${w.status}`)} color={statusColor(w.status)} />
                      <Chip size="small" variant="outlined" label={t(`workers@login.${w.loginStatus}`)} color={loginColor(w.loginStatus)} />
                      {w.privileges.length > 0 && <Chip size="small" variant="outlined" label={t("workers@privilegeCount", { count: w.privileges.length })} />}
                    </Stack>
                  </Box>
                  <Switch checked={w.isActive} onChange={(e) => handleToggleActive(w, e.target.checked)} color="success" disabled={setActiveMutation.isPending} />
                </Stack>

                <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} flexWrap="wrap">
                  <Tooltip title={t("workers@resetTempHint")}>
                    <Button size="small" startIcon={<KeyIcon />} onClick={() => handleReset(w)} disabled={resetMutation.isPending}>{t("workers@resetTemp")}</Button>
                  </Tooltip>
                  {w.loginStatus === "locked" && (
                    <Button size="small" startIcon={<LockOpenIcon />} onClick={() => handleUnlock(w)} disabled={unlockMutation.isPending}>{t("workers@unlock")}</Button>
                  )}
                  <Box sx={{ flex: 1 }} />
                  {confirmDelete === w.providerManagerId ? (
                    <>
                      <Button size="small" color="inherit" onClick={() => setConfirmDelete(null)} disabled={deleteMutation.isPending}>{t("cancel")}</Button>
                      <Button size="small" color="error" variant="contained" onClick={() => handleDelete(w)} disabled={deleteMutation.isPending}
                        startIcon={deleteMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon />}>
                        {t("workers@delete")}
                      </Button>
                    </>
                  ) : (
                    <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(w.providerManagerId)}>{t("workers@delete")}</Button>
                  )}
                </Stack>
              </Paper>
            ))}

            {adding ? (
              /* ── Create worker form ── */
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">{t("workers@createHint")}</Typography>
                  <TextField label={t("workers@name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth size="small"
                    InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" color="action" /></InputAdornment> }} />
                  <TextField label={t("workers@phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth size="small" placeholder="0790000000"
                    InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" color="action" /></InputAdornment> }} />
                  <TextField label={t("workers@emailOptional")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth size="small"
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" color="action" /></InputAdornment> }} />
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button color="inherit" onClick={() => setAdding(false)} disabled={createMutation.isPending}>{t("cancel")}</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={createMutation.isPending}
                      startIcon={createMutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ fontWeight: 600, minWidth: 120 }}>
                      {t("workers@create")}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ) : (
              <Button startIcon={<AddIcon />} onClick={() => setAdding(true)} sx={{ alignSelf: "flex-start" }}>{t("workers@add")}</Button>
            )}
          </Stack>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={busy}>{t("close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
