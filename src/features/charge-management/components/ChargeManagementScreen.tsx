import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alpha } from "@mui/material/styles";
import {
  Box,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  MenuItem,
  Paper,
  Button,
  Skeleton,
  useTheme,
  Avatar,
  Divider,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  Menu,
  CircularProgress,
  Alert,
  LinearProgress,
} from "@mui/material";
import { GridColDef, GridPaginationModel, GridRowSelectionModel } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import VerifiedIcon from "@mui/icons-material/Verified";
import BoltIcon from "@mui/icons-material/Bolt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ClearIcon from "@mui/icons-material/Clear";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShareIcon from "@mui/icons-material/Share";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid, BulkActionsBar } from "../../../components";
import SocialLinksDialog from "../../social-media/components/SocialLinksDialog";
import PremiumDialog from "./PremiumDialog";
import AnalyticsDialog from "../../analytics/components/AnalyticsDialog";
import StationEngagementDialog from "./StationEngagementDialog";
import PeopleIcon from "@mui/icons-material/People";
import ProviderActivityDialog from "../../loyalty/components/ProviderActivityDialog";
import InsightsIcon from "@mui/icons-material/Insights";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WorkerDialog from "../../workers/components/WorkerDialog";
import BadgeIcon from "@mui/icons-material/Badge";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PersonIcon from "@mui/icons-material/Person";
import { useChargeManagement } from "../hooks/use-charge-management";
import { useListState } from "../../../hooks";
import { getAllPlugTypes, changeStationOwner, deleteStation } from "../services/station-form-service";
import { getUsersList } from "../../users/services/user-service";
import { useSnackbarStore } from "../../../stores";
import { PROVIDER_ROLE_ID } from "../../users/constants/roles";
import type { ChargingPointDto } from "../types/api";
import StationRowDetailDialog from "./StationRowDetailDialog";
import { DateCell } from "../../../components";
import { matchesDateRange, type DateRangePreset } from "../../../utils/date-format";
import ChargeFiltersBar from "./ChargeFiltersBar";
import StationCard, { StationCardSkeleton, isStationActive, paymentMethods } from "./StationCard";
import PlugChips from "./PlugChips";
import { cityKey, cityLabel } from "../../dashboard/utils/city-names";

const Num = ({ v }: { v: number }) => <bdi>{v.toLocaleString("en-US")}</bdi>;

