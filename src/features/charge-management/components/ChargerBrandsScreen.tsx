import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  CircularProgress,
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
import EvStationIcon from "@mui/icons-material/EvStation";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useSnackbarStore } from "../../../stores";
import {
  useChargerBrands,
  useAddChargerBrand,
  useUpdateChargerBrand,
  useDeleteChargerBrand,
} from "../hooks/use-charger-brands";
import type { ChargerBrandDto } from "../types/api";

/** Pull the most descriptive message out of an axios error (used for the delete-in-use 400). */
function errMessage(err: any, fallback: string): string {
  return err?.response?.data?.detail || err?.response?.data?.title || err?.message || fallback;
}

export default function ChargerBrandsScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data = [], isLoading, refetch } = useChargerBrands();
  const addMutation = useAddChargerBrand();
  const updateMutation = useUpdateChargerBrand();
  const deleteMutation = useDeleteChargerBrand();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ChargerBrandDto | null>(null);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ChargerBrandDto | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? data.filter((b) => b.name.toLowerCase().includes(q)) : data;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [data, search]);

  const isPending = addMutation.isPending || updateMutation.isPending;

  const handleAddNew = useCallback(() => { setEditing(null); setName(""); setFormOpen(true); }, []);
  const handleEdit = useCallback((b: ChargerBrandDto) => { setEditing(b); setName(b.name); setFormOpen(true); }, []);
  const handleCloseForm = useCallback(() => { if (!isPending) { setFormOpen(false); setEditing(null); } }, [isPending]);

  const handleSubmit = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) { openErrorSnackbar({ message: t("chargerBrands@nameRequired") }); return; }
    if (editing) {
      updateMutation.mutate({ id: editing.id, name: trimmed }, {
        onSuccess: () => { openSuccessSnackbar({ message: t("chargerBrands@updated") }); setFormOpen(false); setEditing(null); },
        onError: (err) => openErrorSnackbar({ message: errMessage(err, t("loadingFailed")) }),
      });
    } else {
      addMutation.mutate(trimmed, {
        onSuccess: () => { openSuccessSnackbar({ message: t("chargerBrands@created") }); setFormOpen(false); },
        onError: (err) => openErrorSnackbar({ message: errMessage(err, t("loadingFailed")) }),
      });
    }
  }, [name, editing, addMutation, updateMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => { openSuccessSnackbar({ message: t("chargerBrands@deleted") }); setDeleteTarget(null); },
      onError: (err) => openErrorSnackbar({ message: errMessage(err, t("chargerBrands@deleteInUse")) }),
    });
  }, [deleteTarget, deleteMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  return (
    <AppScreenContainer>
      {/* Banner */}
      <Box sx={{ background: "linear-gradient(135deg, #0d3276 0%, #1565c0 100%)", borderRadius: 3, p: { xs: 2.5, md: 4 }, mb: 3, position: "relative", overflow: "hidden", color: "white" }}>
        <Box sx={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={2.5} alignItems="center">
            <Box sx={{ width: 72, height: 72, borderRadius: 3, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <EvStationIcon sx={{ fontSize: 40, color: "white" }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="white">{t("chargerBrands@title")}</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5 }}>{t("chargerBrands@subtitle")}</Typography>
              <Box sx={{ mt: 2, display: "inline-block", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 2, px: 2, py: 0.75, textAlign: "center" }}>
                {isLoading ? <Skeleton variant="rounded" width={36} height={26} sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: "auto" }} />
                  : <Typography variant="h6" fontWeight={800} color="white" lineHeight={1.1}>{data.length}</Typography>}
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.68rem" }}>{t("chargerBrands@total")}</Typography>
              </Box>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Tooltip title={t("refresh")}>
              <IconButton onClick={() => refetch()} sx={{ color: "rgba(255,255,255,0.8)", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}><RefreshIcon /></IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 600, backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, whiteSpace: "nowrap" }}>
              {t("chargerBrands@addNew")}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Search */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, p: 2, mb: 2.5, border: "1px solid", borderColor: "divider" }}>
        <TextField
          size="small" fullWidth placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>, sx: { borderRadius: 2 } }}
        />
      </Paper>

      {/* Brand cards */}
      {isLoading ? (
        <Grid container spacing={2}>
          {[...Array(8)].map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}><Paper elevation={1} sx={{ borderRadius: 3, p: 2 }}><Skeleton variant="text" width="70%" height={28} /></Paper></Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "2px dashed", borderColor: "divider", p: 6, textAlign: "center" }}>
          <EvStationIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>{search ? t("chargerBrands@noResults", { query: search }) : t("chargerBrands@empty")}</Typography>
          {!search && <Button startIcon={<AddIcon />} onClick={handleAddNew} variant="contained" sx={{ mt: 2, borderRadius: 2 }}>{t("chargerBrands@addNew")}</Button>}
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((b) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={b.id}>
              <Paper elevation={1} sx={{ borderRadius: 3, p: 2, height: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar variant="rounded" sx={{ width: 44, height: 44, bgcolor: "primary.50", color: "primary.main", fontWeight: 800 }}>
                    {b.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>{b.name}</Typography>
                    <Chip label={`#${b.id}`} size="small" variant="outlined" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
                  </Box>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                  <Tooltip title={t("edit")}><IconButton size="small" onClick={() => handleEdit(b)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title={t("delete")}><IconButton size="small" color="error" onClick={() => setDeleteTarget(b)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add / edit dialog */}
      <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? t("chargerBrands@editTitle") : t("chargerBrands@addNew")}</DialogTitle>
        <DialogContent dividers>
          <TextField
            label={t("chargerBrands@name")} value={name} onChange={(e) => setName(e.target.value)}
            fullWidth autoFocus required sx={{ mt: 0.5 }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleCloseForm} disabled={isPending} color="inherit">{t("cancel")}</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isPending}
            startIcon={isPending ? <CircularProgress size={18} color="inherit" /> : editing ? <EditIcon /> : <AddIcon />}>
            {editing ? t("save") : t("create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => !deleteMutation.isPending && setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <Box sx={{ background: "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)", px: 3, py: 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}><WarningAmberIcon sx={{ color: "#fff" }} /></Avatar>
            <Typography variant="h6" fontWeight={700} color="#fff">{t("chargerBrands@deleteTitle")}</Typography>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography color="text.secondary">
            {t("chargerBrands@deleteMessage")}{" "}
            <Typography component="span" fontWeight={700} color="text.primary">{deleteTarget?.name}</Typography>?
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block" }}>{t("chargerBrands@deleteHint")}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending} color="inherit">{t("cancel")}</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}>
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
