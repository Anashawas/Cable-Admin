import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { Box, Chip, Paper, Stack, Tooltip, Typography } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChargerIcon, { iconPlugsFromCounts } from "./ChargerIcon";
import { Dot, ReliabilityText, SubscriptionQuietChip, useDateFmt } from "./ocpp-ui";
import type { StationGroup } from "./station-groups";

const MAX_ICONS = 5;

export const stationCableConnectPath = (chargingPointId: number) => `/cable-connect/stations/${chargingPointId}`;

/** One station on the Cable Connect overview; the whole card links to the station's page. */
export default function StationCard({ g }: { g: StationGroup }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const chargersTotal = g.chargers.length;
  const shown = g.chargers.slice(0, MAX_ICONS);
  const more = chargersTotal - shown.length;
  const allOnline = g.online === chargersTotal;

  return (
    <Paper
      variant="outlined"
      component={RouterLink}
      to={stationCableConnectPath(g.chargingPointId)}
      aria-label={t("ocpp@stations.open", { name: g.stationName })}
      sx={{
        display: "flex", flexDirection: "column", gap: 1.5, p: 2, borderRadius: 3, height: "100%",
        color: "inherit", textDecoration: "none", position: "relative",
        borderInlineStartWidth: g.hasProblem ? 3 : 1,
        borderInlineStartColor: g.hasProblem ? "error.main" : "divider",
        transition: "border-color .15s, box-shadow .15s",
        "&:hover": { borderColor: "primary.main", boxShadow: 1 },
        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
      }}
    >
      {/* Name + id, open alerts */}
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={800} noWrap component="h3" lineHeight={1.3}>{g.stationName}</Typography>
          <Typography variant="caption" color="text.secondary">
            <bdi>#{g.chargingPointId}</bdi> · {t("ocpp@stations.chargers", { count: chargersTotal })}
          </Typography>
        </Box>
        {g.openAlerts > 0 && (
          <Chip
            size="small" color="error" variant="outlined" icon={<NotificationsActiveOutlinedIcon />}
            label={<bdi>{g.openAlerts}</bdi>} aria-label={t("ocpp@stations.alerts", { count: g.openAlerts })}
            sx={{ fontWeight: 700, height: 24 }}
          />
        )}
        <ChevronRightIcon fontSize="small" sx={{ color: "text.disabled", mt: 0.25, transform: (th) => (th.direction === "rtl" ? "scaleX(-1)" : "none") }} aria-hidden />
      </Stack>

      {/* One icon per charger */}
      <Stack direction="row" spacing={1} alignItems="flex-end" aria-hidden>
        {shown.map((c) => (
          <ChargerIcon key={c.id} plugs={iconPlugsFromCounts(c)} offline={!c.isConnected || !c.isEnabled} size={24} />
        ))}
        {more > 0 && <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ pb: 0.25 }}><bdi>+{more}</bdi></Typography>}
      </Stack>

      {/* Figures */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", rowGap: 0.75, columnGap: 1.5 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
          <Dot color={allOnline ? "success.main" : g.online === 0 ? "error.main" : "warning.main"} />
          <Typography variant="body2" fontWeight={600} noWrap>
            <bdi>{t("ocpp@stations.online", { online: g.online, total: chargersTotal })}</bdi>
          </Typography>
        </Stack>
        <Typography variant="body2" fontWeight={600} noWrap color={g.freeConnectors > 0 ? "success.main" : "text.secondary"}>
          <bdi>{t("ocpp@stations.plugsFree", { free: g.freeConnectors, total: g.totalConnectors })}</bdi>
        </Typography>
        <Stack direction="row" spacing={0.25} alignItems="center" sx={{ color: g.openSessions > 0 ? "primary.main" : "text.secondary", minWidth: 0 }}>
          <BoltIcon sx={{ fontSize: 16 }} aria-hidden />
          <Typography variant="body2" fontWeight={g.openSessions > 0 ? 700 : 400} noWrap>
            <bdi>{t("ocpp@table.charging", { count: g.openSessions })}</bdi>
          </Typography>
        </Stack>
        {g.faultedConnectors > 0 ? (
          <Typography variant="body2" fontWeight={700} color="error.main" noWrap>
            <bdi>{t("ocpp@table.plugsFaulted", { count: g.faultedConnectors })}</bdi>
          </Typography>
        ) : <span />}
      </Box>

      {/* Subscription · reliability · last seen */}
      <Stack
        direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap
        sx={{ mt: "auto", pt: 1.5, borderTop: 1, borderColor: "divider" }}
      >
        <SubscriptionQuietChip sub={g.subscription} />
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption" color="text.secondary">{t("ocpp@columns.reliability")}</Typography>
          <ReliabilityText pct={g.reliabilityAvg} />
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Tooltip title={g.lastSeen ? fmt.full(g.lastSeen) : ""}>
          <Typography variant="caption" color="text.secondary" noWrap>
            {t("ocpp@columns.lastSeen")} <bdi>{fmt.relative(g.lastSeen)}</bdi>
          </Typography>
        </Tooltip>
      </Stack>
    </Paper>
  );
}
