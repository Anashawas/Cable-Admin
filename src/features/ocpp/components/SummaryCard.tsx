import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Box, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { Dot } from "./ocpp-ui";

/** One small figure in a summary: muted label over a value isolated for RTL. */
export function Figure({ label, value, color, hint }: { label: string; value: ReactNode; color?: string; hint?: string }) {
  const body = (
    <Box sx={{ minWidth: 0 }} tabIndex={hint ? 0 : undefined}>
      <Typography variant="caption" color="text.secondary" display="block" noWrap>{label}</Typography>
      <Typography variant="body1" fontWeight={800} color={color} noWrap lineHeight={1.4}><bdi>{value}</bdi></Typography>
    </Box>
  );
  return hint ? <Tooltip title={hint}>{body}</Tooltip> : body;
}

export interface SummaryCounts {
  online: number;
  reconnecting: number;
  offline: number;
  freeConnectors: number;
  totalConnectors: number;
}

/**
 * Chargers online (with a slim segmented bar) and free plugs as the headline, then the
 * small figures passed as children. Shared by the fleet summary and a station's summary.
 * `c` undefined = still loading (dashes).
 */
export default function SummaryCard({ c, label, children }: { c?: SummaryCounts; label: string; children: ReactNode }) {
  const { t } = useTranslation();
  const dash = "—";
  const total = c ? c.online + c.reconnecting + c.offline : 0;
  const segments = c
    ? [
        { key: "online", n: c.online, color: "success.main" },
        { key: "reconnecting", n: c.reconnecting, color: "warning.main" },
        { key: "offline", n: c.offline, color: "error.main" },
      ]
    : [];

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, p: 2 }} component="section" aria-label={label}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
        {/* Headline: connectivity + free plugs */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1.5, sm: 3 }} sx={{ flexShrink: 0 }}>
          <Box sx={{ minWidth: 200 }}>
            <Typography variant="h6" fontWeight={800} component="p" lineHeight={1.3}>
              <bdi>{c ? t("ocpp@summary.onlineOf", { online: c.online, total }) : dash}</bdi>
            </Typography>
            <Box
              role="img"
              aria-label={c ? t("ocpp@summary.barLabel", { online: c.online, reconnecting: c.reconnecting, offline: c.offline }) : undefined}
              sx={{ display: "flex", gap: "2px", height: 6, borderRadius: 3, overflow: "hidden", bgcolor: "action.hover", mt: 1 }}
            >
              {total > 0 && segments.filter((s) => s.n > 0).map((s) => (
                <Box key={s.key} sx={{ flex: s.n, bgcolor: s.color }} />
              ))}
            </Box>
            {c && (
              <Stack direction="row" spacing={1.5} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
                {segments.map((s) => (
                  <Stack key={s.key} direction="row" spacing={0.5} alignItems="center">
                    <Dot color={s.n > 0 ? s.color : "text.disabled"} size={7} />
                    <Typography variant="caption" color="text.secondary">
                      <bdi>{s.n}</bdi> {t(`ocpp@kpi.${s.key}`)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} component="p" lineHeight={1.3}>
              {c ? (
                <bdi>
                  <Box component="span" sx={{ color: c.freeConnectors > 0 ? "success.main" : "text.primary" }}>
                    {t("ocpp@summary.freeOf", { free: c.freeConnectors, total: c.totalConnectors })}
                  </Box>
                </bdi>
              ) : dash}
            </Typography>
          </Box>
        </Stack>

        {/* Small inline figures */}
        <Box
          sx={{
            flex: 1, display: "grid", gap: 2,
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" },
            borderTop: { xs: 1, md: 0 }, borderInlineStart: { md: 1 }, borderColor: "divider",
            pt: { xs: 2, md: 0 }, paddingInlineStart: { md: "16px" },
          }}
        >
          {children}
        </Box>
      </Stack>
    </Paper>
  );
}
