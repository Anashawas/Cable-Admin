import { Box, LinearProgress, Skeleton, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

/**
 * Lightweight fallback for the content area while a screen's code loads:
 * a thin progress bar plus a skeleton of a typical screen. The sidebar and
 * header stay mounted around it.
 */
export default function ContentFallback() {
  const { t } = useTranslation();
  return (
    <Box role="status" aria-live="polite" aria-label={t("common@loading")} sx={{ position: "relative", height: "100%", minHeight: 240 }}>
      <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: 1 }} />
      <Stack spacing={2.5} sx={{ pt: 3, maxWidth: 1200, mx: "auto" }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton variant="rounded" width={48} height={48} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="38%" sx={{ fontSize: "1.6rem" }} />
            <Skeleton variant="text" width="22%" />
          </Box>
        </Stack>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" } }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={92} />
          ))}
        </Box>
        <Stack spacing={1}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={44} sx={{ opacity: 1 - i * 0.15 }} />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
