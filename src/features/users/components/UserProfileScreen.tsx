import { useState, useCallback, useMemo, type ReactNode } from "react";
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
  MenuItem,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Skeleton,
  Grid,
  Divider,
  Pagination,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PersonIcon from "@mui/icons-material/Person";
import BadgeIcon from "@mui/icons-material/Badge";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import PublicIcon from "@mui/icons-material/Public";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LoyaltyIcon from "@mui/icons-material/Loyalty";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import StorefrontIcon from "@mui/icons-material/Storefront";
import EditIcon from "@mui/icons-material/Edit";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useSnackbarStore } from "../../../stores";
import { getUserById } from "../services/user-service";
import {
  useAdjustPoints,
  useAdjustmentReasons,
  useUserLoyaltyAccount,
  useUserPointsHistory,
  useBlockUser,
  useUnblockUser,
} from "../../loyalty/hooks/use-loyalty";

type AdjustmentType = "add" | "deduct";

const PAGE_SIZE = 10;

/** Prettify an UPPER_SNAKE reason code as a fallback label. */
const prettifyReason = (code: string) =>
  code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const TX_TYPE: Record<number, { key: string; color: "success" | "error" | "warning" | "info" | "secondary" }> = {
  1: { key: "loyalty@txEarn", color: "success" },
  2: { key: "loyalty@txRedeem", color: "error" },
  3: { key: "loyalty@txExpired", color: "warning" },
  4: { key: "loyalty@txAdminAdjust", color: "info" },
  5: { key: "loyalty@txSeasonBonus", color: "secondary" },
};

const TYPE_FILTERS = [undefined, 1, 2, 4, 3, 5] as (number | undefined)[];

function Section({ icon, title, action, children }: { icon: ReactNode; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: "1px solid", borderColor: "divider", height: "100%" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, pb: 1, borderBottom: "2px solid", borderColor: "primary.100" }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "primary.main", color: "primary.contrastText", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 8px rgba(25,118,210,0.3)" }}>
            {icon}
          </Box>
          <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
        </Stack>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

function InfoItem({ icon, label, value }: { icon?: ReactNode; label: string; value?: ReactNode }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ py: 0.85 }}>
      {icon && <Box sx={{ color: "text.disabled", display: "flex", mt: 0.2 }}>{icon}</Box>}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
        <Box sx={{ fontSize: "0.9rem", fontWeight: 600 }}>{value ?? "—"}</Box>
      </Box>
    </Stack>
  );
}

