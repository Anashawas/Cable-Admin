import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Skeleton,
  Divider,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useLeaderboard } from "../hooks/use-loyalty";
import type { LeaderboardEntryDto } from "../types/api";

const TOP_OPTIONS = [10, 25, 50, 100];

/** Medal colors for the top 3. */
const MEDAL = ["#FFD700", "#C0C0C0", "#CD7F32"];

function displayName(e: LeaderboardEntryDto, anon: string) {
  return e.userName?.trim() || `${anon} #${e.userId}`;
}

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const [top, setTop] = useState(25);
  const { data = [], isLoading, refetch } = useLeaderboard(top);

  const podium = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2.5}>

          {/* ── Header ── */}
          <Box
            sx={{
              background: "linear-gradient(135deg, #4a148c 0%, #6a1b9a 55%, #8e24aa 100%)",
              borderRadius: 3, p: { xs: 2.5, md: 3.5 }, color: "white",
              position: "relative", overflow: "hidden",
            }}
          >
            <Box sx={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)" }} />
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ width: 60, height: 60, borderRadius: 3, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <EmojiEventsIcon sx={{ fontSize: 34 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={800}>{t("loyalty@leaderboard")}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.3 }}>{t("loyalty@leaderboardSubtitle")}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title={t("refresh")}>
                  <IconButton onClick={() => refetch()} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {/* Top-N selector */}
            <Stack direction="row" spacing={1} sx={{ mt: 2.5 }} flexWrap="wrap" useFlexGap>
              <Typography variant="body2" sx={{ opacity: 0.85, alignSelf: "center", mr: 0.5 }}>{t("loyalty@showTop")}:</Typography>
              {TOP_OPTIONS.map((n) => (
                <Chip
                  key={n} label={n} onClick={() => setTop(n)}
                  sx={{
                    fontWeight: 700, cursor: "pointer", color: "#fff",
                    bgcolor: top === n ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)",
                    border: "1px solid", borderColor: top === n ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                  }}
                />
              ))}
            </Stack>
          </Box>

          {isLoading ? (
            <Stack spacing={1.5}>
              <Skeleton variant="rounded" height={140} />
              {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={60} />)}
            </Stack>
          ) : data.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, borderRadius: 3, border: "2px dashed", borderColor: "divider", textAlign: "center" }}>
              <EmojiEventsIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }} />
              <Typography variant="h6" color="text.secondary" fontWeight={600}>{t("loyalty@noLeaderboard")}</Typography>
              <Typography variant="body2" color="text.disabled">{t("loyalty@noLeaderboardHint")}</Typography>
            </Paper>
          ) : (
            <>
              {/* ── Podium (top 3) ── */}
              {podium.length > 0 && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="stretch">
                  {podium.map((e, i) => (
                    <Paper
                      key={e.userId}
                      elevation={2}
                      sx={{
                        flex: 1, borderRadius: 3, p: 2.5, textAlign: "center",
                        borderTop: `4px solid ${MEDAL[i]}`,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                        order: { xs: i, sm: i === 0 ? 1 : i === 1 ? 0 : 2 },
                        transform: { sm: i === 0 ? "scale(1.05)" : "none" },
                      }}
                    >
                      <Box sx={{ position: "relative" }}>
                        <Avatar sx={{ width: 64, height: 64, bgcolor: MEDAL[i], color: "#5d4037", fontWeight: 800, fontSize: 24 }}>
                          {displayName(e, t("loyalty@anonymousUser")).charAt(0).toUpperCase()}
                        </Avatar>
                        <Chip label={`#${e.rank}`} size="small" sx={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", bgcolor: MEDAL[i], color: "#5d4037", fontWeight: 800, height: 20 }} />
                      </Box>
                      <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: "100%", mt: 0.75 }}>
                        {displayName(e, t("loyalty@anonymousUser"))}
                      </Typography>
                      {e.tierName && (
                        <Chip icon={<WorkspacePremiumIcon sx={{ fontSize: "14px !important" }} />} label={e.tierName} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 600 }} />
                      )}
                      <Typography variant="h5" fontWeight={800} color="secondary.main">
                        {e.seasonPointsEarned.toLocaleString()}
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>{t("loyalty@pts")}</Typography>
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}

              {/* ── Ranked list (4+) ── */}
              {rest.length > 0 && (
                <Paper elevation={1} sx={{ borderRadius: 3, overflow: "hidden" }}>
                  <Stack divider={<Divider flexItem />}>
                    {rest.map((e) => (
                      <Stack key={e.userId} direction="row" spacing={2} alignItems="center" sx={{ px: 2.5, py: 1.5, "&:hover": { bgcolor: "action.hover" } }}>
                        <Typography variant="h6" fontWeight={800} color="text.secondary" sx={{ minWidth: 40, textAlign: "center" }}>
                          {e.rank}
                        </Typography>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: "secondary.main", fontWeight: 700 }}>
                          {displayName(e, t("loyalty@anonymousUser")).charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>{displayName(e, t("loyalty@anonymousUser"))}</Typography>
                          {e.tierName && <Typography variant="caption" color="text.secondary">{e.tierName}</Typography>}
                        </Box>
                        <Typography variant="body1" fontWeight={800} color="secondary.main" sx={{ flexShrink: 0 }}>
                          {e.seasonPointsEarned.toLocaleString()}
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>{t("loyalty@pts")}</Typography>
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              )}
            </>
          )}
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
