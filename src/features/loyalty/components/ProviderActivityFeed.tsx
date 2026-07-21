import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Stack, Typography, Avatar, Chip, Skeleton, Alert, Divider, Pagination } from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import HandshakeIcon from "@mui/icons-material/Handshake";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import RedeemIcon from "@mui/icons-material/Redeem";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useProviderActivity } from "../hooks/use-loyalty";
import TransactionDetailDialog from "./TransactionDetailDialog";
import type { ProviderActivityDto } from "../types/api";

interface ProviderActivityFeedProps {
  providerType: "ChargingPoint" | "ServiceProvider";
  providerId: number | null;
  enabled?: boolean;
  pageSize?: number;
}

const TYPE_FILTERS = [undefined, "Partner", "Offer", "Redemption"] as (string | undefined)[];
const TYPE_META: Record<string, { color: "success" | "error" | "secondary"; icon: React.ReactNode }> = {
  Partner: { color: "success", icon: <HandshakeIcon sx={{ fontSize: 16 }} /> },
  Offer: { color: "error", icon: <LocalOfferIcon sx={{ fontSize: 16 }} /> },
  Redemption: { color: "secondary", icon: <RedeemIcon sx={{ fontSize: 16 }} /> },
};

/** Reusable unified activity feed (filter + list + pagination + row detail). */
export default function ProviderActivityFeed({ providerType, providerId, enabled = true, pageSize = 12 }: ProviderActivityFeedProps) {
  const { t } = useTranslation();
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<{ activityType: string; id: number } | null>(null);

  const { data, isLoading, error } = useProviderActivity(
    providerType, providerId,
    { activityType: typeFilter, page, pageSize },
    enabled
  );
  const totalPages = Math.max(1, Math.ceil((data?.totalCount ?? 0) / pageSize));

  return (
    <Box>
      <Stack direction="row" spacing={0.75} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        {TYPE_FILTERS.map((tf) => (
          <Chip
            key={tf ?? "all"} size="small"
            label={tf === undefined ? t("all") : t(`loyalty@activity_${tf}`)}
            onClick={() => { setTypeFilter(tf); setPage(1); }}
            color={typeFilter === tf ? "primary" : "default"}
            variant={typeFilter === tf ? "filled" : "outlined"}
            sx={{ fontWeight: 600, cursor: "pointer" }}
          />
        ))}
      </Stack>

      {isLoading ? (
        <Stack spacing={1}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={58} />)}</Stack>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{t("loadingFailed")}</Alert>
      ) : !data || data.items.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
          <ReceiptLongIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
          <Typography variant="body2">{t("loyalty@noActivity")}</Typography>
        </Box>
      ) : (
        <>
          <Stack spacing={0.5} divider={<Divider flexItem />}>
            {data.items.map((r: ProviderActivityDto) => {
              const meta = TYPE_META[r.activityType];
              const positive = r.points >= 0;
              return (
                <Stack
                  key={`${r.activityType}-${r.transactionId}`} direction="row" spacing={1.5} alignItems="center"
                  onClick={() => setDetail({ activityType: r.activityType, id: r.transactionId })}
                  sx={{ px: 1, py: 1, borderRadius: 1.5, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                >
                  <Avatar sx={{ width: 34, height: 34, bgcolor: `${meta?.color ?? "primary"}.main` }}>{meta?.icon}</Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" fontWeight={700} noWrap>{r.userName ?? `#${r.userId}`}</Typography>
                      <Chip label={t(`loyalty@activity_${r.activityType}`)} size="small" color={meta?.color} variant="outlined" sx={{ height: 18, fontSize: 10, fontWeight: 600 }} />
                      {r.statusName && <Chip label={r.statusName} size="small" sx={{ height: 18, fontSize: 10 }} />}
                    </Stack>
                    <Typography variant="caption" color="text.disabled" noWrap>
                      {r.code ? `${r.code} · ` : ""}{new Date(r.createdAt).toLocaleDateString()}
                      {r.amount != null ? ` · ${r.amount.toFixed(3)} ${r.currencyCode ?? ""}` : ""}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={800} color={positive ? "success.main" : "error.main"} sx={{ flexShrink: 0 }}>
                    {positive ? "+" : ""}{r.points.toLocaleString()}
                  </Typography>
                  <ChevronRightIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                </Stack>
              );
            })}
          </Stack>
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" color="primary" />
            </Box>
          )}
        </>
      )}

      <TransactionDetailDialog
        open={detail != null}
        activityType={detail?.activityType ?? null}
        transactionId={detail?.id ?? null}
        onClose={() => setDetail(null)}
      />
    </Box>
  );
}
