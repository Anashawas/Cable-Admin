import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  Paper,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PersonIcon from "@mui/icons-material/Person";
import EvStationIcon from "@mui/icons-material/EvStation";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PlaylistRemoveIcon from "@mui/icons-material/PlaylistRemove";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  useBlockUser,
  useUnblockUser,
  useUnblockProvider,
  useBlockedUsers,
  useBlockedProviders,
} from "../hooks/use-loyalty";

export default function BlockUsersScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();
  const unblockProviderMutation = useUnblockProvider();

  const { data: blockedUsers, isLoading: blockedUsersLoading } = useBlockedUsers();
  const { data: blockedProviders, isLoading: blockedProvidersLoading } = useBlockedProviders();

  const [listTab, setListTab] = useState<0 | 1>(0);

  const fmtDate = (v: string | null) =>
    v ? new Date(v).toLocaleDateString(i18n.language === "ar" ? "ar-KW" : "en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

  const [blockTab, setBlockTab] = useState<0 | 1>(0);
  const [blockUserId, setBlockUserId] = useState<string>("");
  const [blockReason, setBlockReason] = useState<string>("");
  const [blockUntil, setBlockUntil] = useState<string>("");
  const [unblockUserId, setUnblockUserId] = useState<string>("");

  const handleBlockUser = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const id = parseInt(blockUserId, 10);
      if (isNaN(id) || id <= 0) { openErrorSnackbar({ message: t("loyalty@invalidUserId") }); return; }
      if (!blockReason.trim()) { openErrorSnackbar({ message: t("loyalty@blockReasonRequired") }); return; }
      blockUserMutation.mutate(
        { userId: id, reason: blockReason.trim(), blockUntil: blockUntil ? new Date(blockUntil).toISOString() : null },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("loyalty@userBlocked") });
            setBlockUserId(""); setBlockReason(""); setBlockUntil("");
          },
          onError: (err: Error) => { openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }); },
        }
      );
    },
    [blockUserId, blockReason, blockUntil, blockUserMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const handleUnblockUser = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const id = parseInt(unblockUserId, 10);
      if (isNaN(id) || id <= 0) { openErrorSnackbar({ message: t("loyalty@invalidUserId") }); return; }
      unblockUserMutation.mutate(id, {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("loyalty@userUnblocked") });
          setUnblockUserId("");
        },
        onError: (err: Error) => { openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }); },
      });
    },
    [unblockUserId, unblockUserMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const unblockUserFromList = useCallback((userId: number) => {
    unblockUserMutation.mutate(userId, {
      onSuccess: () => openSuccessSnackbar({ message: t("loyalty@userUnblocked") }),
      onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
    });
  }, [unblockUserMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const unblockProviderFromList = useCallback(
    (providerType: "ChargingPoint" | "ServiceProvider", providerId: number) => {
      unblockProviderMutation.mutate({ providerType, providerId }, {
        onSuccess: () => openSuccessSnackbar({ message: t("loyalty@providerUnblocked") }),
        onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
      });
    },
    [unblockProviderMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  return (
    <AppScreenContainer>
      <ScreenHeader
        icon={<BlockIcon />}
        title={t("loyalty@blockUnblockUser")}
        subtitle={t("loyalty@blockUnblockUserSubtitle")}
      />

      <Stack spacing={3} sx={{ mt: 3, maxWidth: 760 }}>
        <Card elevation={4} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Header */}
            <Paper
              elevation={0}
              sx={{
                px: 3, py: 2.5,
                background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    width: 46,
                    height: 46,
                  }}
                >
                  {blockTab === 0 ? <BlockIcon /> : <LockOpenIcon />}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="#fff">
                    {blockTab === 0 ? t("loyalty@blockUser") : t("loyalty@unblockUser")}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>
                    {blockTab === 0 ? t("loyalty@blockUserInfo") : t("loyalty@unblockUserInfo")}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Tabs
              value={blockTab}
              onChange={(_, v) => setBlockTab(v)}
              sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
            >
              <Tab
                label={t("loyalty@blockUser")}
                icon={<BlockIcon fontSize="small" />}
                iconPosition="start"
                sx={{ color: "error.main", "&.Mui-selected": { color: "error.main" } }}
              />
              <Tab
                label={t("loyalty@unblockUser")}
                icon={<LockOpenIcon fontSize="small" />}
                iconPosition="start"
                sx={{ color: "success.main", "&.Mui-selected": { color: "success.main" } }}
              />
            </Tabs>

            <Divider />

            <Box sx={{ p: 3 }}>
              {blockTab === 0 ? (
                <form onSubmit={handleBlockUser}>
                  <Stack spacing={3}>
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      {t("loyalty@blockUserInfo")}
                    </Alert>
                    <TextField
                      label={t("loyalty@userId")}
                      value={blockUserId}
                      onChange={(e) => setBlockUserId(e.target.value)}
                      required
                      fullWidth
                      type="number"
                      placeholder={t("loyalty@enterUserId")}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label={t("loyalty@blockReason")}
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      required
                      fullWidth
                      multiline
                      rows={3}
                      placeholder={t("loyalty@blockReasonPlaceholder")}
                    />
                    <TextField
                      label={t("loyalty@blockUntil")}
                      value={blockUntil}
                      onChange={(e) => setBlockUntil(e.target.value)}
                      fullWidth
                      type="datetime-local"
                      helperText={t("loyalty@blockUntilHelp")}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="error"
                      size="large"
                      fullWidth
                      disabled={blockUserMutation.isPending}
                      startIcon={
                        blockUserMutation.isPending
                          ? <CircularProgress size={20} color="inherit" />
                          : <BlockIcon />
                      }
                      sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                    >
                      {blockUserMutation.isPending ? t("loyalty@processing") : t("loyalty@blockUser")}
                    </Button>
                  </Stack>
                </form>
              ) : (
                <form onSubmit={handleUnblockUser}>
                  <Stack spacing={3}>
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      {t("loyalty@unblockUserInfo")}
                    </Alert>
                    <TextField
                      label={t("loyalty@userId")}
                      value={unblockUserId}
                      onChange={(e) => setUnblockUserId(e.target.value)}
                      required
                      fullWidth
                      type="number"
                      placeholder={t("loyalty@enterUserId")}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="success"
                      size="large"
                      fullWidth
                      disabled={unblockUserMutation.isPending}
                      startIcon={
                        unblockUserMutation.isPending
                          ? <CircularProgress size={20} color="inherit" />
                          : <LockOpenIcon />
                      }
                      sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                    >
                      {unblockUserMutation.isPending ? t("loyalty@processing") : t("loyalty@unblockUser")}
                    </Button>
                  </Stack>
                </form>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* ── Currently Blocked (F1/F2) ── */}
        <Card elevation={4} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Paper elevation={0} sx={{ px: 3, py: 2.5, background: "linear-gradient(135deg, #37474f 0%, #455a64 100%)", borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 46, height: 46 }}><PlaylistRemoveIcon /></Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="#fff">{t("loyalty@currentlyBlocked")}</Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("loyalty@currentlyBlockedSubtitle")}</Typography>
                </Box>
              </Stack>
            </Paper>

            <Tabs value={listTab} onChange={(_, v) => setListTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
              <Tab iconPosition="start" icon={<PersonIcon fontSize="small" />} label={`${t("loyalty@blockedUsersTab")}${blockedUsers ? ` (${blockedUsers.length})` : ""}`} />
              <Tab iconPosition="start" icon={<StorefrontIcon fontSize="small" />} label={`${t("loyalty@blockedProvidersTab")}${blockedProviders ? ` (${blockedProviders.length})` : ""}`} />
            </Tabs>

            <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
              {/* Users */}
              {listTab === 0 && (
                blockedUsersLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={30} /></Box>
                ) : !blockedUsers || blockedUsers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>{t("loyalty@noBlockedUsers")}</Typography>
                ) : (
                  <Stack spacing={1.25}>
                    {blockedUsers.map((u) => (
                      <Paper key={u.userId} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ bgcolor: "error.50", color: "error.main", width: 40, height: 40 }}><BlockIcon fontSize="small" /></Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                              <Typography
                                variant="body2" fontWeight={700}
                                sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                                onClick={() => navigate(`/users/${u.userId}`)}
                              >
                                {u.userName || `#${u.userId}`} <Typography component="span" variant="caption" color="text.disabled">#{u.userId}</Typography>
                              </Typography>
                              <Chip size="small" label={u.blockedUntil ? `${t("loyalty@blockedUntilShort")} ${fmtDate(u.blockedUntil)}` : t("loyalty@blockedPermanent")} color={u.blockedUntil ? "warning" : "error"} variant="outlined" sx={{ height: 20, "& .MuiChip-label": { px: 0.75, fontSize: "0.62rem", fontWeight: 700 } }} />
                            </Stack>
                            {u.reason && <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{u.reason}</Typography>}
                            <Typography variant="caption" color="text.disabled">
                              {fmtDate(u.blockedAt)}{u.blockedByUserName ? ` · ${t("loyalty@by")} ${u.blockedByUserName}` : ""}
                            </Typography>
                          </Box>
                          <Tooltip title={t("loyalty@unblockUser")}>
                            <span>
                              <IconButton color="success" onClick={() => unblockUserFromList(u.userId)} disabled={unblockUserMutation.isPending}>
                                <LockOpenIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )
              )}

              {/* Providers */}
              {listTab === 1 && (
                blockedProvidersLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={30} /></Box>
                ) : !blockedProviders || blockedProviders.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>{t("loyalty@noBlockedProviders")}</Typography>
                ) : (
                  <Stack spacing={1.25}>
                    {blockedProviders.map((p) => {
                      const isCP = p.providerType === "ChargingPoint";
                      return (
                        <Paper key={`${p.providerType}-${p.providerId}`} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: isCP ? "primary.50" : "secondary.50", color: isCP ? "primary.main" : "secondary.main", width: 40, height: 40 }}>
                              {isCP ? <EvStationIcon fontSize="small" /> : <StorefrontIcon fontSize="small" />}
                            </Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Typography variant="body2" fontWeight={700}>{p.providerName || `#${p.providerId}`} <Typography component="span" variant="caption" color="text.disabled">#{p.providerId}</Typography></Typography>
                                <Chip size="small" label={isCP ? t("offers@chargingPoint") : t("offers@serviceProvider")} variant="outlined" sx={{ height: 20, "& .MuiChip-label": { px: 0.75, fontSize: "0.6rem", fontWeight: 700 } }} />
                                <Chip size="small" label={p.blockedUntil ? `${t("loyalty@blockedUntilShort")} ${fmtDate(p.blockedUntil)}` : t("loyalty@blockedPermanent")} color={p.blockedUntil ? "warning" : "error"} variant="outlined" sx={{ height: 20, "& .MuiChip-label": { px: 0.75, fontSize: "0.62rem", fontWeight: 700 } }} />
                              </Stack>
                              {p.reason && <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{p.reason}</Typography>}
                              <Typography variant="caption" color="text.disabled">{fmtDate(p.blockedAt)}</Typography>
                            </Box>
                            <Tooltip title={t("loyalty@unblockProvider")}>
                              <span>
                                <IconButton color="success" onClick={() => unblockProviderFromList(p.providerType, p.providerId)} disabled={unblockProviderMutation.isPending}>
                                  <LockOpenIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                )
              )}
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </AppScreenContainer>
  );
}
