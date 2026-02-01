import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
} from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import StarIcon from "@mui/icons-material/Star";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import VerifiedIcon from "@mui/icons-material/Verified";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid } from "../../../components";
import { useChargeManagement, type SortOption } from "../hooks/use-charge-management";
import type { ChargingPointDto } from "../types/api";

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

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return data.slice(start, start + paginationModel.pageSize);
  }, [data, paginationModel.page, paginationModel.pageSize]);

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
        minWidth: 220,
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
            {row.isVerified && (
              <Tooltip title={t("chargeManagement@columns.verified")}>
                <VerifiedIcon sx={{ fontSize: 20, color: "primary.main" }} />
              </Tooltip>
            )}
          </Stack>
        ),
      },
      {
        field: "cityName",
        headerName: t("chargeManagement@columns.city"),
        minWidth: 120,
        width: 120,
        valueGetter: (_, row) => row.cityName ?? "—",
        filterable: false,
        sortable: true,
      },
      {
        field: "address",
        headerName: t("chargeManagement@columns.address"),
        minWidth: 180,
        flex: 1,
        valueGetter: (_, row) => row.address ?? "—",
        filterable: false,
        sortable: false,
      },
      {
        field: "phone",
        headerName: t("chargeManagement@columns.phone"),
        minWidth: 130,
        width: 130,
        valueGetter: (_, row) => row.phone ?? "—",
        filterable: false,
        sortable: false,
      },
      {
        field: "chargingPointType",
        headerName: t("chargeManagement@columns.type"),
        minWidth: 100,
        width: 100,
        valueGetter: (_, row) => row.chargingPointType?.name ?? "—",
        filterable: false,
        sortable: false,
      },
      {
        field: "chargersCount",
        headerName: t("chargeManagement@columns.chargers"),
        minWidth: 90,
        width: 90,
        valueGetter: (_, row) =>
          row.chargersCount != null ? String(row.chargersCount) : "—",
        filterable: false,
        sortable: true,
      },
      {
        field: "statusSummary",
        headerName: t("chargeManagement@columns.status"),
        minWidth: 100,
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
        minWidth: 100,
        width: 100,
        filterable: false,
        sortable: true,
        renderCell: ({ row }) => (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <StarIcon sx={{ fontSize: 18, color: "warning.main" }} />
            <Typography variant="body2">
              {row.avgChargingPointRate != null ? Number(row.avgChargingPointRate).toFixed(1) : "—"}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "visitorsCount",
        headerName: t("chargeManagement@columns.visitors"),
        minWidth: 90,
        width: 90,
        valueGetter: (_, row) => row.visitorsCount ?? 0,
        filterable: false,
        sortable: true,
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
    [t, handleEdit, handleMedia]
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
        <Stack spacing={2} sx={{ width: "100%", minWidth: 0 }}>
          <ScreenHeader
            title={t("chargeManagement@title")}
            actions={headerActions}
          />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ sm: "center" }}
            flexWrap="wrap"
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
            <FormControl size="small" sx={{ minWidth: 200 }}>
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
          </Stack>

          <AppDataGrid<ChargingPointDto>
            data={paginatedData}
            columns={columns}
            loading={isLoading}
            getRowId={(row) => row.id}
            onRowClick={handleRowClick}
            disablePagination={false}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            total={data.length}
            minHeight="70vh"
          />
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
