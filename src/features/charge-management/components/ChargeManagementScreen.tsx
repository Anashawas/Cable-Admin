import { useMemo, useState, useCallback } from "react";
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
  Select,
  FormControl,
  InputLabel,
  Paper,
  Button,
  Skeleton,
  useTheme,
  Avatar,
  Card,
  CardContent,
  CardActions,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { GridColDef, GridPaginationModel, GridRowSelectionModel } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
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
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ClearIcon from "@mui/icons-material/Clear";
import EvStationIcon from "@mui/icons-material/EvStation";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid, BulkActionsBar } from "../../../components";
import { useChargeManagement, type SortOption } from "../hooks/use-charge-management";
import { getAllPlugTypes, changeStationOwner } from "../services/station-form-service";
import { getUsersList } from "../../users/services/user-service";
import { useSnackbarStore } from "../../../stores";
import { PROVIDER_ROLE_ID } from "../../users/constants/roles";
import type { ChargingPointDto } from "../types/api";
import StationRowDetailDialog from "./StationRowDetailDialog";

const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: "NONE", labelKey: "chargeManagement@sort.none" },
  { value: "VISITORS_HIGH_TO_LOW", labelKey: "chargeManagement@sort.visitorsHighToLow" },
  { value: "VISITORS_LOW_TO_HIGH", labelKey: "chargeManagement@sort.visitorsLowToHigh" },
  { value: "RATING_HIGH_TO_LOW", labelKey: "chargeManagement@sort.ratingHighToLow" },
  { value: "NAME_A_TO_Z", labelKey: "chargeManagement@sort.nameAtoZ" },
];