/** Re-renders every `ms` so relative times («منذ 30 ث») stay fresh. */
function useNow(ms: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

export default function ChargeManagementScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const [viewMode, setViewMode] = useListState<"card" | "table">("viewMode", "card");
  const [cardPage, setCardPage] = useListState("cardPage", 1);
  const CARD_PAGE_SIZE = 12;
  const [paginationModel, setPaginationModel] = useListState<GridPaginationModel>("pagination", {
    page: 0,
    pageSize: 25,
  });
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
  const [detailStation, setDetailStation] = useState<ChargingPointDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [changeOwnerStation, setChangeOwnerStation] = useState<ChargingPointDto | null>(null);
  const [engagementStation, setEngagementStation] = useState<ChargingPointDto | null>(null);
  const [deleteStationTarget, setDeleteStationTarget] = useState<ChargingPointDto | null>(null);
  const [socialLinksStation, setSocialLinksStation] = useState<ChargingPointDto | null>(null);
  const [premiumStation, setPremiumStation] = useState<ChargingPointDto | null>(null);
  const [analyticsStation, setAnalyticsStation] = useState<ChargingPointDto | null>(null);
  const [activityStation, setActivityStation] = useState<ChargingPointDto | null>(null);
  const [workerStation, setWorkerStation] = useState<ChargingPointDto | null>(null);
  const [cardMenuAnchor, setCardMenuAnchor] = useState<null | HTMLElement>(null);
  const [cardMenuRow, setCardMenuRow] = useState<ChargingPointDto | null>(null);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [cityFilter, setCityFilter] = useListState<string>("city", "");
  const [statusFilter, setStatusFilter] = useListState<string>("status", "");
  const [verifiedFilter, setVerifiedFilter] = useListState<string>("verified", "");
  const [stationTypeFilter, setStationTypeFilter] = useListState<string>("stationType", "");
  const [plugTypeFilter, setPlugTypeFilter] = useListState<number[]>("plugTypes", []);
  const [joinedFilter, setJoinedFilter] = useListState<DateRangePreset>("joined", "all");
  const [editedFilter, setEditedFilter] = useListState<DateRangePreset>("edited", "all");

  const { data: plugTypes = [] } = useQuery({
    queryKey: ["charge-management", "plug-types"],
    queryFn: ({ signal }) => getAllPlugTypes(signal),
  });

  const { data: allUsers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ["users", "list"],
    queryFn: ({ signal }) => getUsersList(signal),
    enabled: changeOwnerStation != null,
    staleTime: 60 * 1000,
  });

  const providers = useMemo(
    () => allUsers.filter((u) => u.role?.id === PROVIDER_ROLE_ID),
    [allUsers]
  );

  const filteredProviders = useMemo(() => {
    const q = ownerSearch.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        String(u.id ?? "").includes(q)
    );
  }, [providers, ownerSearch]);

  const changeOwnerMutation = useMutation({
    mutationFn: ({ stationId, newOwnerId }: { stationId: number; newOwnerId: number | null }) =>
      changeStationOwner(stationId, newOwnerId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["charge-management"] });
      openSuccessSnackbar({ message: t(variables.newOwnerId === null ? "chargeManagement@owner.unassignedSuccess" : "chargeManagement@ownerChanged") });
      setChangeOwnerStation(null);
      setOwnerSearch("");
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail
        || err?.response?.data?.title
        || err?.message
        || t("loadingFailed");
      openErrorSnackbar({ message: detail });
    },
  });

  const deleteStationMutation = useMutation({
    mutationFn: (id: number) => deleteStation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-management"] });
      openSuccessSnackbar({ message: t("chargeManagement@stationDeleted") });
      setDeleteStationTarget(null);
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail
        || err?.response?.data?.title
        || err?.message
        || t("loadingFailed");
      openErrorSnackbar({ message: detail });
    },
  });

  const {
    data,
    allData,
    isLoading,
    isFetching,
    error,
    refreshError,
    dataUpdatedAt,
    search,
    debouncedSearch,
    sortOption,
    handleSearchChange,
    handleSortChange,
    handleRefresh,
  } = useChargeManagement();

  // City options are grouped by canonical key so legacy spellings collapse
  // into one entry, and labelled in the UI language (Arabic in Arabic UI).
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      const k = cityKey(r.cityName);
      if (k) set.add(k);
    });
    // Keep a restored selection visible even if the current search hides it.
    if (cityFilter) set.add(cityFilter);
    return Array.from(set)
      .map((key) => ({ key, label: cityLabel(key, i18n.language) }))
      .sort((a, b) => a.label.localeCompare(b.label, i18n.language));
  }, [data, cityFilter, i18n.language]);
  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      const s = (r.statusSummary?.name ?? "").trim();
      if (s) set.add(s);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);
  const uniqueStationTypes = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      const t = (r.stationType?.name ?? "").trim();
      if (t) set.add(t);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (cityFilter && cityKey(row.cityName) !== cityKey(cityFilter)) return false;
      if (statusFilter && (row.statusSummary?.name ?? "").trim() !== statusFilter) return false;
      if (verifiedFilter === "yes" && !row.isVerified) return false;
      if (verifiedFilter === "no" && row.isVerified) return false;
      if (stationTypeFilter && (row.stationType?.name ?? "").trim() !== stationTypeFilter) return false;
      if (plugTypeFilter.length > 0) {
        const hasPlug = (row.plugTypeSummary ?? []).some((p) => plugTypeFilter.includes(p.id));
        if (!hasPlug) return false;
      }
      if (!matchesDateRange(row.createdAt, joinedFilter)) return false;
      if (!matchesDateRange(row.modifiedAt, editedFilter)) return false;
      return true;
    });
  }, [data, cityFilter, statusFilter, verifiedFilter, stationTypeFilter, plugTypeFilter, joinedFilter, editedFilter]);

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return filteredData.slice(start, start + paginationModel.pageSize);
  }, [filteredData, paginationModel.page, paginationModel.pageSize]);

  const cardPagedData = useMemo(() => {
    const start = (cardPage - 1) * CARD_PAGE_SIZE;
    return filteredData.slice(start, start + CARD_PAGE_SIZE);
  }, [filteredData, cardPage]);
  const cardTotalPages = Math.ceil(filteredData.length / CARD_PAGE_SIZE);

  const hasActiveFilters =
    !!cityFilter ||
    !!statusFilter ||
    !!verifiedFilter ||
    !!stationTypeFilter ||
    plugTypeFilter.length > 0 ||
    joinedFilter !== "all" ||
    editedFilter !== "all";

  /** Back to the first page in both views — called only from user changes, never on restore. */
  const resetPages = useCallback(() => {
    setPaginationModel((prev) => (prev.page === 0 ? prev : { ...prev, page: 0 }));
    setCardPage(1);
  }, []);
  /** Wrap a filter setter so changing it also resets paging. */
  const withReset = useCallback(
    <V,>(setter: (v: V) => void) =>
      (v: V) => {
        setter(v);
        resetPages();
      },
    [resetPages]
  );
  const handleClearFilters = useCallback(() => {
    setCityFilter("");
    setStatusFilter("");
    setVerifiedFilter("");
    setStationTypeFilter("");
    setPlugTypeFilter([]);
    setJoinedFilter("all");
    setEditedFilter("all");
    resetPages();
  }, [resetPages]);
  const handleSearchInput = useCallback(
    (v: string) => {
      handleSearchChange(v);
      resetPages();
    },
    [handleSearchChange, resetPages]
  );
  const handleClearSearch = useCallback(() => handleSearchInput(""), [handleSearchInput]);
  const handleClearEverything = useCallback(() => {
    handleClearFilters();
    handleSearchChange("");
  }, [handleClearFilters, handleSearchChange]);

  // «آخر تحديث منذ …» — ticks every 30 s.
  const now = useNow(30_000);
  const lastUpdatedLabel = useMemo(() => {
    if (!dataUpdatedAt) return undefined;
    const sec = Math.max(0, Math.round((now - dataUpdatedAt) / 1000));
    if (sec < 60) return t("chargeManagement@list.updatedSecondsAgo", { count: Math.max(sec, 1) });
    const min = Math.round(sec / 60);
    if (min < 60) return t("chargeManagement@list.updatedMinutesAgo", { count: min });
    return t("chargeManagement@list.updatedHoursAgo", { count: Math.round(min / 60) });
  }, [dataUpdatedAt, now, t]);

  const handleRowClick = useCallback(
    (params: { row: ChargingPointDto }) => navigate(`/charge-management/${params.row.id}`),
    [navigate]
  );
  const handleEdit = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      navigate(`/charge-management/edit/${id}`);
    },
    [navigate]
  );
  const handleMedia = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      navigate(`/charge-management/${id}/media`);
    },
    [navigate]
  );
  const handleSocialLinks = useCallback(
    (e: React.MouseEvent, station: ChargingPointDto) => {
      e.stopPropagation();
      setSocialLinksStation(station);
    },
    []
  );
  const handlePremium = useCallback(
    (e: React.MouseEvent, station: ChargingPointDto) => {
      e.stopPropagation();
      setPremiumStation(station);
    },
    []
  );
  const handleAnalytics = useCallback(
    (e: React.MouseEvent, station: ChargingPointDto) => {
      e.stopPropagation();
      setAnalyticsStation(station);
    },
    []
  );
  const handleActivity = useCallback(
    (e: React.MouseEvent, station: ChargingPointDto) => {
      e.stopPropagation();
      setActivityStation(station);
    },
    []
  );
  const handleManageWorker = useCallback(
    (e: React.MouseEvent, station: ChargingPointDto) => {
      e.stopPropagation();
      setWorkerStation(station);
    },
    []
  );
  const handleViewComplaints = useCallback(() => navigate("/complaints"), [navigate]);
  const handleAddStation = useCallback(() => navigate("/charge-management/add"), [navigate]);

  const openCardMenu = useCallback((e: React.MouseEvent<HTMLElement>, row: ChargingPointDto) => {
    e.stopPropagation();
    setCardMenuAnchor(e.currentTarget);
    setCardMenuRow(row);
  }, []);
  const closeCardMenu = useCallback(() => {
    setCardMenuAnchor(null);
    setCardMenuRow(null);
  }, []);
  const runCardAction = useCallback(
    (action: (e: React.MouseEvent, row: ChargingPointDto) => void) =>
      (e: React.MouseEvent) => {
        const row = cardMenuRow;
        setCardMenuAnchor(null);
        setCardMenuRow(null);
        if (row) action(e, row);
      },
    [cardMenuRow]
  );

  const handleBulkExport = useCallback(() => {
    const ids = rowSelectionModel as number[];
    const rows = filteredData.filter((r) => ids.includes(r.id));
    if (rows.length === 0) return;
    const headers = ["id", "name", "cityName", "address", "phone", "chargersCount", "visitorsCount"];
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String((r as unknown as Record<string, unknown>)[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stations-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredData, rowSelectionModel]);

  const handleBulkDelete = useCallback(() => {
    // No bulk delete API for stations; show message
    const count = (rowSelectionModel as number[]).length;
    if (count > 0) {
      // Could add API later; for now just clear selection
      setRowSelectionModel([]);
    }
  }, [rowSelectionModel]);

  const handleOpenDetail = useCallback((e: React.MouseEvent, row: ChargingPointDto) => {
    e.stopPropagation();
    setDetailStation(row);
    setDetailOpen(true);
  }, []);

  const handleOpenChangeOwner = useCallback((e: React.MouseEvent, row: ChargingPointDto) => {
    e.stopPropagation();
    setOwnerSearch("");
    setChangeOwnerStation(row);
  }, []);

  const handleOpenEngagement = useCallback((e: React.MouseEvent, row: ChargingPointDto) => {
    e.stopPropagation();
    setEngagementStation(row);
  }, []);
  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailStation(null);
  }, []);

  const getRowClassName = useCallback((params: { row: ChargingPointDto }) => {
    return params.row.stationType?.name === "Premium" ? "premium-row" : "";
  }, []);

  const columns: GridColDef<ChargingPointDto>[] = useMemo(
    () => [
      {
        field: "id",
        headerName: t("chargeManagement@columns.id"),
        width: 70,
        minWidth: 70,
        filterable: false,
        sortable: true,
      },
      {
        field: "name",
        headerName: t("chargeManagement@columns.stationName"),
        minWidth: 200,
        flex: 1,
        filterable: false,
        sortable: true,
        renderCell: ({ row }) => (
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
            <Box
              component="img"
              src={row.iConUrl ?? undefined}
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                objectFit: "cover",
                bgcolor: "action.hover",
              }}
            />
            <Typography variant="body2" noWrap>
              {row.name || t("chargeManagement@unnamed")}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "plugTypeSummary",
        headerName: t("chargeManagement@columns.plugs"),
        minWidth: 180,
        width: 220,
        filterable: false,
        sortable: false,
        renderCell: ({ row }) =>
          (row.plugTypeSummary ?? []).length === 0 ? (
            "—"
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%", overflow: "hidden" }}>
              <PlugChips plugs={row.plugTypeSummary} max={2} />
            </Box>
          ),
      },
      {
        field: "chargerSpeed",
        headerName: t("chargeManagement@columns.speed"),
        minWidth: 80,
        width: 90,
        filterable: false,
        sortable: true,
        renderCell: ({ row }) => (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <BoltIcon sx={{ fontSize: 18, color: "warning.main" }} />
            <Typography variant="body2">
              {row.chargerSpeed != null ? `${row.chargerSpeed} kW` : "—"}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "isVerified",
        headerName: t("chargeManagement@columns.verification"),
        width: 100,
        minWidth: 100,
        filterable: false,
        sortable: false,
        renderCell: ({ row }) =>
          row.isVerified ? (
            <Tooltip title={t("chargeManagement@columns.verified")}>
              <VerifiedIcon sx={{ fontSize: 22, color: "primary.main" }} />
            </Tooltip>
          ) : (
            "—"
          ),
      },
      {
        field: "cityName",
        headerName: t("chargeManagement@columns.city"),
        minWidth: 110,
        width: 120,
        valueGetter: (_, row) => (row.cityName ? cityLabel(row.cityName, i18n.language) : "—"),
        filterable: false,
        sortable: true,
      },
      {
        field: "address",
        headerName: t("chargeManagement@columns.address"),
        minWidth: 160,
        flex: 0.8,
        valueGetter: (_, row) => row.address ?? "—",
        renderCell: ({ row }) => (
          <Typography variant="body2" color="text.secondary" noWrap title={row.address ?? undefined} sx={{ lineHeight: "inherit" }}>
            {row.address || "—"}
          </Typography>
        ),
        filterable: false,
        sortable: false,
      },
      {
        field: "phone",
        headerName: t("chargeManagement@columns.phone"),
        minWidth: 120,
        width: 130,
        valueGetter: (_, row) => row.phone ?? "—",
        filterable: false,
        sortable: false,
      },
      {
        field: "chargingPointType",
        headerName: t("chargeManagement@columns.type"),
        minWidth: 90,
        width: 100,
        valueGetter: (_, row) => row.chargingPointType?.name ?? "—",
        filterable: false,
        sortable: false,
      },
      {
        field: "chargersCount",
        headerName: t("chargeManagement@columns.chargers"),
        minWidth: 80,
        width: 90,
        valueGetter: (_, row) =>
          row.chargersCount != null ? String(row.chargersCount) : "—",
        filterable: false,
        sortable: true,
      },
      {
        field: "statusSummary",
        headerName: t("chargeManagement@columns.status"),
        minWidth: 95,
        width: 100,
        filterable: false,
        sortable: false,
        renderCell: ({ row }) => {
          const status = row.statusSummary?.name ?? "";
          const isActive =
            status.toLowerCase() === "active" || row.statusSummary?.id === 1;
          return (
            <Chip
              size="small"
              label={status || "—"}
              color={isActive ? "success" : "default"}
              variant="filled"
            />
          );
        },
      },
      {
        field: "avgChargingPointRate",
        headerName: t("chargeManagement@columns.rating"),
        minWidth: 110,
        width: 120,
        filterable: false,
        sortable: true,
        renderCell: ({ row }) => {
          const rate = row.avgChargingPointRate != null ? Number(row.avgChargingPointRate) : null;
          const count = row.rateCount ?? 0;
          const stars = rate != null ? Math.round(rate) : 0;
          return (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {[1, 2, 3, 4, 5].map((i) =>
                i <= stars ? (
                  <StarIcon key={i} sx={{ fontSize: 16, color: "warning.main" }} />
                ) : (
                  <StarBorderIcon key={i} sx={{ fontSize: 16, color: "action.disabled" }} />
                )
              )}
              {count > 0 && (
                <Typography variant="caption" color="text.secondary">
                  ({count})
                </Typography>
              )}
              {rate == null && count === 0 && "—"}
            </Stack>
          );
        },
      },
      {
        field: "visitorsCount",
        headerName: t("chargeManagement@columns.visitors"),
        minWidth: 90,
        width: 95,
        filterable: false,
        sortable: true,
        renderCell: ({ row }) => (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <VisibilityIcon sx={{ fontSize: 18, color: "action.active" }} />
            <Typography variant="body2">{row.visitorsCount ?? 0}</Typography>
          </Stack>
        ),
      },
      {
        field: "favoritesCount",
        headerName: t("chargeManagement@columns.followers"),
        minWidth: 95,
        width: 105,
        filterable: false,
        sortable: true,
        renderCell: ({ row }) => (
          <Tooltip title={t("chargeManagement@engagement.view")}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ cursor: "pointer" }}
              onClick={(e) => handleOpenEngagement(e, row)}
            >
              <PeopleIcon sx={{ fontSize: 18, color: "primary.main" }} />
              <Typography variant="body2">{row.favoritesCount ?? 0}</Typography>
            </Stack>
          </Tooltip>
        ),
      },
      {
        field: "createdAt",
        headerName: t("chargeManagement@columns.joined"),
        minWidth: 120,
        width: 135,
        filterable: false,
        // Ordering is driven by the Sort control, which sorts the whole result
        // set — the grid only ever holds one page, so its own header sort
        // would silently reorder just that page.
        sortable: false,
        renderCell: ({ row }) => <DateCell value={row.createdAt} />,
      },
      {
        field: "modifiedAt",
        headerName: t("chargeManagement@columns.lastEdit"),
        minWidth: 120,
        width: 135,
        filterable: false,
        sortable: false,
        renderCell: ({ row }) => <DateCell value={row.modifiedAt} />,
      },
      {
        field: "methodPayment",
        headerName: t("chargeManagement@columns.payment"),
        minWidth: 100,
        width: 120,
        filterable: false,
        sortable: false,
        renderCell: ({ row }) => {
          const methods = paymentMethods(row.methodPayment);
          if (methods.length === 0) return "—";
          return (
            <Typography variant="body2" color="text.secondary" noWrap title={methods.join(" · ")} sx={{ lineHeight: "inherit" }}>
              {methods.join(" · ")}
            </Typography>
          );
        },
      },
      {
        field: "detail",
        headerName: t("chargeManagement@columns.detail"),
        width: 56,
        minWidth: 56,
        filterable: false,
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => (
          <Tooltip title={t("chargeManagement@detail.title")}>
            <IconButton
              size="small"
              onClick={(e) => handleOpenDetail(e, row)}
              aria-label={t("chargeManagement@detail.title")}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
      {
        field: "actions",
        headerName: t("chargeManagement@columns.actions"),
        width: 175,
        minWidth: 175,
        filterable: false,
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
            <Tooltip title={t("chargeManagement@actions.edit")}>
              <IconButton size="small" onClick={(e) => handleEdit(e, row.id)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("chargeManagement@actions.media")}>
              <IconButton size="small" onClick={(e) => handleMedia(e, row.id)}>
                <PhotoLibraryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("socialMedia@manageLinks")}>
              <IconButton size="small" onClick={(e) => handleSocialLinks(e, row)}>
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("chargeManagement@premium.manage")}>
              <IconButton size="small" onClick={(e) => handlePremium(e, row)} sx={{ color: "warning.main" }}>
                <WorkspacePremiumIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("analytics@manage")}>
              <IconButton size="small" onClick={(e) => handleAnalytics(e, row)} sx={{ color: "success.main" }}>
                <InsightsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("chargeManagement@engagement.view")}>
              <IconButton size="small" onClick={(e) => handleOpenEngagement(e, row)} sx={{ color: "info.main" }}>
                <PeopleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("loyalty@activity")}>
              <IconButton size="small" onClick={(e) => handleActivity(e, row)} sx={{ color: "secondary.main" }}>
                <ReceiptLongIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("workers@manageWorker")}>
              <IconButton size="small" onClick={(e) => handleManageWorker(e, row)}>
                <BadgeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("chargeManagement@actions.changeOwner")}>
              <IconButton
                size="small"
                onClick={(e) => handleOpenChangeOwner(e, row)}
                sx={{
                  bgcolor: "primary.main",
                  color: "#fff",
                  "&:hover": { bgcolor: "primary.dark" },
                  width: 28,
                  height: 28,
                }}
              >
                <PersonSearchIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("delete")}>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); setDeleteStationTarget(row); }}
                sx={{
                  bgcolor: "error.main",
                  color: "#fff",
                  width: 28,
                  height: 28,
                  boxShadow: "0 2px 6px rgba(211,47,47,0.4)",
                  "&:hover": { bgcolor: "error.dark", boxShadow: "0 3px 10px rgba(211,47,47,0.6)" },
                }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [t, i18n.language, handleEdit, handleMedia, handleSocialLinks, handlePremium, handleAnalytics, handleActivity, handleManageWorker, handleOpenDetail, handleOpenChangeOwner]
  );


  // Header figures describe the whole network, not the current search.
  const statsSource = allData ?? [];
  const totalStations = statsSource.length;
  const activeStations = useMemo(() => statsSource.filter(isStationActive).length, [statsSource]);
  const verifiedStations = useMemo(() => statsSource.filter((r) => r.isVerified).length, [statsSource]);

  const handleOpenStation = useCallback((row: ChargingPointDto) => navigate(`/charge-management/${row.id}`), [navigate]);

  if (error) {
    return (
      <AppScreenContainer>
        <Box p={2}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={handleRefresh} disabled={isFetching}>
                {t("chargeManagement@list.retry")}
              </Button>
            }
          >
            {t("loadingFailed")}
          </Alert>
        </Box>
      </AppScreenContainer>
    );
  }

  const isEmpty = !isLoading && filteredData.length === 0;
  const searchTerm = debouncedSearch.trim();

  return (
    <AppScreenContainer>
      <Box sx={{ width: "100%", minWidth: 0, overflow: "hidden", boxSizing: "border-box", p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2} sx={{ width: "100%", minWidth: 0 }}>

          {/* ── Page header: title + inline stats · actions ─────────────────── */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "flex-start" }}
            justifyContent="space-between"
            gap={2}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" component="h1" fontWeight={800} sx={{ lineHeight: 1.25 }}>
                {t("chargeManagement@title")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t("chargeManagement@subtitle")}
              </Typography>
              <Stack
                direction="row"
                gap={1}
                useFlexGap
                flexWrap="wrap"
                alignItems="center"
                sx={{ mt: 1.5 }}
                aria-label={t("chargeManagement@list.statsLabel")}
              >
                {[
                  { key: "total", label: t("chargeManagement@kpi.total"), value: totalStations, color: theme.palette.text.secondary },
                  { key: "active", label: t("chargeManagement@kpi.active"), value: activeStations, color: theme.palette.success.main },
                  { key: "verified", label: t("chargeManagement@kpi.verified"), value: verifiedStations, color: theme.palette.primary.main },
                ].map((kpi) =>
                  isLoading ? (
                    <Skeleton key={kpi.key} variant="rounded" width={96} height={24} sx={{ borderRadius: 4 }} />
                  ) : (
                    <Chip
                      key={kpi.key}
                      size="small"
                      variant="outlined"
                      icon={<Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: kpi.color, flexShrink: 0 }} />}
                      label={
                        <>
                          <Box component="span" sx={{ fontWeight: 800, color: "text.primary" }}><Num v={kpi.value} /></Box>{" "}
                          <Box component="span" sx={{ color: "text.secondary" }}>{kpi.label}</Box>
                        </>
                      }
                      sx={{ height: 26, borderColor: "divider", "& .MuiChip-icon": { mx: 1 } }}
                    />
                  )
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" flexShrink={0} sx={{ alignSelf: { xs: "flex-end", sm: "flex-start" } }}>
              <Tooltip title={t("chargeManagement@list.complaintsHint")}>
                <IconButton
                  onClick={handleViewComplaints}
                  aria-label={t("chargeManagement@list.complaintsHint")}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, color: "warning.main" }}
                >
                  <ReportProblemIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("refresh")}>
                {/* span keeps the tooltip working while the button is disabled */}
                <span>
                  <IconButton
                    onClick={handleRefresh}
                    disabled={isFetching}
                    aria-label={t("refresh")}
                    aria-busy={isFetching}
                    sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                  >
                    <RefreshIcon
                      sx={{
                        animation: isFetching ? "cm-spin 0.9s linear infinite" : "none",
                        "@keyframes cm-spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                      }}
                    />
                  </IconButton>
                </span>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddStation}
                sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none", whiteSpace: "nowrap", height: 40 }}
              >
                {t("chargeManagement@actions.addStation")}
              </Button>
            </Stack>
          </Stack>

          {/* ── Filters ─────────────────────────────────────────────────────── */}
          {isLoading ? (
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {[240, 136, 136, 136, 160, 120].map((w, i) => (
                  <Skeleton key={i} variant="rounded" width={w} height={40} sx={{ borderRadius: 2 }} />
                ))}
              </Stack>
            </Paper>
          ) : (
            <ChargeFiltersBar
              values={{
                search,
                sort: sortOption,
                city: cityFilter,
                status: statusFilter,
                verified: verifiedFilter,
                stationType: stationTypeFilter,
                plugTypes: plugTypeFilter,
                joined: joinedFilter,
                edited: editedFilter,
              }}
              cities={uniqueCities}
              statuses={uniqueStatuses}
              stationTypes={uniqueStationTypes}
              plugTypes={plugTypes}
              resultCount={filteredData.length}
              lastUpdatedLabel={lastUpdatedLabel}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSearchChange={handleSearchInput}
              onSortChange={handleSortChange}
              onCityChange={withReset(setCityFilter)}
              onStatusChange={withReset(setStatusFilter)}
              onVerifiedChange={withReset(setVerifiedFilter)}
              onStationTypeChange={withReset(setStationTypeFilter)}
              onPlugTypesChange={withReset(setPlugTypeFilter)}
              onJoinedChange={withReset(setJoinedFilter)}
              onEditedChange={withReset(setEditedFilter)}
              onClearAll={handleClearEverything}
            />
          )}

          {/* Refresh failed but older data is still shown — non-blocking. */}
          {refreshError && !isFetching && (
            <Alert
              severity="warning"
              variant="outlined"
              action={
                <Button color="inherit" size="small" onClick={handleRefresh}>
                  {t("chargeManagement@list.retry")}
                </Button>
              }
            >
              {t("chargeManagement@list.refreshFailed")}
            </Alert>
          )}

          {/* ── Results ─────────────────────────────────────────────────────── */}
          <Box sx={{ position: "relative" }}>
            {/* Thin progress while a background refresh runs; results stay visible. */}
            {!isLoading && isFetching && (
              <LinearProgress
                aria-label={t("refresh")}
                sx={{ position: "absolute", top: -10, insetInlineStart: 0, insetInlineEnd: 0, height: 2, borderRadius: 1 }}
              />
            )}

            {isLoading && viewMode === "card" && (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" }, gap: 2 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <StationCardSkeleton key={i} />
                ))}
              </Box>
            )}

            {isLoading && viewMode === "table" && (
              <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Box key={i} sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 2 }}>
                    <Skeleton variant="rounded" width={40} height={40} sx={{ flexShrink: 0 }} />
                    <Skeleton variant="text" width={160} height={20} />
                    <Skeleton variant="rounded" width={80} height={22} sx={{ borderRadius: 3 }} />
                    <Skeleton variant="text" width={60} height={20} />
                    <Skeleton variant="text" width={100} height={20} />
                    <Box sx={{ display: "flex", gap: 0.5, marginInlineStart: "auto" }}>
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="circular" width={28} height={28} />
                    </Box>
                  </Box>
                ))}
              </Paper>
            )}

            {/* Empty result */}
            {isEmpty && (
              <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3, border: "1px dashed", borderColor: "divider", textAlign: "center" }}>
                <SearchOffIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  {searchTerm
                    ? t("chargeManagement@list.emptySearch", { term: searchTerm })
                    : t("chargeManagement@list.empty")}
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                  {searchTerm && (
                    <Button variant="outlined" size="small" onClick={handleClearSearch} sx={{ textTransform: "none", borderRadius: 2 }}>
                      {t("chargeManagement@list.clearSearch")}
                    </Button>
                  )}
                  {hasActiveFilters && (
                    <Button variant="outlined" size="small" onClick={handleClearFilters} sx={{ textTransform: "none", borderRadius: 2 }}>
                      {t("chargeManagement@list.clearFilters")}
                    </Button>
                  )}
                </Stack>
              </Paper>
            )}

            {/* ── Card View ── */}
            {!isLoading && !isEmpty && viewMode === "card" && (
              <>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" }, gap: 2, alignItems: "stretch" }}>
                  {cardPagedData.map((row) => (
                    <StationCard
                      key={row.id}
                      row={row}
                      highlight={searchTerm}
                      onOpen={handleOpenStation}
                      onEdit={handleEdit}
                      onMedia={handleMedia}
                      onActivity={handleActivity}
                      onMenu={openCardMenu}
                    />
                  ))}
                </Box>
                {cardTotalPages > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", pt: 3 }}>
                    <Pagination count={cardTotalPages} page={cardPage} onChange={(_, p) => setCardPage(p)} color="primary" shape="rounded" />
                  </Box>
                )}
              </>
            )}

            {/* ── Table View ── */}
            {!isLoading && !isEmpty && viewMode === "table" && (
              <Box sx={{ "& .premium-row": { bgcolor: alpha("#FFD700", 0.08) }, "& .MuiDataGrid-cell": { py: 1.5 } }}>
                <AppDataGrid<ChargingPointDto>
                  data={paginatedData}
                  columns={columns}
                  loading={false}
                  getRowId={(row) => row.id}
                  onRowClick={handleRowClick}
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
                  getRowClassName={getRowClassName}
                  getRowHeight={() => 76}
                />
              </Box>
            )}
          </Box>

          {/* ── Card overflow menu ── */}
          <Menu
            anchorEl={cardMenuAnchor}
            open={Boolean(cardMenuAnchor)}
            onClose={closeCardMenu}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 240, maxHeight: "80vh", boxShadow: "0 8px 28px rgba(0,0,0,0.16)" } } }}
          >
            {/* View & edit */}
            <MenuItem onClick={runCardAction((_e, r) => navigate(`/charge-management/${r.id}`))}>
              <ListItemIcon><OpenInNewIcon fontSize="small" sx={{ color: "primary.main" }} /></ListItemIcon>
              <ListItemText>{t("chargeManagement@detail.title")}</ListItemText>
            </MenuItem>
            <MenuItem onClick={runCardAction((_e, r) => handleEdit(_e, r.id))}>
              <ListItemIcon><EditIcon fontSize="small" sx={{ color: "primary.main" }} /></ListItemIcon>
              <ListItemText>{t("chargeManagement@actions.edit")}</ListItemText>
            </MenuItem>
            <MenuItem onClick={runCardAction((_e, r) => handleMedia(_e, r.id))}>
              <ListItemIcon><PhotoLibraryIcon fontSize="small" sx={{ color: "secondary.main" }} /></ListItemIcon>
              <ListItemText>{t("chargeManagement@actions.media")}</ListItemText>
            </MenuItem>

            <Divider />

            {/* Owner */}
            {cardMenuRow?.ownerId ? (
              <MenuItem onClick={runCardAction((_e, r) => navigate(`/users/${r.ownerId}`))}>
                <ListItemIcon><PersonIcon fontSize="small" sx={{ color: "primary.main" }} /></ListItemIcon>
                <ListItemText
                  primary={t("chargeManagement@owner.title")}
                  secondary={cardMenuRow.ownerName ?? `#${cardMenuRow.ownerId}`}
                />
              </MenuItem>
            ) : (
              <MenuItem disabled>
                <ListItemIcon><PersonOffIcon fontSize="small" /></ListItemIcon>
                <ListItemText>{t("chargeManagement@owner.none")}</ListItemText>
              </MenuItem>
            )}
            <MenuItem onClick={runCardAction(handleOpenChangeOwner)}>
              <ListItemIcon><PersonSearchIcon fontSize="small" sx={{ color: "primary.main" }} /></ListItemIcon>
              <ListItemText>{t("chargeManagement@actions.changeOwner")}</ListItemText>
            </MenuItem>
            <MenuItem onClick={runCardAction(handleOpenEngagement)}>
              <ListItemIcon><PeopleIcon fontSize="small" sx={{ color: "info.main" }} /></ListItemIcon>
              <ListItemText>{t("chargeManagement@engagement.view")}</ListItemText>
            </MenuItem>
            <MenuItem onClick={runCardAction(handleManageWorker)}>
              <ListItemIcon><BadgeIcon fontSize="small" sx={{ color: "primary.main" }} /></ListItemIcon>
              <ListItemText>{t("workers@manageWorker")}</ListItemText>
            </MenuItem>

            <Divider />

            {/* Money & performance */}
            <MenuItem
              onClick={runCardAction((_e, r) =>
                navigate(`/provider-settlements?providerType=ChargingPoint&providerId=${r.id}&name=${encodeURIComponent(r.name ?? "")}`)
              )}
            >
              <ListItemIcon><AccountBalanceWalletIcon fontSize="small" sx={{ color: "success.main" }} /></ListItemIcon>
              <ListItemText
                primary={t("chargeManagement@actions.walletSettlements")}
                secondary={cardMenuRow?.isPartner ? t("chargeManagement@partner") : undefined}
              />
            </MenuItem>
            <MenuItem onClick={runCardAction(handleActivity)}>
              <ListItemIcon><ReceiptLongIcon fontSize="small" sx={{ color: "secondary.main" }} /></ListItemIcon>
              <ListItemText>{t("loyalty@activity")}</ListItemText>
            </MenuItem>
            <MenuItem onClick={runCardAction(handleAnalytics)}>
              <ListItemIcon><InsightsIcon fontSize="small" sx={{ color: "success.main" }} /></ListItemIcon>
              <ListItemText>{t("analytics@manage")}</ListItemText>
            </MenuItem>

            <Divider />

            {/* Content & config */}
            <MenuItem onClick={runCardAction(handleSocialLinks)}>
              <ListItemIcon><ShareIcon fontSize="small" sx={{ color: "info.main" }} /></ListItemIcon>
              <ListItemText>{t("socialMedia@manageLinks")}</ListItemText>
            </MenuItem>
            <MenuItem onClick={runCardAction(handlePremium)}>
              <ListItemIcon><WorkspacePremiumIcon fontSize="small" sx={{ color: "warning.main" }} /></ListItemIcon>
              <ListItemText>{t("chargeManagement@premium.manage")}</ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem onClick={runCardAction((_e, r) => setDeleteStationTarget(r))} sx={{ color: "error.main" }}>
              <ListItemIcon><DeleteOutlineIcon fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon>
              <ListItemText>{t("delete")}</ListItemText>
            </MenuItem>
          </Menu>

          <StationRowDetailDialog open={detailOpen} onClose={handleCloseDetail} station={detailStation} />

          <SocialLinksDialog
            open={socialLinksStation != null}
            providerType="ChargingPoint"
            providerId={socialLinksStation?.id ?? null}
            providerName={socialLinksStation?.name}
            onClose={() => setSocialLinksStation(null)}
          />

          <PremiumDialog
            open={premiumStation != null}
            station={premiumStation}
            onClose={() => setPremiumStation(null)}
          />

          <AnalyticsDialog
            open={analyticsStation != null}
            entityType="ChargingPoint"
            entityId={analyticsStation?.id ?? null}
            entityName={analyticsStation?.name ?? undefined}
            onClose={() => setAnalyticsStation(null)}
          />

          <ProviderActivityDialog
            open={activityStation != null}
            providerType="ChargingPoint"
            providerId={activityStation?.id ?? null}
            providerName={activityStation?.name ?? undefined}
            onClose={() => setActivityStation(null)}
          />

          <StationEngagementDialog
            open={engagementStation != null}
            stationId={engagementStation?.id ?? null}
            stationName={engagementStation?.name}
            onClose={() => setEngagementStation(null)}
          />

          {workerStation != null && (
            <WorkerDialog
              open={workerStation != null}
              providerType="ChargingPoint"
              providerId={workerStation.id}
              providerName={workerStation.name}
              onClose={() => setWorkerStation(null)}
            />
          )}

          {/* ── Change Owner Dialog ── */}
          <Dialog
            open={changeOwnerStation != null}
            onClose={() => { if (!changeOwnerMutation.isPending) { setChangeOwnerStation(null); setOwnerSearch(""); } }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, color: "#fff", pb: 1.5 }}>
              <Stack spacing={0.5}>
                <Typography variant="subtitle1" fontWeight={700} color="#fff">
                  {t("chargeManagement@changeOwner.title")}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, color: "#fff" }}>
                  {changeOwnerStation?.name}
                </Typography>
              </Stack>
            </DialogTitle>
            <DialogContent sx={{ px: 2, pt: 2, pb: 0 }}>
              <Box sx={{ mb: 1.5 }}>
                {changeOwnerStation?.hasOwner ? (
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1, px: 1.5, borderRadius: 2, bgcolor: "success.50", border: "1px solid", borderColor: "success.100" }}>
                    <Typography variant="body2" fontWeight={700} color="success.dark">{t("chargeManagement@owner.title")}</Typography>
                    <Button
                      size="small"
                      color="warning"
                      variant="outlined"
                      startIcon={<PersonOffIcon />}
                      disabled={changeOwnerMutation.isPending}
                      onClick={() => changeOwnerStation && changeOwnerMutation.mutate({ stationId: changeOwnerStation.id, newOwnerId: null })}
                      sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
                    >
                      {t("chargeManagement@owner.unassign")}
                    </Button>
                  </Stack>
                ) : (
                  <Chip icon={<PersonOffIcon sx={{ fontSize: "16px !important" }} />} label={t("chargeManagement@owner.unassigned")} color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
                )}
              </Box>
              <TextField
                size="small"
                fullWidth
                placeholder={t("chargeManagement@changeOwner.searchPlaceholder")}
                value={ownerSearch}
                onChange={(e) => setOwnerSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
                  endAdornment: ownerSearch ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setOwnerSearch("")}><ClearIcon fontSize="small" /></IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{ mb: 1 }}
              />
              {loadingProviders ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={28} />
                </Box>
              ) : filteredProviders.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Typography color="text.secondary" variant="body2">
                    {ownerSearch ? t("noResults") : t("chargeManagement@changeOwner.noProviders")}
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding sx={{ maxHeight: 320, overflowY: "auto" }}>
                  {filteredProviders.map((provider) => (
                    <ListItemButton
                      key={provider.id}
                      disabled={changeOwnerMutation.isPending}
                      onClick={() =>
                        changeOwnerStation &&
                        changeOwnerMutation.mutate({
                          stationId: changeOwnerStation.id,
                          newOwnerId: provider.id!,
                        })
                      }
                      sx={{ borderRadius: 1.5, mb: 0.5 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: 13, fontWeight: 700 }}>
                          {provider.name.slice(0, 2).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={600}>{provider.name}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">{provider.email} · ID {provider.id}</Typography>}
                      />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => { setChangeOwnerStation(null); setOwnerSearch(""); }}
                color="inherit"
                disabled={changeOwnerMutation.isPending}
              >
                {t("cancel")}
              </Button>
            </DialogActions>
          </Dialog>

          {/* ── Delete Station Confirmation Dialog ── */}
          <Dialog
            open={deleteStationTarget != null}
            onClose={() => !deleteStationMutation.isPending && setDeleteStationTarget(null)}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle sx={{ background: "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)", color: "#fff", display: "flex", alignItems: "center", gap: 1.5 }}>
              <DeleteOutlineIcon />
              {t("chargeManagement@confirmDeleteTitle")}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Typography variant="body1" sx={{ mb: 1, mt: 2 }}>
                {t("chargeManagement@confirmDeleteMessage")}
              </Typography>
              {deleteStationTarget && (
                <Paper elevation={0} sx={{ p: 2, mt: 1.5, borderRadius: 2, bgcolor: "error.50", border: "1px solid", borderColor: "error.200" }}>
                  <Typography variant="subtitle1" fontWeight={800} color="error.dark">
                    {deleteStationTarget.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    #{deleteStationTarget.id}
                  </Typography>
                </Paper>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button
                onClick={() => setDeleteStationTarget(null)}
                disabled={deleteStationMutation.isPending}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={() => deleteStationTarget && deleteStationMutation.mutate(deleteStationTarget.id)}
                disabled={deleteStationMutation.isPending}
                variant="contained"
                color="error"
                startIcon={deleteStationMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                {deleteStationMutation.isPending ? t("deleting") : t("delete")}
              </Button>
            </DialogActions>
          </Dialog>

          <BulkActionsBar
            selectedCount={(rowSelectionModel as number[]).length}
            onClearSelection={() => setRowSelectionModel([])}
            onBulkExport={handleBulkExport}
            onBulkDelete={handleBulkDelete}
          />
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
