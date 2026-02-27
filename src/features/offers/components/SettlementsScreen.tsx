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
  Card,
  CardContent,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Avatar,
  Divider,
  Paper,
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
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
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  useSettlements,
  useSettlementSummary,
  useUpdateSettlementStatus,
  useGenerateSettlement,
} from "../hooks/use-settlements";
import type { ProviderSettlementDto, SettlementStatus } from "../types/api";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

export default function SettlementsScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(currentMonth);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);

  const {
    data,
    isLoading,
    search,
    handleSearchChange,
    handleRefresh,
  } = useSettlements({
    year: selectedYear,
    month: selectedMonth,
    status: statusFilter,
  });

  const { data: summary } = useSettlementSummary(selectedYear, selectedMonth);
  const updateStatusMutation = useUpdateSettlementStatus();
  const generateSettlementMutation = useGenerateSettlement();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<ProviderSettlementDto | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<SettlementStatus>(2);
  const [paidAmount, setPaidAmount] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateYear, setGenerateYear] = useState(currentYear);
  const [generateMonth, setGenerateMonth] = useState(currentMonth);

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
    setNewStatus(row.settlementStatus === 1 ? 2 : 3); // If Pending → Invoiced, else → Paid
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
          openSuccessSnackbar({ message: t("settlements@statusUpdated") });
          setStatusDialogOpen(false);
          setSelectedSettlement(null);
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      }
    );
  }, [selectedSettlement, newStatus, paidAmount, adminNote, updateStatusMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleGenerateSettlement = useCallback(() => {
    generateSettlementMutation.mutate(
      { year: generateYear, month: generateMonth },
      {
        onSuccess: (count) => {
          openSuccessSnackbar({
            message: t("settlements@generateSuccess", "Settlement generated for {{year}}-{{month}}. {{count}} records.", {
              year: generateYear,
              month: String(generateMonth).padStart(2, "0"),
              count,
            }),
          });
          setGenerateDialogOpen(false);
          setSelectedYear(generateYear);
          setSelectedMonth(generateMonth);
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      }
    );
  }, [generateYear, generateMonth, generateSettlementMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const getStatusChip = (status: SettlementStatus) => {
    const statusMap = {
      1: { label: t("pending"), color: "warning" as const },
      2: { label: t("invoiced"), color: "info" as const },
      3: { label: t("paid"), color: "success" as const },
      4: { label: t("disputed"), color: "error" as const },
    };
    const config = statusMap[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const columns: GridColDef<ProviderSettlementDto>[] = [
    {
      field: "id",
      headerName: t("id"),
      width: 70,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "providerOwnerName",
      headerName: t("provider"),
      flex: 1,
      minWidth: 180,
    },
    {
      field: "providerType",
      headerName: t("type"),
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value === "ChargingPoint" ? t("chargingPoint") : t("serviceProvider")}
          size="small"
        />
      ),
    },
    {
      field: "period",
      headerName: t("period"),
      width: 120,
      valueGetter: (value, row) => `${row.periodYear}-${String(row.periodMonth).padStart(2, "0")}`,
    },
    {
      field: "totalTransactions",
      headerName: t("transactions"),
      width: 120,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "totalCommissionAmount",
      headerName: t("commission"),
      width: 130,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => `${params.value.toFixed(3)} KWD`,
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
      width: 140,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t("viewDetails")}>
            <IconButton size="small" onClick={(e) => handleViewDetails(e, params.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.settlementStatus !== 3 && (
            <Tooltip title={t("updateStatus")}>
              <IconButton size="small" color="primary" onClick={(e) => handleUpdateStatusClick(e, params.row)}>
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const headerActions: ScreenHeaderAction[] = [
    {
      id: "generate",
      label: t("settlements@generate"),
      icon: <AddCircleOutlineIcon />,
      onClick: () => setGenerateDialogOpen(true),
    },
    {
      id: "refresh",
      label: t("refresh"),
      icon: <RefreshIcon />,
      onClick: handleRefresh,
    },
  ];

  return (
    <AppScreenContainer>
      <ScreenHeader
        icon={<AccountBalanceIcon />}
        title={t("settlements")}
        subtitle={t("settlements@subtitle")}
        actions={headerActions}
      />

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mt: 1, mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={2}
              sx={{
                p: 2.5,
                bgcolor: "primary.50",
                borderRadius: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
                  <ReceiptLongIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {t("totalSettlements")}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary.dark">
                    {summary.totalSettlements}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={2}
              sx={{
                p: 2.5,
                bgcolor: "success.50",
                borderRadius: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "success.main", width: 48, height: 48 }}>
                  <AttachMoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {t("totalCommission")}
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="success.dark">
                    {summary.totalCommissionAmount.toFixed(3)} KWD
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={2}
              sx={{
                p: 2.5,
                bgcolor: "warning.50",
                borderRadius: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "warning.main", width: 48, height: 48 }}>
                  <PendingActionsIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {t("pending")}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="warning.dark">
                    {summary.pendingCount}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              elevation={2}
              sx={{
                p: 2.5,
                bgcolor: "info.50",
                borderRadius: 2,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "info.main", width: 48, height: 48 }}>
                  <PaymentsIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {t("paid")}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="info.dark">
                    {summary.paidCount}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Box sx={{ mt: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
          <TextField
            size="small"
            placeholder={t("search")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            sx={{ minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t("year")}</InputLabel>
            <Select
              value={selectedYear}
              label={t("year")}
              onChange={(e) => setSelectedYear(e.target.value as number)}
            >
              {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>{t("month")}</InputLabel>
            <Select
              value={selectedMonth ?? ""}
              label={t("month")}
              onChange={(e) => setSelectedMonth(e.target.value as number || undefined)}
            >
              <MenuItem value="">{t("all")}</MenuItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <MenuItem key={month} value={month}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>{t("status")}</InputLabel>
            <Select
              value={statusFilter ?? ""}
              label={t("status")}
              onChange={(e) => setStatusFilter(e.target.value as number || undefined)}
            >
              <MenuItem value="">{t("all")}</MenuItem>
              <MenuItem value={1}>{t("pending")}</MenuItem>
              <MenuItem value={2}>{t("invoiced")}</MenuItem>
              <MenuItem value={3}>{t("paid")}</MenuItem>
              <MenuItem value={4}>{t("disputed")}</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <AppDataGrid
          data={paginatedData}
          columns={columns}
          loading={isLoading}
          disablePagination={false}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          total={data.length}
        />
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <ReceiptLongIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {t("settlementDetails")}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          {selectedSettlement && (
            <Stack spacing={3}>
              {/* Provider Info */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "secondary.main" }}>
                    <StoreIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t("provider")}
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedSettlement.providerOwnerName}
                    </Typography>
                  </Box>
                  <Box>
                    {getStatusChip(selectedSettlement.settlementStatus)}
                  </Box>
                </Stack>
              </Paper>

              {/* Period */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: "info.50", borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "info.main" }}>
                    <CalendarMonthIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t("period")}
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedSettlement.periodYear}-{String(selectedSettlement.periodMonth).padStart(2, "0")}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Stats Grid */}
              <Grid container spacing={2}>
                {/* Total Transactions */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "primary.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <ReceiptLongIcon sx={{ fontSize: 18, color: "primary.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("totalTransactions")}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} color="primary.dark">
                      {selectedSettlement.totalTransactions}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Total Amount */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "info.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <AttachMoneyIcon sx={{ fontSize: 18, color: "info.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("totalAmount")}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} color="info.dark">
                      {selectedSettlement.totalTransactionAmount.toFixed(3)} KWD
                    </Typography>
                  </Paper>
                </Grid>

                {/* Commission */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "success.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <PaymentsIcon sx={{ fontSize: 18, color: "success.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("commission")}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} color="success.dark">
                      {selectedSettlement.totalCommissionAmount.toFixed(3)} KWD
                    </Typography>
                  </Paper>
                </Grid>

                {/* Points Awarded */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "warning.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <StarsIcon sx={{ fontSize: 18, color: "warning.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("pointsAwarded")}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} color="warning.dark">
                      {selectedSettlement.totalPointsAwarded}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Points Deducted */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "error.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <StarsIcon sx={{ fontSize: 18, color: "error.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("totalPointsDeducted")}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} color="error.dark">
                      {selectedSettlement.totalPointsDeducted}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Admin Note (if exists) */}
              {selectedSettlement.adminNote && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
                    {t("adminNote")}
                  </Typography>
                  <Typography variant="body1">{selectedSettlement.adminNote}</Typography>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ gap: 1, px: 3, py: 2 }}>
          <Button onClick={() => setDetailDialogOpen(false)} size="large">
            {t("close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "warning.main" }}>
              <EditIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {t("updateSettlementStatus")}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t("newStatus")}</InputLabel>
              <Select
                value={newStatus}
                label={t("newStatus")}
                onChange={(e) => setNewStatus(e.target.value as SettlementStatus)}
              >
                <MenuItem value={2}>{t("invoiced")}</MenuItem>
                <MenuItem value={3}>{t("paid")}</MenuItem>
                <MenuItem value={4}>{t("disputed")}</MenuItem>
              </Select>
            </FormControl>

            {newStatus === 3 && (
              <TextField
                label={t("paidAmount")}
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                fullWidth
                helperText="KWD"
              />
            )}

            <TextField
              label={t("note")}
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
            startIcon={updateStatusMutation.isPending && <CircularProgress size={20} />}
          >
            {updateStatusMutation.isPending ? t("updating") : t("update")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Settlement Dialog */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "success.main" }}>
              <AddCircleOutlineIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {t("settlements@generateTitle")}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t("year")}</InputLabel>
              <Select
                value={generateYear}
                label={t("year")}
                onChange={(e) => setGenerateYear(Number(e.target.value))}
              >
                {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>{t("month")}</InputLabel>
              <Select
                value={generateMonth}
                label={t("month")}
                onChange={(e) => setGenerateMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              {t("settlements@generateHint")}
            </Typography>
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ gap: 1, px: 3, py: 2 }}>
          <Button onClick={() => setGenerateDialogOpen(false)} size="large">
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleGenerateSettlement}
            disabled={generateSettlementMutation.isPending}
            startIcon={generateSettlementMutation.isPending ? <CircularProgress size={20} /> : <AddCircleOutlineIcon />}
          >
            {generateSettlementMutation.isPending ? t("generating") : t("settlements@generate")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
