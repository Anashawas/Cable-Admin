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
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Avatar,
  Paper,
  Tab,
  Tabs,
  Badge,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import StarsIcon from "@mui/icons-material/Stars";
import TimerIcon from "@mui/icons-material/Timer";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import EvStationIcon from "@mui/icons-material/EvStation";
import BusinessIcon from "@mui/icons-material/Business";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PersonIcon from "@mui/icons-material/Person";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  useAllOffers,
  usePendingOffers,
  useApproveOffer,
  useRejectOffer,
  useDeactivateOffer,
  useCreateOffer,
} from "../hooks/use-offers";
import type { OfferDto, ProposeOfferRequest, ProviderType } from "../types/api";
import { useQuery } from "@tanstack/react-query";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";
import { getAllChargingPoints } from "../../charge-management/services/charge-management-service";

// ── Initial form state ──────────────────────────────────────────────────────
const INITIAL_FORM_DATA: ProposeOfferRequest = {
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  providerType: "ServiceProvider",
  providerId: 0,
  pointsCost: 0,
  monetaryValue: 0,
  currencyCode: "JOD",
  maxUsesPerUser: null,
  maxTotalUses: null,
  offerCodeExpirySeconds: 60,
  imageUrl: "",
  validFrom: "",
  validTo: "",
};

// ── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "primary" | "warning" | "success" | "info";
}) {
  const colorMap = {
    primary: { bg: "#e8f4fd", icon: "#1976d2", text: "#0d47a1" },
    warning: { bg: "#fff8e1", icon: "#f59e0b", text: "#92400e" },
    success: { bg: "#e8f5e9", icon: "#2e7d32", text: "#1b5e20" },
    info:    { bg: "#e3f2fd", icon: "#0288d1", text: "#01579b" },
  };
  const c = colorMap[color];
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: c.bg,
        border: "1px solid",
        borderColor: `${color}.100`,
        flex: 1,
        minWidth: 140,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            p: 1.2,
            borderRadius: 2,
            bgcolor: c.icon,
            display: "flex",
            alignItems: "center",
            color: "white",
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} color={c.text}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function OffersScreen() {
  const { t } = useTranslation(["offers", "common"]);
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  // ── Tab ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(0);

  // ── Active offers data ───────────────────────────────────────────────────
  const {
    data: activeData,
    isLoading: isLoadingActive,
    search: activeSearch,
    statusFilter,
    handleSearchChange: handleActiveSearchChange,
    handleStatusFilterChange,
    handleRefresh: handleRefreshActive,
  } = useAllOffers();

  // ── Pending offers data ──────────────────────────────────────────────────
  const {
    data: pendingData,
    isLoading: isLoadingPending,
    search: pendingSearch,
    handleSearchChange: handlePendingSearchChange,
    handleRefresh: handleRefreshPending,
  } = usePendingOffers();

  // ── Mutations ────────────────────────────────────────────────────────────
  const deactivateMutation = useDeactivateOffer();
  const createMutation = useCreateOffer();
  const approveMutation = useApproveOffer();
  const rejectMutation = useRejectOffer();

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalActive = useMemo(() => activeData.filter((o) => o.isActive).length, [activeData]);
  const totalUses = useMemo(
    () => activeData.reduce((sum, o) => sum + o.currentTotalUses, 0),
    [activeData]
  );

  // ── Pagination ────────────────────────────────────────────────────────────
  const [activePaginationModel, setActivePaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });
  const [pendingPaginationModel, setPendingPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });
  const paginatedActiveData = useMemo(() => {
    const start = activePaginationModel.page * activePaginationModel.pageSize;
    return activeData.slice(start, start + activePaginationModel.pageSize);
  }, [activeData, activePaginationModel]);
  const paginatedPendingData = useMemo(() => {
    const start = pendingPaginationModel.page * pendingPaginationModel.pageSize;
    return pendingData.slice(start, start + pendingPaginationModel.pageSize);
  }, [pendingData, pendingPaginationModel]);

  // ── Active offer dialogs state ───────────────────────────────────────────
  const [activeDetailOpen, setActiveDetailOpen] = useState(false);
  const [selectedActiveOffer, setSelectedActiveOffer] = useState<OfferDto | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProposeOfferRequest>(INITIAL_FORM_DATA);
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number;
    name: string;
    city?: string | null;
  } | null>(null);
  const [providerSearch, setProviderSearch] = useState("");

  // ── Pending offer dialogs state ──────────────────────────────────────────
  const [pendingDetailOpen, setPendingDetailOpen] = useState(false);
  const [selectedPendingOffer, setSelectedPendingOffer] = useState<OfferDto | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  // ── Provider search queries ──────────────────────────────────────────────
  const { data: serviceProviders = [], isLoading: isLoadingServiceProviders } = useQuery({
    queryKey: ["service-providers-for-offer"],
    queryFn: () => getAllServiceProviders(),
    enabled: createDialogOpen && formData.providerType === "ServiceProvider",
  });
  const { data: chargingPoints = [], isLoading: isLoadingChargingPoints } = useQuery({
    queryKey: ["charging-points-for-offer"],
    queryFn: () => getAllChargingPoints(),
    enabled: createDialogOpen && formData.providerType === "ChargingPoint",
  });
  const isLoadingProviders = isLoadingServiceProviders || isLoadingChargingPoints;
  const filteredProviders = useMemo(() => {
    const q = providerSearch.toLowerCase();
    if (formData.providerType === "ServiceProvider") {
      return serviceProviders
        .filter(
          (p) =>
            !q ||
            p.name.toLowerCase().includes(q) ||
            String(p.id).includes(q) ||
            (p.cityName ?? "").toLowerCase().includes(q)
        )
        .map((p) => ({ id: p.id, name: p.name, city: p.cityName }));
    }
    return chargingPoints
      .filter(
        (p) =>
          !q ||
          (p.name ?? "").toLowerCase().includes(q) ||
          String(p.id).includes(q) ||
          (p.cityName ?? "").toLowerCase().includes(q)
      )
      .map((p) => ({ id: p.id, name: p.name ?? `Station #${p.id}`, city: p.cityName }));
  }, [formData.providerType, serviceProviders, chargingPoints, providerSearch]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const updateField = <K extends keyof ProposeOfferRequest>(
    field: K,
    value: ProposeOfferRequest[K]
  ) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleOpenCreate = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setSelectedProvider(null);
    setProviderSearch("");
    setCreateDialogOpen(true);
  }, []);

  const handleCloseCreate = useCallback(() => {
    if (!createMutation.isPending) setCreateDialogOpen(false);
  }, [createMutation.isPending]);

  const handleCreateSubmit = useCallback(() => {
    if (!formData.title.trim()) {
      openErrorSnackbar({ message: t("offers@titleRequired") });
      return;
    }
    if (!formData.providerId || formData.providerId <= 0) {
      openErrorSnackbar({ message: t("offers@providerIdRequired") });
      return;
    }
    if (formData.pointsCost <= 0) {
      openErrorSnackbar({ message: t("offers@pointsCostRequired") });
      return;
    }
    if (formData.monetaryValue <= 0) {
      openErrorSnackbar({ message: t("offers@monetaryValueRequired") });
      return;
    }
    if (formData.offerCodeExpirySeconds < 60) {
      openErrorSnackbar({ message: t("offers@minExpirySeconds") });
      return;
    }
    if (!formData.validFrom) {
      openErrorSnackbar({ message: t("offers@validDatesRequired") });
      return;
    }
    createMutation.mutate(formData, {
      onSuccess: () => {
        openSuccessSnackbar({ message: t("offers@created") });
        setCreateDialogOpen(false);
        setFormData(INITIAL_FORM_DATA);
        setSelectedProvider(null);
        setProviderSearch("");
        setActiveTab(1); // switch to pending after create since it goes to review
      },
      onError: (err: Error) => {
        openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
      },
    });
  }, [formData, createMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleDeactivate = useCallback(
    (e: React.MouseEvent, row: OfferDto) => {
      e.stopPropagation();
      deactivateMutation.mutate(row.id, {
        onSuccess: () => openSuccessSnackbar({ message: t("offers@deactivated") }),
        onError: (err: Error) =>
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
      });
    },
    [deactivateMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const handleApprove = useCallback(
    (_e: React.MouseEvent, row: OfferDto) => {
      approveMutation.mutate(row.id, {
        onSuccess: () => openSuccessSnackbar({ message: t("offers@approved") }),
        onError: (err: Error) =>
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
      });
    },
    [approveMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const handleRejectClick = useCallback((_e: React.MouseEvent, row: OfferDto) => {
    setSelectedPendingOffer(row);
    setRejectNote("");
    setRejectDialogOpen(true);
  }, []);

  const handleConfirmReject = useCallback(() => {
    if (!selectedPendingOffer) return;
    if (!rejectNote.trim()) {
      openErrorSnackbar({ message: t("offers@rejectNoteRequired") });
      return;
    }
    rejectMutation.mutate(
      { id: selectedPendingOffer.id, data: { note: rejectNote } },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("offers@rejected") });
          setRejectDialogOpen(false);
          setSelectedPendingOffer(null);
          setRejectNote("");
        },
        onError: (err: Error) =>
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
      }
    );
  }, [selectedPendingOffer, rejectNote, rejectMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  // ── Column definitions ────────────────────────────────────────────────────
  const providerTypeChip = (value: string) => (
    <Chip
      label={value === "ChargingPoint" ? t("offers@chargingPoint") : t("offers@serviceProvider")}
      size="small"
      color={value === "ChargingPoint" ? "primary" : "secondary"}
      icon={value === "ChargingPoint" ? <EvStationIcon /> : <BusinessIcon />}
    />
  );

  const activeColumns: GridColDef<OfferDto>[] = [
    { field: "id", headerName: t("id"), width: 64, align: "center", headerAlign: "center" },
    { field: "title", headerName: t("offerTitle"), flex: 1, minWidth: 180 },
    { field: "providerName", headerName: t("provider"), width: 170 },
    {
      field: "providerType",
      headerName: t("providerType"),
      width: 150,
      renderCell: (p) => providerTypeChip(p.value),
    },
    {
      field: "pointsCost",
      headerName: t("pointsCost"),
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => (
        <Chip label={`${p.value} pts`} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      field: "monetaryValue",
      headerName: t("monetaryValue"),
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => `${p.value} ${p.row.currencyCode}`,
    },
    {
      field: "currentTotalUses",
      headerName: t("totalUses"),
      width: 100,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "isActive",
      headerName: t("status"),
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => (
        <Chip
          label={p.value ? t("active") : t("inactive")}
          color={p.value ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "validTo",
      headerName: t("offers@validTo"),
      width: 120,
      valueFormatter: (v) => new Date(v).toLocaleDateString(),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 110,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t("viewDetails")}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedActiveOffer(p.row);
                setActiveDetailOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {p.row.isActive && (
            <Tooltip title={t("offers@deactivate")}>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => handleDeactivate(e, p.row)}
                disabled={deactivateMutation.isPending}
              >
                <BlockIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const pendingColumns: GridColDef<OfferDto>[] = [
    { field: "id", headerName: t("id"), width: 64, align: "center", headerAlign: "center" },
    { field: "title", headerName: t("offerTitle"), flex: 1, minWidth: 180 },
    { field: "providerName", headerName: t("provider"), width: 170 },
    {
      field: "providerType",
      headerName: t("providerType"),
      width: 150,
      renderCell: (p) => providerTypeChip(p.value),
    },
    {
      field: "pointsCost",
      headerName: t("pointsCost"),
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => (
        <Chip label={`${p.value} pts`} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      field: "monetaryValue",
      headerName: t("monetaryValue"),
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => `${p.value} ${p.row.currencyCode}`,
    },
    { field: "proposedByUserName", headerName: t("offers@proposedBy"), width: 150 },
    {
      field: "createdAt",
      headerName: t("offers@createdAt"),
      width: 160,
      valueFormatter: (v) => new Date(v).toLocaleString(),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 160,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t("viewDetails")}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPendingOffer(p.row);
                setPendingDetailOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("offers@approve")}>
            <IconButton
              size="small"
              color="success"
              onClick={(e) => handleApprove(e, p.row)}
              disabled={approveMutation.isPending}
            >
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("offers@reject")}>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => handleRejectClick(e, p.row)}
              disabled={rejectMutation.isPending}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppScreenContainer>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0d3276 0%, #1565c0 60%, #0d47a1 100%)",
          borderRadius: 3,
          p: 3,
          mb: 3,
          color: "white",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 52, height: 52 }}>
              <LocalOfferIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                {t("offers@offersManagement")}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.3 }}>
                {t("offers@offersManagement_subtitle")}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Tooltip title={t("refresh")}>
              <IconButton
                onClick={() => {
                  handleRefreshActive();
                  handleRefreshPending();
                }}
                sx={{ color: "white", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{
                bgcolor: "white",
                color: "primary.dark",
                fontWeight: 700,
                "&:hover": { bgcolor: "grey.100" },
              }}
            >
              {t("offers@createOffer")}
            </Button>
          </Stack>
        </Stack>

        {/* KPI Strip */}
        <Stack direction="row" spacing={2} sx={{ mt: 3 }} flexWrap="wrap">
          <StatCard
            icon={<LocalOfferIcon fontSize="small" />}
            label={t("offers@activeOffers")}
            value={totalActive}
            color="info"
          />
          <StatCard
            icon={<PendingActionsIcon fontSize="small" />}
            label={t("offers@pendingOffers")}
            value={pendingData.length}
            color="warning"
          />
          <StatCard
            icon={<TrendingUpIcon fontSize="small" />}
            label={t("offers@totalUses")}
            value={totalUses}
            color="success"
          />
        </Stack>
      </Box>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
      >
        <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              "& .MuiTab-root": { fontWeight: 600, minHeight: 52 },
              "& .Mui-selected": { color: "primary.main" },
            }}
          >
            <Tab
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocalOfferIcon fontSize="small" />
                  <span>{t("offers@activeOffers")}</span>
                  <Chip label={totalActive} size="small" color="primary" />
                </Stack>
              }
            />
            <Tab
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Badge badgeContent={pendingData.length} color="warning" max={99}>
                    <PendingActionsIcon fontSize="small" />
                  </Badge>
                  <span>{t("offers@pendingOffers")}</span>
                  {pendingData.length > 0 && (
                    <Chip label={pendingData.length} size="small" color="warning" />
                  )}
                </Stack>
              }
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 2.5 }}>
          {/* ── ACTIVE TAB ─────────────────────────────────────────────── */}
          {activeTab === 0 && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <TextField
                  size="small"
                  placeholder={t("search")}
                  value={activeSearch}
                  onChange={(e) => handleActiveSearchChange(e.target.value)}
                  sx={{ minWidth: 260 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                <ToggleButtonGroup
                  value={statusFilter}
                  exclusive
                  onChange={(_, v) => { if (v !== null) handleStatusFilterChange(v); }}
                  size="small"
                >
                  <ToggleButton value="all">{t("all")}</ToggleButton>
                  <ToggleButton value="active">{t("active")}</ToggleButton>
                  <ToggleButton value="inactive">{t("inactive")}</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {activeData.length === 0 && !isLoadingActive && (
                <Alert severity="info">{t("offers@noActiveOffers")}</Alert>
              )}

              <AppDataGrid
                data={paginatedActiveData}
                columns={activeColumns}
                loading={isLoadingActive}
                disablePagination={false}
                paginationModel={activePaginationModel}
                onPaginationModelChange={setActivePaginationModel}
                total={activeData.length}
              />
            </Stack>
          )}

          {/* ── PENDING TAB ────────────────────────────────────────────── */}
          {activeTab === 1 && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <TextField
                  size="small"
                  placeholder={t("search")}
                  value={pendingSearch}
                  onChange={(e) => handlePendingSearchChange(e.target.value)}
                  sx={{ minWidth: 260 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
                {pendingData.length > 0 && (
                  <Alert severity="warning" sx={{ py: 0.5, flex: 1 }}>
                    {pendingData.length} {t("offers@offersAwaitingReview")}
                  </Alert>
                )}
              </Stack>

              {pendingData.length === 0 && !isLoadingPending && (
                <Alert severity="success">{t("offers@noPendingOffers")}</Alert>
              )}

              <AppDataGrid
                data={paginatedPendingData}
                columns={pendingColumns}
                loading={isLoadingPending}
                disablePagination={false}
                paginationModel={pendingPaginationModel}
                onPaginationModelChange={setPendingPaginationModel}
                total={pendingData.length}
              />
            </Stack>
          )}
        </Box>
      </Paper>

      {/* ════════════════════════════════════════════════════════════════════
          ACTIVE OFFER — DETAIL DIALOG
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={activeDetailOpen}
        onClose={() => setActiveDetailOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, display: "flex", flexDirection: "column", maxHeight: "90vh" } }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
            px: 3, pt: 3, pb: 4,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 52, height: 52 }}>
              <LocalOfferIcon sx={{ color: "white", fontSize: 28 }} />
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" fontWeight={800} color="white">
                {selectedActiveOffer?.title}
              </Typography>
              {selectedActiveOffer?.titleAr && (
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", mt: 0.5 }}>
                  {selectedActiveOffer.titleAr}
                </Typography>
              )}
              <Chip
                label={selectedActiveOffer?.isActive ? t("active") : t("inactive")}
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: "rgba(255,255,255,0.25)",
                  color: "white",
                  fontWeight: 700,
                }}
              />
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ py: 3, overflowY: "auto", flex: 1 }}>
          {selectedActiveOffer && (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, height: "100%" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: selectedActiveOffer.providerType === "ChargingPoint" ? "primary.main" : "secondary.main", width: 40, height: 40 }}>
                        {selectedActiveOffer.providerType === "ChargingPoint" ? <EvStationIcon fontSize="small" /> : <BusinessIcon fontSize="small" />}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("provider")}</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>{selectedActiveOffer.providerName}</Typography>
                        <Chip
                          label={selectedActiveOffer.providerType === "ChargingPoint" ? t("offers@chargingPoint") : t("offers@serviceProvider")}
                          size="small"
                          color={selectedActiveOffer.providerType === "ChargingPoint" ? "primary" : "secondary"}
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, height: "100%" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: "purple", width: 40, height: 40 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("offers@proposedBy")}</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>{selectedActiveOffer.proposedByUserName}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(selectedActiveOffer.createdAt).toLocaleString()}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={1.5}>
                {[
                  { icon: <StarsIcon />, value: `${selectedActiveOffer.pointsCost} pts`, label: t("pointsCost"), color: "primary" },
                  { icon: <AttachMoneyIcon />, value: `${selectedActiveOffer.monetaryValue} ${selectedActiveOffer.currencyCode}`, label: t("monetaryValue"), color: "success" },
                  { icon: <TimerIcon />, value: `${selectedActiveOffer.offerCodeExpirySeconds} ${t("offers@seconds")}`, label: t("offers@codeExpiry"), color: "warning" },
                  { icon: <PeopleIcon />, value: selectedActiveOffer.currentTotalUses, label: t("offers@totalUses"), color: "info" },
                ].map(({ icon, value, label, color }) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: `${color}.50`, borderRadius: 2, border: "1px solid", borderColor: `${color}.100`, textAlign: "center" }}>
                      <Box sx={{ color: `${color}.main`, mb: 0.5 }}>{icon}</Box>
                      <Typography variant="h6" fontWeight={800} color={`${color}.dark`}>{value}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ p: 1, bgcolor: "primary.main", borderRadius: 1.5, display: "flex" }}>
                    <CalendarTodayIcon sx={{ fontSize: 20, color: "white" }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("offers@validPeriod")}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Chip label={new Date(selectedActiveOffer.validFrom).toLocaleDateString()} size="small" variant="outlined" color="primary" />
                      <Typography variant="body2" color="text.secondary">→</Typography>
                      <Chip label={new Date(selectedActiveOffer.validTo).toLocaleDateString()} size="small" variant="outlined" color="primary" />
                    </Stack>
                  </Box>
                  {selectedActiveOffer.maxUsesPerUser !== null && (
                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("offers@maxUsesPerUser")}</Typography>
                      <Typography variant="subtitle1" fontWeight={700}>{selectedActiveOffer.maxUsesPerUser ?? "∞"}</Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>

              {selectedActiveOffer.description && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>{t("description")}</Typography>
                  <Typography variant="body1">{selectedActiveOffer.description}</Typography>
                  {selectedActiveOffer.descriptionAr && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} dir="rtl">{selectedActiveOffer.descriptionAr}</Typography>
                  )}
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>

        <Divider sx={{ flexShrink: 0 }} />
        <DialogActions sx={{ px: 3, py: 2, gap: 1, flexShrink: 0 }}>
          <Button onClick={() => setActiveDetailOpen(false)} size="large" sx={{ mr: "auto" }}>{t("close")}</Button>
          {selectedActiveOffer?.isActive && (
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={deactivateMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <BlockIcon />}
              disabled={deactivateMutation.isPending}
              onClick={() => {
                setActiveDetailOpen(false);
                handleDeactivate({} as React.MouseEvent, selectedActiveOffer);
              }}
            >
              {t("offers@deactivate")}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          PENDING OFFER — DETAIL DIALOG
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={pendingDetailOpen}
        onClose={() => setPendingDetailOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, display: "flex", flexDirection: "column", maxHeight: "90vh" } }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            px: 3, pt: 3, pb: 4,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.25)", width: 52, height: 52 }}>
              <LocalOfferIcon sx={{ color: "white", fontSize: 28 }} />
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" fontWeight={800} color="white">{selectedPendingOffer?.title}</Typography>
              {selectedPendingOffer?.titleAr && (
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", mt: 0.5 }}>{selectedPendingOffer.titleAr}</Typography>
              )}
              <Chip
                label={t("offers@pending")}
                size="small"
                sx={{ mt: 1, bgcolor: "rgba(255,255,255,0.25)", color: "white", fontWeight: 700 }}
              />
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ py: 3, overflowY: "auto", flex: 1 }}>
          {selectedPendingOffer && (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, height: "100%" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: selectedPendingOffer.providerType === "ChargingPoint" ? "primary.main" : "secondary.main", width: 40, height: 40 }}>
                        {selectedPendingOffer.providerType === "ChargingPoint" ? <EvStationIcon fontSize="small" /> : <BusinessIcon fontSize="small" />}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("provider")}</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>{selectedPendingOffer.providerName}</Typography>
                        <Chip
                          label={selectedPendingOffer.providerType === "ChargingPoint" ? t("offers@chargingPoint") : t("offers@serviceProvider")}
                          size="small"
                          color={selectedPendingOffer.providerType === "ChargingPoint" ? "primary" : "secondary"}
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, height: "100%" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: "purple", width: 40, height: 40 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("offers@proposedBy")}</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>{selectedPendingOffer.proposedByUserName}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(selectedPendingOffer.createdAt).toLocaleString()}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={1.5}>
                {[
                  { icon: <StarsIcon />, value: `${selectedPendingOffer.pointsCost}`, suffix: "pts", label: t("pointsCost"), color: "primary" },
                  { icon: <AttachMoneyIcon />, value: `${selectedPendingOffer.monetaryValue}`, suffix: selectedPendingOffer.currencyCode, label: t("monetaryValue"), color: "success" },
                  { icon: <TimerIcon />, value: `${selectedPendingOffer.offerCodeExpirySeconds}`, suffix: t("offers@seconds"), label: t("offers@codeExpiry"), color: "warning" },
                  { icon: <PeopleIcon />, value: selectedPendingOffer.maxUsesPerUser ?? "∞", suffix: "", label: t("offers@maxUsesPerUser"), color: "error" },
                ].map(({ icon, value, suffix, label, color }) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: `${color}.50`, borderRadius: 2, border: "1px solid", borderColor: `${color}.100`, textAlign: "center" }}>
                      <Box sx={{ color: `${color}.main`, mb: 0.5 }}>{icon}</Box>
                      <Typography variant="h5" fontWeight={800} color={`${color}.dark`}>
                        {value}
                        {suffix && <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>{suffix}</Typography>}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ p: 1, bgcolor: "warning.main", borderRadius: 1.5, display: "flex" }}>
                    <CalendarTodayIcon sx={{ fontSize: 20, color: "white" }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("offers@validPeriod")}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Chip label={new Date(selectedPendingOffer.validFrom).toLocaleDateString()} size="small" variant="outlined" color="warning" />
                      <Typography variant="body2" color="text.secondary">→</Typography>
                      <Chip label={new Date(selectedPendingOffer.validTo).toLocaleDateString()} size="small" variant="outlined" color="warning" />
                    </Stack>
                  </Box>
                  {selectedPendingOffer.maxTotalUses && (
                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("offers@maxTotalUses")}</Typography>
                      <Typography variant="subtitle1" fontWeight={700}>{selectedPendingOffer.maxTotalUses}</Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>

              {selectedPendingOffer.description && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>{t("description")}</Typography>
                  <Typography variant="body1">{selectedPendingOffer.description}</Typography>
                  {selectedPendingOffer.descriptionAr && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} dir="rtl">{selectedPendingOffer.descriptionAr}</Typography>
                  )}
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>

        <Divider sx={{ flexShrink: 0 }} />
        <DialogActions sx={{ px: 3, py: 2, gap: 1, flexShrink: 0 }}>
          <Button onClick={() => setPendingDetailOpen(false)} size="large" sx={{ mr: "auto" }}>{t("close")}</Button>
          {selectedPendingOffer && (
            <>
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<CancelIcon />}
                onClick={() => {
                  setPendingDetailOpen(false);
                  handleRejectClick({} as React.MouseEvent, selectedPendingOffer);
                }}
              >
                {t("offers@reject")}
              </Button>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={approveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                disabled={approveMutation.isPending}
                onClick={() => {
                  setPendingDetailOpen(false);
                  handleApprove({} as React.MouseEvent, selectedPendingOffer);
                }}
              >
                {t("offers@approve")}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          REJECT DIALOG
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => !rejectMutation.isPending && setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box sx={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", px: 3, pt: 2.5, pb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}>
              <WarningAmberIcon sx={{ color: "white" }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} color="white">{t("offers@rejectOffer")}</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>{selectedPendingOffer?.title}</Typography>
            </Box>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            <Alert severity="warning" variant="outlined">
              {t("offers@rejectConfirmation")}: <strong>{selectedPendingOffer?.title}</strong>
            </Alert>
            <TextField
              label={t("offers@rejectReason")}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              multiline
              rows={4}
              required
              fullWidth
              placeholder={t("offers@rejectReasonPlaceholder")}
              disabled={rejectMutation.isPending}
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={rejectMutation.isPending}>{t("cancel")}</Button>
          <Button
            onClick={handleConfirmReject}
            variant="contained"
            color="error"
            size="large"
            disabled={rejectMutation.isPending}
            startIcon={rejectMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <CancelIcon />}
          >
            {t("offers@confirmReject")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          CREATE OFFER DIALOG
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreate}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, display: "flex", flexDirection: "column", maxHeight: "92vh" } }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #0d3276 0%, #1565c0 100%)",
            px: 3, pt: 2.5, pb: 3,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 46, height: 46 }}>
              <AddIcon sx={{ color: "white" }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} color="white">{t("offers@createNew")}</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>{t("offers@createNewSubtitle")}</Typography>
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ py: 3, overflowY: "auto", flex: 1 }}>
          <Stack spacing={3}>
            {/* Basic Info */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 2 }}>
                {t("offers@basicInfo")}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label={t("offers@titleEn")} value={formData.title} onChange={(e) => updateField("title", e.target.value)} required fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label={t("offers@titleAr")} value={formData.titleAr ?? ""} onChange={(e) => updateField("titleAr", e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label={t("offers@descriptionEn")} value={formData.description ?? ""} onChange={(e) => updateField("description", e.target.value)} multiline rows={2} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label={t("offers@descriptionAr")} value={formData.descriptionAr ?? ""} onChange={(e) => updateField("descriptionAr", e.target.value)} multiline rows={2} fullWidth />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Provider Info */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 2 }}>
                {t("offers@providerInfo")}
              </Typography>

              <Stack spacing={2}>
                <ToggleButtonGroup
                  value={formData.providerType}
                  exclusive
                  size="small"
                  onChange={(_, value) => {
                    if (value) {
                      updateField("providerType", value as ProviderType);
                      setSelectedProvider(null);
                      setProviderSearch("");
                      updateField("providerId", 0);
                    }
                  }}
                >
                  <ToggleButton value="ServiceProvider" sx={{ px: 3, gap: 1 }}>
                    <BusinessIcon fontSize="small" />{t("offers@serviceProvider")}
                  </ToggleButton>
                  <ToggleButton value="ChargingPoint" sx={{ px: 3, gap: 1 }}>
                    <EvStationIcon fontSize="small" />{t("offers@chargingPoint")}
                  </ToggleButton>
                </ToggleButtonGroup>

                {selectedProvider && (
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "success.50", border: "1px solid", borderColor: "success.300", borderRadius: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: "success.main" }}>
                        {formData.providerType === "ChargingPoint" ? <EvStationIcon /> : <BusinessIcon />}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("offers@selectedProvider")}</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>{selectedProvider.name}</Typography>
                        {selectedProvider.city && <Typography variant="body2" color="text.secondary">{selectedProvider.city}</Typography>}
                      </Box>
                      <Stack alignItems="flex-end" spacing={0.5}>
                        <Chip label={`ID: ${selectedProvider.id}`} size="small" color="success" />
                        <CheckCircleIcon sx={{ color: "success.main", fontSize: 20 }} />
                      </Stack>
                    </Stack>
                  </Paper>
                )}

                <TextField
                  placeholder={t("offers@searchProviders")}
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  size="small"
                  fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />

                <Paper variant="outlined" sx={{ maxHeight: 220, overflowY: "auto", borderRadius: 2 }}>
                  {isLoadingProviders ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}><CircularProgress size={24} /></Box>
                  ) : filteredProviders.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">{t("offers@noProvidersFound")}</Typography>
                    </Box>
                  ) : (
                    <List dense disablePadding>
                      {filteredProviders.map((provider) => (
                        <ListItemButton
                          key={provider.id}
                          selected={selectedProvider?.id === provider.id}
                          onClick={() => { setSelectedProvider(provider); updateField("providerId", provider.id); }}
                          sx={{
                            borderLeft: selectedProvider?.id === provider.id ? "3px solid" : "3px solid transparent",
                            borderColor: "primary.main",
                            "&.Mui-selected": { bgcolor: "primary.50" },
                            "&.Mui-selected:hover": { bgcolor: "primary.100" },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: selectedProvider?.id === provider.id ? "primary.main" : "grey.300", color: selectedProvider?.id === provider.id ? "white" : "text.secondary" }}>
                              {provider.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={<Typography variant="body2" fontWeight={selectedProvider?.id === provider.id ? 700 : 400}>{provider.name}</Typography>}
                            secondary={provider.city ?? `ID: ${provider.id}`}
                          />
                          <Chip label={`#${provider.id}`} size="small" variant={selectedProvider?.id === provider.id ? "filled" : "outlined"} color={selectedProvider?.id === provider.id ? "primary" : "default"} />
                        </ListItemButton>
                      ))}
                    </List>
                  )}
                </Paper>
              </Stack>
            </Box>

            <Divider />

            {/* Financial Settings */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 2 }}>
                {t("offers@financialSettings")}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label={t("pointsCost")}
                    type="number"
                    value={formData.pointsCost || ""}
                    onChange={(e) => updateField("pointsCost", parseInt(e.target.value) || 0)}
                    InputProps={{ endAdornment: <InputAdornment position="end">pts</InputAdornment> }}
                    helperText={t("offers@pointsCostHelp")}
                    required fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label={t("monetaryValue")}
                    type="number"
                    value={formData.monetaryValue || ""}
                    onChange={(e) => updateField("monetaryValue", parseFloat(e.target.value) || 0)}
                    InputProps={{ endAdornment: <InputAdornment position="end">{formData.currencyCode}</InputAdornment> }}
                    helperText={t("offers@monetaryValueHelp")}
                    required fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label={t("currencyCode")}
                    value={formData.currencyCode}
                    onChange={(e) => updateField("currencyCode", e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Usage Limits */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 2 }}>
                {t("offers@transactionLimits")}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label={t("offers@maxUsesPerUser")}
                    type="number"
                    value={formData.maxUsesPerUser ?? ""}
                    onChange={(e) => updateField("maxUsesPerUser", e.target.value ? parseInt(e.target.value) : null)}
                    helperText={t("offers@leaveEmptyUnlimited")}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label={t("offers@maxTotalUses")}
                    type="number"
                    value={formData.maxTotalUses ?? ""}
                    onChange={(e) => updateField("maxTotalUses", e.target.value ? parseInt(e.target.value) : null)}
                    helperText={t("offers@leaveEmptyUnlimited")}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label={t("offers@codeExpiry")}
                    type="number"
                    value={formData.offerCodeExpirySeconds}
                    onChange={(e) => updateField("offerCodeExpirySeconds", parseInt(e.target.value) || 60)}
                    InputProps={{ endAdornment: <InputAdornment position="end">{t("offers@seconds")}</InputAdornment> }}
                    helperText={t("offers@minExpiry60")}
                    required fullWidth
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Validity Period */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 2 }}>
                {t("offers@validPeriod")}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t("offers@validFrom")}
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => updateField("validFrom", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t("offers@validTo")}
                    type="datetime-local"
                    value={formData.validTo ?? ""}
                    onChange={(e) => updateField("validTo", e.target.value || null)}
                    InputLabelProps={{ shrink: true }}
                    helperText={t("offers@leaveEmptyNoExpiry")}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Image URL */}
            <TextField
              label={t("offers@imageUrl")}
              value={formData.imageUrl ?? ""}
              onChange={(e) => updateField("imageUrl", e.target.value || null)}
              fullWidth
              helperText={t("offers@imageUrlHelp")}
            />
          </Stack>
        </DialogContent>

        <Divider sx={{ flexShrink: 0 }} />
        <DialogActions sx={{ px: 3, py: 2, gap: 1, flexShrink: 0 }}>
          <Button onClick={handleCloseCreate} disabled={createMutation.isPending} size="large">{t("cancel")}</Button>
          <Button
            onClick={handleCreateSubmit}
            variant="contained"
            size="large"
            disabled={createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
          >
            {createMutation.isPending ? t("creating") : t("offers@createOffer")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
