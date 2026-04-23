import { useState, useCallback, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  CircularProgress,
  FormControlLabel,
  Switch,
  Paper,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  InputAdornment,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import HistoryIcon from "@mui/icons-material/History";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import SendIcon from "@mui/icons-material/Send";
import GroupIcon from "@mui/icons-material/Group";
import FilterListIcon from "@mui/icons-material/FilterList";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import EvStationIcon from "@mui/icons-material/EvStation";
import PersonIcon from "@mui/icons-material/Person";
import CloseIcon from "@mui/icons-material/Close";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import NotificationHistoryTab from "./NotificationHistoryTab";
import {
  getNotificationTypes,
  sendNotification,
  sendNotificationByFilter,
} from "../services/notification-service";
import type {
  SendNotificationRequest,
  SendByFilterRequest,
  AppType,
} from "../types/api";
import { parseUserIds } from "../validators/send-notification-schema";
import { useSnackbarStore } from "../../../stores";
import { getAllCarModels } from "../../users/services/user-car-service";
import type { CarTypeWithModelsDto } from "../../users/types/api";
import { CITIES } from "../../charge-management/constants/options";

type SendMode = "broadcast" | "filter";

export default function SendNotificationScreen() {
  const { t } = useTranslation("notifications");
  const location = useLocation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  // Accept pre-filled user ID via navigation state (from User detail screen)
  const prefilledUserId = (location.state as { userId?: number } | null)?.userId;

  // ── Top-level tabs ──
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");

  // ── Shared state ──
  const [mode, setMode] = useState<SendMode>("broadcast");
  const [notificationTypeId, setNotificationTypeId] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [data, setData] = useState("");
  const [offerDate, setOfferDate] = useState(""); // YYYY-MM-DD
  const [offerTime, setOfferTime] = useState(""); // HH:MM:SS
  const [scheduleForLater, setScheduleForLater] = useState(false);

  // ── Broadcast mode ──
  const [isForAll, setIsForAll] = useState(false);
  const [userIdsString, setUserIdsString] = useState(prefilledUserId ? String(prefilledUserId) : "");

  // Pre-fill user ID from navigation state on mount
  useEffect(() => {
    if (prefilledUserId) {
      setActiveTab("compose");
      setMode("broadcast");
      setIsForAll(false);
      setUserIdsString(String(prefilledUserId));
    }
  }, [prefilledUserId]);

  // ── Filter mode ──
  const [carTypeId, setCarTypeId] = useState<number | null>(null);
  const [carModelId, setCarModelId] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [appType, setAppType] = useState<AppType>("UserApp");

  // ── Queries ──
  const { data: notificationTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ["notifications", "types"],
    queryFn: ({ signal }) => getNotificationTypes(signal),
  });

  const { data: carTypes = [] } = useQuery<CarTypeWithModelsDto[]>({
    queryKey: ["car-models-all"],
    queryFn: ({ signal }) => getAllCarModels(signal),
    staleTime: 5 * 60 * 1000,
  });

  const selectedCarType = useMemo(
    () => carTypes.find((ct) => ct.id === carTypeId) ?? null,
    [carTypes, carTypeId]
  );

  // Detect offer type by name (same logic as KMP app)
  const selectedType = useMemo(
    () => notificationTypes.find((nt) => nt.id === notificationTypeId) ?? null,
    [notificationTypes, notificationTypeId]
  );
  const isOfferType = (selectedType?.name ?? "").toLowerCase().includes("offer");

  // ── Mutations ──
  const broadcastMutation = useMutation({
    mutationFn: (payload: SendNotificationRequest) => sendNotification(payload),
    onSuccess: () => {
      openSuccessSnackbar({ message: t("send.success") });
      resetForm();
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const filterMutation = useMutation({
    mutationFn: (payload: SendByFilterRequest) => sendNotificationByFilter(payload),
    onSuccess: () => {
      openSuccessSnackbar({ message: t("send.success") });
      resetForm();
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const isSending = broadcastMutation.isPending || filterMutation.isPending;

  const resetForm = useCallback(() => {
    setNotificationTypeId(0);
    setTitle("");
    setBody("");
    setDeepLink("");
    setData("");
    setOfferDate("");
    setOfferTime("");
    setScheduleForLater(false);
    setUserIdsString("");
    setCarTypeId(null);
    setCarModelId(null);
    setCity(null);
  }, []);

  // ── Submit ──
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!notificationTypeId) {
        openErrorSnackbar({ message: t("send.typeRequired") });
        return;
      }
      if (!title.trim()) {
        openErrorSnackbar({ message: t("send.titleRequired") });
        return;
      }
      if (!body.trim()) {
        openErrorSnackbar({ message: t("send.bodyRequired") });
        return;
      }

      // Offer type validation — only when scheduling for later
      if (isOfferType && scheduleForLater) {
        if (!offerDate.trim() || !offerTime.trim()) {
          openErrorSnackbar({ message: t("send.offerDateRequired") });
          return;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(offerDate.trim())) {
          openErrorSnackbar({ message: t("send.offerDateFormat") });
          return;
        }
        if (!/^\d{2}:\d{2}:\d{2}$/.test(offerTime.trim())) {
          openErrorSnackbar({ message: t("send.offerTimeFormat") });
          return;
        }
      }

      // Format time as "YYYY-MM-DD HH:MM:SS" only when scheduling for later
      const formattedTime = scheduleForLater && offerDate.trim() && offerTime.trim()
        ? `${offerDate.trim()} ${offerTime.trim()}`
        : null;

      if (mode === "broadcast") {
        if (!isForAll) {
          const ids = parseUserIds(userIdsString);
          if (ids.length === 0) {
            openErrorSnackbar({ message: t("send.userIdsRequired") });
            return;
          }
        }
        broadcastMutation.mutate({
          notificationTypeId,
          title: title.trim(),
          body: body.trim(),
          isForAll,
          userIds: isForAll ? null : parseUserIds(userIdsString),
          deepLink: deepLink.trim() || null,
          data: data.trim() || null,
          time: formattedTime,
        });
      } else {
        if (!carTypeId && !carModelId && !city) {
          openErrorSnackbar({ message: t("send.filterRequired") });
          return;
        }
        filterMutation.mutate({
          notificationTypeId,
          title: title.trim(),
          body: body.trim(),
          carTypeId,
          carModelId,
          city,
          appType,
          deepLink: deepLink.trim() || null,
          data: data.trim() || null,
        });
      }
    },
    [mode, notificationTypeId, title, body, isForAll, userIdsString, carTypeId, carModelId, city, appType, deepLink, data, offerDate, offerTime, isOfferType, scheduleForLater, broadcastMutation, filterMutation, openErrorSnackbar, t]
  );

  const hasFilters = carTypeId != null || carModelId != null || city != null;

  return (
    <AppScreenContainer>
      {/* ── Header ── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #4a148c 0%, #6a1b9a 55%, #7b1fa2 100%)",
          borderRadius: 3,
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          position: "relative",
          overflow: "hidden",
          color: "white",
        }}
      >
        <Box sx={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <NotificationsActiveIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>{t("send.title")}</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.25 }}>{t("send.subtitle")}</Typography>
            </Box>
          </Stack>

          {/* Mode toggle — only visible on Compose tab */}
          {activeTab === "compose" && (
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_e, v) => v && setMode(v)}
              sx={{
                bgcolor: "rgba(255,255,255,0.12)",
                borderRadius: 2.5,
                "& .MuiToggleButton-root": {
                  color: "rgba(255,255,255,0.7)",
                  border: "none",
                  px: 2.5,
                  py: 1,
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: "10px !important",
                  "&.Mui-selected": {
                    bgcolor: "rgba(255,255,255,0.25)",
                    color: "white",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                  },
                },
              }}
            >
              <ToggleButton value="broadcast">
                <GroupIcon sx={{ fontSize: 18, mr: 1 }} />
                {t("send.modeBroadcast")}
              </ToggleButton>
              <ToggleButton value="filter">
                <FilterListIcon sx={{ fontSize: 18, mr: 1 }} />
                {t("send.modeFilter")}
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Stack>
      </Box>

      {/* ── Top-level Tabs ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_e, v) => setActiveTab(v)}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              minHeight: 56,
              px: 3,
            },
            "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
          }}
        >
          <Tab
            value="compose"
            icon={<EditNoteIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={t("tabs.compose")}
          />
          <Tab
            value="history"
            icon={<HistoryIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={t("tabs.history")}
          />
        </Tabs>
      </Paper>

      {activeTab === "history" ? (
        <NotificationHistoryTab />
      ) : (
      <form onSubmit={handleSubmit}>
        <Stack spacing={3} sx={{ maxWidth: 800, mx: "auto" }}>

          {/* ── Notification Type ── */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "secondary.50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <NotificationsActiveIcon sx={{ fontSize: 18, color: "secondary.main" }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="secondary.main">{t("send.type")}</Typography>
            </Stack>
            <TextField
              select
              fullWidth
              value={notificationTypeId || ""}
              onChange={(e) => setNotificationTypeId(e.target.value ? Number(e.target.value) : 0)}
              disabled={loadingTypes}
              label={t("send.selectType")}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            >
              <MenuItem value="">
                <em>{t("send.selectType")}</em>
              </MenuItem>
              {notificationTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={600}>{type.name}</Typography>
                    {type.description && (
                      <Typography variant="caption" color="text.secondary">— {type.description}</Typography>
                    )}
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
          </Paper>

          {/* ── Message Content ── */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "primary.50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SendIcon sx={{ fontSize: 18, color: "primary.main" }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="primary.main">{t("send.messageContent")}</Typography>
            </Stack>
            <Stack spacing={2.5}>
              <TextField
                label={t("send.titleLabel")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                fullWidth
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
              />
              <TextField
                label={t("send.body")}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                fullWidth
                multiline
                rows={4}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
              />
            </Stack>
          </Paper>

          {/* ── Offer Scheduling (conditional) ── */}
          {isOfferType && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "secondary.200", bgcolor: "secondary.50" }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "secondary.100", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <NotificationsActiveIcon sx={{ fontSize: 18, color: "secondary.main" }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={800} color="secondary.main">{t("send.offerSchedule")}</Typography>
              </Stack>

              {/* Toggle: Send Now vs Schedule for Later */}
              <ToggleButtonGroup
                value={scheduleForLater ? "schedule" : "now"}
                exclusive
                onChange={(_e, v) => { if (v) setScheduleForLater(v === "schedule"); }}
                fullWidth
                sx={{
                  mb: scheduleForLater ? 2.5 : 0,
                  bgcolor: "white",
                  borderRadius: 2,
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    fontWeight: 700,
                    py: 1.25,
                    borderRadius: "10px !important",
                    "&.Mui-selected": {
                      bgcolor: "secondary.main",
                      color: "white",
                      "&:hover": { bgcolor: "secondary.dark" },
                    },
                  },
                }}
              >
                <ToggleButton value="now">
                  <SendIcon sx={{ fontSize: 18, mr: 1 }} />
                  {t("send.sendNow")}
                </ToggleButton>
                <ToggleButton value="schedule">
                  <NotificationsActiveIcon sx={{ fontSize: 18, mr: 1 }} />
                  {t("send.scheduleForLater")}
                </ToggleButton>
              </ToggleButtonGroup>

              {scheduleForLater && (
                <>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label={t("send.offerDate")}
                        value={offerDate}
                        onChange={(e) => {
                          const filtered = e.target.value.replace(/[^\d-]/g, "");
                          setOfferDate(filtered);
                        }}
                        fullWidth
                        required
                        placeholder="YYYY-MM-DD"
                        helperText={t("send.offerDateHint")}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><NotificationsActiveIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>,
                        }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "white" } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label={t("send.offerTime")}
                        value={offerTime}
                        onChange={(e) => {
                          const filtered = e.target.value.replace(/[^\d:]/g, "");
                          setOfferTime(filtered);
                        }}
                        fullWidth
                        required
                        placeholder="HH:MM:SS"
                        helperText={t("send.offerTimeHint")}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><NotificationsActiveIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>,
                        }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "white" } }}
                      />
                    </Grid>
                  </Grid>
                  <Alert severity="info" sx={{ mt: 2, borderRadius: 2, "& .MuiAlert-message": { fontSize: "0.82rem" } }}>
                    {t("send.offerScheduleHint")}
                  </Alert>
                </>
              )}
            </Paper>
          )}

          {/* ── Recipients — Broadcast Mode ── */}
          {mode === "broadcast" && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "success.50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <GroupIcon sx={{ fontSize: 18, color: "success.main" }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={800} color="success.main">{t("send.recipients")}</Typography>
              </Stack>
              <Stack spacing={2}>
                <FormControlLabel
                  control={<Switch checked={isForAll} onChange={(e) => setIsForAll(e.target.checked)} color="success" />}
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={600}>{t("send.sendToAll")}</Typography>
                      <Chip label={t("send.allUsers")} size="small" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
                    </Stack>
                  }
                />
                {!isForAll && (
                  <TextField
                    label={t("send.userIds")}
                    value={userIdsString}
                    onChange={(e) => setUserIdsString(e.target.value)}
                    fullWidth
                    placeholder="1, 2, 3, 100"
                    helperText={t("send.userIdsHint")}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>,
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  />
                )}
              </Stack>
            </Paper>
          )}

          {/* ── Recipients — Filter Mode ── */}
          {mode === "filter" && (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "warning.50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FilterListIcon sx={{ fontSize: 18, color: "warning.main" }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={800} color="warning.main">{t("send.filters")}</Typography>
                </Stack>
                {hasFilters && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => { setCarTypeId(null); setCarModelId(null); setCity(null); }}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                  >
                    {t("send.clearFilters")}
                  </Button>
                )}
              </Stack>

              <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2, "& .MuiAlert-message": { fontSize: "0.85rem" } }}>
                {t("send.filterHint")}
              </Alert>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label={t("send.carType")}
                    value={carTypeId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setCarTypeId(val);
                      setCarModelId(null);
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><DirectionsCarIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>,
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  >
                    <MenuItem value=""><em>{t("send.anyCarType")}</em></MenuItem>
                    {carTypes.map((ct) => (
                      <MenuItem key={ct.id} value={ct.id}>{ct.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label={t("send.carModel")}
                    value={carModelId ?? ""}
                    onChange={(e) => setCarModelId(e.target.value ? Number(e.target.value) : null)}
                    disabled={!selectedCarType}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><DirectionsCarIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>,
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  >
                    <MenuItem value=""><em>{t("send.anyCarModel")}</em></MenuItem>
                    {(selectedCarType?.carModels ?? []).map((cm) => (
                      <MenuItem key={cm.id} value={cm.id}>{cm.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label={t("send.city")}
                    value={city ?? ""}
                    onChange={(e) => setCity(e.target.value || null)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LocationCityIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>,
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                  >
                    <MenuItem value=""><em>{t("send.anyCity")}</em></MenuItem>
                    {CITIES.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "block", mb: 1 }}>
                    {t("send.appType")}
                  </Typography>
                  <ToggleButtonGroup
                    value={appType}
                    exclusive
                    onChange={(_e, v) => v && setAppType(v)}
                    fullWidth
                    sx={{
                      height: 48,
                      "& .MuiToggleButton-root": {
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: "10px !important",
                        "&.Mui-selected": { bgcolor: "primary.main", color: "white", "&:hover": { bgcolor: "primary.dark" } },
                      },
                    }}
                  >
                    <ToggleButton value="UserApp">
                      <SmartphoneIcon sx={{ fontSize: 18, mr: 1 }} />
                      {t("send.userApp")}
                    </ToggleButton>
                    <ToggleButton value="StationApp">
                      <EvStationIcon sx={{ fontSize: 18, mr: 1 }} />
                      {t("send.stationApp")}
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
              </Grid>

              {/* Active filters summary */}
              {hasFilters && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                  {carTypeId && selectedCarType && (
                    <Chip
                      icon={<DirectionsCarIcon sx={{ fontSize: "14px !important" }} />}
                      label={selectedCarType.name}
                      onDelete={() => { setCarTypeId(null); setCarModelId(null); }}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  )}
                  {carModelId && (
                    <Chip
                      label={selectedCarType?.carModels.find((m) => m.id === carModelId)?.name ?? `#${carModelId}`}
                      onDelete={() => setCarModelId(null)}
                      color="secondary"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  )}
                  {city && (
                    <Chip
                      icon={<LocationCityIcon sx={{ fontSize: "14px !important" }} />}
                      label={city}
                      onDelete={() => setCity(null)}
                      color="warning"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  )}
                </Stack>
              )}
            </Paper>
          )}

          {/* ── Advanced Options ── */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "grey.100", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SmartphoneIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="text.secondary">{t("send.advanced")}</Typography>
              <Chip label={t("send.optional")} size="small" variant="outlined" sx={{ fontWeight: 600, ml: 1 }} />
            </Stack>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("send.deepLink")}
                  value={deepLink}
                  onChange={(e) => setDeepLink(e.target.value)}
                  fullWidth
                  placeholder="app://screen/123"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("send.data")}
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  fullWidth
                  placeholder='{"key": "value"}'
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ── Submit ── */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "grey.50",
            }}
          >
            <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
              <Button
                variant="outlined"
                color="inherit"
                onClick={resetForm}
                disabled={isSending}
                sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: "none", minWidth: 120 }}
              >
                {t("send.reset")}
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSending}
                startIcon={isSending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  textTransform: "none",
                  py: 1.25,
                  px: 4,
                  background: "linear-gradient(135deg, #4a148c 0%, #6a1b9a 55%, #7b1fa2 100%)",
                  boxShadow: "0 4px 14px rgba(74,20,140,0.3)",
                  "&:hover": { background: "linear-gradient(135deg, #38006b 0%, #4a148c 100%)", boxShadow: "0 6px 20px rgba(74,20,140,0.4)" },
                }}
              >
                {isSending ? t("send.sending") : t("send.submit")}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </form>
      )}
    </AppScreenContainer>
  );
}
