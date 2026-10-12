import { useMemo, useState, useCallback, useEffect, type ReactNode } from "react";
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
  Menu,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Divider,
  Avatar,
  Tab,
  Tabs,
  Grid,
  Select,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
  Skeleton,
  useMediaQuery,
  useTheme,
  alpha,
  keyframes,
} from "@mui/material";
import { GridColDef, GridPaginationModel, GridRowSelectionModel } from "@mui/x-data-grid";
import { arSD } from "@mui/x-data-grid/locales";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import GroupIcon from "@mui/icons-material/Group";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import PersonIcon from "@mui/icons-material/Person";
import StoreIcon from "@mui/icons-material/Store";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RestoreIcon from "@mui/icons-material/Restore";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import LoyaltyIcon from "@mui/icons-material/Loyalty";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useLoyaltySummary } from "../../loyalty/hooks/use-loyalty";
import { AppDataGrid, BulkActionsBar } from "../../../components";
import { getUsersPaged, getUsersSummary, deleteUserById, updateUserProfile, getUserById, createUser, restoreUsers } from "../services/user-service";
import type { UserSummaryDto, CreateUserRequest } from "../types/api";
import { useSnackbarStore } from "../../../stores";
import { useListState, reviveDateOrNull } from "../../../hooks";
import { PROVIDER_ROLE_ID, DEFAULT_ROLES } from "../constants/roles";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";
import { cityKey, cityLabel } from "../../dashboard/utils/city-names";
import { AR_MONTHS_LEVANTINE, formatLongDate, parseApiDate } from "../../../utils/date-format";
import { toCallableNumber } from "../../../utils/phone";
import { normalizeSearchText, normalizePhoneDigits } from "../../../utils/search-normalize";

const isProvider = (u: { role?: { id?: number } }) => u.role?.id === 4;

type RoleTab = "all" | "users" | "admins" | "providers";
const ROLE_TABS: RoleTab[] = ["all", "users", "admins", "providers"];

type RoleKey = "user" | "admin" | "provider" | "worker" | "superadmin" | "other";
type RoleTone = "default" | "secondary" | "warning" | "info";

const roleKeyOf = (roleName?: string | null): RoleKey => {
  const n = (roleName ?? "").toLowerCase().replace(/[\s_-]+/g, "");
  if (n === "user") return "user";
  if (n === "admin") return "admin";
  if (n === "superadmin") return "superadmin";
  if (n === "provider" || n === "serviceprovider") return "provider";
  if (n === "worker") return "worker";
  return "other";
};

const ROLE_TONE: Record<RoleKey, RoleTone> = {
  user: "default",
  admin: "secondary",
  superadmin: "secondary",
  provider: "warning",
  worker: "info",
  other: "default",
};

/** Western digits regardless of UI language. */
const fmtNum = (n: number | null | undefined) => (n ?? 0).toLocaleString("en-US");

/**
 * Search is server-side, so the API contract is unchanged — we only shape the
 * term so it matches how data is stored: phone-like input ("+962 79…", "079…",
 * Arabic-Indic digits) collapses to its national digits (a substring of the
 * stored "96279…"); other text keeps its letters, with Arabic-Indic digits folded.
 */
const toServerSearch = (raw: string): string => {
  const folded = normalizeSearchText(raw);
  if (/^[+ds()-]+$/.test(folded) && folded.replace(/D/g, "").length >= 4) return normalizePhoneDigits(raw);
  return raw.replace(/[٠-٩۰-۹]/g, (d) => normalizeSearchText(d));
};

