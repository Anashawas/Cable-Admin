import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
import {
  getPendingOffers,
  getActiveOffers,
  getOffersForProvider,
  getOfferById,
  approveOffer,
  rejectOffer,
  updateOffer,
  deactivateOffer,
  createOffer,
  uploadOfferImage,
  getOfferAttachments,
  deleteOfferAttachments,
  type OfferAttachmentDto,
} from "../services/offers-service";
import type {
  OfferDto,
  ProposeOfferRequest,
  UpdateOfferRequest,
  RejectOfferRequest,
  ProviderType,
  ApprovalStatus,
} from "../types/api";

// Query keys
export const OFFERS_QUERY_KEY = ["offers"];
export const PENDING_OFFERS_QUERY_KEY = ["offers", "pending"];
export const PROVIDER_OFFERS_QUERY_KEY = ["offers", "provider"];
export const OFFER_DETAIL_QUERY_KEY = (id: number) => ["offer", id];

export type OfferSortOption = "NONE" | "NEWEST_FIRST" | "EXPIRING_SOON" | "MOST_USED";

function applyFilter(items: OfferDto[], search: string): OfferDto[] {
  if (!search.trim()) return items;
  const q = search.trim().toLowerCase();
  return items.filter(
    (offer) =>
      (offer.title ?? "").toLowerCase().includes(q) ||
      (offer.providerName ?? "").toLowerCase().includes(q)
  );
}

function applySort(items: OfferDto[], sort: OfferSortOption): OfferDto[] {
  const list = [...items];
  switch (sort) {
    case "NEWEST_FIRST":
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "EXPIRING_SOON":
      return list.sort((a, b) => new Date(a.validTo).getTime() - new Date(b.validTo).getTime());
    case "MOST_USED":
      return list.sort((a, b) => b.currentTotalUses - a.currentTotalUses);
    default:
      return list;
  }
}

// ============================================
// Queries
// ============================================

export function usePendingOffers() {
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<OfferSortOption>("NEWEST_FIRST");

  const query = useQuery({
    queryKey: PENDING_OFFERS_QUERY_KEY,
    queryFn: () => getPendingOffers(),
    staleTime: 1 * 60 * 1000, // 1 minute (critical data)
    retry: 2,
  });

  const filteredAndSortedData = useMemo(() => {
    const raw = query.data ?? [];
    const filtered = applyFilter(raw, search);
    return applySort(filtered, sortOption);
  }, [query.data, search, sortOption]);

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const handleSortChange = useCallback((value: OfferSortOption) => setSortOption(value), []);
  const handleRefresh = useCallback(() => query.refetch(), [query]);

  return {
    data: filteredAndSortedData,
    isLoading: query.isLoading,
    error: query.error,
    search,
    sortOption,
    handleSearchChange,
    handleSortChange,
    handleRefresh,
  };
}

export function useAllOffers(filters?: {
  providerType?: ProviderType;
  providerId?: number;
  categoryId?: number;
}) {
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<OfferSortOption>("NONE");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const query = useQuery({
    queryKey: [...OFFERS_QUERY_KEY, filters],
    queryFn: () => getActiveOffers(filters),
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });

  const filteredAndSortedData = useMemo(() => {
    let raw = query.data ?? [];

    // Apply active filter
    if (statusFilter === "active") {
      raw = raw.filter((offer) => offer.isActive);
    } else if (statusFilter === "inactive") {
      raw = raw.filter((offer) => !offer.isActive);
    }

    const filtered = applyFilter(raw, search);
    return applySort(filtered, sortOption);
  }, [query.data, search, sortOption, statusFilter]);

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const handleSortChange = useCallback((value: OfferSortOption) => setSortOption(value), []);
  const handleStatusFilterChange = useCallback(
    (value: "all" | "active" | "inactive") => setStatusFilter(value),
    []
  );
  const handleRefresh = useCallback(() => query.refetch(), [query]);

  return {
    data: filteredAndSortedData,
    isLoading: query.isLoading,
    error: query.error,
    search,
    sortOption,
    statusFilter,
    handleSearchChange,
    handleSortChange,
    handleStatusFilterChange,
    handleRefresh,
  };
}

export function useOffersForProvider(providerId?: number, providerType: ProviderType = "ServiceProvider") {
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: [...PROVIDER_OFFERS_QUERY_KEY, providerType, providerId],
    queryFn: () => getOffersForProvider({ providerType, providerId }),
    staleTime: 2 * 60 * 1000,
    retry: 2,
    enabled: providerId != null && providerId > 0,
  });

  const filteredData = useMemo(() => {
    return applyFilter(query.data ?? [], search);
  }, [query.data, search]);

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const handleRefresh = useCallback(() => query.refetch(), [query]);

  return {
    data: filteredData,
    allData: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    search,
    handleSearchChange,
    handleRefresh,
  };
}

export function useOffer(id: number) {
  return useQuery({
    queryKey: OFFER_DETAIL_QUERY_KEY(id),
    queryFn: () => getOfferById(id),
    staleTime: 2 * 60 * 1000,
    enabled: !!id,
  });
}

// ============================================
// Mutations
// ============================================

export function useApproveOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => approveOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_OFFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEY });
    },
  });
}

export function useRejectOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RejectOfferRequest }) => rejectOffer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_OFFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEY });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOfferRequest }) => updateOffer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: OFFER_DETAIL_QUERY_KEY(variables.id) });
    },
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProposeOfferRequest) => createOffer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_OFFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEY });
    },
  });
}

export function useUploadOfferImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      uploadOfferImage(id, file),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PENDING_OFFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["offer-attachments", variables.id] });
    },
  });
}

export const OFFER_ATTACHMENTS_KEY = (offerId: number) => ["offer-attachments", offerId];

export function useOfferAttachments(offerId?: number | null) {
  return useQuery({
    queryKey: OFFER_ATTACHMENTS_KEY(offerId!),
    queryFn: () => getOfferAttachments(offerId!),
    enabled: !!offerId,
    staleTime: 60 * 1000,
  });
}

export function useDeleteOfferAttachments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: number) => deleteOfferAttachments(offerId),
    onSuccess: (_result, offerId) => {
      queryClient.invalidateQueries({ queryKey: OFFER_ATTACHMENTS_KEY(offerId) });
      queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEY });
    },
  });
}

export function useDeactivateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deactivateOffer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: OFFER_DETAIL_QUERY_KEY(id) });
    },
  });
}
