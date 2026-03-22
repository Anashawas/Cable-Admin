import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EvStationIcon from "@mui/icons-material/EvStation";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HandshakeIcon from "@mui/icons-material/Handshake";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CloseIcon from "@mui/icons-material/Close";
import StarsIcon from "@mui/icons-material/Stars";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { getSettlements } from "../services/offers-service";
import { useWalletBalance } from "../hooks/use-settlements";
import type { ProviderSettlementDto, ProviderType } from "../types/api";

const STATUS_CFG: Record<number, { label_key: string; color: string; bg: string }> = {
  1: { label_key: "pending", color: "#e65100", bg: "#fff3e0" },
  3: { label_key: "paid", color: "#2e7d32", bg: "#e8f5e9" },
  4: { label_key: "disputed", color: "#c62828", bg: "#ffebee" },
};

export default function ProviderSettlementsScreen() {
  const { t, i18n } = useTranslation(["offers", "common"]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const providerType = (searchParams.get("providerType") ?? "") as ProviderType;
  const providerId = parseInt(searchParams.get("providerId") ?? "0", 10);
  const providerName = searchParams.get("name") ?? `#${providerId}`;

  const isCP = providerType === "ChargingPoint";

  const { data: settlements = [], isLoading } = useQuery({
    queryKey: ["provider-settlements-screen", providerType, providerId],
    queryFn: () => getSettlements({ providerType, providerId }),
    enabled: !!providerType && !!providerId,
    staleTime: 60 * 1000,
  });

  const { data: walletBalance } = useWalletBalance(providerType || undefined, providerId || undefined);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<ProviderSettlementDto | null>(null);
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);

  const filtered = useMemo(() => {
    if (!statusFilter) return settlements;
    return settlements.filter((s) => s.settlementStatus === statusFilter);
  }, [settlements, statusFilter]);

  const statusCounts = useMemo(() => {
    const c: Record<number, number> = { 1: 0, 3: 0, 4: 0 };
    settlements.forEach((s) => { c[s.settlementStatus] = (c[s.settlementStatus] ?? 0) + 1; });
    return c;
  }, [settlements]);

  const summary = useMemo(() => {
    const totalCommission = settlements.reduce((s, r) => s + r.partnerCommissionAmount, 0);
    const totalOffer = settlements.reduce((s, r) => s + r.offerPaymentAmount, 0);
    const totalWallet = settlements.reduce((s, r) => s + r.walletApplied, 0);
    const totalOutstanding = settlements.reduce((s, r) => s + r.outstandingAmount, 0);
    const totalNet = settlements.reduce((s, r) => s + r.netBalance, 0);
    const totalTx = settlements.reduce((s, r) => s + r.partnerTransactionCount + r.offerTransactionCount, 0);
    return { totalCommission, totalOffer, totalWallet, totalOutstanding, totalNet, totalTx };
  }, [settlements]);

  const formatDate = (val: string | null) =>
    val
      ? new Date(val).toLocaleDateString(i18n.language === "ar" ? "ar-KW" : "en-US", { year: "numeric", month: "short", day: "numeric" })
      : "—";

  if (!providerType || !providerId) {
    return (
      <AppScreenContainer>
        <Box sx={{ py: 10, textAlign: "center" }}>
          <Typography variant="h6" color="text.disabled">{t("offers@settlements_emptyTitle")}</Typography>
          <Button onClick={() => navigate("/settlements")} sx={{ mt: 2 }}>{t("back")}</Button>
        </Box>
      </AppScreenContainer>
    );
  }

  return (
    <AppScreenContainer>
      {/* ── Header ── */}
      <Box
        sx={{
          background: isCP
            ? "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)"
            : "linear-gradient(135deg, #4a148c 0%, #6a1b9a 55%, #7b1fa2 100%)",
          borderRadius: 3,
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          position: "relative",
          overflow: "hidden",
          color: "white",
        }}
      >
        <Box sx={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

        {/* Back + Provider info */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate("/settlements")} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.12)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.15)", width: 52, height: 52, borderRadius: 2.5 }}>
            {isCP ? <EvStationIcon sx={{ fontSize: 28 }} /> : <MiscellaneousServicesIcon sx={{ fontSize: 28 }} />}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h5" fontWeight={800} color="white">{providerName}</Typography>
              <Chip
                label={isCP ? t("offers@chargingPoint") : t("offers@serviceProvider")}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 700, "& .MuiChip-label": { px: 1 } }}
              />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>#{providerId}</Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mt: 0.25 }}>
              {t("offers@settlements_providerHistory")}
            </Typography>
          </Box>
          {/* Wallet balance badge */}
          {walletBalance && (
            <Paper elevation={0} sx={{ px: 2.5, py: 1.5, borderRadius: 2.5, bgcolor: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase", display: "block" }}>
                {t("offers@settlements_walletBalance")}
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: walletBalance.walletBalance < 0 ? "#ff8a80" : "#a5d6a7", lineHeight: 1, mt: 0.25 }}>
                {walletBalance.walletBalance.toFixed(3)} <Typography component="span" variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>JOD</Typography>
              </Typography>
            </Paper>
          )}
        </Stack>

        {/* KPI Cards */}
        {!isLoading && settlements.length > 0 && (
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {[
              { label: t("offers@totalSettlements"), value: settlements.length, icon: <ReceiptLongIcon /> },
              { label: t("offers@transactions"), value: summary.totalTx, icon: <HandshakeIcon /> },
              { label: t("offers@settlements_commission"), value: `${summary.totalCommission.toFixed(3)}`, sub: "JOD", icon: <HandshakeIcon />, color: "rgba(76,175,80,0.25)" },
              { label: t("offers@settlements_netBalance"), value: `${summary.totalNet.toFixed(3)}`, sub: "JOD", icon: <TrendingUpIcon />, color: "rgba(255,193,7,0.25)" },
              ...(summary.totalWallet > 0 ? [{ label: t("offers@settlements_walletApplied"), value: `${summary.totalWallet.toFixed(3)}`, sub: "JOD", icon: <AccountBalanceIcon />, color: "rgba(33,150,243,0.25)" }] : []),
              ...(summary.totalOutstanding > 0 ? [{ label: t("offers@settlements_outstanding"), value: `${summary.totalOutstanding.toFixed(3)}`, sub: "JOD", icon: <AccountBalanceIcon />, color: "rgba(239,83,80,0.25)" }] : []),
            ].map((card) => (
              <Box
                key={card.label}
                sx={{
                  background: (card as any).color ?? "rgba(255,255,255,0.1)",
                  borderRadius: 2.5,
                  px: 2.5,
                  py: 2,
                  minWidth: 130,
                  flex: "1 1 auto",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Box sx={{ opacity: 0.85, display: "flex" }}>{card.icon}</Box>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>{card.label}</Typography>
                </Stack>
                <Typography variant="h5" fontWeight={800} color="white" lineHeight={1}>{card.value}</Typography>
                {(card as any).sub && <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mt: 0.25 }}>{(card as any).sub}</Typography>}
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* ── Status filter ── */}
      <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
        {([
          { key: undefined as number | undefined, label: t("all"), count: settlements.length, color: "#1565c0", bg: "#e3f2fd", activeBg: "#1565c0" },
          { key: 1 as number | undefined, label: t("offers@pending"), count: statusCounts[1] ?? 0, color: "#e65100", bg: "#fff3e0", activeBg: "#e65100" },
          { key: 3 as number | undefined, label: t("offers@paid"), count: statusCounts[3] ?? 0, color: "#2e7d32", bg: "#e8f5e9", activeBg: "#2e7d32" },
          { key: 4 as number | undefined, label: t("offers@disputed"), count: statusCounts[4] ?? 0, color: "#c62828", bg: "#ffebee", activeBg: "#c62828" },
        ]).map(({ key, label, count, color, bg, activeBg }) => {
          const isActive = key === undefined ? statusFilter === undefined : statusFilter === key;
          return (
            <Paper
              key={String(key)}
              elevation={0}
              onClick={() => setStatusFilter(key === undefined ? undefined : (statusFilter === key ? undefined : key))}
              sx={{
                flex: 1, py: 1.5, px: 2, borderRadius: 3, cursor: "pointer", textAlign: "center",
                bgcolor: isActive ? activeBg : bg,
                border: "1px solid", borderColor: isActive ? activeBg : "transparent",
                boxShadow: isActive ? `0 4px 14px ${color}40` : "0 1px 3px rgba(0,0,0,0.06)",
                transition: "all 0.2s ease",
                "&:hover": { transform: "translateY(-2px)", boxShadow: `0 4px 12px ${color}33` },
                userSelect: "none",
              }}
            >
              <Typography variant="h4" fontWeight={900} sx={{ color: isActive ? "white" : color, lineHeight: 1 }}>{count}</Typography>
              <Typography variant="caption" fontWeight={700} sx={{ color: isActive ? "rgba(255,255,255,0.85)" : color, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.65rem", mt: 0.5, display: "block" }}>{label}</Typography>
            </Paper>
          );
        })}
      </Stack>

      {/* ── Settlement list ── */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={40} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <AccountBalanceIcon sx={{ fontSize: 48, color: "grey.300", mb: 1 }} />
          <Typography variant="h6" color="text.disabled">{t("offers@settlements_emptyTitle")}</Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {filtered.map((s) => {
            const cfg = STATUS_CFG[s.settlementStatus];
            const sColor = cfg?.color ?? "#666";
            const sBg = cfg?.bg ?? "#f5f5f5";
            const owes = s.netBalance < 0;
            const owed = s.netBalance > 0;
            const balColor = owes ? "#0277bd" : owed ? "#e65100" : "#2e7d32";
            const isPaid = s.settlementStatus === 3;
            const outstanding = s.outstandingAmount ?? 0;
            const walletApplied = s.walletApplied ?? 0;

            return (
              <Paper
                key={s.id}
                elevation={2}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "grey.200",
                  boxShadow: `0 2px 12px ${sColor}15`,
                  transition: "all 0.2s ease",
                  "&:hover": { boxShadow: "0 8px 30px rgba(0,0,0,0.12)", transform: "translateY(-2px)" },
                }}
              >
                <Box sx={{ height: 5, background: `linear-gradient(90deg, ${sColor}, ${sColor}88)` }} />
                <Box sx={{ px: 3, pt: 2.5, pb: 2 }}>
                  {/* Period + Status + Date */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CalendarMonthIcon sx={{ fontSize: 20, color: "primary.main" }} />
                      <Typography variant="h6" fontWeight={800}>{s.periodYear}</Typography>
                      <Chip label={`W${s.periodWeek}`} size="small" color="primary" sx={{ height: 26, fontWeight: 800, "& .MuiChip-label": { px: 1.25, fontSize: "0.8rem" } }} />
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.68rem" }}>
                        #{s.id} · {formatDate(s.createdAt)}
                        {s.paidAt && ` · ${t("offers@paidAt")}: ${formatDate(s.paidAt)}`}
                      </Typography>
                      <Chip
                        label={t(`offers@${cfg?.label_key}`)}
                        sx={{ bgcolor: sBg, color: sColor, fontWeight: 800, "& .MuiChip-label": { px: 1.25 } }}
                      />
                    </Stack>
                  </Stack>

                  {/* Metrics row */}
                  <Stack direction="row" spacing={1} sx={{ mx: -0.5, "& > *": { flex: 1, px: 0.5 } }}>
                    {/* Net Balance */}
                    <Box>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, textAlign: "center", bgcolor: owes ? "#e1f5fe" : owed ? "#fff3e0" : "#e8f5e9", border: "1px solid", borderColor: owes ? "#b3e5fc" : owed ? "#ffe0b2" : "#c8e6c9" }}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase" }}>{t("offers@settlements_netBalance")}</Typography>
                        <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5, color: balColor }}>
                          {Math.abs(s.netBalance).toFixed(3)}
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>JOD</Typography>
                        </Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.62rem", color: balColor }}>
                          {owes ? t("offers@settlements_providerPaysCable") : owed ? t("offers@settlements_cablePaysProvider") : t("offers@settlements_settled")}
                        </Typography>
                      </Paper>
                    </Box>

                    {/* Commission */}
                    <Box>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, textAlign: "center", bgcolor: "#fafafa", border: "1px solid", borderColor: "grey.200" }}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase" }}>{t("offers@commission")}</Typography>
                        <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>{s.partnerCommissionAmount.toFixed(3)}</Typography>
                        <Typography variant="caption" color="text.secondary">JOD</Typography>
                      </Paper>
                    </Box>

                    {/* Transactions */}
                    <Box>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, textAlign: "center", bgcolor: "#fafafa", border: "1px solid", borderColor: "grey.200" }}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase" }}>{t("offers@transactions")}</Typography>
                        <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>{s.partnerTransactionCount + s.offerTransactionCount}</Typography>
                        <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 0.25 }}>
                          {s.partnerTransactionCount > 0 && <Chip icon={<HandshakeIcon sx={{ fontSize: "12px !important" }} />} label={s.partnerTransactionCount} size="small" color="success" variant="outlined" sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: "0.65rem" } }} />}
                          {s.offerTransactionCount > 0 && <Chip icon={<LocalOfferIcon sx={{ fontSize: "12px !important" }} />} label={s.offerTransactionCount} size="small" color="error" variant="outlined" sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: "0.65rem" } }} />}
                        </Stack>
                      </Paper>
                    </Box>

                    {/* Outstanding / Paid */}
                    <Box>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, textAlign: "center", bgcolor: isPaid ? "#e8f5e9" : outstanding > 0 ? "#ffebee" : "#fafafa", border: "1px solid", borderColor: isPaid ? "#c8e6c9" : outstanding > 0 ? "#ffcdd2" : "grey.200" }}>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase" }}>{t("offers@settlements_outstanding")}</Typography>
                        {isPaid ? (
                          <Box sx={{ mt: 0.5 }}>
                            <Chip label={`✓ ${t("offers@paid")}`} size="small" sx={{ bgcolor: "#2e7d32", color: "white", fontWeight: 800, height: 26 }} />
                            {walletApplied > 0 && <Typography variant="caption" color="info.main" sx={{ fontSize: "0.62rem", display: "block", mt: 0.5 }}>{t("offers@settlements_walletApplied")}: {walletApplied.toFixed(3)}</Typography>}
                          </Box>
                        ) : (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="h5" fontWeight={900} color={outstanding > 0 ? "error.dark" : "text.disabled"}>
                              {outstanding > 0 ? outstanding.toFixed(3) : "—"}
                            </Typography>
                            {outstanding > 0 && <Typography variant="caption" color="text.secondary">JOD</Typography>}
                          </Box>
                        )}
                      </Paper>
                    </Box>
                  </Stack>

                  {/* Actions */}
                  <Stack direction="row" justifyContent="flex-end" spacing={0.75} sx={{ mt: 2, pt: 1.5, borderTop: "1px solid", borderColor: "grey.100" }}>
                    <Tooltip title={t("offers@viewDetails")}>
                      <IconButton size="small" onClick={() => { setSelectedSettlement(s); setDetailDialogOpen(true); }} sx={{ color: "text.secondary", "&:hover": { bgcolor: "grey.100" } }}>
                        <VisibilityIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* ── Detail Dialog (simple) ── */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
        <Box sx={{ background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)", p: 3, color: "white" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700} color="white">{t("offers@settlementDetails")}</Typography>
            <IconButton size="small" onClick={() => setDetailDialogOpen(false)} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white" } }}><CloseIcon /></IconButton>
          </Stack>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {selectedSettlement && (
            <Stack spacing={2}>
              {/* Period + Status */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" fontWeight={800}>{selectedSettlement.periodYear} W{selectedSettlement.periodWeek}</Typography>
                </Stack>
                <Chip label={t(`offers@${STATUS_CFG[selectedSettlement.settlementStatus]?.label_key}`)} sx={{ bgcolor: STATUS_CFG[selectedSettlement.settlementStatus]?.bg, color: STATUS_CFG[selectedSettlement.settlementStatus]?.color, fontWeight: 800 }} />
              </Stack>

              {/* Financial details */}
              <Grid container spacing={1.5}>
                {[
                  { label: t("offers@settlements_partnerTx"), value: `${selectedSettlement.partnerTransactionCount} ${t("offers@transactions")}`, sub: `${selectedSettlement.partnerTransactionAmount.toFixed(3)} JOD`, color: "#2e7d32", bg: "#e8f5e9" },
                  { label: t("offers@settlements_commission"), value: `${selectedSettlement.partnerCommissionAmount.toFixed(3)} JOD`, sub: null, color: "#2e7d32", bg: "#e8f5e9" },
                  { label: t("offers@settlements_offerTx"), value: `${selectedSettlement.offerTransactionCount} ${t("offers@transactions")}`, sub: `${selectedSettlement.offerPaymentAmount.toFixed(3)} JOD`, color: "#c62828", bg: "#ffebee" },
                  { label: t("offers@settlements_netBalance"), value: `${selectedSettlement.netBalance.toFixed(3)} JOD`, sub: selectedSettlement.netBalance < 0 ? t("offers@settlements_providerPaysCable") : selectedSettlement.netBalance > 0 ? t("offers@settlements_cablePaysProvider") : t("offers@settlements_settled"), color: selectedSettlement.netBalance < 0 ? "#0277bd" : "#e65100", bg: selectedSettlement.netBalance < 0 ? "#e1f5fe" : "#fff3e0" },
                  ...(selectedSettlement.walletApplied > 0 ? [{ label: t("offers@settlements_walletApplied"), value: `${selectedSettlement.walletApplied.toFixed(3)} JOD`, sub: null, color: "#0277bd", bg: "#e1f5fe" }] : []),
                  ...(selectedSettlement.outstandingAmount > 0 ? [{ label: t("offers@settlements_outstanding"), value: `${selectedSettlement.outstandingAmount.toFixed(3)} JOD`, sub: null, color: "#c62828", bg: "#ffebee" }] : []),
                ].map(({ label, value, sub, color, bg }) => (
                  <Grid size={{ xs: 6, sm: 4 }} key={label}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: bg, borderRadius: 2, textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase" }}>{label}</Typography>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ color }}>{value}</Typography>
                      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Timeline */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t("offers@createdAt")}</Typography>
                    <Typography variant="body2" fontWeight={600}>{formatDate(selectedSettlement.createdAt)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t("offers@paidAt")}</Typography>
                    <Typography variant="body2" fontWeight={600}>{formatDate(selectedSettlement.paidAt)}</Typography>
                  </Box>
                </Stack>
              </Paper>

              {selectedSettlement.adminNote && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, borderLeft: "4px solid", borderColor: "warning.main" }}>
                  <Typography variant="overline" color="warning.dark" fontWeight={700}>{t("offers@adminNote")}</Typography>
                  <Typography variant="body2">{selectedSettlement.adminNote}</Typography>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDetailDialogOpen(false)} variant="outlined">{t("close")}</Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
