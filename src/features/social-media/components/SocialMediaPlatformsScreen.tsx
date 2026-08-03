import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Button,
  Chip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Avatar,
  Divider,
  Paper,
  InputAdornment,
  Skeleton,
  Grid,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ShareIcon from "@mui/icons-material/Share";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import FilterListIcon from "@mui/icons-material/FilterList";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LinkIcon from "@mui/icons-material/Link";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useSnackbarStore } from "../../../stores";
import {
  useSocialMediaPlatforms,
  useCreateSocialMediaPlatform,
  useUpdateSocialMediaPlatform,
  useDeleteSocialMediaPlatform,
} from "../hooks/use-social-media";
import type { SocialMediaPlatformDto } from "../types/api";

type StatusFilter = "all" | "active" | "inactive";

interface FormState {
  name: string;
  displayOrder: number;
  isActive: boolean;
  icon: File | null;
}

const EMPTY_FORM: FormState = { name: "", displayOrder: 0, isActive: true, icon: null };

export default function SocialMediaPlatformsScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data = [], isLoading, refetch } = useSocialMediaPlatforms();
  const createMutation = useCreateSocialMediaPlatform();
  const updateMutation = useUpdateSocialMediaPlatform();
  const deleteMutation = useDeleteSocialMediaPlatform();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SocialMediaPlatformDto | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SocialMediaPlatformDto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCount = useMemo(() => data.filter((p) => p.isActive).length, [data]);
  const inactiveCount = data.length - activeCount;

  const filtered = useMemo(() => {
    let result = data;
    if (statusFilter === "active") result = result.filter((p) => p.isActive);
    else if (statusFilter === "inactive") result = result.filter((p) => !p.isActive);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((p) => p.name.toLowerCase().includes(q));
    return [...result].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
  }, [data, statusFilter, search]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleAddNew = useCallback(() => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, displayOrder: (data.length ? Math.max(...data.map((p) => p.displayOrder)) : 0) + 1 });
    setIconPreview(null);
    setFormDialogOpen(true);
  }, [data]);

  const handleEdit = useCallback((platform: SocialMediaPlatformDto) => {
    setEditing(platform);
    setForm({ name: platform.name, displayOrder: platform.displayOrder, isActive: platform.isActive, icon: null });
    setIconPreview(platform.iconUrl);
    setFormDialogOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    if (!isPending) { setFormDialogOpen(false); setEditing(null); }
  }, [isPending]);

  const handlePickIcon = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, icon: file }));
    setIconPreview(URL.createObjectURL(file));
    e.target.value = "";
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) { openErrorSnackbar({ message: t("socialMedia@nameRequired") }); return; }
    if (form.displayOrder < 0) { openErrorSnackbar({ message: t("socialMedia@displayOrderInvalid") }); return; }

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: { name: form.name.trim(), displayOrder: form.displayOrder, isActive: form.isActive, icon: form.icon } },
        {
          onSuccess: () => { openSuccessSnackbar({ message: t("socialMedia@updated") }); setFormDialogOpen(false); setEditing(null); },
          onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
        }
      );
    } else {
      createMutation.mutate(
        { name: form.name.trim(), displayOrder: form.displayOrder, icon: form.icon },
        {
          onSuccess: () => { openSuccessSnackbar({ message: t("socialMedia@created") }); setFormDialogOpen(false); },
          onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
        }
      );
    }
  }, [form, editing, createMutation, updateMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => { openSuccessSnackbar({ message: t("socialMedia@deleted") }); setDeleteTarget(null); },
      onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
    });
  }, [deleteTarget, deleteMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  // Revoke object URLs created for local previews
  useEffect(() => () => { if (iconPreview?.startsWith("blob:")) URL.revokeObjectURL(iconPreview); }, [iconPreview]);

  return (
    <AppScreenContainer>
      {/* ── Banner ── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #4a148c 0%, #6a1b9a 55%, #8e24aa 100%)",
          borderRadius: 3, p: { xs: 2.5, md: 4 }, mb: 3, position: "relative", overflow: "hidden", color: "white",
        }}
      >
        <Box sx={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -70, right: 120, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={2.5} alignItems="center">
            <Box sx={{ width: 72, height: 72, borderRadius: 3, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ShareIcon sx={{ fontSize: 40, color: "white" }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="white">{t("socialMedia@title")}</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5 }}>{t("socialMedia@subtitle")}</Typography>
              <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
                {[
                  { label: t("socialMedia@total"), value: data.length, bg: "rgba(255,255,255,0.15)" },
                  { label: t("active"), value: activeCount, bg: "rgba(76,175,80,0.35)" },
                  { label: t("inactive"), value: inactiveCount, bg: "rgba(255,255,255,0.08)" },
                ].map(({ label, value, bg }) => (
                  <Box key={label} sx={{ background: bg, border: "1px solid rgba(255,255,255,0.15)", borderRadius: 2, px: 2, py: 0.75, minWidth: 80, textAlign: "center", backdropFilter: "blur(4px)" }}>
                    {isLoading
                      ? <Skeleton variant="rounded" width={36} height={26} sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: "auto" }} />
                      : <Typography variant="h6" fontWeight={800} color="white" lineHeight={1.1}>{value}</Typography>}
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.68rem" }}>{label}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title={t("refresh")}>
              <IconButton onClick={() => refetch()} sx={{ color: "rgba(255,255,255,0.8)", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 600, backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, whiteSpace: "nowrap" }}
            >
              {t("socialMedia@addNew")}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* ── Search + Filter ── */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, p: 2, mb: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <TextField
            size="small" fullWidth placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>, sx: { borderRadius: 2 } }}
            sx={{ flex: 1 }}
          />
          <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
            <FilterListIcon fontSize="small" color="action" />
            {(["all", "active", "inactive"] as StatusFilter[]).map((f) => (
              <Chip
                key={f}
                label={f === "all" ? t("all") : f === "active" ? t("active") : t("inactive")}
                onClick={() => setStatusFilter(f)}
                color={statusFilter === f ? (f === "active" ? "success" : f === "inactive" ? "default" : "primary") : "default"}
                variant={statusFilter === f ? "filled" : "outlined"}
                size="small" sx={{ fontWeight: 600, cursor: "pointer" }}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* ── Platform cards ── */}
      {isLoading ? (
        <Grid container spacing={2}>
          {[...Array(8)].map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
              <Paper elevation={1} sx={{ borderRadius: 3, p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Skeleton variant="circular" width={48} height={48} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" height={26} />
                    <Skeleton variant="rounded" width={60} height={22} sx={{ mt: 0.5 }} />
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "2px dashed", borderColor: "divider", p: 6, textAlign: "center" }}>
          <ShareIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            {search ? t("socialMedia@noResults", { query: search }) : t("socialMedia@empty")}
          </Typography>
          {!search && (
            <Button startIcon={<AddIcon />} onClick={handleAddNew} variant="contained" sx={{ mt: 2, borderRadius: 2 }}>
              {t("socialMedia@addNew")}
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((p) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={p.id}>
              <Paper
                elevation={1}
                sx={{ borderRadius: 3, p: 2, height: "100%", display: "flex", flexDirection: "column", gap: 1.5, opacity: p.isActive ? 1 : 0.7, border: 1, borderColor: p.isActive ? "divider" : "warning.200" }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar src={p.iconUrl ?? undefined} variant="rounded" sx={{ width: 48, height: 48, bgcolor: p.iconUrl ? "transparent" : "grey.100", color: "text.disabled", border: 1, borderColor: "divider" }}>
                    {!p.iconUrl && <LinkIcon />}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>{p.name}</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                      <Chip label={`#${p.displayOrder}`} size="small" variant="outlined" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
                      <Chip
                        label={p.isActive ? t("active") : t("inactive")}
                        size="small" color={p.isActive ? "success" : "default"} variant="outlined"
                        sx={{ height: 20, fontSize: 11, fontWeight: 600 }}
                      />
                      {!p.iconUrl && <Chip label={t("socialMedia@noIcon")} size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: 11 }} />}
                    </Stack>
                  </Box>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                  <Tooltip title={t("edit")}>
                    <IconButton size="small" onClick={() => handleEdit(p)}><EditIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title={t("delete")}>
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(p)}><DeleteIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Add / Edit dialog ── */}
      <Dialog open={formDialogOpen} onClose={handleCloseForm} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? t("socialMedia@editTitle") : t("socialMedia@addNew")}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {/* Icon picker */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src={iconPreview ?? undefined} variant="rounded" sx={{ width: 64, height: 64, bgcolor: iconPreview ? "transparent" : "grey.100", color: "text.disabled", border: 1, borderColor: "divider" }}>
                {!iconPreview && <LinkIcon />}
              </Avatar>
              <Box>
                <Button variant="outlined" size="small" startIcon={<CloudUploadIcon />} onClick={() => fileInputRef.current?.click()} sx={{ borderRadius: 2, textTransform: "none" }}>
                  {iconPreview ? t("socialMedia@changeIcon") : t("socialMedia@uploadIcon")}
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {t("socialMedia@iconHint")}
                </Typography>
              </Box>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePickIcon} />
            </Stack>

            <TextField
              label={t("socialMedia@name")} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth autoFocus required
            />
            <TextField
              label={t("socialMedia@displayOrder")} value={form.displayOrder} type="number"
              onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
              fullWidth helperText={t("socialMedia@displayOrderHint")}
            />
            {editing && (
              <FormControlLabel
                control={<Switch checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />}
                label={t("socialMedia@isActive")}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleCloseForm} disabled={isPending} color="inherit">{t("cancel")}</Button>
          <Button
            onClick={handleSubmit} variant="contained" disabled={isPending}
            startIcon={isPending ? <CircularProgress size={18} color="inherit" /> : editing ? <EditIcon /> : <AddIcon />}
          >
            {editing ? t("save") : t("create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirm ── */}
      <Dialog open={!!deleteTarget} onClose={() => !deleteMutation.isPending && setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ background: "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)", px: 3, py: 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}><WarningAmberIcon sx={{ color: "#fff" }} /></Avatar>
            <Typography variant="h6" fontWeight={700} color="#fff">{t("socialMedia@deleteTitle")}</Typography>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography color="text.secondary">
            {t("socialMedia@deleteMessage")}{" "}
            <Typography component="span" fontWeight={700} color="text.primary">{deleteTarget?.name}</Typography>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending} color="inherit">{t("cancel")}</Button>
          <Button
            onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
