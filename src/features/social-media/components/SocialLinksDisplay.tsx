import { useTranslation } from "react-i18next";
import { Box, Stack, Typography, Chip, Avatar, Skeleton, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ShareIcon from "@mui/icons-material/Share";
import LinkIcon from "@mui/icons-material/Link";
import { useSocialLinks } from "../hooks/use-social-media";
import type { SocialProviderType } from "../types/api";

interface SocialLinksDisplayProps {
  providerType: SocialProviderType;
  providerId: number | null | undefined;
  /** When true, render a small section heading above the chips. */
  showHeading?: boolean;
  enabled?: boolean;
}

/** Brand accent colors keyed by lowercased platform name (best-effort). */
const BRAND_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  tiktok: "#010101",
  x: "#010101",
  twitter: "#1DA1F2",
  youtube: "#FF0000",
  whatsapp: "#25D366",
  telegram: "#229ED9",
  snapchat: "#F7B500",
  linkedin: "#0A66C2",
};

function brandColor(name: string): string {
  return BRAND_COLORS[name?.trim().toLowerCase()] ?? "#6a1b9a";
}

/** Open a link in a new tab, guarding the scheme. */
function openUrl(rawUrl: string) {
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Read-only display of a provider's social links — mirrors the mobile
 * SocialLinksRow. Brand-tinted chips, each showing the platform icon (falls
 * back to a generic link icon until an icon is uploaded) and opening the url
 * on click. Renders nothing when there are no links.
 */
export default function SocialLinksDisplay({
  providerType,
  providerId,
  showHeading = true,
  enabled = true,
}: SocialLinksDisplayProps) {
  const { t } = useTranslation();
  const { data: links, isLoading } = useSocialLinks(providerType, providerId, enabled);

  if (isLoading) {
    return (
      <Box>
        {showHeading && <Heading t={t} />}
        <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
          {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" width={110} height={38} sx={{ borderRadius: 5 }} />)}
        </Stack>
      </Box>
    );
  }

  if (!links || links.length === 0) return null;

  return (
    <Box>
      {showHeading && <Heading t={t} count={links.length} />}
      <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
        {links.map((link) => {
          const color = brandColor(link.socialMediaPlatformName);
          return (
            <Tooltip key={link.id} title={link.url} arrow>
              <Chip
                avatar={
                  <Avatar
                    src={link.socialMediaPlatformIconUrl ?? undefined}
                    sx={{ bgcolor: alpha(color, 0.18), color, width: 26, height: 26 }}
                  >
                    {!link.socialMediaPlatformIconUrl && <LinkIcon sx={{ fontSize: 15 }} />}
                  </Avatar>
                }
                label={link.socialMediaPlatformName}
                onClick={() => openUrl(link.url)}
                sx={{
                  height: 38,
                  px: 0.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  color,
                  bgcolor: alpha(color, 0.08),
                  border: "1px solid",
                  borderColor: alpha(color, 0.35),
                  "& .MuiChip-label": { px: 1.25 },
                  "&:hover": { bgcolor: alpha(color, 0.16), borderColor: color },
                }}
              />
            </Tooltip>
          );
        })}
      </Stack>
    </Box>
  );
}

function Heading({ t, count }: { t: (k: string) => string; count?: number }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
      <ShareIcon sx={{ fontSize: 18, color: "text.secondary" }} />
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
        {t("socialMedia@linksTitle")}
      </Typography>
      {count != null && (
        <Chip label={count} size="small" variant="outlined" sx={{ height: 18, fontSize: 11, fontWeight: 700 }} />
      )}
    </Stack>
  );
}
