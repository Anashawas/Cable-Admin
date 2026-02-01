import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
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
  Divider,
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
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid, BulkActionsBar } from "../../../components";
import { useChargeManagement, type SortOption } from "../hooks/use-charge-management";
import { getAllPlugTypes } from "../services/station-form-service";
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
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
  const [detailStation, setDetailStation] = useState<ChargingPointDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cityFilter, setCityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("");
  const [stationTypeFilter, setStationTypeFilter] = useState<string>("");
  const [plugTypeFilter, setPlugTypeFilter] = useState<number[]>([]);

  const { data: plugTypes = [] } = useQuery({
    queryKey: ["charge-management", "plug-types"],
    queryFn: ({ signal }) => getAllPlugTypes(signal),
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
        width: 110,
        minWidth: 110,
        filterable: false,
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
            <Tooltip title={t("chargeManagement@actions.edit")}>
              <IconButton
                size="small"
                onClick={(e) => handleEdit(e, row.id)}
                aria-label={t("chargeManagement@actions.edit")}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("chargeManagement@actions.media")}>
              <IconButton
                size="small"
                onClick={(e) => handleMedia(e, row.id)}
                aria-label={t("chargeManagement@actions.media")}
              >
                <PhotoLibraryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [t, handleEdit, handleMedia, handleOpenDetail]
  );

  const headerActions: ScreenHeaderAction[] = useMemo(
    () => [
      {
        id: "add",
        icon: <AddIcon />,
        label: t("chargeManagement@actions.addStation"),
        onClick: handleAddStation,
        color: "primary",
      },
      {
        id: "refresh",
        icon: <RefreshIcon />,
        label: t("refresh"),
        onClick: handleRefresh,
      },
      {
        id: "complaints",
        icon: <ReportProblemIcon />,
        label: t("chargeManagement@actions.viewComplaints"),
        onClick: handleViewComplaints,
      },
    ],
    [t, handleAddStation, handleRefresh, handleViewComplaints]
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
        <Stack spacing={2.5} sx={{ width: "100%", minWidth: 0 }}>
          <ScreenHeader
            title={t("chargeManagement@title")}
            actions={headerActions}
          />

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "background.paper",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
              <FilterListIcon color="action" fontSize="small" />
              <Typography variant="subtitle2" fontWeight="600" color="text.secondary">
                {t("chargeManagement@filters.title")}
              </Typography>
              {hasActiveFilters && (
                <Chip
                  size="small"
                  label={t("chargeManagement@filters.active")}
                  color="primary"
                  variant="outlined"
                  sx={{ ml: 0.5 }}
                />
              )}
              {hasActiveFilters && (
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  sx={{ ml: "auto" }}
                >
                  {t("chargeManagement@filters.clearAll")}
                </Button>
              )}
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ sm: "center" }}
              flexWrap="wrap"
              useFlexGap
            >
              <TextField
                size="small"
                placeholder={t("chargeManagement@searchPlaceholder")}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 220 }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="charge-management-sort-label">
                  {t("chargeManagement@sort.label")}
                </InputLabel>
                <Select
                  labelId="charge-management-sort-label"
                  value={sortOption}
                  label={t("chargeManagement@sort.label")}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="charge-management-city-label">
                  {t("chargeManagement@filters.city")}
                </InputLabel>
                <Select
                  labelId="charge-management-city-label"
                  value={cityFilter}
                  label={t("chargeManagement@filters.city")}
                  onChange={(e) => {
                    setCityFilter(e.target.value);
                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                  }}
                >
                  <MenuItem value="">{t("chargeManagement@filters.all")}</MenuItem>
                  {uniqueCities.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="charge-management-status-label">
                  {t("chargeManagement@filters.status")}
                </InputLabel>
                <Select
                  labelId="charge-management-status-label"
                  value={statusFilter}
                  label={t("chargeManagement@filters.status")}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                  }}
                >
                  <MenuItem value="">{t("chargeManagement@filters.all")}</MenuItem>
                  {uniqueStatuses.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel id="charge-management-verified-label">
                  {t("chargeManagement@filters.verified")}
                </InputLabel>
                <Select
                  labelId="charge-management-verified-label"
                  value={verifiedFilter}
                  label={t("chargeManagement@filters.verified")}
                  onChange={(e) => {
                    setVerifiedFilter(e.target.value);
                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                  }}
                >
                  <MenuItem value="">{t("chargeManagement@filters.all")}</MenuItem>
                  <MenuItem value="yes">{t("chargeManagement@filters.yes")}</MenuItem>
                  <MenuItem value="no">{t("chargeManagement@filters.no")}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="charge-management-station-type-label">
                  {t("chargeManagement@filters.stationType")}
                </InputLabel>
                <Select
                  labelId="charge-management-station-type-label"
                  value={stationTypeFilter}
                  label={t("chargeManagement@filters.stationType")}
                  onChange={(e) => {
                    setStationTypeFilter(e.target.value);
                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                  }}
                >
                  <MenuItem value="">{t("chargeManagement@filters.all")}</MenuItem>
                  {uniqueStationTypes.map((st) => (
                    <MenuItem key={st} value={st}>
                      {st}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="charge-management-plug-type-label">
                  {t("chargeManagement@filters.plugType")}
                </InputLabel>
                <Select
                  labelId="charge-management-plug-type-label"
                  multiple
                  value={plugTypeFilter}
                  label={t("chargeManagement@filters.plugType")}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPlugTypeFilter(typeof v === "string" ? [] : v);
                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                  }}
                  renderValue={(selected) =>
                    selected.length === 0
                      ? t("chargeManagement@filters.all")
                      : selected.length === 1
                        ? (() => {
                            const p = plugTypes.find((x) => x.id === selected[0]);
                            return p?.serialNumber
                              ? `${p.name ?? ""} (${p.serialNumber})`
                              : (p?.name ?? String(selected[0]));
                          })()
                        : t("chargeManagement@filters.plugTypeCount", "{{count}} selected", {
                            count: selected.length,
                          })
                  }
                >
                  {plugTypes.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.serialNumber
                        ? `${p.name ?? ""} (${p.serialNumber})`
                        : (p.name ?? String(p.id))}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
              {t("chargeManagement@filters.resultsCount", "{{count}} stations", {
                count: filteredData.length,
              })}
            </Typography>
          </Paper>

          <Box sx={{ "& .premium-row": { bgcolor: "rgba(255, 215, 0, 0.15)" }, "& .MuiDataGrid-cell": { py: 1.5 } }}>
            <AppDataGrid<ChargingPointDto>
              data={paginatedData}
              columns={columns}
              loading={isLoading}
              getRowId={(row) => row.id}
              onRowClick={handleRowClick}
              disablePagination={false}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              total={filteredData.length}
              minHeight="70vh"
              enableColumnFilter
              enableToolbar
              checkboxSelection
              rowSelectionModel={rowSelectionModel}
              onRowSelectionModelChange={setRowSelectionModel}
              getRowClassName={getRowClassName}
              getRowHeight={() => 76}
            />
          </Box>
          <StationRowDetailDialog
            open={detailOpen}
            onClose={handleCloseDetail}
            station={detailStation}
          />
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
