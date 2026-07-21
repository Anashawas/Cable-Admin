import { useTranslation } from "react-i18next";
import { Box, Stack, Typography, Avatar, Rating, Divider, Skeleton, Chip } from "@mui/material";
import RateReviewIcon from "@mui/icons-material/RateReview";
import { useChargingPointReviews } from "../hooks/use-reviews";

interface StationReviewsSectionProps {
  chargingPointId: number;
  enabled?: boolean;
}

/** Read-only list of station reviews (rating + comment), newest first. */
export default function StationReviewsSection({ chargingPointId, enabled = true }: StationReviewsSectionProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useChargingPointReviews(chargingPointId, enabled);

  if (isLoading) {
    return (
      <Box>
        <Heading t={t} />
        <Stack spacing={1}>{[0, 1].map((i) => <Skeleton key={i} variant="rounded" height={56} />)}</Stack>
      </Box>
    );
  }

  if (!data || data.totalReviews === 0) return null;

  return (
    <Box>
      <Heading t={t} total={data.totalReviews} />
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="h4" fontWeight={800} lineHeight={1}>{data.averageRating.toFixed(1)}</Typography>
        <Box>
          <Rating value={data.averageRating} precision={0.1} readOnly size="small" />
          <Typography variant="caption" color="text.secondary" display="block">
            {t("chargeManagement@reviews.basedOn", { count: data.totalReviews })}
          </Typography>
        </Box>
      </Stack>
      <Stack spacing={1.25} divider={<Divider flexItem />}>
        {data.reviews.map((r) => (
          <Stack key={r.id} direction="row" spacing={1.5} alignItems="flex-start">
            <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 14, fontWeight: 700 }}>
              {(r.userName ?? "?").charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="body2" fontWeight={700}>{r.userName ?? `#${r.userId}`}</Typography>
                <Rating value={r.rating} readOnly size="small" />
                <Typography variant="caption" color="text.disabled">
                  {new Date(r.createdAt).toLocaleDateString()}
                </Typography>
              </Stack>
              {r.comment
                ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, wordBreak: "break-word" }}>{r.comment}</Typography>
                : <Typography variant="caption" color="text.disabled" fontStyle="italic">{t("chargeManagement@reviews.noComment")}</Typography>}
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function Heading({ t, total }: { t: (k: string, o?: any) => string; total?: number }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
      <RateReviewIcon sx={{ fontSize: 18, color: "primary.main" }} />
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary">{t("chargeManagement@reviews.title")}</Typography>
      {total != null && <Chip label={total} size="small" variant="outlined" sx={{ height: 18, fontSize: 11, fontWeight: 700 }} />}
    </Stack>
  );
}
