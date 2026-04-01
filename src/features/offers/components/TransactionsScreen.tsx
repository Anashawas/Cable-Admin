import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Stack,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Typography,
  Grid,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Avatar,
  Paper,
  IconButton,
  Tooltip,
  Autocomplete,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import StarsIcon from "@mui/icons-material/Stars";
import TimerIcon from "@mui/icons-material/Timer";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import StoreIcon from "@mui/icons-material/Store";
import EvStationIcon from "@mui/icons-material/EvStation";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PendingIcon from "@mui/icons-material/Pending";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import QrCodeIcon from "@mui/icons-material/QrCode";
import TuneIcon from "@mui/icons-material/Tune";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid } from "../../../components";
import { useProviderTransactions } from "../hooks/use-transactions";
import { getAllChargingPoints } from "../../charge-management/services/charge-management-service";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";
import type { OfferTransactionDto, ProviderType, TransactionStatus } from "../types/api";

interface ProviderOption {
  id: number;
  name: string;
  city?: string | null;
}

// ── Status helpers ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  number,
  { color: "warning" | "success" | "error" | "default"; icon: React.ReactNode; bgColor: string; gradient: string }
> = {
  1: {
    color: "warning",
    icon: <PendingIcon />,
    bgColor: "#fff8e1",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  },
  2: {
    color: "success",
    icon: <CheckCircleOutlineIcon />,
    bgColor: "#e8f5e9",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
  3: {
    color: "error",
    icon: <CancelOutlinedIcon />,
    bgColor: "#fce4ec",
    gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
  },
  4: {
    color: "default",
    icon: <HourglassEmptyIcon />,
    bgColor: "#f5f5f5",
    gradient: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
  },
};

export default function TransactionsScreen() {
  const { t } = useTranslation(["offers", "common"]);

  const [providerType, setProviderType] = useState<ProviderType>("ServiceProvider");
  const [selectedProvider, setSelectedProvider] = useState<ProviderOption | null>(null);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | undefined>(undefined);

  const providerId = selectedProvider?.id ?? 0;

  // ── Provider lists ────────────────────────────────────────────────────────
  const { data: chargingPoints = [], isLoading: loadingCP } = useQuery({
    queryKey: ["charging-points-list"],
    queryFn: ({ signal }) =>
      getAllChargingPoints({ name: null, chargerPointTypeId: null, cityName: null }, signal),
    enabled: providerType === "ChargingPoint",
  });

  const { data: serviceProviders = [], isLoading: loadingSP } = useQuery({
    queryKey: ["service-providers-list"],
    queryFn: () => getAllServiceProviders(),
    enabled: providerType === "ServiceProvider",
  });

  const providerOptions: ProviderOption[] = useMemo(() => {
    if (providerType === "ChargingPoint") {
      return chargingPoints.map((p) => ({ id: p.id, name: p.name ?? `#${p.id}`, city: p.cityName }));
    }
    return serviceProviders.map((p) => ({ id: p.id, name: p.name, city: p.cityName }));
  }, [providerType, chargingPoints, serviceProviders]);

  const isLoadingProviders = providerType === "ChargingPoint" ? loadingCP : loadingSP;

  // ── Transactions ──────────────────────────────────────────────────────────
  const { data, isLoading, search, handleSearchChange, handleRefresh } = useProviderTransactions({
    providerType,
    providerId,
    status: statusFilter,
  });

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<OfferTransactionDto | null>(null);

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return data.slice(start, start + paginationModel.pageSize);
  }, [data, paginationModel]);

  // ── KPI counts ────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const all = data;
    return {
      total: all.length,
      confirmed: all.filter((t) => t.status === 2).length,
      pending: all.filter((t) => t.status === 1).length,
      cancelled: all.filter((t) => t.status === 3).length,
      expired: all.filter((t) => t.status === 4).length,
      totalPts: all.reduce((s, t) => s + (t.pointsDeducted ?? 0), 0),
      totalAmount: all.reduce((s, t) => s + (t.monetaryValue ?? 0), 0),
      currency: all[0]?.currencyCode ?? "JOD",
    };
  }, [data]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleViewDetails = useCallback((e: React.MouseEvent, row: OfferTransactionDto) => {
    e.stopPropagation();
    setSelectedTransaction(row);
    setDetailDialogOpen(true);
  }, []);

  const handleProviderTypeChange = useCallback((type: ProviderType) => {
    setProviderType(type);
    setSelectedProvider(null);
    setStatusFilter(undefined);
  }, []);

  const getStatusLabel = (status: TransactionStatus): string => {
    switch (status) {
      case 1: return t("offers@codeGenerated");
      case 2: return t("offers@confirmed");
      case 3: return t("offers@cancelled");
      case 4: return t("offers@expired");
      default: return t("offers@unknown");
    }
  };

  const getStatusCfg = (status: TransactionStatus) =>
    STATUS_CONFIG[status] ?? STATUS_CONFIG[4];

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: GridColDef<OfferTransactionDto>[] = [
    { field: "id", headerName: t("id"), width: 64, align: "center", headerAlign: "center" },
    {
      field: "offerCode",
      headerName: t("offers@offerCode"),
      width: 160,
      renderCell: (p) => (
        <Chip
          label={p.value}
          size="small"
          icon={<QrCodeIcon />}
          sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem" }}
          variant="outlined"
          color="primary"
        />
      ),
    },
    { field: "offerTitle", headerName: t("offers@offerTitle"), flex: 1, minWidth: 170 },
    { field: "userName", headerName: t("user"), width: 140 },
    {
      field: "pointsDeducted",
      headerName: t("offers@pointsDeducted"),
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (p) =>
        p.value ? (
          <Chip label={`${p.value} pts`} size="small" color="primary" variant="outlined" />
        ) : "-",
    },
    {
      field: "monetaryValue",
      headerName: t("offers@monetaryValue"),
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => (p.value ? `${p.value} ${p.row.currencyCode}` : "-"),
    },
    {
      field: "status",
      headerName: t("status"),
      width: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (p) => {
        const cfg = getStatusCfg(p.value);
        return (
          <Chip
            label={getStatusLabel(p.value)}
            size="small"
            color={cfg.color}
            icon={cfg.icon as any}
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: t("offers@createdAt"),
      width: 155,
      valueFormatter: (v) => new Date(v).toLocaleString(),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 80,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (p) => (
        <Tooltip title={t("viewDetails")}>
          <IconButton size="small" onClick={(e) => handleViewDetails(e, p.row)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppScreenContainer>
      {/* ── Gradient Header ─────────────────────────────────────────────── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0d3276 0%, #1565c0 60%, #1976d2 100%)",
          borderRadius: 3,
          p: 3,
          mb: 3,
          color: "white",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 52, height: 52 }}>
              <ReceiptLongIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                {t("offers@offerTransactions")}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.3 }}>
                {t("offers@offerTransactions_subtitle")}
              </Typography>
            </Box>
          </Stack>
          <Tooltip title={t("refresh")}>
            <IconButton
              onClick={handleRefresh}
              sx={{
                color: "white",
                bgcolor: "rgba(255,255,255,0.1)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* KPI strip — only when provider selected */}
        {providerId > 0 && (
          <Grid container spacing={1.5} sx={{ mt: 2 }}>
            {[
              { label: t("offers@transactions"), value: kpis.total, color: "rgba(255,255,255,0.15)" },
              { label: t("offers@confirmed"), value: kpis.confirmed, color: "rgba(16,185,129,0.3)" },
              { label: t("offers@codeGenerated"), value: kpis.pending, color: "rgba(245,158,11,0.3)" },
              { label: t("offers@cancelled"), value: kpis.cancelled, color: "rgba(239,68,68,0.3)" },
              { label: t("offers@totalPointsDeducted"), value: `${kpis.totalPts} pts`, color: "rgba(255,255,255,0.12)" },
              { label: t("offers@amount"), value: `${kpis.totalAmount.toFixed(2)} ${kpis.currency}`, color: "rgba(255,255,255,0.12)" },
            ].map(({ label, value, color }) => (
              <Grid item xs={6} sm={4} md={2} key={label}>
                <Box
                  sx={{
                    bgcolor: color,
                    borderRadius: 2,
                    p: 1.5,
                    textAlign: "center",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <Typography variant="h6" fontWeight={800} color="white">
                    {value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.2, display: "block" }}>
                    {label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* ── Provider Selector ────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {/* Panel header */}
        <Box sx={{ px: 3, py: 2, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ p: 0.8, bgcolor: "primary.main", borderRadius: 1.5, display: "flex" }}>
              <TuneIcon sx={{ fontSize: 18, color: "white" }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {t("offers@selectProvider")}
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {/* Type toggle */}
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ minWidth: 100 }}>
                {t("offers@providerType")}:
              </Typography>
              <ToggleButtonGroup
                value={providerType}
                exclusive
                onChange={(_, value) => { if (value) handleProviderTypeChange(value as ProviderType); }}
                size="small"
              >
                <ToggleButton value="ServiceProvider" sx={{ px: 2.5, gap: 1 }}>
                  <StoreIcon fontSize="small" />
                  {t("offers@serviceProvider")}
                </ToggleButton>
                <ToggleButton value="ChargingPoint" sx={{ px: 2.5, gap: 1 }}>
                  <EvStationIcon fontSize="small" />
                  {t("offers@chargingPoint")}
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {/* Autocomplete */}
            <Stack direction="row" spacing={2} alignItems="flex-start" flexWrap="wrap">
              <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ minWidth: 100, pt: 1.2 }}>
                {t("offers@provider")}:
              </Typography>
              <Autocomplete
                size="small"
                sx={{ flex: 1, minWidth: 260, maxWidth: 480 }}
                options={providerOptions}
                getOptionLabel={(o) => `${o.name} (#${o.id})`}
                value={selectedProvider}
                onChange={(_, value) => {
                  setSelectedProvider(value);
                  setStatusFilter(undefined);
                }}
                loading={isLoadingProviders}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={
                      isLoadingProviders
                        ? t("loading")
                        : providerType === "ChargingPoint"
                        ? t("offers@chargingPoint")
                        : t("offers@serviceProvider")
                    }
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          {providerType === "ChargingPoint" ? (
                            <EvStationIcon fontSize="small" color="action" />
                          ) : (
                            <StoreIcon fontSize="small" color="action" />
                          )}
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {isLoadingProviders ? <CircularProgress size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: 12,
                          bgcolor: providerType === "ChargingPoint" ? "primary.100" : "secondary.100",
                          color: providerType === "ChargingPoint" ? "primary.dark" : "secondary.dark",
                        }}
                      >
                        {providerType === "ChargingPoint" ? (
                          <EvStationIcon sx={{ fontSize: 16 }} />
                        ) : (
                          <StoreIcon sx={{ fontSize: 16 }} />
                        )}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.city ? `${option.city} · ` : ""}ID #{option.id}
                        </Typography>
                      </Box>
                    </Stack>
                  </li>
                )}
                noOptionsText={isLoadingProviders ? t("loading") : t("noResultsFound")}
              />
            </Stack>

            {/* Selected provider preview */}
            {selectedProvider && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: "primary.50",
                  border: "1px solid",
                  borderColor: "primary.200",
                  borderRadius: 2,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: providerType === "ChargingPoint" ? "primary.main" : "secondary.main",
                      width: 44,
                      height: 44,
                    }}
                  >
                    {providerType === "ChargingPoint" ? <EvStationIcon /> : <StoreIcon />}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t("offers@selectProvider")}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {selectedProvider.name}
                    </Typography>
                    {selectedProvider.city && (
                      <Typography variant="body2" color="text.secondary">{selectedProvider.city}</Typography>
                    )}
                  </Box>
                  <Stack alignItems="flex-end" spacing={0.5}>
                    <Chip
                      label={providerType === "ChargingPoint" ? t("offers@chargingPoint") : t("offers@serviceProvider")}
                      size="small"
                      color={providerType === "ChargingPoint" ? "primary" : "secondary"}
                      variant="outlined"
                    />
                    <Chip label={`ID: ${selectedProvider.id}`} size="small" color="primary" />
                  </Stack>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Box>
      </Paper>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!providerId && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "2px dashed",
            borderColor: "grey.200",
            p: 6,
            textAlign: "center",
          }}
        >
          <Avatar sx={{ bgcolor: "grey.100", width: 72, height: 72, mx: "auto", mb: 2 }}>
            <ReceiptLongIcon sx={{ fontSize: 36, color: "grey.400" }} />
          </Avatar>
          <Typography variant="h6" fontWeight={700} color="text.secondary" gutterBottom>
            {t("offers@selectProvider")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: "auto" }}>
            {t("offers@transactions_selectProviderHint")}
          </Typography>
        </Paper>
      )}

      {/* ── Transactions list ──────────────────────────────────────────────── */}
      {providerId > 0 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
          {/* Toolbar */}
          <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
            <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
              <TextField
                size="small"
                placeholder={t("offers@searchTransactions")}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                sx={{ minWidth: 240 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Status filter chips */}
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {[
                  { value: undefined, label: t("all") },
                  { value: 1, label: t("offers@codeGenerated"), color: "warning" as const },
                  { value: 2, label: t("offers@confirmed"), color: "success" as const },
                  { value: 3, label: t("offers@cancelled"), color: "error" as const },
                  { value: 4, label: t("offers@expired"), color: "default" as const },
                ].map(({ value, label, color }) => (
                  <Chip
                    key={String(value)}
                    label={label}
                    size="small"
                    color={
                      (statusFilter === value || (value === undefined && statusFilter === undefined))
                        ? color ?? "primary"
                        : "default"
                    }
                    variant={
                      (statusFilter === value || (value === undefined && statusFilter === undefined))
                        ? "filled"
                        : "outlined"
                    }
                    onClick={() => setStatusFilter(value as TransactionStatus | undefined)}
                    sx={{ cursor: "pointer", fontWeight: 600 }}
                  />
                ))}
              </Stack>

              <Box sx={{ ml: "auto" }}>
                <Chip
                  label={`${data.length} ${t("offers@transactions")}`}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Stack>
          </Box>

          <AppDataGrid
            data={paginatedData}
            columns={columns}
            loading={isLoading}
            disablePagination={false}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            total={data.length}
          />
        </Paper>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TRANSACTION DETAIL DIALOG
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, display: "flex", flexDirection: "column", maxHeight: "90vh" } }}
      >
        {/* Status-colored gradient header */}
        {selectedTransaction && (
          <Box
            sx={{
              background: getStatusCfg(selectedTransaction.status).gradient,
              px: 3,
              pt: 3,
              pb: 4,
              flexShrink: 0,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.25)", width: 52, height: 52 }}>
                <QrCodeIcon sx={{ color: "white", fontSize: 28 }} />
              </Avatar>
              <Box flex={1}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                  {t("offers@offerCode")}
                </Typography>
                <Typography
                  variant="h4"
                  fontWeight={900}
                  fontFamily="monospace"
                  color="white"
                  sx={{ letterSpacing: 2, lineHeight: 1.2 }}
                >
                  {selectedTransaction.offerCode}
                </Typography>
                <Chip
                  label={getStatusLabel(selectedTransaction.status)}
                  size="small"
                  sx={{ mt: 1, bgcolor: "rgba(255,255,255,0.25)", color: "white", fontWeight: 700 }}
                />
              </Box>
            </Stack>
          </Box>
        )}

        <DialogContent sx={{ py: 3, overflowY: "auto", flex: 1 }}>
          {selectedTransaction && (
            <Stack spacing={2.5}>
              {/* User + Offer row */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, height: "100%" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: "secondary.main", width: 40, height: 40 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("user")}</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>{selectedTransaction.userName}</Typography>
                        <Typography variant="caption" color="text.secondary">ID #{selectedTransaction.userId}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "info.50", borderRadius: 2, height: "100%" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: "info.main", width: 40, height: 40 }}>
                        <LocalOfferIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("offers@offerTitle")}</Typography>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                          {selectedTransaction.offerTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">ID #{selectedTransaction.providerOfferId}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {/* Stats */}
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "primary.50", borderRadius: 2, border: "1px solid", borderColor: "primary.100", textAlign: "center" }}>
                    <StarsIcon sx={{ fontSize: 28, color: "primary.main", mb: 0.5 }} />
                    <Typography variant="h5" fontWeight={800} color="primary.dark">
                      {selectedTransaction.pointsDeducted}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("offers@pointsDeducted")}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "success.50", borderRadius: 2, border: "1px solid", borderColor: "success.100", textAlign: "center" }}>
                    <AttachMoneyIcon sx={{ fontSize: 28, color: "success.main", mb: 0.5 }} />
                    <Typography variant="h5" fontWeight={800} color="success.dark">
                      {selectedTransaction.monetaryValue}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>{selectedTransaction.currencyCode}</Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("offers@monetaryValue")}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Timeline */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 1.5 }}>
                  {t("offers@timeline") ?? "Timeline"}
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 0.8, bgcolor: "primary.main", borderRadius: 1.5, display: "flex" }}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: "white" }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("offers@createdAt")}</Typography>
                      <Typography variant="body2" fontWeight={600}>{new Date(selectedTransaction.createdAt).toLocaleString()}</Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 0.8, bgcolor: "warning.main", borderRadius: 1.5, display: "flex" }}>
                      <TimerIcon sx={{ fontSize: 16, color: "white" }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("offers@codeExpiry")}</Typography>
                      <Typography variant="body2" fontWeight={600}>{new Date(selectedTransaction.codeExpiresAt).toLocaleString()}</Typography>
                    </Box>
                  </Stack>

                  {selectedTransaction.completedAt && (
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ p: 0.8, bgcolor: "success.main", borderRadius: 1.5, display: "flex" }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 16, color: "white" }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("offers@completedAt")}</Typography>
                        <Typography variant="body2" fontWeight={600}>{new Date(selectedTransaction.completedAt).toLocaleString()}</Typography>
                      </Box>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Stack>
          )}
        </DialogContent>

        <Divider sx={{ flexShrink: 0 }} />
        <DialogActions sx={{ px: 3, py: 2, flexShrink: 0 }}>
          <Button onClick={() => setDetailDialogOpen(false)} size="large" variant="outlined">
            {t("close")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
