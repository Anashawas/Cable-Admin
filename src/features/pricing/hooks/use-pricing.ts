import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPriceAlertOverview, previewPriceAlerts, setQuietHours, updateTouTariff, type TouWindowDto } from "../services/pricing-service";

export const PRICING_QUERY_KEY = ["pricing"];

export function usePriceAlertOverview() {
  return useQuery({ queryKey: [...PRICING_QUERY_KEY, "overview"], queryFn: ({ signal }) => getPriceAlertOverview(signal) });
}

export function usePriceAlertPreview(at: string | null, lookBackMinutes: number, enabled: boolean) {
  return useQuery({
    queryKey: [...PRICING_QUERY_KEY, "preview", at, lookBackMinutes],
    queryFn: ({ signal }) => previewPriceAlerts(at, lookBackMinutes, signal),
    enabled,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: PRICING_QUERY_KEY });
}

export function useUpdateTouTariff() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ windows, effectiveFrom, note }: { windows: TouWindowDto[]; effectiveFrom: string | null; note: string | null }) =>
      updateTouTariff(windows, effectiveFrom, note),
    onSuccess: invalidate,
  });
}

export function useSetQuietHours() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: ({ quietFrom, quietTo }: { quietFrom: string; quietTo: string }) => setQuietHours(quietFrom, quietTo), onSuccess: invalidate });
}
