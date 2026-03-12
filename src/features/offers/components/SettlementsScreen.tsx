import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Grid,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Avatar,
  Divider,
  Paper,
  InputAdornment,
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PaymentsIcon from "@mui/icons-material/Payments";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import StoreIcon from "@mui/icons-material/Store";
import StarsIcon from "@mui/icons-material/Stars";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  useSettlements,
  useSettlementSummary,
  useUpdateSettlementStatus,
  useGenerateSettlement,
} from "../hooks/use-settlements";
import type { ProviderSettlementDto, SettlementStatus } from "../types/api";

const STATUS_CFG: Record<number, { label_key: string; color: "warning" | "info" | "success" | "error" }> = {
  1: { label_key: "pending", color: "warning" },
  2: { label_key: "invoiced", color: "info" },
  3: { label_key: "paid", color: "success" },
  4: { label_key: "disputed", color: "error" },
};

export default function SettlementsScreen() {
  const { t, i18n } = useTranslation(["offers", "common"]);
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(currentMonth);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);

  // Fetch without status — we filter client-side so we can show per-status counts
  const { data: rawData, isLoading, search, handleSearchChange, handleRefresh } = useSettlements({
    year: selectedYear,
    month: selectedMonth,
  });

  const data = useMemo(() => {
    if (!statusFilter) return rawData;
    return rawData.filter((s) => s.settlementStatus === statusFilter);
  }, [rawData, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    rawData.forEach((s) => { counts[s.settlementStatus] = (counts[s.settlementStatus] ?? 0) + 1; });
    return counts;
  }, [rawData]);

  const { data: summary, isLoading: summaryLoading } = useSettlementSummary(selectedYear, selectedMonth);
  const updateStatusMutation = useUpdateSettlementStatus();
  const generateSettlementMutation = useGenerateSettlement();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<ProviderSettlementDto | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<SettlementStatus>(2);
  const [paidAmount, setPaidAmount] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateYear, setGenerateYear] = useState(currentYear);
  const [generateMonth, setGenerateMonth] = useState(currentMonth);

  const monthNames = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Date(2000, i, 1).toLocaleString(i18n.language === "ar" ? "ar-KW" : "en-US", { month: "long" })
      ),
    [i18n.language]
  );

  const monthAbbr = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Date(2000, i, 1).toLocaleString(i18n.language === "ar" ? "ar-KW" : "en-US", { month: "short" })
      ),
    [i18n.language]
  );

  const periodLabel = useMemo(
    () => (selectedMonth ? `${monthNames[selectedMonth - 1]} ${selectedYear}` : String(selectedYear)),
    [selectedMonth, selectedYear, monthNames]
  );

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return data.slice(start, start + paginationModel.pageSize);
  }, [data, paginationModel.page, paginationModel.pageSize]);

  const handleViewDetails = useCallback((e: React.MouseEvent, row: ProviderSettlementDto) => {
    e.stopPropagation();
    setSelectedSettlement(row);
    setDetailDialogOpen(true);
  }, []);

  const handleUpdateStatusClick = useCallback((e: React.MouseEvent, row: ProviderSettlementDto) => {
    e.stopPropagation();
    setSelectedSettlement(row);
    setNewStatus(row.settlementStatus === 1 ? 2 : 3);
    setPaidAmount(row.totalCommissionAmount.toString());
    setAdminNote("");
    setStatusDialogOpen(true);
  }, []);

  const handleConfirmStatusUpdate = useCallback(() => {
    if (!selectedSettlement) return;
    updateStatusMutation.mutate(
      {
        id: selectedSettlement.id,
        data: {
          status: newStatus,
          paidAmount: newStatus === 3 ? parseFloat(paidAmount) : undefined,
          note: adminNote || undefined,
        },
      },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("offers@settlements_statusUpdated") });
          setStatusDialogOpen(false);
          setSelectedSettlement(null);
        },
        onError: (err: Error) => { openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }); },
      }
    );
  }, [selectedSettlement, newStatus, paidAmount, adminNote, updateStatusMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleGenerateSettlement = useCallback(() => {
    generateSettlementMutation.mutate(
      { year: generateYear, month: generateMonth },
      {
        onSuccess: (count) => {
          openSuccessSnackbar({
            message: t("offers@settlements_generateSuccess", {
              year: generateYear,
              month: String(generateMonth).padStart(2, "0"),
              count,
            }),
          });
          setGenerateDialogOpen(false);
          setSelectedYear(generateYear);
          setSelectedMonth(generateMonth);
        },
        onError: (err: Error) => { openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }); },
      }
    );
  }, [generateYear, generateMonth, generateSettlementMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const getStatusChip = (status: SettlementStatus) => {
    const cfg = STATUS_CFG[status];
    return (
      <Chip
        label={t(`offers@${cfg.label_key}`)}
        color={cfg.color}
        size="small"
        variant="filled"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  const formatDate = (val: string | null) =>
    val
      ? new Date(val).toLocaleDateString(i18n.language === "ar" ? "ar-KW" : "en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const columns: GridColDef<ProviderSettlementDto>[] = [
    { field: "id", headerName: t("id"), width: 60, align: "center", headerAlign: "center" },
    {
      field: "providerOwnerName",
      headerName: t("offers@provider"),
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.main", fontSize: "0.75rem" }}>
            {(params.value as string)?.[0]?.toUpperCase() ?? "?"}
          </Avatar>
          <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
        </Stack>
      ),
    },
    {
      field: "providerType",
      headerName: t("offers@type"),
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value === "ChargingPoint" ? t("offers@chargingPoint") : t("offers@serviceProvider")}
          size="small"
          variant="outlined"
          color={params.value === "ChargingPoint" ? "primary" : "secondary"}
        />
      ),
    },
    {
      field: "period",
      headerName: t("offers@period"),
      width: 110,
      valueGetter: (_value: unknown, row: ProviderSettlementDto) =>
        `${row.periodYear}-${String(row.periodMonth).padStart(2, "0")}`,
      renderCell: (params) => (
        <Chip label={params.value} size="small" sx={{ fontWeight: 600, bgcolor: "grey.100" }} />
      ),
    },
    {
      field: "totalTransactions",
      headerName: t("offers@transactions"),
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" fontWeight={700}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">{t("offers@transactions")}</Typography>
        </Box>
      ),
    },
    {
      field: "totalTransactionAmount",
      headerName: t("offers@totalAmount"),
      width: 140,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="body2" fontWeight={600} color="info.main">
            {(params.value ?? 0).toFixed(3)}
          </Typography>
          <Typography variant="caption" color="text.secondary">KWD</Typography>
        </Box>
      ),
    },
    {
      field: "totalCommissionAmount",
      headerName: t("offers@commission"),
      width: 130,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="body2" fontWeight={700} color="success.main">
            {(params.value ?? 0).toFixed(3)}
          </Typography>
          <Typography variant="caption" color="text.secondary">KWD</Typography>
        </Box>
      ),
    },
    {
      field: "paidAmount",
      headerName: t("offers@paidAmount"),
      width: 120,
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        params.value != null ? (
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body2" fontWeight={600} color="primary.main">
              {(params.value as number).toFixed(3)}
            </Typography>
            <Typography variant="caption" color="text.secondary">KWD</Typography>
          </Box>
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        ),
    },
    {
      field: "totalPointsAwarded",
      headerName: t("offers@pointsAwarded"),
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
          <StarsIcon sx={{ fontSize: 14, color: "warning.main" }} />
          <Typography variant="body2" fontWeight={600}>{params.value ?? 0}</Typography>
        </Stack>
      ),
    },
    {
      field: "settlementStatus",
      headerName: t("status"),
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 90,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <Tooltip title={t("offers@viewDetails")}>
            <IconButton size="small" onClick={(e) => handleViewDetails(e, params.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.settlementStatus !== 3 && (
            <Tooltip title={t("offers@updateStatus")}>
              <IconButton size="small" color="primary" onClick={(e) => handleUpdateStatusClick(e, params.row)}>
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const kpiCards = summary
    ? [
        { label: t("offers@totalSettlements"), value: summary.totalSettlements, sub: null, icon: <ReceiptLongIcon /> },
        { label: t("offers@pending"), value: summary.pendingCount, sub: `${summary.invoicedCount} ${t("offers@invoiced")}`, icon: <PendingActionsIcon /> },
        { label: t("offers@paid"), value: summary.paidCount, sub: summary.disputedCount > 0 ? `${summary.disputedCount} ${t("offers@disputed")}` : null, icon: <PaymentsIcon /> },
        { label: t("offers@totalAmount"), value: `${(summary.totalTransactionAmount ?? 0).toFixed(3)}`, sub: "KWD", icon: <AttachMoneyIcon /> },
        { label: t("offers@totalCommission"), value: `${(summary.totalCommissionAmount ?? 0).toFixed(3)}`, sub: "KWD", icon: <AccountBalanceIcon /> },
      ]
    : [];

  return (
    <AppScreenContainer>
      {/* ── Gradient Banner ── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
          borderRadius: 3,
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          position: "relative",
          overflow: "hidden",
          color: "white",
        }}
      >
        <Box sx={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "flex-start" }} spacing={2} sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AccountBalanceIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} color="white" lineHeight={1.2}>{t("offers@settlements")}</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5 }}>{t("offers@settlements_subtitle")}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              size="small"
              sx={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)", borderColor: "white" } }}
            >
              {t("refresh")}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setGenerateDialogOpen(true)}
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, fontWeight: 700, boxShadow: "none" }}
            >
              {t("offers@settlements_generate")}
            </Button>
          </Stack>
        </Stack>

        {/* KPI Cards — skeleton when loading */}
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          {summaryLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Box
                  key={i}
                  sx={{ background: "rgba(255,255,255,0.08)", borderRadius: 2, px: 2, py: 1.5, minWidth: 120, flex: "1 1 auto", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <Box sx={{ width: 70, height: 11, borderRadius: 1, bgcolor: "rgba(255,255,255,0.15)", mb: 1 }} />
                  <Box sx={{ width: 44, height: 22, borderRadius: 1, bgcolor: "rgba(255,255,255,0.2)" }} />
                </Box>
              ))
            : kpiCards.map((card) => (
                <Box
                  key={card.label}
                  sx={{ background: "rgba(255,255,255,0.13)", borderRadius: 2, px: 2, py: 1.5, minWidth: 120, flex: "1 1 auto", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Box sx={{ opacity: 0.75, display: "flex", fontSize: 16 }}>{card.icon}</Box>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{card.label}</Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={800} color="white" lineHeight={1}>{card.value}</Typography>
                  {card.sub && <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>{card.sub}</Typography>}
                </Box>
              ))}
        </Stack>
      </Box>

      {/* ── Filter Panel ── */}
      <Paper elevation={1} sx={{ borderRadius: 2, mb: 2, overflow: "hidden" }}>
        {/* Row 1: label + search */}
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <FilterListIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={700} color="text.secondary">{t("filter", { ns: "common" })}</Typography>
            </Stack>
            <TextField
              size="small"
              placeholder={t("search")}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              sx={{ width: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </Box>

        {/* Row 2: Year + Month chips */}
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
              <CalendarMonthIcon fontSize="small" color="action" />
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                {t("offers@year")}
              </Typography>
              <Stack direction="row" spacing={0.5}>
                {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                  <Chip
                    key={year}
                    label={year}
                    size="small"
                    onClick={() => setSelectedYear(year)}
                    color={selectedYear === year ? "primary" : "default"}
                    variant={selectedYear === year ? "filled" : "outlined"}
                    sx={{ fontWeight: 700 }}
                  />
                ))}
              </Stack>
            </Stack>

            <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: "center" }} />

            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0 }}>
              {t("offers@month")}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              <Chip
                label={t("all")}
                size="small"
                onClick={() => setSelectedMonth(undefined)}
                color={selectedMonth === undefined ? "primary" : "default"}
                variant={selectedMonth === undefined ? "filled" : "outlined"}
                sx={{ fontWeight: 700 }}
              />
              {monthAbbr.map((name, i) => (
                <Chip
                  key={i + 1}
                  label={name}
                  size="small"
                  onClick={() => setSelectedMonth(i + 1)}
                  color={selectedMonth === i + 1 ? "primary" : "default"}
                  variant={selectedMonth === i + 1 ? "filled" : "outlined"}
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Box>
          </Stack>
        </Box>

        {/* Row 3: Status filter chips with counts */}
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0 }}>
              {t("status")}:
            </Typography>
            <Chip
              label={`${t("all")} (${rawData.length})`}
              size="small"
              onClick={() => setStatusFilter(undefined)}
              color={statusFilter === undefined ? "primary" : "default"}
              variant={statusFilter === undefined ? "filled" : "outlined"}
              sx={{ fontWeight: 700 }}
            />
            {([1, 2, 3, 4] as SettlementStatus[]).map((s) => {
              const cfg = STATUS_CFG[s];
              const count = statusCounts[s] ?? 0;
              return (
                <Chip
                  key={s}
                  label={`${t(`offers@${cfg.label_key}`)} (${count})`}
                  size="small"
                  onClick={() => setStatusFilter(statusFilter === s ? undefined : s)}
                  color={statusFilter === s ? cfg.color : "default"}
                  variant={statusFilter === s ? "filled" : "outlined"}
                  sx={{ fontWeight: 600 }}
                />
              );
            })}
          </Stack>
        </Box>
      </Paper>

      {/* ── Data Grid Card ── */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
        {/* Toolbar */}
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <ReceiptLongIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={700}>{t("offers@settlements")}</Typography>
              {!isLoading && (
                <Chip
                  label={data.length}
                  size="small"
                  sx={{ height: 20, "& .MuiChip-label": { px: 1, fontSize: "0.7rem", fontWeight: 700 } }}
                />
              )}
            </Stack>
            <Chip
              icon={<CalendarMonthIcon sx={{ fontSize: "14px !important" }} />}
              label={periodLabel}
              size="small"
              sx={{ bgcolor: "primary.50", color: "primary.dark", fontWeight: 600, border: "1px solid", borderColor: "primary.200" }}
            />
          </Stack>
        </Box>

        {/* Empty state */}
        {!isLoading && data.length === 0 ? (
          <Box sx={{ py: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed",
                borderColor: "primary.200",
              }}
            >
              <AccountBalanceIcon sx={{ fontSize: 38, color: "primary.300" }} />
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h6" fontWeight={700} color="text.secondary" gutterBottom>
                {t("offers@settlements_emptyTitle")}
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 380, mx: "auto" }}>
                {t("offers@settlements_emptyHint")}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setGenerateDialogOpen(true)}
              color="primary"
              sx={{ mt: 1 }}
            >
              {t("offers@settlements_generate")}
            </Button>
          </Box>
        ) : (
          <AppDataGrid
            data={paginatedData}
            columns={columns}
            loading={isLoading}
            disablePagination={false}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            total={data.length}
          />
        )}
      </Paper>

      {/* ── Detail Dialog ── */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" } }}
      >
        <Box sx={{ background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)", p: 3, color: "white", position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <Box sx={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ReceiptLongIcon sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} color="white">{t("offers@settlementDetails")}</Typography>
                {selectedSettlement && (
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>
                    {selectedSettlement.providerOwnerName} · {selectedSettlement.periodYear}-{String(selectedSettlement.periodMonth).padStart(2, "0")}
                  </Typography>
                )}
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setDetailDialogOpen(false)} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.1)" } }}>
              <CloseIcon />
            </IconButton>
          </Stack>
          {selectedSettlement && (
            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
              {[
                { label: t("offers@totalTransactions"), value: selectedSettlement.totalTransactions },
                { label: t("offers@totalAmount"), value: `${(selectedSettlement.totalTransactionAmount ?? 0).toFixed(3)} KWD` },
                { label: t("offers@commission"), value: `${(selectedSettlement.totalCommissionAmount ?? 0).toFixed(3)} KWD` },
                ...(selectedSettlement.paidAmount != null ? [{ label: t("offers@paidAmount"), value: `${selectedSettlement.paidAmount.toFixed(3)} KWD` }] : []),
              ].map(({ label, value }) => (
                <Box key={label} sx={{ background: "rgba(255,255,255,0.13)", borderRadius: 1.5, px: 1.5, py: 1, border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", display: "block" }}>{label}</Typography>
                  <Typography variant="subtitle2" fontWeight={700} color="white">{value}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        <DialogContent sx={{ p: 3, overflowY: "auto", flex: 1 }}>
          {selectedSettlement && (
            <Stack spacing={2.5}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
                    <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}>
                      <StoreIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="overline" color="text.secondary" lineHeight={1}>{t("offers@provider")}</Typography>
                      <Typography variant="subtitle1" fontWeight={700}>{selectedSettlement.providerOwnerName}</Typography>
                      <Chip
                        label={selectedSettlement.providerType === "ChargingPoint" ? t("offers@chargingPoint") : t("offers@serviceProvider")}
                        size="small"
                        variant="outlined"
                        color={selectedSettlement.providerType === "ChargingPoint" ? "primary" : "secondary"}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Stack>
                  <Stack alignItems={{ sm: "flex-end" }} spacing={0.5}>
                    {getStatusChip(selectedSettlement.settlementStatus)}
                    <Typography variant="caption" color="text.secondary">ID #{selectedSettlement.id}</Typography>
                  </Stack>
                </Stack>
              </Paper>

              <Grid container spacing={1.5}>
                {[
                  { label: t("offers@totalTransactions"), value: selectedSettlement.totalTransactions, icon: <ReceiptLongIcon />, bg: "#e3f2fd", color: "primary.dark" },
                  { label: t("offers@totalAmount"), value: `${(selectedSettlement.totalTransactionAmount ?? 0).toFixed(3)} KWD`, icon: <AttachMoneyIcon />, bg: "#e8f5e9", color: "success.dark" },
                  { label: t("offers@commission"), value: `${(selectedSettlement.totalCommissionAmount ?? 0).toFixed(3)} KWD`, icon: <PaymentsIcon />, bg: "#f3e5f5", color: "secondary.dark" },
                  { label: t("offers@paidAmount"), value: selectedSettlement.paidAmount != null ? `${selectedSettlement.paidAmount.toFixed(3)} KWD` : "—", icon: <AccountBalanceIcon />, bg: "#fff8e1", color: "warning.dark" },
                  { label: t("offers@pointsAwarded"), value: selectedSettlement.totalPointsAwarded, icon: <StarsIcon />, bg: "#fff3e0", color: "orange" },
                  { label: t("offers@totalPointsDeducted"), value: selectedSettlement.totalPointsDeducted, icon: <StarsIcon />, bg: "#fce4ec", color: "error.dark" },
                ].map(({ label, value, icon, bg, color }) => (
                  <Grid size={{ xs: 6, sm: 4 }} key={label}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: bg, borderRadius: 2, height: "100%" }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Box sx={{ color, display: "flex", fontSize: 16 }}>{icon}</Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>{label}</Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={700} color={color}>{value}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 1.5 }}>
                  {t("offers@settlements_timeline")}
                </Typography>
                <Grid container spacing={1.5}>
                  {[
                    { label: t("offers@createdAt"), value: formatDate(selectedSettlement.createdAt) },
                    { label: t("offers@invoicedAt"), value: formatDate(selectedSettlement.invoicedAt) },
                    { label: t("offers@paidAt"), value: formatDate(selectedSettlement.paidAt) },
                  ].map(({ label, value }) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={label}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarMonthIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="body2" fontWeight={600}>{value}</Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {selectedSettlement.adminNote && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, borderLeft: "4px solid", borderColor: "warning.main" }}>
                  <Typography variant="overline" color="warning.dark" fontWeight={700} display="block" sx={{ mb: 0.5 }}>{t("offers@adminNote")}</Typography>
                  <Typography variant="body2">{selectedSettlement.adminNote}</Typography>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <Divider sx={{ flexShrink: 0 }} />
        <DialogActions sx={{ px: 3, py: 2, gap: 1, flexShrink: 0 }}>
          {selectedSettlement && selectedSettlement.settlementStatus !== 3 && (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={(e) => { setDetailDialogOpen(false); handleUpdateStatusClick(e, selectedSettlement); }}
              sx={{ background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)", fontWeight: 700 }}
            >
              {t("offers@updateStatus")}
            </Button>
          )}
          <Button onClick={() => setDetailDialogOpen(false)} size="large" variant="outlined">
            {t("close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Status Update Dialog ── */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <Box sx={{ background: "linear-gradient(135deg, #e65100 0%, #f57c00 100%)", p: 2.5, color: "white" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <EditIcon />
              </Box>
              <Typography variant="h6" fontWeight={700} color="white">{t("offers@updateSettlementStatus")}</Typography>
            </Stack>
            <IconButton size="small" onClick={() => setStatusDialogOpen(false)} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white" } }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
        <Divider />
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t("offers@newStatus")}</InputLabel>
              <Select
                value={newStatus}
                label={t("offers@newStatus")}
                onChange={(e) => setNewStatus(e.target.value as SettlementStatus)}
              >
                <MenuItem value={2}>{t("offers@invoiced")}</MenuItem>
                <MenuItem value={3}>{t("offers@paid")}</MenuItem>
                <MenuItem value={4}>{t("offers@disputed")}</MenuItem>
              </Select>
            </FormControl>

            {newStatus === 3 && (
              <TextField
                label={t("offers@paidAmount")}
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">KWD</InputAdornment> }}
              />
            )}

            <TextField
              label={t("offers@note")}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ gap: 1, px: 3, py: 2 }}>
          <Button onClick={() => setStatusDialogOpen(false)} size="large">
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirmStatusUpdate}
            variant="contained"
            size="large"
            disabled={updateStatusMutation.isPending}
            startIcon={
              updateStatusMutation.isPending
                ? <CircularProgress size={20} color="inherit" />
                : <CheckCircleIcon />
            }
          >
            {updateStatusMutation.isPending ? t("updating") : t("update")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Generate Settlement Dialog ── */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <Box sx={{ background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)", p: 2.5, color: "white" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AddCircleOutlineIcon />
              </Box>
              <Typography variant="h6" fontWeight={700} color="white">{t("offers@settlements_generateTitle")}</Typography>
            </Stack>
            <IconButton size="small" onClick={() => setGenerateDialogOpen(false)} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white" } }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
        <Divider />
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t("offers@year")}</InputLabel>
              <Select
                value={generateYear}
                label={t("offers@year")}
                onChange={(e) => setGenerateYear(Number(e.target.value))}
              >
                {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>{t("offers@month")}</InputLabel>
              <Select
                value={generateMonth}
                label={t("offers@month")}
                onChange={(e) => setGenerateMonth(Number(e.target.value))}
              >
                {monthNames.map((name, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Paper elevation={0} sx={{ p: 2, bgcolor: "success.50", borderRadius: 2, border: "1px solid", borderColor: "success.200" }}>
              <Typography variant="body2" color="success.dark">
                {t("offers@settlements_generateHint")}
              </Typography>
            </Paper>
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ gap: 1, px: 3, py: 2 }}>
          <Button onClick={() => setGenerateDialogOpen(false)} size="large">
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            color="success"
            size="large"
            onClick={handleGenerateSettlement}
            disabled={generateSettlementMutation.isPending}
            startIcon={
              generateSettlementMutation.isPending
                ? <CircularProgress size={20} color="inherit" />
                : <AddCircleOutlineIcon />
            }
          >
            {generateSettlementMutation.isPending ? t("generating") : t("offers@settlements_generate")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
