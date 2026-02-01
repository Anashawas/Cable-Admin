import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Stack,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
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

export default function CarDatabaseScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [addBrandOpen, setAddBrandOpen] = useState(false);
  const [addBrandName, setAddBrandName] = useState("");
  const [editBrandOpen, setEditBrandOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<CarTypeDto | null>(null);
  const [editBrandName, setEditBrandName] = useState("");
  const [deleteBrandOpen, setDeleteBrandOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<CarTypeDto | null>(null);
  const [addModelOpen, setAddModelOpen] = useState(false);
  const [addModelName, setAddModelName] = useState("");
  const [editModelOpen, setEditModelOpen] = useState(false);
  const [editModel, setEditModel] = useState<CarModelDto | null>(null);
  const [editModelName, setEditModelName] = useState("");
  const [deleteModelOpen, setDeleteModelOpen] = useState(false);
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
      setEditBrandOpen(false);
      setEditBrand(null);
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (id: number) => deleteCarType(id),
    onSuccess: () => {
      invalidateCarQueries();
      openSuccessSnackbar({ message: t("platform@carManagement.brandDeleted") });
      setDeleteBrandOpen(false);
      setBrandToDelete(null);
      if (brandToDelete && selectedTypeId === brandToDelete.id) setSelectedTypeId(null);
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
      setEditModelOpen(false);
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
      setDeleteModelOpen(false);
      setModelToDelete(null);
      refetchModels();
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const handleOpenEditBrand = useCallback((e: React.MouseEvent, type: CarTypeDto) => {
    e.stopPropagation();
    setEditBrand(type);
    setEditBrandName(type.name);
    setEditBrandOpen(true);
  }, []);

  const handleOpenDeleteBrand = useCallback((e: React.MouseEvent, type: CarTypeDto) => {
    e.stopPropagation();
    setBrandToDelete(type);
    setDeleteBrandOpen(true);
  }, []);

  const handleOpenEditModel = useCallback((model: CarModelDto) => {
    setEditModel(model);
    setEditModelName(model.name);
    setEditModelOpen(true);
  }, []);

  const handleOpenDeleteModel = useCallback((model: CarModelDto) => {
    setModelToDelete(model);
    setDeleteModelOpen(true);
  }, []);

  const selectedType = carTypes.find((t) => t.id === selectedTypeId);

  return (
    <AppScreenContainer>
      <Box sx={{ width: "100%", minWidth: 0, p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <ScreenHeader
            title={t("platform@carManagement.title")}
            actions={[
              {
                id: "refresh",
                icon: <RefreshIcon />,
                label: t("refresh"),
                onClick: () => {
                  refetchTypes();
                  if (selectedTypeId != null) refetchModels();
                },
              },
            ]}
          />

          <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" }, minHeight: 400 }}>
            {/* Left: Brands list */}
            <Paper variant="outlined" sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="600">
                  {t("platform@carManagement.brands")}
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setAddBrandOpen(true)}>
                  {t("platform@carManagement.addBrand")}
                </Button>
              </Stack>
              <List dense disablePadding sx={{ maxHeight: 360, overflow: "auto" }}>
                {loadingTypes ? (
                  <Box display="flex" justifyContent="center" py={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : carTypes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
                    {t("platform@carManagement.noBrands")}
                  </Typography>
                ) : (
                  carTypes.map((type) => (
                    <ListItemButton
                      key={type.id}
                      selected={selectedTypeId === type.id}
                      onClick={() => setSelectedTypeId(type.id)}
                    >
                      <ListItemText primary={type.name} />
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          edge="end"
                          onClick={(e) => handleOpenEditBrand(e, type)}
                          aria-label={t("edit")}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          edge="end"
                          color="error"
                          onClick={(e) => handleOpenDeleteBrand(e, type)}
                          aria-label={t("delete")}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                  ))
                )}
              </List>
            </Paper>

            {/* Right: Models table */}
            <Paper variant="outlined" sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.5 }}>
                <Typography variant="subtitle1" fontWeight="600">
                  {selectedType
                    ? t("platform@carManagement.modelsFor", { name: selectedType.name })
                    : t("platform@carManagement.selectBrand")}
                </Typography>
                {selectedTypeId != null && (
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setAddModelName("");
                      setAddModelOpen(true);
                    }}
                  >
                    {t("platform@carManagement.addModel")}
                  </Button>
                )}
              </Stack>
              <TableContainer sx={{ maxHeight: 360 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("platform@carManagement.modelName")}</TableCell>
                      <TableCell align="right" width={120}>
                        {t("platform@carManagement.actions")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedTypeId == null ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            {t("platform@carManagement.selectBrand")}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : loadingModels ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 3 }}>
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : models.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">
                            {t("platform@carManagement.noModels")}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      models.map((model) => (
                        <TableRow key={model.id}>
                          <TableCell>{model.name}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditModel(model)}
                              aria-label={t("edit")}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDeleteModel(model)}
                              aria-label={t("delete")}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Stack>
      </Box>

      {/* Add Brand */}
      <Dialog open={addBrandOpen} onClose={() => setAddBrandOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("platform@carManagement.addBrand")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label={t("platform@carManagement.brandName")}
            value={addBrandName}
            onChange={(e) => setAddBrandName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBrandOpen(false)}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={() => addBrandName.trim() && addBrandMutation.mutate(addBrandName.trim())}
            disabled={!addBrandName.trim() || addBrandMutation.isPending}
          >
            {addBrandMutation.isPending ? <CircularProgress size={20} /> : t("add")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Brand */}
      <Dialog open={editBrandOpen} onClose={() => setEditBrandOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("platform@carManagement.editBrand")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label={t("platform@carManagement.brandName")}
            value={editBrandName}
            onChange={(e) => setEditBrandName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditBrandOpen(false)}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={() =>
              editBrand &&
              editBrandName.trim() &&
              updateBrandMutation.mutate({ id: editBrand.id, name: editBrandName.trim() })
            }
            disabled={!editBrandName.trim() || updateBrandMutation.isPending}
          >
            {updateBrandMutation.isPending ? <CircularProgress size={20} /> : t("save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Brand confirm */}
      <Dialog open={deleteBrandOpen} onClose={() => setDeleteBrandOpen(false)}>
        <DialogTitle>{t("platform@carManagement.deleteBrandTitle")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("platform@carManagement.deleteBrandMessage")} {brandToDelete?.name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteBrandOpen(false)}>{t("cancel")}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => brandToDelete && deleteBrandMutation.mutate(brandToDelete.id)}
            disabled={deleteBrandMutation.isPending}
          >
            {deleteBrandMutation.isPending ? <CircularProgress size={20} /> : t("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Model */}
      <Dialog open={addModelOpen} onClose={() => setAddModelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("platform@carManagement.addModel")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label={t("platform@carManagement.modelName")}
            value={addModelName}
            onChange={(e) => setAddModelName(e.target.value)}
            sx={{ mt: 1 }}
          />
          {selectedType && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              {t("platform@carManagement.forBrand", { name: selectedType.name })}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddModelOpen(false)}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={() =>
              selectedTypeId != null &&
              addModelName.trim() &&
              addModelMutation.mutate({ name: addModelName.trim(), carTypeId: selectedTypeId })
            }
            disabled={
              !addModelName.trim() || selectedTypeId == null || addModelMutation.isPending
            }
          >
            {addModelMutation.isPending ? <CircularProgress size={20} /> : t("add")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Model */}
      <Dialog open={editModelOpen} onClose={() => setEditModelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("platform@carManagement.editModel")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label={t("platform@carManagement.modelName")}
            value={editModelName}
            onChange={(e) => setEditModelName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModelOpen(false)}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={() =>
              editModel &&
              selectedTypeId != null &&
              editModelName.trim() &&
              updateModelMutation.mutate({
                id: editModel.id,
                name: editModelName.trim(),
                carTypeId: selectedTypeId,
              })
            }
            disabled={
              !editModelName.trim() ||
              selectedTypeId == null ||
              updateModelMutation.isPending
            }
          >
            {updateModelMutation.isPending ? <CircularProgress size={20} /> : t("save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Model confirm */}
      <Dialog open={deleteModelOpen} onClose={() => setDeleteModelOpen(false)}>
        <DialogTitle>{t("platform@carManagement.deleteModelTitle")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("platform@carManagement.deleteModelMessage")} {modelToDelete?.name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModelOpen(false)}>{t("cancel")}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => modelToDelete && deleteModelMutation.mutate(modelToDelete.id)}
            disabled={deleteModelMutation.isPending}
          >
            {deleteModelMutation.isPending ? <CircularProgress size={20} /> : t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
