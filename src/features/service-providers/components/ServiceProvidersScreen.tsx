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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Rating,
  Avatar,
  Grid,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  CardActions,
  Divider,
  Typography,
  Paper,
  Alert,
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VerifiedIcon from "@mui/icons-material/Verified";
import RefreshIcon from "@mui/icons-material/Refresh";
import StoreIcon from "@mui/icons-material/Store";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StarIcon from "@mui/icons-material/Star";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import LoyaltyIcon from "@mui/icons-material/Loyalty";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  useServiceProviders,
  useVerifyServiceProvider,
  useServiceProvider,
  useServiceProviderRatings,
  useCreateServiceProvider,
  useUpdateServiceProvider,
  useDeleteServiceProvider,
  useChangeServiceProviderOwner,
  useUploadServiceProviderIcon,
  ServiceProviderSortOption,
} from "../hooks/use-service-providers";
import { useServiceCategories } from "../hooks/use-service-categories";
import { useAllOffers, useUpdateOffer } from "../../offers/hooks/use-offers";
import { useBlockProvider, useUnblockProvider } from "../../loyalty/hooks/use-loyalty";
import type { ServiceProviderDto, CreateServiceProviderRequest, UpdateServiceProviderRequest } from "../types/api";
import type { OfferDto, UpdateOfferRequest } from "../../offers/types/api";

interface FormData {
  name: string;
  serviceCategoryId: number | "";
  statusId: number;
  description: string;
  phone: string;
  ownerPhone: string;
  address: string;
  countryName: string;
  cityName: string;
  price: string;
  priceDescription: string;
  fromTime: string;
  toTime: string;
  methodPayment: string;
  hasOffer: boolean;
  offerDescription: string;
  service: string;
  whatsAppNumber: string;
  websiteUrl: string;
}

const initialFormData: FormData = {
  name: "",
  serviceCategoryId: "",
  statusId: 1,
  description: "",
  phone: "",
  ownerPhone: "",
  address: "",
  countryName: "",
  cityName: "",
  price: "",
  priceDescription: "",
  fromTime: "",
  toTime: "",
  methodPayment: "",
  hasOffer: false,
  offerDescription: "",
  service: "",
  whatsAppNumber: "",
  websiteUrl: "",
};

