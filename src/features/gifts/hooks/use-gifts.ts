import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelGiftOrder,
  createGift,
  fulfillGiftOrder,
  getAdminGifts,
  getGiftOrders,
  getPendingGiftOrdersCount,
  setGiftActive,
  updateGift,
  uploadGiftImage,
} from "../services/gifts-service";
import type { CableGiftInput, GiftOrderFilters } from "../types/api";

export const GIFTS_QUERY_KEY = ["cable-gifts"];
export const GIFT_ORDERS_QUERY_KEY = ["cable-gifts", "orders"];
export const GIFT_PENDING_COUNT_QUERY_KEY = ["cable-gifts", "pending-count"];

export function useAdminGifts(isActive: boolean | null, search: string) {
  return useQuery({
    queryKey: [...GIFTS_QUERY_KEY, "list", isActive, search],
    queryFn: ({ signal }) => getAdminGifts({ isActive, search }, signal),
    placeholderData: (prev) => prev,
    staleTime: 60 * 1000,
  });
}

export function useGiftOrders(filters: GiftOrderFilters, page: number, pageSize: number) {
  return useQuery({
    queryKey: [...GIFT_ORDERS_QUERY_KEY, filters, page, pageSize],
    queryFn: ({ signal }) => getGiftOrders(filters, page, pageSize, signal),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}

/** Pending orders waiting for the Cable team (dashboard + sidebar badge). */
export function usePendingGiftOrdersCount() {
  return useQuery({
    queryKey: GIFT_PENDING_COUNT_QUERY_KEY,
    queryFn: ({ signal }) => getPendingGiftOrdersCount(signal),
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useSaveGift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body, image }: { id: number | null; body: CableGiftInput; image?: File | null }) => {
      const giftId = id ?? (await createGift(body));
      if (id != null) await updateGift(id, body);
      // The image goes up after the gift exists (create returns the id first).
      if (image) await uploadGiftImage(giftId, image);
      return giftId;
    },
    // Settled, not success: a failed image upload still leaves a saved gift to show.
    onSettled: () => queryClient.invalidateQueries({ queryKey: GIFTS_QUERY_KEY }),
  });
}

export function useSetGiftActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setGiftActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GIFTS_QUERY_KEY }),
  });
}

/** Fulfil / cancel change the order, the gift counters (stock) and the pending badge. */
function invalidateOrders(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: GIFTS_QUERY_KEY });
}

export function useFulfillGiftOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note: string | null }) => fulfillGiftOrder(id, note),
    onSuccess: () => invalidateOrders(queryClient),
  });
}

export function useCancelGiftOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string | null }) => cancelGiftOrder(id, reason),
    onSuccess: () => invalidateOrders(queryClient),
  });
}
