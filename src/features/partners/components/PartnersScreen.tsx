import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Stack,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Skeleton,
  Grid,
  InputAdornment,
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import BlockIcon from "@mui/icons-material/Block";
import HandshakeIcon from "@mui/icons-material/Handshake";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PaymentIcon from "@mui/icons-material/Payment";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EvStationIcon from "@mui/icons-material/EvStation";
import StoreIcon from "@mui/icons-material/Store";
import FilterListIcon from "@mui/icons-material/FilterList";
import HistoryIcon from "@mui/icons-material/History";
import { useQuery } from "@tanstack/react-query";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  usePartnerAgreements,
  useCreatePartnerAgreement,
  useUpdatePartnerAgreement,
  useDeactivatePartnerAgreement,
  useProviderBalance,
  usePartnerWalletDeposit,
  useSetCreditLimit,
} from "../hooks/use-partners";
import type {
  PartnerAgreementDto,
  PartnerProviderType,
  CreatePartnerAgreementRequest,
} from "../types/api";
import type { WalletTransactionType } from "../../offers/types/api";
import { getAllConversionRates } from "../../offers/services/offers-service";
import { getAllChargingPoints } from "../../charge-management/services/charge-management-service";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";

export default function PartnersScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [activeFilter, setActiveFilter] = useState<boolean | "">("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerAgreementDto | null>(null);
  const [deactivateId, setDeactivateId] = useState<number | null>(null);
  const [balanceTarget, setBalanceTarget] = useState<PartnerAgreementDto | null>(null);
  const [walletAmount, setWalletAmount] = useState<string>("");
  const [walletNote, setWalletNote] = useState<string>("");
  const [walletType, setWalletType] = useState<WalletTransactionType>(1);
  const [creditLimitValue, setCreditLimitValue] = useState<string>("");
  const [creditLimitUnlimited, setCreditLimitUnlimited] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreatePartnerAgreementRequest>({
    providerType: "ChargingPoint",
    providerId: 0,
    commissionPercentage: 10,
    pointsRewardPercentage: 5,
    codeExpirySeconds: 60,
    minimumTransactionAmount: null,
    isActive: true,
    note: "",
  });

  const { data: agreements = [], isLoading, refetch } = usePartnerAgreements(
    activeFilter === "" ? undefined : { isActive: activeFilter }
  );
  const createMutation = useCreatePartnerAgreement();
  const updateMutation = useUpdatePartnerAgreement();
  const deactivateMutation = useDeactivatePartnerAgreement();
  const walletDepositMutation = usePartnerWalletDeposit();
  const setCreditLimitMutation = useSetCreditLimit();
  const { data: balanceData, isLoading: isLoadingBalance, refetch: refetchBalance } = useProviderBalance(
    balanceTarget?.providerType ?? null,
    balanceTarget?.providerId ?? null
  );

  // Always load service providers for owner lookup in the table
  const { data: allServiceProviders = [] } = useQuery({
    queryKey: ["service-providers-all"],
    queryFn: () => getAllServiceProviders(),
    staleTime: 5 * 60 * 1000,
  });

  const ownerByProviderId = useMemo(() => {
    const map = new Map<string, { ownerId: number; ownerName: string }>();
    allServiceProviders.forEach((sp) => {
      map.set(`ServiceProvider-${sp.id}`, { ownerId: sp.ownerId, ownerName: sp.ownerName });
    });
    return map;
  }, [allServiceProviders]);

  const { data: conversionRates = [] } = useQuery({
    queryKey: ["conversion-rates"],
    queryFn: () => getAllConversionRates(),
    enabled: formOpen,
  });
  const { data: stations = [] } = useQuery({
    queryKey: ["charge-management", "stations-list"],
    queryFn: ({ signal }) =>
      getAllChargingPoints(
        { name: null, chargerPointTypeId: null, cityName: null },
        signal
      ),
    enabled: formOpen && formData.providerType === "ChargingPoint",
  });
  const { data: serviceProviders = [] } = useQuery({
    queryKey: ["service-providers", "list"],
    queryFn: () => getAllServiceProviders(),
    enabled: formOpen && formData.providerType === "ServiceProvider",
  });

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return agreements.slice(start, start + paginationModel.pageSize);
  }, [agreements, paginationModel.page, paginationModel.pageSize]);

  const handleAdd = useCallback(() => {
    setEditing(null);
    setFormData({
      providerType: "ChargingPoint",
      providerId: 0,
      commissionPercentage: 10,
      pointsRewardPercentage: 5,
      pointsConversionRateId: conversionRates[0]?.id ?? null,
      codeExpirySeconds: 60,
      minimumTransactionAmount: null,
      isActive: true,
      note: "",
    });
    setFormOpen(true);
  }, [conversionRates]);

  const handleEdit = useCallback((row: PartnerAgreementDto) => {
    setEditing(row);
    setFormData({
      providerType: row.providerType,
      providerId: row.providerId,
      commissionPercentage: row.commissionPercentage,
      pointsRewardPercentage: row.pointsRewardPercentage,
      pointsConversionRateId: row.pointsConversionRateId ?? null,
      codeExpirySeconds: row.codeExpirySeconds,
      minimumTransactionAmount: row.minimumTransactionAmount ?? null,
      isActive: row.isActive,
      note: row.note ?? "",
    });
    setFormOpen(true);
  }, []);

  const handleFormSubmit = useCallback(() => {
    if (formData.providerId <= 0) {
      openErrorSnackbar({ message: t("partners@selectProvider") });
      return;
    }
    if (editing) {
      updateMutation.mutate(
        {
          id: editing.id,
          data: {
            commissionPercentage: formData.commissionPercentage,
            pointsRewardPercentage: formData.pointsRewardPercentage,
            pointsConversionRateId: formData.pointsConversionRateId,
            codeExpirySeconds: formData.codeExpirySeconds,
            minimumTransactionAmount: formData.minimumTransactionAmount || null,
            isActive: formData.isActive,
            note: formData.note || null,
          },
        },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("partners@updated") });
            setFormOpen(false);
            setEditing(null);
          },
          onError: (e: Error) =>
            openErrorSnackbar({ message: e?.message ?? t("loadingFailed") }),
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("partners@created") });
          setFormOpen(false);
        },
        onError: (e: Error) =>
          openErrorSnackbar({ message: e?.message ?? t("loadingFailed") }),
      });
    }
  }, [
    editing,
    formData,
    updateMutation,
    createMutation,
    openSuccessSnackbar,
    openErrorSnackbar,
    t,
  ]);

  const handleOpenBalance = useCallback((row: PartnerAgreementDto) => {
    setBalanceTarget(row);
    setWalletAmount("");
    setWalletNote("");
    setWalletType(1);
    setCreditLimitValue("");
    setCreditLimitUnlimited(false);
  }, []);

  const handleWalletDeposit = useCallback(() => {
    if (!balanceTarget) return;
    const amount = parseFloat(walletAmount);
    if (isNaN(amount) || amount <= 0) {
      openErrorSnackbar({ message: t("partners@invalidAmount") });
      return;
    }
    walletDepositMutation.mutate(
      { providerType: balanceTarget.providerType, providerId: balanceTarget.providerId, amount, transactionType: walletType, note: walletNote || undefined },
      {
        onSuccess: () => { openSuccessSnackbar({ message: t("partners@walletDepositSuccess") }); setWalletAmount(""); setWalletNote(""); },
        onError: (e: Error) => openErrorSnackbar({ message: e?.message ?? t("loadingFailed") }),
      }
    );
  }, [balanceTarget, walletAmount, walletType, walletNote, walletDepositMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleSetCreditLimit = useCallback(() => {
    if (!balanceTarget) return;
    const limit = creditLimitUnlimited ? null : parseFloat(creditLimitValue);
    if (!creditLimitUnlimited && (isNaN(limit as number) || (limit as number) <= 0)) {
      openErrorSnackbar({ message: t("partners@invalidCreditLimit") });
      return;
    }
    setCreditLimitMutation.mutate(
      { providerType: balanceTarget.providerType, providerId: balanceTarget.providerId, creditLimit: limit },
      {
        onSuccess: () => { openSuccessSnackbar({ message: t("partners@creditLimitSet") }); setCreditLimitValue(""); },
        onError: (e: Error) => openErrorSnackbar({ message: e?.message ?? t("loadingFailed") }),
      }
    );
  }, [balanceTarget, creditLimitValue, creditLimitUnlimited, setCreditLimitMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleDeactivate = useCallback(
    (row: PartnerAgreementDto) => setDeactivateId(row.id),
    []
  );
  const confirmDeactivate = useCallback(() => {
    if (deactivateId == null) return;
    deactivateMutation.mutate(deactivateId, {
      onSuccess: () => {
        openSuccessSnackbar({ message: t("partners@deactivated") });
        setDeactivateId(null);
      },
      onError: (e: Error) =>
        openErrorSnackbar({ message: e?.message ?? t("loadingFailed") }),
    });
  }, [
    deactivateId,
    deactivateMutation,
    openSuccessSnackbar,
    openErrorSnackbar,
    t,
  ]);

  const providerOptions =
    formData.providerType === "ChargingPoint"
      ? stations.map((s) => ({ id: s.id, name: s.name ?? `Station ${s.id}` }))
      : serviceProviders.map((s) => ({ id: s.id, name: s.name ?? `Provider ${s.id}` }));

  const totalActive = agreements.filter((a) => a.isActive).length;
  const totalChargingPoints = agreements.filter((a) => a.providerType === "ChargingPoint").length;
  const totalServiceProviders = agreements.filter((a) => a.providerType === "ServiceProvider").length;

  const columns: GridColDef<PartnerAgreementDto>[] = [
    { field: "id", headerName: t("id"), width: 60, align: "center", headerAlign: "center" },
    {
      field: "providerName",
      headerName: t("partners@provider"),
      flex: 1,
      minWidth: 180,
      renderCell: (params) => {
        const name = params.row.providerName ?? `#${params.row.providerId}`;
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 28, height: 28, bgcolor: params.row.providerType === "ChargingPoint" ? "primary.main" : "secondary.main", fontSize: "0.75rem" }}>
              {params.row.providerType === "ChargingPoint" ? <EvStationIcon sx={{ fontSize: 16 }} /> : <StoreIcon sx={{ fontSize: 16 }} />}
            </Avatar>
            <Typography variant="body2" fontWeight={600}>{name}</Typography>
          </Stack>
        );
      },
    },
    {
      field: "ownerName",
      headerName: t("partners@owner"),
      width: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const key = `${params.row.providerType}-${params.row.providerId}`;
        const owner = ownerByProviderId.get(key);
        return owner ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 24, height: 24, fontSize: 11, fontWeight: 700, bgcolor: "grey.400" }}>
              {owner.ownerName.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2" noWrap>{owner.ownerName}</Typography>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.disabled">—</Typography>
        );
      },
    },
    {
      field: "providerType",
      headerName: t("partners@type"),
      width: 150,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value === "ChargingPoint" ? t("chargingPoint") : t("serviceProvider")}
          color={params.value === "ChargingPoint" ? "primary" : "secondary"}
          variant="outlined"
          icon={params.value === "ChargingPoint" ? <EvStationIcon /> : <StoreIcon />}
        />
      ),
    },
    {
      field: "commissionPercentage",
      headerName: t("partners@commission"),
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip label={`${params.value}%`} size="small" color="info" variant="filled" sx={{ fontWeight: 700 }} />
      ),
    },
    {
      field: "pointsRewardPercentage",
      headerName: t("partners@pointsReward"),
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip label={`${params.value}%`} size="small" color="warning" variant="filled" sx={{ fontWeight: 700 }} />
      ),
    },
    {
      field: "codeExpirySeconds",
      headerName: t("partners@codeExpiry"),
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" fontWeight={700}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">{t("seconds")}</Typography>
        </Box>
      ),
    },
    {
      field: "minimumTransactionAmount",
      headerName: t("partners@minimumAmount"),
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        params.value ? (
          <Typography variant="body2" fontWeight={700}>{params.value.toFixed(3)} <Typography component="span" variant="caption" color="text.secondary">JOD</Typography></Typography>
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        )
      ),
    },
    {
      field: "isActive",
      headerName: t("partners@active"),
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value ? t("active") : t("inactive")}
          color={params.value ? "success" : "default"}
          variant={params.value ? "filled" : "outlined"}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 160,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <Tooltip title={t("partners@settlementHistory")}>
            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); navigate(`/provider-settlements?providerType=${params.row.providerType}&providerId=${params.row.providerId}&name=${encodeURIComponent(params.row.providerName ?? params.row.providerId)}`); }}>
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("partners@creditBalance")}>
            <IconButton size="small" color="info" onClick={(e) => { e.stopPropagation(); handleOpenBalance(params.row); }}>
              <AccountBalanceWalletIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("edit")}>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEdit(params.row); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.isActive && (
            <Tooltip title={t("partners@deactivate")}>
              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeactivate(params.row); }}>
                <BlockIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

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
        <Box sx={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -40, left: -20, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "flex-start" }} spacing={2} sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <HandshakeIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} color="white" lineHeight={1.2}>{t("partners")}</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5 }}>{t("partners@subtitle")}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              size="small"
              sx={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)", borderColor: "white" } }}
            >
              {t("refresh")}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, fontWeight: 700, boxShadow: "none" }}
            >
              {t("partners@add")}
            </Button>
          </Stack>
        </Stack>

        {/* KPI Cards */}
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          {[
            { label: t("total"), value: isLoading ? "—" : agreements.length, icon: <HandshakeIcon /> },
            { label: t("active"), value: isLoading ? "—" : totalActive, icon: <CheckCircleOutlineIcon /> },
            { label: t("chargingPoint"), value: isLoading ? "—" : totalChargingPoints, icon: <EvStationIcon /> },
            { label: t("serviceProvider"), value: isLoading ? "—" : totalServiceProviders, icon: <StoreIcon /> },
          ].map((card) => (
            <Box
              key={card.label}
              sx={{ background: "rgba(255,255,255,0.13)", borderRadius: 2, px: 2, py: 1.5, minWidth: 110, flex: "1 1 auto", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Box sx={{ opacity: 0.75, display: "flex", fontSize: 16 }}>{card.icon}</Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{card.label}</Typography>
              </Stack>
              {isLoading ? (
                <Skeleton variant="rounded" width={40} height={28} sx={{ bgcolor: "rgba(255,255,255,0.15)" }} />
              ) : (
                <Typography variant="h5" fontWeight={800} color="white" lineHeight={1}>{card.value}</Typography>
              )}
            </Box>
          ))}
        </Stack>
      </Box>

      {/* PTR hint */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: "#e3f2fd", borderRadius: 2, borderLeft: "4px solid", borderColor: "primary.main" }}>
        <Typography variant="body2" color="primary.dark">{t("partners@cablePartnerHint")}</Typography>
      </Paper>

      {/* ── Filter Bar ── */}
      <Paper elevation={1} sx={{ borderRadius: 2, mb: 2, overflow: "hidden" }}>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FilterListIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight={700} color="text.secondary">{t("filter")}</Typography>
          </Stack>
        </Box>
        <Box sx={{ px: 2.5, py: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t("partners@status")}</InputLabel>
            <Select
              value={activeFilter === "" ? "all" : activeFilter}
              label={t("partners@status")}
              onChange={(e) => setActiveFilter(e.target.value === "all" ? "" : (e.target.value as boolean))}
            >
              <MenuItem value="all">{t("all")}</MenuItem>
              <MenuItem value={true as unknown as string}>{t("active")}</MenuItem>
              <MenuItem value={false as unknown as string}>{t("inactive")}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* ── Shimmer / Table ── */}
      {isLoading ? (
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
          {/* Header row */}
          <Box sx={{ px: 2, py: 1.5, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider", display: "flex", gap: 2 }}>
            {[60, 200, 140, 90, 100, 90, 80, 100].map((w, i) => (
              <Skeleton key={i} variant="rounded" width={w} height={18} />
            ))}
          </Box>
          {[...Array(6)].map((_, i) => (
            <Box key={i} sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 2 }}>
              <Skeleton variant="rounded" width={60} height={18} />
              <Stack direction="row" spacing={1} alignItems="center" sx={{ width: 200 }}>
                <Skeleton variant="circular" width={28} height={28} />
                <Skeleton variant="rounded" width={140} height={18} />
              </Stack>
              <Skeleton variant="rounded" width={110} height={24} sx={{ borderRadius: 10 }} />
              <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: 10 }} />
              <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: 10 }} />
              <Skeleton variant="rounded" width={60} height={36} />
              <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: 10 }} />
              <Stack direction="row" spacing={0.5}>
                <Skeleton variant="circular" width={28} height={28} />
                <Skeleton variant="circular" width={28} height={28} />
                <Skeleton variant="circular" width={28} height={28} />
              </Stack>
            </Box>
          ))}
        </Paper>
      ) : (
        <AppDataGrid<PartnerAgreementDto>
          data={paginatedData}
          columns={columns}
          loading={false}
          getRowId={(row) => row.id}
          disablePagination={false}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          total={agreements.length}
        />
      )}

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
        {/* Header */}
        <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 36, height: 36, bgcolor: editing ? "warning.100" : "primary.100", color: editing ? "warning.dark" : "primary.dark" }}>
              {editing ? <EditIcon sx={{ fontSize: 18 }} /> : <AddIcon sx={{ fontSize: 18 }} />}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{editing ? t("partners@edit") : t("partners@add")}</Typography>
              {editing && <Typography variant="caption" color="text.secondary">{editing.providerName}</Typography>}
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => setFormOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 3 }}>
          <Stack spacing={3}>
            {/* Section: Provider */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {t("partners@providerType")}
              </Typography>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1}>
                  {(["ChargingPoint", "ServiceProvider"] as PartnerProviderType[]).map((type) => (
                    <Paper
                      key={type}
                      variant="outlined"
                      onClick={() => !editing && setFormData({ ...formData, providerType: type, providerId: 0 })}
                      sx={{
                        flex: 1, py: 1.5, px: 2,
                        borderRadius: 2,
                        cursor: editing ? "default" : "pointer",
                        textAlign: "center",
                        borderColor: formData.providerType === type ? "primary.main" : "divider",
                        bgcolor: formData.providerType === type ? "primary.50" : "transparent",
                        opacity: editing ? 0.6 : 1,
                        transition: "all 0.15s ease",
                        "&:hover": !editing ? { borderColor: "primary.light", bgcolor: "action.hover" } : {},
                      }}
                    >
                      <Stack alignItems="center" spacing={0.5}>
                        {type === "ChargingPoint"
                          ? <EvStationIcon sx={{ fontSize: 22, color: formData.providerType === type ? "primary.main" : "text.disabled" }} />
                          : <StoreIcon sx={{ fontSize: 22, color: formData.providerType === type ? "primary.main" : "text.disabled" }} />}
                        <Typography variant="caption" fontWeight={600} color={formData.providerType === type ? "primary.main" : "text.secondary"}>
                          {type === "ChargingPoint" ? t("chargingPoint") : t("serviceProvider")}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>

                <Autocomplete
                  fullWidth
                  size="small"
                  disabled={!!editing}
                  options={providerOptions}
                  getOptionLabel={(opt) => `#${opt.id} — ${opt.name}`}
                  filterOptions={(options, { inputValue }) => {
                    const q = inputValue.trim().toLowerCase();
                    if (!q) return options;
                    return options.filter(
                      (opt) =>
                        String(opt.id).includes(q) ||
                        (opt.name ?? "").toLowerCase().includes(q)
                    );
                  }}
                  value={providerOptions.find((p) => p.id === formData.providerId) ?? null}
                  onChange={(_, val) =>
                    setFormData({ ...formData, providerId: val?.id ?? 0 })
                  }
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  noOptionsText={t("noResults")}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t("partners@provider")}
                      placeholder={t("partners@searchProvider")}
                    />
                  )}
                  renderOption={(props, opt) => (
                    <li {...props} key={opt.id}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%", py: 0.5 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.100", color: "primary.dark", fontSize: 11, fontWeight: 700 }}>
                          {opt.id}
                        </Avatar>
                        <Typography variant="body2" noWrap>{opt.name}</Typography>
                      </Stack>
                    </li>
                  )}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Section: Commission & Rewards */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {t("partners@commissionAndRewards")}
              </Typography>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <TextField
                    size="small"
                    fullWidth
                    label={t("partners@commission")}
                    type="number"
                    value={formData.commissionPercentage}
                    onChange={(e) =>
                      setFormData({ ...formData, commissionPercentage: parseFloat(e.target.value) || 0 })
                    }
                    inputProps={{ min: 0, max: 100, step: 0.5 }}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label={t("partners@pointsReward")}
                    type="number"
                    value={formData.pointsRewardPercentage}
                    onChange={(e) =>
                      setFormData({ ...formData, pointsRewardPercentage: parseFloat(e.target.value) || 0 })
                    }
                    inputProps={{ min: 0, max: 100, step: 0.5 }}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  />
                </Stack>
                <FormControl fullWidth size="small">
                  <InputLabel>{t("partners@conversionRate")}</InputLabel>
                  <Select
                    value={formData.pointsConversionRateId ?? ""}
                    label={t("partners@conversionRate")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pointsConversionRateId:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  >
                    <MenuItem value="">{t("default")}</MenuItem>
                    {conversionRates.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.name} ({r.currencyCode} = {r.pointsPerUnit} pts)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            <Divider />

            {/* Section: Limits & Expiry */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {t("partners@limitsAndExpiry")}
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  size="small"
                  fullWidth
                  label={t("partners@codeExpiry")}
                  type="number"
                  value={formData.codeExpirySeconds}
                  onChange={(e) =>
                    setFormData({ ...formData, codeExpirySeconds: parseInt(e.target.value, 10) || 60 })
                  }
                  InputProps={{ endAdornment: <InputAdornment position="end">{t("seconds")}</InputAdornment> }}
                />
                <TextField
                  size="small"
                  fullWidth
                  label={t("partners@minimumAmount")}
                  type="number"
                  value={formData.minimumTransactionAmount ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, minimumTransactionAmount: e.target.value ? parseFloat(e.target.value) : null })
                  }
                  InputProps={{ endAdornment: <InputAdornment position="end">JOD</InputAdornment> }}
                  inputProps={{ min: 0, step: 0.001 }}
                  helperText={t("partners@minimumAmountHint")}
                />
              </Stack>
            </Box>

            {/* Active toggle (edit only) + Note */}
            {editing && (
              <Paper variant="outlined" sx={{ px: 2, py: 1, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderColor: formData.isActive ? "success.light" : "divider" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {formData.isActive ? <CheckCircleOutlineIcon color="success" sx={{ fontSize: 20 }} /> : <BlockIcon color="disabled" sx={{ fontSize: 20 }} />}
                  <Typography variant="body2" fontWeight={600} color={formData.isActive ? "success.dark" : "text.secondary"}>
                    {t("partners@active")}
                  </Typography>
                </Stack>
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  color="success"
                  size="small"
                />
              </Paper>
            )}

            <TextField
              size="small"
              label={t("note")}
              value={formData.note ?? ""}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              multiline
              rows={2}
              placeholder={t("partners@notePlaceholder")}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
          <Button onClick={() => setFormOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleFormSubmit}
            disabled={createMutation.isPending || updateMutation.isPending || (formData.providerId <= 0 && !editing)}
            startIcon={createMutation.isPending || updateMutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{
              borderRadius: 2, minWidth: 100, fontWeight: 600,
              bgcolor: editing ? "warning.main" : "primary.main",
              "&:hover": { bgcolor: editing ? "warning.dark" : "primary.dark" },
            }}
          >
            {editing ? t("update") : t("partners@add")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Deactivate confirm ── */}
      <Dialog open={deactivateId !== null} onClose={() => setDeactivateId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
        <Box sx={{ background: "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)", p: 2.5, color: "white" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BlockIcon />
              </Box>
              <Typography variant="h6" fontWeight={700} color="white">{t("partners@deactivate")}</Typography>
            </Stack>
            <IconButton size="small" onClick={() => setDeactivateId(null)} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white" } }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary">{t("partners@deactivateConfirm")}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setDeactivateId(null)}>{t("cancel")}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDeactivate}
            disabled={deactivateMutation.isPending}
            startIcon={deactivateMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <BlockIcon />}
          >
            {t("partners@deactivate")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Credit & Balance Dialog ── */}
      <Dialog open={!!balanceTarget} onClose={() => setBalanceTarget(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
        <Box sx={{ background: "linear-gradient(135deg, #01579b 0%, #0277bd 100%)", p: 2.5, color: "white" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AccountBalanceWalletIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} color="white">{t("partners@creditBalance")}</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>{balanceTarget?.providerName ?? `#${balanceTarget?.providerId}`}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton size="small" onClick={() => refetchBalance()} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white" } }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setBalanceTarget(null)} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white" } }}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {isLoadingBalance ? (
            <Stack spacing={1.5} sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5}>
                {[...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={72} sx={{ flex: 1, borderRadius: 2 }} />)}
              </Stack>
              <Skeleton variant="rounded" height={24} width={140} />
              <Skeleton variant="rounded" height={48} />
              <Skeleton variant="rounded" height={24} width={140} />
              <Skeleton variant="rounded" height={80} />
            </Stack>
          ) : balanceData ? (
            <Stack spacing={0}>
              {/* Balance summary cards */}
              <Box sx={{ p: 2.5 }}>
                <Grid container spacing={1.5}>
                  {[
                    { label: t("partners@walletBalance"), value: `${balanceData.walletBalance.toFixed(3)} JOD`, color: balanceData.walletBalance < 0 ? "error.main" : "success.main", bg: balanceData.walletBalance < 0 ? "#ffebee" : "#e8f5e9" },
                    { label: t("partners@creditLimit"), value: balanceData.walletCreditLimit == null ? `∞ (${t("partners@unlimited")})` : `${balanceData.walletCreditLimit.toFixed(3)} JOD`, color: "primary.main", bg: "#e3f2fd" },
                    { label: t("partners@availableCredit"), value: balanceData.availableCredit == null ? "∞" : `${balanceData.availableCredit.toFixed(3)} JOD`, color: balanceData.availableCredit != null && balanceData.availableCredit <= 0 ? "error.main" : "success.main", bg: "#f3e5f5" },
                  ].map(({ label, value, color, bg }) => (
                    <Grid size={{ xs: 4 }} key={label}>
                      <Paper elevation={0} sx={{ p: 1.5, bgcolor: bg, borderRadius: 2, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary" display="block" noWrap>{label}</Typography>
                        <Typography variant="subtitle1" fontWeight={800} color={color} noWrap>{value}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider />

              {/* Set Credit Limit */}
              <Box sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <CreditScoreIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight={700}>{t("partners@setCreditLimit")}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <TextField
                    size="small"
                    label={t("partners@creditLimit")}
                    type="number"
                    value={creditLimitValue}
                    onChange={(e) => setCreditLimitValue(e.target.value)}
                    disabled={creditLimitUnlimited}
                    sx={{ flex: 1 }}
                    inputProps={{ min: 0, step: 0.001 }}
                    helperText="JOD"
                  />
                  <FormControlLabel
                    control={<Switch checked={creditLimitUnlimited} onChange={(e) => setCreditLimitUnlimited(e.target.checked)} size="small" />}
                    label={<Typography variant="caption">{t("partners@unlimited")}</Typography>}
                    sx={{ mt: 0.5, flexShrink: 0 }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSetCreditLimit}
                    disabled={setCreditLimitMutation.isPending || (!creditLimitUnlimited && !creditLimitValue)}
                    sx={{ mt: 0.5, whiteSpace: "nowrap" }}
                    startIcon={setCreditLimitMutation.isPending ? <CircularProgress size={14} color="inherit" /> : null}
                  >
                    {t("partners@setLimit")}
                  </Button>
                </Stack>
              </Box>

              <Divider />

              {/* Add Wallet Deposit */}
              <Box sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <PaymentIcon fontSize="small" color="success" />
                  <Typography variant="subtitle2" fontWeight={700}>{t("partners@addWalletDeposit")}</Typography>
                </Stack>
                <Stack spacing={1.5}>
                  {/* Type selector */}
                  <Stack direction="row" spacing={1}>
                    {([
                      { value: 1 as WalletTransactionType, label: t("partners@deposit"), color: "success" as const },
                      { value: 3 as WalletTransactionType, label: t("partners@refund"), color: "warning" as const },
                      { value: 4 as WalletTransactionType, label: t("partners@adjustment"), color: "error" as const },
                    ]).map((opt) => (
                      <Button
                        key={opt.value}
                        size="small"
                        variant={walletType === opt.value ? "contained" : "outlined"}
                        color={opt.color}
                        onClick={() => setWalletType(opt.value)}
                        sx={{ flex: 1, fontWeight: 700, borderRadius: 1.5, textTransform: "none" }}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      label={t("partners@amount")}
                      type="number"
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(e.target.value)}
                      sx={{ flex: 1 }}
                      inputProps={{ min: 0.001, step: 0.001 }}
                      helperText="JOD"
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleWalletDeposit}
                      disabled={walletDepositMutation.isPending || !walletAmount || parseFloat(walletAmount) <= 0}
                      sx={{ mt: 0.5, whiteSpace: "nowrap" }}
                      startIcon={walletDepositMutation.isPending ? <CircularProgress size={14} color="inherit" /> : null}
                    >
                      {t("partners@addDeposit")}
                    </Button>
                  </Stack>
                  <TextField
                    size="small"
                    label={t("partners@walletNote")}
                    value={walletNote}
                    onChange={(e) => setWalletNote(e.target.value)}
                    placeholder={t("partners@walletNotePlaceholder")}
                    fullWidth
                  />
                </Stack>
              </Box>

              {/* Wallet Transactions */}
              {balanceData.walletTransactions && balanceData.walletTransactions.length > 0 && (
                <>
                  <Divider />
                  <Box sx={{ p: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>{t("partners@walletTransactions")}</Typography>
                    <List dense disablePadding>
                      {balanceData.walletTransactions.map((tx) => {
                        const isDeduction = tx.transactionType === 2 || tx.transactionType === 5;
                        const typeLabels: Record<number, string> = {
                          1: t("partners@deposit"),
                          2: t("partners@settlementDeduction"),
                          3: t("partners@refund"),
                          4: t("partners@adjustment"),
                          5: t("partners@commissionDeduction"),
                          6: t("partners@commissionRefund"),
                        };
                        return (
                          <ListItem
                            key={tx.id}
                            disableGutters
                            sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider", "&:last-child": { border: 0 } }}
                            secondaryAction={
                              <Chip
                                label={`${isDeduction ? "−" : "+"}${tx.amount.toFixed(3)} JOD`}
                                size="small"
                                color={isDeduction ? "error" : "success"}
                                variant="filled"
                                sx={{ fontWeight: 700 }}
                              />
                            }
                          >
                            <ListItemText
                              primary={typeLabels[tx.transactionType] ?? t("partners@unknown")}
                              secondary={`${tx.createdByUserName ?? "System"} · ${new Date(tx.createdAt).toLocaleDateString()}${tx.note ? ` · ${tx.note}` : ""}`}
                              primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                              secondaryTypographyProps={{ variant: "caption" }}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                </>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setBalanceTarget(null)} variant="outlined">{t("close")}</Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
