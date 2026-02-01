import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  getAllCarModels,
  getAllPlugTypes,
  addUserCar,
  deleteUserCar,
} from "../services/user-car-service";
import type { UserCarDto, CarTypeWithModelsDto } from "../types/api";
import { useSnackbarStore } from "../../../stores";

/** Flatten userCars to one row per car model for table + delete (carModelId). */
export interface UserCarRow {
  carModelId: number;
  brand: string;
  model: string;
  plugName: string;
}

function flattenUserCars(userCars: UserCarDto[] | undefined): UserCarRow[] {
  if (!userCars?.length) return [];
  const rows: UserCarRow[] = [];
  for (const uc of userCars) {
    const brand = uc.carTypeName ?? "—";
    for (const cm of uc.carModels ?? []) {
      rows.push({
        carModelId: cm.carModelId ?? 0,
        brand,
        model: cm.carModelName ?? "—",
        plugName: cm.plugTypes?.name ?? "—",
      });
    }
  }
  return rows;
}

/** Option for grouped Autocomplete: car model with group = brand name. */
interface CarModelOption {
  id: number;
  name: string;
  group: string;
}

function buildCarModelOptions(types: CarTypeWithModelsDto[]): CarModelOption[] {
  const options: CarModelOption[] = [];
  for (const t of types) {
    const group = t.name ?? "—";
    for (const m of t.carModels ?? []) {
      options.push({ id: m.id, name: m.name ?? "—", group });
    }
  }
  return options;
}

interface UserCarsSectionProps {
  userId: number;
  userCars: UserCarDto[] | undefined;
  onRefresh: () => void;
}

export default function UserCarsSection({
  userId,
  userCars,
  onRefresh,
}: UserCarsSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCarModel, setSelectedCarModel] = useState<CarModelOption | null>(null);
  const [selectedPlugTypeId, setSelectedPlugTypeId] = useState<number | "">("");

  const { data: carTypes = [], isLoading: loadingCarTypes } = useQuery({
    queryKey: ["user-cars", "car-models"],
    queryFn: ({ signal }) => getAllCarModels(signal),
    enabled: addDialogOpen,
  });

  const { data: plugTypes = [], isLoading: loadingPlugTypes } = useQuery({
    queryKey: ["user-cars", "plug-types"],
    queryFn: ({ signal }) => getAllPlugTypes(signal),
    enabled: addDialogOpen,
  });

  const addMutation = useMutation({
    mutationFn: (body: { userId: number; carModelId: number; plugTypeId: number }) =>
      addUserCar(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      openSuccessSnackbar({ message: t("userManagement@cars.added") });
      onRefresh();
      setAddDialogOpen(false);
      setSelectedCarModel(null);
      setSelectedPlugTypeId("");
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (carModelId: number) => deleteUserCar(carModelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      openSuccessSnackbar({ message: t("userManagement@cars.removed") });
      onRefresh();
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const carModelOptions = useMemo(
    () => buildCarModelOptions(carTypes),
    [carTypes]
  );

  const rows = useMemo(() => flattenUserCars(userCars), [userCars]);

  const handleOpenAdd = useCallback(() => {
    setSelectedCarModel(null);
    setSelectedPlugTypeId("");
    setAddDialogOpen(true);
  }, []);

  const handleCloseAdd = useCallback(() => {
    if (!addMutation.isPending) {
      setAddDialogOpen(false);
      setSelectedCarModel(null);
      setSelectedPlugTypeId("");
    }
  }, [addMutation.isPending]);

  const handleAddSubmit = useCallback(() => {
    if (!selectedCarModel || selectedPlugTypeId === "") return;
    addMutation.mutate({
      userId,
      carModelId: selectedCarModel.id,
      plugTypeId: Number(selectedPlugTypeId),
    });
  }, [userId, selectedCarModel, selectedPlugTypeId, addMutation]);

  const handleRemove = useCallback(
    (carModelId: number) => {
      deleteMutation.mutate(carModelId);
    },
    [deleteMutation]
  );

  const canAddSubmit =
    selectedCarModel != null &&
    selectedPlugTypeId !== "" &&
    !addMutation.isPending;

  return (
    <Box sx={{ mt: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">
          {t("userManagement@cars.title")}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          size="small"
        >
          {t("userManagement@cars.addCar")}
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 720 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("userManagement@cars.brand")}</TableCell>
              <TableCell>{t("userManagement@cars.model")}</TableCell>
              <TableCell>{t("userManagement@cars.plugType")}</TableCell>
              <TableCell align="right" width={80}>
                {t("userManagement@cars.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    {t("userManagement@cars.noCars")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow key={`${row.carModelId}-${row.plugName}-${idx}`}>
                  <TableCell>{row.brand}</TableCell>
                  <TableCell>{row.model}</TableCell>
                  <TableCell>{row.plugName}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemove(row.carModelId)}
                      disabled={deleteMutation.isPending}
                      aria-label={t("userManagement@cars.remove")}
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

      <Dialog
        open={addDialogOpen}
        onClose={handleCloseAdd}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 10002 }}
      >
        <DialogTitle>{t("userManagement@cars.addDialogTitle")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Autocomplete<CarModelOption>
              options={carModelOptions}
              groupBy={(option) => option.group}
              getOptionLabel={(option) => option.name}
              value={selectedCarModel}
              onChange={(_, newValue) => setSelectedCarModel(newValue)}
              loading={loadingCarTypes}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("userManagement@cars.carModel")}
                  required
                />
              )}
              isOptionEqualToValue={(a, b) => a.id === b.id}
            />
            <TextField
              select
              fullWidth
              label={t("userManagement@cars.plugType")}
              value={selectedPlugTypeId}
              onChange={(e) =>
                setSelectedPlugTypeId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              required
              SelectProps={{ native: true }}
              disabled={loadingPlugTypes}
            >
              <option value="">—</option>
              {plugTypes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.id}
                </option>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdd} color="inherit" disabled={addMutation.isPending}>
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleAddSubmit}
            disabled={!canAddSubmit}
          >
            {addMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("userManagement@cars.addCar")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
