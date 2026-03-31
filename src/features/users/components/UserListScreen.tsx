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
  DialogContent,
  DialogActions,
  Button,
  Chip,
  CircularProgress,
  Paper,
  MenuItem,
  InputAdornment,
  Divider,
  Avatar,
  Tab,
  Tabs,
  Badge,
  Grid,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  DialogTitle,
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
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";
import StoreIcon from "@mui/icons-material/Store";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AddIcon from "@mui/icons-material/Add";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid, BulkActionsBar } from "../../../components";
import { getUsersList, deleteUserById, updateUserProfile, getUserById, createUser } from "../services/user-service";
import type { UserSummaryDto, CreateUserRequest } from "../types/api";
import { useSnackbarStore } from "../../../stores";
import { useCarTypeStats } from "../hooks/use-user-stats";
import { PROVIDER_ROLE_ID, DEFAULT_ROLES } from "../constants/roles";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";

const isAdmin    = (u: { role?: { id?: number } }) => u.role?.id === 2;
const isUser     = (u: { role?: { id?: number } }) => u.role?.id === 3;
const isProvider = (u: { role?: { id?: number } }) => u.role?.id === 4;

type RoleTab = "all" | "users" | "admins" | "providers";

const ROLE_TAB_CONFIG: Record<RoleTab, { label: string; roleName: string | null; icon: React.ReactNode; gradient: string }> = {
  all:       { label: "All",       roleName: null,       icon: <GroupIcon />,              gradient: "linear-gradient(135deg, #0d3276 0%, #1565c0 100%)" },
  users:     { label: "Users",     roleName: "user",     icon: <PersonIcon />,             gradient: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)" },
  admins:    { label: "Admins",    roleName: "admin",    icon: <AdminPanelSettingsIcon />, gradient: "linear-gradient(135deg, #4a148c 0%, #6a1b9a 100%)" },
  providers: { label: "Providers", roleName: "provider", icon: <StoreIcon />,             gradient: "linear-gradient(135deg, #bf360c 0%, #e65100 100%)" },
};

