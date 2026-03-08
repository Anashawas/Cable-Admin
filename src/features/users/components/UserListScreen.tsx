import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import UserDetailDrawer from "./UserDetailDrawer";
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
  Paper,
  MenuItem,
  InputAdornment,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { GridColDef, GridPaginationModel, GridRowSelectionModel } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import GroupIcon from "@mui/icons-material/Group";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid, BulkActionsBar } from "../../../components";
import { getUsersList, deleteUserById, updateUserProfile, getUserById } from "../services/user-service";
import type { UserSummaryDto } from "../types/api";
import { useSnackbarStore } from "../../../stores";
import { useCarTypeStats } from "../hooks/use-user-stats";
import { PROVIDER_ROLE_ID } from "../constants/roles";

export default function UserListScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserSummaryDto | null>(null);
  const [drawerUser, setDrawerUser] = useState<UserSummaryDto | null>(null);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState<UserSummaryDto | null>(null);
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["users", "list"],
    queryFn: ({ signal }) => getUsersList(signal),
  });

  const carStats = useCarTypeStats(data);
  const brandOptions = useMemo(() => carStats.map((s) => s.name), [carStats]);

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

  const changeRoleMutation = useMutation({
    mutationFn: async (user: UserSummaryDto) => {
      const detail = await getUserById(user.id!);
      return updateUserProfile(user.id!, {
        name: detail.name,
        email: detail.email,
        phone: detail.phone ?? "",
        isActive: detail.isActive,
        roleId: PROVIDER_ROLE_ID,
        country: detail.country ?? null,
        city: detail.city ?? null,
      });
    },
    onSuccess: (_, user) => {
      // Update the cached list directly — do NOT refetch since GetAllUsers
      // returns stale role data from the server and would overwrite our update
      queryClient.setQueryData<UserSummaryDto[]>(["users", "list"], (old) =>
        old?.map((u) =>
          u.id === user.id ? { ...u, role: { id: PROVIDER_ROLE_ID, name: "Provider" } } : u
        ) ?? []
      );
      // Also invalidate the detail cache so the drawer shows fresh data
      queryClient.invalidateQueries({ queryKey: ["users", "detail", user.id] });
      openSuccessSnackbar({ message: t("userManagement@roleChangedToProvider") });
      setChangeRoleDialogOpen(false);
      setUserToChangeRole(null);
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const filteredData = useMemo(() => {
    let result = data;

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (row) =>
          String(row.id ?? "").toLowerCase().includes(q) ||
          (row.name ?? "").toLowerCase().includes(q) ||
          (row.email ?? "").toLowerCase().includes(q)
      );
    }

    if (dateFrom || dateTo) {
      const from = dateFrom ? dateFrom.getTime() : 0;
      const to = dateTo
        ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999).getTime()
        : Infinity;
      result = result.filter((row) => {
        if (!row.createdAt) return false;
        const ms = new Date(row.createdAt).getTime();
        return ms >= from && ms <= to;
      });
    }

    if (selectedBrand) {
      result = result.filter((row) =>
        row.userCars?.some((c) => c.carTypeName?.trim() === selectedBrand)
      );
    }

    return result;
  }, [data, search, dateFrom, dateTo, selectedBrand]);

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return filteredData.slice(start, start + paginationModel.pageSize);
  }, [filteredData, paginationModel.page, paginationModel.pageSize]);

  const hasActiveFilters = search || dateFrom || dateTo || selectedBrand;

  const clearFilters = useCallback(() => {
    setSearch("");
    setDateFrom(null);
    setDateTo(null);
    setSelectedBrand("");
  }, []);

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

  const handleChangeRoleClick = useCallback((e: React.MouseEvent, row: UserSummaryDto) => {
    e.stopPropagation();
    setUserToChangeRole(row);
    setChangeRoleDialogOpen(true);
  }, []);

  const handleRowClick = useCallback((row: UserSummaryDto) => {
    setDrawerUser(row);
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

  const selectedIds = useMemo(() => (rowSelectionModel as number[]).filter((id) => id != null), [rowSelectionModel]);

  const handleBulkExport = useCallback(() => {
    const rows = filteredData.filter((r) => selectedIds.includes(r.id ?? -1));
    if (rows.length === 0) return;
    const headers = ["id", "name", "email", "phone", "role"];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => {
          const v = h === "role" ? r.role?.name : (r as unknown as Record<string, unknown>)[h];
          return `"${String(v ?? "").replace(/"/g, '""')}"`;
        }).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredData, selectedIds]);

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedIds.length > 0) setBulkDeleteDialogOpen(true);
  }, [selectedIds.length]);

  const handleConfirmBulkDelete = useCallback(async () => {
    for (const id of selectedIds) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch { /* error shown by mutation */ }
    }
    queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    setBulkDeleteDialogOpen(false);
    setRowSelectionModel([]);
    if (selectedIds.length > 0) {
      openSuccessSnackbar({ message: t("userManagement@bulkDeleted", { count: selectedIds.length }) });
    }
  }, [selectedIds, deleteMutation, queryClient, openSuccessSnackbar, t]);

  const columns: GridColDef<UserSummaryDto>[] = useMemo(
    () => [
      { field: "id", headerName: t("userManagement@columns.id"), width: 80, minWidth: 70, filterable: false },
      { field: "name", headerName: t("userManagement@columns.name"), minWidth: 160, flex: 0.6, filterable: false, sortable: false },
      { field: "email", headerName: t("userManagement@columns.email"), minWidth: 200, flex: 0.8, filterable: false, sortable: false },
      { field: "phone", headerName: t("userManagement@columns.phone"), minWidth: 130, flex: 0.4, filterable: false, sortable: false },
      { field: "role", headerName: t("userManagement@columns.role"), minWidth: 120, width: 120, valueGetter: (_, row) => row.role?.name ?? "—", filterable: false, sortable: false },
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
              label={active ? t("userManagement@columns.active") : t("userManagement@columns.inactive")}
              color={active ? "success" : "error"}
              variant="filled"
            />
          );
        },
      },
      {
        field: "actions",
        headerName: t("userManagement@columns.actions"),
        width: 150,
        minWidth: 150,
        filterable: false,
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
            <Tooltip title={t("userManagement@actions.edit")}>
              <IconButton size="small" onClick={(e) => handleEdit(e, row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {row.role?.id !== PROVIDER_ROLE_ID && (
              <Tooltip title={t("userManagement@actions.makeProvider")}>
                <IconButton size="small" color="primary" onClick={(e) => handleChangeRoleClick(e, row)}>
                  <BusinessCenterIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={t("userManagement@actions.delete")}>
              <IconButton size="small" color="error" onClick={(e) => handleDeleteClick(e, row)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [t, handleEdit, handleDeleteClick, handleChangeRoleClick]
  );

  const headerActions: ScreenHeaderAction[] = useMemo(
    () => [{ id: "refresh", icon: <RefreshIcon />, label: t("refresh"), onClick: () => refetch() }],
    [t, refetch]
  );

  if (error) {
    return (
      <AppScreenContainer>
        <Box p={2}><Typography color="error">{t("loadingFailed")}</Typography></Box>
      </AppScreenContainer>
    );
  }

  return (
    <AppScreenContainer>
      <Box sx={{ width: "100%", minWidth: 0, overflow: "hidden", boxSizing: "border-box", p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2.5} sx={{ width: "100%", minWidth: 0 }}>

          <ScreenHeader title={t("userManagement@title")} actions={headerActions} />

          {/* ── Manage Users section ── */}
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
            {/* Section header */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ px: 2.5, py: 1.5, bgcolor: "grey.800" }}
            >
              <GroupIcon sx={{ color: "#fff", fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={700} color="#fff">
                {t("userManagement@manageUsers")}
              </Typography>
              {hasActiveFilters && (
                <Chip
                  label={`${filteredData.length} / ${data.length}`}
                  size="small"
                  color="warning"
                  sx={{ fontWeight: 700, ml: 0.5 }}
                />
              )}
            </Stack>

            <Box sx={{ p: 2 }}>
              {/* Filter bar */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap" alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
                {/* Search */}
                <TextField
                  size="small"
                  label={t("userManagement@search")}
                  placeholder={t("userManagement@searchPlaceholder")}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                  sx={{ minWidth: 220 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
                    endAdornment: search ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearch("")}><ClearIcon fontSize="small" /></IconButton>
                      </InputAdornment>
                    ) : undefined,
                  }}
                />

                {/* Date filters */}
                <DatePicker
                  label={t("userManagement@insights_dateFrom")}
                  value={dateFrom}
                  onChange={(d) => { setDateFrom(d); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                  maxDate={dateTo ?? undefined}
                  slotProps={{ textField: { size: "small", sx: { minWidth: 160 } } }}
                />
                <DatePicker
                  label={t("userManagement@insights_dateTo")}
                  value={dateTo}
                  onChange={(d) => { setDateTo(d); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                  minDate={dateFrom ?? undefined}
                  slotProps={{ textField: { size: "small", sx: { minWidth: 160 } } }}
                />

                {/* Car brand filter */}
                {brandOptions.length > 0 && (
                  <TextField
                    select
                    size="small"
                    label={t("userManagement@insights_carTypeStats")}
                    value={selectedBrand}
                    onChange={(e) => { setSelectedBrand(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                    sx={{ minWidth: 180 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><DirectionsCarIcon fontSize="small" color="action" /></InputAdornment>,
                    }}
                  >
                    <MenuItem value="">{t("userManagement@allBrands")}</MenuItem>
                    <Divider />
                    {brandOptions.map((brand) => (
                      <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                    ))}
                  </TextField>
                )}

                {/* Clear all filters */}
                {hasActiveFilters && (
                  <Tooltip title={t("userManagement@clearFilters")}>
                    <Button
                      variant="outlined"
                      size="small"
                      color="inherit"
                      startIcon={<FilterListIcon />}
                      onClick={clearFilters}
                      sx={{ borderColor: "divider", color: "text.secondary", whiteSpace: "nowrap" }}
                    >
                      {t("userManagement@clearFilters")}
                    </Button>
                  </Tooltip>
                )}
              </Stack>

              <AppDataGrid<UserSummaryDto>
                data={paginatedData}
                columns={columns}
                loading={isLoading}
                getRowId={(row) => row.id ?? row.name + row.email}
                disablePagination={false}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                total={filteredData.length}
                minHeight="60vh"
                enableColumnFilter
                enableToolbar
                checkboxSelection
                rowSelectionModel={rowSelectionModel}
                onRowSelectionModelChange={setRowSelectionModel}
                onRowClick={({ row }) => handleRowClick(row)}
                sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
              />
            </Box>
          </Paper>

          <BulkActionsBar
            selectedCount={selectedIds.length}
            onClearSelection={() => setRowSelectionModel([])}
            onBulkExport={handleBulkExport}
            onBulkDelete={handleBulkDeleteClick}
            loading={deleteMutation.isPending}
          />
        </Stack>
      </Box>

      <UserDetailDrawer
        user={drawerUser}
        onClose={() => setDrawerUser(null)}
        onEdit={(u) => { const id = u.id ?? 0; if (id > 0) navigate(`/users/${id}/edit`); }}
        onDelete={(u) => { setUserToDelete(u); setDeleteDialogOpen(true); }}
      />

      {/* Single delete */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth sx={{ zIndex: 10002 }}>
        <DialogTitle>{t("userManagement@deleteConfirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography>{t("userManagement@deleteConfirmMessage")} {userToDelete?.name ?? ""}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit" disabled={deleteMutation.isPending}>{t("cancel")}</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <CircularProgress size={20} color="inherit" /> : t("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Role to Provider */}
      <Dialog
        open={changeRoleDialogOpen}
        onClose={() => { if (!changeRoleMutation.isPending) { setChangeRoleDialogOpen(false); setUserToChangeRole(null); } }}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 10002 }}
      >
        <DialogTitle sx={{ background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)", color: "#fff" }}>
          {t("userManagement@makeProviderTitle")}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography>
            {t("userManagement@makeProviderConfirm", { name: userToChangeRole?.name ?? "" })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => { setChangeRoleDialogOpen(false); setUserToChangeRole(null); }}
            color="inherit"
            disabled={changeRoleMutation.isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={() => { if (userToChangeRole) changeRoleMutation.mutate(userToChangeRole); }}
            color="primary"
            variant="contained"
            disabled={changeRoleMutation.isPending}
            startIcon={changeRoleMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <BusinessCenterIcon />}
          >
            {t("userManagement@makeProviderAction")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk delete */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => !deleteMutation.isPending && setBulkDeleteDialogOpen(false)} maxWidth="sm" fullWidth sx={{ zIndex: 10002 }}>
        <DialogTitle>{t("delete")}</DialogTitle>
        <DialogContent>
          <Typography>{t("userManagement@bulkDeleteConfirm", { count: selectedIds.length })}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} color="inherit" disabled={deleteMutation.isPending}>{t("cancel")}</Button>
          <Button onClick={handleConfirmBulkDelete} color="error" variant="contained" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <CircularProgress size={20} color="inherit" /> : t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
