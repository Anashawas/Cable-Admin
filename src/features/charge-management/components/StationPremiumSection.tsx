import { useTranslation } from "react-i18next";
import { Box, Stack, Typography, Chip, Skeleton } from "@mui/material";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { usePremiumHistory } from "../hooks/use-premium";

interface StationPremiumSectionProps {
  chargingPointId: number;
  enabled?: boolean;
}

function fmtDate(v?: string | null): string {
  return v ? new Date(v).toLocaleDateString() : "—";
}

/** Read-only premium status block for the station detail dialog. */
export default function StationPremiumSection({ chargingPointId, enabled = true }: StationPremiumSectionProps) {
  const { t } = useTranslation();
  const { data, isLoading } = usePremiumHistory(chargingPointId, enabled);

  if (!enabled) return null;
  if (isLoading) return <Skeleton variant="rounded" height={56} />;
  // Nothing meaningful to show if there has never been a premium payment.
  if (!data || (!data.isPremiumActive && !data.currentExpiresAt && data.history.length === 0)) return null;

  return (
    <Box>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
        <WorkspacePremiumIcon sx={{ fontSize: 18, color: "warning.main" }} />
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">{t("chargeManagement@premium.title")}</Typography>
      </Stack>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip
          icon={<WorkspacePremiumIcon sx={{ fontSize: "16px !important" }} />}
          label={data.isPremiumActive ? t("chargeManagement@premium.active") : t("chargeManagement@premium.expired")}
          color={data.isPremiumActive ? "success" : "error"}
          variant={data.isPremiumActive ? "filled" : "outlined"}
          sx={{ fontWeight: 700 }}
        />
        {data.currentPaymentDate && (
          <Typography variant="body2" color="text.secondary">
            {t("chargeManagement@premium.paidOn")}: <b>{fmtDate(data.currentPaymentDate)}</b>
          </Typography>
        )}
        {data.currentExpiresAt && (
          <Typography variant="body2" color="text.secondary">
            {t("chargeManagement@premium.expiresOn")}: <b>{fmtDate(data.currentExpiresAt)}</b>
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
