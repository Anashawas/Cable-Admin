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
  Skeleton,
  useTheme,
  InputAdornment,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
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
import SearchIcon from "@mui/icons-material/Search";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PublicIcon from "@mui/icons-material/Public";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PaymentIcon from "@mui/icons-material/Payment";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CollectionsIcon from "@mui/icons-material/Collections";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import AppScreenContainer from "../../app/components/AppScreenContainer";
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
  useAddServiceProviderAttachments,
  useDeleteServiceProviderAttachments,
  ServiceProviderSortOption,
} from "../hooks/use-service-providers";
import { useServiceCategories } from "../hooks/use-service-categories";
import { useOffersForProvider, useUpdateOffer, useUploadOfferImage } from "../../offers/hooks/use-offers";
import { useBlockProvider, useUnblockProvider } from "../../loyalty/hooks/use-loyalty";
import type { ServiceProviderDto, CreateServiceProviderRequest, UpdateServiceProviderRequest } from "../types/api";
import type { OfferDto, UpdateOfferRequest } from "../../offers/types/api";
import { getUsersList } from "../../users/services/user-service";
import { PROVIDER_ROLE_ID } from "../../users/constants/roles";
import type { UserSummaryDto } from "../../users/types/api";

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
  latitude: string;
  longitude: string;
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
  latitude: "",
  longitude: "",
};

