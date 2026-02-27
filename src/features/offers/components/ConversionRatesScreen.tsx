import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
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
  FormControlLabel,
  Switch,
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
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
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const {
    data,
    isLoading,
    search,
    handleSearchChange,
    handleRefresh,
  } = useConversionRates();

  const createMutation = useCreateConversionRate();
  const updateMutation = useUpdateConversionRate();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

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
    setFormData({
      name: "",
      currencyCode: "",
      pointsPerUnit: 1,
      isDefault: false,
      isActive: true,
    });
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
      openErrorSnackbar({ message: t("conversionRates@requiredFields") });
      return;
    }

    if (editingRate) {
      updateMutation.mutate(
        { id: editingRate.id, data: formData },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("conversionRates@updated") });
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
          openSuccessSnackbar({ message: t("conversionRates@created") });
          setFormDialogOpen(false);
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      });
    }
  }, [formData, editingRate, createMutation, updateMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const columns: GridColDef<ConversionRateDto>[] = [
    {
      field: "id",
      headerName: t("id"),
      width: 80,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "name",
      headerName: t("name"),
      flex: 1,
      minWidth: 200,
    },
    {
      field: "currencyCode",
      headerName: t("currency"),
      width: 120,
    },
    {
      field: "pointsPerUnit",
      headerName: t("pointsPerUnit"),
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => `${params.value} ${t("points")}`,
    },
    {
      field: "isDefault",
      headerName: t("default"),
      width: 100,
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
      width: 120,
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
      width: 100,
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

  const headerActions: ScreenHeaderAction[] = [
    {
      id: "refresh",
      label: t("refresh"),
      icon: <RefreshIcon />,
      onClick: handleRefresh,
    },
    {
      id: "addNew",
      label: t("addNew"),
      icon: <AddIcon />,
      onClick: handleAddNew,
    },
  ];

  return (
    <AppScreenContainer>
      <ScreenHeader
        icon={<MonetizationOnIcon />}
        title={t("conversionRates")}
        subtitle={t("conversionRates@subtitle")}
        actions={headerActions}
      />

      <Box sx={{ mt: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder={t("search")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            sx={{ minWidth: 300 }}
          />
        </Stack>

        <AppDataGrid
          data={paginatedData}
          columns={columns}
          loading={isLoading}
          disablePagination={false}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          total={data.length}
        />
      </Box>

      {/* Form Dialog */}
      <Dialog open={formDialogOpen} onClose={handleCloseFormDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRate ? t("conversionRates@edit") : t("conversionRates@addNew")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label={t("name")}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={t("currency")}
              value={formData.currencyCode}
              onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
              required
              fullWidth
              placeholder="KWD, USD, etc."
            />
            <TextField
              label={t("pointsPerUnit")}
              type="number"
              value={formData.pointsPerUnit}
              onChange={(e) =>
                setFormData({ ...formData, pointsPerUnit: parseFloat(e.target.value) || 1 })
              }
              required
              fullWidth
              helperText={t("conversionRates@pointsHelp")}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
              }
              label={t("setAsDefault")}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label={t("active")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog} disabled={createMutation.isPending || updateMutation.isPending}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <CircularProgress size={20} />
            ) : editingRate ? (
              t("update")
            ) : (
              t("create")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
