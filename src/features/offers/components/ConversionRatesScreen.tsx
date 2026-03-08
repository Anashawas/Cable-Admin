import { useState, useCallback, useMemo } from "react";
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
  FormControlLabel,
  Switch,
  Alert,
  Divider,
  Paper,
  Typography,
  InputAdornment,
  Skeleton,
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  useConversionRates,
  useCreateConversionRate,
  useUpdateConversionRate,
} from "../hooks/use-conversion-rates";
import type {
  ConversionRateDto,
  CreateConversionRateRequest,
} from "../types/api";

export default function ConversionRatesScreen() {
  const { t } = useTranslation(["offers", "common"]);
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data, isLoading, search, handleSearchChange, handleRefresh } = useConversionRates();

  const createMutation = useCreateConversionRate();
  const updateMutation = useUpdateConversionRate();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ConversionRateDto | null>(null);
  const [formData, setFormData] = useState<CreateConversionRateRequest>({
    name: "",
    currencyCode: "",
    pointsPerUnit: 1,
    isDefault: false,
    isActive: true,
  });

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return data.slice(start, start + paginationModel.pageSize);
  }, [data, paginationModel.page, paginationModel.pageSize]);

  const handleAddNew = useCallback(() => {
    setEditingRate(null);
    setFormData({ name: "", currencyCode: "", pointsPerUnit: 1, isDefault: false, isActive: true });
    setFormDialogOpen(true);
  }, []);

  const handleEdit = useCallback((e: React.MouseEvent, row: ConversionRateDto) => {
    e.stopPropagation();
    setEditingRate(row);
    setFormData({
      name: row.name,
      currencyCode: row.currencyCode,
      pointsPerUnit: row.pointsPerUnit,
      isDefault: row.isDefault,
      isActive: row.isActive,
    });
    setFormDialogOpen(true);
  }, []);

  const handleCloseFormDialog = useCallback(() => {
    if (!createMutation.isPending && !updateMutation.isPending) {
      setFormDialogOpen(false);
      setEditingRate(null);
    }
  }, [createMutation.isPending, updateMutation.isPending]);

  const handleFormSubmit = useCallback(() => {
    if (!formData.name.trim() || !formData.currencyCode.trim()) {
      openErrorSnackbar({ message: t("conversionRates_requiredFields") });
      return;
    }
    if (editingRate) {
      updateMutation.mutate(
        { id: editingRate.id, data: formData },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("conversionRates_updated") });
            setFormDialogOpen(false);
            setEditingRate(null);
          },
          onError: (err: Error) => {
            openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("conversionRates_created") });
          setFormDialogOpen(false);
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      });
    }
  }, [formData, editingRate, createMutation, updateMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const columns: GridColDef<ConversionRateDto>[] = [
    { field: "id", headerName: t("id"), width: 70, align: "center", headerAlign: "center" },
    { field: "name", headerName: t("name"), flex: 1, minWidth: 160 },
    { field: "currencyCode", headerName: t("currency"), width: 110 },
    {
      field: "pointsPerUnit",
      headerName: t("conversionRates_rateFormula"),
      width: 230,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" fontWeight={700} color="primary.main">
            1 {params.row.currencyCode}
          </Typography>
          <SwapHorizIcon fontSize="small" color="action" />
          <Typography variant="body2" fontWeight={700} color="success.dark">
            {params.value} {t("points")}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "isDefault",
      headerName: t("default"),
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value ? t("yes") : t("no")}
          color={params.value ? "primary" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "isActive",
      headerName: t("status"),
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value ? t("active") : t("inactive")}
          color={params.value ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 90,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <Tooltip title={t("edit")}>
          <IconButton size="small" onClick={(e) => handleEdit(e, params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const totalRates = data.length;
  const activeRates = data.filter((r) => r.isActive).length;
  const defaultRate = data.find((r) => r.isDefault);

  return (
    <AppScreenContainer>
      {/* Gradient Banner */}
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
        <Box sx={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -60, right: 100, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Box sx={{ width: 64, height: 64, borderRadius: 2, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MonetizationOnIcon sx={{ fontSize: 36, color: "white" }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700} color="white">{t("conversionRates")}</Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5 }}>{t("conversionRates_subtitle")}</Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap">
              <Box sx={{ background: "rgba(255,255,255,0.13)", borderRadius: 2, px: 2, py: 1, minWidth: 90 }}>
                {isLoading ? (
                  <Skeleton variant="rounded" width={40} height={32} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                ) : (
                  <Typography variant="h5" fontWeight={700} color="white">{totalRates}</Typography>
                )}
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("conversionRates_total")}</Typography>
              </Box>
              <Box sx={{ background: "rgba(255,255,255,0.13)", borderRadius: 2, px: 2, py: 1, minWidth: 90 }}>
                {isLoading ? (
                  <Skeleton variant="rounded" width={40} height={32} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                ) : (
                  <Typography variant="h5" fontWeight={700} color="white">{activeRates}</Typography>
                )}
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("active")}</Typography>
              </Box>
              <Box sx={{ background: "rgba(255,255,255,0.13)", borderRadius: 2, px: 2, py: 1, minWidth: 120 }}>
                {isLoading ? (
                  <Skeleton variant="rounded" width={80} height={32} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                ) : (
                  <Typography variant="body2" fontWeight={700} color="white" sx={{ fontSize: "0.85rem" }}>{defaultRate?.currencyCode ?? "—"}</Typography>
                )}
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("default")}</Typography>
              </Box>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} flexShrink={0}>
            <Tooltip title={t("refresh")}>
              <IconButton onClick={handleRefresh} sx={{ color: "white", background: "rgba(255,255,255,0.12)", "&:hover": { background: "rgba(255,255,255,0.2)" } }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
              sx={{
                background: "rgba(255,255,255,0.18)",
                color: "white",
                fontWeight: 700,
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.3)",
                "&:hover": { background: "rgba(255,255,255,0.28)" },
                boxShadow: "none",
              }}
            >
              {t("conversionRates_addNew")}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Info + Search bar */}
      <Paper elevation={1} sx={{ borderRadius: 2, p: 2, mb: 2.5 }}>
        <Stack spacing={1.5}>
          <Alert severity="info" icon={<SwapHorizIcon />} sx={{ borderRadius: 1.5, py: 0.5 }}>
            {t("conversionRates_info")}
          </Alert>
          <TextField
            size="small"
            placeholder={t("search")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Paper>

      <AppDataGrid
        data={paginatedData}
        columns={columns}
        loading={isLoading}
        disablePagination={false}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        total={data.length}
      />

      {/* Form Dialog */}
      <Dialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        {/* Gradient Header */}
        <Box
          sx={{
            background: editingRate
              ? "linear-gradient(135deg, #e65100 0%, #f57c00 100%)"
              : "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
            px: 3,
            py: 2.5,
            position: "relative",
            color: "white",
          }}
        >
          <IconButton
            onClick={handleCloseFormDialog}
            disabled={createMutation.isPending || updateMutation.isPending}
            size="small"
            sx={{ position: "absolute", top: 12, right: 12, color: "rgba(255,255,255,0.8)", "&:hover": { color: "white", background: "rgba(255,255,255,0.15)" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 48, height: 48, borderRadius: 1.5, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MonetizationOnIcon sx={{ color: "white", fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="white">
                {editingRate ? t("conversionRates_edit") : t("conversionRates_addNew")}
              </Typography>
              {formData.currencyCode && formData.pointsPerUnit > 0 ? (
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
                  1 {formData.currencyCode} = {formData.pointsPerUnit} {t("points")}
                </Typography>
              ) : (
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)" }}>
                  {t("conversionRates_subtitle")}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            {/* Rate Info Section */}
            <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1.2 }}>
              {t("conversionRates_rateInfo")}
            </Typography>
            <Divider sx={{ mt: -1.5 }} />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("name")}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                size="small"
                placeholder="e.g. Kuwaiti Dinar"
              />
              <TextField
                label={t("currency")}
                value={formData.currencyCode}
                onChange={(e) =>
                  setFormData({ ...formData, currencyCode: e.target.value.toUpperCase() })
                }
                required
                size="small"
                sx={{ minWidth: 120 }}
                placeholder="KWD"
                inputProps={{ maxLength: 5 }}
              />
            </Stack>

            <TextField
              label={t("pointsPerUnit")}
              type="number"
              value={formData.pointsPerUnit}
              onChange={(e) =>
                setFormData({ ...formData, pointsPerUnit: parseFloat(e.target.value) || 1 })
              }
              required
              fullWidth
              size="small"
              InputProps={{
                endAdornment: <InputAdornment position="end">{t("points")}</InputAdornment>,
              }}
              helperText={t("conversionRates_pointsHelp")}
            />

            {/* Live rate preview */}
            {formData.currencyCode && formData.pointsPerUnit > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  background: "linear-gradient(135deg, rgba(13,71,161,0.06) 0%, rgba(2,119,189,0.06) 100%)",
                  borderRadius: 2,
                  border: "1.5px solid rgba(13,71,161,0.15)",
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: 1, textTransform: "uppercase", display: "block", mb: 1 }}>
                  {t("conversionRates_rateFormula")}
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    1 {formData.currencyCode}
                  </Typography>
                  <SwapHorizIcon color="primary" />
                  <Typography variant="h6" fontWeight={700} color="success.dark">
                    {formData.pointsPerUnit} {t("points")}
                  </Typography>
                </Stack>
              </Paper>
            )}

            {/* Settings Section */}
            <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1.2, pt: 0.5 }}>
              {t("conversionRates_settings")}
            </Typography>
            <Divider sx={{ mt: -1.5 }} />

            <Stack direction="row" spacing={2}>
              <Paper
                elevation={0}
                onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  border: "1.5px solid",
                  borderColor: formData.isDefault ? "primary.main" : "divider",
                  background: formData.isDefault ? "rgba(13,71,161,0.05)" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  transition: "all 0.2s",
                }}
              >
                <Switch checked={formData.isDefault} size="small" onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} />
                <Typography variant="body2" fontWeight={600}>{t("setAsDefault")}</Typography>
              </Paper>

              <Paper
                elevation={0}
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  border: "1.5px solid",
                  borderColor: formData.isActive ? "success.main" : "divider",
                  background: formData.isActive ? "rgba(46,125,50,0.05)" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  transition: "all 0.2s",
                }}
              >
                <Switch checked={formData.isActive} size="small" color="success" onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                <Typography variant="body2" fontWeight={600}>{t("active")}</Typography>
              </Paper>
            </Stack>
          </Stack>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ gap: 1, px: 3, py: 2 }}>
          <Button
            onClick={handleCloseFormDialog}
            disabled={createMutation.isPending || updateMutation.isPending}
            variant="outlined"
            color="inherit"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
            startIcon={
              createMutation.isPending || updateMutation.isPending
                ? <CircularProgress size={16} color="inherit" />
                : <CheckCircleOutlineIcon />
            }
            sx={{
              background: editingRate
                ? "linear-gradient(135deg, #e65100 0%, #f57c00 100%)"
                : "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)",
              fontWeight: 700,
              px: 3,
              "&:hover": {
                background: editingRate
                  ? "linear-gradient(135deg, #bf360c 0%, #e65100 100%)"
                  : "linear-gradient(135deg, #0a3880 0%, #0d47a1 100%)",
              },
            }}
          >
            {editingRate
              ? (updateMutation.isPending ? t("updating") : t("update"))
              : (createMutation.isPending ? t("creating") : t("create"))
            }
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