export default function ServiceProvidersScreen() {
  const { t } = useTranslation("serviceProviders");
  const navigate = useNavigate();
  const theme = useTheme();
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
  const uploadAttachmentsMutation = useAddServiceProviderAttachments();
  const deleteAttachmentsMutation = useDeleteServiceProviderAttachments();

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
  const [selectedOwner, setSelectedOwner] = useState<UserSummaryDto | null>(null);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
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
    currencyCode: "JOD",
    maxUsesPerUser: null,
    maxTotalUses: null,
    offerCodeExpirySeconds: 60,
    imageUrl: "",
    validFrom: "",
    validTo: null,
    isActive: true,
  });

  const { data: providerDetail, isLoading: isLoadingDetail } = useServiceProvider(
    selectedProviderId ?? 0
  );
  const { data: ratings = [] } = useServiceProviderRatings(selectedProviderId ?? 0);

  const { data: providerOffers = [], isLoading: isLoadingOffers } = useOffersForProvider(
    selectedProviderForOffers?.id ?? undefined
  );

  const updateOfferMutation = useUpdateOffer();
  const uploadOfferImageMutation = useUploadOfferImage();
  const [offerImageFile, setOfferImageFile] = useState<File | null>(null);
  const [offerImagePreview, setOfferImagePreview] = useState<string | null>(null);
  const changeOwnerMutation = useChangeServiceProviderOwner();
  const blockProviderMutation = useBlockProvider();
  const unblockProviderMutation = useUnblockProvider();

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return data.slice(start, start + paginationModel.pageSize);
  }, [data, paginationModel.page, paginationModel.pageSize]);

  const verifiedCount = useMemo(() => data.filter((r) => r.isVerified).length, [data]);
  const withOffersCount = useMemo(() => data.filter((r) => r.hasOffer).length, [data]);

  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users-list-for-owner"],
    queryFn: ({ signal }) => getUsersList(signal),
    enabled: changeOwnerDialogOpen,
    staleTime: 60_000,
  });

  const allProviders = useMemo(
    () => allUsers.filter((u) => u.role?.id === PROVIDER_ROLE_ID),
    [allUsers]
  );

  const filteredProviders = useMemo(() => {
    const q = ownerSearch.trim().toLowerCase();
    if (!q) return allProviders;
    return allProviders.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        String(u.id ?? "").includes(q)
    );
  }, [allProviders, ownerSearch]);

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
          openSuccessSnackbar({ message: t("serviceProviders@verifiedSuccess") });
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
      latitude: row.latitude?.toString() || "",
      longitude: row.longitude?.toString() || "",
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
      offerCodeExpirySeconds: offer.offerCodeExpirySeconds,
      imageUrl: offer.imageUrl || "",
      validFrom: offer.validFrom.split('T')[0],
      validTo: offer.validTo ? offer.validTo.split('T')[0] : null,
      isActive: offer.isActive,
    });
    setOfferImageFile(null);
    setOfferImagePreview(null);
    setOfferEditDialogOpen(true);
  }, []);

  const handleOfferImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOfferImageFile(file);
    setOfferImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  }, []);

  const handleChangeOwnerClick = useCallback((e: React.MouseEvent, row: ServiceProviderDto) => {
    e.stopPropagation();
    setChangeOwnerProvider(row);
    setNewOwnerId("");
    setSelectedOwner(null);
    setOwnerSearch("");
    setChangeOwnerDialogOpen(true);
  }, []);

  const handleChangeOwnerSubmit = useCallback(() => {
    const ownerId = selectedOwner?.id ?? parseInt(newOwnerId.trim());
    if (!changeOwnerProvider || !ownerId) {
      openErrorSnackbar({ message: t("serviceProviders@ownerIdRequired") });
      return;
    }

    changeOwnerMutation.mutate(
      { serviceProviderId: changeOwnerProvider.id, data: { newOwnerId: ownerId } },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("serviceProviders@ownerChanged") });
          setChangeOwnerDialogOpen(false);
          setChangeOwnerProvider(null);
          setNewOwnerId("");
          setSelectedOwner(null);
          setOwnerSearch("");
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      }
    );
  }, [changeOwnerProvider, selectedOwner, newOwnerId, changeOwnerMutation, openSuccessSnackbar, openErrorSnackbar, t]);

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
            if (offerImageFile) {
              uploadOfferImageMutation.mutate(
                { id: editingOffer.id, file: offerImageFile },
                {
                  onSuccess: () => {
                    openSuccessSnackbar({ message: t("offerUpdated") });
                    setOfferEditDialogOpen(false);
                    setEditingOffer(null);
                    setOfferImageFile(null);
                    setOfferImagePreview(null);
                  },
                  onError: () => {
                    openSuccessSnackbar({ message: t("offerUpdated") });
                    openErrorSnackbar({ message: t("offers@imageUploadFailed") });
                    setOfferEditDialogOpen(false);
                    setEditingOffer(null);
                    setOfferImageFile(null);
                    setOfferImagePreview(null);
                  },
                }
              );
            } else {
              openSuccessSnackbar({ message: t("offerUpdated") });
              setOfferEditDialogOpen(false);
              setEditingOffer(null);
              setOfferImageFile(null);
              setOfferImagePreview(null);
            }
          },
          onError: (err: Error) => {
            openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
          },
        }
      );
    },
    [editingOffer, offerFormData, offerImageFile, updateOfferMutation, uploadOfferImageMutation, openSuccessSnackbar, openErrorSnackbar, t]
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

      // Helper: ensure time is in HH:MM:SS format (backend requirement)
      const formatTime = (t: string) => {
        const trimmed = t.trim();
        if (!trimmed) return null;
        // type="time" returns "HH:MM", backend needs "HH:MM:SS"
        return trimmed.split(":").length === 2 ? `${trimmed}:00` : trimmed;
      };

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
        fromTime: formatTime(formData.fromTime),
        toTime: formatTime(formData.toTime),
        methodPayment: formData.methodPayment.trim() || null,
        hasOffer: formData.hasOffer,
        offerDescription: formData.offerDescription.trim() || null,
        service: formData.service.trim() || null,
        whatsAppNumber: formData.whatsAppNumber.trim() || null,
        websiteUrl: formData.websiteUrl.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
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

  const handleUploadImages = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, providerId: number) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      uploadAttachmentsMutation.mutate(
        { id: providerId, files: Array.from(files) },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("serviceProviders@imagesUploaded") });
          },
          onError: (err: Error) => {
            openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
          },
        }
      );
      e.target.value = "";
    },
    [uploadAttachmentsMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const handleDeleteAllImages = useCallback(
    (providerId: number) => {
      deleteAttachmentsMutation.mutate(providerId, {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("serviceProviders@imagesDeleted") });
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      });
    },
    [deleteAttachmentsMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const openLightbox = useCallback((images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

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

  return (
    <AppScreenContainer>
      {/* Banner */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
          borderRadius: 3,
          p: { xs: 2.5, md: 4 },
          mb: 3,
          position: "relative",
          overflow: "hidden",
          color: "white",
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -60, right: 100, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={3}>
          {/* Left: icon + title + KPIs */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }}>
            <Box sx={{ width: 64, height: 64, borderRadius: 2, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <StoreIcon sx={{ fontSize: 36, color: "white" }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="white">{t("serviceProviders")}</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5 }}>{t("serviceProviders@subtitle")}</Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap">
                <Box sx={{ background: "rgba(255,255,255,0.13)", borderRadius: 2, px: 2, py: 1, minWidth: 90 }}>
                  {isLoading ? (
                    <Skeleton variant="rounded" width={56} height={36} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                  ) : (
                    <Typography variant="h5" fontWeight={700} color="white">{data.length}</Typography>
                  )}
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("kpi_total")}</Typography>
                </Box>
                <Box sx={{ background: "rgba(255,255,255,0.13)", borderRadius: 2, px: 2, py: 1, minWidth: 90 }}>
                  {isLoading ? (
                    <Skeleton variant="rounded" width={56} height={36} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                  ) : (
                    <Typography variant="h5" fontWeight={700} color="white">{verifiedCount}</Typography>
                  )}
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("kpi_verified")}</Typography>
                </Box>
                <Box sx={{ background: "rgba(255,255,255,0.13)", borderRadius: 2, px: 2, py: 1, minWidth: 90 }}>
                  {isLoading ? (
                    <Skeleton variant="rounded" width={56} height={36} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                  ) : (
                    <Typography variant="h5" fontWeight={700} color="white">{withOffersCount}</Typography>
                  )}
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("kpi_withOffers")}</Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>

          {/* Right: action buttons */}
          <Stack direction="row" spacing={1.5} flexShrink={0}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/service-providers/add")}
              sx={{
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                fontWeight: 600,
                "&:hover": { background: "rgba(255,255,255,0.3)" },
              }}
            >
              {t("addProvider")}
            </Button>
            <Tooltip title={t("refresh")}>
              <IconButton
                onClick={handleRefresh}
                sx={{
                  background: "rgba(255,255,255,0.15)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.25)",
                  "&:hover": { background: "rgba(255,255,255,0.25)" },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Shimmer skeleton while loading */}
      {isLoading && (
        <>
          <Paper elevation={0} sx={{ p: 2, mb: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {[250, 150, 150, 180].map((w, i) => (
                <Skeleton key={i} variant="rounded" width={w} height={40} />
              ))}
            </Stack>
          </Paper>
          <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Stack direction="row" spacing={2}>
                {[70, 80, 200, 150, 150, 120, 150, 110].map((w, i) => (
                  <Skeleton key={i} variant="text" width={w} height={24} />
                ))}
              </Stack>
            </Box>
            {Array.from({ length: 8 }).map((_, i) => (
              <Box key={i} sx={{ px: 2, py: 1.5, borderBottom: i < 7 ? `1px solid ${theme.palette.divider}` : "none" }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Skeleton variant="text" width={40} height={24} />
                  <Skeleton variant="circular" width={40} height={40} />
                  <Skeleton variant="text" width={180} height={24} />
                  <Skeleton variant="text" width={120} height={24} />
                  <Skeleton variant="text" width={120} height={24} />
                  <Skeleton variant="text" width={90} height={24} />
                  <Skeleton variant="rounded" width={130} height={28} />
                  <Skeleton variant="rounded" width={90} height={28} />
                </Stack>
              </Box>
            ))}
          </Paper>
        </>
      )}

      {/* Filter bar + grid */}
      {!isLoading && (
        <>
          <Paper elevation={0} sx={{ p: 2, mb: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
            <Stack direction="row" spacing={2} flexWrap="wrap">
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
          </Paper>

          <AppDataGrid
            data={paginatedData}
            columns={columns}
            loading={false}
            disablePagination={false}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            total={data.length}
          />
        </>
      )}

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

              {/* Images Gallery */}
              {providerDetail.images.length > 0 && (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <CollectionsIcon sx={{ fontSize: 20, color: "info.main" }} />
                    <Typography variant="subtitle2" fontWeight={700} color="info.main">
                      {t("serviceProviders@imagesGallery")} ({providerDetail.images.length})
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                      gap: 1.5,
                    }}
                  >
                    {providerDetail.images.map((img, idx) => (
                      <Box
                        key={idx}
                        onClick={() => openLightbox(providerDetail.images, idx)}
                        sx={{
                          position: "relative",
                          paddingTop: "100%",
                          borderRadius: 2.5,
                          overflow: "hidden",
                          cursor: "pointer",
                          border: "2px solid",
                          borderColor: "divider",
                          transition: "all 0.25s ease",
                          "&:hover": {
                            borderColor: "info.main",
                            transform: "scale(1.04)",
                            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                            "& .img-overlay": { opacity: 1 },
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={img}
                          alt={`${providerDetail.name} ${idx + 1}`}
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <Box
                          className="img-overlay"
                          sx={{
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: 0,
                            transition: "opacity 0.25s ease",
                          }}
                        >
                          <ZoomInIcon sx={{ color: "white", fontSize: 30, filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.4))" }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
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
      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", maxHeight: "95vh", display: "flex", flexDirection: "column" } }}>
        {/* Gradient header */}
        <Box sx={{
          background: editingProvider
            ? "linear-gradient(135deg, #e65100 0%, #f57c00 100%)"
            : "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
          px: 3, py: 2.5,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            {editingProvider ? (
              <Avatar src={editingProvider.icon || undefined} sx={{ width: 52, height: 52, border: "2px solid rgba(255,255,255,0.4)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                <StoreIcon sx={{ fontSize: 28 }} />
              </Avatar>
            ) : (
              <Box sx={{ width: 52, height: 52, borderRadius: 2, background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AddIcon sx={{ color: "white", fontSize: 28 }} />
              </Box>
            )}
            <Box>
              <Typography variant="h6" fontWeight={700} color="white">
                {editingProvider ? t("editProvider") : t("addProvider")}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
                {editingProvider ? editingProvider.name : t("formInfoHint")}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {editingProvider && (
              <Button
                component="label"
                size="small"
                startIcon={uploadIconMutation.isPending ? <CircularProgress size={14} color="inherit" /> : <CloudUploadIcon fontSize="small" />}
                disabled={uploadIconMutation.isPending}
                sx={{ color: "rgba(255,255,255,0.9)", bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, "&:hover": { bgcolor: "rgba(255,255,255,0.25)" }, fontSize: "0.78rem" }}
              >
                {t("uploadIcon")}
                <input type="file" accept="image/*" hidden onChange={(e) => handleUploadIcon(e, editingProvider.id)} />
              </Button>
            )}
            <IconButton size="small" onClick={() => setFormDialogOpen(false)} sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" } }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </IconButton>
          </Stack>
        </Box>

        <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <DialogContent sx={{ pt: 2.5, pb: 1, px: 3, overflowY: "auto", flex: 1 }}>
            <Stack spacing={3}>

              {/* Required hint */}
              <Alert
                severity="info"
                icon={<InfoOutlinedIcon fontSize="small" />}
                sx={{ borderRadius: 2, py: 0.5, "& .MuiAlert-message": { fontSize: "0.82rem" } }}
              >
                {t("formRequiredHint")}
              </Alert>

              {/* ── Section: Basic Information ── */}
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <StoreIcon sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography variant="overline" fontWeight={700} color="primary.main" sx={{ letterSpacing: 1.1, lineHeight: 1 }}>
                    {t("basicInfo")}
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={7}>
                    <TextField
                      label={`${t("name")} *`}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      fullWidth
                      autoFocus
                      size="small"
                      helperText={t("nameHint")}
                      InputProps={{ startAdornment: <InputAdornment position="start"><StoreIcon sx={{ fontSize: 16, color: "text.disabled" }} /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <FormControl fullWidth required size="small">
                      <InputLabel>{t("category")} *</InputLabel>
                      <Select
                        value={formData.serviceCategoryId}
                        label={`${t("category")} *`}
                        onChange={(e) => setFormData({ ...formData, serviceCategoryId: e.target.value as number })}
                      >
                        {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{t("status")}</InputLabel>
                      <Select
                        value={formData.statusId}
                        label={t("status")}
                        onChange={(e) => setFormData({ ...formData, statusId: e.target.value as number })}
                      >
                        <MenuItem value={1}>{t("active")}</MenuItem>
                        <MenuItem value={2}>{t("inactive")}</MenuItem>
                        <MenuItem value={3}>{t("pending")}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      label={t("description")}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      multiline
                      rows={2}
                      fullWidth
                      size="small"
                      helperText={t("descriptionHint")}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* ── Section: Contact & Location ── */}
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <ContactPhoneIcon sx={{ fontSize: 18, color: "success.main" }} />
                  <Typography variant="overline" fontWeight={700} color="success.main" sx={{ letterSpacing: 1.1, lineHeight: 1 }}>
                    {t("contactInfo")}
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label={t("phone")}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      fullWidth
                      size="small"
                      helperText={t("phoneHint")}
                      InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 16, color: "text.disabled" }} /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label={t("whatsApp")}
                      value={formData.whatsAppNumber}
                      onChange={(e) => setFormData({ ...formData, whatsAppNumber: e.target.value })}
                      fullWidth
                      size="small"
                      helperText={t("whatsAppHint")}
                      InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 16, color: "text.disabled" }} /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label={t("ownerPhone")}
                      value={formData.ownerPhone}
                      onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                      fullWidth
                      size="small"
                      helperText={t("ownerPhoneHint")}
                      InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 16, color: "text.disabled" }} /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label={t("cityName")}
                      value={formData.cityName}
                      onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
                      fullWidth
                      size="small"
                      InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ fontSize: 16, color: "text.disabled" }} /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label={t("countryName")}
                      value={formData.countryName}
                      onChange={(e) => setFormData({ ...formData, countryName: e.target.value })}
                      fullWidth
                      size="small"
                      InputProps={{ startAdornment: <InputAdornment position="start"><PublicIcon sx={{ fontSize: 16, color: "text.disabled" }} /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label={t("websiteUrl")}
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      fullWidth
                      size="small"
                      placeholder="https://example.com"
                      helperText={t("websiteHint")}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label={t("address")}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      fullWidth
                      size="small"
                      helperText={t("addressHint")}
                      InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ fontSize: 16, color: "text.disabled" }} /></InputAdornment> }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* ── Section: GPS Location ── */}
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <MyLocationIcon sx={{ fontSize: 18, color: "warning.main" }} />
                  <Typography variant="overline" fontWeight={700} color="warning.main" sx={{ letterSpacing: 1.1, lineHeight: 1 }}>
                    {t("locationInfo")}
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2, py: 0.5, "& .MuiAlert-message": { fontSize: "0.8rem" } }}>
                  {t("coordinatesHint")}
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label={t("latitude")}
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      type="number"
                      inputProps={{ step: "any" }}
                      fullWidth
                      size="small"
                      placeholder="31.9522"
                      helperText={t("latitudeHint")}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label={t("longitude")}
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      type="number"
                      inputProps={{ step: "any" }}
                      fullWidth
                      size="small"
                      placeholder="35.9284"
                      helperText={t("longitudeHint")}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* ── Section: Business Hours & Pricing ── */}
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <AccessTimeIcon sx={{ fontSize: 18, color: "secondary.main" }} />
                  <Typography variant="overline" fontWeight={700} color="secondary.main" sx={{ letterSpacing: 1.1, lineHeight: 1 }}>
                    {t("hoursAndPricing")}
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      label={t("fromTime")}
                      value={formData.fromTime}
                      onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })}
                      type="time"
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      helperText={t("openingHoursHint")}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      label={t("toTime")}
                      value={formData.toTime}
                      onChange={(e) => setFormData({ ...formData, toTime: e.target.value })}
                      type="time"
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      helperText={t("openingHoursHint")}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label={t("price")}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      type="number"
                      fullWidth
                      size="small"
                      InputProps={{ startAdornment: <InputAdornment position="start"><AttachMoneyIcon sx={{ fontSize: 16, color: "text.disabled" }} /></InputAdornment> }}
                      helperText={t("priceHint")}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label={t("priceDescription")}
                      value={formData.priceDescription}
                      onChange={(e) => setFormData({ ...formData, priceDescription: e.target.value })}
                      fullWidth
                      size="small"
                      placeholder={t("priceDescPlaceholder")}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label={t("methodPayment")}
                      value={formData.methodPayment}
                      onChange={(e) => setFormData({ ...formData, methodPayment: e.target.value })}
                      fullWidth
                      size="small"
                      placeholder={t("paymentPlaceholder")}
                      helperText={t("paymentHint")}
                      InputProps={{ startAdornment: <InputAdornment position="start"><PaymentIcon sx={{ fontSize: 16, color: "text.disabled" }} /></InputAdornment> }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* ── Section: Services & Offers ── */}
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <LocalOfferIcon sx={{ fontSize: 18, color: "error.main" }} />
                  <Typography variant="overline" fontWeight={700} color="error.main" sx={{ letterSpacing: 1.1, lineHeight: 1 }}>
                    {t("servicesAndOffers")}
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label={t("service")}
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      multiline
                      rows={2}
                      fullWidth
                      size="small"
                      helperText={t("servicesHint")}
                      placeholder={t("servicesPlaceholder")}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Paper
                      variant="outlined"
                      sx={{
                        px: 2, py: 1.5, borderRadius: 2,
                        borderColor: formData.hasOffer ? "warning.main" : "divider",
                        bgcolor: formData.hasOffer ? "rgba(255, 152, 0, 0.04)" : "transparent",
                        transition: "all 0.2s",
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.hasOffer}
                            onChange={(e) => setFormData({ ...formData, hasOffer: e.target.checked })}
                            color="warning"
                          />
                        }
                        label={
                          <Box>
                            <Typography fontWeight={600} color={formData.hasOffer ? "warning.dark" : "text.secondary"}>
                              {t("hasOffer")}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">{t("hasOfferHint")}</Typography>
                          </Box>
                        }
                      />
                      {formData.hasOffer && (
                        <TextField
                          label={t("offerDescription")}
                          value={formData.offerDescription}
                          onChange={(e) => setFormData({ ...formData, offerDescription: e.target.value })}
                          multiline
                          rows={2}
                          fullWidth
                          size="small"
                          sx={{ mt: 1.5 }}
                          placeholder={t("offerDescPlaceholder")}
                        />
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* ── Section: Images & Gallery ── */}
              {editingProvider && (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <CollectionsIcon sx={{ fontSize: 18, color: "info.main" }} />
                    <Typography variant="overline" fontWeight={700} color="info.main" sx={{ letterSpacing: 1.1, lineHeight: 1 }}>
                      {t("serviceProviders@imagesGallery")}
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />

                  {/* Current images gallery */}
                  {editingProvider.images.length > 0 ? (
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                          gap: 1.5,
                        }}
                      >
                        {editingProvider.images.map((img, idx) => (
                          <Box
                            key={idx}
                            onClick={() => openLightbox(editingProvider.images, idx)}
                            sx={{
                              position: "relative",
                              paddingTop: "100%",
                              borderRadius: 2,
                              overflow: "hidden",
                              cursor: "pointer",
                              border: "2px solid",
                              borderColor: "divider",
                              transition: "all 0.25s ease",
                              "&:hover": {
                                borderColor: "info.main",
                                transform: "scale(1.03)",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                                "& .img-overlay": { opacity: 1 },
                              },
                            }}
                          >
                            <Box
                              component="img"
                              src={img}
                              alt={`${editingProvider.name} ${idx + 1}`}
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <Box
                              className="img-overlay"
                              sx={{
                                position: "absolute",
                                inset: 0,
                                background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: 0,
                                transition: "opacity 0.25s ease",
                              }}
                            >
                              <ZoomInIcon sx={{ color: "white", fontSize: 28, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }} />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {editingProvider.images.length} {t("serviceProviders@imagesCount")}
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          startIcon={deleteAttachmentsMutation.isPending ? <CircularProgress size={14} /> : <DeleteSweepIcon fontSize="small" />}
                          disabled={deleteAttachmentsMutation.isPending}
                          onClick={() => handleDeleteAllImages(editingProvider.id)}
                          sx={{ borderRadius: 2, fontSize: "0.75rem" }}
                        >
                          {t("serviceProviders@deleteAllImages")}
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Paper
                      variant="outlined"
                      sx={{
                        py: 3,
                        textAlign: "center",
                        borderRadius: 2,
                        borderStyle: "dashed",
                        borderColor: "grey.300",
                        bgcolor: "grey.50",
                        mb: 2,
                      }}
                    >
                      <CollectionsIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {t("serviceProviders@noImages")}
                      </Typography>
                    </Paper>
                  )}

                  {/* Upload button */}
                  <Button
                    component="label"
                    variant="outlined"
                    fullWidth
                    startIcon={
                      uploadAttachmentsMutation.isPending
                        ? <CircularProgress size={18} color="inherit" />
                        : <AddPhotoAlternateIcon />
                    }
                    disabled={uploadAttachmentsMutation.isPending}
                    sx={{
                      borderRadius: 2,
                      borderStyle: "dashed",
                      borderWidth: 2,
                      py: 1.5,
                      color: "info.main",
                      borderColor: "info.200",
                      bgcolor: "rgba(2, 136, 209, 0.04)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderStyle: "dashed",
                        borderWidth: 2,
                        bgcolor: "rgba(2, 136, 209, 0.08)",
                        borderColor: "info.main",
                      },
                    }}
                  >
                    {uploadAttachmentsMutation.isPending
                      ? t("serviceProviders@uploadingImages")
                      : t("serviceProviders@uploadImages")}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(e) => handleUploadImages(e, editingProvider.id)}
                    />
                  </Button>
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block", textAlign: "center" }}>
                    {t("serviceProviders@uploadImagesHint")}
                  </Typography>
                </Box>
              )}

            </Stack>
          </DialogContent>

          <Divider />
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={() => setFormDialogOpen(false)} color="inherit" variant="outlined" sx={{ borderRadius: 2, minWidth: 100 }}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
              startIcon={(createMutation.isPending || updateMutation.isPending) ? <CircularProgress size={18} color="inherit" /> : editingProvider ? <EditIcon /> : <AddIcon />}
              sx={{
                borderRadius: 2, minWidth: 140,
                background: editingProvider
                  ? "linear-gradient(135deg, #e65100 0%, #f57c00 100%)"
                  : "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
                "&:hover": {
                  background: editingProvider
                    ? "linear-gradient(135deg, #bf360c 0%, #e65100 100%)"
                    : "linear-gradient(135deg, #0a3880 0%, #0d47a1 100%)",
                },
              }}
            >
              {createMutation.isPending || updateMutation.isPending
                ? (editingProvider ? t("updating") : t("creating"))
                : (editingProvider ? t("update") : t("create"))}
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
                                  {offer.offerCodeExpirySeconds}
                                  <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                                    {t("offers@seconds")}
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
                                {offer.validTo ? new Date(offer.validTo).toLocaleDateString() : "∞"}
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
                  value={offerFormData.offerCodeExpirySeconds}
                  onChange={(e) =>
                    setOfferFormData({ ...offerFormData, offerCodeExpirySeconds: parseInt(e.target.value) || 60 })
                  }
                  required
                  fullWidth
                  InputProps={{ endAdornment: t("offers@seconds") }}
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
                  value={offerFormData.validTo ?? ""}
                  onChange={(e) => setOfferFormData({ ...offerFormData, validTo: e.target.value || null })}
                  fullWidth
                  helperText={t("offers@leaveEmptyNoExpiry")}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  {/* Preview: show uploaded file or existing imageUrl */}
                  <Box
                    sx={{
                      width: 90,
                      height: 90,
                      borderRadius: 2.5,
                      overflow: "hidden",
                      border: "2px dashed",
                      borderColor: (offerImagePreview || offerFormData.imageUrl) ? "info.main" : "grey.300",
                      bgcolor: (offerImagePreview || offerFormData.imageUrl) ? "transparent" : "grey.50",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.25s ease",
                    }}
                  >
                    {(offerImagePreview || offerFormData.imageUrl) ? (
                      <Box
                        component="img"
                        src={offerImagePreview || offerFormData.imageUrl || ""}
                        alt="offer"
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; }}
                      />
                    ) : (
                      <AddPhotoAlternateIcon sx={{ fontSize: 32, color: "text.disabled" }} />
                    )}
                  </Box>
                  <Stack spacing={1} flex={1}>
                    <Button
                      component="label"
                      variant="outlined"
                      fullWidth
                      size="small"
                      startIcon={<CloudUploadIcon fontSize="small" />}
                      sx={{
                        borderRadius: 2,
                        borderStyle: "dashed",
                        borderWidth: 2,
                        py: 1,
                        color: "info.main",
                        borderColor: "info.200",
                        bgcolor: "rgba(2, 136, 209, 0.04)",
                        "&:hover": { borderStyle: "dashed", borderWidth: 2, bgcolor: "rgba(2, 136, 209, 0.08)", borderColor: "info.main" },
                      }}
                    >
                      {offerImageFile ? offerImageFile.name : t("offers@selectImage")}
                      <input type="file" accept="image/*" hidden onChange={handleOfferImageFileChange} />
                    </Button>
                    {offerImagePreview && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => { setOfferImageFile(null); setOfferImagePreview(null); }}
                        sx={{ alignSelf: "flex-start", borderRadius: 2, fontSize: "0.7rem" }}
                      >
                        {t("offers@removeImage")}
                      </Button>
                    )}
                  </Stack>
                </Stack>
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
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", maxHeight: "85vh", display: "flex", flexDirection: "column" } }}
      >
        {/* Gradient header */}
        <Box sx={{
          background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
          px: 3, py: 2.5,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 48, height: 48, borderRadius: 2, background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SwapHorizIcon sx={{ color: "white", fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="white">
                {t("serviceProviders@changeOwner")}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
                {changeOwnerProvider?.name}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => setChangeOwnerDialogOpen(false)} sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "rgba(255,255,255,0.15)" } }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <DialogContent sx={{ pt: 2.5, pb: 1, px: 3, flex: 1, overflowY: "auto" }}>
            <Stack spacing={2}>

              {/* Current owner card */}
              <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, bgcolor: "grey.50" }}>
                <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {t("serviceProviders@currentOwner")}
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.light", fontSize: 14 }}>
                    {changeOwnerProvider?.ownerName?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography fontWeight={600}>{changeOwnerProvider?.ownerName}</Typography>
                </Stack>
              </Paper>

              {/* Selected new owner preview */}
              {selectedOwner && (
                <Paper
                  variant="outlined"
                  sx={{ px: 2, py: 1.5, borderRadius: 2, borderColor: "success.main", bgcolor: "rgba(46,125,50,0.04)" }}
                >
                  <Typography variant="caption" color="success.main" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                    New Owner Selected
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 36, height: 36, bgcolor: "success.main", fontSize: 14 }}>
                        {selectedOwner.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600} variant="body2">{selectedOwner.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{selectedOwner.email}</Typography>
                      </Box>
                    </Stack>
                    <Chip label={`ID: ${selectedOwner.id}`} size="small" color="success" variant="outlined" />
                  </Stack>
                </Paper>
              )}

              {/* Search providers */}
              <TextField
                size="small"
                placeholder="Search providers by name, email or ID..."
                value={ownerSearch}
                onChange={(e) => setOwnerSearch(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Provider list */}
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", maxHeight: 300 }}>
                {isLoadingUsers ? (
                  <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : filteredProviders.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <PersonIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {ownerSearch ? "No providers match your search" : "No providers found"}
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding sx={{ maxHeight: 300, overflowY: "auto" }}>
                    {filteredProviders.map((provider, idx) => (
                      <ListItemButton
                        key={provider.id}
                        selected={selectedOwner?.id === provider.id}
                        onClick={() => {
                          setSelectedOwner(provider);
                          setNewOwnerId(String(provider.id ?? ""));
                        }}
                        sx={{
                          borderBottom: idx < filteredProviders.length - 1 ? "1px solid" : "none",
                          borderColor: "divider",
                          "&.Mui-selected": {
                            bgcolor: "primary.50",
                            borderLeft: "3px solid",
                            borderLeftColor: "primary.main",
                          },
                          "&.Mui-selected:hover": { bgcolor: "primary.100" },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ width: 38, height: 38, bgcolor: selectedOwner?.id === provider.id ? "primary.main" : "grey.300", fontSize: 14 }}>
                            {provider.name?.[0]?.toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{provider.name}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary">{provider.email}</Typography>}
                        />
                        <Chip label={`#${provider.id}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
                      </ListItemButton>
                    ))}
                  </List>
                )}
              </Paper>

            </Stack>
          </DialogContent>

          <Divider />
          <DialogActions sx={{ px: 3, py: 2, gap: 1, flexShrink: 0 }}>
            <Button onClick={() => setChangeOwnerDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleChangeOwnerSubmit}
              variant="contained"
              disabled={changeOwnerMutation.isPending || (!selectedOwner && !newOwnerId.trim())}
              startIcon={changeOwnerMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SwapHorizIcon />}
              sx={{
                borderRadius: 2, minWidth: 150,
                background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
                "&:hover": { background: "linear-gradient(135deg, #0a3880 0%, #0d47a1 100%)" },
              }}
            >
              {changeOwnerMutation.isPending ? "Changing..." : t("serviceProviders@changeOwner")}
            </Button>
          </DialogActions>
        </Box>
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

      {/* Image Lightbox Dialog */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            bgcolor: "rgba(0,0,0,0.95)",
            boxShadow: "none",
            borderRadius: 2,
            m: 2,
            maxWidth: "90vw",
            maxHeight: "90vh",
            overflow: "hidden",
          },
        }}
      >
        <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 300, minHeight: 300 }}>
          {/* Close button */}
          <IconButton
            onClick={() => setLightboxOpen(false)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 10,
              color: "white",
              bgcolor: "rgba(255,255,255,0.12)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Counter */}
          <Chip
            label={`${lightboxIndex + 1} / ${lightboxImages.length}`}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 10,
              bgcolor: "rgba(255,255,255,0.15)",
              color: "white",
              fontWeight: 700,
              backdropFilter: "blur(8px)",
            }}
          />

          {/* Previous button */}
          {lightboxImages.length > 1 && (
            <IconButton
              onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1))}
              sx={{
                position: "absolute",
                left: 8,
                zIndex: 10,
                color: "white",
                bgcolor: "rgba(255,255,255,0.12)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
              }}
            >
              <NavigateBeforeIcon fontSize="large" />
            </IconButton>
          )}

          {/* Image */}
          <Box
            component="img"
            src={lightboxImages[lightboxIndex]}
            alt={`Image ${lightboxIndex + 1}`}
            sx={{
              maxWidth: "85vw",
              maxHeight: "80vh",
              objectFit: "contain",
              display: "block",
              borderRadius: 1,
            }}
          />

          {/* Next button */}
          {lightboxImages.length > 1 && (
            <IconButton
              onClick={() => setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0))}
              sx={{
                position: "absolute",
                right: 8,
                zIndex: 10,
                color: "white",
                bgcolor: "rgba(255,255,255,0.12)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
              }}
            >
              <NavigateNextIcon fontSize="large" />
            </IconButton>
          )}
        </Box>

        {/* Thumbnails strip */}
        {lightboxImages.length > 1 && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              px: 2,
              py: 1.5,
              justifyContent: "center",
              overflowX: "auto",
              bgcolor: "rgba(0,0,0,0.6)",
            }}
          >
            {lightboxImages.map((img, idx) => (
              <Box
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 1.5,
                  overflow: "hidden",
                  cursor: "pointer",
                  flexShrink: 0,
                  border: "2px solid",
                  borderColor: idx === lightboxIndex ? "info.main" : "transparent",
                  opacity: idx === lightboxIndex ? 1 : 0.5,
                  transition: "all 0.2s ease",
                  "&:hover": { opacity: 1, borderColor: "rgba(255,255,255,0.4)" },
                }}
              >
                <Box
                  component="img"
                  src={img}
                  alt={`Thumb ${idx + 1}`}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </Dialog>
    </AppScreenContainer>
  );
}
