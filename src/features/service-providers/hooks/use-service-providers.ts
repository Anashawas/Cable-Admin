import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
import {
  getAllServiceProviders,
  getServiceProviderById,
  createServiceProvider,
  updateServiceProvider,
  deleteServiceProvider,
  verifyServiceProvider,
  getServiceProviderRatings,
  getServiceProviderAttachments,
  uploadServiceProviderIcon,
  addServiceProviderAttachments,
  deleteServiceProviderAttachments,
  changeServiceProviderOwner,
} from "../services/service-provider-service";
import type {
  ServiceProviderDto,
  CreateServiceProviderRequest,
  UpdateServiceProviderRequest,
  ChangeOwnerRequest,
} from "../types/api";

// Query keys
export const SERVICE_PROVIDERS_QUERY_KEY = ["service-providers"];
export const SERVICE_PROVIDER_DETAIL_QUERY_KEY = (id: number) => ["service-provider", id];
export const SERVICE_PROVIDER_RATINGS_QUERY_KEY = (id: number) => ["service-provider-ratings", id];
export const SERVICE_PROVIDER_ATTACHMENTS_QUERY_KEY = (id: number) => [
  "service-provider-attachments",
  id,
];

export type ServiceProviderSortOption =
  | "NONE"
  | "NAME_A_TO_Z"
  | "VISITORS_HIGH_TO_LOW"
  | "RATING_HIGH_TO_LOW"
  | "NEWEST_FIRST";

function applyFilter(items: ServiceProviderDto[], search: string): ServiceProviderDto[] {
  if (!search.trim()) return items;
  const q = search.trim().toLowerCase();
  return items.filter(
    (sp) =>
      (sp.name ?? "").toLowerCase().includes(q) ||
      (sp.ownerName ?? "").toLowerCase().includes(q) ||
      (sp.cityName ?? "").toLowerCase().includes(q) ||
      (sp.serviceCategoryName ?? "").toLowerCase().includes(q)
  );
}

function applySort(
  items: ServiceProviderDto[],
  sort: ServiceProviderSortOption
): ServiceProviderDto[] {
  const list = [...items];
  switch (sort) {
    case "NAME_A_TO_Z":
      return list.sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" })
      );
    case "VISITORS_HIGH_TO_LOW":
      return list.sort((a, b) => (b.visitorsCount ?? 0) - (a.visitorsCount ?? 0));
    case "RATING_HIGH_TO_LOW":
      return list.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
    case "NEWEST_FIRST":
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    default:
      return list;
  }
}

// ============================================
// Queries
// ============================================

export function useServiceProviders(categoryId?: number) {
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<ServiceProviderSortOption>("NONE");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");

  const query = useQuery({
    queryKey: [...SERVICE_PROVIDERS_QUERY_KEY, categoryId],
    queryFn: ({ signal }) => getAllServiceProviders(categoryId),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const filteredAndSortedData = useMemo(() => {
    let raw = query.data ?? [];

    // Apply verified filter
    if (verifiedFilter === "verified") {
      raw = raw.filter((sp) => sp.isVerified);
    } else if (verifiedFilter === "unverified") {
      raw = raw.filter((sp) => !sp.isVerified);
    }

    const filtered = applyFilter(raw, search);
    return applySort(filtered, sortOption);
  }, [query.data, search, sortOption, verifiedFilter]);

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const handleSortChange = useCallback(
    (value: ServiceProviderSortOption) => setSortOption(value),
    []
  );
  const handleVerifiedFilterChange = useCallback(
    (value: "all" | "verified" | "unverified") => setVerifiedFilter(value),
    []
  );
  const handleRefresh = useCallback(() => query.refetch(), [query]);

  return {
    data: filteredAndSortedData,
    isLoading: query.isLoading,
    error: query.error,
    search,
    sortOption,
    verifiedFilter,
    handleSearchChange,
    handleSortChange,
    handleVerifiedFilterChange,
    handleRefresh,
  };
}

export function useServiceProvider(id: number) {
  return useQuery({
    queryKey: SERVICE_PROVIDER_DETAIL_QUERY_KEY(id),
    queryFn: ({ signal }) => getServiceProviderById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

export function useServiceProviderRatings(serviceProviderId: number) {
  return useQuery({
    queryKey: SERVICE_PROVIDER_RATINGS_QUERY_KEY(serviceProviderId),
    queryFn: ({ signal }) => getServiceProviderRatings(serviceProviderId),
    staleTime: 2 * 60 * 1000,
    enabled: !!serviceProviderId,
  });
}

export function useServiceProviderAttachments(serviceProviderId: number) {
  return useQuery({
    queryKey: SERVICE_PROVIDER_ATTACHMENTS_QUERY_KEY(serviceProviderId),
    queryFn: ({ signal }) => getServiceProviderAttachments(serviceProviderId),
    staleTime: 5 * 60 * 1000,
    enabled: !!serviceProviderId,
  });
}

// ============================================
// Mutations
// ============================================

export function useCreateServiceProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceProviderRequest) => createServiceProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_PROVIDERS_QUERY_KEY });
    },
  });
}

export function useUpdateServiceProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateServiceProviderRequest }) =>
      updateServiceProvider(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SERVICE_PROVIDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SERVICE_PROVIDER_DETAIL_QUERY_KEY(variables.id) });
    },
  });
}

export function useDeleteServiceProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteServiceProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_PROVIDERS_QUERY_KEY });
    },
  });
}

export function useVerifyServiceProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => verifyServiceProvider(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: SERVICE_PROVIDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SERVICE_PROVIDER_DETAIL_QUERY_KEY(id) });
    },
  });
}

export function useUploadServiceProviderIcon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      uploadServiceProviderIcon(id, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SERVICE_PROVIDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SERVICE_PROVIDER_DETAIL_QUERY_KEY(variables.id) });
    },
  });
}

export function useAddServiceProviderAttachments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, files }: { id: number; files: File[] }) =>
      addServiceProviderAttachments(id, files),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: SERVICE_PROVIDER_ATTACHMENTS_QUERY_KEY(variables.id),
      });
    },
  });
}

export function useDeleteServiceProviderAttachments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteServiceProviderAttachments(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: SERVICE_PROVIDER_ATTACHMENTS_QUERY_KEY(id) });
    },
  });
}

export function useChangeServiceProviderOwner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceProviderId, data }: { serviceProviderId: number; data: ChangeOwnerRequest }) =>
      changeServiceProviderOwner(serviceProviderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SERVICE_PROVIDERS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: SERVICE_PROVIDER_DETAIL_QUERY_KEY(variables.serviceProviderId),
      });
    },
  });
}
