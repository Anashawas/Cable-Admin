import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid } from "../../../components";
import { getUsersList, deleteUserById } from "../services/user-service";
import type { UserSummaryDto } from "../types/api";
import { useSnackbarStore } from "../../../stores";

export default function UserListScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [search, setSearch] = useState("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserSummaryDto | null>(null);

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["users", "list"],
    queryFn: ({ signal }) => getUsersList(signal),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUserById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
      openSuccessSnackbar({ message: t("userManagement@deleted") });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (row) =>
        String(row.id ?? "").toLowerCase().includes(q) ||
        (row.name ?? "").toLowerCase().includes(q) ||
        (row.email ?? "").toLowerCase().includes(q)
    );
  }, [data, search]);

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return filteredData.slice(start, start + paginationModel.pageSize);
  }, [filteredData, paginationModel.page, paginationModel.pageSize]);

  const handleEdit = useCallback(
    (e: React.MouseEvent, row: UserSummaryDto) => {
      e.stopPropagation();
      const id = row.id ?? 0;
      if (id > 0) navigate(`/users/${id}/edit`);
    },
    [navigate]
  );

  const handleDeleteClick = useCallback((e: React.MouseEvent, row: UserSummaryDto) => {
    e.stopPropagation();
    setUserToDelete(row);
    setDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    if (!deleteMutation.isPending) {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  }, [deleteMutation.isPending]);

  const handleConfirmDelete = useCallback(() => {
    if (userToDelete?.id != null) {
      deleteMutation.mutate(userToDelete.id);
    }
  }, [userToDelete, deleteMutation]);

  const columns: GridColDef<UserSummaryDto>[] = useMemo(
    () => [
      {
        field: "id",
        headerName: t("userManagement@columns.id"),
        width: 80,
        minWidth: 70,
        filterable: false,
        sortable: true,
      },
      {
        field: "name",
        headerName: t("userManagement@columns.name"),
        minWidth: 160,
        flex: 0.6,
        filterable: false,
        sortable: false,
      },
      {
        field: "email",
        headerName: t("userManagement@columns.email"),
        minWidth: 200,
        flex: 0.8,
        filterable: false,
        sortable: false,
      },
      {
        field: "phone",
        headerName: t("userManagement@columns.phone"),
        minWidth: 130,
        flex: 0.4,
        filterable: false,
        sortable: false,
      },
      {
        field: "role",
        headerName: t("userManagement@columns.role"),
        minWidth: 120,
        width: 120,
        valueGetter: (_, row) => row.role?.name ?? "—",
        filterable: false,
        sortable: false,
      },
      {
        field: "isActive",
        headerName: t("userManagement@columns.status"),
        minWidth: 100,
        width: 100,
        filterable: false,
        sortable: false,
        renderCell: ({ row }) => {
          const active = row.isActive !== false;
          return (
            <Chip
              size="small"
              label={active ? t("userManagement@active") : t("userManagement@inactive")}
              color={active ? "success" : "error"}
              variant="filled"
            />
          );
        },
      },
      {
        field: "actions",
        headerName: t("userManagement@columns.actions"),
        width: 120,
        minWidth: 120,
        filterable: false,
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
            <Tooltip title={t("userManagement@actions.edit")}>
              <IconButton
                size="small"
                onClick={(e) => handleEdit(e, row)}
                aria-label={t("userManagement@actions.edit")}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("userManagement@actions.delete")}>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => handleDeleteClick(e, row)}
                aria-label={t("userManagement@actions.delete")}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [t, handleEdit, handleDeleteClick]
  );

  const headerActions: ScreenHeaderAction[] = useMemo(
    () => [
      {
        id: "refresh",
        icon: <RefreshIcon />,
        label: t("refresh"),
        onClick: () => refetch(),
      },
    ],
    [t, refetch]
  );

  if (error) {
    return (
      <AppScreenContainer>
        <Box p={2}>
          <Typography color="error">{t("loadingFailed")}</Typography>
        </Box>
      </AppScreenContainer>
    );
  }

  return (
    <AppScreenContainer>
      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          boxSizing: "border-box",
          p: { xs: 1, sm: 2 },
        }}
      >
        <Stack spacing={2} sx={{ width: "100%", minWidth: 0 }}>
          <ScreenHeader
            title={t("userManagement@title")}
            actions={headerActions}
          />

          <TextField
            size="small"
            label={t("userManagement@search")}
            placeholder={t("userManagement@searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ maxWidth: 320 }}
          />

          <AppDataGrid<UserSummaryDto>
            data={paginatedData}
            columns={columns}
            loading={isLoading}
            getRowId={(row) => row.id ?? row.name + row.email}
            disablePagination={false}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            total={filteredData.length}
            minHeight="70vh"
          />
        </Stack>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 10002 }}
      >
        <DialogTitle>{t("userManagement@deleteConfirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("userManagement@deleteConfirmMessage")} {userToDelete?.name ?? ""}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteDialog}
            color="inherit"
            disabled={deleteMutation.isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("delete")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
