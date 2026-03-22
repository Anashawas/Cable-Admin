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
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
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
import SearchIcon from "@mui/icons-material/Search";
import EvStationIcon from "@mui/icons-material/EvStation";
import BusinessIcon from "@mui/icons-material/Business";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  useAllOffers,
  useDeactivateOffer,
  useCreateOffer,
  useUploadOfferImage,
} from "../hooks/use-offers";
import type { OfferDto, ProposeOfferRequest, ProviderType } from "../types/api";
import { useQuery } from "@tanstack/react-query";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";
import { getAllChargingPoints } from "../../charge-management/services/charge-management-service";

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

export default function ActiveOffersScreen() {
  const { t } = useTranslation(["offers", "common"]);
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
  const uploadImageMutation = useUploadOfferImage();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferDto | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProposeOfferRequest>(INITIAL_FORM_DATA);
  const [selectedProvider, setSelectedProvider] = useState<{ id: number; name: string; city?: string | null } | null>(null);
  const [providerSearch, setProviderSearch] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    const search = providerSearch.toLowerCase();
    if (formData.providerType === "ServiceProvider") {
      return serviceProviders
        .filter(
          (p) =>
            !search ||
            p.name.toLowerCase().includes(search) ||
            String(p.id).includes(search) ||
            (p.cityName ?? "").toLowerCase().includes(search)
        )
        .map((p) => ({ id: p.id, name: p.name, city: p.cityName }));
    } else {
      return chargingPoints
        .filter(
          (p) =>
            !search ||
            (p.name ?? "").toLowerCase().includes(search) ||
            String(p.id).includes(search) ||
            (p.cityName ?? "").toLowerCase().includes(search)
        )
        .map((p) => ({ id: p.id, name: p.name ?? `Station #${p.id}`, city: p.cityName }));
    }
  }, [formData.providerType, serviceProviders, chargingPoints, providerSearch]);

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
    setSelectedProvider(null);
    setProviderSearch("");
    setCreateDialogOpen(true);
  }, []);

  const handleCloseCreateDialog = useCallback(() => {
    if (!createMutation.isPending && !uploadImageMutation.isPending) {
      setCreateDialogOpen(false);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [createMutation.isPending, uploadImageMutation.isPending]);

  const handleImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    e.target.value = "";
  }, []);

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
      onSuccess: (offerId) => {
        if (imageFile && offerId) {
          uploadImageMutation.mutate(
            { id: offerId, file: imageFile },
            {
              onSuccess: () => {
                openSuccessSnackbar({ message: t("offers@created") });
                setCreateDialogOpen(false);
                setFormData(INITIAL_FORM_DATA);
                setSelectedProvider(null);
                setProviderSearch("");
                setImageFile(null);
                setImagePreview(null);
              },
              onError: () => {
                openSuccessSnackbar({ message: t("offers@created") });
                openErrorSnackbar({ message: t("offers@imageUploadFailed") });
                setCreateDialogOpen(false);
                setFormData(INITIAL_FORM_DATA);
                setSelectedProvider(null);
                setProviderSearch("");
                setImageFile(null);
                setImagePreview(null);
              },
            }
          );
        } else {
          openSuccessSnackbar({ message: t("offers@created") });
          setCreateDialogOpen(false);
          setFormData(INITIAL_FORM_DATA);
          setSelectedProvider(null);
          setProviderSearch("");
          setImageFile(null);
          setImagePreview(null);
        }
      },
      onError: (err: Error) => {
        openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
      },
    });
  }, [formData, imageFile, createMutation, uploadImageMutation, openSuccessSnackbar, openErrorSnackbar, t]);

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
        subtitle={t("offers@activeOffers_subtitle")}
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
                      {selectedOffer.offerCodeExpirySeconds}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                        {t("offers@seconds")}
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
                    {selectedOffer.offerCodeExpirySeconds} {t("offers@seconds")}
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
        PaperProps={{ sx: { borderRadius: 3, display: "flex", flexDirection: "column", maxHeight: "90vh" } }}
      >
        <DialogTitle sx={{ pb: 1, flexShrink: 0 }}>
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
        <Divider sx={{ flexShrink: 0 }} />
        <DialogContent sx={{ py: 3, overflowY: "auto", flex: 1 }}>
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

            {/* Provider Type Toggle */}
            <ToggleButtonGroup
              value={formData.providerType}
              exclusive
              onChange={(_, value) => {
                if (value) {
                  updateField("providerType", value as ProviderType);
                  setSelectedProvider(null);
                  setProviderSearch("");
                  updateField("providerId", 0);
                }
              }}
              size="small"
            >
              <ToggleButton value="ServiceProvider" sx={{ px: 3, gap: 1 }}>
                <BusinessIcon fontSize="small" />
                {t("offers@serviceProvider")}
              </ToggleButton>
              <ToggleButton value="ChargingPoint" sx={{ px: 3, gap: 1 }}>
                <EvStationIcon fontSize="small" />
                {t("offers@chargingPoint")}
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Selected Provider Preview */}
            {selectedProvider && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: "success.50",
                  border: "1px solid",
                  borderColor: "success.300",
                  borderRadius: 2,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "success.main" }}>
                    {formData.providerType === "ChargingPoint" ? (
                      <EvStationIcon />
                    ) : (
                      <BusinessIcon />
                    )}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t("offers@selectedProvider")}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {selectedProvider.name}
                    </Typography>
                    {selectedProvider.city && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedProvider.city}
                      </Typography>
                    )}
                  </Box>
                  <Stack alignItems="flex-end" spacing={0.5}>
                    <Chip label={`ID: ${selectedProvider.id}`} size="small" color="success" />
                    <CheckCircleIcon sx={{ color: "success.main", fontSize: 20 }} />
                  </Stack>
                </Stack>
              </Paper>
            )}

            {/* Provider Search */}
            <TextField
              placeholder={t("offers@searchProviders")}
              value={providerSearch}
              onChange={(e) => setProviderSearch(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Provider List */}
            <Paper variant="outlined" sx={{ maxHeight: 220, overflowY: "auto", borderRadius: 2 }}>
              {isLoadingProviders ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : filteredProviders.length === 0 ? (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("offers@noProvidersFound")}
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding>
                  {filteredProviders.map((provider) => (
                    <ListItemButton
                      key={provider.id}
                      onClick={() => {
                        setSelectedProvider(provider);
                        updateField("providerId", provider.id);
                      }}
                      selected={selectedProvider?.id === provider.id}
                      sx={{
                        borderLeft: selectedProvider?.id === provider.id ? "3px solid" : "3px solid transparent",
                        borderColor: "primary.main",
                        "&.Mui-selected": { bgcolor: "primary.50" },
                        "&.Mui-selected:hover": { bgcolor: "primary.100" },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            fontSize: 14,
                            bgcolor:
                              selectedProvider?.id === provider.id ? "primary.main" : "grey.300",
                            color:
                              selectedProvider?.id === provider.id ? "white" : "text.secondary",
                          }}
                        >
                          {provider.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={selectedProvider?.id === provider.id ? 700 : 400}>
                            {provider.name}
                          </Typography>
                        }
                        secondary={provider.city ?? `ID: ${provider.id}`}
                      />
                      <Chip
                        label={`#${provider.id}`}
                        size="small"
                        variant={selectedProvider?.id === provider.id ? "filled" : "outlined"}
                        color={selectedProvider?.id === provider.id ? "primary" : "default"}
                      />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Paper>

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
                  value={formData.offerCodeExpirySeconds}
                  onChange={(e) =>
                    updateField("offerCodeExpirySeconds", parseInt(e.target.value) || 60)
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{t("offers@seconds")}</InputAdornment>,
                  }}
                  helperText={t("offers@minExpiry60")}
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
                  value={formData.validTo ?? ""}
                  onChange={(e) => updateField("validTo", e.target.value || null)}
                  InputLabelProps={{ shrink: true }}
                  helperText={t("offers@leaveEmptyNoExpiry")}
                  fullWidth
                />
              </Grid>
            </Grid>

            {/* Offer Image Upload */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 2 }}>
                {t("offers@offerImage")}
              </Typography>
              <Stack direction="row" spacing={2.5} alignItems="flex-start">
                {/* Preview */}
                <Box
                  sx={{
                    width: 110,
                    height: 110,
                    borderRadius: 2.5,
                    overflow: "hidden",
                    border: "2px dashed",
                    borderColor: imagePreview ? "info.main" : "grey.300",
                    bgcolor: imagePreview ? "transparent" : "grey.50",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.25s ease",
                  }}
                >
                  {imagePreview ? (
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="offer preview"
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <AddPhotoAlternateIcon sx={{ fontSize: 36, color: "text.disabled" }} />
                  )}
                </Box>
                {/* Upload area */}
                <Stack spacing={1.5} flex={1}>
                  <Button
                    component="label"
                    variant="outlined"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{
                      borderRadius: 2,
                      borderStyle: "dashed",
                      borderWidth: 2,
                      py: 1.5,
                      color: "info.main",
                      borderColor: "info.200",
                      bgcolor: "rgba(2, 136, 209, 0.04)",
                      "&:hover": {
                        borderStyle: "dashed",
                        borderWidth: 2,
                        bgcolor: "rgba(2, 136, 209, 0.08)",
                        borderColor: "info.main",
                      },
                    }}
                  >
                    {imageFile ? imageFile.name : t("offers@selectImage")}
                    <input type="file" accept="image/*" hidden onChange={handleImageFileChange} />
                  </Button>
                  <Typography variant="caption" color="text.disabled">
                    {t("offers@imageUploadHint")}
                  </Typography>
                  {imagePreview && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      sx={{ alignSelf: "flex-start", borderRadius: 2, fontSize: "0.75rem" }}
                    >
                      {t("offers@removeImage")}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <Divider sx={{ flexShrink: 0 }} />
        <DialogActions sx={{ px: 3, py: 2, gap: 1, flexShrink: 0 }}>
          <Button
            onClick={handleCloseCreateDialog}
            disabled={createMutation.isPending || uploadImageMutation.isPending}
            size="large"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleCreateSubmit}
            variant="contained"
            size="large"
            disabled={createMutation.isPending || uploadImageMutation.isPending}
            startIcon={
              (createMutation.isPending || uploadImageMutation.isPending) ? <CircularProgress size={20} /> : <AddIcon />
            }
          >
            {uploadImageMutation.isPending ? t("offers@uploadingImage") : createMutation.isPending ? t("creating") : t("offers@createOffer")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