/** "1 تشرين الأول 2026" / "1 Oct 2026" — Western digits. */
const formatJoinDate = (value: string | null | undefined, lang: string): string | null => {
  const d = parseApiDate(value);
  if (!d) return null;
  if (lang.startsWith("ar")) return `${d.getDate()} ${AR_MONTHS_LEVANTINE[d.getMonth()]} ${d.getFullYear()}`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const formatJoinDateFull = (value: string | null | undefined, lang: string): string => {
  const d = parseApiDate(value);
  if (!d) return "";
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${formatLongDate(d, lang)}${lang.startsWith("ar") ? "، " : ", "}${time}`;
};

/** "962790000444" → "+962 79 000 0444"; unrecognised shapes are shown as stored. */
const formatPhone = (raw?: string | null): string | null => {
  if (!raw) return null;
  const callable = toCallableNumber(raw);
  if (!callable) return raw;
  const n = callable.slice(4);
  if (n.length === 9) return `+962 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`;
  if (n.length === 8) return `+962 ${n.slice(0, 1)} ${n.slice(1, 4)} ${n.slice(4)}`;
  return callable;
};

function SummaryItem({ label, value, tone }: { label: string; value: ReactNode; tone?: "error" }) {
  return (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" noWrap component="div" sx={{ lineHeight: 1.4 }}>{label}</Typography>
    <Typography
      variant="subtitle1"
      fontWeight={700}
      noWrap
      sx={{ lineHeight: 1.3, fontVariantNumeric: "tabular-nums", color: tone === "error" ? "error.main" : "text.primary" }}
    >
      {value}
    </Typography>
  </Box>
);
}

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

export default function UserListScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "ar";
  const isAr = lang.startsWith("ar");
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [activeTab, setActiveTab] = useListState<RoleTab>("tab", "all");
  const [search, setSearch] = useListState("search", "");
  // Persisted for back-navigation restore (used by other filter UIs on this route).
  const [phoneSearch, setPhoneSearch] = useListState("phone", "");
  const [dateFrom, setDateFrom] = useListState<Date | null>("dateFrom", null, reviveDateOrNull);
  const [dateTo, setDateTo] = useListState<Date | null>("dateTo", null, reviveDateOrNull);
  const [selectedBrand, setSelectedBrand] = useListState<string>("brand", "");
  const [selectedCity, setSelectedCity] = useListState<string>("city", "");
  const [sort, setSort] = useListState("sort", "createdAt_desc");
  const [paginationModel, setPaginationModel] = useListState<GridPaginationModel>("pagination", { page: 0, pageSize: 20 });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserSummaryDto | null>(null);
  const [drawerUser, setDrawerUser] = useState<UserSummaryDto | null>(null);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState<UserSummaryDto | null>(null);
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [showDeleted, setShowDeleted] = useListState("showDeleted", false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUserForm, setNewUserForm] = useState<CreateUserRequest>({
    name: "",
    email: "",
    password: "",
    roleId: 3,
    country: "",
    city: "",
  });

  // Row "more" menu
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuRow, setMenuRow] = useState<UserSummaryDto | null>(null);

  // ── Search: the input is immediate, the query (persisted) follows after 300ms ──
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    const next = toServerSearch(searchInput);
    if (next === search) return;
    const h = window.setTimeout(() => {
      setSearch(next);
      setPaginationModel((p) => ({ ...p, page: 0 }));
    }, 300);
    return () => window.clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const applySearchNow = useCallback((value: string) => {
    setSearchInput(value);
    setSearch(value);
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [setSearch, setPaginationModel]);

  const roleId = activeTab === "users" ? 3 : activeTab === "admins" ? 2 : activeTab === "providers" ? PROVIDER_ROLE_ID : undefined;
  const usersParams = useMemo(() => ({
    search: search.trim() || undefined,
    roleId,
    city: selectedCity || undefined,
    isDeleted: showDeleted,
    sort,
    page: paginationModel.page + 1, // server is 1-based
    pageSize: paginationModel.pageSize,
  }), [search, roleId, selectedCity, showDeleted, sort, paginationModel.page, paginationModel.pageSize]);

  const { data: pageData, isLoading, isFetching, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["users", "paged", usersParams],
    queryFn: ({ signal }) => getUsersPaged(usersParams, signal),
    placeholderData: (prev) => prev,
  });
  const items = pageData?.items ?? [];
  const total = pageData?.totalCount ?? 0;

  const { data: usersSummary, refetch: refetchSummary } = useQuery({
    queryKey: ["users", "summary"],
    queryFn: ({ signal }) => getUsersSummary(signal),
    staleTime: 60 * 1000,
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

  const { data: loyaltySummary, refetch: refetchLoyalty } = useLoyaltySummary();

  const cityOptions = useMemo(
    () => (usersSummary?.byCity ?? []).map((c) => c.city),
    [usersSummary]
  );

  const roleCounts = useMemo(() => ({
    all:       usersSummary?.totalUsers ?? 0,
    users:     usersSummary?.byRole.find((r) => r.roleId === 3)?.count ?? 0,
    admins:    usersSummary?.byRole.find((r) => r.roleId === 2)?.count ?? 0,
    providers: usersSummary?.byRole.find((r) => r.roleId === PROVIDER_ROLE_ID)?.count ?? 0,
  }), [usersSummary]);

  // ── "Last updated N min ago" — re-rendered every 30s ──
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const lastUpdatedLabel = useMemo(() => {
    if (!dataUpdatedAt) return null;
    const mins = Math.floor(Math.max(0, now - dataUpdatedAt) / 60_000);
    if (mins < 1) return t("userManagement@list.updatedJustNow");
    if (mins < 60) return t("userManagement@list.updatedMinutesAgo", { count: mins });
    return t("userManagement@list.updatedHoursAgo", { count: Math.floor(mins / 60) });
  }, [dataUpdatedAt, now, t]);

  const handleRefresh = useCallback(() => {
    refetch();
    refetchSummary();
    refetchLoyalty();
  }, [refetch, refetchSummary, refetchLoyalty]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUserById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
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
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", "detail", user.id] });
      openSuccessSnackbar({ message: t("userManagement@roleChangedToProvider") });
      setChangeRoleDialogOpen(false);
      setUserToChangeRole(null);
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const restoreMutation = useMutation({
    mutationFn: (ids: number[]) => restoreUsers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      openSuccessSnackbar({ message: t("userManagement@restored") });
      setRowSelectionModel([]);
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
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

  const hasActiveFilters = !!(search || selectedCity);

  const clearFilters = useCallback(() => {
    setSearchInput(""); setSearch(""); setSelectedCity("");
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [setSearch, setSelectedCity, setPaginationModel]);

  const handleTabChange = useCallback((_: React.SyntheticEvent, val: RoleTab) => {
    setActiveTab(val);
    setPaginationModel((p) => ({ ...p, page: 0 }));
    setRowSelectionModel([]);
  }, [setActiveTab, setPaginationModel]);

  const handleEdit = useCallback((e: React.MouseEvent, row: UserSummaryDto) => {
    e.stopPropagation();
    const id = row.id ?? 0;
    if (id > 0) navigate(`/users/${id}/edit`);
  }, [navigate]);

  const handleViewProfile = useCallback((e: React.MouseEvent, row: UserSummaryDto) => {
    e.stopPropagation();
    const id = row.id ?? 0;
    if (id > 0) navigate(`/users/${id}`);
  }, [navigate]);

  const openRowMenu = useCallback((e: React.MouseEvent<HTMLElement>, row: UserSummaryDto) => {
    e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuRow(row);
  }, []);
  const closeRowMenu = useCallback(() => { setMenuAnchor(null); }, []);

  const handleRowClick = useCallback((row: UserSummaryDto) => {
    const id = row.id ?? 0;
    if (id > 0) navigate(`/users/${id}`);
  }, [navigate]);

  const handleCloseDeleteDialog = useCallback(() => {
    if (!deleteMutation.isPending) { setDeleteDialogOpen(false); setUserToDelete(null); }
  }, [deleteMutation.isPending]);

  const handleConfirmDelete = useCallback(() => {
    if (userToDelete?.id != null) deleteMutation.mutate(userToDelete.id);
  }, [userToDelete, deleteMutation]);

  const selectedIds = useMemo(() => (rowSelectionModel as number[]).filter((id) => id != null), [rowSelectionModel]);

  const handleBulkExport = useCallback(() => {
    const rows = items.filter((r) => selectedIds.includes(r.id ?? -1));
    if (rows.length === 0) return;
    const headers = ["id", "name", "email", "phone", "city", "role"];
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
  }, [items, selectedIds]);

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedIds.length > 0) setBulkDeleteDialogOpen(true);
  }, [selectedIds.length]);

  const handleConfirmBulkDelete = useCallback(async () => {
    for (const id of selectedIds) {
      try { await deleteMutation.mutateAsync(id); } catch { /* shown by mutation */ }
    }
    queryClient.invalidateQueries({ queryKey: ["users"] });
    setBulkDeleteDialogOpen(false); setRowSelectionModel([]);
    if (selectedIds.length > 0) openSuccessSnackbar({ message: t("userManagement@bulkDeleted", { count: selectedIds.length }) });
  }, [selectedIds, deleteMutation, queryClient, openSuccessSnackbar, t]);

  const roleLabel = useCallback((roleName?: string | null) => {
    const key = roleKeyOf(roleName);
    return key === "other" ? (roleName ?? "—") : t(`userManagement@list.roles.${key}`);
  }, [t]);

  /** Soft tinted avatar colours per role (works in light & dark). */
  const avatarSx = useCallback((roleName?: string | null) => {
    const tone = ROLE_TONE[roleKeyOf(roleName)];
    if (tone === "default") return { bgcolor: theme.palette.action.selected, color: theme.palette.text.secondary };
    const c = theme.palette[tone].main;
    return { bgcolor: alpha(c, theme.palette.mode === "dark" ? 0.24 : 0.12), color: theme.palette.mode === "dark" ? theme.palette[tone].light : theme.palette[tone].dark };
  }, [theme]);

  const roleChip = useCallback((roleName: string) => {
    const tone = ROLE_TONE[roleKeyOf(roleName)];
    return (
      <Chip
        label={roleLabel(roleName)}
        size="small"
        variant="outlined"
        color={tone}
        sx={{ fontWeight: 600, borderRadius: 1.5, ...(tone === "default" && { color: "text.secondary" }) }}
      />
    );
  }, [roleLabel]);

  const hiddenFields = useMemo(() => {
    const s = new Set<string>();
    if (isMdDown) { s.add("id"); s.add("city"); s.add("createdAt"); }
    if (isXs) { s.add("phone"); s.add("isActive"); s.add("providers"); }
    return s;
  }, [isMdDown, isXs]);

  const columns: GridColDef<UserSummaryDto>[] = useMemo(
    () => ([
      {
        field: "id", headerName: t("userManagement@columns.id"), width: 72, align: "center", headerAlign: "center", filterable: false,
        renderCell: ({ row }) => <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>{row.id}</Typography>,
      },
      {
        field: "name", headerName: t("userManagement@columns.name"), minWidth: 220, flex: 0.8, filterable: false, sortable: false,
        renderCell: ({ row }) => {
          // Phone-only registrations have no name/email — fall back gracefully.
          const primary = row.name?.trim() || row.email?.trim() || (row.phone ? `#${row.id}` : "—");
          const secondaryIsPhone = !row.name?.trim() || !row.email?.trim();
          const secondary = row.name?.trim()
            ? (row.email?.trim() || formatPhone(row.phone))
            : formatPhone(row.phone);
          const initialSource = row.name?.trim() || row.email?.trim();
          return (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%", height: "100%", lineHeight: "normal", minWidth: 0 }}>
              <Avatar sx={{ width: 32, height: 32, fontSize: 14, fontWeight: 700, ...avatarSx(row.role?.name) }}>
                {initialSource ? initialSource.charAt(0).toUpperCase() : <PersonIcon sx={{ fontSize: 18 }} />}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap sx={{ lineHeight: 1.4 }}>{primary}</Typography>
                {secondary && (
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", lineHeight: 1.4 }}>
                    {secondaryIsPhone ? <bdi dir="ltr">{secondary}</bdi> : <bdi>{secondary}</bdi>}
                  </Typography>
                )}
              </Box>
            </Stack>
          );
        },
      },
      {
        field: "phone", headerName: t("userManagement@columns.phone"), minWidth: 150, flex: 0.4, filterable: false, sortable: false,
        renderCell: ({ row }) => row.phone
          ? <Typography variant="body2" noWrap sx={{ fontVariantNumeric: "tabular-nums" }}><bdi dir="ltr">{formatPhone(row.phone)}</bdi></Typography>
          : <Typography variant="body2" color="text.disabled">—</Typography>,
      },
      {
        field: "role", headerName: t("userManagement@columns.role"), width: 130, valueGetter: (_, row) => roleLabel(row.role?.name), filterable: false, sortable: false,
        renderCell: ({ row }) => row.role ? roleChip(row.role.name) : <Typography variant="body2" color="text.disabled">—</Typography>,
      },
      {
        field: "city", headerName: t("userManagement@columns.city"), minWidth: 120, flex: 0.4, filterable: false, sortable: false,
        valueGetter: (_, row) => {
          const k = cityKey(row.city);
          return k ? cityLabel(k, lang) : "";
        },
        renderCell: ({ row }) => {
          const k = cityKey(row.city);
          return k
            ? <Typography variant="body2" noWrap>{cityLabel(k, lang)}</Typography>
            : <Typography variant="body2" color="text.disabled">—</Typography>;
        },
      },
      // Only meaningful on the Providers tab — a dash column for 14k users is noise.
      ...(activeTab === "providers" ? [{
        field: "providers", headerName: t("userManagement@columns.providers"), width: 110, align: "center", headerAlign: "center", filterable: false, sortable: false,
        renderCell: ({ row }) => {
          const count = providersByOwner.get(row.id!) ?? 0;
          return count > 0 ? (
            <Chip
              icon={<StoreIcon sx={{ fontSize: "14px !important" }} />}
              label={fmtNum(count)}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          ) : (
            <Typography variant="body2" color="text.disabled">—</Typography>
          );
        },
      } satisfies GridColDef<UserSummaryDto>] : []),
      {
        field: "isActive", headerName: t("userManagement@columns.status"), width: 104, align: "center", headerAlign: "center", filterable: false, sortable: false,
        valueGetter: (_, row) => row.isDeleted !== true ? t("userManagement@columns.active") : t("userManagement@columns.inactive"),
        renderCell: ({ row }) => {
          // List API returns `isDeleted`, not `isActive`. Derive status from it.
          const active = row.isDeleted !== true;
          return (
            <Chip
              size="small"
              variant="outlined"
              color={active ? "success" : "error"}
              label={active ? t("userManagement@columns.active") : t("userManagement@columns.inactive")}
              sx={{ fontWeight: 600, borderRadius: 1.5 }}
            />
          );
        },
      },
      {
        field: "createdAt", headerName: t("userManagement@columns.createdAt"), width: 150, filterable: false,
        renderCell: ({ row }) => {
          const short = formatJoinDate(row.createdAt, lang);
          return short
            ? (
              <Tooltip title={formatJoinDateFull(row.createdAt, lang)} arrow>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ fontVariantNumeric: "tabular-nums" }}>{short}</Typography>
              </Tooltip>
            )
            : <Typography variant="body2" color="text.disabled">—</Typography>;
        },
      },
      {
        field: "actions", headerName: t("userManagement@columns.actions"), width: showDeleted ? 130 : 124, align: "center", headerAlign: "center", filterable: false, sortable: false, disableColumnMenu: true,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.25} onClick={(e) => e.stopPropagation()}>
            {showDeleted ? (
              <Button
                size="small"
                variant="outlined"
                color="success"
                startIcon={<RestoreIcon sx={{ fontSize: 16 }} />}
                onClick={() => { if (row.id) restoreMutation.mutate([row.id]); }}
                disabled={restoreMutation.isPending}
                sx={{ fontWeight: 600, textTransform: "none", borderRadius: 2 }}
              >
                {t("userManagement@restore")}
              </Button>
            ) : (
              <>
                <Tooltip title={t("userManagement@actions.viewProfile")}>
                  <IconButton size="small" aria-label={t("userManagement@actions.viewProfile")} onClick={(e) => handleViewProfile(e, row)}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t("userManagement@actions.edit")}>
                  <IconButton size="small" aria-label={t("userManagement@actions.edit")} onClick={(e) => handleEdit(e, row)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t("userManagement@list.moreActions")}>
                  <IconButton size="small" aria-label={t("userManagement@list.moreActions")} aria-haspopup="menu" onClick={(e) => openRowMenu(e, row)}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
        ),
      },
    ] as GridColDef<UserSummaryDto>[]).filter((c) => !hiddenFields.has(c.field)),
    [t, lang, roleChip, roleLabel, avatarSx, activeTab, handleEdit, handleViewProfile, openRowMenu, providersByOwner, showDeleted, restoreMutation, hiddenFields]
  );

  const gridLocaleText = useMemo(() => ({
    ...(isAr ? arSD.components.MuiDataGrid.defaultProps.localeText : {}),
    toolbarExport: t("userManagement@list.export"),
    toolbarFilters: t("userManagement@list.filters"),
    toolbarFiltersTooltipActive: (count: number) => t("userManagement@list.filtersActive", { count }),
  }), [isAr, t]);

  const trimmedSearch = search.trim();
  const emptyContent: ReactNode = (
    <Stack spacing={1.5} alignItems="center" sx={{ px: 2, textAlign: "center" }}>
      <SearchIcon sx={{ fontSize: 40, color: "text.disabled" }} />
      <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
        {trimmedSearch
          ? t("userManagement@list.noMatch", { query: searchInput.trim() || trimmedSearch, interpolation: { escapeValue: false } })
          : selectedCity
            ? t("userManagement@list.noMatchFilters")
            : t("userManagement@list.noUsers")}
      </Typography>
      {hasActiveFilters && (
        <Stack direction="row" spacing={1}>
          {trimmedSearch && (
            <Button size="small" variant="outlined" onClick={() => applySearchNow("")} sx={{ textTransform: "none" }}>
              {t("userManagement@list.clearSearch")}
            </Button>
          )}
          {selectedCity && (
            <Button size="small" variant="text" onClick={clearFilters} sx={{ textTransform: "none" }}>
              {t("userManagement@clearFilters")}
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );

  const firstLoad = isLoading && !pageData;
  const backgroundFetching = isFetching && !firstLoad;

  // KPI summary strip — one calm row; loyalty figures grouped under their own label.
  const blockedCount = loyaltySummary?.blockedUsers ?? 0;

  return (
    <AppScreenContainer>
      <Box sx={{ width: "100%", minWidth: 0, overflow: "hidden", boxSizing: "border-box", p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2} sx={{ width: "100%", minWidth: 0 }}>

          {/* ── Page header (light) ── */}
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={2}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" component="h1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                {showDeleted ? t("userManagement@deletedUsers") : t("userManagement@title")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {showDeleted ? t("userManagement@deletedUsersHint") : t("userManagement@subtitle")}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
              <Tooltip title={t("userManagement@list.refresh")}>
                <span>
                  <IconButton
                    onClick={handleRefresh}
                    disabled={isFetching}
                    aria-label={t("userManagement@list.refresh")}
                    sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}
                  >
                    <RefreshIcon fontSize="small" sx={{ animation: isFetching ? `${spin} 0.9s linear infinite` : "none" }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Button
                variant={showDeleted ? "contained" : "outlined"}
                color={showDeleted ? "error" : "inherit"}
                startIcon={<DeleteIcon />}
                onClick={() => { setShowDeleted((v) => !v); setRowSelectionModel([]); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, ...(!showDeleted && { borderColor: "divider", color: "text.primary" }) }}
              >
                {t("userManagement@deletedUsers")}
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setAddUserDialogOpen(true)}
                disableElevation
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
              >
                {t("userManagement@addUser")}
              </Button>
            </Stack>
          </Stack>

          {/* ── Summary strip ── */}
          {!showDeleted && (usersSummary || loyaltySummary) && (
            <Paper variant="outlined" sx={{ borderRadius: 2, px: 2, py: 1.5 }}>
              <Stack
                direction="row"
                flexWrap="wrap"
                useFlexGap
                alignItems="center"
                sx={{ columnGap: 3, rowGap: 1.5 }}
              >
                <SummaryItem label={t("userManagement@list.summary.totalUsers")} value={usersSummary ? fmtNum(usersSummary.totalUsers) : "—"} />
                {loyaltySummary && (
                  <>
                    <SummaryItem label={t("userManagement@list.summary.activeMembers")} value={fmtNum(loyaltySummary.activeMembers)} />
                    <SummaryItem label={t("userManagement@list.summary.blocked")} value={fmtNum(blockedCount)} tone={blockedCount > 0 ? "error" : undefined} />
                    <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary", flexBasis: { xs: "100%", sm: "auto" } }}>
                      <LoyaltyIcon sx={{ fontSize: 16 }} />
                      <Typography variant="overline" sx={{ lineHeight: 1, letterSpacing: isAr ? 0 : undefined }}>
                        {t("userManagement@list.summary.loyalty")}
                      </Typography>
                    </Stack>
                    <SummaryItem label={t("userManagement@list.summary.issued")} value={fmtNum(loyaltySummary.totalPointsIssued)} />
                    <SummaryItem label={t("userManagement@list.summary.circulating")} value={fmtNum(loyaltySummary.outstandingLiabilityPoints)} />
                    <SummaryItem label={t("userManagement@list.summary.redemptionRate")} value={`${Math.round(loyaltySummary.redemptionRatePct)}%`} />
                  </>
                )}
              </Stack>
            </Paper>
          )}

          {/* ── Main table card ── */}
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", minWidth: 0 }}>

            {/* Role tabs — hidden in deleted mode */}
            {!showDeleted && (
              <Box sx={{ borderBottom: 1, borderColor: "divider", px: 1 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{ minHeight: 48, "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 48, px: 2 } }}
                >
                  {ROLE_TABS.map((key) => {
                    const isSelected = activeTab === key;
                    return (
                      <Tab
                        key={key}
                        value={key}
                        label={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <span>{t(`userManagement@list.tabs.${key}`)}</span>
                            <Box
                              component="span"
                              sx={{
                                px: 0.75, minWidth: 24, height: 20, borderRadius: 10,
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.72rem", fontWeight: 600, fontVariantNumeric: "tabular-nums",
                                bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.12) : "action.hover",
                                color: isSelected ? "primary.main" : "text.secondary",
                              }}
                            >
                              {usersSummary ? fmtNum(roleCounts[key]) : "–"}
                            </Box>
                          </Stack>
                        }
                      />
                    );
                  })}
                </Tabs>
              </Box>
            )}

            {/* Deleted mode notice */}
            {showDeleted && (
              <Box sx={{ px: 2, pt: 2 }}>
                <Alert
                  severity="warning"
                  icon={<WarningAmberIcon />}
                  action={
                    <Button color="inherit" size="small" startIcon={<GroupIcon />} onClick={() => setShowDeleted(false)} sx={{ textTransform: "none", fontWeight: 600 }}>
                      {t("userManagement@backToActive")}
                    </Button>
                  }
                  sx={{ borderRadius: 2, alignItems: "center" }}
                >
                  {t("userManagement@deletedUsersHint")}
                </Alert>
              </Box>
            )}

            <Box sx={{ p: 2, minWidth: 0 }}>
              {/* Filter bar */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap" useFlexGap alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  placeholder={t("userManagement@list.searchPlaceholder")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape" && searchInput) { e.preventDefault(); applySearchNow(""); } }}
                  sx={{ minWidth: { sm: 280 }, flex: { sm: "0 1 360px" } }}
                  inputProps={{ "aria-label": t("userManagement@search") }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
                    endAdornment: searchInput ? (
                      <InputAdornment position="end">
                        <Tooltip title={t("userManagement@list.clearSearch")}>
                          <IconButton size="small" edge="end" aria-label={t("userManagement@list.clearSearch")} onClick={() => applySearchNow("")}>
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ) : undefined,
                  }}
                />
                <TextField
                  select size="small"
                  label={t("userManagement@sortBy")}
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                  sx={{ minWidth: 170 }}
                >
                  <MenuItem value="createdAt_desc">{t("userManagement@sortNewest")}</MenuItem>
                  <MenuItem value="createdAt_asc">{t("userManagement@sortOldest")}</MenuItem>
                  <MenuItem value="name_asc">{t("userManagement@sortNameAz")}</MenuItem>
                  <MenuItem value="name_desc">{t("userManagement@sortNameZa")}</MenuItem>
                </TextField>
                {cityOptions.length > 0 && (
                  <TextField
                    select size="small"
                    label={t("userManagement@filterByCity")}
                    value={selectedCity}
                    onChange={(e) => { setSelectedCity(e.target.value); setPaginationModel((p) => ({ ...p, page: 0 })); }}
                    sx={{ minWidth: 170 }}
                  >
                    <MenuItem value="">{t("userManagement@allCities")}</MenuItem>
                    <Divider />
                    {cityOptions.map((city) => {
                      const k = cityKey(city);
                      return <MenuItem key={city} value={city}>{k ? cityLabel(k, lang) : city}</MenuItem>;
                    })}
                  </TextField>
                )}
                {hasActiveFilters && (
                  <Button variant="text" size="small" color="inherit" startIcon={<FilterListIcon />} onClick={clearFilters}
                    sx={{ color: "text.secondary", whiteSpace: "nowrap", textTransform: "none" }}>
                    {t("userManagement@clearFilters")}
                  </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ whiteSpace: "nowrap" }}>
                  {pageData && (
                    <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {hasActiveFilters
                        ? `${fmtNum(total)} / ${fmtNum(roleCounts[activeTab])}`
                        : t("userManagement@list.resultsCount", { formatted: fmtNum(total) })}
                    </Typography>
                  )}
                  {lastUpdatedLabel && (
                    <Typography variant="caption" color="text.secondary">{lastUpdatedLabel}</Typography>
                  )}
                </Stack>
              </Stack>

              {/* Non-blocking refresh error — keeps the rows already on screen */}
              {error && pageData && (
                <Alert
                  severity="warning"
                  sx={{ mb: 2, borderRadius: 2, alignItems: "center" }}
                  action={<Button color="inherit" size="small" onClick={handleRefresh} sx={{ textTransform: "none" }}>{t("userManagement@list.retry")}</Button>}
                >
                  {t("userManagement@list.refreshFailed")}
                </Alert>
              )}

              {error && !pageData ? (
                <Alert
                  severity="error"
                  sx={{ borderRadius: 2, alignItems: "center" }}
                  action={<Button color="inherit" size="small" onClick={handleRefresh} sx={{ textTransform: "none" }}>{t("userManagement@list.retry")}</Button>}
                >
                  {t("userManagement@list.loadFailed")}
                </Alert>
              ) : firstLoad ? (
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Stack key={i} direction="row" spacing={2} alignItems="center" sx={{ px: 2, py: 1.5, borderBottom: i < 7 ? 1 : 0, borderColor: "divider" }}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="40%" />
                        <Skeleton variant="text" width="25%" />
                      </Box>
                      <Skeleton variant="rounded" width={72} height={24} sx={{ display: { xs: "none", sm: "block" } }} />
                      <Skeleton variant="text" width={96} sx={{ display: { xs: "none", md: "block" } }} />
                    </Stack>
                  ))}
                </Box>
              ) : (
                <Box sx={{ position: "relative", width: "100%", minWidth: 0, overflowX: "auto" }}>
                  {backgroundFetching && (
                    <LinearProgress sx={{ position: "absolute", top: 0, insetInline: 0, height: 2, zIndex: 3, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
                  )}
                  <AppDataGrid<UserSummaryDto>
                    data={items}
                    columns={columns}
                    loading={false}
                    getRowId={(row) => row.id ?? row.name + row.email}
                    disablePagination={false}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    total={total}
                    minHeight="60vh"
                    enableColumnFilter
                    enableToolbar
                    checkboxSelection
                    rowSelectionModel={rowSelectionModel}
                    onRowSelectionModelChange={setRowSelectionModel}
                    onRowClick={({ row }) => handleRowClick(row)}
                    localeText={gridLocaleText}
                    noRowsContent={emptyContent}
                    sx={{
                      "& .MuiDataGrid-row": { cursor: "pointer" },
                      "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": { bgcolor: "background.default" },
                      "& .MuiDataGrid-toolbarContainer .MuiButton-root": { textTransform: "none", fontWeight: 600 },
                      "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600, color: "text.secondary" },
                    }}
                  />
                </Box>
              )}
            </Box>
          </Paper>

          <BulkActionsBar
            selectedCount={selectedIds.length}
            onClearSelection={() => setRowSelectionModel([])}
            onBulkExport={handleBulkExport}
            onBulkDelete={handleBulkDeleteClick}
            onBulkRestore={showDeleted ? () => restoreMutation.mutate(selectedIds) : undefined}
            loading={deleteMutation.isPending || restoreMutation.isPending}
          />
        </Stack>
      </Box>

      {/* ── Row "more" menu: secondary + destructive actions ── */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeRowMenu}
        onClick={(e) => e.stopPropagation()}
        slotProps={{ paper: { sx: { minWidth: 200, borderRadius: 2 } } }}
      >
        {menuRow && !isProvider(menuRow) && (
          <MenuItem onClick={() => { closeRowMenu(); setUserToChangeRole(menuRow); setChangeRoleDialogOpen(true); }}>
            <ListItemIcon><BusinessCenterIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t("userManagement@actions.makeProvider")}</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => { closeRowMenu(); const id = menuRow?.id ?? 0; if (id > 0) navigate(`/users/${id}/points`); }}>
          <ListItemIcon><LoyaltyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t("userManagement@list.points")}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => { closeRowMenu(); if (menuRow) { setUserToDelete(menuRow); setDeleteDialogOpen(true); } }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>{t("userManagement@actions.delete")}</ListItemText>
        </MenuItem>
      </Menu>

      <UserDetailDrawer
        user={drawerUser}
        onClose={() => setDrawerUser(null)}
        onEdit={(u) => { const id = u.id ?? 0; if (id > 0) navigate(`/users/${id}/edit`); }}
        onDelete={(u) => { setUserToDelete(u); setDeleteDialogOpen(true); }}
        onAddPoints={(u) => { const id = u.id ?? 0; if (id > 0) navigate(`/users/${id}/points`); }}
      />

      {/* ── Single Delete Dialog ── */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }} sx={{ zIndex: 10002 }}>
        <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.dark} 100%)`, px: 3, py: 2.5, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}>
              <WarningAmberIcon sx={{ color: "common.white" }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700} color="common.white">{t("userManagement@deleteConfirmTitle")}</Typography>
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
        <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.dark} 100%)`, px: 3, py: 2.5, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}>
              <BusinessCenterIcon sx={{ color: "common.white" }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700} color="common.white">{t("userManagement@makeProviderTitle")}</Typography>
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
        <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.dark} 100%)`, px: 3, py: 2.5, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}>
              <WarningAmberIcon sx={{ color: "common.white" }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700} color="common.white">{t("delete")}</Typography>
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
          background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t("userManagement@form.country")}
                  value={newUserForm.country ?? ""}
                  onChange={(e) => setNewUserForm({ ...newUserForm, country: e.target.value })}
                  fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start"><PublicIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.secondary.dark} 100%)`,
              "&:hover": { background: `linear-gradient(135deg, #0a3880 0%, ${theme.palette.primary.dark} 100%)` },
            }}
          >
            {createUserMutation.isPending ? t("creating") : t("userManagement@createUser")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
