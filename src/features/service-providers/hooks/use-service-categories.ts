import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
import {
  getAllServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  uploadServiceCategoryIcon,
} from "../services/service-provider-service";
import type {
  ServiceCategoryDto,
  CreateServiceCategoryRequest,
  UpdateServiceCategoryRequest,
} from "../types/api";

// Query keys
export const SERVICE_CATEGORIES_QUERY_KEY = ["service-categories"];

// ============================================
// Queries
// ============================================

export function useServiceCategories() {
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: SERVICE_CATEGORIES_QUERY_KEY,
    queryFn: ({ signal }) => getAllServiceCategories(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const filteredData = useMemo(() => {
    const raw = query.data ?? [];
    if (!search.trim()) return raw;

    const q = search.trim().toLowerCase();
    return raw.filter(
      (cat) =>
        (cat.name ?? "").toLowerCase().includes(q) ||
        (cat.nameAr ?? "").toLowerCase().includes(q)
    );
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

// ============================================
// Mutations
// ============================================

export function useCreateServiceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceCategoryRequest) => createServiceCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_QUERY_KEY });
    },
  });
}

export function useUpdateServiceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateServiceCategoryRequest }) =>
      updateServiceCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_QUERY_KEY });
    },
  });
}

export function useDeleteServiceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteServiceCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_QUERY_KEY });
    },
  });
}

export function useUploadServiceCategoryIcon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      uploadServiceCategoryIcon(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_QUERY_KEY });
    },
  });
}
