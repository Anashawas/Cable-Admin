import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllChargerBrands,
  addChargerBrand,
  updateChargerBrand,
  deleteChargerBrand,
} from "../services/charger-brand-service";

export const CHARGER_BRANDS_QUERY_KEY = ["charge-management", "charger-brands"];

export function useChargerBrands(enabled = true) {
  return useQuery({
    queryKey: CHARGER_BRANDS_QUERY_KEY,
    queryFn: ({ signal }) => getAllChargerBrands(signal),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useAddChargerBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => addChargerBrand(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHARGER_BRANDS_QUERY_KEY }),
  });
}

export function useUpdateChargerBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateChargerBrand(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHARGER_BRANDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["charge-management"] });
    },
  });
}

export function useDeleteChargerBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteChargerBrand(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHARGER_BRANDS_QUERY_KEY }),
  });
}
