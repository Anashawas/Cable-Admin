import { useMemo, useState, useCallback } from "react";
import { GridPaginationModel } from "@mui/x-data-grid";
import { FilterField } from "../../../components";
import { useQuery } from "@tanstack/react-query";
import { getAllReservations } from "../../reservations/services/reservations-service";
import {
  useUsers,
  useCampingSeasons,
  useReservationStatuses,
} from "../../reservations/hooks/use-filter-options";
import { useDebounce } from "use-debounce";
import { RESERVATION_STATUS } from "@/constants/reservation-status-constants";

export interface RefundFilters {
  reservationNumber?: string | null;
  campingSeasonId?: number | null;
  userId?: number | null;
  reservationStatusIds?: number[] | null;
  fromReservationDate?: string | null;
  toReservationDate?: string | null;
}

export interface UseRefundsScreenReturn {
  data: any;
  isLoading: boolean;
  error: any;

  filters: RefundFilters;
  showFilters: boolean;
  showCompleted: boolean;
  filterFields: FilterField[];

  paginationModel: GridPaginationModel;

  selectedRefund: any | null;
  dialogOpen: boolean;

  handleFiltersChange: (newFilters: RefundFilters) => void;
  handleToggleFilters: () => void;
  handleToggleCompleted: () => void;
  handleRefresh: () => void;
  handlePaginationModelChange: (model: GridPaginationModel) => void;
  handleShowRefundDetails: (refund: any) => void;
  handleCloseDialog: () => void;
}

export const useRefundsScreen = (): UseRefundsScreenReturn => {
  const { data: users } = useUsers();
  const { data: campingSeasons } = useCampingSeasons();
  const { data: reservationStatuses } = useReservationStatuses();

  const [filters, setFilters] = useState<RefundFilters>({
    reservationNumber: null,
    campingSeasonId: null,
    userId: null,
    reservationStatusIds: [
      RESERVATION_STATUS.REFUND_REQUEST_PENDING_FINANCE,
      RESERVATION_STATUS.REFUND_REQUEST_IN_PROCESS,
    ],
    fromReservationDate: null,
    toReservationDate: null,
  });

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [debouncedFilters] = useDebounce(filters, 500);

  const queryFilters = useMemo(
    () => ({
      pagination: {
        pageNumber: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      },
      ...debouncedFilters,
      // Determine status filter based on showCompleted and user selection
      reservationStatusIds: showCompleted
        ? [RESERVATION_STATUS.FEES_REFUNDED]
        : debouncedFilters.reservationStatusIds && debouncedFilters.reservationStatusIds.length > 0
        ? debouncedFilters.reservationStatusIds
        : [
            RESERVATION_STATUS.REFUND_REQUEST_PENDING_FINANCE,
            RESERVATION_STATUS.REFUND_REQUEST_IN_PROCESS,
          ],
      includeDeleted: false,
    }),
    [debouncedFilters, paginationModel, showCompleted]
  );

  // Fetch reservations with server-side filtering
  const {
    data: reservationsData,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["refunds", queryFilters],
    queryFn: ({ signal }) => getAllReservations(queryFilters, signal),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    // Keep previous data during transitions to avoid flickering
    placeholderData: (previousData) => previousData,
    // Prevent query cancellation on rapid successive calls
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const data = useMemo(
    () => ({
      data: reservationsData?.items || [],
      total: reservationsData?.totalCount || 0,
    }),
    [reservationsData]
  );

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: "reservationNumber",
        type: "text",
        labelKey: "refunds@filters.reservationNumber",
        gridSize: { xs: 12, sm: 6, md: 2 },
      },
      {
        key: "campingSeasonId",
        type: "select",
        labelKey: "refunds@filters.campingSeason",
        options:
          campingSeasons
            ?.filter((season) => !season.isDeleted)
            .map((season) => ({
              value: season.id,
              label: season.name,
            })) || [],
        gridSize: { xs: 12, sm: 6, md: 2 },
      },
      {
        key: "userId",
        type: "select",
        labelKey: "refunds@filters.user",
        searchable: true, // Make it searchable
        options:
          users
            ?.filter((user) => user.isActive && user.civilId) // Only show users with Civil IDs
            .map((user) => ({
              value: user.id,
              label: `${user.name} (${user.civilId})`,
            })) || [],
        gridSize: { xs: 12, sm: 6, md: 2 },
      },
      {
        key: "reservationStatusIds",
        type: "select",
        labelKey: "refunds@filters.status",
        options:
          reservationStatuses
            ?.filter((status) => status.id === 6 || status.id === 12)
            .map((status) => ({
              value: status.id,
              label: status.name,
            })) || [],
        gridSize: { xs: 12, sm: 6, md: 2 },
        valueAsArray: true,
      },
      {
        key: "fromReservationDate",
        type: "date",
        labelKey: "refunds@filters.fromDate",
        gridSize: { xs: 12, sm: 6, md: 2 },
      },
      {
        key: "toReservationDate",
        type: "date",
        labelKey: "refunds@filters.toDate",
        gridSize: { xs: 12, sm: 6, md: 2 },
      },
    ],
    [users, campingSeasons, reservationStatuses]
  );

  const handleFiltersChange = useCallback((newFilters: RefundFilters) => {
    setFilters(newFilters);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      setPaginationModel(model);
    },
    []
  );

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleToggleCompleted = useCallback(() => {
    setShowCompleted((prev) => !prev);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleShowRefundDetails = useCallback((refund: any) => {
    setSelectedRefund(refund);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedRefund(null);
  }, []);

  return {
    data,
    isLoading: isFetching, // Use isFetching to show loading during pagination
    error,

    filters,
    showFilters,
    showCompleted,
    filterFields,

    paginationModel,

    selectedRefund,
    dialogOpen,

    handleFiltersChange,
    handleToggleFilters,
    handleToggleCompleted,
    handleRefresh,
    handlePaginationModelChange,
    handleShowRefundDetails,
    handleCloseDialog,
  };
};
