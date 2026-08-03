import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recordPremiumPayment, getPremiumHistory } from "../services/premium-service";
import type { RecordPremiumPaymentRequest } from "../types/api";

export const PREMIUM_HISTORY_QUERY_KEY = ["charge-management", "premium-history"];

/** Premium payment history + current status for a station. */
export function usePremiumHistory(id: number | null | undefined, enabled = true) {
  return useQuery({
    queryKey: [...PREMIUM_HISTORY_QUERY_KEY, id],
    queryFn: ({ signal }) => getPremiumHistory(id!, signal),
    enabled: enabled && id != null && id > 0,
  });
}

/** Record / renew a premium payment for a station. */
export function useRecordPremiumPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: RecordPremiumPaymentRequest }) =>
      recordPremiumPayment(id, body),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: [...PREMIUM_HISTORY_QUERY_KEY, vars.id] });
      queryClient.invalidateQueries({ queryKey: ["charge-management"] });
    },
  });
}