export default function UserListScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [activeTab, setActiveTab] = useState<RoleTab>("all");
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
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUserForm, setNewUserForm] = useState<CreateUserRequest>({
    name: "",
    email: "",
    password: "",
    roleId: 3,
    country: "",
    city: "",
  });

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["users", "list"],
    queryFn: ({ signal }) => getUsersList(signal),
  });

  const { data: allServiceProviders = [] } = useQuery({
    queryKey: ["service-providers-all"],
    queryFn: () => getAllServiceProviders(),
    staleTime: 5 * 60 * 1000,
  });

  const providersByOwner = useMemo(() => {
    const map = new Map<number, number>();
    allServiceProviders.forEach((sp) => {
      map.set(sp.ownerId, (map.get(sp.ownerId) ?? 0) + 1);
    });
    return map;
  }, [allServiceProviders]);

  const carStats = useCarTypeStats(data);
  const brandOptions = useMemo(() => carStats.map((s) => s.name), [carStats]);

  const roleCounts = useMemo(() => ({
    all:       data.length,
    users:     data.filter(isUser).length,
    admins:    data.filter(isAdmin).length,
    providers: data.filter(isProvider).length,
  }), [data]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUserById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
      openSuccessSnackbar({ message: t("userManagement@deleted") });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const changeRoleMutation = useMutation({
    mutationFn: async (user: UserSummaryDto) => {
      const detail = await getUserById(user.id!);
      return updateUserProfile(user.id!, {
        name: detail.name,
        email: detail.email,
        isActive: detail.isActive,
        roleId: PROVIDER_ROLE_ID,
        country: detail.country ?? null,
        city: detail.city ?? null,
      });
    },
    onSuccess: (_, user) => {
      queryClient.setQueryData<UserSummaryDto[]>(["users", "list"], (old) =>
        old?.map((u) =>
          u.id === user.id ? { ...u, role: { id: PROVIDER_ROLE_ID, name: "Provider" } } : u
        ) ?? []
      );
      queryClient.invalidateQueries({ queryKey: ["users", "detail", user.id] });
      openSuccessSnackbar({ message: t("userManagement@roleChangedToProvider") });
      setChangeRoleDialogOpen(false);
      setUserToChangeRole(null);
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
      openSuccessSnackbar({ message: t("userManagement@userCreated") });
      setAddUserDialogOpen(false);
      setNewUserForm({ name: "", email: "", password: "", roleId: 3, country: "", city: "" });
      setShowPassword(false);
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const handleCreateUserSubmit = useCallback(() => {
    if (!newUserForm.name?.trim()) {
      openErrorSnackbar({ message: t("userManagement@nameRequired") });
      return;
    }
    if (!newUserForm.email?.trim()) {
      openErrorSnackbar({ message: t("userManagement@emailRequired") });
      return;
    }
    if (!newUserForm.password || newUserForm.password.length < 6) {
      openErrorSnackbar({ message: t("userManagement@passwordMinLength") });
      return;
    }
    createUserMutation.mutate({
      ...newUserForm,
      name: newUserForm.name?.trim() || null,
      email: newUserForm.email?.trim() || null,
      password: newUserForm.password?.trim() || null,
      country: newUserForm.country?.trim() || null,
      city: newUserForm.city?.trim() || null,
    });
  }, [newUserForm, createUserMutation, openErrorSnackbar, t]);

  const filteredData = useMemo(() => {
    let result = data;
    if (activeTab === "users")     result = result.filter(isUser);
    else if (activeTab === "admins")    result = result.filter(isAdmin);
    else if (activeTab === "providers") result = result.filter(isProvider);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((row) =>
      String(row.id ?? "").includes(q) ||
      (row.name ?? "").toLowerCase().includes(q) ||
      (row.email ?? "").toLowerCase().includes(q) ||
      (row.phone ?? "").includes(q)
    );
    if (dateFrom || dateTo) {
      const from = dateFrom ? dateFrom.getTime() : 0;
      const to = dateTo ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999).getTime() : Infinity;
      result = result.filter((row) => {
        if (!row.createdAt) return false;
        const ms = new Date(row.createdAt).getTime();
        return ms >= from && ms <= to;
      });
    }
    if (selectedBrand) result = result.filter((row) => row.userCars?.some((c) => c.carTypeName?.trim() === selectedBrand));
    return result;
  }, [data, activeTab, search, dateFrom, dateTo, selectedBrand]);

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return filteredData.slice(start, start + paginationModel.pageSize);
  }, [filteredData, paginationModel.page, paginationModel.pageSize]);

  const hasActiveFilters = search || dateFrom || dateTo || selectedBrand;

  const clearFilters = useCallback(() => {
    setSearch(""); setDateFrom(null); setDateTo(null); setSelectedBrand("");
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, []);

  const handleTabChange = useCallback((_: React.SyntheticEvent, val: RoleTab) => {
    setActiveTab(val);
    setPaginationModel((p) => ({ ...p, page: 0 }));
    setRowSelectionModel([]);
  }, []);

  const handleEdit = useCallback((e: React.MouseEvent, row: UserSummaryDto) => {
    e.stopPropagation();
    const id = row.id ?? 0;
    if (id > 0) navigate(`/users/${id}/edit`);
  }, [navigate]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, row: UserSummaryDto) => {
    e.stopPropagation(); setUserToDelete(row); setDeleteDialogOpen(true);
  }, []);

  const handleChangeRoleClick = useCallback((e: React.MouseEvent, row: UserSummaryDto) => {
    e.stopPropagation(); setUserToChangeRole(row); setChangeRoleDialogOpen(true);
  }, []);

  const handleRowClick = useCallback((row: UserSummaryDto) => { setDrawerUser(row); }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    if (!deleteMutation.isPending) { setDeleteDialogOpen(false); setUserToDelete(null); }
  }, [deleteMutation.isPending]);

  const handleConfirmDelete = useCallback(() => {
    if (userToDelete?.id != null) deleteMutation.mutate(userToDelete.id);
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
    a.href = url; a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [filteredData, selectedIds]);

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedIds.length > 0) setBulkDeleteDialogOpen(true);
  }, [selectedIds.length]);

  const handleConfirmBulkDelete = useCallback(async () => {
    for (const id of selectedIds) {
      try { await deleteMutation.mutateAsync(id); } catch { /* shown by mutation */ }
    }
    queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    setBulkDeleteDialogOpen(false); setRowSelectionModel([]);
    if (selectedIds.length > 0) openSuccessSnackbar({ message: t("userManagement@bulkDeleted", { count: selectedIds.length }) });
  }, [selectedIds, deleteMutation, queryClient, openSuccessSnackbar, t]);

  const roleChip = useCallback((roleName: string) => {
    const n = roleName.toLowerCase();
    const cfg =
      n === "admin"    ? { color: "secondary" as const, icon: <AdminPanelSettingsIcon sx={{ fontSize: "13px !important" }} /> } :
      n === "provider" ? { color: "warning"   as const, icon: <StoreIcon sx={{ fontSize: "13px !important" }} /> } :
                         { color: "success"   as const, icon: <PersonIcon sx={{ fontSize: "13px !important" }} /> };
    return <Chip label={roleName} size="small" color={cfg.color} icon={cfg.icon} variant="filled" sx={{ fontWeight: 600 }} />;
  }, []);

  const columns: GridColDef<UserSummaryDto>[] = useMemo(
    () => [
      { field: "id", headerName: t("userManagement@columns.id"), width: 72, align: "center", headerAlign: "center", filterable: false },
      {
        field: "name", headerName: t("userManagement@columns.name"), minWidth: 200, flex: 0.7, filterable: false, sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%", py: 0.5 }}>
            <Avatar
              sx={{
                width: 34, height: 34, fontSize: 14, fontWeight: 700,
                bgcolor: isAdmin(row) ? "secondary.main" : isProvider(row) ? "warning.main" : "success.main",
              }}
            >
              {(row.name ?? "?").charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{row.name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{row.email}</Typography>
            </Box>
          </Stack>
        ),
      },
      {
        field: "phone", headerName: t("userManagement@columns.phone"), minWidth: 130, flex: 0.4, filterable: false, sortable: false,
        renderCell: ({ row }) => <Typography variant="body2" color={row.phone ? "text.primary" : "text.disabled"}>{row.phone ?? "—"}</Typography>,
      },
      {
        field: "role", headerName: t("userManagement@columns.role"), width: 130, valueGetter: (_, row) => row.role?.name ?? "—", filterable: false, sortable: false,
        renderCell: ({ row }) => row.role ? roleChip(row.role.name) : <Typography variant="body2" color="text.disabled">—</Typography>,
      },
      {
        field: "providers", headerName: t("userManagement@columns.providers"), width: 100, align: "center", headerAlign: "center", filterable: false, sortable: false,
        renderCell: ({ row }) => {
          const count = providersByOwner.get(row.id!) ?? 0;
          return count > 0 ? (
            <Chip
              icon={<StoreIcon sx={{ fontSize: "13px !important" }} />}
              label={count}
              size="small"
              color="info"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          ) : (
            <Typography variant="body2" color="text.disabled">—</Typography>
          );
        },
      },
      {
        field: "isActive", headerName: t("userManagement@columns.status"), width: 100, align: "center", headerAlign: "center", filterable: false, sortable: false,
        renderCell: ({ row }) => {
          const active = row.isActive !== false;
          return <Chip size="small" label={active ? t("userManagement@columns.active") : t("userManagement@columns.inactive")} color={active ? "success" : "error"} variant="outlined" sx={{ fontWeight: 600 }} />;
        },
      },
      {
        field: "createdAt", headerName: t("userManagement@columns.createdAt") ?? "Joined", width: 110, align: "center", headerAlign: "center", filterable: false,
        renderCell: ({ row }) => row.createdAt
          ? <Typography variant="caption" color="text.secondary">{new Date(row.createdAt).toLocaleDateString()}</Typography>
          : <Typography variant="caption" color="text.disabled">—</Typography>,
      },
      {
        field: "actions", headerName: t("userManagement@columns.actions"), width: 120, align: "center", headerAlign: "center", filterable: false, sortable: false, disableColumnMenu: true,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
            <Tooltip title={t("userManagement@actions.edit")}>
              <IconButton size="small" onClick={(e) => handleEdit(e, row)}><EditIcon fontSize="small" /></IconButton>
            </Tooltip>
            {!isProvider(row) && (
              <Tooltip title={t("userManagement@actions.makeProvider")}>
                <IconButton size="small" color="warning" onClick={(e) => handleChangeRoleClick(e, row)}><BusinessCenterIcon fontSize="small" /></IconButton>
              </Tooltip>
            )}
            <Tooltip title={t("userManagement@actions.delete")}>
              <IconButton size="small" color="error" onClick={(e) => handleDeleteClick(e, row)}><DeleteIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [t, roleChip, handleEdit, handleDeleteClick, handleChangeRoleClick, providersByOwner]
  );

  const tabConfig = ROLE_TAB_CONFIG[activeTab];

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

          {/* ── Gradient Page Header ── */}
          <Box
            sx={{
              background: tabConfig.gradient,
              borderRadius: 3, p: 3, color: "white",
              position: "relative", overflow: "hidden",
              transition: "background 0.4s ease",
            }}
          >
            <Box sx={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)" }} />
            <Box sx={{ position: "absolute", bottom: -20, right: 80, width: 90, height: 90, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)" }} />

            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 54, height: 54 }}>
                  {tabConfig.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800}>{t("userManagement@title")}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.3 }}>
                    {t("userManagement@subtitle") ?? "Manage platform users by role"}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setAddUserDialogOpen(true)}
                  sx={{
                    background: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.3)",
                    fontWeight: 600,
                    "&:hover": { background: "rgba(255,255,255,0.3)" },
                  }}
                >
                  {t("userManagement@addUser")}
                </Button>
                <Tooltip title={t("refresh")}>
                  <IconButton
                    onClick={() => refetch()}
                    sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {/* Clickable KPI cards */}
            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }} flexWrap="wrap">
              {(Object.keys(ROLE_TAB_CONFIG) as RoleTab[]).map((key) => {
                const cfg = ROLE_TAB_CONFIG[key];
                const count = roleCounts[key];
                const isSelected = activeTab === key;
                return (
                  <Paper
                    key={key} elevation={0}
                    onClick={() => { setActiveTab(key); setPaginationModel((p) => ({ ...p, page: 0 })); setRowSelectionModel([]); }}
                    sx={{
                      px: 2, py: 1.5, borderRadius: 2.5, cursor: "pointer", minWidth: 110,
                      bgcolor: isSelected ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                      border: "1px solid",
                      borderColor: isSelected ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                      transition: "all 0.2s",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ color: "#fff", display: "flex" }}>{cfg.icon}</Box>
                      <Box>
                        <Typography variant="h6" fontWeight={800} color="#fff" lineHeight={1}>{count}</Typography>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{cfg.label}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Box>

          {/* ── Main Table Card ── */}
          <Paper elevation={2} sx={{ borderRadius: 3, overflow: "hidden" }}>

            {/* Role Tabs */}
            <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 1 }}>
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ "& .MuiTab-root": { fontWeight: 600, minHeight: 52 } }}>
                {(Object.keys(ROLE_TAB_CONFIG) as RoleTab[]).map((key) => {
                  const cfg = ROLE_TAB_CONFIG[key];
                  const badgeColor = key === "admins" ? "secondary" : key === "providers" ? "warning" : key === "users" ? "success" : "primary";
                  return (
                    <Tab
                      key={key} value={key}
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Badge badgeContent={roleCounts[key]} color={badgeColor as "secondary" | "warning" | "success" | "primary"} max={999}>
                            <Box sx={{ display: "flex" }}>{cfg.icon}</Box>
                          </Badge>
                          <span>{cfg.label}</span>
                        </Stack>
                      }
                    />
                  );
                })}
              </Tabs>
            </Box>

            <Box sx={{ p: 2.5 }}>
              {/* Filter bar */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap" alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  placeholder={t("userManagement@searchPlaceholder")}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                  sx={{ minWidth: 240 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
                    endAdornment: search ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearch("")}><ClearIcon fontSize="small" /></IconButton>
                      </InputAdornment>
                    ) : undefined,
                  }}
                />
                <DatePicker
                  label={t("userManagement@insights_dateFrom")}
                  value={dateFrom}
                  onChange={(d) => { setDateFrom(d); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                  maxDate={dateTo ?? undefined}
                  slotProps={{ textField: { size: "small", sx: { minWidth: 155 } } }}
                />
                <DatePicker
                  label={t("userManagement@insights_dateTo")}
                  value={dateTo}
                  onChange={(d) => { setDateTo(d); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                  minDate={dateFrom ?? undefined}
                  slotProps={{ textField: { size: "small", sx: { minWidth: 155 } } }}
                />
                {brandOptions.length > 0 && (
                  <TextField
                    select size="small"
                    label={t("userManagement@insights_carTypeStats")}
                    value={selectedBrand}
                    onChange={(e) => { setSelectedBrand(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                    sx={{ minWidth: 175 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><DirectionsCarIcon fontSize="small" color="action" /></InputAdornment> }}
                  >
                    <MenuItem value="">{t("userManagement@allBrands")}</MenuItem>
                    <Divider />
                    {brandOptions.map((brand) => <MenuItem key={brand} value={brand}>{brand}</MenuItem>)}
                  </TextField>
                )}
                {hasActiveFilters && (
                  <Tooltip title={t("userManagement@clearFilters")}>
                    <Button variant="outlined" size="small" color="inherit" startIcon={<FilterListIcon />} onClick={clearFilters}
                      sx={{ borderColor: "divider", color: "text.secondary", whiteSpace: "nowrap" }}>
                      {t("userManagement@clearFilters")}
                    </Button>
                  </Tooltip>
                )}
                <Box sx={{ flex: 1 }} />
                {hasActiveFilters && (
                  <Chip label={`${filteredData.length} / ${roleCounts[activeTab]}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
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
                sx={{
                  "& .MuiDataGrid-row": { cursor: "pointer" },
                  "& .MuiDataGrid-columnHeaders": { bgcolor: "grey.50" },
                }}
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

      {/* ── Single Delete Dialog ── */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }} sx={{ zIndex: 10002 }}>
        <Box sx={{ background: "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)", px: 3, py: 2.5, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}>
              <WarningAmberIcon sx={{ color: "#fff" }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700} color="#fff">{t("userManagement@deleteConfirmTitle")}</Typography>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography color="text.secondary">
            {t("userManagement@deleteConfirmMessage")}{" "}
            <Typography component="span" fontWeight={700} color="text.primary">{userToDelete?.name ?? ""}</Typography>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteMutation.isPending}>{t("cancel")}</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" size="large" disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}>
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Change Role to Provider Dialog ── */}
      <Dialog
        open={changeRoleDialogOpen}
        onClose={() => { if (!changeRoleMutation.isPending) { setChangeRoleDialogOpen(false); setUserToChangeRole(null); } }}
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }} sx={{ zIndex: 10002 }}
      >
        <Box sx={{ background: "linear-gradient(135deg, #bf360c 0%, #e65100 100%)", px: 3, py: 2.5, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}>
              <BusinessCenterIcon sx={{ color: "#fff" }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700} color="#fff">{t("userManagement@makeProviderTitle")}</Typography>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography color="text.secondary">
            {t("userManagement@makeProviderConfirm", { name: userToChangeRole?.name ?? "" })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => { setChangeRoleDialogOpen(false); setUserToChangeRole(null); }} disabled={changeRoleMutation.isPending}>{t("cancel")}</Button>
          <Button
            onClick={() => { if (userToChangeRole) changeRoleMutation.mutate(userToChangeRole); }}
            color="warning" variant="contained" size="large" disabled={changeRoleMutation.isPending}
            startIcon={changeRoleMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <BusinessCenterIcon />}>
            {t("userManagement@makeProviderAction")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Bulk Delete Dialog ── */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => !deleteMutation.isPending && setBulkDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }} sx={{ zIndex: 10002 }}>
        <Box sx={{ background: "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)", px: 3, py: 2.5, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}>
              <WarningAmberIcon sx={{ color: "#fff" }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700} color="#fff">{t("delete")}</Typography>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography color="text.secondary">{t("userManagement@bulkDeleteConfirm", { count: selectedIds.length })}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>{t("cancel")}</Button>
          <Button onClick={handleConfirmBulkDelete} color="error" variant="contained" size="large" disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}>
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══ Add User Dialog ══ */}
      <Dialog
        open={addUserDialogOpen}
        onClose={() => { if (!createUserMutation.isPending) setAddUserDialogOpen(false); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <Box sx={{
          background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
          px: 3, py: 2.5,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 48, height: 48, borderRadius: 2, background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PersonAddIcon sx={{ color: "white", fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="white">{t("userManagement@addUser")}</Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("userManagement@addUserSubtitle")}</Typography>
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Stack spacing={2.5}>
            {/* Name */}
            <TextField
              label={`${t("userManagement@form.name")} *`}
              value={newUserForm.name}
              onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
              fullWidth
              autoFocus
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />

            {/* Email */}
            <TextField
              label={`${t("userManagement@form.email")} *`}
              type="email"
              value={newUserForm.email}
              onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />

            {/* Password */}
            <TextField
              label={`${t("userManagement@form.password")} *`}
              type={showPassword ? "text" : "password"}
              value={newUserForm.password}
              onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              fullWidth
              helperText={t("userManagement@form.passwordHint")}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />

            {/* Role */}
            <FormControl fullWidth>
              <InputLabel>{t("userManagement@form.role")} *</InputLabel>
              <Select
                value={newUserForm.roleId}
                label={`${t("userManagement@form.role")} *`}
                onChange={(e) => setNewUserForm({ ...newUserForm, roleId: e.target.value as number })}
                sx={{ borderRadius: 2 }}
              >
                {DEFAULT_ROLES.map((role) => (
                  <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Country + City */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("userManagement@form.country")}
                  value={newUserForm.country ?? ""}
                  onChange={(e) => setNewUserForm({ ...newUserForm, country: e.target.value })}
                  fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start"><PublicIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("userManagement@form.city")}
                  value={newUserForm.city ?? ""}
                  onChange={(e) => setNewUserForm({ ...newUserForm, city: e.target.value })}
                  fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start"><LocationCityIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setAddUserDialogOpen(false)}
            disabled={createUserMutation.isPending}
            color="inherit"
            variant="outlined"
            sx={{ borderRadius: 2, minWidth: 100 }}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleCreateUserSubmit}
            variant="contained"
            disabled={createUserMutation.isPending}
            startIcon={createUserMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <PersonAddIcon />}
            sx={{
              borderRadius: 2, minWidth: 160,
              background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
              "&:hover": { background: "linear-gradient(135deg, #0a3880 0%, #0d47a1 100%)" },
            }}
          >
            {createUserMutation.isPending ? t("creating") : t("userManagement@createUser")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
