import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  CircularProgress,
  Switch,
  Avatar,
  Typography,
  Divider,
  Paper,
  InputAdornment,
  Skeleton,
  Pagination,
  Grid,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import CategoryIcon from "@mui/icons-material/Category";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import FilterListIcon from "@mui/icons-material/FilterList";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useSnackbarStore } from "../../../stores";
import {
  useServiceCategories,
  useCreateServiceCategory,
  useUpdateServiceCategory,
  useDeleteServiceCategory,
  useUploadServiceCategoryIcon,
} from "../hooks/use-service-categories";
import type {
  ServiceCategoryDto,
  CreateServiceCategoryRequest,
  UpdateServiceCategoryRequest,
} from "../types/api";

const PAGE_SIZE = 12;

type StatusFilter = "all" | "active" | "inactive";

export default function ServiceCategoriesScreen() {
  const { t } = useTranslation("serviceProviders");
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const {
    data,
    isLoading,
    search,
    handleSearchChange,
    handleRefresh,
  } = useServiceCategories();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategoryDto | null>(null);
  const [formData, setFormData] = useState<CreateServiceCategoryRequest>({
    name: "",
    nameAr: "",
    description: "",
    iconUrl: "",
    sortOrder: 0,
    isActive: true,
  });

  const createMutation = useCreateServiceCategory();
  const updateMutation = useUpdateServiceCategory();
  const deleteMutation = useDeleteServiceCategory();
  const uploadIconMutation = useUploadServiceCategoryIcon();

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);
  const uploadTargetIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCount = useMemo(() => data.filter((c) => c.isActive).length, [data]);
  const inactiveCount = data.length - activeCount;

  const filteredByStatus = useMemo(() => {
    if (statusFilter === "active") return data.filter((c) => c.isActive);
    if (statusFilter === "inactive") return data.filter((c) => !c.isActive);
    return data;
  }, [data, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredByStatus.length / PAGE_SIZE));

  const paginatedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredByStatus.slice(start, start + PAGE_SIZE);
  }, [filteredByStatus, page]);

  // Reset to page 1 when filter or search changes
  useEffect(() => { setPage(1); }, [statusFilter, search]);

  const handleAddNew = useCallback(() => {
    setEditingCategory(null);
    setFormData({ name: "", nameAr: "", description: "", iconUrl: "", sortOrder: 0, isActive: true });
    setFormDialogOpen(true);
  }, []);

  const handleEdit = useCallback((e: React.MouseEvent, row: ServiceCategoryDto) => {
    e.stopPropagation();
    setEditingCategory(row);
    setFormData({
      name: row.name,
      nameAr: row.nameAr || "",
      description: row.description || "",
      iconUrl: row.iconUrl || "",
      sortOrder: row.sortOrder,
      isActive: row.isActive,
    });
    setFormDialogOpen(true);
  }, []);

  const handleCloseFormDialog = useCallback(() => {
    if (!createMutation.isPending && !updateMutation.isPending) {
      setFormDialogOpen(false);
      setEditingCategory(null);
    }
  }, [createMutation.isPending, updateMutation.isPending]);

  const handleFormSubmit = useCallback(() => {
    if (!formData.name.trim()) {
      openErrorSnackbar({ message: t("nameRequired") });
      return;
    }
    if (editingCategory) {
      updateMutation.mutate(
        { id: editingCategory.id, data: formData as UpdateServiceCategoryRequest },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("serviceCategories_updated") });
            setFormDialogOpen(false);
            setEditingCategory(null);
          },
          onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("serviceCategories_created") });
          setFormDialogOpen(false);
        },
        onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
      });
    }
  }, [formData, editingCategory, createMutation, updateMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTargetId == null) return;
    deleteMutation.mutate(deleteTargetId, {
      onSuccess: () => {
        openSuccessSnackbar({ message: t("serviceCategories_deleted") });
        setDeleteTargetId(null);
      },
      onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
    });
  }, [deleteTargetId, deleteMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleIconFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = uploadTargetIdRef.current;
    if (!file || targetId == null) return;
    uploadIconMutation.mutate({ id: targetId, file }, {
      onSuccess: () => {
        openSuccessSnackbar({ message: t("serviceCategories_iconUploaded") });
        setUploadTargetId(null);
        uploadTargetIdRef.current = null;
      },
      onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
    });
    e.target.value = "";
  }, [uploadIconMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleUploadIconClick = useCallback((e: React.MouseEvent, row: ServiceCategoryDto) => {
    e.stopPropagation();
    uploadTargetIdRef.current = row.id;
    setUploadTargetId(row.id);
    fileInputRef.current?.click();
  }, []);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AppScreenContainer>
      {/* ── Banner ── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
          borderRadius: 3,
          p: { xs: 2.5, md: 4 },
          mb: 3,
          position: "relative",
          overflow: "hidden",
          color: "white",
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -70, right: 120, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", top: -30, left: 200, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={2.5} alignItems="center">
            {/* Icon box */}
            <Box sx={{
              width: 72, height: 72, borderRadius: 3,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <CategoryIcon sx={{ fontSize: 40, color: "white" }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="white">{t("serviceCategories")}</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5 }}>{t("serviceCategories_subtitle")}</Typography>
              {/* KPI chips */}
              <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
                {[
                  { label: t("serviceCategories_total"), value: data.length, bg: "rgba(255,255,255,0.15)" },
                  { label: t("active"), value: activeCount, bg: "rgba(76,175,80,0.35)" },
                  { label: t("inactive"), value: inactiveCount, bg: "rgba(255,255,255,0.08)" },
                ].map(({ label, value, bg }) => (
                  <Box
                    key={label}
                    sx={{
                      background: bg,
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 2,
                      px: 2,
                      py: 0.75,
                      minWidth: 80,
                      textAlign: "center",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {isLoading
                      ? <Skeleton variant="rounded" width={36} height={26} sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: "auto" }} />
                      : <Typography variant="h6" fontWeight={800} color="white" lineHeight={1.1}>{value}</Typography>}
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.68rem" }}>{label}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>

          {/* Header actions */}
          <Stack direction="row" spacing={1}>
            <Tooltip title={t("refresh")}>
              <IconButton onClick={handleRefresh} sx={{ color: "rgba(255,255,255,0.8)", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
              sx={{
                bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 600,
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.3)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                whiteSpace: "nowrap",
              }}
            >
              {t("serviceCategories_addNew")}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* ── Search + Filter bar ── */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, p: 2, mb: 2.5, border: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <TextField
            size="small"
            fullWidth
            placeholder={t("search")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
              sx: { borderRadius: 2 },
            }}
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
                size="small"
                sx={{ fontWeight: 600, cursor: "pointer" }}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* ── Category Cards ── */}
      {isLoading ? (
        <Grid container spacing={2}>
          {[...Array(8)].map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
              <Paper elevation={1} sx={{ borderRadius: 3, overflow: "hidden" }}>
                <Skeleton variant="rectangular" height={120} />
                <Box sx={{ p: 2 }}>
                  <Skeleton variant="text" width="70%" height={28} />
                  <Skeleton variant="text" width="50%" />
                  <Skeleton variant="rounded" width={60} height={24} sx={{ mt: 1 }} />
                </Box>
                <Divider />
                <Box sx={{ p: 1.5, display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Skeleton variant="circular" width={32} height={32} />
                  <Skeleton variant="circular" width={32} height={32} />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : filteredByStatus.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "2px dashed", borderColor: "divider", p: 6, textAlign: "center" }}>
          <CategoryIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            {search ? `No results for "${search}"` : t("serviceCategories")}
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {search ? "Try a different search term" : "Add a new service category to get started"}
          </Typography>
          {!search && (
            <Button startIcon={<AddIcon />} onClick={handleAddNew} variant="contained" sx={{ mt: 2, borderRadius: 2 }}>
              {t("serviceCategories_addNew")}
            </Button>
          )}
        </Paper>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedData.map((cat) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={cat.id}>
                <CategoryCard
                  cat={cat}
                  t={t}
                  isUploadingThis={uploadIconMutation.isPending && uploadTargetId === cat.id}
                  onEdit={handleEdit}
                  onDelete={(e) => { e.stopPropagation(); setDeleteTargetId(cat.id); }}
                  onUpload={(e) => handleUploadIconClick(e, cat)}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
                shape="rounded"
                size="large"
              />
            </Box>
          )}

          {/* Results count */}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 1.5 }}>
            {filteredByStatus.length} {t("serviceCategories").toLowerCase()}
            {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
          </Typography>
        </>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleIconFileChange}
      />

      {/* ── Form Dialog ── */}
      <Dialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <Box sx={{
          background: editingCategory
            ? "linear-gradient(135deg, #e65100 0%, #f57c00 100%)"
            : "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)",
          px: 3, py: 2.5,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 44, height: 44, borderRadius: 2, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {editingCategory ? <EditIcon sx={{ color: "white" }} /> : <AddIcon sx={{ color: "white" }} />}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="white">
                {editingCategory ? t("serviceCategories_edit") : t("serviceCategories_addNew")}
              </Typography>
              {editingCategory && (
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
                  {editingCategory.name}
                </Typography>
              )}
            </Box>
          </Stack>
          <IconButton size="small" onClick={handleCloseFormDialog} disabled={isPending} sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" } }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("name")}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                autoFocus
              />
              <TextField
                label={t("nameAr")}
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                fullWidth
                inputProps={{ dir: "rtl" }}
              />
            </Stack>

            <TextField
              label={t("description")}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />

            <Box>
              <TextField
                label={t("iconUrl")}
                value={formData.iconUrl}
                onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                fullWidth
                placeholder="https://..."
                InputProps={{
                  endAdornment: formData.iconUrl ? (
                    <Avatar src={formData.iconUrl} variant="rounded" sx={{ width: 32, height: 32, ml: 1, flexShrink: 0 }}>
                      <CategoryIcon fontSize="small" />
                    </Avatar>
                  ) : null,
                }}
              />
              {formData.iconUrl && (
                <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                  <Box sx={{ p: 1.5, borderRadius: 3, border: "2px dashed", borderColor: "divider", bgcolor: "grey.50" }}>
                    <Avatar src={formData.iconUrl} variant="rounded" sx={{ width: 80, height: 80 }}>
                      <CategoryIcon sx={{ fontSize: 40 }} color="disabled" />
                    </Avatar>
                  </Box>
                </Box>
              )}
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label={t("sortOrder")}
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                sx={{ width: 140 }}
                inputProps={{ min: 0 }}
              />
              <Paper
                variant="outlined"
                sx={{
                  flex: 1, px: 2, py: 1.5, borderRadius: 2,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderColor: formData.isActive ? "success.main" : "divider",
                  bgcolor: formData.isActive ? "success.50" : "transparent",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  {formData.isActive
                    ? <CheckCircleIcon color="success" fontSize="small" />
                    : <CancelIcon color="disabled" fontSize="small" />}
                  <Typography variant="body2" fontWeight={600} color={formData.isActive ? "success.dark" : "text.secondary"}>
                    {formData.isActive ? t("active") : t("inactive")}
                  </Typography>
                </Stack>
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  color="success"
                />
              </Paper>
            </Stack>
          </Stack>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleCloseFormDialog} disabled={isPending} color="inherit" variant="outlined" sx={{ borderRadius: 2, minWidth: 100 }}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={18} color="inherit" /> : editingCategory ? <EditIcon /> : <AddIcon />}
            sx={{
              borderRadius: 2, minWidth: 130,
              background: editingCategory
                ? "linear-gradient(135deg, #e65100 0%, #f57c00 100%)"
                : "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)",
              "&:hover": {
                background: editingCategory
                  ? "linear-gradient(135deg, #bf360c 0%, #e65100 100%)"
                  : "linear-gradient(135deg, #0a3880 0%, #0d47a1 100%)",
              },
            }}
          >
            {isPending
              ? (editingCategory ? t("updating") : t("creating"))
              : (editingCategory ? t("update") : t("create"))}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog
        open={deleteTargetId !== null}
        onClose={() => !deleteMutation.isPending && setDeleteTargetId(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <Box sx={{ background: "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)", p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DeleteIcon sx={{ color: "white" }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="white">{t("serviceCategories_delete")}</Typography>
            </Stack>
            <IconButton size="small" onClick={() => setDeleteTargetId(null)} disabled={deleteMutation.isPending}
              sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white" } }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography variant="body2" color="text.secondary">{t("serviceCategories_deleteConfirm")}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setDeleteTargetId(null)} disabled={deleteMutation.isPending}>{t("cancel")}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}

// ── Category Card Component ───────────────────────────────────────────────────

interface CategoryCardProps {
  cat: ServiceCategoryDto;
  t: (key: string) => string;
  isUploadingThis: boolean;
  onEdit: (e: React.MouseEvent, cat: ServiceCategoryDto) => void;
  onDelete: (e: React.MouseEvent) => void;
  onUpload: (e: React.MouseEvent) => void;
}

function CategoryCard({ cat, t, isUploadingThis, onEdit, onDelete, onUpload }: CategoryCardProps) {
  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        "&:hover": { transform: "translateY(-3px)", boxShadow: 6 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Sort order badge */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1,
          bgcolor: "rgba(0,0,0,0.45)",
          color: "white",
          borderRadius: 1.5,
          px: 1,
          py: 0.25,
          fontSize: "0.68rem",
          fontWeight: 700,
          lineHeight: 1.6,
          backdropFilter: "blur(4px)",
        }}
      >
        #{cat.sortOrder}
      </Box>

      {/* Icon area */}
      <Box
        sx={{
          background: cat.isActive
            ? "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)"
            : "linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)",
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 130,
        }}
      >
        <Avatar
          src={cat.iconUrl ?? undefined}
          variant="rounded"
          sx={{
            width: 80,
            height: 80,
            bgcolor: "white",
            boxShadow: 3,
            border: "3px solid",
            borderColor: cat.isActive ? "primary.100" : "grey.200",
            "& img": { objectFit: "contain" },
          }}
        >
          <CategoryIcon sx={{ fontSize: 40, color: cat.isActive ? "primary.main" : "text.disabled" }} />
        </Avatar>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, flex: 1 }}>
        {/* Status chip */}
        <Chip
          icon={cat.isActive ? <CheckCircleIcon sx={{ fontSize: "0.9rem !important" }} /> : <CancelIcon sx={{ fontSize: "0.9rem !important" }} />}
          label={cat.isActive ? t("active") : t("inactive")}
          color={cat.isActive ? "success" : "default"}
          size="small"
          sx={{ mb: 1.5, fontWeight: 600, fontSize: "0.7rem" }}
        />

        <Typography variant="subtitle1" fontWeight={700} noWrap title={cat.name}>
          {cat.name}
        </Typography>

        {cat.nameAr && (
          <Typography
            variant="body2"
            color="text.secondary"
            dir="rtl"
            noWrap
            title={cat.nameAr}
            sx={{ mt: 0.25, fontFamily: "inherit" }}
          >
            {cat.nameAr}
          </Typography>
        )}

        {cat.description ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.5,
            }}
          >
            {cat.description}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block", fontStyle: "italic" }}>
            No description
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Actions */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 1.5, py: 1, bgcolor: "grey.50" }}
      >
        <Typography variant="caption" color="text.disabled" fontWeight={500}>
          ID: {cat.id}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t("serviceCategories_uploadIcon")}>
            <IconButton
              size="small"
              color="info"
              onClick={(e) => onUpload(e)}
              disabled={isUploadingThis}
              sx={{ "&:hover": { bgcolor: "info.50" } }}
            >
              {isUploadingThis ? <CircularProgress size={16} /> : <CloudUploadIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title={t("edit")}>
            <IconButton
              size="small"
              color="warning"
              onClick={(e) => onEdit(e, cat)}
              sx={{ "&:hover": { bgcolor: "warning.50" } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("delete")}>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => onDelete(e)}
              sx={{ "&:hover": { bgcolor: "error.50" } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}
