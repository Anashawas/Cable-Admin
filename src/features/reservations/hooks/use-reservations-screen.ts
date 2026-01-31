import { useMemo, useState, useCallback } from "react";
import { GridPaginationModel } from "@mui/x-data-grid";
import { useDebounce } from "use-debounce";
import { useReservations } from "./use-reservations";
import { useUsers, useCampingSeasons, useReservationStatuses } from "./use-filter-options";
import { ReservationFilters, ReservationResponse } from "../types/api";
import { FilterField } from "../../../components";

export interface UseReservationsScreenReturn {
  data: any;
  isLoading: boolean;
  error: any;

  filters: ReservationFilters;
  showFilters: boolean;
  filterFields: FilterField[];

  paginationModel: GridPaginationModel;

  selectedReservation: ReservationResponse | null;
  dialogOpen: boolean;

  handleFiltersChange: (newFilters: ReservationFilters) => void;
  handleToggleFilters: () => void;
  handleRefresh: () => void;
  handlePaginationModelChange: (model: GridPaginationModel) => void;
  handleShowReservationDetails: (reservation: ReservationResponse) => void;
  handleCloseDialog: () => void;
  handleShowLicense: (reservation: ReservationResponse) => void;
  handleShowPaymentInvoice: (reservation: ReservationResponse) => void;
  handleShowOnMap: (reservation: ReservationResponse) => void;
}

export const useReservationsScreen = (): UseReservationsScreenReturn => {
  const { data: users } = useUsers();
  const { data: campingSeasons } = useCampingSeasons();
  const { data: reservationStatuses } = useReservationStatuses();
  const [filters, setFilters] = useState<ReservationFilters>({
    reservationNumber: null,
    campingSeasonId: null,
    userId: null,
    reservationStatusIds: null,
    fromReservationDate: null,
    toReservationDate: null,
    includeDeleted: false,
  });

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [debouncedFilters] = useDebounce(filters, 500);

  // Create stable query filters that won't cause cancellation on pagination
  const queryFilters = useMemo(() => {
    return {
      pagination: {
        pageNumber: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      },
      ...debouncedFilters,
    };
  }, [debouncedFilters, paginationModel]);

  const { data, isFetching, error, refetch } = useReservations(queryFilters);

  const filterFields: FilterField[] = useMemo(() => [
    {
      key: "reservationNumber",
      type: "text",
      labelKey: "reservations@filters.reservationNumber",
      gridSize: { xs: 12, sm: 6, md: 2 }
    },
    {
      key: "campingSeasonId",
      type: "select",
      labelKey: "reservations@filters.campingSeason",
      options: campingSeasons
        ?.filter(season => !season.isDeleted)
        .map(season => ({
          value: season.id,
          label: season.name
        })) || [],
      gridSize: { xs: 12, sm: 6, md: 2 }
    },
    {
      key: "userId",
      type: "select",
      labelKey: "reservations@filters.user",
      searchable: true, // Make it searchable
      options: users
        ?.filter(user => user.isActive && user.civilId) // Only show users with Civil IDs
        .map(user => ({
          value: user.id,
          label: `${user.name} (${user.civilId})`
        })) || [],
      gridSize: { xs: 12, sm: 6, md: 2 }
    },
    {
      key: "reservationStatusIds",
      type: "select",
      labelKey: "reservations@filters.status",
      options: reservationStatuses
        ?.filter(status => status.id !== 6 && status.id !== 12)
        .map(status => ({
          value: status.id,
          label: status.name
        })) || [],
      gridSize: { xs: 12, sm: 6, md: 2 },
      valueAsArray: true
    },
    {
      key: "fromReservationDate",
      type: "date",
      labelKey: "reservations@filters.fromDate",
      gridSize: { xs: 12, sm: 6, md: 2 }
    },
    {
      key: "toReservationDate",
      type: "date",
      labelKey: "reservations@filters.toDate",
      gridSize: { xs: 12, sm: 6, md: 2 }
    }
  ], [users, campingSeasons, reservationStatuses]);

  const handleFiltersChange = useCallback((newFilters: ReservationFilters) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    setPaginationModel(model);
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleShowReservationDetails = useCallback((reservation: ReservationResponse) => {
    setSelectedReservation(reservation);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedReservation(null);
  }, []);

  const handleShowLicense = useCallback((reservation: ReservationResponse) => {
    const licensePath = window.env?.host?.licensePath || "https://dev.openware.com.kw/km/camping-v2/client/print/reservation/";
    const url = `${licensePath}${reservation.reservationNumber}`;
    window.open(url, "_blank");
  }, []);

  const handleShowPaymentInvoice = useCallback((reservation: ReservationResponse) => {
    const invoicePath = window.env?.host?.invoicePath || "https://dev.openware.com.kw/km/camping-v2/client/print/invoice/";
    const url = `${invoicePath}${reservation.reservationNumber}`;
    window.open(url, "_blank");
  }, []);

  const handleShowOnMap = useCallback((_reservation: ReservationResponse) => {
    // TODO: Implement show on map functionality
  }, []);

  return {
    data,
    isLoading: isFetching, // Use isFetching to show loading during pagination
    error,

    filters,
    showFilters,
    filterFields,

    paginationModel,

    selectedReservation,
    dialogOpen,

    handleFiltersChange,
    handleToggleFilters,
    handleRefresh,
    handlePaginationModelChange,
    handleShowReservationDetails,
    handleCloseDialog,
    handleShowLicense,
    handleShowPaymentInvoice,
    handleShowOnMap,
  };
};