export default function ServiceProvidersScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);

  const {
    data,
    isLoading,
    search,
    sortOption,
    verifiedFilter,
    handleSearchChange,
    handleSortChange,
    handleVerifiedFilterChange,
    handleRefresh,
  } = useServiceProviders(selectedCategoryId);

  const { allData: categories } = useServiceCategories();
  const verifyMutation = useVerifyServiceProvider();
  const createMutation = useCreateServiceProvider();
  const updateMutation = useUpdateServiceProvider();
  const deleteMutation = useDeleteServiceProvider();
  const uploadIconMutation = useUploadServiceProviderIcon();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offersDialogOpen, setOffersDialogOpen] = useState(false);
  const [offerEditDialogOpen, setOfferEditDialogOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [selectedProviderForOffers, setSelectedProviderForOffers] = useState<ServiceProviderDto | null>(null);
  const [editingProvider, setEditingProvider] = useState<ServiceProviderDto | null>(null);
  const [editingOffer, setEditingOffer] = useState<OfferDto | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [changeOwnerDialogOpen, setChangeOwnerDialogOpen] = useState(false);
  const [changeOwnerProvider, setChangeOwnerProvider] = useState<ServiceProviderDto | null>(null);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [blockProviderDialogOpen, setBlockProviderDialogOpen] = useState(false);
  const [blockProviderTarget, setBlockProviderTarget] = useState<ServiceProviderDto | null>(null);
  const [blockProviderReason, setBlockProviderReason] = useState("");
  const [blockProviderUntil, setBlockProviderUntil] = useState("");
  const [isUnblockMode, setIsUnblockMode] = useState(false);
  const [offerFormData, setOfferFormData] = useState<UpdateOfferRequest>({
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
    offerCodeExpiryMinutes: 60,
    imageUrl: "",
    validFrom: "",
    validTo: "",
    isActive: true,
  });

  const { data: providerDetail, isLoading: isLoadingDetail } = useServiceProvider(
    selectedProviderId ?? 0
  );
  const { data: ratings = [] } = useServiceProviderRatings(selectedProviderId ?? 0);

  const { data: providerOffers = [], isLoading: isLoadingOffers } = useAllOffers({
    providerType: "ServiceProvider",
    providerId: selectedProviderForOffers?.id,
  });

  const updateOfferMutation = useUpdateOffer();
  const changeOwnerMutation = useChangeServiceProviderOwner();
  const blockProviderMutation = useBlockProvider();
  const unblockProviderMutation = useUnblockProvider();

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return data.slice(start, start + paginationModel.pageSize);
  }, [data, paginationModel.page, paginationModel.pageSize]);

  const handleBlockProviderClick = useCallback((e: React.MouseEvent, row: ServiceProviderDto, unblock = false) => {
    e.stopPropagation();
    setBlockProviderTarget(row);
    setIsUnblockMode(unblock);
    setBlockProviderReason("");
    setBlockProviderUntil("");
    setBlockProviderDialogOpen(true);
  }, []);

  const handleBlockProviderSubmit = useCallback(() => {
    if (!blockProviderTarget) return;
    if (!isUnblockMode && !blockProviderReason.trim()) return;
    if (isUnblockMode) {
      unblockProviderMutation.mutate(
        { providerType: "ServiceProvider", providerId: blockProviderTarget.id },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("loyalty@providerUnblocked") });
            setBlockProviderDialogOpen(false);
          },
          onError: (err: Error) => { openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }); },
        }
      );
    } else {
      blockProviderMutation.mutate(
        {
          providerType: "ServiceProvider",
          providerId: blockProviderTarget.id,
          reason: blockProviderReason.trim(),
          blockUntil: blockProviderUntil ? new Date(blockProviderUntil).toISOString() : null,
        },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("loyalty@providerBlocked") });
            setBlockProviderDialogOpen(false);
          },
          onError: (err: Error) => { openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }); },
        }
      );
    }
  }, [blockProviderTarget, blockProviderReason, blockProviderUntil, isUnblockMode, blockProviderMutation, unblockProviderMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleViewDetails = useCallback((e: React.MouseEvent, row: ServiceProviderDto) => {
    e.stopPropagation();
    setSelectedProviderId(row.id);
    setDetailDialogOpen(true);
  }, []);

  const handleVerify = useCallback(
    (e: React.MouseEvent, row: ServiceProviderDto) => {
      e.stopPropagation();
      if (row.isVerified) {
        openErrorSnackbar({ message: t("serviceProviders@alreadyVerified") });
        return;
      }

      verifyMutation.mutate(row.id, {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("serviceProviders@verified") });
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      });
    },
    [verifyMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const handleAddClick = useCallback(() => {
    setEditingProvider(null);
    setFormData(initialFormData);
    setFormDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((e: React.MouseEvent, row: ServiceProviderDto) => {
    e.stopPropagation();
    setEditingProvider(row);
    setFormData({
      name: row.name || "",
      serviceCategoryId: row.serviceCategoryId || "",
      statusId: row.statusId || 1,
      description: row.description || "",
      phone: row.phone || "",
      ownerPhone: "",
      address: row.address || "",
      countryName: row.countryName || "",
      cityName: row.cityName || "",
      price: row.price?.toString() || "",
      priceDescription: row.priceDescription || "",
      fromTime: row.fromTime || "",
      toTime: row.toTime || "",
      methodPayment: row.methodPayment || "",
      hasOffer: row.hasOffer || false,
      offerDescription: row.offerDescription || "",
      service: row.service || "",
      whatsAppNumber: row.whatsAppNumber || "",
      websiteUrl: row.websiteUrl || "",
    });
    setFormDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((e: React.MouseEvent, row: ServiceProviderDto) => {
    e.stopPropagation();
    setEditingProvider(row);
    setDeleteDialogOpen(true);
  }, []);

  const handleViewOffers = useCallback((e: React.MouseEvent, row: ServiceProviderDto) => {
    e.stopPropagation();
    setSelectedProviderForOffers(row);
    setOffersDialogOpen(true);
  }, []);

  const handleEditOffer = useCallback((offer: OfferDto) => {
    setEditingOffer(offer);
    setOfferFormData({
      title: offer.title,
      titleAr: offer.titleAr || "",
      description: offer.description || "",
      descriptionAr: offer.descriptionAr || "",
      providerType: offer.providerType,
      providerId: offer.providerId,
      pointsCost: offer.pointsCost,
      monetaryValue: offer.monetaryValue,
      currencyCode: offer.currencyCode,
      maxUsesPerUser: offer.maxUsesPerUser,
      maxTotalUses: offer.maxTotalUses,
      offerCodeExpiryMinutes: offer.offerCodeExpiryMinutes,
      imageUrl: offer.imageUrl || "",
      validFrom: offer.validFrom.split('T')[0],
      validTo: offer.validTo.split('T')[0],
      isActive: offer.isActive,
    });
    setOfferEditDialogOpen(true);
  }, []);

  const handleChangeOwnerClick = useCallback((e: React.MouseEvent, row: ServiceProviderDto) => {
    e.stopPropagation();
    setChangeOwnerProvider(row);
    setNewOwnerId("");
    setChangeOwnerDialogOpen(true);
  }, []);

  const handleChangeOwnerSubmit = useCallback(() => {
    const parsedId = parseInt(newOwnerId.trim());
    if (!changeOwnerProvider || !parsedId) {
      openErrorSnackbar({ message: t("serviceProviders@ownerIdRequired") });
      return;
    }

    changeOwnerMutation.mutate(
      { serviceProviderId: changeOwnerProvider.id, data: { newOwnerId: parsedId } },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("serviceProviders@ownerChanged") });
          setChangeOwnerDialogOpen(false);
          setChangeOwnerProvider(null);
          setNewOwnerId("");
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      }
    );
  }, [changeOwnerProvider, newOwnerId, changeOwnerMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleOfferFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!editingOffer) return;

      if (!offerFormData.title.trim()) {
        openErrorSnackbar({ message: t("offerTitleRequired") });
        return;
      }

      updateOfferMutation.mutate(
        { id: editingOffer.id, data: offerFormData },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("offerUpdated") });
            setOfferEditDialogOpen(false);
            setEditingOffer(null);
          },
          onError: (err: Error) => {
            openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
          },
        }
      );
    },
    [editingOffer, offerFormData, updateOfferMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.name.trim()) {
        openErrorSnackbar({ message: t("nameRequired") });
        return;
      }

      if (!formData.serviceCategoryId) {
        openErrorSnackbar({ message: t("serviceProviders@categoryRequired") });
        return;
      }

      const payload: CreateServiceProviderRequest | UpdateServiceProviderRequest = {
        name: formData.name.trim(),
        serviceCategoryId: formData.serviceCategoryId as number,
        statusId: formData.statusId,
        description: formData.description.trim() || null,
        phone: formData.phone.trim() || null,
        ownerPhone: formData.ownerPhone.trim() || null,
        address: formData.address.trim() || null,
        countryName: formData.countryName.trim() || null,
        cityName: formData.cityName.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        priceDescription: formData.priceDescription.trim() || null,
        fromTime: formData.fromTime.trim() || null,
        toTime: formData.toTime.trim() || null,
        methodPayment: formData.methodPayment.trim() || null,
        hasOffer: formData.hasOffer,
        offerDescription: formData.offerDescription.trim() || null,
        service: formData.service.trim() || null,
        whatsAppNumber: formData.whatsAppNumber.trim() || null,
        websiteUrl: formData.websiteUrl.trim() || null,
      };

      if (editingProvider) {
        // Update
        updateMutation.mutate(
          { id: editingProvider.id, data: { ...payload, isVerified: editingProvider.isVerified } as UpdateServiceProviderRequest },
          {
            onSuccess: () => {
              openSuccessSnackbar({ message: t("serviceProviders@updated") });
              setFormDialogOpen(false);
              setEditingProvider(null);
              setFormData(initialFormData);
            },
            onError: (err: Error) => {
              openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
            },
          }
        );
      } else {
        // Create
        createMutation.mutate(payload as CreateServiceProviderRequest, {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("serviceProviders@created") });
            setFormDialogOpen(false);
            setFormData(initialFormData);
          },
          onError: (err: Error) => {
            openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
          },
        });
      }
    },
    [formData, editingProvider, createMutation, updateMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!editingProvider) return;

    deleteMutation.mutate(editingProvider.id, {
      onSuccess: () => {
        openSuccessSnackbar({ message: t("serviceProviders@deleted") });
        setDeleteDialogOpen(false);
        setEditingProvider(null);
      },
      onError: (err: Error) => {
        openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
      },
    });
  }, [editingProvider, deleteMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleUploadIcon = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, providerId: number) => {
      const file = e.target.files?.[0];
      if (!file) return;

      uploadIconMutation.mutate(
        { id: providerId, file },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("serviceProviders@iconUploaded") });
          },
          onError: (err: Error) => {
            openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
          },
        }
      );
    },
    [uploadIconMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const columns: GridColDef<ServiceProviderDto>[] = [
    {
      field: "id",
      headerName: t("id"),
      width: 70,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "icon",
      headerName: t("icon"),
      width: 80,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <Avatar src={params.value || undefined} sx={{ width: 40, height: 40 }}>
          <StoreIcon />
        </Avatar>
      ),
    },
    {
      field: "name",
      headerName: t("name"),
      flex: 1,
      minWidth: 200,
    },
    {
      field: "ownerName",
      headerName: t("owner"),
      width: 150,
    },
    {
      field: "serviceCategoryName",
      headerName: t("category"),
      width: 150,
    },
    {
      field: "cityName",
      headerName: t("city"),
      width: 120,
    },
    {
      field: "avgRating",
      headerName: t("rating"),
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Rating value={params.value || 0} precision={0.5} size="small" readOnly />
          <Chip label={`(${params.row.rateCount})`} size="small" />
        </Stack>
      ),
    },
    {
      field: "visitorsCount",
      headerName: t("visitors"),
      width: 100,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "isVerified",
      headerName: t("verified"),
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          icon={params.value ? <VerifiedIcon /> : undefined}
          label={params.value ? t("verified") : t("unverified")}
          color={params.value ? "success" : "warning"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 310,
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
          <Tooltip title={t("viewOffers")}>
            <IconButton size="small" color="warning" onClick={(e) => handleViewOffers(e, params.row)}>
              <LocalOfferIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("serviceProviders@changeOwner")}>
            <IconButton size="small" color="info" onClick={(e) => handleChangeOwnerClick(e, params.row)}>
              <SwapHorizIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("loyalty@blockProvider")}>
            <IconButton size="small" color="error" onClick={(e) => handleBlockProviderClick(e, params.row)}>
              <BlockIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("edit")}>
            <IconButton size="small" color="primary" onClick={(e) => handleEditClick(e, params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("delete")}>
            <IconButton size="small" color="error" onClick={(e) => handleDeleteClick(e, params.row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {!params.row.isVerified && (
            <Tooltip title={t("verify")}>
              <IconButton
                size="small"
                color="success"
                onClick={(e) => handleVerify(e, params.row)}
                disabled={verifyMutation.isPending}
              >
                <VerifiedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const headerActions: ScreenHeaderAction[] = [
    {
      id: "addProvider",
      label: t("addProvider"),
      icon: <AddIcon />,
      onClick: handleAddClick,
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
        icon={<StoreIcon />}
        title={t("serviceProviders")}
        subtitle={t("serviceProviders@subtitle")}
        actions={headerActions}
      />

      <Box sx={{ mt: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
          <TextField
            size="small"
            placeholder={t("search")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            sx={{ minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t("category")}</InputLabel>
            <Select
              value={selectedCategoryId ?? ""}
              label={t("category")}
              onChange={(e) => setSelectedCategoryId(e.target.value as number || undefined)}
            >
              <MenuItem value="">{t("all")}</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t("verificationStatus")}</InputLabel>
            <Select
              value={verifiedFilter}
              label={t("verificationStatus")}
              onChange={(e) =>
                handleVerifiedFilterChange(e.target.value as "all" | "verified" | "unverified")
              }
            >
              <MenuItem value="all">{t("all")}</MenuItem>
              <MenuItem value="verified">{t("verified")}</MenuItem>
              <MenuItem value="unverified">{t("unverified")}</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{t("sortBy")}</InputLabel>
            <Select
              value={sortOption}
              label={t("sortBy")}
              onChange={(e) => handleSortChange(e.target.value as ServiceProviderSortOption)}
            >
              <MenuItem value="NONE">{t("default")}</MenuItem>
              <MenuItem value="NAME_A_TO_Z">{t("nameAZ")}</MenuItem>
              <MenuItem value="RATING_HIGH_TO_LOW">{t("ratingHighLow")}</MenuItem>
              <MenuItem value="VISITORS_HIGH_TO_LOW">{t("visitorsHighLow")}</MenuItem>
              <MenuItem value="NEWEST_FIRST">{t("newestFirst")}</MenuItem>
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
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t("serviceProviders@details")}</DialogTitle>
        <DialogContent>
          {isLoadingDetail ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : providerDetail ? (
            <Stack spacing={3} sx={{ mt: 2 }}>
              {/* Header with icon */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={providerDetail.icon || undefined} sx={{ width: 80, height: 80 }}>
                  <StoreIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <h3 style={{ margin: 0 }}>{providerDetail.name}</h3>
                    {providerDetail.isVerified && (
                      <Chip icon={<VerifiedIcon />} label={t("verified")} color="success" size="small" />
                    )}
                  </Stack>
                  <div style={{ color: "#666" }}>{providerDetail.serviceCategoryName}</div>
                </Box>
              </Stack>

              {/* Info Grid */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <strong>{t("owner")}:</strong> {providerDetail.ownerName}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <strong>{t("phone")}:</strong> {providerDetail.phone || t("na")}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <strong>{t("location")}:</strong> {providerDetail.cityName || t("na")}
                  </Box>
                </Stack>

                <Stack spacing={1}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <StarIcon fontSize="small" color="action" />
                    <strong>{t("rating")}:</strong> {providerDetail.avgRating.toFixed(1)} ({providerDetail.rateCount} {t("reviews")})
                  </Box>
                  <Box>
                    <strong>{t("visitors")}:</strong> {providerDetail.visitorsCount}
                  </Box>
                  <Box>
                    <strong>{t("status")}:</strong> {providerDetail.statusName}
                  </Box>
                </Stack>
              </Box>

              {providerDetail.description && (
                <Box>
                  <strong>{t("description")}:</strong>
                  <div style={{ marginTop: 8 }}>{providerDetail.description}</div>
                </Box>
              )}

              {/* Images */}
              {providerDetail.images.length > 0 && (
                <Box>
                  <strong>{t("images")}:</strong>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                    {providerDetail.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${providerDetail.name} ${idx + 1}`}
                        style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Recent Ratings */}
              {ratings.length > 0 && (
                <Box>
                  <strong>{t("recentReviews")}:</strong>
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    {ratings.slice(0, 5).map((rating) => (
                      <Box key={rating.id} sx={{ pl: 2, borderLeft: "3px solid #eee" }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <strong>{rating.userName}</strong>
                          <Rating value={rating.rating} size="small" readOnly />
                        </Stack>
                        {rating.comment && <div style={{ marginTop: 4, color: "#666" }}>{rating.comment}</div>}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>{t("close")}</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Form Dialog */}
      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingProvider ? t("editProvider") : t("addProvider")}</DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent>
            {editingProvider && (
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1, mb: 2 }}>
                <Avatar
                  src={editingProvider.icon || undefined}
                  sx={{ width: 64, height: 64 }}
                >
                  <StoreIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={uploadIconMutation.isPending ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                  disabled={uploadIconMutation.isPending}
                >
                  {t("serviceProviders@uploadIcon")}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleUploadIcon(e, editingProvider.id)}
                  />
                </Button>
              </Stack>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("name")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t("category")}</InputLabel>
                  <Select
                    value={formData.serviceCategoryId}
                    label={t("category")}
                    onChange={(e) => setFormData({ ...formData, serviceCategoryId: e.target.value as number })}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("phone")}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("whatsApp")}
                  value={formData.whatsAppNumber}
                  onChange={(e) => setFormData({ ...formData, whatsAppNumber: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("cityName")}
                  value={formData.cityName}
                  onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("countryName")}
                  value={formData.countryName}
                  onChange={(e) => setFormData({ ...formData, countryName: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t("address")}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("price")}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  type="number"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("priceDescription")}
                  value={formData.priceDescription}
                  onChange={(e) => setFormData({ ...formData, priceDescription: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("fromTime")}
                  value={formData.fromTime}
                  onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })}
                  placeholder="09:00"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("toTime")}
                  value={formData.toTime}
                  onChange={(e) => setFormData({ ...formData, toTime: e.target.value })}
                  placeholder="18:00"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("methodPayment")}
                  value={formData.methodPayment}
                  onChange={(e) => setFormData({ ...formData, methodPayment: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("websiteUrl")}
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t("description")}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t("service")}
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  multiline
                  rows={2}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.hasOffer}
                      onChange={(e) => setFormData({ ...formData, hasOffer: e.target.checked })}
                    />
                  }
                  label={t("hasOffer")}
                />
              </Grid>
              {formData.hasOffer && (
                <Grid item xs={12}>
                  <TextField
                    label={t("offerDescription")}
                    value={formData.offerDescription}
                    onChange={(e) => setFormData({ ...formData, offerDescription: e.target.value })}
                    multiline
                    rows={2}
                    fullWidth
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormDialogOpen(false)}>{t("cancel")}</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <CircularProgress size={20} />
              ) : editingProvider ? (
                t("update")
              ) : (
                t("create")
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("deleteConfirmationTitle")}</DialogTitle>
        <DialogContent>
          {t("serviceProviders@deleteConfirmation")}: <strong>{editingProvider?.name}</strong>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t("cancel")}</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={20} /> : t("yesDelete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Provider Offers Dialog */}
      <Dialog
        open={offersDialogOpen}
        onClose={() => setOffersDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "warning.main" }}>
              <LocalOfferIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {t("providerOffers")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedProviderForOffers?.name}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3 }}>
          {isLoadingOffers ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : providerOffers.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                py: 6,
                textAlign: "center",
                bgcolor: "grey.50",
                borderRadius: 2
              }}
            >
              <LocalOfferIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {t("noOffersFound")}
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {providerOffers.map((offer) => (
                <Grid item xs={12} key={offer.id}>
                  <Card
                    elevation={2}
                    sx={{
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: 6,
                        transform: "translateY(-2px)",
                        borderColor: "primary.main"
                      },
                    }}
                  >
                    <CardContent sx={{ pb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                        <Box sx={{ flex: 1 }}>
                          {/* Header */}
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="h6" fontWeight={600} color="primary.main">
                              {offer.title}
                            </Typography>
                            <Chip
                              label={offer.isActive ? t("active") : t("inactive")}
                              color={offer.isActive ? "success" : "default"}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                            <Chip
                              label={
                                offer.approvalStatus === 1
                                  ? t("pending")
                                  : offer.approvalStatus === 2
                                  ? t("approved")
                                  : t("rejected")
                              }
                              color={
                                offer.approvalStatus === 1
                                  ? "warning"
                                  : offer.approvalStatus === 2
                                  ? "success"
                                  : "error"
                              }
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </Stack>

                          {/* Description */}
                          {offer.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 3, fontStyle: "italic" }}
                            >
                              {offer.description}
                            </Typography>
                          )}

                          {/* Stats Grid */}
                          <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                              <Paper elevation={0} sx={{ p: 2, bgcolor: "success.50", borderRadius: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                  <LoyaltyIcon sx={{ fontSize: 18, color: "success.main" }} />
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {t("pointsCost")}
                                  </Typography>
                                </Stack>
                                <Typography variant="h6" fontWeight={700} color="success.dark">
                                  {offer.pointsCost}
                                </Typography>
                              </Paper>
                            </Grid>

                            <Grid item xs={6} sm={3}>
                              <Paper elevation={0} sx={{ p: 2, bgcolor: "info.50", borderRadius: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                  <AttachMoneyIcon sx={{ fontSize: 18, color: "info.main" }} />
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {t("monetaryValue")}
                                  </Typography>
                                </Stack>
                                <Typography variant="h6" fontWeight={700} color="info.dark">
                                  {offer.monetaryValue}
                                  <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                                    {offer.currencyCode}
                                  </Typography>
                                </Typography>
                              </Paper>
                            </Grid>

                            <Grid item xs={6} sm={3}>
                              <Paper elevation={0} sx={{ p: 2, bgcolor: "warning.50", borderRadius: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                  <CalendarTodayIcon sx={{ fontSize: 18, color: "warning.main" }} />
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {t("codeExpiry")}
                                  </Typography>
                                </Stack>
                                <Typography variant="h6" fontWeight={700} color="warning.dark">
                                  {offer.offerCodeExpiryMinutes}
                                  <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                                    {t("minutes")}
                                  </Typography>
                                </Typography>
                              </Paper>
                            </Grid>

                            <Grid item xs={6} sm={3}>
                              <Paper elevation={0} sx={{ p: 2, bgcolor: "primary.50", borderRadius: 2 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                  <StarIcon sx={{ fontSize: 18, color: "primary.main" }} />
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {t("totalUses")}
                                  </Typography>
                                </Stack>
                                <Typography variant="h6" fontWeight={700} color="primary.dark">
                                  {offer.currentTotalUses}
                                  {offer.maxTotalUses && (
                                    <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                                      / {offer.maxTotalUses}
                                    </Typography>
                                  )}
                                </Typography>
                              </Paper>
                            </Grid>
                          </Grid>

                          {/* Validity Period */}
                          <Box sx={{ mt: 2 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <CalendarTodayIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                              <Typography variant="body2" color="text.secondary">
                                <strong>{t("validPeriod")}:</strong>{" "}
                                {new Date(offer.validFrom).toLocaleDateString()} -{" "}
                                {new Date(offer.validTo).toLocaleDateString()}
                              </Typography>
                            </Stack>
                          </Box>
                        </Box>

                        {/* Edit Button */}
                        <Tooltip title={t("edit")}>
                          <IconButton
                            size="large"
                            color="primary"
                            onClick={() => handleEditOffer(offer)}
                            sx={{
                              bgcolor: "primary.50",
                              "&:hover": { bgcolor: "primary.100" }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOffersDialogOpen(false)}
            variant="outlined"
            size="large"
          >
            {t("close")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Offer Dialog */}
      <Dialog
        open={offerEditDialogOpen}
        onClose={() => setOfferEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <EditIcon />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              {t("editOffer")}
            </Typography>
          </Stack>
        </DialogTitle>
        <Divider />
        <form onSubmit={handleOfferFormSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("offerTitle")}
                  value={offerFormData.title}
                  onChange={(e) => setOfferFormData({ ...offerFormData, title: e.target.value })}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("offerTitleAr")}
                  value={offerFormData.titleAr}
                  onChange={(e) => setOfferFormData({ ...offerFormData, titleAr: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t("description")}
                  value={offerFormData.description}
                  onChange={(e) => setOfferFormData({ ...offerFormData, description: e.target.value })}
                  multiline
                  rows={2}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t("descriptionAr")}
                  value={offerFormData.descriptionAr}
                  onChange={(e) => setOfferFormData({ ...offerFormData, descriptionAr: e.target.value })}
                  multiline
                  rows={2}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label={t("pointsCost")}
                  type="number"
                  value={offerFormData.pointsCost}
                  onChange={(e) =>
                    setOfferFormData({ ...offerFormData, pointsCost: parseInt(e.target.value) || 0 })
                  }
                  required
                  fullWidth
                  helperText={t("offers@pointsCostHelp")}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label={t("monetaryValue")}
                  type="number"
                  value={offerFormData.monetaryValue}
                  onChange={(e) =>
                    setOfferFormData({ ...offerFormData, monetaryValue: parseFloat(e.target.value) || 0 })
                  }
                  required
                  fullWidth
                  helperText={t("offers@monetaryValueHelp")}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label={t("currencyCode")}
                  value={offerFormData.currencyCode}
                  onChange={(e) =>
                    setOfferFormData({ ...offerFormData, currencyCode: e.target.value })
                  }
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("codeExpiry")}
                  type="number"
                  value={offerFormData.offerCodeExpiryMinutes}
                  onChange={(e) =>
                    setOfferFormData({ ...offerFormData, offerCodeExpiryMinutes: parseInt(e.target.value) || 60 })
                  }
                  required
                  fullWidth
                  InputProps={{ endAdornment: t("minutes") }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("maxUsesPerUser")}
                  type="number"
                  value={offerFormData.maxUsesPerUser || ""}
                  onChange={(e) =>
                    setOfferFormData({
                      ...offerFormData,
                      maxUsesPerUser: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  fullWidth
                  helperText={t("leaveEmptyForUnlimited")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("maxTotalUses")}
                  type="number"
                  value={offerFormData.maxTotalUses || ""}
                  onChange={(e) =>
                    setOfferFormData({
                      ...offerFormData,
                      maxTotalUses: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  fullWidth
                  helperText={t("leaveEmptyForUnlimited")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("validFrom")}
                  type="date"
                  value={offerFormData.validFrom}
                  onChange={(e) => setOfferFormData({ ...offerFormData, validFrom: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("validTo")}
                  type="date"
                  value={offerFormData.validTo}
                  onChange={(e) => setOfferFormData({ ...offerFormData, validTo: e.target.value })}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t("imageUrl")}
                  value={offerFormData.imageUrl}
                  onChange={(e) => setOfferFormData({ ...offerFormData, imageUrl: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={offerFormData.isActive}
                      onChange={(e) => setOfferFormData({ ...offerFormData, isActive: e.target.checked })}
                    />
                  }
                  label={t("active")}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              onClick={() => setOfferEditDialogOpen(false)}
              variant="outlined"
              size="large"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={updateOfferMutation.isPending}
              sx={{ minWidth: 120 }}
            >
              {updateOfferMutation.isPending ? <CircularProgress size={24} color="inherit" /> : t("update")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Change Owner Dialog */}
      <Dialog
        open={changeOwnerDialogOpen}
        onClose={() => setChangeOwnerDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "info.main" }}>
              <SwapHorizIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {t("serviceProviders@changeOwner")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {changeOwnerProvider?.name}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t("serviceProviders@currentOwner")}: <strong>{changeOwnerProvider?.ownerName}</strong>
              </Typography>
            </Box>
            <TextField
              label={t("serviceProviders@newOwnerId")}
              type="number"
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              required
              fullWidth
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setChangeOwnerDialogOpen(false)}
            variant="outlined"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleChangeOwnerSubmit}
            variant="contained"
            disabled={changeOwnerMutation.isPending || !newOwnerId.trim()}
          >
            {changeOwnerMutation.isPending ? <CircularProgress size={20} /> : t("serviceProviders@changeOwner")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block / Unblock Provider from Loyalty Dialog */}
      <Dialog open={blockProviderDialogOpen} onClose={() => setBlockProviderDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BlockIcon color={isUnblockMode ? "success" : "error"} />
          {isUnblockMode ? t("loyalty@unblockProvider") : t("loyalty@blockProvider")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("loyalty@targetProvider")}: <strong>{blockProviderTarget?.name}</strong>
          </Typography>
          {!isUnblockMode && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label={t("loyalty@blockReason")}
                value={blockProviderReason}
                onChange={(e) => setBlockProviderReason(e.target.value)}
                required
                fullWidth
                multiline
                rows={2}
                placeholder={t("loyalty@blockReasonPlaceholder")}
              />
              <TextField
                label={t("loyalty@blockUntil")}
                value={blockProviderUntil}
                onChange={(e) => setBlockProviderUntil(e.target.value)}
                fullWidth
                type="datetime-local"
                helperText={t("loyalty@blockUntilHelp")}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          )}
          {isUnblockMode && (
            <Alert severity="info" sx={{ mt: 1 }}>{t("loyalty@unblockProviderConfirm")}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setBlockProviderDialogOpen(false)}>{t("cancel")}</Button>
          <Button
            variant="contained"
            color={isUnblockMode ? "success" : "error"}
            onClick={handleBlockProviderSubmit}
            disabled={blockProviderMutation.isPending || unblockProviderMutation.isPending || (!isUnblockMode && !blockProviderReason.trim())}
            startIcon={(blockProviderMutation.isPending || unblockProviderMutation.isPending) ? <CircularProgress size={16} /> : isUnblockMode ? <LockOpenIcon /> : <BlockIcon />}
          >
            {isUnblockMode ? t("loyalty@unblockProvider") : t("loyalty@blockProvider")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
