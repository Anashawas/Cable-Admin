import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Chip,
  MenuItem,
  Select,
  Paper,
  Avatar,
  InputAdornment,
  TextField,
  FormControl,
  InputLabel,
  TablePagination,
  useTheme,
  useMediaQuery,
  Grid,
  type Theme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import PersonIcon from "@mui/icons-material/Person";
import EvStationIcon from "@mui/icons-material/EvStation";
import ReplyIcon from "@mui/icons-material/Reply";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  formatFullDateTime,
  formatRelative,
  formatShortDate,
  matchesDateRange,
  toTimestamp,
  type DateRangePreset,
} from "../../../utils/date-format";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import LaunchIcon from "@mui/icons-material/Launch";
import SendIcon from "@mui/icons-material/Send";
import FiberNewIcon from "@mui/icons-material/FiberNew";
import DoNotDisturbAltIcon from "@mui/icons-material/DoNotDisturbAlt";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import BugReportIcon from "@mui/icons-material/BugReport";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { getAllComplaints, deleteComplaint, updateComplaintStatus } from "../services/complaints-service";
import type { UserComplaintDto } from "../types/api";
import { ComplaintStatus } from "../types/api";
import { useSnackbarStore } from "../../../stores";
import {
  getNotificationTypes,
  sendNotification,
} from "../../notifications/services/notification-service";
import type { SendNotificationRequest } from "../../notifications/types/api";

type StatusFilter = "all" | ComplaintStatus;
type ComplaintSort = "newest" | "oldest" | "recentlyUpdated";

const COMPLAINT_SORTS: { value: ComplaintSort; labelKey: string }[] = [
  { value: "newest", labelKey: "complaints@sort.newest" },
  { value: "oldest", labelKey: "complaints@sort.oldest" },
  { value: "recentlyUpdated", labelKey: "complaints@sort.recentlyUpdated" },
];

const COMPLAINT_DATE_RANGES: { value: DateRangePreset; labelKey: string }[] = [
  { value: "all", labelKey: "complaints@filters.anyTime" },
  { value: "7d", labelKey: "complaints@filters.last7Days" },
  { value: "30d", labelKey: "complaints@filters.last30Days" },
  { value: "90d", labelKey: "complaints@filters.last90Days" },
  { value: "365d", labelKey: "complaints@filters.lastYear" },
];
type StatusKey = "new" | "notComplaint" | "solved" | "opened" | "followUp" | "unsolved" | "systemIssue";
type ChipColor = "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";

const getStatusMeta = (theme: Theme): Record<ComplaintStatus, {
  key: StatusKey;
  color: ChipColor;
  hex: string;
  bg: string;
  icon: React.ReactNode;
}> => ({
  [ComplaintStatus.New]:          { key: "new",          color: "info",      hex: theme.palette.secondary.dark, bg: alpha(theme.palette.primary.main, 0.08), icon: <FiberNewIcon /> },
  [ComplaintStatus.NotComplaint]: { key: "notComplaint", color: "default",   hex: "#546e7a", bg: "#eceff1", icon: <DoNotDisturbAltIcon /> },
  [ComplaintStatus.Solved]:       { key: "solved",       color: "success",   hex: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.12), icon: <CheckCircleIcon /> },
  [ComplaintStatus.Opened]:       { key: "opened",       color: "primary",   hex: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.08), icon: <FolderOpenIcon /> },
  [ComplaintStatus.FollowUp]:     { key: "followUp",     color: "warning",   hex: theme.palette.warning.dark, bg: alpha(theme.palette.warning.main, 0.12), icon: <HourglassTopIcon /> },
  [ComplaintStatus.Unsolved]:     { key: "unsolved",     color: "error",     hex: theme.palette.error.dark, bg: alpha(theme.palette.error.main, 0.12), icon: <CancelIcon /> },
  [ComplaintStatus.SystemIssue]:  { key: "systemIssue",  color: "secondary", hex: "#6a1b9a", bg: "#f3e5f5", icon: <BugReportIcon /> },
});

