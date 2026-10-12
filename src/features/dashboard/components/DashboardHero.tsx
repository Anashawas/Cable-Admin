import { useMemo, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { alpha } from "@mui/material/styles";
import { Box, Chip, CircularProgress, Divider, Grid, Skeleton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import EvStationIcon from "@mui/icons-material/EvStation";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import StoreIcon from "@mui/icons-material/Store";
import HandshakeIcon from "@mui/icons-material/Handshake";
import { useAuthenticationStore } from "../../../stores";
import { formatLongDate, localDayBounds } from "../../../utils/date-format";
import { useAllPointsTransactions } from "../../loyalty/hooks/use-loyalty";
import type { ChargingPointDto } from "../../charge-management/types/api";

/** Western digits everywhere (matches the rest of the admin), isolated for RTL. */
const Num = ({ v }: { v: number }) => <bdi>{v.toLocaleString("en-US")}</bdi>;

/** Points-ledger "Earn" transaction type — one per successful loyalty scan. */
const TX_EARN = 1;

interface DashboardHeroProps {
  stations: ChargingPointDto[];
  loadingStations: boolean;
  stationsError: boolean;
  newUsersToday?: number;
  newUsersThisWeek?: number;
  loadingUsers: boolean;
  usersError: boolean;
  newProvidersToday: number;
  newPartnersToday: number;
}

/** Clickable KPI surface (keyboard + screen-reader friendly). */
function HeroCard({ ariaLabel, onClick, accent, children }: { ariaLabel: string; onClick: () => void; accent: string; children: ReactNode }) {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
  };
  return (
    <Box
      role="link"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={onKey}
      sx={{
        position: "relative", height: "100%", p: 2.25, borderRadius: 3, cursor: "pointer", overflow: "hidden",
        display: "flex", flexDirection: "column", boxSizing: "border-box",
        bgcolor: "background.paper", border: "1px solid", borderColor: "divider",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        transition: "box-shadow .2s, border-color .2s",
        "&:hover": { boxShadow: `0 6px 20px ${alpha(accent, 0.16)}`, borderColor: alpha(accent, 0.45) },
        "&:focus-visible": { outline: `2px solid ${accent}`, outlineOffset: 2 },
      }}
    >
      {children}
    </Box>
  );
}

function CardHead({ icon, label, accent }: { icon: ReactNode; label: string; accent: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(accent, 0.12), color: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </Box>
      <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ flex: 1, minWidth: 0 }} noWrap>{label}</Typography>
      <ChevronRightIcon sx={{ color: "text.disabled", fontSize: 18, transform: (th) => (th.direction === "rtl" ? "scaleX(-1)" : "none") }} />
    </Stack>
  );
}

/** Big figure, a skeleton while loading, or "—" + tooltip when the source failed. */
function BigValue({ value, loading, unavailableHint }: { value: number | null; loading: boolean; unavailableHint: string }) {
  if (loading) return <Skeleton variant="text" width="45%" height={44} sx={{ mt: 1 }} />;
  if (value === null) {
    return (
      <Tooltip title={unavailableHint} arrow>
        <Typography variant="h4" fontWeight={800} color="text.disabled" sx={{ mt: 1, lineHeight: 1.15, width: "fit-content" }}>—</Typography>
      </Tooltip>
    );
  }
  return <Typography variant="h4" fontWeight={800} sx={{ mt: 1, lineHeight: 1.15 }}><Num v={value} /></Typography>;
}

/** A small tile: share ring with the %, the count and its label. */
function ShareTile({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ flex: 1, minWidth: 0, p: 1.25, borderRadius: 2, bgcolor: alpha(color, 0.06), border: "1px solid", borderColor: alpha(color, 0.18) }}>
      <Box sx={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
        <CircularProgress variant="determinate" value={100} size={44} thickness={4.5} sx={{ color: alpha(color, 0.16), position: "absolute", inset: 0 }} />
        <CircularProgress variant="determinate" value={pct} size={44} thickness={4.5} sx={{ color, position: "absolute", inset: 0, "& circle": { strokeLinecap: "round" } }} />
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography variant="caption" fontWeight={800} sx={{ fontSize: 11 }}><bdi>{pct}%</bdi></Typography>
        </Box>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}><Num v={value} /></Typography>
        <Typography variant="caption" fontWeight={600} color="text.secondary" noWrap sx={{ display: "block" }}>{label}</Typography>
      </Box>
    </Stack>
  );
}