export default function UserProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const validUser = Number.isFinite(userId) && userId > 0;

  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [tab, setTab] = useState(0);

  const adjustMutation = useAdjustPoints();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();

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
  const [reasonCode, setReasonCode] = useState("");
  const { data: adjustmentReasons } = useAdjustmentReasons();

  const isAdd = adjustmentType === "add";
  const accentColor = isAdd ? "success" : "error";
  const previewPts = pointsAmount ? parseInt(pointsAmount, 10) : null;
  const hasValidPreview = previewPts !== null && !isNaN(previewPts) && previewPts > 0;

  // ── Block dialog state ──────────────────────────────────────────────────────
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");

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
        { userId, points: finalPoints, note: note.trim(), reasonCode: reasonCode || undefined },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t(isAdd ? "loyalty@pointsAddedSuccess" : "loyalty@pointsDeductedSuccess") });
            setPointsAmount(""); setNote(""); setReasonCode("");
            refreshLoyalty();
          },
          onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
        }
      );
    },
    [validUser, userId, pointsAmount, note, reasonCode, isAdd, adjustMutation, openSuccessSnackbar, openErrorSnackbar, refreshLoyalty, t]
  );

  const handleBlock = useCallback(() => {
    if (!blockReason.trim()) { openErrorSnackbar({ message: t("loyalty@blockReason") }); return; }
    blockMutation.mutate(
      { userId, reason: blockReason.trim() },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("loyalty@userBlocked") });
          setBlockOpen(false); setBlockReason("");
          refreshLoyalty();
        },
        onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
      }
    );
  }, [blockReason, blockMutation, userId, openSuccessSnackbar, openErrorSnackbar, refreshLoyalty, t]);

  const handleUnblock = useCallback(() => {
    unblockMutation.mutate(userId, {
      onSuccess: () => { openSuccessSnackbar({ message: t("loyalty@userUnblocked") }); refreshLoyalty(); },
      onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
    });
  }, [unblockMutation, userId, openSuccessSnackbar, openErrorSnackbar, refreshLoyalty, t]);

  const initials = (user?.name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const isActive = user?.isActive !== false;

  const cars = user?.userCars ?? [];

  const summaryCards = [
    { label: t("loyalty@currentBalance"), value: account?.currentBalance, color: "primary" as const },
    { label: t("loyalty@totalPointsEarned"), value: account?.totalPointsEarned, color: "success" as const },
    { label: t("loyalty@totalPointsRedeemed"), value: account?.totalPointsRedeemed, color: "warning" as const },
    { label: t("userManagement@profile.seasonPoints"), value: account?.seasonPointsEarned, color: "info" as const },
  ];

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2.5} sx={{ maxWidth: 1080, mx: "auto" }}>

          {/* ── Gradient identity hero ── */}
          <Box sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, borderRadius: 3, p: { xs: 2.5, md: 3 }, color: "white", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)" }} />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ position: "relative" }}>
              <Tooltip title={t("back")}>
                <IconButton onClick={() => navigate("/users")} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 60, height: 60, fontWeight: 700, fontSize: 22 }}>{userLoading ? "" : initials}</Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                {userLoading ? (
                  <Skeleton variant="text" width={200} sx={{ bgcolor: "rgba(255,255,255,0.3)" }} />
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="h5" fontWeight={800} noWrap>{user?.name ?? "—"}</Typography>
                    <Chip label={`#${userId}`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700 }} />
                    {user?.role?.name && (
                      <Chip label={user.role.name} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600 }} />
                    )}
                    {account?.currentTierName && (
                      <Chip icon={<WorkspacePremiumIcon sx={{ color: "#fff !important", fontSize: "15px !important" }} />} label={account.currentTierName} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600 }} />
                    )}
                    <Chip label={isActive ? t("userManagement@profile.active") : t("userManagement@profile.inactive")} size="small" color={isActive ? "success" : "error"} sx={{ fontWeight: 700 }} />
                    {account?.isBlocked && (
                      <Chip icon={<BlockIcon sx={{ color: "#fff !important", fontSize: "15px !important" }} />} label={t("loyalty@blocked")} size="small" color="error" />
                    )}
                  </Stack>
                )}
                <Stack direction="row" spacing={2} sx={{ mt: 0.5, opacity: 0.85 }} flexWrap="wrap" useFlexGap>
                  {user?.email && <Stack direction="row" spacing={0.5} alignItems="center"><EmailIcon sx={{ fontSize: 15 }} /><Typography variant="caption">{user.email}</Typography></Stack>}
                  {user?.phone && <Stack direction="row" spacing={0.5} alignItems="center"><PhoneIcon sx={{ fontSize: 15 }} /><Typography variant="caption">{user.phone}</Typography></Stack>}
                  {user?.city && <Stack direction="row" spacing={0.5} alignItems="center"><LocationCityIcon sx={{ fontSize: 15 }} /><Typography variant="caption">{user.city}</Typography></Stack>}
                </Stack>
              </Box>
              <Stack spacing={1} alignItems="flex-end" sx={{ flexShrink: 0 }}>
                <Box sx={{ textAlign: "center", bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, px: 2.5, py: 1.25 }}>
                  <Typography variant="h4" fontWeight={800} lineHeight={1}>{accountLoading ? "…" : (account?.currentBalance ?? 0).toLocaleString()}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>{t("loyalty@currentBalance")}</Typography>
                </Box>
                <Button size="small" startIcon={<EditIcon sx={{ fontSize: 16 }} />} onClick={() => navigate(`/users/${userId}/edit`)} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" }, textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                  {t("userManagement@actions.edit")}
                </Button>
              </Stack>
            </Stack>
          </Box>

          {/* ── KPI summary ── */}
          <Grid container spacing={2}>
            {summaryCards.map(({ label, value, color }) => (
              <Grid size={{ xs: 6, sm: 3 }} key={label}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: `${color}.50`, border: 1, borderColor: `${color}.100` }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                  <Typography variant="h5" fontWeight={800} color={`${color}.dark`}>
                    {accountLoading ? <Skeleton width={60} /> : (value ?? 0).toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* ── Tabs ── */}
          <Paper elevation={1} sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              TabIndicatorProps={{ sx: { display: "none" } }}
              sx={{
                borderBottom: 1, borderColor: "divider", px: 1.5, py: 1.25, bgcolor: "action.hover", minHeight: 0,
                "& .MuiTabs-flexContainer": { gap: 1 },
              }}
            >
              {[
                { icon: <PersonIcon fontSize="small" />, label: t("userManagement@profile.overview") },
                { icon: <ReceiptLongIcon fontSize="small" />, label: t("userManagement@profile.transactions") },
              ].map((tb, i) => (
                <Tab
                  key={i}
                  icon={tb.icon}
                  iconPosition="start"
                  label={tb.label}
                  disableRipple
                  sx={{
                    minHeight: 44, px: 2, borderRadius: 2.5, fontWeight: 700, textTransform: "none",
                    color: "text.secondary", transition: "all .2s ease",
                    "&:hover": { bgcolor: "action.selected", color: "text.primary" },
                    "&.Mui-selected": { color: "primary.contrastText", bgcolor: "primary.main", boxShadow: "0 4px 12px rgba(25,118,210,0.35)" },
                  }}
                />
              ))}
            </Tabs>

            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {/* ── Overview ── */}
              {tab === 0 && (
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Section icon={<BadgeIcon fontSize="small" />} title={t("userManagement@profile.info")}>
                      <InfoItem icon={<EmailIcon sx={{ fontSize: 16 }} />} label={t("userManagement@profile.email")} value={user?.email} />
                      <InfoItem icon={<PhoneIcon sx={{ fontSize: 16 }} />} label={t("userManagement@profile.phone")} value={user?.phone || t("userManagement@profile.notProvided")} />
                      <InfoItem icon={<LocationCityIcon sx={{ fontSize: 16 }} />} label={t("userManagement@profile.city")} value={user?.city || t("userManagement@profile.notProvided")} />
                      <InfoItem icon={<PublicIcon sx={{ fontSize: 16 }} />} label={t("userManagement@profile.country")} value={user?.country || t("userManagement@profile.notProvided")} />
                      <InfoItem icon={<BadgeIcon sx={{ fontSize: 16 }} />} label={t("userManagement@profile.role")} value={user?.role?.name} />
                      <InfoItem
                        icon={<VerifiedUserIcon sx={{ fontSize: 16 }} />}
                        label={t("userManagement@profile.status")}
                        value={<Chip size="small" label={isActive ? t("userManagement@profile.active") : t("userManagement@profile.inactive")} color={isActive ? "success" : "error"} variant="outlined" sx={{ fontWeight: 700, height: 22 }} />}
                      />
                    </Section>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Section
                      icon={<LoyaltyIcon fontSize="small" />}
                      title={t("userManagement@profile.loyalty")}
                      action={
                        account?.isBlocked ? (
                          <Button size="small" color="success" variant="outlined" startIcon={<LockOpenIcon sx={{ fontSize: 16 }} />} onClick={handleUnblock} disabled={unblockMutation.isPending} sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}>
                            {t("loyalty@unblockUser")}
                          </Button>
                        ) : (
                          <Button size="small" color="error" variant="outlined" startIcon={<BlockIcon sx={{ fontSize: 16 }} />} onClick={() => setBlockOpen(true)} sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}>
                            {t("loyalty@blockUser")}
                          </Button>
                        )
                      }
                    >
                      <InfoItem icon={<WorkspacePremiumIcon sx={{ fontSize: 16 }} />} label={t("userManagement@profile.tier")} value={account?.currentTierName || "—"} />
                      <InfoItem label={t("userManagement@profile.multiplier")} value={account?.currentMultiplier != null ? `×${account.currentMultiplier}` : "—"} />
                      <InfoItem label={t("userManagement@profile.season")} value={account?.seasonName || "—"} />
                      <InfoItem label={t("userManagement@profile.seasonPoints")} value={(account?.seasonPointsEarned ?? 0).toLocaleString()} />
                      {account?.isBlocked && (
                        <>
                          <InfoItem
                            icon={<BlockIcon sx={{ fontSize: 16, color: "error.main" }} />}
                            label={t("loyalty@blockReason")}
                            value={<Typography variant="body2" color="error.main" fontWeight={600}>{account.blockReason || "—"}</Typography>}
                          />
                          <InfoItem
                            label={t("userManagement@profile.blockedUntil")}
                            value={account.blockedUntil ? new Date(account.blockedUntil).toLocaleDateString() : t("userManagement@profile.permanent")}
                          />
                        </>
                      )}
                    </Section>
                  </Grid>

                  {/* Cars */}
                  <Grid size={{ xs: 12 }}>
                    <Section icon={<DirectionsCarIcon fontSize="small" />} title={t("userManagement@profile.cars")}>
                      {cars.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>{t("userManagement@profile.noCars")}</Typography>
                      ) : (
                        <Stack direction="row" flexWrap="wrap" gap={1.25}>
                          {cars.flatMap((car, ci) =>
                            (car.carModels ?? []).map((m, mi) => (
                              <Paper key={`${ci}-${mi}`} elevation={0} sx={{ px: 1.75, py: 1.25, borderRadius: 2, border: "1px solid", borderColor: "divider", minWidth: 160 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <DirectionsCarIcon sx={{ fontSize: 20, color: "primary.main" }} />
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={700} noWrap>{car.carTypeName} {m.carModelName}</Typography>
                                    {m.plugTypes?.name && <Typography variant="caption" color="text.secondary" noWrap>{m.plugTypes.name}{m.plugTypes.serialNumber ? ` · ${m.plugTypes.serialNumber}` : ""}</Typography>}
                                  </Box>
                                </Stack>
                              </Paper>
                            ))
                          )}
                        </Stack>
                      )}
                    </Section>
                  </Grid>
                </Grid>
              )}

              {/* ── Points & Transactions ── */}
              {tab === 1 && (
                <Grid container spacing={2.5}>
                  {/* Adjust points form */}
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider", height: "100%" }}>
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
                            {adjustmentReasons && adjustmentReasons.length > 0 && (
                              <TextField
                                select fullWidth
                                label={t("loyalty@adjustReason")}
                                value={reasonCode}
                                onChange={(e) => setReasonCode(e.target.value)}
                              >
                                <MenuItem value=""><em>{t("loyalty@adjustReasonNone")}</em></MenuItem>
                                {adjustmentReasons.map((code) => (
                                  <MenuItem key={code} value={code}>{t(`loyalty@reason.${code}`, prettifyReason(code))}</MenuItem>
                                ))}
                              </TextField>
                            )}
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

                  {/* History / transactions */}
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider", height: "100%" }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2.5, py: 1.75, bgcolor: "primary.main" }}>
                        <HistoryIcon sx={{ color: "#fff" }} />
                        <Typography variant="subtitle1" fontWeight={700} color="#fff" flex={1}>{t("loyalty@pointsHistory")}</Typography>
                        {history && <Chip label={history.totalCount} size="small" sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 700 }} />}
                      </Stack>
                      <Box sx={{ p: 2 }}>
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
                                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                                        <Chip label={t(cfg.key)} size="small" color={cfg.color} variant="outlined" sx={{ height: 20, fontSize: 10, fontWeight: 600 }} />
                                        {h.providerName && (
                                          <Stack direction="row" spacing={0.35} alignItems="center">
                                            <StorefrontIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>{h.providerName}</Typography>
                                          </Stack>
                                        )}
                                        {h.note && <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>{h.note}</Typography>}
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
              )}
            </Box>
          </Paper>
        </Stack>
      </Box>

      {/* ── Block user dialog ── */}
      <Dialog open={blockOpen} onClose={() => setBlockOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("loyalty@blockUser")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth multiline rows={3} sx={{ mt: 1 }}
            label={t("loyalty@blockReason")} value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBlockOpen(false)}>{t("cancel")}</Button>
          <Button variant="contained" color="error" onClick={handleBlock} disabled={blockMutation.isPending} startIcon={blockMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <BlockIcon />}>
            {t("loyalty@blockUser")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
