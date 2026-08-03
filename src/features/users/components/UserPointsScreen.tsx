import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Paper,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Skeleton,
  Grid,
  Divider,
  Pagination,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import EditNoteIcon from "@mui/icons-material/EditNote";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import HistoryIcon from "@mui/icons-material/History";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import BlockIcon from "@mui/icons-material/Block";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useSnackbarStore } from "../../../stores";
import { getUserById } from "../services/user-service";
import { useAdjustPoints, useUserLoyaltyAccount, useUserPointsHistory } from "../../loyalty/hooks/use-loyalty";

type AdjustmentType = "add" | "deduct";

const PAGE_SIZE = 10;

const TX_TYPE: Record<number, { key: string; color: "success" | "error" | "warning" | "info" | "secondary" }> = {
  1: { key: "loyalty@txEarn", color: "success" },
  2: { key: "loyalty@txRedeem", color: "error" },
  3: { key: "loyalty@txExpired", color: "warning" },
  4: { key: "loyalty@txAdminAdjust", color: "info" },
  5: { key: "loyalty@txSeasonBonus", color: "secondary" },
};

const TYPE_FILTERS = [undefined, 1, 2, 4, 3, 5] as (number | undefined)[];

export default function UserPointsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const validUser = Number.isFinite(userId) && userId > 0;

  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const adjustMutation = useAdjustPoints();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["users", "detail", userId],
    queryFn: () => getUserById(userId),
    enabled: validUser,
    staleTime: 30 * 1000,
  });

  const { data: account, isLoading: accountLoading } = useUserLoyaltyAccount(userId, validUser);

  // ── History (paged + type filter) ──────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<number | undefined>(undefined);
  const { data: history, isLoading: historyLoading } = useUserPointsHistory(
    userId,
    { page, pageSize: PAGE_SIZE, transactionType: typeFilter },
    validUser
  );
  const totalPages = useMemo(() => Math.max(1, Math.ceil((history?.totalCount ?? 0) / PAGE_SIZE)), [history]);

  // ── Adjust form state ──────────────────────────────────────────────────────
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("add");
  const [pointsAmount, setPointsAmount] = useState("");
  const [note, setNote] = useState("");

  const isAdd = adjustmentType === "add";
  const accentColor = isAdd ? "success" : "error";
  const previewPts = pointsAmount ? parseInt(pointsAmount, 10) : null;
  const hasValidPreview = previewPts !== null && !isNaN(previewPts) && previewPts > 0;

  const refreshLoyalty = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["loyalty", "user-account", userId] });
    queryClient.invalidateQueries({ queryKey: ["loyalty", "user-history", userId] });
  }, [queryClient, userId]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validUser) { openErrorSnackbar({ message: t("loyalty@invalidUserId") }); return; }
      const points = parseInt(pointsAmount, 10);
      if (isNaN(points) || points <= 0) { openErrorSnackbar({ message: t("loyalty@invalidPoints") }); return; }
      if (!note.trim()) { openErrorSnackbar({ message: t("loyalty@noteRequired") }); return; }
      const finalPoints = isAdd ? points : -points;
      adjustMutation.mutate(
        { userId, points: finalPoints, note: note.trim() },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t(isAdd ? "loyalty@pointsAddedSuccess" : "loyalty@pointsDeductedSuccess") });
            setPointsAmount(""); setNote("");
            refreshLoyalty();
          },
          onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
        }
      );
    },
    [validUser, userId, pointsAmount, note, isAdd, adjustMutation, openSuccessSnackbar, openErrorSnackbar, refreshLoyalty, t]
  );

  const initials = (user?.name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const summaryCards = [
    { label: t("loyalty@currentBalance"), value: account?.currentBalance, color: "primary" as const },
    { label: t("loyalty@totalPointsEarned"), value: account?.totalPointsEarned, color: "success" as const },
    { label: t("loyalty@totalPointsRedeemed"), value: account?.totalPointsRedeemed, color: "warning" as const },
  ];

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2.5} sx={{ maxWidth: 960, mx: "auto" }}>

          {/* ── Gradient header with user identity + balance ── */}
          <Box sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, borderRadius: 3, p: { xs: 2.5, md: 3 }, color: "white", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)" }} />
            <Stack direction="row" spacing={2} alignItems="center">
              <Tooltip title={t("back")}>
                <IconButton onClick={() => navigate(-1)} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56, fontWeight: 700, fontSize: 20 }}>{userLoading ? "" : initials}</Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                {userLoading ? (
                  <Skeleton variant="text" width={180} sx={{ bgcolor: "rgba(255,255,255,0.3)" }} />
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="h5" fontWeight={800} noWrap>{user?.name ?? "—"}</Typography>
                    <Chip label={`#${userId}`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700 }} />
                    {account?.currentTierName && (
                      <Chip icon={<WorkspacePremiumIcon sx={{ color: "#fff !important", fontSize: "15px !important" }} />} label={account.currentTierName} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600 }} />
                    )}
                    {account?.isBlocked && (
                      <Chip icon={<BlockIcon sx={{ color: "#fff !important", fontSize: "15px !important" }} />} label={t("loyalty@blocked")} size="small" color="error" />
                    )}
                  </Stack>
                )}
                <Stack direction="row" spacing={2} sx={{ mt: 0.5, opacity: 0.85 }} flexWrap="wrap">
                  {user?.email && <Stack direction="row" spacing={0.5} alignItems="center"><EmailIcon sx={{ fontSize: 15 }} /><Typography variant="caption">{user.email}</Typography></Stack>}
                  {user?.phone && <Stack direction="row" spacing={0.5} alignItems="center"><PhoneIcon sx={{ fontSize: 15 }} /><Typography variant="caption">{user.phone}</Typography></Stack>}
                </Stack>
              </Box>
              <Box sx={{ textAlign: "center", bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, px: 2.5, py: 1.25, flexShrink: 0 }}>
                <Typography variant="h4" fontWeight={800} lineHeight={1}>{accountLoading ? "…" : (account?.currentBalance ?? 0).toLocaleString()}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>{t("loyalty@currentBalance")}</Typography>
              </Box>
            </Stack>
          </Box>

          {/* ── Account summary cards ── */}
          <Grid container spacing={2}>
            {summaryCards.map(({ label, value, color }) => (
              <Grid size={{ xs: 12, sm: 4 }} key={label}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: `${color}.50`, border: 1, borderColor: `${color}.100` }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                  <Typography variant="h5" fontWeight={800} color={`${color}.dark`}>
                    {accountLoading ? <Skeleton width={60} /> : (value ?? 0).toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2.5}>
            {/* ── Adjust points form ── */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper elevation={2} sx={{ borderRadius: 3, overflow: "hidden", height: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2.5, py: 1.75, bgcolor: isAdd ? "success.main" : "error.main", transition: "background-color 0.25s" }}>
                  {isAdd ? <AddCircleIcon sx={{ color: "#fff" }} /> : <RemoveCircleIcon sx={{ color: "#fff" }} />}
                  <Typography variant="subtitle1" fontWeight={700} color="#fff" flex={1}>{t("loyalty@adjustUserPoints")}</Typography>
                  {hasValidPreview && <Chip label={`${isAdd ? "+" : "−"}${previewPts} ${t("loyalty@pts")}`} sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 700 }} />}
                </Stack>
                <Box sx={{ p: 2.5 }}>
                  <form onSubmit={handleSubmit}>
                    <Stack spacing={2.5}>
                      <ToggleButtonGroup value={adjustmentType} exclusive onChange={(_, v) => { if (v) setAdjustmentType(v); }} fullWidth>
                        <ToggleButton value="add" sx={{ py: 1.1, fontWeight: 600, gap: 1, color: "success.main", borderColor: "success.main", "&.Mui-selected": { bgcolor: "success.main", color: "#fff", "&:hover": { bgcolor: "success.dark" } } }}>
                          <AddCircleIcon fontSize="small" />{t("loyalty@addPoints")}
                        </ToggleButton>
                        <ToggleButton value="deduct" sx={{ py: 1.1, fontWeight: 600, gap: 1, color: "error.main", borderColor: "error.main", "&.Mui-selected": { bgcolor: "error.main", color: "#fff", "&:hover": { bgcolor: "error.dark" } } }}>
                          <RemoveCircleIcon fontSize="small" />{t("loyalty@deductPoints")}
                        </ToggleButton>
                      </ToggleButtonGroup>
                      <TextField
                        label={t("loyalty@pointsAmount")} value={pointsAmount} onChange={(e) => setPointsAmount(e.target.value)}
                        required fullWidth type="number" placeholder="100" color={accentColor}
                        InputProps={{ endAdornment: <InputAdornment position="end">{t("loyalty@pts")}</InputAdornment> }}
                      />
                      <TextField
                        label={t("loyalty@note")} value={note} onChange={(e) => setNote(e.target.value)}
                        required fullWidth multiline rows={3} placeholder={t("loyalty@notePlaceholder")}
                        InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}><EditNoteIcon fontSize="small" color="action" /></InputAdornment> }}
                      />
                      <Button type="submit" variant="contained" size="large" fullWidth disabled={adjustMutation.isPending || userLoading} color={accentColor}
                        startIcon={adjustMutation.isPending ? <CircularProgress size={20} color="inherit" /> : isAdd ? <AddCircleIcon /> : <RemoveCircleIcon />}
                        sx={{ py: 1.4, borderRadius: 2, fontWeight: 700 }}>
                        {adjustMutation.isPending ? t("loyalty@processing") : isAdd ? t("loyalty@addPoints") : t("loyalty@deductPoints")}
                      </Button>
                    </Stack>
                  </form>
                </Box>
              </Paper>
            </Grid>

            {/* ── Points history ── */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper elevation={2} sx={{ borderRadius: 3, overflow: "hidden", height: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2.5, py: 1.75, bgcolor: "primary.main" }}>
                  <HistoryIcon sx={{ color: "#fff" }} />
                  <Typography variant="subtitle1" fontWeight={700} color="#fff" flex={1}>{t("loyalty@pointsHistory")}</Typography>
                  {history && <Chip label={history.totalCount} size="small" sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 700 }} />}
                </Stack>
                <Box sx={{ p: 2 }}>
                  {/* Type filter */}
                  <Stack direction="row" spacing={0.75} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
                    {TYPE_FILTERS.map((tf) => (
                      <Chip
                        key={tf ?? "all"} size="small"
                        label={tf === undefined ? t("all") : t(TX_TYPE[tf].key)}
                        onClick={() => { setTypeFilter(tf); setPage(1); }}
                        color={typeFilter === tf ? "primary" : "default"}
                        variant={typeFilter === tf ? "filled" : "outlined"}
                        sx={{ fontWeight: 600, cursor: "pointer" }}
                      />
                    ))}
                  </Stack>

                  {historyLoading ? (
                    <Stack spacing={1}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={54} />)}</Stack>
                  ) : !history || history.items.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>{t("loyalty@noPointsHistory")}</Typography>
                  ) : (
                    <>
                      <Stack spacing={1} divider={<Divider flexItem />}>
                        {history.items.map((h) => {
                          const cfg = TX_TYPE[h.transactionType] ?? TX_TYPE[4];
                          const positive = h.points >= 0;
                          return (
                            <Stack key={h.id} direction="row" spacing={1.5} alignItems="center">
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                                  <Chip label={t(cfg.key)} size="small" color={cfg.color} variant="outlined" sx={{ height: 20, fontSize: 10, fontWeight: 600 }} />
                                  {h.note && <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 220 }}>{h.note}</Typography>}
                                </Stack>
                                <Typography variant="caption" color="text.disabled">
                                  {new Date(h.createdAt).toLocaleString()}
                                  {h.performedByUserName ? ` · ${t("loyalty@by")} ${h.performedByUserName}` : ""}
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
            </Grid>
          </Grid>

          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/users")} sx={{ alignSelf: "flex-start", textTransform: "none" }}>
            {t("userManagement@backToUsers")}
          </Button>
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
