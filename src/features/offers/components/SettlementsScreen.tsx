import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
  Tab,
  Tabs,
  TablePagination,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PaymentsIcon from "@mui/icons-material/Payments";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import StarsIcon from "@mui/icons-material/Stars";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import HandshakeIcon from "@mui/icons-material/Handshake";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EvStationIcon from "@mui/icons-material/EvStation";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import HistoryIcon from "@mui/icons-material/History";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  useSettlements,
  useSettlementSummary,
  useUpdateSettlementStatus,
  useWalletBalance,
  useWalletHistory,
  useAddWalletDeposit,
} from "../hooks/use-settlements";
import { getSettlements } from "../services/offers-service";
import { useSetCreditLimit } from "../../partners/hooks/use-partners";
import type { ProviderSettlementDto, SettlementStatus, WalletTransactionType, ProviderType } from "../types/api";

const STATUS_CFG: Record<number, { label_key: string; color: "warning" | "success" | "error" }> = {
  1: { label_key: "pending", color: "warning" },
  3: { label_key: "paid", color: "success" },
  4: { label_key: "disputed", color: "error" },
};

// ── Wallet balance cell — fetches on mount, uses cache after dialog opens ─────
function WalletBalanceCell({
  providerType,
  providerId,
  onOpen,
}: {
  providerType: ProviderType;
  providerId: number;
  onOpen: () => void;
}) {
  const { t } = useTranslation(["offers", "common"]);
  const { data, isLoading } = useWalletBalance(providerType, providerId);

  const balance = data?.walletBalance ?? null;
  const isDebt = balance !== null && balance < 0;
  const isZero = balance === 0;

  return (
    <Tooltip title={t("offers@settlements_walletBalance")}>
      <Box
        onClick={(e) => { e.stopPropagation(); onOpen(); }}
        sx={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}
      >
        {isLoading ? (
          <CircularProgress size={14} color="inherit" sx={{ opacity: 0.4 }} />
        ) : balance === null ? (
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>—</Typography>
        ) : (
          <Chip
            icon={<AccountBalanceWalletIcon sx={{ fontSize: "12px !important" }} />}
            label={balance.toFixed(3)}
            size="small"
            color={isDebt ? "error" : isZero ? "default" : "info"}
            variant={isDebt ? "filled" : "outlined"}
            sx={{
              height: 22,
              fontWeight: 700,
              fontSize: "0.68rem",
              "& .MuiChip-label": { px: 0.75 },
              "& .MuiChip-icon": { ml: 0.5 },
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
}

export default function SettlementsScreen() {
  const { t, i18n } = useTranslation(["offers", "common"]);
  const navigate = useNavigate();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [providerTypeFilter, setProviderTypeFilter] = useState<"ChargingPoint" | "ServiceProvider" | undefined>(undefined);

  const { data: rawData, isLoading, search, handleSearchChange, handleRefresh } = useSettlements({
    year: selectedYear,
  });

  const data = useMemo(() => {
    let filtered = rawData;
    if (providerTypeFilter) filtered = filtered.filter((s) => s.providerType === providerTypeFilter);
    if (statusFilter) filtered = filtered.filter((s) => s.settlementStatus === statusFilter);
    if (selectedWeek) filtered = filtered.filter((s) => s.periodWeek === selectedWeek);
    return filtered;
  }, [rawData, statusFilter, providerTypeFilter, selectedWeek]);

  const statusCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 3: 0, 4: 0 };
    rawData.forEach((s) => { counts[s.settlementStatus] = (counts[s.settlementStatus] ?? 0) + 1; });
    return counts;
  }, [rawData]);

  // Get unique weeks from data for filter chips
  const availableWeeks = useMemo(() => {
    const weeks = new Set<number>();
    rawData.forEach((s) => { if (s.periodWeek > 0) weeks.add(s.periodWeek); });
    return Array.from(weeks).sort((a, b) => a - b);
  }, [rawData]);

  const providerTypeCounts = useMemo(() => {
    let cp = 0, sp = 0;
    rawData.forEach((s) => { if (s.providerType === "ChargingPoint") cp++; else sp++; });
    return { cp, sp };
  }, [rawData]);

  const { data: summary, isLoading: summaryLoading } = useSettlementSummary(selectedYear);
  const updateStatusMutation = useUpdateSettlementStatus();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<ProviderSettlementDto | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<SettlementStatus>(3);
  const [adminNote, setAdminNote] = useState("");

  // Wallet management dialog state
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [walletProvider, setWalletProvider] = useState<{ providerType: ProviderType; providerId: number; providerName: string } | null>(null);
  const [walletSettlement, setWalletSettlement] = useState<ProviderSettlementDto | null>(null);
  const [walletDepositAmount, setWalletDepositAmount] = useState("");
  const [walletDepositType, setWalletDepositType] = useState<WalletTransactionType>(1);
  const [walletDepositNote, setWalletDepositNote] = useState("");

  // Fetch Wallet balance & history for the management dialog
  const { data: walletMgmtBalance, isLoading: walletMgmtBalanceLoading } = useWalletBalance(
    walletProvider?.providerType,
    walletProvider?.providerId
  );
  const { data: walletHistory, isLoading: walletHistoryLoading } = useWalletHistory(
    walletProvider?.providerType,
    walletProvider?.providerId
  );
  const addWalletDepositMutation = useAddWalletDeposit();

  // Credit limit dialog state
  const [creditLimitDialogOpen, setCreditLimitDialogOpen] = useState(false);
  const [creditLimitProvider, setCreditLimitProvider] = useState<{ providerType: ProviderType; providerId: number; providerName: string } | null>(null);
  const setCreditLimitMutation = useSetCreditLimit();
  const [creditLimitValue, setCreditLimitValue] = useState("");
  const [creditLimitUnlimited, setCreditLimitUnlimited] = useState(false);
  const { data: creditLimitBalance, isLoading: creditLimitBalanceLoading } = useWalletBalance(
    creditLimitProvider?.providerType,
    creditLimitProvider?.providerId
  );

  // Settlement history dialog state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyProvider, setHistoryProvider] = useState<{ providerType: ProviderType; providerId: number; providerName: string } | null>(null);
  const { data: providerHistory, isLoading: providerHistoryLoading } = useQuery({
    queryKey: ["provider-history", historyProvider?.providerType, historyProvider?.providerId],
    queryFn: () => getSettlements({ providerType: historyProvider!.providerType, providerId: historyProvider!.providerId }),
    enabled: !!historyProvider,
    staleTime: 60 * 1000,
  });

  const periodLabel = useMemo(
    () => selectedWeek ? `${t("offers@settlements_week")} ${selectedWeek} · ${selectedYear}` : String(selectedYear),
    [selectedWeek, selectedYear, t]
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
    setNewStatus(3);
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
  }, [selectedSettlement, newStatus, adminNote, updateStatusMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleOpenWalletDialog = useCallback((row: ProviderSettlementDto) => {
    setWalletProvider({ providerType: row.providerType, providerId: row.providerId, providerName: row.providerName });
    setWalletSettlement(row);
    setWalletDepositAmount("");
    setWalletDepositType(1);
    setWalletDepositNote("");
    setWalletDialogOpen(true);
  }, []);

  const handleOpenCreditLimitDialog = useCallback((row: ProviderSettlementDto) => {
    setCreditLimitProvider({ providerType: row.providerType, providerId: row.providerId, providerName: row.providerName });
    setCreditLimitValue("");
    setCreditLimitUnlimited(false);
    setCreditLimitDialogOpen(true);
  }, []);

  const handleOpenHistoryDialog = useCallback((row: ProviderSettlementDto) => {
    setHistoryProvider({ providerType: row.providerType, providerId: row.providerId, providerName: row.providerName });
    setHistoryDialogOpen(true);
  }, []);

  const handleAddWalletDeposit = useCallback(() => {
    if (!walletProvider) return;
    const amount = parseFloat(walletDepositAmount);
    if (!amount || amount <= 0) return;
    addWalletDepositMutation.mutate(
      {
        providerId: walletProvider.providerId,
        providerType: walletProvider.providerType,
        amount,
        transactionType: walletDepositType,
        note: walletDepositNote || undefined,
      },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("offers@settlements_walletSuccess") });
          setWalletDepositAmount("");
          setWalletDepositNote("");
        },
        onError: (err: Error) => { openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }); },
      }
    );
  }, [walletProvider, walletDepositAmount, walletDepositType, walletDepositNote, addWalletDepositMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleSetCreditLimit = useCallback(() => {
    if (!creditLimitProvider) return;
    const limit = creditLimitUnlimited ? null : parseFloat(creditLimitValue);
    if (!creditLimitUnlimited && (isNaN(limit as number) || (limit as number) <= 0)) {
      openErrorSnackbar({ message: t("offers@settlements_walletCreditLimitInvalid") });
      return;
    }
    setCreditLimitMutation.mutate(
      { providerType: creditLimitProvider.providerType, providerId: creditLimitProvider.providerId, creditLimit: limit },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("offers@settlements_walletCreditLimitSet") });
          setCreditLimitValue("");
          setCreditLimitDialogOpen(false);
        },
        onError: (err: Error) => { openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }); },
      }
    );
  }, [creditLimitProvider, creditLimitValue, creditLimitUnlimited, setCreditLimitMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const walletTypeLabel = (type: number) => {
    switch (type) {
      case 1: return t("offers@settlements_walletDeposit");
      case 2: return t("offers@settlements_walletSettlement");
      case 3: return t("offers@settlements_walletRefund");
      case 4: return t("offers@settlements_walletAdjustment");
      case 5: return t("offers@settlements_walletCommissionDeduction");
      case 6: return t("offers@settlements_walletCommissionRefund");
      case 7: return t("offers@settlements_walletOfferCredit");
      case 8: return t("offers@settlements_walletOfferRefund");
      default: return t("offers@unknown");
    }
  };

  const walletTypeColor = (type: number): "success" | "info" | "warning" | "error" => {
    switch (type) {
      case 1: return "success";  // Deposit
      case 2: return "info";     // SettlementDeduction (legacy)
      case 3: return "warning";  // Refund
      case 4: return "error";    // Adjustment
      case 5: return "error";    // CommissionDeduction — system auto-deduct
      case 6: return "success";  // CommissionRefund — system auto-refund
      case 7: return "success";  // OfferPaymentCredit — Cable pays provider
      case 8: return "warning";  // OfferPaymentRefund — reserved
      default: return "info";
    }
  };

  const getStatusChip = (status: SettlementStatus) => {
    const cfg = STATUS_CFG[status];
    if (!cfg) return <Chip label="?" size="small" />;
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

  const totalTxCount = (row: ProviderSettlementDto) => row.partnerTransactionCount + row.offerTransactionCount;

  // NetBalance = OfferPaymentAmount - PartnerCommissionAmount
  // Positive = Cable owes provider | Negative = Provider owes Cable
  const getSettlementAmount = (row: ProviderSettlementDto) => Math.abs(row.netBalance);
  const cableOwesProvider = (row: ProviderSettlementDto) => row.netBalance > 0;
  const providerOwesCable = (row: ProviderSettlementDto) => row.netBalance < 0;

  const columns: GridColDef<ProviderSettlementDto>[] = [
    { field: "id", headerName: "#", width: 50, align: "center", headerAlign: "center" },
    {
      field: "providerName",
      headerName: t("offers@provider"),
      flex: 1,
      minWidth: 250,
      renderCell: (params) => {
        const row = params.row;
        const isCP = row.providerType === "ChargingPoint";
        return (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: isCP ? "primary.main" : "secondary.main",
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
            >
              {isCP ? <EvStationIcon sx={{ fontSize: 20 }} /> : <MiscellaneousServicesIcon sx={{ fontSize: 20 }} />}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} lineHeight={1.2} noWrap>{row.providerName}</Typography>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.3 }}>
                <Chip
                  label={isCP ? t("offers@chargingPoint") : t("offers@serviceProvider")}
                  size="small"
                  variant="filled"
                  color={isCP ? "primary" : "secondary"}
                  sx={{ height: 18, "& .MuiChip-label": { px: 0.75, fontSize: "0.6rem" } }}
                />
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>#{row.providerId}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", lineHeight: 1 }}>
                {row.providerOwnerName}{row.ownerPhone ? ` · ${row.ownerPhone}` : ""}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      field: "period",
      headerName: t("offers@period"),
      width: 110,
      align: "center",
      headerAlign: "center",
      valueGetter: (_value: unknown, row: ProviderSettlementDto) =>
        `${row.periodYear}-W${row.periodWeek}`,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Stack alignItems="center" spacing={0.25}>
            <Typography variant="body2" fontWeight={700}>{row.periodYear}</Typography>
            <Chip
              label={`W${row.periodWeek}`}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ height: 18, "& .MuiChip-label": { px: 0.75, fontSize: "0.65rem", fontWeight: 700 } }}
            />
          </Stack>
        );
      },
    },
    {
      field: "transactions",
      headerName: t("offers@transactions"),
      width: 100,
      align: "center",
      headerAlign: "center",
      valueGetter: (_value: unknown, row: ProviderSettlementDto) => totalTxCount(row),
      renderCell: (params) => {
        const row = params.row;
        return (
          <Stack alignItems="center" spacing={0.25}>
            <Typography variant="body2" fontWeight={800}>{params.value}</Typography>
            <Stack direction="row" spacing={0.5}>
              {row.partnerTransactionCount > 0 && (
                <Chip
                  icon={<HandshakeIcon sx={{ fontSize: "11px !important" }} />}
                  label={row.partnerTransactionCount}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ height: 18, "& .MuiChip-label": { px: 0.4, fontSize: "0.6rem" } }}
                />
              )}
              {row.offerTransactionCount > 0 && (
                <Chip
                  icon={<LocalOfferIcon sx={{ fontSize: "11px !important" }} />}
                  label={row.offerTransactionCount}
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{ height: 18, "& .MuiChip-label": { px: 0.4, fontSize: "0.6rem" } }}
                />
              )}
            </Stack>
          </Stack>
        );
      },
    },
    {
      field: "netBalance",
      headerName: t("offers@settlements_netBalance"),
      width: 180,
      align: "right",
      headerAlign: "right",
      valueGetter: (_value: unknown, row: ProviderSettlementDto) => row.netBalance,
      renderCell: (params) => {
        const row = params.row;
        const amount = getSettlementAmount(row);
        const owes = providerOwesCable(row);
        const owed = cableOwesProvider(row);
        return (
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body2" fontWeight={800} color={owes ? "info.dark" : owed ? "warning.dark" : "text.secondary"} sx={{ fontSize: "0.95rem" }}>
              {amount.toFixed(3)} <Typography component="span" variant="caption" color="text.secondary">JOD</Typography>
            </Typography>
            {owes && (
              <Stack direction="row" spacing={0.3} alignItems="center" justifyContent="flex-end">
                <ArrowBackIcon sx={{ fontSize: 10, color: "info.main" }} />
                <Typography variant="caption" color="info.main" fontWeight={600} sx={{ fontSize: "0.6rem" }}>{t("offers@settlements_providerPaysCable")}</Typography>
              </Stack>
            )}
            {owed && (
              <Stack direction="row" spacing={0.3} alignItems="center" justifyContent="flex-end">
                <ArrowForwardIcon sx={{ fontSize: 10, color: "warning.main" }} />
                <Typography variant="caption" color="warning.main" fontWeight={600} sx={{ fontSize: "0.6rem" }}>{t("offers@settlements_cablePaysProvider")}</Typography>
              </Stack>
            )}
            {!owes && !owed && (
              <Typography variant="caption" color="success.main" fontWeight={600} sx={{ fontSize: "0.6rem" }}>{t("offers@settlements_settled")}</Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: "outstandingAmount",
      headerName: t("offers@settlements_outstanding"),
      width: 160,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => {
        const row = params.row;
        const outstanding = row.outstandingAmount ?? 0;
        const walletApplied = row.walletApplied ?? 0;

        if (row.settlementStatus === 3) {
          return (
            <Stack alignItems="flex-end" spacing={0.25}>
              <Typography variant="caption" fontWeight={600} color="success.main" sx={{ fontSize: "0.7rem" }}>
                {t("offers@paid")} ✓
              </Typography>
              {walletApplied > 0 && (
                <Typography variant="caption" fontWeight={600} color="info.main" sx={{ fontSize: "0.6rem" }}>
                  {t("offers@settlements_walletApplied")}: {walletApplied.toFixed(3)}
                </Typography>
              )}
            </Stack>
          );
        }

        return (
          <Box sx={{ textAlign: "right" }}>
            {outstanding > 0 ? (
              <Typography variant="body2" fontWeight={700} color="error.dark">
                {outstanding.toFixed(3)} <Typography component="span" variant="caption" color="text.secondary">JOD</Typography>
              </Typography>
            ) : (
              <Typography variant="caption" fontWeight={600} color="text.disabled">
                {t("offers@settlements_notPaid")}
              </Typography>
            )}
            {walletApplied > 0 && (
              <Typography variant="caption" fontWeight={600} color="info.main" sx={{ fontSize: "0.6rem" }}>
                {t("offers@settlements_walletApplied")}: {walletApplied.toFixed(3)}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: "walletBalance",
      headerName: t("offers@settlements_walletBalance"),
      width: 130,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <WalletBalanceCell
          providerType={params.row.providerType}
          providerId={params.row.providerId}
          onOpen={() => handleOpenWalletDialog(params.row)}
        />
      ),
    },
    {
      field: "settlementStatus",
      headerName: t("status"),
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Stack alignItems="center" spacing={0.25}>
          {getStatusChip(params.value)}
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.55rem" }}>
            {formatDate(params.row.createdAt)}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 110,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.25} justifyContent="center">
          <Tooltip title={t("offers@viewDetails")}>
            <IconButton size="small" onClick={(e) => handleViewDetails(e, params.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("offers@settlements_walletHistory")}>
            <IconButton size="small" color="secondary" onClick={(e) => { e.stopPropagation(); handleOpenWalletDialog(params.row); }}>
              <AccountBalanceWalletIcon fontSize="small" />
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
        { label: t("offers@totalSettlements"), value: summary.totalSettlements, sub: null, icon: <ReceiptLongIcon />, color: "rgba(255,255,255,0.13)" },
        { label: t("offers@pending"), value: summary.pendingCount, sub: summary.disputedCount > 0 ? `${summary.disputedCount} ${t("offers@disputed")}` : null, icon: <PendingActionsIcon />, color: "rgba(255,255,255,0.13)" },
        { label: t("offers@paid"), value: summary.paidCount, sub: null, icon: <PaymentsIcon />, color: "rgba(255,255,255,0.13)" },
        { label: t("offers@settlements_offerPayment"), value: `${(summary.totalOfferPaymentAmount ?? 0).toFixed(3)}`, sub: `${summary.totalOfferTransactions} ${t("offers@transactions")}`, icon: <LocalOfferIcon />, color: "rgba(239,83,80,0.25)" },
        { label: t("offers@settlements_commission"), value: `${(summary.totalPartnerCommissionAmount ?? 0).toFixed(3)}`, sub: `${summary.totalPartnerTransactions} ${t("offers@transactions")}`, icon: <HandshakeIcon />, color: "rgba(76,175,80,0.25)" },
        { label: t("offers@settlements_netBalance"), value: `${(summary.totalNetBalance ?? 0).toFixed(3)}`, sub: "JOD", icon: <TrendingUpIcon />, color: "rgba(255,193,7,0.25)" },
        ...(summary.totalWalletApplied > 0
          ? [{ label: t("offers@settlements_walletApplied"), value: `${summary.totalWalletApplied.toFixed(3)}`, sub: "JOD", icon: <AccountBalanceIcon />, color: "rgba(33,150,243,0.25)" }]
          : []),
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
              <Typography variant="h4" fontWeight={800} color="white" lineHeight={1.2}>{t("offers@settlements")}</Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5 }}>{t("offers@settlements_subtitle")}</Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{
              bgcolor: "rgba(255,255,255,0.18)",
              color: "white",
              fontWeight: 700,
              fontSize: "0.9rem",
              textTransform: "none",
              px: 3,
              py: 1,
              borderRadius: 2.5,
              border: "1px solid rgba(255,255,255,0.25)",
              backdropFilter: "blur(4px)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.28)", borderColor: "rgba(255,255,255,0.5)" },
            }}
          >
            {t("refresh")}
          </Button>
        </Stack>

        {/* KPI Cards */}
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          {summaryLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Box
                  key={i}
                  sx={{ background: "rgba(255,255,255,0.08)", borderRadius: 2.5, px: 2.5, py: 2.25, minWidth: 140, flex: "1 1 auto", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <Box sx={{ width: 80, height: 13, borderRadius: 1, bgcolor: "rgba(255,255,255,0.15)", mb: 1.25 }} />
                  <Box sx={{ width: 52, height: 28, borderRadius: 1, bgcolor: "rgba(255,255,255,0.2)" }} />
                </Box>
              ))
            : kpiCards.map((card) => (
                <Box
                  key={card.label}
                  sx={{ background: card.color, borderRadius: 2.5, px: 2.5, py: 2.25, minWidth: 140, flex: "1 1 auto", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.18)" }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                    <Box sx={{ opacity: 0.85, display: "flex" }}>{card.icon}</Box>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>{card.label}</Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={800} color="white" lineHeight={1}>{card.value}</Typography>
                  {card.sub && <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)", mt: 0.5, display: "block" }}>{card.sub}</Typography>}
                </Box>
              ))}
        </Stack>
      </Box>

      {/* ── Filter Panel ── */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        {/* Search + Period + Clear */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {/* Search */}
          <TextField
            placeholder={`${t("search")}...`}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "primary.main", fontSize: 22 }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => handleSearchChange("")}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: "background.paper",
                height: 48,
                fontSize: "0.95rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                "&:hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
              },
            }}
          />

          {/* Year + Week selectors */}
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              height: 48,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              flexShrink: 0,
            }}
          >
            <CalendarMonthIcon sx={{ fontSize: 18, color: "primary.main", mx: 0.5 }} />
            {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
              <Chip
                key={year}
                label={year}
                onClick={() => setSelectedYear(year)}
                color={selectedYear === year ? "primary" : "default"}
                variant={selectedYear === year ? "filled" : "outlined"}
                sx={{
                  fontWeight: 800,
                  height: 34,
                  borderRadius: 2,
                  "& .MuiChip-label": { px: 1.5, fontSize: "0.85rem" },
                  ...(selectedYear !== year && { borderColor: "transparent", bgcolor: "grey.50" }),
                }}
              />
            ))}
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 24, alignSelf: "center" }} />
            <Chip
              label={t("all")}
              onClick={() => setSelectedWeek(undefined)}
              color={selectedWeek === undefined ? "primary" : "default"}
              variant={selectedWeek === undefined ? "filled" : "outlined"}
              sx={{
                fontWeight: 700,
                height: 34,
                borderRadius: 2,
                "& .MuiChip-label": { px: 1.25, fontSize: "0.82rem" },
                ...(selectedWeek !== undefined && { borderColor: "transparent", bgcolor: "grey.50" }),
              }}
            />
            {availableWeeks.map((week) => (
              <Chip
                key={week}
                label={`W${week}`}
                onClick={() => setSelectedWeek(week)}
                color={selectedWeek === week ? "primary" : "default"}
                variant={selectedWeek === week ? "filled" : "outlined"}
                sx={{
                  fontWeight: 700,
                  height: 34,
                  borderRadius: 2,
                  "& .MuiChip-label": { px: 1.25, fontSize: "0.82rem" },
                  ...(selectedWeek !== week && { borderColor: "transparent", bgcolor: "grey.50" }),
                }}
              />
            ))}
          </Paper>

          {/* Clear filters */}
          {(statusFilter !== undefined || providerTypeFilter !== undefined || selectedWeek !== undefined) && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CloseIcon />}
              onClick={() => { setStatusFilter(undefined); setProviderTypeFilter(undefined); setSelectedWeek(undefined); }}
              sx={{
                whiteSpace: "nowrap",
                borderRadius: 3,
                flexShrink: 0,
                fontWeight: 700,
                height: 48,
                textTransform: "none",
                px: 2.5,
              }}
            >
              {t("clearAllFilters")}
            </Button>
          )}
        </Stack>

        {/* Provider type + Status — single row */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {/* Provider type segmented control */}
          <Paper
            elevation={0}
            sx={{
              display: "flex",
              alignItems: "center",
              p: 0.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "grey.50",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              flexShrink: 0,
            }}
          >
            {([
              { value: undefined as string | undefined, label: t("all"), count: rawData.length, icon: null },
              { value: "ChargingPoint" as string | undefined, label: t("offers@chargingPoint"), count: providerTypeCounts.cp, icon: <EvStationIcon sx={{ fontSize: 18 }} /> },
              { value: "ServiceProvider" as string | undefined, label: t("offers@serviceProvider"), count: providerTypeCounts.sp, icon: <MiscellaneousServicesIcon sx={{ fontSize: 18 }} /> },
            ]).map(({ value, label, count, icon }) => {
              const isActive = providerTypeFilter === value;
              return (
                <Button
                  key={String(value)}
                  onClick={() => setProviderTypeFilter(value === undefined ? undefined : value as "ChargingPoint" | "ServiceProvider")}
                  startIcon={icon}
                  disableElevation
                  sx={{
                    borderRadius: 2.5,
                    px: 2,
                    py: 1,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: isActive ? "primary.contrastText" : "text.secondary",
                    bgcolor: isActive ? "primary.main" : "transparent",
                    boxShadow: isActive ? "0 2px 8px rgba(21,101,192,0.3)" : "none",
                    "&:hover": { bgcolor: isActive ? "primary.dark" : "grey.100" },
                    transition: "all 0.2s ease",
                  }}
                >
                  {label}
                  <Chip
                    label={count}
                    size="small"
                    sx={{
                      ml: 0.75,
                      height: 20,
                      minWidth: 20,
                      fontWeight: 800,
                      fontSize: "0.7rem",
                      bgcolor: isActive ? "rgba(255,255,255,0.25)" : "grey.200",
                      color: isActive ? "white" : "text.secondary",
                      "& .MuiChip-label": { px: 0.75 },
                    }}
                  />
                </Button>
              );
            })}
          </Paper>

          {/* Status pills */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
            {([
              { key: undefined as number | undefined, label: t("all"), count: rawData.length, color: "#1565c0", bg: "#e3f2fd", activeBg: "#1565c0" },
              { key: 1 as number | undefined, label: t("offers@pending"), count: statusCounts[1] ?? 0, color: "#e65100", bg: "#fff3e0", activeBg: "#e65100" },
              { key: 3 as number | undefined, label: t("offers@paid"), count: statusCounts[3] ?? 0, color: "#2e7d32", bg: "#e8f5e9", activeBg: "#2e7d32" },
              { key: 4 as number | undefined, label: t("offers@disputed"), count: statusCounts[4] ?? 0, color: "#c62828", bg: "#ffebee", activeBg: "#c62828" },
            ]).map(({ key, label, count, color, bg, activeBg }) => {
              const isActive = key === undefined ? statusFilter === undefined : statusFilter === key;
              return (
                <Paper
                  key={String(key)}
                  elevation={0}
                  onClick={() => {
                    if (key === undefined) setStatusFilter(undefined);
                    else setStatusFilter(statusFilter === key ? undefined : key);
                  }}
                  sx={{
                    flex: 1,
                    py: 1.5,
                    px: 2,
                    borderRadius: 3,
                    cursor: "pointer",
                    bgcolor: isActive ? activeBg : bg,
                    border: "1px solid",
                    borderColor: isActive ? activeBg : "transparent",
                    transition: "all 0.2s ease",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: `0 4px 12px ${color}33` },
                    userSelect: "none",
                    textAlign: "center",
                    boxShadow: isActive ? `0 4px 14px ${color}40` : "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <Typography
                    variant="h4"
                    fontWeight={900}
                    sx={{ color: isActive ? "white" : color, lineHeight: 1 }}
                  >
                    {count}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{
                      color: isActive ? "rgba(255,255,255,0.85)" : color,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      fontSize: "0.65rem",
                      mt: 0.5,
                      display: "block",
                    }}
                  >
                    {label}
                  </Typography>
                </Paper>
              );
            })}
          </Stack>
        </Stack>
      </Stack>

      {/* ── Data Grid Card ── */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ReceiptLongIcon color="action" sx={{ fontSize: 22 }} />
              <Typography variant="subtitle1" fontWeight={800}>{t("offers@settlements")}</Typography>
              {!isLoading && (
                <Chip
                  label={data.length}
                  size="small"
                  color="primary"
                  sx={{ height: 22, "& .MuiChip-label": { px: 1.25, fontSize: "0.75rem", fontWeight: 800 } }}
                />
              )}
            </Stack>
            <Chip
              icon={<CalendarMonthIcon sx={{ fontSize: "16px !important" }} />}
              label={periodLabel}
              sx={{ bgcolor: "primary.50", color: "primary.dark", fontWeight: 700, border: "1px solid", borderColor: "primary.200", height: 28, fontSize: "0.82rem" }}
            />
          </Stack>
        </Box>

        {/* Loading skeletons */}
        {isLoading && (
          <Box sx={{ p: 2 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Paper key={i} elevation={0} sx={{ mb: 1.5, borderRadius: 2.5, overflow: "hidden", border: "1px solid", borderColor: "divider", borderLeft: "4px solid", borderLeftColor: "grey.200" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 46, height: 46, borderRadius: 2, bgcolor: "grey.100" }} />
                    <Stack spacing={0.75}>
                      <Box sx={{ width: 160, height: 14, borderRadius: 1, bgcolor: "grey.200" }} />
                      <Box sx={{ width: 110, height: 11, borderRadius: 1, bgcolor: "grey.100" }} />
                    </Stack>
                  </Stack>
                  <Box sx={{ width: 72, height: 26, borderRadius: 3, bgcolor: "grey.200" }} />
                </Stack>
                <Divider />
                <Stack direction="row" sx={{ bgcolor: "grey.50", px: 2, py: 1.5 }} spacing={2}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <Box key={j} sx={{ flex: 1, height: 50, borderRadius: 1.5, bgcolor: "grey.100" }} />
                  ))}
                </Stack>
              </Paper>
            ))}
          </Box>
        )}

        {/* Empty state */}
        {!isLoading && data.length === 0 && (
          <Box sx={{ py: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 80, height: 80, borderRadius: "50%",
                background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px dashed", borderColor: "primary.200",
              }}
            >
              <AccountBalanceIcon sx={{ fontSize: 38, color: "primary.300" }} />
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h6" fontWeight={700} color="text.secondary" gutterBottom>{t("offers@settlements_emptyTitle")}</Typography>
              <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 380, mx: "auto" }}>{t("offers@settlements_emptyHint")}</Typography>
            </Box>
          </Box>
        )}

        {/* Card list */}
        {!isLoading && data.length > 0 && (
          <Box sx={{ p: 2, bgcolor: "grey.100", borderRadius: 2 }}>
            {paginatedData.map((row) => {
              const isCP = row.providerType === "ChargingPoint";
              const statusCfg = STATUS_CFG[row.settlementStatus];
              const statusColor = statusCfg?.color === "success" ? "#2e7d32" : statusCfg?.color === "warning" ? "#e65100" : "#c62828";
              const statusBg = statusCfg?.color === "success" ? "#e8f5e9" : statusCfg?.color === "warning" ? "#fff3e0" : "#ffebee";
              const statusShadow = statusCfg?.color === "success" ? "0 2px 12px rgba(46,125,50,0.15)" : statusCfg?.color === "warning" ? "0 2px 12px rgba(230,81,0,0.15)" : "0 2px 12px rgba(198,40,40,0.15)";
              const outstanding = row.outstandingAmount ?? 0;
              const walletApplied = row.walletApplied ?? 0;
              const isPaid = row.settlementStatus === 3;
              const owes = providerOwesCable(row);
              const owed = cableOwesProvider(row);
              const balanceColor = owes ? "#0277bd" : owed ? "#e65100" : "#2e7d32";

              return (
                <Paper
                  key={row.id}
                  elevation={2}
                  sx={{
                    mb: 2.5,
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "grey.200",
                    bgcolor: "background.paper",
                    boxShadow: statusShadow,
                    transition: "all 0.2s ease",
                    "&:hover": { boxShadow: "0 8px 30px rgba(0,0,0,0.12)", transform: "translateY(-2px)" },
                  }}
                >
                  {/* ── Top bar: colored status strip ── */}
                  <Box sx={{ height: 5, background: `linear-gradient(90deg, ${statusColor}, ${statusColor}88)` }} />

                  {/* ── Main content ── */}
                  <Box sx={{ px: 3, pt: 2.5, pb: 2 }}>
                    {/* Row 1: Provider + Status + Actions */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                        <Avatar
                          sx={{
                            bgcolor: isCP ? "#e3f2fd" : "#f3e5f5",
                            color: isCP ? "primary.main" : "secondary.main",
                            width: 50, height: 50, borderRadius: 2.5, flexShrink: 0,
                          }}
                        >
                          {isCP ? <EvStationIcon sx={{ fontSize: 26 }} /> : <MiscellaneousServicesIcon sx={{ fontSize: 26 }} />}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography variant="h6" fontWeight={800} lineHeight={1.2} noWrap>{row.providerName}</Typography>
                            <Chip
                              label={isCP ? t("offers@chargingPoint") : t("offers@serviceProvider")}
                              size="small"
                              sx={{
                                height: 22,
                                bgcolor: isCP ? "#e3f2fd" : "#f3e5f5",
                                color: isCP ? "primary.dark" : "secondary.dark",
                                fontWeight: 700,
                                fontSize: "0.68rem",
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                            <Typography variant="caption" color="text.disabled">#{row.providerId}</Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            {row.providerOwnerName}{row.ownerPhone ? ` · ${row.ownerPhone}` : ""}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Status badge + actions */}
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                        <Chip
                          label={t(`offers@${statusCfg?.label_key}`)}
                          sx={{
                            bgcolor: statusBg,
                            color: statusColor,
                            fontWeight: 800,
                            fontSize: "0.78rem",
                            height: 30,
                            "& .MuiChip-label": { px: 1.5 },
                          }}
                        />
                        <Tooltip title={t("offers@viewDetails")}>
                          <IconButton size="small" onClick={(e) => handleViewDetails(e, row)} sx={{ color: "text.secondary", "&:hover": { bgcolor: "grey.100" } }}>
                            <VisibilityIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>

                    {/* Row 2: Metrics grid */}
                    <Stack
                      direction="row"
                      spacing={0}
                      sx={{
                        mt: 2.5,
                        mx: -0.5,
                        "& > *": { flex: 1, px: 0.5 },
                      }}
                    >
                      {/* Period */}
                      <Box>
                        <Paper
                          elevation={0}
                          sx={{ p: 1.75, borderRadius: 2.5, bgcolor: "#fafafa", textAlign: "center", height: "100%", border: "1px solid", borderColor: "grey.200" }}
                        >
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            {t("offers@period")}
                          </Typography>
                          <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center" sx={{ mt: 0.75 }}>
                            <Typography variant="h6" fontWeight={800}>{row.periodYear}</Typography>
                            <Chip
                              label={`W${row.periodWeek}`}
                              size="small"
                              color="primary"
                              sx={{ height: 24, fontWeight: 800, "& .MuiChip-label": { px: 1, fontSize: "0.75rem" } }}
                            />
                          </Stack>
                        </Paper>
                      </Box>

                      {/* Transactions */}
                      <Box>
                        <Paper
                          elevation={0}
                          sx={{ p: 1.75, borderRadius: 2.5, bgcolor: "#fafafa", textAlign: "center", height: "100%", border: "1px solid", borderColor: "grey.200" }}
                        >
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            {t("offers@transactions")}
                          </Typography>
                          <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>{totalTxCount(row)}</Typography>
                          <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 0.25 }}>
                            {row.partnerTransactionCount > 0 && (
                              <Chip icon={<HandshakeIcon sx={{ fontSize: "12px !important" }} />} label={row.partnerTransactionCount} size="small" color="success" variant="outlined" sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: "0.65rem" } }} />
                            )}
                            {row.offerTransactionCount > 0 && (
                              <Chip icon={<LocalOfferIcon sx={{ fontSize: "12px !important" }} />} label={row.offerTransactionCount} size="small" color="error" variant="outlined" sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: "0.65rem" } }} />
                            )}
                          </Stack>
                        </Paper>
                      </Box>

                      {/* Net Balance */}
                      <Box>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.75, borderRadius: 2.5, textAlign: "center", height: "100%",
                            bgcolor: owes ? "#e1f5fe" : owed ? "#fff3e0" : "#e8f5e9",
                            border: "1px solid",
                            borderColor: owes ? "#b3e5fc" : owed ? "#ffe0b2" : "#c8e6c9",
                          }}
                        >
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            {t("offers@settlements_netBalance")}
                          </Typography>
                          <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5, color: balanceColor }}>
                            {getSettlementAmount(row).toFixed(3)}
                            <Typography component="span" variant="caption" sx={{ ml: 0.5, color: "text.secondary" }}>JOD</Typography>
                          </Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.62rem", color: balanceColor }}>
                            {owes ? t("offers@settlements_providerPaysCable") : owed ? t("offers@settlements_cablePaysProvider") : t("offers@settlements_settled")}
                          </Typography>
                        </Paper>
                      </Box>

                      {/* Outstanding / Paid */}
                      <Box>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.75, borderRadius: 2.5, textAlign: "center", height: "100%",
                            bgcolor: isPaid ? "#e8f5e9" : outstanding > 0 ? "#ffebee" : "#fafafa",
                            border: "1px solid",
                            borderColor: isPaid ? "#c8e6c9" : outstanding > 0 ? "#ffcdd2" : "grey.200",
                          }}
                        >
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            {t("offers@settlements_outstanding")}
                          </Typography>
                          {isPaid ? (
                            <Box sx={{ mt: 0.5 }}>
                              <Chip label={`✓ ${t("offers@paid")}`} size="small" sx={{ bgcolor: "#2e7d32", color: "white", fontWeight: 800, height: 26, "& .MuiChip-label": { px: 1.25 } }} />
                              {walletApplied > 0 && (
                                <Typography variant="caption" color="info.main" sx={{ fontSize: "0.62rem", display: "block", mt: 0.5 }}>
                                  {t("offers@settlements_walletApplied")}: {walletApplied.toFixed(3)}
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="h5" fontWeight={900} color={outstanding > 0 ? "error.dark" : "text.disabled"}>
                                {outstanding > 0 ? outstanding.toFixed(3) : "—"}
                                {outstanding > 0 && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>JOD</Typography>}
                              </Typography>
                              {walletApplied > 0 && (
                                <Typography variant="caption" color="info.main" sx={{ fontSize: "0.62rem", display: "block", mt: 0.25 }}>
                                  {t("offers@settlements_walletApplied")}: {walletApplied.toFixed(3)}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Paper>
                      </Box>

                      {/* Wallet Balance */}
                      <Box>
                        <Paper
                          elevation={0}
                          sx={{ p: 1.75, borderRadius: 2.5, bgcolor: "#fafafa", textAlign: "center", height: "100%", border: "1px solid", borderColor: "grey.200", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                        >
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            {t("offers@settlements_walletBalance")}
                          </Typography>
                          <Box sx={{ mt: 0.75 }}>
                            <WalletBalanceCell
                              providerType={row.providerType}
                              providerId={row.providerId}
                              onOpen={() => handleOpenWalletDialog(row)}
                            />
                          </Box>
                        </Paper>
                      </Box>
                    </Stack>

                    {/* Row 3: Quick actions bar */}
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mt: 2, pt: 1.5, borderTop: "1px solid", borderColor: "grey.100" }}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                        #{row.id} · {formatDate(row.createdAt)}
                        {row.paidAt && ` · ${t("offers@paidAt")}: ${formatDate(row.paidAt)}`}
                      </Typography>
                      <Stack direction="row" spacing={0.75}>
                        <Tooltip title={t("offers@settlements_providerHistory")}>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/provider-settlements?providerType=${row.providerType}&providerId=${row.providerId}&name=${encodeURIComponent(row.providerName)}`); }} sx={{ color: "info.main", bgcolor: "info.50", "&:hover": { bgcolor: "info.100" }, borderRadius: 2, width: 34, height: 34 }}>
                            <HistoryIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("offers@settlements_walletHistory")}>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenWalletDialog(row); }} sx={{ color: "secondary.main", bgcolor: "secondary.50", "&:hover": { bgcolor: "secondary.100" }, borderRadius: 2, width: 34, height: 34 }}>
                            <AccountBalanceWalletIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("offers@settlements_walletCreditLimit")}>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenCreditLimitDialog(row); }} sx={{ color: "warning.main", bgcolor: "warning.50", "&:hover": { bgcolor: "warning.100" }, borderRadius: 2, width: 34, height: 34 }}>
                            <CreditScoreIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        {row.settlementStatus !== 3 && (
                          <Tooltip title={t("offers@updateStatus")}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                              onClick={(e) => handleUpdateStatusClick(e, row)}
                              sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "0.78rem",
                                borderRadius: 2,
                                px: 2,
                                height: 34,
                                boxShadow: "none",
                                "&:hover": { boxShadow: "0 2px 8px rgba(21,101,192,0.3)" },
                              }}
                            >
                              {t("offers@updateStatus")}
                            </Button>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                </Paper>
              );
            })}

            {/* Pagination */}
            <TablePagination
              component="div"
              count={data.length}
              page={paginationModel.page}
              rowsPerPage={paginationModel.pageSize}
              rowsPerPageOptions={[10, 20, 50]}
              onPageChange={(_e, page) => setPaginationModel((m) => ({ ...m, page }))}
              onRowsPerPageChange={(e) => setPaginationModel({ page: 0, pageSize: parseInt(e.target.value, 10) })}
              labelRowsPerPage={t("tableRowsPerPage")}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${t("tableOf")} ${count}`}
              sx={{ borderTop: "1px solid", borderColor: "divider", mt: 0.5 }}
            />
          </Box>
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
                    {selectedSettlement.providerName} · {selectedSettlement.periodYear}-W{selectedSettlement.periodWeek}
                  </Typography>
                )}
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setDetailDialogOpen(false)} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.1)" } }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={{ p: 3, overflowY: "auto", flex: 1 }}>
          {selectedSettlement && (
            <Stack spacing={2.5}>
              {/* Provider & Owner info + status */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-start" }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
                    <Avatar sx={{ bgcolor: selectedSettlement.providerType === "ChargingPoint" ? "primary.main" : "secondary.main", width: 48, height: 48 }}>
                      {selectedSettlement.providerType === "ChargingPoint" ? <EvStationIcon /> : <MiscellaneousServicesIcon />}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={700}>{selectedSettlement.providerName}</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                        <Chip
                          label={selectedSettlement.providerType === "ChargingPoint" ? t("offers@chargingPoint") : t("offers@serviceProvider")}
                          size="small"
                          variant="outlined"
                          color={selectedSettlement.providerType === "ChargingPoint" ? "primary" : "secondary"}
                          sx={{ height: 20 }}
                        />
                        <Typography variant="caption" color="text.disabled">#{selectedSettlement.providerId}</Typography>
                      </Stack>
                      <Stack spacing={0.25} sx={{ mt: 1 }}>
                        {selectedSettlement.providerPhone && (
                          <Typography variant="caption" color="text.secondary">{selectedSettlement.providerPhone}</Typography>
                        )}
                        {selectedSettlement.providerAddress && (
                          <Typography variant="caption" color="text.secondary">{selectedSettlement.providerAddress}</Typography>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                  <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
                  <Stack spacing={0.5} sx={{ minWidth: 160 }}>
                    <Typography variant="overline" color="text.secondary" lineHeight={1} sx={{ fontSize: "0.6rem" }}>{t("offers@settlements_owner")}</Typography>
                    <Typography variant="body2" fontWeight={700}>{selectedSettlement.providerOwnerName}</Typography>
                    {selectedSettlement.ownerEmail && (
                      <Typography variant="caption" color="text.secondary">{selectedSettlement.ownerEmail}</Typography>
                    )}
                    {selectedSettlement.ownerPhone && (
                      <Typography variant="caption" color="text.secondary">{selectedSettlement.ownerPhone}</Typography>
                    )}
                  </Stack>
                  <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
                  <Stack alignItems={{ sm: "flex-end" }} spacing={0.5}>
                    {getStatusChip(selectedSettlement.settlementStatus)}
                    <Typography variant="caption" color="text.secondary">ID #{selectedSettlement.id}</Typography>
                  </Stack>
                </Stack>
              </Paper>

              {/* ── Money Flow Breakdown ── */}
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                    {t("offers@settlements_moneyFlow")}
                  </Typography>
                  <Chip
                    icon={providerOwesCable(selectedSettlement) ? <ArrowBackIcon sx={{ fontSize: "14px !important" }} /> : cableOwesProvider(selectedSettlement) ? <ArrowForwardIcon sx={{ fontSize: "14px !important" }} /> : undefined}
                    label={providerOwesCable(selectedSettlement) ? t("offers@settlements_providerPaysCable") : cableOwesProvider(selectedSettlement) ? t("offers@settlements_cablePaysProvider") : t("offers@settlements_settled")}
                    size="small"
                    color={providerOwesCable(selectedSettlement) ? "info" : cableOwesProvider(selectedSettlement) ? "warning" : "success"}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  {selectedSettlement.providerType === "ChargingPoint" ? t("offers@settlements_cpDesc") : t("offers@settlements_spDesc")}
                </Typography>

                {/* Partner Transactions */}
                {(selectedSettlement.providerType === "ChargingPoint" || selectedSettlement.partnerTransactionCount > 0) && (
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "success.50", borderRadius: 2, mb: 1.5, border: "1px solid", borderColor: "success.200" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "success.main" }}>
                        <HandshakeIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight={700} color="success.dark">
                          {t("offers@settlements_partnerTx")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedSettlement.partnerTransactionCount} {t("offers@transactions")}
                        </Typography>
                      </Box>
                      <ArrowForwardIcon sx={{ color: "success.main", fontSize: 20 }} />
                    </Stack>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary">{t("offers@settlements_userPayments")}</Typography>
                        <Typography variant="subtitle2" fontWeight={700}>{selectedSettlement.partnerTransactionAmount.toFixed(3)} JOD</Typography>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary">{t("offers@settlements_commission")}</Typography>
                        <Typography variant="subtitle2" fontWeight={700} color="success.dark">+{selectedSettlement.partnerCommissionAmount.toFixed(3)} JOD</Typography>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Typography variant="caption" color="text.secondary">{t("offers@pointsAwarded")}</Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <StarsIcon sx={{ fontSize: 14, color: "warning.main" }} />
                          <Typography variant="subtitle2" fontWeight={700}>{selectedSettlement.totalPointsAwarded}</Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Offer Transactions */}
                {(selectedSettlement.providerType === "ServiceProvider" || selectedSettlement.offerTransactionCount > 0) && (
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "error.50", borderRadius: 2, mb: 1.5, border: "1px solid", borderColor: "error.200" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "error.main" }}>
                        <LocalOfferIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight={700} color="error.dark">
                          {t("offers@settlements_offerTx")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedSettlement.offerTransactionCount} {t("offers@transactions")}
                        </Typography>
                      </Box>
                      <ArrowBackIcon sx={{ color: "error.main", fontSize: 20 }} />
                    </Stack>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">{t("offers@settlements_cablePays")}</Typography>
                        <Typography variant="subtitle2" fontWeight={700} color="error.dark">-{selectedSettlement.offerPaymentAmount.toFixed(3)} JOD</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">{t("offers@totalPointsDeducted")}</Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <StarsIcon sx={{ fontSize: 14, color: "error.main" }} />
                          <Typography variant="subtitle2" fontWeight={700}>{selectedSettlement.totalPointsDeducted}</Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {/* Settlement Amount */}
                {(() => {
                  const settlementAmt = getSettlementAmount(selectedSettlement);
                  const owes = providerOwesCable(selectedSettlement);
                  const owed = cableOwesProvider(selectedSettlement);
                  const color = owes ? "info" : owed ? "warning" : "success";
                  return (
                    <Paper elevation={0} sx={{ p: 2, bgcolor: `${color}.50`, borderRadius: 2, border: "2px solid", borderColor: `${color}.main` }}>
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 36, height: 36, bgcolor: `${color}.main` }}>
                            <TrendingUpIcon sx={{ fontSize: 20 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700} color={`${color}.dark`}>
                              {t("offers@settlements_netBalance")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {owes ? t("offers@settlements_providerPaysCable") : owed ? t("offers@settlements_cablePaysProvider") : t("offers@settlements_settled")}
                            </Typography>
                          </Box>
                        </Stack>
                        <Typography variant="h5" fontWeight={800} color={`${color}.dark`}>
                          {settlementAmt.toFixed(3)} JOD
                        </Typography>
                      </Stack>
                    </Paper>
                  );
                })()}
              </Paper>

              {/* Financial Summary Cards */}
              {(() => {
                const owes = providerOwesCable(selectedSettlement);
                const color = owes ? "info" : "warning";
                return (
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Paper elevation={0} sx={{ p: 1.5, bgcolor: `${color}.50`, borderRadius: 2, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary">
                          {t("offers@settlements_netBalance")}
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color={`${color}.dark`}>{getSettlementAmount(selectedSettlement).toFixed(3)}</Typography>
                        <Typography variant="caption" color="text.secondary">JOD</Typography>
                      </Paper>
                    </Grid>
                    {selectedSettlement.walletApplied > 0 && (
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper elevation={0} sx={{ p: 1.5, bgcolor: "info.50", borderRadius: 2, textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary">{t("offers@settlements_walletApplied")}</Typography>
                          <Typography variant="h6" fontWeight={700} color="info.dark">
                            {selectedSettlement.walletApplied.toFixed(3)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">JOD</Typography>
                        </Paper>
                      </Grid>
                    )}
                    {selectedSettlement.outstandingAmount > 0 && (
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Paper elevation={0} sx={{ p: 1.5, bgcolor: "error.50", borderRadius: 2, textAlign: "center" }}>
                          <Typography variant="caption" color="text.secondary">{t("offers@settlements_outstanding")}</Typography>
                          <Typography variant="h6" fontWeight={700} color="error.dark">
                            {selectedSettlement.outstandingAmount.toFixed(3)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">JOD</Typography>
                        </Paper>
                      </Grid>
                    )}
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Paper elevation={0} sx={{ p: 1.5, bgcolor: "grey.50", borderRadius: 2, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary">{t("offers@totalTransactions")}</Typography>
                        <Typography variant="h6" fontWeight={700} color="info.dark">
                          {totalTxCount(selectedSettlement)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                );
              })()}

              {/* Timeline */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 1.5 }}>
                  {t("offers@settlements_timeline")}
                </Typography>
                <Grid container spacing={1.5}>
                  {[
                    { label: t("offers@createdAt"), value: formatDate(selectedSettlement.createdAt) },
                    { label: t("offers@paidAt"), value: formatDate(selectedSettlement.paidAt) },
                  ].map(({ label, value }) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={label}>
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
            {selectedSettlement && (() => {
              const owes = providerOwesCable(selectedSettlement);
              const owed = cableOwesProvider(selectedSettlement);
              const color = owes ? "info" : owed ? "warning" : "success";
              return (
                <Paper elevation={0} sx={{ p: 2, bgcolor: `${color}.50`, borderRadius: 2, border: "1px solid", borderColor: `${color}.200` }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {t("offers@settlements_netBalance")}:
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {owes ? t("offers@settlements_providerPaysCable") : owed ? t("offers@settlements_cablePaysProvider") : t("offers@settlements_settled")}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={800} color={`${color}.dark`}>
                      {getSettlementAmount(selectedSettlement).toFixed(3)} JOD
                    </Typography>
                  </Stack>
                </Paper>
              );
            })()}

            <FormControl fullWidth>
              <InputLabel>{t("offers@newStatus")}</InputLabel>
              <Select
                value={newStatus}
                label={t("offers@newStatus")}
                onChange={(e) => setNewStatus(e.target.value as SettlementStatus)}
              >
                <MenuItem value={3}>{t("offers@paid")}</MenuItem>
                <MenuItem value={4}>{t("offers@disputed")}</MenuItem>
              </Select>
            </FormControl>

            {newStatus === 3 && (
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
                <Typography variant="body2" color="text.secondary">
                  {t("offers@settlements_paidAutoCalc")}
                </Typography>
              </Paper>
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

      {/* ── Wallet Management Dialog ── */}
      <Dialog
        open={walletDialogOpen}
        onClose={() => setWalletDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "92vh" } }}
      >
        {/* Header */}
        <Box sx={{ background: "linear-gradient(135deg, #0277bd 0%, #01579b 100%)", p: 0, color: "white", position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <Box sx={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
          <Box sx={{ position: "absolute", bottom: -30, left: 80, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ p: 3, pb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 50, height: 50, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} color="white" lineHeight={1.2}>
                  {t("offers@settlements_walletBalance")}
                </Typography>
                {walletProvider && (
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.4 }}>
                    <Chip
                      label={walletProvider.providerType === "ChargingPoint" ? t("offers@chargingPoint") : t("offers@serviceProvider")}
                      size="small"
                      sx={{ height: 18, bgcolor: "rgba(255,255,255,0.2)", color: "white", "& .MuiChip-label": { px: 0.75, fontSize: "0.6rem", fontWeight: 700 } }}
                    />
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
                      {walletProvider.providerName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                      #{walletProvider.providerId}
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setWalletDialogOpen(false)} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.12)" } }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          {/* Balance + Settlement context side by side */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mx: 3, mb: 3 }}>
            {/* Wallet Balance */}
            <Box sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.12)" }}>
              {walletMgmtBalanceLoading ? (
                <Box sx={{ height: 52, display: "flex", alignItems: "center" }}>
                  <CircularProgress size={24} sx={{ color: "rgba(255,255,255,0.6)" }} />
                </Box>
              ) : (() => {
                const wb = walletMgmtBalance?.walletBalance ?? 0;
                const isDebt = wb < 0;
                return (
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.6rem" }}>
                          {t("offers@settlements_walletBalance")}
                        </Typography>
                        {walletMgmtBalance?.providerOwnerName && (
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: "0.55rem" }}>
                            {walletMgmtBalance.providerOwnerName}
                          </Typography>
                        )}
                      </Box>
                      <Stack alignItems="flex-end" spacing={0.25}>
                        <Typography
                          variant="h4"
                          fontWeight={800}
                          sx={{ color: isDebt ? "#ff8a80" : "#b3e5fc", lineHeight: 1 }}
                        >
                          {wb.toFixed(3)}
                          <Typography component="span" variant="caption" sx={{ color: "rgba(255,255,255,0.5)", ml: 0.5 }}>JOD</Typography>
                        </Typography>
                        <Chip
                          label={isDebt ? t("offers@settlements_walletDebt") : t("offers@settlements_walletCredit")}
                          size="small"
                          sx={{
                            height: 16,
                            bgcolor: isDebt ? "#ff5252" : "rgba(255,255,255,0.15)",
                            color: "white",
                            fontWeight: 800,
                            fontSize: "0.55rem",
                            "& .MuiChip-label": { px: 0.75 },
                          }}
                        />
                      </Stack>
                    </Stack>
                    {/* Deposited / Deducted summary */}
                    <Stack direction="row" spacing={1}>
                      <Box sx={{ flex: 1, px: 1, py: 0.5, borderRadius: 1, bgcolor: "rgba(255,255,255,0.08)", textAlign: "center" }}>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.55rem", display: "block" }}>{t("offers@settlements_walletTotalDeposited")}</Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ color: "#a5d6a7", fontSize: "0.68rem" }}>
                          +{(walletMgmtBalance?.totalDeposited ?? 0).toFixed(3)}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, px: 1, py: 0.5, borderRadius: 1, bgcolor: "rgba(255,255,255,0.08)", textAlign: "center" }}>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.55rem", display: "block" }}>{t("offers@settlements_walletTotalDeducted")}</Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ color: "#ff8a80", fontSize: "0.68rem" }}>
                          -{(walletMgmtBalance?.totalDeducted ?? 0).toFixed(3)}
                        </Typography>
                      </Box>
                    </Stack>
                    {/* Credit limit row */}
                    <Stack direction="row" spacing={1}>
                      <Box sx={{ flex: 1, px: 1, py: 0.5, borderRadius: 1, bgcolor: "rgba(255,255,255,0.08)", textAlign: "center" }}>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.55rem", display: "block" }}>{t("offers@settlements_walletCreditLimit")}</Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ color: "#ffe082", fontSize: "0.68rem" }}>
                          {walletMgmtBalance?.walletCreditLimit != null ? walletMgmtBalance.walletCreditLimit.toFixed(3) : t("offers@settlements_walletUnlimited")}
                        </Typography>
                      </Box>
                      {walletMgmtBalance?.availableCredit != null && (
                        <Box sx={{ flex: 1, px: 1, py: 0.5, borderRadius: 1, bgcolor: "rgba(255,255,255,0.08)", textAlign: "center" }}>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.55rem", display: "block" }}>{t("offers@settlements_walletAvailableCredit")}</Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ color: walletMgmtBalance.availableCredit > 0 ? "#a5d6a7" : "#ff8a80", fontSize: "0.68rem" }}>
                            {walletMgmtBalance.availableCredit.toFixed(3)}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Stack>
                );
              })()}
            </Box>

            {/* Settlement context */}
            {walletSettlement && (
              <Box sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.6rem" }}>
                      {t("offers@settlements_timeline")} · {walletSettlement.periodYear}-W{walletSettlement.periodWeek}
                    </Typography>
                    <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem" }}>{t("offers@settlements_netBalance")}</Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ color: providerOwesCable(walletSettlement) ? "#80d8ff" : "#ffcc80", fontSize: "0.7rem" }}>
                          {getSettlementAmount(walletSettlement).toFixed(3)} JOD
                        </Typography>
                      </Stack>
                      {walletSettlement.walletApplied > 0 && (
                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem" }}>{t("offers@settlements_walletApplied")}</Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ color: "#b2dfdb", fontSize: "0.7rem" }}>
                            -{walletSettlement.walletApplied.toFixed(3)} JOD
                          </Typography>
                        </Stack>
                      )}
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.65rem" }}>{t("offers@settlements_outstanding")}</Typography>
                        <Typography variant="caption" fontWeight={800} sx={{ color: walletSettlement.outstandingAmount > 0 ? "#ff8a80" : "#a5d6a7", fontSize: "0.7rem" }}>
                          {walletSettlement.outstandingAmount.toFixed(3)} JOD
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    {getStatusChip(walletSettlement.settlementStatus)}
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: "0.55rem", mt: 0.5 }}>
                      #{walletSettlement.id}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>

        <DialogContent sx={{ p: 0, overflowY: "auto", flex: 1 }}>
          <Box sx={{ p: 3, pb: 2 }}>
            {/* Add Wallet Deposit Form */}
            <Paper
              elevation={0}
              sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "primary.200", overflow: "hidden" }}
            >
              <Box sx={{ px: 2.5, py: 1.5, bgcolor: "primary.50", borderBottom: "1px solid", borderColor: "primary.100" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AddCircleOutlineIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight={700} color="primary.dark">
                    {t("offers@settlements_walletAddNew")}
                  </Typography>
                </Stack>
              </Box>
              <Box sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                  {/* Type selector as button group */}
                  <Stack direction="row" spacing={1}>
                    {([
                      { value: 1, label: t("offers@settlements_walletDeposit"), color: "success" },
                      { value: 3, label: t("offers@settlements_walletRefund"), color: "warning" },
                      { value: 4, label: t("offers@settlements_walletAdjustment"), color: "error" },
                    ] as { value: WalletTransactionType; label: string; color: "success" | "warning" | "error" }[]).map((opt) => (
                      <Button
                        key={opt.value}
                        size="small"
                        variant={walletDepositType === opt.value ? "contained" : "outlined"}
                        color={opt.color}
                        onClick={() => setWalletDepositType(opt.value)}
                        sx={{ flex: 1, fontWeight: 700, borderRadius: 1.5, textTransform: "none" }}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="flex-start">
                    <TextField
                      label={t("offers@settlements_walletAmount")}
                      type="number"
                      value={walletDepositAmount}
                      onChange={(e) => setWalletDepositAmount(e.target.value)}
                      fullWidth
                      size="small"
                      InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" fontWeight={700}>JOD</Typography></InputAdornment> }}
                      inputProps={{ min: 0.001, step: 0.001 }}
                    />
                    <TextField
                      label={t("offers@note")}
                      value={walletDepositNote}
                      onChange={(e) => setWalletDepositNote(e.target.value)}
                      fullWidth
                      size="small"
                      placeholder={t("offers@settlements_walletNotePlaceholder")}
                    />
                  </Stack>

                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      onClick={handleAddWalletDeposit}
                      disabled={addWalletDepositMutation.isPending || !walletDepositAmount || parseFloat(walletDepositAmount) <= 0}
                      startIcon={addWalletDepositMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <AddCircleOutlineIcon />}
                      sx={{
                        background: "linear-gradient(135deg, #0277bd 0%, #01579b 100%)",
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 3,
                      }}
                    >
                      {addWalletDepositMutation.isPending ? t("updating") : t("offers@settlements_walletAddNew")}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Paper>
          </Box>

          {/* Transaction History */}
          <Box sx={{ px: 3, pb: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>{t("offers@settlements_walletHistory")}</Typography>
              {walletHistory && walletHistory.length > 0 && (
                <Chip
                  label={walletHistory.length}
                  size="small"
                  sx={{ height: 18, "& .MuiChip-label": { px: 0.75, fontSize: "0.65rem", fontWeight: 700 } }}
                />
              )}
            </Stack>

            {walletHistoryLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress size={32} />
              </Box>
            ) : !walletHistory || walletHistory.length === 0 ? (
              <Paper elevation={0} sx={{ py: 5, textAlign: "center", bgcolor: "grey.50", borderRadius: 2, border: "1px dashed", borderColor: "grey.300" }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 36, color: "grey.300", mb: 1 }} />
                <Typography variant="body2" color="text.disabled" fontWeight={600}>
                  {t("offers@settlements_emptyTitle")}
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={1}>
                {walletHistory.map((tx) => {
                  const isDeduction = tx.transactionType === 2 || tx.transactionType === 5;
                  const color = walletTypeColor(tx.transactionType);
                  return (
                    <Paper
                      key={tx.id}
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: `${color}.200`,
                        overflow: "hidden",
                        transition: "box-shadow 0.15s",
                        "&:hover": { boxShadow: 2 },
                      }}
                    >
                      <Stack direction="row" alignItems="stretch">
                        {/* Colored left bar */}
                        <Box sx={{ width: 4, bgcolor: `${color}.main`, flexShrink: 0 }} />

                        <Stack direction="row" justifyContent="space-between" alignItems="center" flex={1} sx={{ p: 1.5, gap: 1 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" flex={1} sx={{ minWidth: 0 }}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: `${color}.100`, flexShrink: 0 }}>
                              <Typography variant="caption" fontWeight={800} color={`${color}.dark`} sx={{ fontSize: "0.8rem" }}>
                                {isDeduction ? "−" : "+"}
                              </Typography>
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <Chip
                                  label={walletTypeLabel(tx.transactionType)}
                                  size="small"
                                  color={color}
                                  variant="filled"
                                  sx={{ height: 20, fontWeight: 700, "& .MuiChip-label": { px: 0.75, fontSize: "0.65rem" } }}
                                />
                                {tx.settlementId && (
                                  <Chip
                                    label={`Settlement #${tx.settlementId}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 20, "& .MuiChip-label": { px: 0.75, fontSize: "0.6rem" } }}
                                  />
                                )}
                              </Stack>
                              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.3 }}>
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                                  {tx.createdByUserName}
                                </Typography>
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem" }}>·</Typography>
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                                  {formatDate(tx.createdAt)}
                                </Typography>
                              </Stack>
                              {tx.note && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", display: "block", mt: 0.25, fontStyle: "italic" }}>
                                  "{tx.note}"
                                </Typography>
                              )}
                            </Box>
                          </Stack>

                          {/* Amount */}
                          <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight={800}
                              color={isDeduction ? "error.dark" : `${color}.dark`}
                              sx={{ lineHeight: 1 }}
                            >
                              {isDeduction ? "−" : "+"}{tx.amount.toFixed(3)}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem" }}>JOD</Typography>
                          </Box>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        </DialogContent>

        <Divider sx={{ flexShrink: 0 }} />
        <DialogActions sx={{ px: 3, py: 2, flexShrink: 0 }}>
          <Button onClick={() => setWalletDialogOpen(false)} size="large" variant="outlined">
            {t("close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Credit Limit Dialog ── */}
      <Dialog
        open={creditLimitDialogOpen}
        onClose={() => setCreditLimitDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        {/* Header with stats built-in */}
        <Box sx={{ background: "linear-gradient(135deg, #e65100 0%, #ef6c00 50%, #f57c00 100%)", p: 0, color: "white", position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", top: -25, right: -25, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />

          {/* Title row */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
                <CreditScoreIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} color="white" lineHeight={1.2}>{t("offers@settlements_walletCreditLimit")}</Typography>
                {creditLimitProvider && (
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mt: 0.25 }}>
                    {creditLimitProvider.providerName} · #{creditLimitProvider.providerId}
                  </Typography>
                )}
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setCreditLimitDialogOpen(false)} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.12)" } }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          {/* Stats cards inside header */}
          {creditLimitBalanceLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} sx={{ color: "rgba(255,255,255,0.6)" }} />
            </Box>
          ) : creditLimitBalance && (
            <Stack direction="row" spacing={1.5} sx={{ px: 3, pb: 2.5 }}>
              {/* Current Limit */}
              <Box sx={{ flex: 1, p: 1.75, borderRadius: 2, bgcolor: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.12)", textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                  {t("offers@settlements_walletCreditLimit")}
                </Typography>
                <Typography variant="h5" fontWeight={900} sx={{ color: "white", mt: 0.5, lineHeight: 1 }}>
                  {creditLimitBalance.walletCreditLimit != null ? creditLimitBalance.walletCreditLimit.toFixed(3) : "∞"}
                </Typography>
                {creditLimitBalance.walletCreditLimit != null && (
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>JOD</Typography>
                )}
                {creditLimitBalance.walletCreditLimit == null && (
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>{t("offers@settlements_walletUnlimited")}</Typography>
                )}
              </Box>
              {/* Wallet Balance */}
              <Box sx={{ flex: 1, p: 1.75, borderRadius: 2, bgcolor: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.12)", textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                  {t("offers@settlements_walletBalance")}
                </Typography>
                <Typography variant="h5" fontWeight={900} sx={{ color: creditLimitBalance.walletBalance < 0 ? "#ff8a80" : "#a5d6a7", mt: 0.5, lineHeight: 1 }}>
                  {creditLimitBalance.walletBalance.toFixed(3)}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>JOD</Typography>
              </Box>
              {/* Available Credit */}
              <Box sx={{ flex: 1, p: 1.75, borderRadius: 2, bgcolor: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.12)", textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                  {t("offers@settlements_walletAvailableCredit")}
                </Typography>
                <Typography variant="h5" fontWeight={900} sx={{ color: (creditLimitBalance.availableCredit ?? 0) > 0 ? "#a5d6a7" : "#ff8a80", mt: 0.5, lineHeight: 1 }}>
                  {creditLimitBalance.availableCredit != null ? creditLimitBalance.availableCredit.toFixed(3) : "∞"}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                  {creditLimitBalance.availableCredit != null ? "JOD" : t("offers@settlements_walletUnlimited")}
                </Typography>
              </Box>
            </Stack>
          )}
        </Box>

        {/* Form */}
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="overline" fontWeight={700} color="text.disabled" sx={{ letterSpacing: 1, fontSize: "0.65rem", display: "block", mb: 2 }}>
            {t("offers@settlements_walletSetLimit")}
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              label={t("offers@settlements_walletCreditLimit")}
              type="number"
              value={creditLimitValue}
              onChange={(e) => setCreditLimitValue(e.target.value)}
              disabled={creditLimitUnlimited}
              fullWidth
              inputProps={{ min: 0, step: 0.001 }}
              InputProps={{
                endAdornment: <InputAdornment position="end"><Typography variant="caption" fontWeight={700}>JOD</Typography></InputAdornment>,
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            />
            <Paper
              elevation={0}
              onClick={() => setCreditLimitUnlimited(!creditLimitUnlimited)}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: "2px solid",
                borderColor: creditLimitUnlimited ? "warning.main" : "grey.200",
                bgcolor: creditLimitUnlimited ? "warning.50" : "background.paper",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": { borderColor: "warning.main", bgcolor: "warning.50" },
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: creditLimitUnlimited ? "warning.main" : "grey.100", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                    <Typography variant="h6" fontWeight={900} sx={{ color: creditLimitUnlimited ? "white" : "text.disabled" }}>∞</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={700} color={creditLimitUnlimited ? "warning.dark" : "text.primary"}>
                      {t("offers@settlements_walletUnlimited")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                      {t("offers@settlements_unlimitedDesc")}
                    </Typography>
                  </Box>
                </Stack>
                <Switch checked={creditLimitUnlimited} color="warning" />
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <Box sx={{ px: 3, pb: 3 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            color="warning"
            onClick={handleSetCreditLimit}
            disabled={setCreditLimitMutation.isPending || (!creditLimitUnlimited && !creditLimitValue)}
            startIcon={setCreditLimitMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <CreditScoreIcon />}
            sx={{
              fontWeight: 800,
              fontSize: "0.95rem",
              borderRadius: 2.5,
              py: 1.5,
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(230,81,0,0.3)",
              "&:hover": { boxShadow: "0 6px 20px rgba(230,81,0,0.4)" },
            }}
          >
            {setCreditLimitMutation.isPending ? t("updating") : t("offers@settlements_walletSetLimit")}
          </Button>
        </Box>
      </Dialog>

      {/* ── Settlement History Dialog ── */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" } }}
      >
        <Box sx={{ background: "linear-gradient(135deg, #1a237e 0%, #283593 55%, #1565c0 100%)", p: 3, color: "white", position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <Box sx={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <HistoryIcon sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} color="white">{t("offers@settlements_providerHistory")}</Typography>
                {historyProvider && (
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>
                    {historyProvider.providerName} · #{historyProvider.providerId}
                  </Typography>
                )}
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setHistoryDialogOpen(false)} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.1)" } }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={{ p: 0, overflowY: "auto", flex: 1 }}>
          {providerHistoryLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={36} />
            </Box>
          ) : !providerHistory || providerHistory.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <HistoryIcon sx={{ fontSize: 48, color: "grey.300", mb: 1 }} />
              <Typography variant="body1" color="text.disabled" fontWeight={600}>{t("offers@settlements_emptyTitle")}</Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              {/* Summary row */}
              <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, px: 1 }}>
                {(() => {
                  const totalCommission = providerHistory.reduce((s, r) => s + r.partnerCommissionAmount, 0);
                  const totalOffer = providerHistory.reduce((s, r) => s + r.offerPaymentAmount, 0);
                  const totalWallet = providerHistory.reduce((s, r) => s + r.walletApplied, 0);
                  const paidCnt = providerHistory.filter((r) => r.settlementStatus === 3).length;
                  const pendingCnt = providerHistory.filter((r) => r.settlementStatus === 1).length;
                  return [
                    { label: t("offers@totalSettlements"), value: providerHistory.length, color: "#1565c0", bg: "#e3f2fd" },
                    { label: t("offers@paid"), value: paidCnt, color: "#2e7d32", bg: "#e8f5e9" },
                    { label: t("offers@pending"), value: pendingCnt, color: "#e65100", bg: "#fff3e0" },
                    { label: t("offers@settlements_commission"), value: totalCommission.toFixed(3), color: "#2e7d32", bg: "#e8f5e9" },
                    { label: t("offers@settlements_offerPayment"), value: totalOffer.toFixed(3), color: "#c62828", bg: "#ffebee" },
                    ...(totalWallet > 0 ? [{ label: t("offers@settlements_walletApplied"), value: totalWallet.toFixed(3), color: "#0277bd", bg: "#e1f5fe" }] : []),
                  ].map(({ label, value, color, bg }) => (
                    <Paper key={label} elevation={0} sx={{ flex: 1, p: 1.5, bgcolor: bg, borderRadius: 2, textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Typography>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ color, lineHeight: 1, mt: 0.5 }}>{value}</Typography>
                    </Paper>
                  ));
                })()}
              </Stack>

              {/* Settlement list */}
              {providerHistory.map((s) => {
                const sCfg = STATUS_CFG[s.settlementStatus];
                const sColor = sCfg?.color === "success" ? "#2e7d32" : sCfg?.color === "warning" ? "#e65100" : "#c62828";
                const sBg = sCfg?.color === "success" ? "#e8f5e9" : sCfg?.color === "warning" ? "#fff3e0" : "#ffebee";
                const sOwes = s.netBalance < 0;
                const sOwed = s.netBalance > 0;
                return (
                  <Paper
                    key={s.id}
                    elevation={0}
                    sx={{
                      mb: 1.5,
                      borderRadius: 2.5,
                      border: "1px solid",
                      borderColor: "grey.200",
                      overflow: "hidden",
                      transition: "all 0.15s",
                      "&:hover": { boxShadow: 2 },
                    }}
                  >
                    <Box sx={{ height: 3, bgcolor: sColor }} />
                    <Stack direction="row" alignItems="center" sx={{ px: 2.5, py: 1.75 }}>
                      {/* Period */}
                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ width: 130, flexShrink: 0 }}>
                        <Typography variant="body2" fontWeight={800}>{s.periodYear}</Typography>
                        <Chip label={`W${s.periodWeek}`} size="small" color="primary" sx={{ height: 22, fontWeight: 800, "& .MuiChip-label": { px: 0.75, fontSize: "0.72rem" } }} />
                      </Stack>

                      {/* Net Balance */}
                      <Box sx={{ flex: 1, textAlign: "center" }}>
                        <Typography variant="subtitle1" fontWeight={800} color={sOwes ? "#0277bd" : sOwed ? "#e65100" : "#2e7d32"}>
                          {Math.abs(s.netBalance).toFixed(3)}
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>JOD</Typography>
                        </Typography>
                        <Typography variant="caption" fontWeight={600} sx={{ fontSize: "0.6rem", color: sOwes ? "#0277bd" : sOwed ? "#e65100" : "#2e7d32" }}>
                          {sOwes ? t("offers@settlements_providerPaysCable") : sOwed ? t("offers@settlements_cablePaysProvider") : t("offers@settlements_settled")}
                        </Typography>
                      </Box>

                      {/* Commission */}
                      <Stack alignItems="center" sx={{ width: 100 }}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.58rem", textTransform: "uppercase" }}>{t("offers@commission")}</Typography>
                        <Typography variant="body2" fontWeight={700}>{s.partnerCommissionAmount.toFixed(3)}</Typography>
                      </Stack>

                      {/* Wallet Applied */}
                      {s.walletApplied > 0 && (
                        <Stack alignItems="center" sx={{ width: 100 }}>
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.58rem", textTransform: "uppercase" }}>{t("offers@settlements_walletApplied")}</Typography>
                          <Typography variant="body2" fontWeight={700} color="info.dark">{s.walletApplied.toFixed(3)}</Typography>
                        </Stack>
                      )}

                      {/* Outstanding */}
                      {s.outstandingAmount > 0 && (
                        <Stack alignItems="center" sx={{ width: 100 }}>
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.58rem", textTransform: "uppercase" }}>{t("offers@settlements_outstanding")}</Typography>
                          <Typography variant="body2" fontWeight={700} color="error.dark">{s.outstandingAmount.toFixed(3)}</Typography>
                        </Stack>
                      )}

                      {/* Transactions count */}
                      <Stack alignItems="center" sx={{ width: 60 }}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.58rem", textTransform: "uppercase" }}>TX</Typography>
                        <Typography variant="body2" fontWeight={700}>{s.partnerTransactionCount + s.offerTransactionCount}</Typography>
                      </Stack>

                      {/* Status */}
                      <Box sx={{ width: 90, textAlign: "center" }}>
                        <Chip
                          label={t(`offers@${sCfg?.label_key}`)}
                          size="small"
                          sx={{ bgcolor: sBg, color: sColor, fontWeight: 800, "& .MuiChip-label": { px: 1 } }}
                        />
                      </Box>

                      {/* View */}
                      <Tooltip title={t("offers@viewDetails")}>
                        <IconButton size="small" onClick={(e) => { handleViewDetails(e, s); setHistoryDialogOpen(false); }}>
                          <VisibilityIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <Divider sx={{ flexShrink: 0 }} />
        <DialogActions sx={{ px: 3, py: 2, flexShrink: 0 }}>
          <Button onClick={() => setHistoryDialogOpen(false)} size="large" variant="outlined">{t("close")}</Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
