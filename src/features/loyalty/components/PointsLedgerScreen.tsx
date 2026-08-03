import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Divider,
  Pagination,
  InputAdornment,
  CircularProgress,
  Avatar,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SearchIcon from "@mui/icons-material/Search";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { useAllPointsTransactions } from "../hooks/use-loyalty";

const PAGE_SIZE = 20;

const TX_TYPE: Record<number, { key: string; color: "success" | "error" | "warning" | "info" | "secondary" }> = {
  1: { key: "loyalty@txEarn", color: "success" },
  2: { key: "loyalty@txRedeem", color: "error" },
  3: { key: "loyalty@txExpired", color: "warning" },
  4: { key: "loyalty@txAdminAdjust", color: "info" },
  5: { key: "loyalty@txSeasonBonus", color: "secondary" },
};
const TYPE_FILTERS = [undefined, 1, 2, 4, 3, 5] as (number | undefined)[];

export default function PointsLedgerScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<number | undefined>(undefined);
  const [userIdInput, setUserIdInput] = useState("");
  const [providerType, setProviderType] = useState<"" | "ChargingPoint" | "ServiceProvider">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const params = useMemo(() => {
    const uid = parseInt(userIdInput, 10);
    return {
      page,
      pageSize: PAGE_SIZE,
      transactionType: typeFilter,
      userId: Number.isFinite(uid) && uid > 0 ? uid : undefined,
      providerType: providerType || undefined,
      from: from ? `${from}T00:00:00Z` : undefined,
      to: to ? `${to}T23:59:59Z` : undefined,
    };
  }, [page, typeFilter, userIdInput, providerType, from, to]);

  const { data, isLoading } = useAllPointsTransactions(params);
  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE)), [data]);

  const fmt = (v: string) => new Date(v).toLocaleString(i18n.language === "ar" ? "ar-KW" : "en-US");
  const resetPage = () => setPage(1);

  return (
    <AppScreenContainer>
      <ScreenHeader icon={<ReceiptLongIcon />} title={t("loyalty@ledger.title")} subtitle={t("loyalty@ledger.subtitle")} />

      <Stack spacing={2.5} sx={{ mt: 3 }}>
        {/* Filters */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {TYPE_FILTERS.map((tf) => (
                <Chip
                  key={tf ?? "all"} size="small"
                  label={tf === undefined ? t("loyalty@all") : t(TX_TYPE[tf].key)}
                  onClick={() => { setTypeFilter(tf); resetPage(); }}
                  color={typeFilter === tf ? "primary" : "default"}
                  variant={typeFilter === tf ? "filled" : "outlined"}
                  sx={{ fontWeight: 700, cursor: "pointer" }}
                />
              ))}
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap" useFlexGap>
              <TextField
                size="small" label={t("loyalty@ledger.filterUser")} value={userIdInput}
                onChange={(e) => { setUserIdInput(e.target.value.replace(/[^0-9]/g, "")); resetPage(); }}
                placeholder="#"
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
                sx={{ minWidth: 150 }}
              />
              <TextField
                select size="small" label={t("loyalty@ledger.providerType")} value={providerType}
                onChange={(e) => { setProviderType(e.target.value as "" | "ChargingPoint" | "ServiceProvider"); resetPage(); }}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value=""><em>{t("loyalty@ledger.allProviders")}</em></MenuItem>
                <MenuItem value="ChargingPoint">{t("offers@chargingPoint")}</MenuItem>
                <MenuItem value="ServiceProvider">{t("offers@serviceProvider")}</MenuItem>
              </TextField>
              <TextField size="small" type="date" label={t("loyalty@ledger.from")} value={from} onChange={(e) => { setFrom(e.target.value); resetPage(); }} InputLabelProps={{ shrink: true }} />
              <TextField size="small" type="date" label={t("loyalty@ledger.to")} value={to} onChange={(e) => { setTo(e.target.value); resetPage(); }} InputLabelProps={{ shrink: true }} />
            </Stack>
          </Stack>
        </Paper>

        {/* Results */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2.5, py: 1.75, bgcolor: "primary.main" }}>
            <ReceiptLongIcon sx={{ color: "#fff" }} />
            <Typography variant="subtitle1" fontWeight={700} color="#fff" flex={1}>{t("loyalty@ledger.title")}</Typography>
            {data && <Chip label={data.totalCount.toLocaleString()} size="small" sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 700 }} />}
          </Stack>
          <Box sx={{ p: 2 }}>
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={34} /></Box>
            ) : !data || data.items.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 6 }}>{t("loyalty@ledger.empty")}</Typography>
            ) : (
              <>
                <Stack spacing={1} divider={<Divider flexItem />}>
                  {data.items.map((h) => {
                    const cfg = TX_TYPE[h.transactionType] ?? TX_TYPE[4];
                    const positive = h.points >= 0;
                    return (
                      <Stack key={h.id} direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: `${cfg.color}.50`, color: `${cfg.color}.main` }}>
                          <ReceiptLongIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Chip label={t(cfg.key)} size="small" color={cfg.color} variant="outlined" sx={{ height: 20, fontSize: 10, fontWeight: 700, "& .MuiChip-label": { px: 0.75 } }} />
                            <Chip
                              size="small" icon={<PersonIcon sx={{ fontSize: "13px !important" }} />}
                              label={h.userName ? `${h.userName} · #${h.userId}` : `#${h.userId}`}
                              variant="outlined" onClick={() => navigate(`/users/${h.userId}`)}
                              sx={{ height: 20, cursor: "pointer", "& .MuiChip-label": { px: 0.5, fontSize: "0.62rem", fontWeight: 700 } }}
                            />
                            {h.providerName && (
                              <Stack direction="row" spacing={0.35} alignItems="center">
                                <StorefrontIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 160 }}>{h.providerName}</Typography>
                              </Stack>
                            )}
                            {h.note && <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 220 }}>{h.note}</Typography>}
                          </Stack>
                          <Typography variant="caption" color="text.disabled">
                            {fmt(h.createdAt)}{h.performedByUserName ? ` · ${t("loyalty@by")} ${h.performedByUserName}` : ""}
                          </Typography>
                        </Box>
                        <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
                          <Typography variant="body2" fontWeight={800} color={positive ? "success.main" : "error.main"}>
                            {positive ? "+" : ""}{h.points.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">{t("loyalty@balanceAfter")}: {h.balanceAfter.toLocaleString()}</Typography>
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
                {totalPages > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" color="primary" />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Paper>
      </Stack>
    </AppScreenContainer>
  );
}
