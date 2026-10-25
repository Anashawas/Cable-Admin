import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert, Box, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useOcppSessionLive } from "../../hooks/use-ocpp";
import type { OcppTransactionDto } from "../../types/api";
import { costOf, sourceOf, type PaymentSession } from "../../utils/payments";
import { fmtDay, fmtDurationLong, fmtNum, fmtTime12, stopReasonLabel } from "../../utils/payments-format";
import LiveSessionPanel from "../LiveSessionPanel";

const Ltr = ({ children }: { children: ReactNode }) => <bdi dir="ltr">{children}</bdi>;

function Tile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box sx={{ p: 1.25, borderRadius: 2, border: 1, borderColor: "divider", minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" noWrap>{label}</Typography>
      <Typography variant="subtitle1" fontWeight={800} lineHeight={1.3} noWrap>{value}</Typography>
    </Box>
  );
}

/** The list row as the transaction shape LiveSessionPanel expects (a running session). */
const asTransaction = (s: PaymentSession): OcppTransactionDto => ({
  id: s.id,
  connectorId: s.connectorId,
  idTag: s.idTag,
  startedAt: s.startedAt,
  stoppedAt: s.stoppedAt,
  durationSec: s.durationSec,
  meterStartWh: 0,
  energyKwh: s.energyKwh,
  stopReason: s.stopReason,
  isOpen: s.isOpen,
  isStale: false,
  isOrphan: false,
  wasRejected: false,
  startSource: s.startSource,
  startedByUserId: s.startedByUserId,
  costFils: s.costFils,
  costJod: s.costJod,
  socStartPercent: s.socStartPercent,
  socEndPercent: s.socEndPercent,
  chargeLimit: s.chargeLimit,
});

interface Props {
  session: PaymentSession | null;
  stationName: string;
  chargerName: string;
  ar: boolean;
  onClose: () => void;
}

/**
 * One session's detail. A running one reuses the charger page's live panel; a finished one
 * shows its final figures and the tariff breakdown from the admin session endpoint.
 */
export default function SessionValueDialog({ session: s, stationName, chargerName, ar, onClose }: Props) {
  const { t } = useTranslation();
  const detail = useOcppSessionLive(s && !s.isOpen ? s.id : null, false);
  const d = detail.data;

  return (
    <Dialog open={!!s} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="pay-session-title">
      <DialogTitle id="pay-session-title" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}><bdi>{t("ocpp@payments.session.title", { id: s?.id ?? "" })}</bdi></Box>
        <IconButton onClick={onClose} size="small" aria-label={t("ocpp@payments.close")}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {s && (
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" fontWeight={700}><bdi>{stationName}</bdi></Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                <bdi>{chargerName}</bdi> · <bdi>{t("ocpp@payments.session.plugN", { n: s.connectorId })}</bdi>
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                <Chip size="small" variant="outlined" label={t(`ocpp@payments.source.${sourceOf(s)}`)} sx={{ fontWeight: 600 }} />
                <Typography variant="body2" color="text.secondary">
                  <bdi>{fmtDay(s.startedAt, ar)}</bdi> · <bdi>{fmtTime12(s.startedAt, ar)} – {s.stoppedAt ? fmtTime12(s.stoppedAt, ar) : "…"}</bdi>
                </Typography>
                {sourceOf(s) === "Card" && s.idTag && (
                  <Typography variant="caption" color="text.secondary"><bdi dir="ltr" style={{ fontFamily: "monospace" }}>{s.idTag}</bdi></Typography>
                )}
                {sourceOf(s) === "App" && s.startedByUserId != null && (
                  <Typography variant="caption" color="text.secondary"><bdi>{t("ocpp@payments.session.userId", { id: s.startedByUserId })}</bdi></Typography>
                )}
              </Stack>
            </Box>

            {s.isOpen ? (
              <LiveSessionPanel tx={asTransaction(s)} />
            ) : (
              <>
                <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                  <Tile label={t("ocpp@payments.daily.revenue")} value={<Box component="span" sx={{ color: "primary.main" }}><Ltr>{fmtNum(costOf(s), 3)} JOD</Ltr></Box>} />
                  <Tile label={t("ocpp@payments.daily.energy")} value={<Ltr>{fmtNum(s.energyKwh ?? 0, 2)} kWh</Ltr>} />
                  <Tile label={t("ocpp@payments.session.duration")} value={<bdi>{fmtDurationLong(s.durationSec, t)}</bdi>} />
                  {d?.avgPowerW != null && <Tile label={t("ocpp@payments.session.avgPower")} value={<Ltr>{fmtNum(d.avgPowerW / 1000, 1)} kW</Ltr>} />}
                  {d?.maxPowerW != null && <Tile label={t("ocpp@payments.session.maxPower")} value={<Ltr>{fmtNum(d.maxPowerW / 1000, 1)} kW</Ltr>} />}
                  {(s.socStartPercent || s.socEndPercent) ? (
                    <Tile
                      label={t("ocpp@payments.session.battery")}
                      value={<Ltr>{s.socStartPercent ? `${Math.round(s.socStartPercent)}%` : "—"} → {s.socEndPercent ? `${Math.round(s.socEndPercent)}%` : "—"}</Ltr>}
                    />
                  ) : null}
                </Box>
                <Typography variant="body2"><b>{t("ocpp@payments.session.ended")}:</b> {stopReasonLabel(s, ar)}</Typography>

                {detail.isLoading ? (
                  <Box display="flex" justifyContent="center" py={1}><CircularProgress size={20} aria-label={t("ocpp@payments.loading")} /></Box>
                ) : detail.isError ? (
                  <Alert severity="info" sx={{ py: 0 }}>{t("ocpp@payments.session.detailError")}</Alert>
                ) : d?.price && d.price.length > 0 ? (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>{t("ocpp@payments.session.priceTitle")}</Typography>
                    <Table size="small" aria-label={t("ocpp@payments.session.priceTitle")}>
                      <TableHead>
                        <TableRow>
                          <TableCell>{t("ocpp@payments.session.window")}</TableCell>
                          <TableCell align="right">kWh</TableCell>
                          <TableCell align="right">{t("ocpp@payments.session.rate")}</TableCell>
                          <TableCell align="right">JOD</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {d.price.map((p) => (
                          <TableRow key={p.key}>
                            <TableCell><bdi>{ar ? p.nameAr || p.nameEn : p.nameEn}</bdi></TableCell>
                            <TableCell align="right"><Ltr>{fmtNum(p.kwh, 2)}</Ltr></TableCell>
                            <TableCell align="right"><Ltr>{t("ocpp@payments.session.filsPerKwh", { v: p.priceFils })}</Ltr></TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}><Ltr>{fmtNum(p.fils / 1000, 3)}</Ltr></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : null}
              </>
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
