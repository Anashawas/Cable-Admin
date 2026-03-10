import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Stack,
  Typography,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  InputAdornment,
  Chip,
  Skeleton,
  Tooltip,
  Divider,
  Avatar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import {
  getAllCarTypes,
  addCarType,
  updateCarType,
  deleteCarType,
  getCarModelsByType,
  addCarModel,
  updateCarModel,
  deleteCarModel,
} from "../services/car-management-service";
import type { CarTypeDto, CarModelDto } from "../types/api";
import { useSnackbarStore } from "../../../stores";

const GRADIENT = "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)";

function BrandSkeleton() {
  return (
    <Stack spacing={1} sx={{ p: 1 }}>
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 2 }} />
      ))}
    </Stack>
  );
}

function ModelSkeleton() {
  return (
    <Stack spacing={1} sx={{ p: 1 }}>
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} variant="rounded" height={48} sx={{ borderRadius: 2 }} />
      ))}
    </Stack>
  );
}

export default function CarDatabaseScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  // Brand dialogs
  const [addBrandOpen, setAddBrandOpen] = useState(false);
  const [addBrandName, setAddBrandName] = useState("");
  const [editBrand, setEditBrand] = useState<CarTypeDto | null>(null);
  const [editBrandName, setEditBrandName] = useState("");
  const [brandToDelete, setBrandToDelete] = useState<CarTypeDto | null>(null);

  // Model dialogs
  const [addModelOpen, setAddModelOpen] = useState(false);
  const [addModelName, setAddModelName] = useState("");
  const [editModel, setEditModel] = useState<CarModelDto | null>(null);
  const [editModelName, setEditModelName] = useState("");
  const [modelToDelete, setModelToDelete] = useState<CarModelDto | null>(null);

  const { data: carTypes = [], isLoading: loadingTypes, refetch: refetchTypes } = useQuery({
    queryKey: ["car-management", "types"],
    queryFn: ({ signal }) => getAllCarTypes(signal),
  });

  const { data: models = [], isLoading: loadingModels, refetch: refetchModels } = useQuery({
    queryKey: ["car-management", "models", selectedTypeId],
    queryFn: ({ signal }) => getCarModelsByType(selectedTypeId!, signal),
    enabled: selectedTypeId != null,
  });

  const invalidateCarQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["car-management"] });
    queryClient.invalidateQueries({ queryKey: ["user-cars"] });
  }, [queryClient]);

  const addBrandMutation = useMutation({
    mutationFn: (name: string) => addCarType({ name }),
    onSuccess: () => {
      invalidateCarQueries();
      openSuccessSnackbar({ message: t("platform@carManagement.brandAdded") });
      setAddBrandOpen(false);
      setAddBrandName("");
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const updateBrandMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateCarType(id, { name }),
    onSuccess: () => {
      invalidateCarQueries();
      openSuccessSnackbar({ message: t("platform@carManagement.brandUpdated") });
      setEditBrand(null);
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (id: number) => deleteCarType(id),
    onSuccess: () => {
      invalidateCarQueries();
      openSuccessSnackbar({ message: t("platform@carManagement.brandDeleted") });
      if (brandToDelete && selectedTypeId === brandToDelete.id) setSelectedTypeId(null);
      setBrandToDelete(null);
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const addModelMutation = useMutation({
    mutationFn: (body: { name: string; carTypeId: number }) => addCarModel(body),
    onSuccess: () => {
      invalidateCarQueries();
      openSuccessSnackbar({ message: t("platform@carManagement.modelAdded") });
      setAddModelOpen(false);
      setAddModelName("");
      refetchModels();
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const updateModelMutation = useMutation({
    mutationFn: ({ id, name, carTypeId }: { id: number; name: string; carTypeId: number }) =>
      updateCarModel(id, { name, carTypeId }),
    onSuccess: () => {
      invalidateCarQueries();
      openSuccessSnackbar({ message: t("platform@carManagement.modelUpdated") });
      setEditModel(null);
      refetchModels();
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const deleteModelMutation = useMutation({
    mutationFn: (id: number) => deleteCarModel(id),
    onSuccess: () => {
      invalidateCarQueries();
      openSuccessSnackbar({ message: t("platform@carManagement.modelDeleted") });
      setModelToDelete(null);
      refetchModels();
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const filteredBrands = useMemo(
    () => carTypes.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase())),
    [carTypes, brandSearch]
  );

  const filteredModels = useMemo(
    () => models.filter((m) => m.name.toLowerCase().includes(modelSearch.toLowerCase())),
    [models, modelSearch]
  );

  const selectedType = carTypes.find((t) => t.id === selectedTypeId);

  return (
    <AppScreenContainer>
      <Box sx={{ width: "100%", minWidth: 0, p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2.5}>
          <ScreenHeader
            title={t("platform@carManagement.title")}
            actions={[
              {
                id: "refresh",
                icon: <RefreshIcon />,
                label: t("refresh"),
                onClick: () => { refetchTypes(); if (selectedTypeId != null) refetchModels(); },
              },
            ]}
          />

          {/* Stats row */}
          <Stack direction="row" spacing={2}>
            <Paper
              elevation={0}
              sx={{
                px: 2.5, py: 1.5, borderRadius: 2,
                background: GRADIENT, color: "#fff", minWidth: 140,
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.8 }}>{t("platform@carManagement.brands")}</Typography>
              <Typography variant="h5" fontWeight={700}>{loadingTypes ? "—" : carTypes.length}</Typography>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                px: 2.5, py: 1.5, borderRadius: 2,
                bgcolor: "grey.50", border: 1, borderColor: "grey.200", minWidth: 140,
              }}
            >
              <Typography variant="caption" color="text.secondary">{t("platform@carManagement.modelsCount")}</Typography>
              <Typography variant="h5" fontWeight={700} color="primary">
                {selectedType ? (loadingModels ? "…" : models.length) : "—"}
              </Typography>
              {selectedType && (
                <Typography variant="caption" color="text.secondary">{selectedType.name}</Typography>
              )}
            </Paper>
          </Stack>

          {/* Main split panel */}
          <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" }, alignItems: "stretch" }}>

            {/* ─── LEFT: Brands ─── */}
            <Paper
              elevation={0}
              sx={{ width: { xs: "100%", md: 300 }, flexShrink: 0, border: 1, borderColor: "grey.200", borderRadius: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              {/* Brand panel header */}
              <Box sx={{ background: GRADIENT, px: 2, py: 1.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle1" fontWeight={700} color="#fff">
                    {t("platform@carManagement.brands")}
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => { setAddBrandName(""); setAddBrandOpen(true); }}
                    sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, boxShadow: "none", fontSize: 12 }}
                  >
                    {t("platform@carManagement.addBrand")}
                  </Button>
                </Stack>
                {/* Brand search */}
                <TextField
                  size="small"
                  placeholder={t("search")}
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  sx={{
                    mt: 1.5,
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "rgba(255,255,255,0.15)",
                      borderRadius: 1.5,
                      color: "#fff",
                      "& fieldset": { border: "1px solid rgba(255,255,255,0.3)" },
                      "&:hover fieldset": { border: "1px solid rgba(255,255,255,0.5)" },
                      "&.Mui-focused fieldset": { border: "1px solid rgba(255,255,255,0.7)" },
                    },
                    "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.6)", opacity: 1 },
                  }}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }} /></InputAdornment>,
                    endAdornment: brandSearch ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setBrandSearch("")} sx={{ color: "rgba(255,255,255,0.7)" }}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Box>

              {/* Brand list */}
              <Box sx={{ flex: 1, overflowY: "auto" }}>
                {loadingTypes ? (
                  <BrandSkeleton />
                ) : filteredBrands.length === 0 ? (
                  <Stack alignItems="center" spacing={1} sx={{ py: 5, px: 2 }}>
                    <DirectionsCarIcon sx={{ fontSize: 40, color: "grey.300" }} />
                    <Typography variant="body2" color="text.secondary" align="center">
                      {brandSearch ? t("noResults") : t("platform@carManagement.noBrands")}
                    </Typography>
                  </Stack>
                ) : (
                  <Stack spacing={0}>
                    {filteredBrands.map((brand, idx) => (
                      <Box key={brand.id}>
                        {idx > 0 && <Divider sx={{ mx: 1.5 }} />}
                        <Box
                          onClick={() => { setSelectedTypeId(brand.id); setModelSearch(""); }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            px: 1.5,
                            py: 1,
                            cursor: "pointer",
                            bgcolor: selectedTypeId === brand.id ? "primary.50" : "transparent",
                            borderLeft: selectedTypeId === brand.id ? "3px solid" : "3px solid transparent",
                            borderColor: selectedTypeId === brand.id ? "primary.main" : "transparent",
                            transition: "all 0.15s",
                            "&:hover": { bgcolor: selectedTypeId === brand.id ? "primary.50" : "grey.50" },
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 34, height: 34,
                              bgcolor: selectedTypeId === brand.id ? "primary.main" : "grey.200",
                              color: selectedTypeId === brand.id ? "#fff" : "text.secondary",
                              fontSize: 13, fontWeight: 700, mr: 1.5, flexShrink: 0,
                            }}
                          >
                            {brand.name.slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Typography
                            variant="body2"
                            fontWeight={selectedTypeId === brand.id ? 700 : 500}
                            color={selectedTypeId === brand.id ? "primary.main" : "text.primary"}
                            sx={{ flex: 1 }}
                          >
                            {brand.name}
                          </Typography>
                          <Stack direction="row" spacing={0.25} onClick={(e) => e.stopPropagation()}>
                            <Tooltip title={t("edit")}>
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); setEditBrand(brand); setEditBrandName(brand.name); }}
                              >
                                <EditIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t("delete")}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => { e.stopPropagation(); setBrandToDelete(brand); }}
                              >
                                <DeleteIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                          {selectedTypeId === brand.id && (
                            <ChevronRightIcon sx={{ fontSize: 18, color: "primary.main", ml: 0.5 }} />
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>

            {/* ─── RIGHT: Models ─── */}
            <Paper
              elevation={0}
              sx={{ flex: 1, minWidth: 0, border: 1, borderColor: "grey.200", borderRadius: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              {/* Models panel header */}
              <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "grey.200", bgcolor: "grey.50" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {selectedType
                        ? t("platform@carManagement.modelsFor", { name: selectedType.name })
                        : t("platform@carManagement.selectBrand")}
                    </Typography>
                    {selectedType && !loadingModels && (
                      <Chip label={models.length} size="small" color="primary" sx={{ fontWeight: 700, height: 20, fontSize: 11 }} />
                    )}
                  </Stack>
                  {selectedTypeId != null && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => { setAddModelName(""); setAddModelOpen(true); }}
                      sx={{ fontSize: 12 }}
                    >
                      {t("platform@carManagement.addModel")}
                    </Button>
                  )}
                </Stack>

                {/* Model search */}
                {selectedTypeId != null && (
                  <TextField
                    size="small"
                    placeholder={t("search")}
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    sx={{ mt: 1.5 }}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
                      endAdornment: modelSearch ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setModelSearch("")}>
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                )}
              </Box>

              {/* Models body */}
              <Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
                {selectedTypeId == null ? (
                  <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
                    <Box
                      sx={{
                        width: 72, height: 72, borderRadius: "50%",
                        background: GRADIENT,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <DirectionsCarIcon sx={{ fontSize: 36, color: "#fff" }} />
                    </Box>
                    <Typography variant="body1" fontWeight={600} color="text.secondary">
                      {t("platform@carManagement.selectBrand")}
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      {t("platform@carManagement.selectBrandHint")}
                    </Typography>
                  </Stack>
                ) : loadingModels ? (
                  <ModelSkeleton />
                ) : filteredModels.length === 0 ? (
                  <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
                    <DirectionsCarIcon sx={{ fontSize: 40, color: "grey.300" }} />
                    <Typography variant="body2" color="text.secondary">
                      {modelSearch ? t("noResults") : t("platform@carManagement.noModels")}
                    </Typography>
                    {!modelSearch && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => { setAddModelName(""); setAddModelOpen(true); }}
                      >
                        {t("platform@carManagement.addModel")}
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <Stack spacing={0.75}>
                    {filteredModels.map((model) => (
                      <Paper
                        key={model.id}
                        elevation={0}
                        sx={{
                          px: 2, py: 1.25,
                          border: 1, borderColor: "grey.200", borderRadius: 1.5,
                          display: "flex", alignItems: "center",
                          "&:hover": { borderColor: "primary.200", bgcolor: "primary.50" },
                          transition: "all 0.15s",
                        }}
                      >
                        <DirectionsCarIcon sx={{ fontSize: 16, color: "text.disabled", mr: 1.5 }} />
                        <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
                          {model.name}
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title={t("edit")}>
                            <IconButton size="small" onClick={() => { setEditModel(model); setEditModelName(model.name); }}>
                              <EditIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("delete")}>
                            <IconButton size="small" color="error" onClick={() => setModelToDelete(model)}>
                              <DeleteIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>
          </Box>
        </Stack>
      </Box>

      {/* ── Add Brand ── */}
      <Dialog open={addBrandOpen} onClose={() => !addBrandMutation.isPending && setAddBrandOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ background: GRADIENT, color: "#fff", py: 1.5 }}>
          {t("platform@carManagement.addBrand")}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <TextField
            autoFocus fullWidth
            label={t("platform@carManagement.brandName")}
            value={addBrandName}
            onChange={(e) => setAddBrandName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addBrandName.trim() && addBrandMutation.mutate(addBrandName.trim())}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBrandOpen(false)} color="inherit" disabled={addBrandMutation.isPending}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={() => addBrandName.trim() && addBrandMutation.mutate(addBrandName.trim())}
            disabled={!addBrandName.trim() || addBrandMutation.isPending}
            startIcon={addBrandMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
          >
            {t("add")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Brand ── */}
      <Dialog open={!!editBrand} onClose={() => !updateBrandMutation.isPending && setEditBrand(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ background: GRADIENT, color: "#fff", py: 1.5 }}>
          {t("platform@carManagement.editBrand")}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <TextField
            autoFocus fullWidth
            label={t("platform@carManagement.brandName")}
            value={editBrandName}
            onChange={(e) => setEditBrandName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && editBrand && editBrandName.trim() &&
              updateBrandMutation.mutate({ id: editBrand.id, name: editBrandName.trim() })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditBrand(null)} color="inherit" disabled={updateBrandMutation.isPending}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={() => editBrand && editBrandName.trim() && updateBrandMutation.mutate({ id: editBrand.id, name: editBrandName.trim() })}
            disabled={!editBrandName.trim() || updateBrandMutation.isPending}
            startIcon={updateBrandMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <EditIcon />}
          >
            {t("save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Brand ── */}
      <Dialog open={!!brandToDelete} onClose={() => !deleteBrandMutation.isPending && setBrandToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ background: "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)", color: "#fff", py: 1.5 }}>
          {t("platform@carManagement.deleteBrandTitle")}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography>{t("platform@carManagement.deleteBrandMessage")} <strong>{brandToDelete?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBrandToDelete(null)} color="inherit" disabled={deleteBrandMutation.isPending}>{t("cancel")}</Button>
          <Button
            color="error" variant="contained"
            onClick={() => brandToDelete && deleteBrandMutation.mutate(brandToDelete.id)}
            disabled={deleteBrandMutation.isPending}
            startIcon={deleteBrandMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Model ── */}
      <Dialog open={addModelOpen} onClose={() => !addModelMutation.isPending && setAddModelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ background: GRADIENT, color: "#fff", py: 1.5 }}>
          {t("platform@carManagement.addModel")}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          {selectedType && (
            <Chip
              icon={<DirectionsCarIcon sx={{ fontSize: "14px !important" }} />}
              label={selectedType.name}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mb: 2 }}
            />
          )}
          <TextField
            autoFocus fullWidth
            label={t("platform@carManagement.modelName")}
            value={addModelName}
            onChange={(e) => setAddModelName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && selectedTypeId != null && addModelName.trim() &&
              addModelMutation.mutate({ name: addModelName.trim(), carTypeId: selectedTypeId })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddModelOpen(false)} color="inherit" disabled={addModelMutation.isPending}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={() => selectedTypeId != null && addModelName.trim() && addModelMutation.mutate({ name: addModelName.trim(), carTypeId: selectedTypeId })}
            disabled={!addModelName.trim() || selectedTypeId == null || addModelMutation.isPending}
            startIcon={addModelMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
          >
            {t("add")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Model ── */}
      <Dialog open={!!editModel} onClose={() => !updateModelMutation.isPending && setEditModel(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ background: GRADIENT, color: "#fff", py: 1.5 }}>
          {t("platform@carManagement.editModel")}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <TextField
            autoFocus fullWidth
            label={t("platform@carManagement.modelName")}
            value={editModelName}
            onChange={(e) => setEditModelName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && editModel && selectedTypeId != null && editModelName.trim() &&
              updateModelMutation.mutate({ id: editModel.id, name: editModelName.trim(), carTypeId: selectedTypeId })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModel(null)} color="inherit" disabled={updateModelMutation.isPending}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={() => editModel && selectedTypeId != null && editModelName.trim() && updateModelMutation.mutate({ id: editModel.id, name: editModelName.trim(), carTypeId: selectedTypeId })}
            disabled={!editModelName.trim() || selectedTypeId == null || updateModelMutation.isPending}
            startIcon={updateModelMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <EditIcon />}
          >
            {t("save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Model ── */}
      <Dialog open={!!modelToDelete} onClose={() => !deleteModelMutation.isPending && setModelToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ background: "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)", color: "#fff", py: 1.5 }}>
          {t("platform@carManagement.deleteModelTitle")}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography>{t("platform@carManagement.deleteModelMessage")} <strong>{modelToDelete?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModelToDelete(null)} color="inherit" disabled={deleteModelMutation.isPending}>{t("cancel")}</Button>
          <Button
            color="error" variant="contained"
            onClick={() => modelToDelete && deleteModelMutation.mutate(modelToDelete.id)}
            disabled={deleteModelMutation.isPending}
            startIcon={deleteModelMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
