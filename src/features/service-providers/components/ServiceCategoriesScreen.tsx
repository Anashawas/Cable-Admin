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
  Avatar,
  Typography,
  Divider,
} from "@mui/material";
import {  GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import CategoryIcon from "@mui/icons-material/Category";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  useServiceCategories,
  useCreateServiceCategory,
  useUpdateServiceCategory,
} from "../hooks/use-service-categories";
import type {
  ServiceCategoryDto,
  CreateServiceCategoryRequest,
  UpdateServiceCategoryRequest,
} from "../types/api";

export default function ServiceCategoriesScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const {
    data,
    isLoading,
    search,
    handleSearchChange,
    handleRefresh,
  } = useServiceCategories();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

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

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return data.slice(start, start + paginationModel.pageSize);
  }, [data, paginationModel.page, paginationModel.pageSize]);

  const handleAddNew = useCallback(() => {
    setEditingCategory(null);
    setFormData({
      name: "",
      nameAr: "",
      description: "",
      iconUrl: "",
      sortOrder: 0,
      isActive: true,
    });
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
      // Update
      updateMutation.mutate(
        { id: editingCategory.id, data: formData as UpdateServiceCategoryRequest },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("serviceCategories@updated") });
            setFormDialogOpen(false);
            setEditingCategory(null);
          },
          onError: (err: Error) => {
            openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
          },
        }
      );
    } else {
      // Create
      createMutation.mutate(formData, {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("serviceCategories@created") });
          setFormDialogOpen(false);
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      });
    }
  }, [formData, editingCategory, createMutation, updateMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const columns: GridColDef<ServiceCategoryDto>[] = [
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
      field: "nameAr",
      headerName: t("nameAr"),
      flex: 1,
      minWidth: 200,
    },
    {
      field: "sortOrder",
      headerName: t("sortOrder"),
      width: 120,
      align: "center",
      headerAlign: "center",
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
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t("edit")}>
            <IconButton size="small" onClick={(e) => handleEdit(e, params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
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
        icon={<CategoryIcon />}
        title={t("serviceCategories")}
        subtitle={t("serviceCategories@subtitle")}
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
      <Dialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: editingCategory ? "warning.main" : "primary.main" }}>
              {editingCategory ? <EditIcon /> : <AddIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {editingCategory ? t("serviceCategories@edit") : t("serviceCategories@addNew")}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
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
              label={t("nameAr")}
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              fullWidth
            />
            <TextField
              label={t("description")}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label={t("iconUrl")}
              value={formData.iconUrl}
              onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
              fullWidth
            />
            <TextField
              label={t("sortOrder")}
              type="number"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
              }
              fullWidth
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
        <Divider />
        <DialogActions sx={{ gap: 1, px: 3, py: 2 }}>
          <Button
            onClick={handleCloseFormDialog}
            disabled={createMutation.isPending || updateMutation.isPending}
            size="large"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            size="large"
            disabled={createMutation.isPending || updateMutation.isPending}
            startIcon={
              (createMutation.isPending || updateMutation.isPending) && (
                <CircularProgress size={20} />
              )
            }
          >
            {createMutation.isPending || updateMutation.isPending
              ? editingCategory
                ? t("updating")
                : t("creating")
              : editingCategory
              ? t("update")
              : t("create")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
