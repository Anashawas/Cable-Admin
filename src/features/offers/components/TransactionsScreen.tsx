import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
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
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Autocomplete,
  CircularProgress,
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
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid } from "../../../components";
import { useProviderTransactions } from "../hooks/use-transactions";
import { getAllChargingPoints } from "../../charge-management/services/charge-management-service";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";
import type { OfferTransactionDto, ProviderType, TransactionStatus } from "../types/api";

interface ProviderOption {
  id: number;
  name: string;
}

export default function TransactionsScreen() {
  const { t } = useTranslation(["offers", "common"]);

  const [providerType, setProviderType] = useState<ProviderType>("ChargingPoint");
  const [selectedProvider, setSelectedProvider] = useState<ProviderOption | null>(null);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | undefined>(undefined);

  const providerId = selectedProvider?.id ?? 0;

  // Load providers based on type
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
      return chargingPoints.map((p) => ({ id: p.id, name: p.name ?? `#${p.id}` }));
    }
    return serviceProviders.map((p) => ({ id: p.id, name: p.name }));
  }, [providerType, chargingPoints, serviceProviders]);

  const isLoadingProviders = providerType === "ChargingPoint" ? loadingCP : loadingSP;

  const {
    data,
    isLoading,
    search,
    handleSearchChange,
    handleRefresh,
  } = useProviderTransactions({
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
  }, [data, paginationModel.page, paginationModel.pageSize]);

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

  const getStatusColor = (status: TransactionStatus): "warning" | "success" | "error" | "default" => {
    switch (status) {
      case 1: return "warning";
      case 2: return "success";
      case 3: return "error";
      case 4: return "default";
      default: return "default";
    }
  };

  const getStatusLabel = (status: TransactionStatus): string => {
    switch (status) {
      case 1: return t("codeGenerated");
      case 2: return t("confirmed");
      case 3: return t("cancelled");
      case 4: return t("expired");
      default: return t("unknown");
    }
  };

  const columns: GridColDef<OfferTransactionDto>[] = [
    {
      field: "id",
      headerName: t("id"),
      width: 70,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "offerCode",
      headerName: t("offerCode"),
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" fontFamily="monospace">
          {params.value}
        </Typography>
      ),
    },
    {
      field: "offerTitle",
      headerName: t("offerTitle"),
      flex: 1,
      minWidth: 180,
    },
    {
      field: "userName",
      headerName: t("user"),
      width: 150,
    },
    {
      field: "pointsDeducted",
      headerName: t("pointsDeducted"),
      width: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (params) =>
        params.value ? (
          <Chip label={`${params.value} pts`} size="small" color="primary" variant="outlined" />
        ) : (
          "-"
        ),
    },
    {
      field: "monetaryValue",
      headerName: t("monetaryValue"),
      width: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (params) =>
        params.value ? `${params.value} ${params.row.currencyCode}` : "-",
    },
    {
      field: "status",
      headerName: t("status"),
      width: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value)}
          size="small"
          color={getStatusColor(params.value)}
        />
      ),
    },
    {
      field: "createdAt",
      headerName: t("createdAt"),
      width: 160,
      valueFormatter: (value) => new Date(value).toLocaleString(),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 80,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <Tooltip title={t("viewDetails")}>
          <IconButton size="small" onClick={(e) => handleViewDetails(e, params.row)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const headerActions: ScreenHeaderAction[] = [
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
        icon={<ReceiptLongIcon />}
        title={t("offerTransactions")}
        subtitle={t("offers@offerTransactions_subtitle")}
        actions={headerActions}
      />

      <Box sx={{ mt: 3 }}>
        {/* Provider Selector Panel */}
        <Paper
          elevation={0}
          sx={{ p: 2.5, mb: 3, bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "divider" }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <ReceiptLongIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={700} color="primary.main">
              {t("selectProvider")}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="flex-start">
            {/* Provider Type Toggle */}
            <ToggleButtonGroup
              value={providerType}
              exclusive
              onChange={(_, value) => { if (value) handleProviderTypeChange(value as ProviderType); }}
              size="small"
            >
              <ToggleButton value="ChargingPoint" sx={{ px: 2, gap: 0.5 }}>
                <EvStationIcon fontSize="small" />
                {t("chargingPoint")}
              </ToggleButton>
              <ToggleButton value="ServiceProvider" sx={{ px: 2, gap: 0.5 }}>
                <StoreIcon fontSize="small" />
                {t("serviceProvider")}
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Provider Autocomplete */}
            <Autocomplete
              size="small"
              sx={{ minWidth: 300, flex: 1, maxWidth: 450 }}
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
                  label={providerType === "ChargingPoint" ? t("chargingPoint") : t("serviceProvider")}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoadingProviders ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "primary.light" }}>
                      {providerType === "ChargingPoint" ? <EvStationIcon sx={{ fontSize: 16 }} /> : <StoreIcon sx={{ fontSize: 16 }} />}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">ID: {option.id}</Typography>
                    </Box>
                  </Stack>
                </li>
              )}
              noOptionsText={isLoadingProviders ? t("loading") : t("noResultsFound")}
            />

            {/* Selected Provider Badge */}
            {selectedProvider && (
              <Chip
                icon={providerType === "ChargingPoint" ? <EvStationIcon /> : <StoreIcon />}
                label={`${selectedProvider.name} · ID ${selectedProvider.id}`}
                color="primary"
                variant="outlined"
                onDelete={() => setSelectedProvider(null)}
                sx={{ alignSelf: "center" }}
              />
            )}
          </Stack>
        </Paper>

        {/* Transactions list */}
        {providerId > 0 && (
          <>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" alignItems="center">
              <TextField
                size="small"
                placeholder={t("searchTransactions")}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                sx={{ minWidth: 280 }}
              />

              <ToggleButtonGroup
                value={statusFilter ?? "all"}
                exclusive
                onChange={(_, value) => setStatusFilter(value === "all" ? undefined : value)}
                size="small"
              >
                <ToggleButton value="all">{t("all")}</ToggleButton>
                <ToggleButton value={1}>{t("codeGenerated")}</ToggleButton>
                <ToggleButton value={2}>{t("confirmed")}</ToggleButton>
                <ToggleButton value={3}>{t("cancelled")}</ToggleButton>
                <ToggleButton value={4}>{t("expired")}</ToggleButton>
              </ToggleButtonGroup>

              <Chip label={`${data.length} ${t("transactions")}`} color="primary" />
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
          </>
        )}

        {!providerId && (
          <Alert severity="info" sx={{ mt: 1 }}>
            {t("offers@transactions_selectProviderHint")}
          </Alert>
        )}
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
                {t("transactionDetails")}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          {selectedTransaction && (
            <Stack spacing={3}>
              {/* Offer Code Card */}
              <Card elevation={0} sx={{ bgcolor: "primary.50", borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("offerCode")}
                      </Typography>
                      <Typography variant="h5" fontWeight={700} fontFamily="monospace" color="primary.dark">
                        {selectedTransaction.offerCode}
                      </Typography>
                    </Box>
                    <Chip
                      label={getStatusLabel(selectedTransaction.status)}
                      color={getStatusColor(selectedTransaction.status)}
                      size="medium"
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* User Info */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "secondary.main" }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t("user")}
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedTransaction.userName}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Offer Info */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: "info.50", borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "info.main" }}>
                    <LocalOfferIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t("offerTitle")}
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedTransaction.offerTitle}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Stats */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "info.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <StarsIcon sx={{ fontSize: 18, color: "info.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("pointsDeducted")}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} color="info.dark">
                      {selectedTransaction.pointsDeducted}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                        pts
                      </Typography>
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "success.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <AttachMoneyIcon sx={{ fontSize: 18, color: "success.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("monetaryValue")}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} color="success.dark">
                      {selectedTransaction.monetaryValue}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                        {selectedTransaction.currencyCode}
                      </Typography>
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "warning.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <AttachMoneyIcon sx={{ fontSize: 18, color: "warning.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("currencyCode")}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} color="warning.dark">
                      {selectedTransaction.currencyCode}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "error.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <TimerIcon sx={{ fontSize: 18, color: "error.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("codeExpiry")}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight={600} color="error.dark">
                      {new Date(selectedTransaction.codeExpiresAt).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Dates */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 18, color: "primary.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("createdAt")}
                      </Typography>
                    </Stack>
                    <Typography variant="body1" fontWeight={600}>
                      {new Date(selectedTransaction.createdAt).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>

                {selectedTransaction.completedAt && (
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: "success.50", borderRadius: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 18, color: "success.main" }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {t("completedAt")}
                        </Typography>
                      </Stack>
                      <Typography variant="body1" fontWeight={600}>
                        {new Date(selectedTransaction.completedAt).toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
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
    </AppScreenContainer>
  );
}
