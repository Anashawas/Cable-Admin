import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Box, Button, CircularProgress, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import { useLanguageStore } from "../../../stores";
import { LANGUAGE } from "../../../constants/language-constants";
import { useOcppSessionLive } from "../hooks/use-ocpp";
import type { OcppTransactionDto } from "../types/api";
import { ChargeLimitChip, ChargeLimitDialog } from "./ChargeLimitControls";
import { fmtDuration, fmtKwh, fmtSocRange, useDateFmt } from "./ocpp-ui";

/** One figure; not rendered when the charger does not report it. */
function Tile({ label, value, sub, ltr = true, children }: { label: string; value?: string | null; sub?: ReactNode; ltr?: boolean; children?: ReactNode }) {
  if (value == null) return null;
  return (
    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "background.paper", border: 1, borderColor: "divider", minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" noWrap>{label}</Typography>
      <Typography variant="h6" fontWeight={800} lineHeight={1.3} noWrap>{ltr ? <bdi dir="ltr">{value}</bdi> : value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary" display="block" noWrap>{sub}</Typography>}
      {children}
    </Box>
  );
}

/**
 * A running session in the charger page: power, energy, amps, voltage, temperature, battery,
 * cost so far and the "stop at …" limit. Refreshed by every pushed meter reading (5 s poll without the live connection).
 */
export default function LiveSessionPanel({ tx }: { tx: OcppTransactionDto }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const ar = useLanguageStore((s) => s.language) === LANGUAGE.AR;
  const { data: s, isLoading, isError } = useOcppSessionLive(tx.id);
  const [limitOpen, setLimitOpen] = useState(false);

  const limit = s ? s.chargeLimit : tx.chargeLimit;
  const isOpen = s ? s.isOpen : tx.isOpen;
  const stopping = isOpen && !!limit?.reachedAt;
  const soc = s?.socPercent ?? s?.socEndPercent ?? null;
  const rateWindow = ar ? s?.currentWindowNameAr : s?.currentWindowNameEn;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, borderColor: "primary.main" }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <BoltIcon color="primary" fontSize="small" aria-hidden />
        <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>
          {t("ocpp@session.title")}
        </Typography>
        <Typography variant="caption" color="text.secondary"><bdi>{t("ocpp@session.session", { id: tx.id, connector: tx.connectorId })}</bdi></Typography>
        <ChargeLimitChip limit={limit} />
        <Box sx={{ flex: 1 }} />
        {isOpen && !stopping && (
          <Button size="small" variant="outlined" startIcon={<FlagOutlinedIcon />} onClick={() => setLimitOpen(true)}>
            {limit ? t("ocpp@limit.change") : t("ocpp@limit.set")}
          </Button>
        )}
      </Stack>

      {stopping && (
        <Alert severity="warning" sx={{ mt: 1.5, py: 0 }}>
          <bdi>{t("ocpp@limit.stopping", { text: (ar ? limit?.textAr : limit?.text) || limit?.text })}</bdi>
        </Alert>
      )}

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={2}><CircularProgress size={20} /></Box>
      ) : !s ? (
        isError && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t("ocpp@session.loadError")}</Typography>
      ) : (
        <>
          <Box sx={{ mt: 1.5, display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
            <Tile
              label={t("ocpp@session.power")}
              value={s.powerW != null ? `${(s.powerW / 1000).toFixed(1)} kW` : null}
              sub={s.maxPowerW ? t("ocpp@session.maxPower", { value: (s.maxPowerW / 1000).toFixed(1) }) : undefined}
            />
            <Tile label={t("ocpp@session.energy")} value={s.energyKwh != null ? fmtKwh(s.energyKwh) : null} />
            <Tile label={t("ocpp@session.current")} value={s.currentA != null ? `${Number(s.currentA).toFixed(1)} A` : null} />
            <Tile label={t("ocpp@session.voltage")} value={s.voltageV != null ? `${Math.round(Number(s.voltageV))} V` : null} />
            <Tile label={t("ocpp@session.temperature")} value={s.temperatureC != null ? `${Number(s.temperatureC).toFixed(1)} °C` : null} />
            <Tile
              label={t("ocpp@session.battery")}
              value={s.socStartPercent != null || soc != null ? fmtSocRange(s.socStartPercent, soc) : null}
              sub={t("ocpp@session.batteryHint")}
            >
              {soc != null && <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, soc))} sx={{ mt: 0.75, borderRadius: 1, height: 6 }} aria-hidden />}
            </Tile>
            <Tile
              label={t("ocpp@session.cost")}
              value={s.costJod != null ? `${Number(s.costJod).toFixed(3)} JOD` : null}
              sub={s.currentRateFils != null ? <bdi>{t("ocpp@session.rate", { rate: s.currentRateFils, window: rateWindow ?? "" })}</bdi> : undefined}
            />
            <Tile label={t("ocpp@session.started")} value={fmt.full(s.startedAt)} ltr={false} sub={t("ocpp@session.elapsed", { duration: fmtDuration(s.durationSec) })} />
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            {s.lastSampleAt ? t("ocpp@session.lastReading", { ago: fmt.relative(s.lastSampleAt) }) : t("ocpp@session.noReadings")}
          </Typography>
        </>
      )}

      {limitOpen && <ChargeLimitDialog open transactionId={tx.id} current={limit} onClose={() => setLimitOpen(false)} />}
    </Paper>
  );
}