/** Bottom line of a card, pinned to the card's foot. */
function CardFoot({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ mt: "auto", pt: 1.5 }}>
      <Divider sx={{ mb: 1.25 }} />
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minHeight: 22 }}>{children}</Stack>
    </Box>
  );
}

export default function DashboardHero({
  stations, loadingStations, stationsError,
  newUsersToday, newUsersThisWeek, loadingUsers, usersError,
  newProvidersToday, newPartnersToday,
}: DashboardHeroProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const user = useAuthenticationStore((s) => s.user);
  const isAr = i18n.language.startsWith("ar");

  const now = new Date();
  const todayKey = localDayBounds(now).from.slice(0, 10);
  const { today, yesterday } = useMemo(() => {
    const d = new Date(`${todayKey}T00:00:00`);
    const y = new Date(d); y.setDate(d.getDate() - 1);
    return { today: localDayBounds(d), yesterday: localDayBounds(y) };
  }, [todayKey]);

  // Count-only reads of the points ledger: pageSize=1, use totalCount.
  const scansToday = useAllPointsTransactions({ transactionType: TX_EARN, from: today.from, to: today.to, page: 1, pageSize: 1 });
  const scansYesterday = useAllPointsTransactions({ transactionType: TX_EARN, from: yesterday.from, to: yesterday.to, page: 1, pageSize: 1 });

  const hour = now.getHours();
  const greeting = t(hour < 12 ? "dashboard@greeting_morning" : hour < 18 ? "dashboard@greeting_afternoon" : "dashboard@greeting_evening");

  const stationTotals = useMemo(() => ({
    total: stations.length,
    verified: stations.filter((s) => s.isVerified).length,
    loyalty: stations.filter((s) => s.isPartner).length,
  }), [stations]);

  const scansValue = scansToday.isError ? null : (scansToday.data?.totalCount ?? 0);
  const yesterdayValue = scansYesterday.isError ? null : scansYesterday.data?.totalCount ?? null;
  const delta = scansValue !== null && yesterdayValue !== null ? scansValue - yesterdayValue : null;

  const stationsAccent = theme.palette.primary.main;
  const verifiedColor = theme.palette.success.main;
  const loyaltyColor = theme.palette.warning.main;
  const usersAccent = theme.palette.secondary.main;
  const scansAccent = theme.palette.warning.dark;

  const sep = isAr ? "، " : ", ";
  const unavailable = t("dashboard@hero.unavailable");

  return (
    <Box component="section" aria-label={t("dashboard@hero.ariaLabel")} sx={{ mb: 3 }}>
      {/* ── Greeting row ── */}
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "flex-end" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ width: 40, height: 3, borderRadius: 2, mb: 1.25, background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` }} />
          <Typography variant="h5" component="h1" fontWeight={800} sx={{ lineHeight: 1.25 }}>
            {greeting}{user?.name ? <>{sep}<bdi>{user.name}</bdi></> : null}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5, color: "text.secondary" }}>
            <CalendarTodayIcon sx={{ fontSize: 15 }} />
            <Typography variant="body2" fontWeight={500}>{formatLongDate(now, i18n.language)}</Typography>
          </Stack>
        </Box>
        {(newProvidersToday > 0 || newPartnersToday > 0) && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {newProvidersToday > 0 && (
              <Chip size="small" variant="outlined" icon={<StoreIcon sx={{ fontSize: "16px !important" }} />} onClick={() => navigate("/service-providers")}
                label={<>+<Num v={newProvidersToday} /> {t("dashboard@hero.newProvidersShort")}</>} sx={{ fontWeight: 600 }} />
            )}
            {newPartnersToday > 0 && (
              <Chip size="small" variant="outlined" icon={<HandshakeIcon sx={{ fontSize: "16px !important" }} />} onClick={() => navigate("/partners")}
                label={<>+<Num v={newPartnersToday} /> {t("dashboard@hero.newPartnersShort")}</>} sx={{ fontWeight: 600 }} />
            )}
          </Stack>
        )}
      </Stack>

      {/* ── KPI row ── */}
      <Grid container spacing={2}>
        {/* 1) Stations: total + verified / loyalty shares */}
        <Grid size={{ xs: 12, md: 5 }}>
          <HeroCard
            accent={stationsAccent}
            onClick={() => navigate("/charge-management")}
            ariaLabel={stationsError ? `${t("dashboard@hero.stations")}: ${unavailable}` : t("dashboard@hero.stationsAria", stationTotals)}
          >
            <CardHead icon={<EvStationIcon sx={{ fontSize: 20 }} />} label={t("dashboard@hero.stations")} accent={stationsAccent} />
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} spacing={2} sx={{ mt: 1.5, flex: 1 }}>
              <Box sx={{ minWidth: 110 }}>
                <BigValue value={stationsError ? null : stationTotals.total} loading={loadingStations} unavailableHint={unavailable} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("dashboard@hero.stationsUnit")}</Typography>
              </Box>
              {loadingStations ? (
                <Stack direction="row" spacing={1.25} sx={{ flex: 1 }}><Skeleton variant="rounded" height={66} sx={{ flex: 1 }} /><Skeleton variant="rounded" height={66} sx={{ flex: 1 }} /></Stack>
              ) : stationsError ? null : (
                <Stack direction="row" spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
                  <ShareTile label={t("dashboard@hero.verified")} value={stationTotals.verified} total={stationTotals.total} color={verifiedColor} />
                  <ShareTile label={t("dashboard@hero.loyalty")} value={stationTotals.loyalty} total={stationTotals.total} color={loyaltyColor} />
                </Stack>
              )}
            </Stack>
          </HeroCard>
        </Grid>

        {/* 2) New users today */}
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <HeroCard
            accent={usersAccent}
            onClick={() => navigate("/users")}
            ariaLabel={`${t("dashboard@today_newUsers")}: ${usersError ? unavailable : newUsersToday ?? 0}`}
          >
            <CardHead icon={<PersonAddIcon sx={{ fontSize: 20 }} />} label={t("dashboard@today_newUsers")} accent={usersAccent} />
            <BigValue value={usersError ? null : newUsersToday ?? 0} loading={loadingUsers} unavailableHint={unavailable} />
            <CardFoot>
              {!loadingUsers && !usersError && typeof newUsersThisWeek === "number" ? (
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {t("dashboard@hero.thisWeek")} <Typography component="span" variant="caption" fontWeight={800} color="text.primary"><Num v={newUsersThisWeek} /></Typography>
                </Typography>
              ) : <Skeleton variant="text" width="50%" />}
            </CardFoot>
          </HeroCard>
        </Grid>

        {/* 3) Loyalty scans today */}
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <HeroCard
            accent={scansAccent}
            onClick={() => navigate("/loyalty-ledger")}
            ariaLabel={`${t("dashboard@hero.scansToday")}: ${scansValue === null ? unavailable : scansValue}`}
          >
            <CardHead icon={<QrCodeScannerIcon sx={{ fontSize: 20 }} />} label={t("dashboard@hero.scansToday")} accent={scansAccent} />
            <Tooltip title={t("dashboard@hero.scansHint")} arrow placement="top-start">
              <Box sx={{ width: "fit-content" }}>
                <BigValue value={scansValue} loading={scansToday.isLoading} unavailableHint={unavailable} />
              </Box>
            </Tooltip>
            <CardFoot>
              {!scansToday.isLoading && yesterdayValue !== null ? (
                <>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ flex: 1 }}>
                    {t("dashboard@hero.yesterday")} <Typography component="span" variant="caption" fontWeight={800} color="text.primary"><Num v={yesterdayValue} /></Typography>
                  </Typography>
                  {delta !== null && (
                    <Chip
                      size="small"
                      variant="outlined"
                      color={delta > 0 ? "success" : delta < 0 ? "error" : "default"}
                      icon={delta > 0 ? <ArrowUpwardIcon sx={{ fontSize: "14px !important" }} /> : delta < 0 ? <ArrowDownwardIcon sx={{ fontSize: "14px !important" }} /> : undefined}
                      label={delta === 0 ? t("dashboard@hero.sameAsYesterday") : <bdi>{Math.abs(delta).toLocaleString("en-US")}</bdi>}
                      sx={{ height: 22, fontWeight: 700, "& .MuiChip-label": { px: 0.75 } }}
                    />
                  )}
                </>
              ) : <Skeleton variant="text" width="50%" />}
            </CardFoot>
          </HeroCard>
        </Grid>
      </Grid>
    </Box>
  );
}