export default function ChargeManagementScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [cardPage, setCardPage] = useState(1);
  const CARD_PAGE_SIZE = 12;
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
  const [detailStation, setDetailStation] = useState<ChargingPointDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [changeOwnerStation, setChangeOwnerStation] = useState<ChargingPointDto | null>(null);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("");
  const [stationTypeFilter, setStationTypeFilter] = useState<string>("");
  const [plugTypeFilter, setPlugTypeFilter] = useState<number[]>([]);

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
    mutationFn: ({ stationId, newOwnerId }: { stationId: number; newOwnerId: number }) =>
      changeStationOwner(stationId, newOwnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-management"] });
      openSuccessSnackbar({ message: t("chargeManagement@ownerChanged") });
      setChangeOwnerStation(null);
      setOwnerSearch("");
    },
    onError: (err: Error) =>
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const {
    data,
    isLoading,
    error,
    search,
    sortOption,
    handleSearchChange,
    handleSortChange,
    handleRefresh,
  } = useChargeManagement();

  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      const c = (r.cityName ?? "").trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);
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
      if (cityFilter && (row.cityName ?? "").trim() !== cityFilter) return false;
      if (statusFilter && (row.statusSummary?.name ?? "").trim() !== statusFilter) return false;
      if (verifiedFilter === "yes" && !row.isVerified) return false;
      if (verifiedFilter === "no" && row.isVerified) return false;
      if (stationTypeFilter && (row.stationType?.name ?? "").trim() !== stationTypeFilter) return false;
      if (plugTypeFilter.length > 0) {
        const hasPlug = (row.plugTypeSummary ?? []).some((p) => plugTypeFilter.includes(p.id));
        if (!hasPlug) return false;
      }
      return true;
    });
  }, [data, cityFilter, statusFilter, verifiedFilter, stationTypeFilter, plugTypeFilter]);

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
    cityFilter ||
    statusFilter ||
    verifiedFilter ||
    stationTypeFilter ||
    plugTypeFilter.length > 0;
  const handleClearFilters = useCallback(() => {
    setCityFilter("");
    setStatusFilter("");
    setVerifiedFilter("");
    setStationTypeFilter("");
    setPlugTypeFilter([]);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const handleRowClick = useCallback(
    (params: { row: ChargingPointDto }) => navigate(`/charge-management/edit/${params.row.id}`),
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
  const handleViewComplaints = useCallback(() => navigate("/complaints"), [navigate]);
  const handleAddStation = useCallback(() => navigate("/charge-management/add"), [navigate]);

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
        minWidth: 140,
        width: 160,
        filterable: false,
        sortable: false,
        renderCell: ({ row }) => {
          const plugs = row.plugTypeSummary ?? [];
          const labels = [...new Set(plugs.map((p) => (p.serialNumber ?? p.name ?? "").trim()).filter(Boolean))];
          if (labels.length === 0) return "—";
          return (
            <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap sx={{ py: 0.5 }}>
              {labels.slice(0, 4).map((l) => (
                <Chip key={l} label={l} size="small" variant="outlined" sx={{ maxWidth: 72 }} />
              ))}
              {labels.length > 4 && (
                <Chip label={`+${labels.length - 4}`} size="small" variant="outlined" />
              )}
            </Stack>
          );
        },
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
        valueGetter: (_, row) => row.cityName ?? "—",
        filterable: false,
        sortable: true,
      },
      {
        field: "address",
        headerName: t("chargeManagement@columns.address"),
        minWidth: 160,
        flex: 0.8,
        valueGetter: (_, row) => row.address ?? "—",
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
        field: "methodPayment",
        headerName: t("chargeManagement@columns.payment"),
        minWidth: 100,
        width: 120,
        filterable: false,
        sortable: false,
        renderCell: ({ row }) => {
          const method = (row.methodPayment ?? "") as string;
          const hasVisa = /visa/i.test(method);
          const hasCliQ = /cliq/i.test(method);
          if (!hasVisa && !hasCliQ) return method || "—";
          return (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {hasVisa && (
                <Tooltip title="Visa">
                  <CreditCardIcon sx={{ fontSize: 20, color: "primary.main" }} />
                </Tooltip>
              )}
              {hasCliQ && (
                <Chip label="CliQ" size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
              )}
            </Stack>
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
        width: 140,
        minWidth: 140,
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
          </Stack>
        ),
      },
    ],
    [t, handleEdit, handleMedia, handleOpenDetail, handleOpenChangeOwner]
  );


  const totalStations = data.length;
  const activeStations = useMemo(() => data.filter(r => r.statusSummary?.id === 1 || r.statusSummary?.name?.toLowerCase() === "active").length, [data]);
  const verifiedStations = useMemo(() => data.filter(r => r.isVerified).length, [data]);

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
      <Box sx={{ width: "100%", minWidth: 0, overflow: "hidden", boxSizing: "border-box", p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2.5} sx={{ width: "100%", minWidth: 0 }}>

          {/* ── Page Banner ─────────────────────────────────────────────────── */}
          <Box
            sx={{
              background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
              borderRadius: 3,
              p: { xs: 2, md: 3 },
              position: "relative",
              overflow: "hidden",
              color: "#fff",
            }}
          >
            <Box sx={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)", top: -100, right: -60, pointerEvents: "none" }} />
            <Box sx={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)", bottom: -60, left: 80, pointerEvents: "none" }} />

            <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" spacing={2}>
              {/* Left: title + kpis */}
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <EvStationIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700} color="white">
                      {t("chargeManagement@title")}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>
                      {t("chargeManagement@subtitle")}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {[
                    { label: t("chargeManagement@kpi.total"), value: totalStations },
                    { label: t("chargeManagement@kpi.active"), value: activeStations },
                    { label: t("chargeManagement@kpi.verified"), value: verifiedStations },
                  ].map(kpi => (
                    <Box key={kpi.label} sx={{ background: "rgba(255,255,255,0.13)", borderRadius: 2, px: 2, py: 1, minWidth: 90 }}>
                      {isLoading ? (
                        <Skeleton variant="rounded" width={48} height={32} sx={{ bgcolor: "rgba(255,255,255,0.2)", mb: 0.5 }} />
                      ) : (
                        <Typography variant="h5" fontWeight={700} color="white">{kpi.value}</Typography>
                      )}
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>{kpi.label}</Typography>
                    </Box>
                  ))}
                  {!isLoading && hasActiveFilters && (
                    <Box sx={{ background: "rgba(255,255,0,0.15)", borderRadius: 2, px: 2, py: 1, minWidth: 90, border: "1px solid rgba(255,255,0,0.3)" }}>
                      <Typography variant="h5" fontWeight={700} color="white">{filteredData.length}</Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("chargeManagement@filters.filtered")}</Typography>
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Right: action buttons */}
              <Stack direction="row" spacing={1} flexShrink={0}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddStation}
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, color: "#fff", boxShadow: "none", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)" }}
                >
                  {t("chargeManagement@actions.addStation")}
                </Button>
                <Tooltip title={t("refresh")}>
                  <IconButton onClick={handleRefresh} sx={{ color: "rgba(255,255,255,0.8)", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t("chargeManagement@actions.viewComplaints")}>
                  <IconButton onClick={handleViewComplaints} sx={{ color: "rgba(255,255,255,0.8)", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
                    <ReportProblemIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>

          {/* ── Shimmer skeleton while first load ───────────────────────────── */}
          {isLoading && (
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                {[220, 155, 140, 130, 120, 140, 190].map((w, i) => (
                  <Skeleton key={i} variant="rounded" width={w} height={40} sx={{ borderRadius: 1 }} />
                ))}
              </Stack>
              <Skeleton variant="text" width={120} height={20} sx={{ mt: 1.5 }} />
            </Paper>
          )}

          {isLoading && (
            <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
              {/* header row */}
              <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 2 }}>
                {[80, 180, 120, 70, 90, 100, 140, 110, 80].map((w, i) => (
                  <Skeleton key={i} variant="text" width={w} height={20} />
                ))}
              </Box>
              {/* shimmer rows */}
              {Array.from({ length: 8 }).map((_, i) => (
                <Box key={i} sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 2 }}>
                  <Skeleton variant="rounded" width={40} height={40} sx={{ flexShrink: 0 }} />
                  <Skeleton variant="text" width={160} height={20} />
                  <Skeleton variant="rounded" width={80} height={22} sx={{ borderRadius: 3 }} />
                  <Skeleton variant="text" width={60} height={20} />
                  <Skeleton variant="text" width={100} height={20} />
                  <Skeleton variant="text" width={90} height={20} />
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    {[1,2,3,4,5].map(s => <Skeleton key={s} variant="circular" width={14} height={14} />)}
                  </Box>
                  <Skeleton variant="text" width={60} height={20} />
                  <Box sx={{ display: "flex", gap: 0.5, ml: "auto" }}>
                    <Skeleton variant="circular" width={28} height={28} />
                    <Skeleton variant="circular" width={28} height={28} />
                  </Box>
                </Box>
              ))}
            </Paper>
          )}

          {/* ── Filter Bar + Grid (hidden while skeleton is shown) ─────────── */}
          {!isLoading && <>
          <Paper
            elevation={0}
            sx={{ p: 2, borderRadius: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", boxShadow: `0 1px 4px ${alpha(theme.palette.primary.main, 0.08)}` }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} flexWrap="wrap" useFlexGap>
              <TextField
                size="small"
                placeholder={t("chargeManagement@searchPlaceholder")}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
                sx={{ minWidth: 220, flex: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 155 }}>
                <InputLabel>{t("chargeManagement@sort.label")}</InputLabel>
                <Select value={sortOption} label={t("chargeManagement@sort.label")} onChange={(e) => handleSortChange(e.target.value as SortOption)}>
                  {SORT_OPTIONS.map(opt => <MenuItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>{t("chargeManagement@filters.city")}</InputLabel>
                <Select value={cityFilter} label={t("chargeManagement@filters.city")} onChange={(e) => { setCityFilter(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}>
                  <MenuItem value="">{t("chargeManagement@filters.all")}</MenuItem>
                  {uniqueCities.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>{t("chargeManagement@filters.status")}</InputLabel>
                <Select value={statusFilter} label={t("chargeManagement@filters.status")} onChange={(e) => { setStatusFilter(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}>
                  <MenuItem value="">{t("chargeManagement@filters.all")}</MenuItem>
                  {uniqueStatuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>{t("chargeManagement@filters.verified")}</InputLabel>
                <Select value={verifiedFilter} label={t("chargeManagement@filters.verified")} onChange={(e) => { setVerifiedFilter(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}>
                  <MenuItem value="">{t("chargeManagement@filters.all")}</MenuItem>
                  <MenuItem value="yes">{t("chargeManagement@filters.yes")}</MenuItem>
                  <MenuItem value="no">{t("chargeManagement@filters.no")}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>{t("chargeManagement@filters.stationType")}</InputLabel>
                <Select value={stationTypeFilter} label={t("chargeManagement@filters.stationType")} onChange={(e) => { setStationTypeFilter(e.target.value); setPaginationModel(p => ({ ...p, page: 0 })); }}>
                  <MenuItem value="">{t("chargeManagement@filters.all")}</MenuItem>
                  {uniqueStationTypes.map(st => <MenuItem key={st} value={st}>{st}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 190 }}>
                <InputLabel>{t("chargeManagement@filters.plugType")}</InputLabel>
                <Select
                  multiple
                  value={plugTypeFilter}
                  label={t("chargeManagement@filters.plugType")}
                  onChange={(e) => { const v = e.target.value; setPlugTypeFilter(typeof v === "string" ? [] : v); setPaginationModel(p => ({ ...p, page: 0 })); }}
                  renderValue={(sel) => sel.length === 0 ? t("chargeManagement@filters.all") : sel.length === 1 ? (() => { const p = plugTypes.find(x => x.id === sel[0]); return p?.serialNumber ? `${p.name ?? ""} (${p.serialNumber})` : (p?.name ?? String(sel[0])); })() : t("chargeManagement@filters.plugTypeCount", "{{count}} selected", { count: sel.length })}
                >
                  {plugTypes.map(p => <MenuItem key={p.id} value={p.id}>{p.serialNumber ? `${p.name ?? ""} (${p.serialNumber})` : (p.name ?? String(p.id))}</MenuItem>)}
                </Select>
              </FormControl>
              {hasActiveFilters && (
                <Button size="small" startIcon={<ClearIcon />} onClick={handleClearFilters} color="error" variant="outlined" sx={{ flexShrink: 0 }}>
                  {t("chargeManagement@filters.clearAll")}
                </Button>
              )}
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t("chargeManagement@filters.resultsCount", "{{count}} stations", { count: filteredData.length })}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {hasActiveFilters && (
                  <Chip size="small" label={t("chargeManagement@filters.active")} color="primary" variant="filled" sx={{ height: 20, fontSize: "0.7rem" }} />
                )}
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  size="small"
                  onChange={(_, v) => v && setViewMode(v)}
                  sx={{ "& .MuiToggleButton-root": { px: 1, py: 0.4, border: "1px solid", borderColor: "divider" } }}
                >
                  <ToggleButton value="card"><ViewModuleIcon fontSize="small" /></ToggleButton>
                  <ToggleButton value="table"><ViewListIcon fontSize="small" /></ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>
          </Paper>

          {/* ── Card View ───────────────────────────────────────────────────── */}
          {viewMode === "card" && (
            <>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr", xl: "repeat(4, 1fr)" }, gap: 2.5 }}>
                {cardPagedData.map((row) => {
                  const isActive = row.statusSummary?.id === 1 || row.statusSummary?.name?.toLowerCase() === "active";
                  const rate = row.avgChargingPointRate != null ? Number(row.avgChargingPointRate) : null;
                  const stars = rate != null ? Math.round(rate) : 0;
                  const plugs = [...new Set((row.plugTypeSummary ?? []).map((p) => (p.serialNumber ?? p.name ?? "").trim()).filter(Boolean))];
                  return (
                    <Card
                      key={row.id}
                      elevation={0}
                      onClick={() => navigate(`/charge-management/edit/${row.id}`)}
                      sx={{
                        borderRadius: 3,
                        border: "1.5px solid",
                        borderColor: "divider",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": { borderColor: "primary.main", boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`, transform: "translateY(-2px)" },
                        overflow: "visible",
                        position: "relative",
                      }}
                    >
                      {/* Card header with station image */}
                      <Box sx={{ position: "relative", height: 140, bgcolor: "grey.100", borderRadius: "12px 12px 0 0", overflow: "hidden" }}>
                        {row.iConUrl ? (
                          <Box component="img" src={row.iConUrl} alt={row.name ?? ""} sx={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)" }}>
                            <EvStationIcon sx={{ fontSize: 52, color: "primary.light", opacity: 0.5 }} />
                          </Box>
                        )}
                        {/* Status + verified badges */}
                        <Box sx={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 0.5 }}>
                          <Chip label={row.statusSummary?.name ?? "—"} color={isActive ? "success" : "default"} size="small" sx={{ fontWeight: 700, fontSize: "0.68rem", height: 22 }} />
                        </Box>
                        {row.isVerified && (
                          <Box sx={{ position: "absolute", top: 8, right: 8 }}>
                            <Tooltip title={t("chargeManagement@columns.verified")}>
                              <VerifiedIcon sx={{ color: "white", fontSize: 22, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }} />
                            </Tooltip>
                          </Box>
                        )}
                        {/* Speed badge */}
                        {row.chargerSpeed != null && (
                          <Box sx={{ position: "absolute", bottom: 8, right: 8, bgcolor: "rgba(0,0,0,0.65)", borderRadius: 1.5, px: 1, py: 0.3, display: "flex", alignItems: "center", gap: 0.3 }}>
                            <BoltIcon sx={{ fontSize: 14, color: "warning.light" }} />
                            <Typography variant="caption" sx={{ color: "white", fontWeight: 700, fontSize: "0.7rem" }}>{row.chargerSpeed} kW</Typography>
                          </Box>
                        )}
                      </Box>

                      <CardContent sx={{ pb: 1, pt: 1.5, px: 2 }}>
                        {/* Name */}
                        <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ mb: 0.5 }}>
                          {row.name || t("chargeManagement@unnamed")}
                        </Typography>

                        {/* City + Address */}
                        {(row.cityName || row.address) && (
                          <Stack direction="row" alignItems="flex-start" spacing={0.5} sx={{ mb: 0.75 }}>
                            <LocationOnIcon sx={{ fontSize: 14, color: "text.disabled", mt: 0.2, flexShrink: 0 }} />
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                              {[row.cityName, row.address].filter(Boolean).join(" · ")}
                            </Typography>
                          </Stack>
                        )}

                        {/* Phone */}
                        {row.phone && (
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.75 }}>
                            <PhoneIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                            <Typography variant="caption" color="text.secondary">{row.phone}</Typography>
                          </Stack>
                        )}

                        {/* Rating */}
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                          {[1,2,3,4,5].map((i) =>
                            i <= stars
                              ? <StarIcon key={i} sx={{ fontSize: 14, color: "warning.main" }} />
                              : <StarBorderIcon key={i} sx={{ fontSize: 14, color: "action.disabled" }} />
                          )}
                          {row.rateCount != null && row.rateCount > 0 && (
                            <Typography variant="caption" color="text.secondary">({row.rateCount})</Typography>
                          )}
                        </Stack>

                        {/* Stats row */}
                        <Stack direction="row" spacing={2}>
                          <Stack direction="row" alignItems="center" spacing={0.4}>
                            <VisibilityIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>{row.visitorsCount ?? 0}</Typography>
                          </Stack>
                          {row.chargersCount != null && (
                            <Stack direction="row" alignItems="center" spacing={0.4}>
                              <BoltIcon sx={{ fontSize: 14, color: "warning.main" }} />
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>{row.chargersCount}</Typography>
                            </Stack>
                          )}
                          {row.methodPayment && /cliq/i.test(row.methodPayment) && (
                            <Chip label="CliQ" size="small" sx={{ height: 18, fontSize: "0.65rem", px: 0 }} />
                          )}
                          {row.methodPayment && /visa/i.test(row.methodPayment) && (
                            <CreditCardIcon sx={{ fontSize: 16, color: "primary.main" }} />
                          )}
                        </Stack>

                        {/* Plug chips */}
                        {plugs.length > 0 && (
                          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                            {plugs.slice(0, 3).map((l) => (
                              <Chip key={l} label={l} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem", maxWidth: 80 }} />
                            ))}
                            {plugs.length > 3 && <Chip label={`+${plugs.length - 3}`} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />}
                          </Stack>
                        )}
                      </CardContent>

                      <Divider />
                      <CardActions sx={{ px: 2, py: 1, justifyContent: "space-between" }} onClick={(e) => e.stopPropagation()}>
                        <Typography variant="caption" color="text.disabled">ID: {row.id}</Typography>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title={t("chargeManagement@actions.edit")}>
                            <IconButton size="small" onClick={(e) => handleEdit(e, row.id)} sx={{ color: "primary.main" }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("chargeManagement@actions.media")}>
                            <IconButton size="small" onClick={(e) => handleMedia(e, row.id)} sx={{ color: "secondary.main" }}>
                              <PhotoLibraryIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("chargeManagement@actions.changeOwner")}>
                            <IconButton size="small" color="primary" onClick={(e) => handleOpenChangeOwner(e, row)}>
                              <PersonSearchIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("chargeManagement@detail.title")}>
                            <IconButton size="small" onClick={(e) => handleOpenDetail(e, row)}>
                              <ExpandMoreIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </CardActions>
                    </Card>
                  );
                })}
              </Box>
              {cardTotalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
                  <Pagination count={cardTotalPages} page={cardPage} onChange={(_, p) => setCardPage(p)} color="primary" shape="rounded" />
                </Box>
              )}
            </>
          )}

          {/* ── Table View ───────────────────────────────────────────────────── */}
          {viewMode === "table" && (
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
          </>}

          <StationRowDetailDialog open={detailOpen} onClose={handleCloseDetail} station={detailStation} />

          {/* ── Change Owner Dialog ── */}
          <Dialog
            open={changeOwnerStation != null}
            onClose={() => { if (!changeOwnerMutation.isPending) { setChangeOwnerStation(null); setOwnerSearch(""); } }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)", color: "#fff", pb: 1.5 }}>
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
