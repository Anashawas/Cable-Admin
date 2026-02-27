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
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Avatar,
  Paper,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
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
import StoreIcon from "@mui/icons-material/Store";
import TimerIcon from "@mui/icons-material/Timer";
import PeopleIcon from "@mui/icons-material/People";
import StarsIcon from "@mui/icons-material/Stars";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  useAllOffers,
  useDeactivateOffer,
  useCreateOffer,
} from "../hooks/use-offers";
import type { OfferDto, ProposeOfferRequest, ProviderType } from "../types/api";

const INITIAL_FORM_DATA: ProposeOfferRequest = {
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  providerType: "ServiceProvider",
  providerId: 0,
  pointsCost: 0,
  monetaryValue: 0,
  currencyCode: "KWD",
  maxUsesPerUser: null,
  maxTotalUses: null,
  offerCodeExpiryMinutes: 30,
  imageUrl: "",
  validFrom: "",
  validTo: "",
};

export default function ActiveOffersScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const {
    data,
    isLoading,
    search,
    statusFilter,
    handleSearchChange,
    handleStatusFilterChange,
    handleRefresh,
  } = useAllOffers();

  const deactivateMutation = useDeactivateOffer();
  const createMutation = useCreateOffer();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferDto | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProposeOfferRequest>(INITIAL_FORM_DATA);

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return data.slice(start, start + paginationModel.pageSize);
  }, [data, paginationModel.page, paginationModel.pageSize]);

  const handleViewDetails = useCallback((e: React.MouseEvent, row: OfferDto) => {
    e.stopPropagation();
    setSelectedOffer(row);
    setDetailDialogOpen(true);
  }, []);

  const handleDeactivate = useCallback(
    (e: React.MouseEvent, row: OfferDto) => {
      e.stopPropagation();
      deactivateMutation.mutate(row.id, {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("offers@deactivated") });
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      });
    },
    [deactivateMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const handleOpenCreateDialog = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setCreateDialogOpen(true);
  }, []);

  const handleCloseCreateDialog = useCallback(() => {
    if (!createMutation.isPending) {
      setCreateDialogOpen(false);
    }
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
    if (formData.offerCodeExpiryMinutes < 30) {
      openErrorSnackbar({ message: t("offers@minExpiryMinutes") });
      return;
    }
    if (!formData.validFrom || !formData.validTo) {
      openErrorSnackbar({ message: t("offers@validDatesRequired") });
      return;
    }

    createMutation.mutate(formData, {
      onSuccess: () => {
        openSuccessSnackbar({ message: t("offers@created") });
        setCreateDialogOpen(false);
        setFormData(INITIAL_FORM_DATA);
      },
      onError: (err: Error) => {
        openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
      },
    });
  }, [formData, createMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const updateField = <K extends keyof ProposeOfferRequest>(
    field: K,
    value: ProposeOfferRequest[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const columns: GridColDef<OfferDto>[] = [
    {
      field: "id",
      headerName: t("id"),
      width: 70,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "title",
      headerName: t("offerTitle"),
      flex: 1,
      minWidth: 200,
    },
    {
      field: "providerName",
      headerName: t("provider"),
      width: 180,
    },
    {
      field: "providerType",
      headerName: t("providerType"),
      width: 140,
      renderCell: (params) => (
        <Chip
          label={
            params.value === "ChargingPoint" ? t("chargingPoint") : t("serviceProvider")
          }
          size="small"
          color={params.value === "ChargingPoint" ? "primary" : "secondary"}
        />
      ),
    },
    {
      field: "pointsCost",
      headerName: t("pointsCost"),
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip label={`${params.value} pts`} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      field: "monetaryValue",
      headerName: t("monetaryValue"),
      width: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => `${params.value} ${params.row.currencyCode}`,
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
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={params.value ? t("active") : t("inactive")}
          color={params.value ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "validTo",
      headerName: t("validTo"),
      width: 130,
      valueFormatter: (value) => new Date(value).toLocaleDateString(),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 120,
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
          {params.row.isActive && (
            <Tooltip title={t("deactivate")}>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => handleDeactivate(e, params.row)}
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

  const headerActions: ScreenHeaderAction[] = [
    {
      id: "refresh",
      label: t("refresh"),
      icon: <RefreshIcon />,
      onClick: handleRefresh,
    },
    {
      id: "addNew",
      label: t("addNew"),
      icon: <AddIcon />,
      onClick: handleOpenCreateDialog,
    },
  ];

  return (
    <AppScreenContainer>
      <ScreenHeader
        icon={<LocalOfferIcon />}
        title={t("activeOffers")}
        subtitle={t("activeOffers@subtitle")}
        actions={headerActions}
      />

      {data.length === 0 && !isLoading && (
        <Alert severity="info" sx={{ mt: 3 }}>
          {t("offers@noActiveOffers")}
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
          <TextField
            size="small"
            placeholder={t("search")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            sx={{ minWidth: 300 }}
          />

          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(_, value) => {
              if (value !== null) handleStatusFilterChange(value);
            }}
            size="small"
          >
            <ToggleButton value="all">{t("all")}</ToggleButton>
            <ToggleButton value="active">{t("active")}</ToggleButton>
            <ToggleButton value="inactive">{t("inactive")}</ToggleButton>
          </ToggleButtonGroup>

          <Chip label={`${data.length} ${t("offers")}`} color="primary" />
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
              <LocalOfferIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {t("offerDetails")}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3 }}>
          {selectedOffer && (
            <Stack spacing={3}>
              {/* Title Card */}
              <Card elevation={0} sx={{ bgcolor: "primary.50", borderRadius: 2 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h5" fontWeight={700} color="primary.dark" gutterBottom>
                        {selectedOffer.title}
                      </Typography>
                      {selectedOffer.titleAr && (
                        <Typography variant="body1" color="text.secondary">
                          {selectedOffer.titleAr}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={selectedOffer.isActive ? t("active") : t("inactive")}
                      color={selectedOffer.isActive ? "success" : "default"}
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Provider Info */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "secondary.main" }}>
                    <StoreIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t("provider")}
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedOffer.providerName}
                    </Typography>
                    <Chip
                      label={
                        selectedOffer.providerType === "ChargingPoint"
                          ? t("chargingPoint")
                          : t("serviceProvider")
                      }
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Stack>
              </Paper>

              {/* Stats Grid */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "info.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <StarsIcon sx={{ fontSize: 20, color: "info.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("pointsCost")}
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="info.dark">
                      {selectedOffer.pointsCost}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                        pts
                      </Typography>
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "success.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <AttachMoneyIcon sx={{ fontSize: 20, color: "success.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("monetaryValue")}
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="success.dark">
                      {selectedOffer.monetaryValue}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                        {selectedOffer.currencyCode}
                      </Typography>
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "warning.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <TimerIcon sx={{ fontSize: 20, color: "warning.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("codeExpiry")}
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="warning.dark">
                      {selectedOffer.offerCodeExpiryMinutes}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                        {t("minutes")}
                      </Typography>
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "error.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <PeopleIcon sx={{ fontSize: 20, color: "error.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("totalUses")}
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="error.dark">
                      {selectedOffer.currentTotalUses}
                      {selectedOffer.maxTotalUses && (
                        <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                          / {selectedOffer.maxTotalUses}
                        </Typography>
                      )}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Additional Info */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {t("maxUsesPerUser")}
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedOffer.maxUsesPerUser ?? t("unlimited")}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {t("codeExpiry")}
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedOffer.offerCodeExpiryMinutes} {t("minutes")}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {t("proposedBy")}
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedOffer.proposedByUserName}
                  </Typography>
                </Grid>
              </Grid>

              {/* Validity Period */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.100", borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarTodayIcon sx={{ fontSize: 20, color: "primary.main" }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t("validPeriod")}
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {new Date(selectedOffer.validFrom).toLocaleDateString()} -{" "}
                      {new Date(selectedOffer.validTo).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Description */}
              {selectedOffer.description && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom>
                    {t("description")}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {selectedOffer.description}
                  </Typography>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setDetailDialogOpen(false)} size="large">
            {t("close")}
          </Button>
          {selectedOffer?.isActive && (
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={
                deactivateMutation.isPending ? (
                  <CircularProgress size={20} />
                ) : (
                  <BlockIcon />
                )
              }
              disabled={deactivateMutation.isPending}
              onClick={() => {
                setDetailDialogOpen(false);
                handleDeactivate({} as React.MouseEvent, selectedOffer);
              }}
            >
              {t("deactivate")}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Create Offer Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <AddIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {t("offers@createNew")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("offers@createNewSubtitle")}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3 }}>
          <Stack spacing={3}>
            {/* Basic Info */}
            <Typography variant="subtitle2" fontWeight={600} color="primary.main">
              {t("offers@basicInfo")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("offers@titleEn")}
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("offers@titleAr")}
                  value={formData.titleAr ?? ""}
                  onChange={(e) => updateField("titleAr", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("offers@descriptionEn")}
                  value={formData.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("offers@descriptionAr")}
                  value={formData.descriptionAr ?? ""}
                  onChange={(e) => updateField("descriptionAr", e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Divider />

            {/* Provider Info */}
            <Typography variant="subtitle2" fontWeight={600} color="primary.main">
              {t("offers@providerInfo")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{t("providerType")}</InputLabel>
                  <Select
                    value={formData.providerType}
                    label={t("providerType")}
                    onChange={(e) => updateField("providerType", e.target.value as ProviderType)}
                  >
                    <MenuItem value="ChargingPoint">{t("chargingPoint")}</MenuItem>
                    <MenuItem value="ServiceProvider">{t("serviceProvider")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("providerId")}
                  type="number"
                  value={formData.providerId || ""}
                  onChange={(e) => updateField("providerId", parseInt(e.target.value) || 0)}
                  required
                  fullWidth
                />
              </Grid>
            </Grid>

            <Divider />

            {/* Financial Settings */}
            <Typography variant="subtitle2" fontWeight={600} color="primary.main">
              {t("offers@financialSettings")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label={t("pointsCost")}
                  type="number"
                  value={formData.pointsCost || ""}
                  onChange={(e) =>
                    updateField("pointsCost", parseInt(e.target.value) || 0)
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">pts</InputAdornment>,
                  }}
                  helperText={t("offers@pointsCostHelp")}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label={t("monetaryValue")}
                  type="number"
                  value={formData.monetaryValue || ""}
                  onChange={(e) =>
                    updateField("monetaryValue", parseFloat(e.target.value) || 0)
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{formData.currencyCode}</InputAdornment>,
                  }}
                  helperText={t("offers@monetaryValueHelp")}
                  required
                  fullWidth
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

            <Divider />

            {/* Usage Limits */}
            <Typography variant="subtitle2" fontWeight={600} color="primary.main">
              {t("offers@transactionLimits")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label={t("maxUsesPerUser")}
                  type="number"
                  value={formData.maxUsesPerUser ?? ""}
                  onChange={(e) =>
                    updateField("maxUsesPerUser", e.target.value ? parseInt(e.target.value) : null)
                  }
                  helperText={t("offers@leaveEmptyUnlimited")}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label={t("offers@maxTotalUses")}
                  type="number"
                  value={formData.maxTotalUses ?? ""}
                  onChange={(e) =>
                    updateField("maxTotalUses", e.target.value ? parseInt(e.target.value) : null)
                  }
                  helperText={t("offers@leaveEmptyUnlimited")}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label={t("codeExpiry")}
                  type="number"
                  value={formData.offerCodeExpiryMinutes}
                  onChange={(e) =>
                    updateField("offerCodeExpiryMinutes", parseInt(e.target.value) || 30)
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{t("minutes")}</InputAdornment>,
                  }}
                  helperText={t("offers@minExpiry30")}
                  required
                  fullWidth
                />
              </Grid>
            </Grid>

            <Divider />

            {/* Validity Period */}
            <Typography variant="subtitle2" fontWeight={600} color="primary.main">
              {t("validPeriod")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("offers@validFrom")}
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => updateField("validFrom", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("offers@validTo")}
                  type="datetime-local"
                  value={formData.validTo}
                  onChange={(e) => updateField("validTo", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
              </Grid>
            </Grid>

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
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleCloseCreateDialog}
            disabled={createMutation.isPending}
            size="large"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleCreateSubmit}
            variant="contained"
            size="large"
            disabled={createMutation.isPending}
            startIcon={
              createMutation.isPending ? <CircularProgress size={20} /> : <AddIcon />
            }
          >
            {createMutation.isPending ? t("creating") : t("offers@createOffer")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