const STATUS_ORDER: ComplaintStatus[] = [
  ComplaintStatus.New,
  ComplaintStatus.Opened,
  ComplaintStatus.FollowUp,
  ComplaintStatus.Solved,
  ComplaintStatus.Unsolved,
  ComplaintStatus.NotComplaint,
  ComplaintStatus.SystemIssue,
];

export default function ComplaintsScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";
  const theme = useTheme();
  const STATUS_META = useMemo(() => getStatusMeta(theme), [theme]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  // ── State ──
  const isRtl = (i18n.language || "en").startsWith("ar");
  const smallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // On phones the pane flips between list and detail.
  const [mobileDetail, setMobileDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateRangePreset>("all");
  const [sortOrder, setSortOrder] = useState<ComplaintSort>("newest");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState<UserComplaintDto | null>(null);

  // Reply dialog state
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<UserComplaintDto | null>(null);
  const [replyTitle, setReplyTitle] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyTypeId, setReplyTypeId] = useState<number>(0);

  // After-reply status prompt (Solved / FollowUp)
  const [postReplyOpen, setPostReplyOpen] = useState(false);
  const [postReplyTarget, setPostReplyTarget] = useState<UserComplaintDto | null>(null);

  // ── Queries ──
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["complaints"],
    queryFn: ({ signal }) => getAllComplaints(signal),
  });

  const { data: notificationTypes = [] } = useQuery({
    queryKey: ["notifications", "types"],
    queryFn: ({ signal }) => getNotificationTypes(signal),
  });

  // ── Mutations ──
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteComplaint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      openSuccessSnackbar({ message: t("complaints@deleted") });
      setDeleteDialogOpen(false);
      setComplaintToDelete(null);
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ComplaintStatus }) =>
      updateComplaintStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      openSuccessSnackbar({ message: t("complaints@statusUpdated") });
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const replyMutation = useMutation({
    mutationFn: (payload: SendNotificationRequest) => sendNotification(payload),
    onSuccess: () => {
      openSuccessSnackbar({ message: t("complaints@replySent") });
      const target = replyTarget;
      setReplyOpen(false);
      setReplyTitle("");
      setReplyBody("");
      setReplyTypeId(0);
      setReplyTarget(null);
      // After replying, offer to advance status (Solved / FollowUp) — skip if already terminal
      const terminal = [ComplaintStatus.Solved, ComplaintStatus.NotComplaint, ComplaintStatus.Unsolved];
      if (target && !terminal.includes(target.status) && target.status !== ComplaintStatus.FollowUp) {
        setPostReplyTarget(target);
        setPostReplyOpen(true);
      }
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  // ── Derived ──
  const statusCounts = useMemo(() => {
    const counts: Record<"all" | ComplaintStatus, number> = {
      all: data.length,
      [ComplaintStatus.New]: 0,
      [ComplaintStatus.NotComplaint]: 0,
      [ComplaintStatus.Solved]: 0,
      [ComplaintStatus.Opened]: 0,
      [ComplaintStatus.FollowUp]: 0,
      [ComplaintStatus.Unsolved]: 0,
      [ComplaintStatus.SystemIssue]: 0,
    };
    data.forEach((c) => { counts[c.status] = (counts[c.status] ?? 0) + 1; });
    return counts;
  }, [data]);

  const filteredData = useMemo(() => {
    let list = data;
    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        (c.note ?? "").toLowerCase().includes(q) ||
        (c.userAccount?.name ?? "").toLowerCase().includes(q) ||
        (c.chargingPoint?.name ?? "").toLowerCase().includes(q) ||
        String(c.id).includes(q) ||
        String(c.userAccount?.id ?? "").includes(q) ||
        String(c.chargingPoint?.id ?? "").includes(q)
      );
    }
    if (dateFilter !== "all") {
      list = list.filter((c) => matchesDateRange(c.createdAt, dateFilter));
    }

    // Undated rows sink to the bottom rather than masquerading as oldest.
    const key = sortOrder === "recentlyUpdated" ? "modifiedAt" : "createdAt";
    return [...list].sort((a, b) => {
      const ta = toTimestamp(a[key]);
      const tb = toTimestamp(b[key]);
      if (ta == null && tb == null) return a.id - b.id;
      if (ta == null) return 1;
      if (tb == null) return -1;
      return sortOrder === "oldest" ? ta - tb : tb - ta;
    });
  }, [data, statusFilter, search, dateFilter, sortOrder]);

  const paginated = useMemo(() => {
    const start = page * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const selected = useMemo(() => data.find((c) => c.id === selectedId) ?? null, [data, selectedId]);

  // Keep a sensible selection: first item of the visible page.
  useEffect(() => {
    if (paginated.length === 0) { setSelectedId(null); return; }
    if (selectedId != null && paginated.some((c) => c.id === selectedId)) return;
    setSelectedId(paginated[0].id);
  }, [paginated, selectedId]);

  // ── Handlers ──
  const handleOpenReply = useCallback((complaint: UserComplaintDto) => {
    setReplyTarget(complaint);
    const stationName = complaint.chargingPoint?.name?.trim() || t("complaints@unknownStation");
    setReplyTitle(t("complaints@replyTitleTemplate", { id: complaint.id, station: stationName }));
    setReplyBody("");
    setReplyTypeId(0);
    setReplyOpen(true);
  }, [t]);

  const handleSendReply = useCallback(() => {
    if (!replyTarget) return;
    const userId = replyTarget.userAccount?.id;
    if (!userId) {
      openErrorSnackbar({ message: t("complaints@noUserId") });
      return;
    }
    if (!replyTypeId) {
      openErrorSnackbar({ message: t("complaints@replyTypeRequired") });
      return;
    }
    if (!replyTitle.trim() || !replyBody.trim()) {
      openErrorSnackbar({ message: t("complaints@replyContentRequired") });
      return;
    }
    replyMutation.mutate({
      notificationTypeId: replyTypeId,
      title: replyTitle.trim(),
      body: replyBody.trim(),
      isForAll: false,
      userIds: [userId],
      deepLink: null,
      data: null,
      time: null,
    });
  }, [replyTarget, replyTypeId, replyTitle, replyBody, replyMutation, openErrorSnackbar, t]);

  const handlePostReplyStatus = useCallback((status: ComplaintStatus) => {
    if (!postReplyTarget) return;
    statusMutation.mutate(
      { id: postReplyTarget.id, status },
      {
        onSuccess: () => {
          setPostReplyOpen(false);
          setPostReplyTarget(null);
        },
      }
    );
  }, [postReplyTarget, statusMutation]);

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>

          {/* Hero */}
          <Box sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, borderRadius: 3, p: { xs: 2, md: 2.5 }, color: "common.white", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: -40, insetInlineEnd: -40, width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.07)" }} />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ position: "relative" }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 48, height: 48, borderRadius: 2.5 }}><ReportProblemIcon /></Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={800}>{t("complaints@title")}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>{t("complaints@subtitle")}</Typography>
              </Box>
              <Tooltip title={t("refresh")}>
                <IconButton onClick={() => refetch()} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}><RefreshIcon /></IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Master-detail */}
          <Grid container spacing={2}>

            {/* List panel */}
            {(!smallScreen || !mobileDetail) && (
              <Grid size={{ xs: 12, md: 4.5, lg: 4 }}>
                <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: { md: "calc(100vh - 240px)" } }}>
                  {/* Toolbar */}
                  <Box sx={{ p: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                    <TextField
                      fullWidth size="small"
                      placeholder={t("complaints@searchPlaceholder")}
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "text.secondary", fontSize: 18 }} /></InputAdornment>,
                        endAdornment: search ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch("")}><CloseIcon fontSize="small" /></IconButton></InputAdornment> : undefined,
                        sx: { borderRadius: 2 },
                      }}
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <FormControl size="small" fullWidth>
                        <InputLabel>{t("complaints@sort.label")}</InputLabel>
                        <Select value={sortOrder} label={t("complaints@sort.label")} onChange={(e) => { setSortOrder(e.target.value as ComplaintSort); setPage(0); }} sx={{ borderRadius: 2 }}>
                          {COMPLAINT_SORTS.map((o) => <MenuItem key={o.value} value={o.value}>{t(o.labelKey)}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl size="small" fullWidth>
                        <InputLabel>{t("complaints@filters.submitted")}</InputLabel>
                        <Select value={dateFilter} label={t("complaints@filters.submitted")} onChange={(e) => { setDateFilter(e.target.value as DateRangePreset); setPage(0); }} sx={{ borderRadius: 2 }}>
                          {COMPLAINT_DATE_RANGES.map((o) => <MenuItem key={o.value} value={o.value}>{t(o.labelKey)}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Stack>
                    {/* Status filter chips */}
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      {([{ key: "all" as StatusFilter, label: t("all"), count: statusCounts.all, hex: theme.palette.primary.main },
                        ...STATUS_ORDER.map((st) => ({ key: st as StatusFilter, label: t(`complaints@status_${STATUS_META[st].key}`), count: statusCounts[st], hex: STATUS_META[st].hex }))]
                        .filter((c) => c.key === "all" || c.count > 0))
                        .map((c) => {
                          const active = statusFilter === c.key;
                          return (
                            <Chip key={String(c.key)} size="small"
                              label={`${c.label} (${c.count})`}
                              onClick={() => { setStatusFilter(c.key); setPage(0); }}
                              variant={active ? "filled" : "outlined"}
                              sx={{
                                fontWeight: 700, cursor: "pointer",
                                ...(active
                                  ? { bgcolor: c.hex, color: "#fff" }
                                  : { color: c.hex, borderColor: alpha(c.hex, 0.4) }),
                              }} />
                          );
                        })}
                    </Stack>
                  </Box>

                  {/* Items */}
                  <Box sx={{ overflow: "auto", flex: 1 }}>
                    {error ? (
                      <Box sx={{ py: 6, textAlign: "center" }}>
                        <Typography color="error.dark" fontWeight={700}>{t("loadingFailed")}</Typography>
                      </Box>
                    ) : isLoading ? (
                      <Stack spacing={1} sx={{ p: 1.5 }}>{[0, 1, 2, 3].map((i2) => <Box key={i2} sx={{ height: 72, borderRadius: 2, bgcolor: "action.hover" }} />)}</Stack>
                    ) : paginated.length === 0 ? (
                      <Box sx={{ py: 6, textAlign: "center" }}>
                        <ReportProblemIcon sx={{ fontSize: 40, color: "grey.300", mb: 1 }} />
                        <Typography variant="body2" color="text.disabled">{t("complaints@emptyTitle")}</Typography>
                      </Box>
                    ) : (
                      paginated.map((c) => {
                        const meta = STATUS_META[c.status] ?? STATUS_META[ComplaintStatus.New];
                        const isSelected = c.id === selectedId && !smallScreen;
                        return (
                          <Box key={c.id} onClick={() => { setSelectedId(c.id); if (smallScreen) setMobileDetail(true); }}
                            sx={{
                              px: 1.75, py: 1.25, cursor: "pointer",
                              borderBottom: "1px solid", borderColor: "divider",
                              borderInlineStart: "3px solid", borderInlineStartColor: isSelected ? "primary.main" : "transparent",
                              bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.06) : "transparent",
                              "&:hover": { bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : "action.hover" },
                            }}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: meta.hex, flexShrink: 0 }} />
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Stack direction="row" spacing={0.75} alignItems="baseline">
                                  <Typography variant="body2" fontWeight={800} flexShrink={0}>#{c.id}</Typography>
                                  <Typography variant="body2" fontWeight={600} noWrap sx={{ minWidth: 0 }}>{c.userAccount?.name || t("complaints@unknownUser")}</Typography>
                                </Stack>
                                <Typography variant="caption" color="text.secondary" noWrap display="block">{c.note || "\u2014"}</Typography>
                                <Typography variant="caption" color="text.disabled" noWrap display="block">
                                  {(c.chargingPoint?.name || t("complaints@unknownStation"))}{c.createdAt ? ` \u00b7 ${formatRelative(c.createdAt, lang)}` : ""}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                        );
                      })
                    )}
                  </Box>

                  {/* Pagination */}
                  <TablePagination
                    component="div"
                    count={filteredData.length}
                    page={page}
                    rowsPerPage={pageSize}
                    rowsPerPageOptions={[10, 20, 50]}
                    onPageChange={(_e, p) => setPage(p)}
                    onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
                    labelRowsPerPage={t("tableRowsPerPage")}
                    labelDisplayedRows={({ from, to, count }) => `${from}\u2013${to} ${t("tableOf")} ${count}`}
                    sx={{ borderTop: "1px solid", borderColor: "divider", ".MuiTablePagination-toolbar": { minHeight: 44 } }}
                  />
                </Paper>
              </Grid>
            )}

            {/* Detail panel */}
            {(!smallScreen || mobileDetail) && (
              <Grid size={{ xs: 12, md: 7.5, lg: 8 }}>
                <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: { md: "calc(100vh - 240px)" }, minHeight: { md: 420 } }}>
                  {!selected ? (
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10 }}>
                      <ReportProblemIcon sx={{ fontSize: 44, color: "grey.300", mb: 1 }} />
                      <Typography variant="body1" color="text.disabled">{t("complaints@selectPrompt")}</Typography>
                    </Box>
                  ) : (() => {
                    const meta = STATUS_META[selected.status] ?? STATUS_META[ComplaintStatus.New];
                    return (
                      <>
                        {/* Header */}
                        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                            {smallScreen && (
                              <IconButton size="small" onClick={() => setMobileDetail(false)}>
                                <ArrowBackIcon sx={{ transform: isRtl ? "scaleX(-1)" : "none" }} />
                              </IconButton>
                            )}
                            <Avatar sx={{ bgcolor: meta.bg, color: meta.hex, width: 44, height: 44, borderRadius: 2.5 }}>{meta.icon}</Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="subtitle1" fontWeight={800}>{t("complaints@complaintId", { id: selected.id })}</Typography>
                              {selected.createdAt && (
                                <Tooltip title={formatFullDateTime(selected.createdAt, lang)} arrow>
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <AccessTimeIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                    <Typography variant="caption" color="text.secondary">
                                      {t("complaints@submittedOn", { date: formatShortDate(selected.createdAt, lang) })}{" \u00b7 "}{formatRelative(selected.createdAt, lang)}
                                    </Typography>
                                  </Stack>
                                </Tooltip>
                              )}
                            </Box>
                            <FormControl size="small" sx={{ minWidth: 190 }}>
                              <InputLabel>{t("complaints@changeStatus")}</InputLabel>
                              <Select
                                value={selected.status}
                                label={t("complaints@changeStatus")}
                                disabled={statusMutation.isPending}
                                onChange={(e) => statusMutation.mutate({ id: selected.id, status: e.target.value as ComplaintStatus })}
                                renderValue={(value) => {
                                  const m = STATUS_META[value as ComplaintStatus];
                                  return (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Box sx={{ color: m.hex, display: "flex", "& svg": { fontSize: 18 } }}>{m.icon}</Box>
                                      <Typography variant="body2" fontWeight={700} sx={{ color: m.hex }}>{t(`complaints@status_${m.key}`)}</Typography>
                                    </Stack>
                                  );
                                }}
                                sx={{ borderRadius: 2, "& .MuiOutlinedInput-notchedOutline": { borderColor: meta.hex } }}
                              >
                                {STATUS_ORDER.map((st) => {
                                  const m = STATUS_META[st];
                                  return (
                                    <MenuItem key={st} value={st}>
                                      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: "100%" }}>
                                        <Box sx={{ color: m.hex, display: "flex", "& svg": { fontSize: 20 } }}>{m.icon}</Box>
                                        <Typography variant="body2" fontWeight={600}>{t(`complaints@status_${m.key}`)}</Typography>
                                      </Stack>
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                            </FormControl>
                            <Tooltip title={t("complaints@actions.delete")}>
                              <IconButton size="small" onClick={() => { setComplaintToDelete(selected); setDeleteDialogOpen(true); }} sx={{ color: "error.main" }}>
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>

                        {/* Body */}
                        <Box sx={{ p: 2.5, overflow: "auto", flex: 1 }}>
                          <Grid container spacing={1.5}>
                            {/* User */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider", height: "100%" }}>
                                <Typography variant="caption" color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.65rem", fontWeight: 700 }}>{t("complaints@columns.user")}</Typography>
                                {selected.userAccount ? (
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", width: 36, height: 36 }}><PersonIcon sx={{ fontSize: 18 }} /></Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="body2" fontWeight={700} noWrap>{selected.userAccount.name || t("complaints@unknownUser")}</Typography>
                                      <Typography variant="caption" color="text.secondary">#{selected.userAccount.id}</Typography>
                                    </Box>
                                    <Tooltip title={t("complaints@viewUser")}>
                                      <IconButton size="small" color="primary" onClick={() => navigate(`/users/${selected.userAccount!.id}/edit`)}><LaunchIcon sx={{ fontSize: 18 }} /></IconButton>
                                    </Tooltip>
                                  </Stack>
                                ) : (
                                  <Typography variant="body2" color="text.disabled" sx={{ mt: 0.75 }}>{"\u2014"}</Typography>
                                )}
                              </Paper>
                            </Grid>
                            {/* Station */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider", height: "100%" }}>
                                <Typography variant="caption" color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.65rem", fontWeight: 700 }}>{t("complaints@columns.station")}</Typography>
                                {selected.chargingPoint ? (
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                                    <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.12), color: "success.main", width: 36, height: 36 }}><EvStationIcon sx={{ fontSize: 18 }} /></Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="body2" fontWeight={700} noWrap>{selected.chargingPoint.name || t("complaints@unknownStation")}</Typography>
                                      <Typography variant="caption" color="text.secondary">#{selected.chargingPoint.id}</Typography>
                                    </Box>
                                    <Tooltip title={t("complaints@viewStation")}>
                                      <IconButton size="small" color="success" onClick={() => navigate(`/charge-management/edit/${selected.chargingPoint!.id}`)}><LaunchIcon sx={{ fontSize: 18 }} /></IconButton>
                                    </Tooltip>
                                  </Stack>
                                ) : (
                                  <Typography variant="body2" color="text.disabled" sx={{ mt: 0.75 }}>{"\u2014"}</Typography>
                                )}
                              </Paper>
                            </Grid>
                          </Grid>

                          {/* Note */}
                          <Paper elevation={0} sx={{ mt: 1.5, p: 2, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider", borderInlineStart: "4px solid", borderInlineStartColor: meta.hex }}>
                            <Typography variant="caption" color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.65rem", fontWeight: 700, display: "block", mb: 0.75 }}>{t("complaints@columns.note")}</Typography>
                            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{selected.note ?? "\u2014"}</Typography>
                          </Paper>
                        </Box>

                        {/* Action bar */}
                        <Box sx={{ p: 1.5, px: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              variant="contained"
                              startIcon={<ReplyIcon />}
                              onClick={() => handleOpenReply(selected)}
                              sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)` }}
                            >
                              {t("complaints@reply")}
                            </Button>
                          </Stack>
                        </Box>
                      </>
                    );
                  })()}
                </Paper>
              </Grid>
            )}
          </Grid>
        </Stack>
      </Box>

      {/* ── Delete Dialog ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteMutation.isPending && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.dark} 100%)`, p: 2.5, color: "white", display: "flex", alignItems: "center", gap: 1.5 }}>
          <DeleteOutlineIcon />
          <Typography variant="h6" fontWeight={700}>{t("complaints@deleteConfirmTitle")}</Typography>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1">{t("complaints@deleteConfirmMessage")}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending} variant="outlined" sx={{ borderRadius: 2 }}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => complaintToDelete && deleteMutation.mutate(complaintToDelete.id)}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {deleteMutation.isPending ? t("deleting") : t("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Reply Dialog ── */}
      <Dialog
        open={replyOpen}
        onClose={() => !replyMutation.isPending && setReplyOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <Box sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, p: 3, color: "white", position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ReplyIcon sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} color="white">{t("complaints@replyTitle")}</Typography>
                {replyTarget && (
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                    {t("complaints@replyToUser")}: {replyTarget.userAccount?.name || `#${replyTarget.userAccount?.id}`}
                  </Typography>
                )}
              </Box>
            </Stack>
            <IconButton onClick={() => setReplyOpen(false)} sx={{ color: "rgba(255,255,255,0.8)" }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              select
              fullWidth
              label={t("complaints@replyType")}
              value={replyTypeId || ""}
              onChange={(e) => setReplyTypeId(e.target.value ? Number(e.target.value) : 0)}
              required
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            >
              <MenuItem value=""><em>{t("complaints@selectType")}</em></MenuItem>
              {notificationTypes.map((nt) => (
                <MenuItem key={nt.id} value={nt.id}>{nt.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("complaints@replyTitleField")}
              value={replyTitle}
              onChange={(e) => setReplyTitle(e.target.value)}
              fullWidth
              required
              helperText={t("complaints@replyTitleHint")}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            />
            <TextField
              label={t("complaints@replyBody")}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              fullWidth
              required
              multiline
              rows={5}
              placeholder={t("complaints@replyBodyPlaceholder")}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setReplyOpen(false)} disabled={replyMutation.isPending} variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSendReply}
            variant="contained"
            disabled={replyMutation.isPending}
            startIcon={replyMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            sx={{
              borderRadius: 2,
              fontWeight: 800,
              textTransform: "none",
              px: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            }}
          >
            {replyMutation.isPending ? t("complaints@sending") : t("complaints@sendReply")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Post-reply status prompt ── */}
      <Dialog
        open={postReplyOpen}
        onClose={() => { if (!statusMutation.isPending) { setPostReplyOpen(false); setPostReplyTarget(null); } }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <Box sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, p: 2.5, color: "white", display: "flex", alignItems: "center", gap: 1.5 }}>
          <ReplyIcon />
          <Typography variant="h6" fontWeight={700}>{t("complaints@postReplyTitle")}</Typography>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>{t("complaints@postReplyMessage")}</Typography>
          <Stack spacing={1.25}>
            <Button
              onClick={() => handlePostReplyStatus(ComplaintStatus.FollowUp)}
              variant="contained"
              color="warning"
              fullWidth
              disabled={statusMutation.isPending}
              startIcon={<HourglassTopIcon />}
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none", justifyContent: "flex-start", py: 1.25 }}
            >
              {t("complaints@moveToFollowUp")}
            </Button>
            <Button
              onClick={() => handlePostReplyStatus(ComplaintStatus.Solved)}
              variant="contained"
              color="success"
              fullWidth
              disabled={statusMutation.isPending}
              startIcon={<CheckCircleIcon />}
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none", justifyContent: "flex-start", py: 1.25 }}
            >
              {t("complaints@markSolved")}
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => { setPostReplyOpen(false); setPostReplyTarget(null); }}
            variant="text"
            disabled={statusMutation.isPending}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}
          >
            {t("complaints@keepStatus")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
