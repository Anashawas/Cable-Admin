import { useMemo, useState, useCallback } from "react";
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
  Divider,
  InputAdornment,
  TextField,
  FormControl,
  InputLabel,
  TablePagination,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import PersonIcon from "@mui/icons-material/Person";
import EvStationIcon from "@mui/icons-material/EvStation";
import ReplyIcon from "@mui/icons-material/Reply";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CancelIcon from "@mui/icons-material/Cancel";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import LaunchIcon from "@mui/icons-material/Launch";
import SendIcon from "@mui/icons-material/Send";
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

const STATUS_META: Record<ComplaintStatus, {
  key: "pending" | "rejected" | "solved";
  color: "warning" | "error" | "success";
  hex: string;
  bg: string;
  icon: React.ReactNode;
}> = {
  [ComplaintStatus.Pending]: { key: "pending", color: "warning", hex: "#e65100", bg: "#fff3e0", icon: <PendingActionsIcon /> },
  [ComplaintStatus.Rejected]: { key: "rejected", color: "error", hex: "#c62828", bg: "#ffebee", icon: <CancelIcon /> },
  [ComplaintStatus.Solved]: { key: "solved", color: "success", hex: "#2e7d32", bg: "#e8f5e9", icon: <CheckCircleIcon /> },
};

export default function ComplaintsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  // ── State ──
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState<UserComplaintDto | null>(null);

  // Reply dialog state
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<UserComplaintDto | null>(null);
  const [replyTitle, setReplyTitle] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyTypeId, setReplyTypeId] = useState<number>(0);

  // Mark as solved follow-up
  const [markSolvedOpen, setMarkSolvedOpen] = useState(false);
  const [markSolvedTarget, setMarkSolvedTarget] = useState<UserComplaintDto | null>(null);

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
      // Offer to mark as solved if it wasn't already
      if (target && target.status !== ComplaintStatus.Solved) {
        setMarkSolvedTarget(target);
        setMarkSolvedOpen(true);
      }
    },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  // ── Derived ──
  const statusCounts = useMemo(() => {
    const counts = { all: data.length, [ComplaintStatus.Pending]: 0, [ComplaintStatus.Rejected]: 0, [ComplaintStatus.Solved]: 0 };
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
    return list;
  }, [data, statusFilter, search]);

  const paginated = useMemo(() => {
    const start = page * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

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

  const handleConfirmMarkSolved = useCallback(() => {
    if (!markSolvedTarget) return;
    statusMutation.mutate(
      { id: markSolvedTarget.id, status: ComplaintStatus.Solved },
      {
        onSuccess: () => {
          setMarkSolvedOpen(false);
          setMarkSolvedTarget(null);
        },
      }
    );
  }, [markSolvedTarget, statusMutation]);

  return (
    <AppScreenContainer>
      {/* ── Gradient Banner ── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #b71c1c 0%, #c62828 55%, #d84315 100%)",
          borderRadius: 3,
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          position: "relative",
          overflow: "hidden",
          color: "white",
        }}
      >
        <Box sx={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2} sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ReportProblemIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} color="white" lineHeight={1.2}>{t("complaints@title")}</Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5 }}>{t("complaints@subtitle")}</Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            sx={{
              bgcolor: "rgba(255,255,255,0.18)",
              color: "white",
              fontWeight: 700,
              fontSize: "0.9rem",
              textTransform: "none",
              px: 3,
              py: 1,
              borderRadius: 2.5,
              border: "1px solid rgba(255,255,255,0.25)",
              backdropFilter: "blur(4px)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.28)", borderColor: "rgba(255,255,255,0.5)" },
            }}
          >
            {t("refresh")}
          </Button>
        </Stack>

        {/* KPI cards */}
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          {([
            { key: "all" as StatusFilter, label: t("all"), count: statusCounts.all, icon: <ReportProblemIcon /> },
            { key: ComplaintStatus.Pending as StatusFilter, label: t("complaints@status_pending"), count: statusCounts[ComplaintStatus.Pending], icon: <PendingActionsIcon /> },
            { key: ComplaintStatus.Rejected as StatusFilter, label: t("complaints@status_rejected"), count: statusCounts[ComplaintStatus.Rejected], icon: <CancelIcon /> },
            { key: ComplaintStatus.Solved as StatusFilter, label: t("complaints@status_solved"), count: statusCounts[ComplaintStatus.Solved], icon: <CheckCircleIcon /> },
          ]).map((card) => {
            const active = statusFilter === card.key;
            return (
              <Paper
                key={String(card.key)}
                elevation={0}
                onClick={() => { setStatusFilter(card.key); setPage(0); }}
                sx={{
                  cursor: "pointer",
                  flex: "1 1 auto",
                  minWidth: 140,
                  px: 2.5,
                  py: 2.25,
                  borderRadius: 2.5,
                  bgcolor: active ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)",
                  border: "1px solid",
                  borderColor: active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(4px)",
                  transition: "all 0.2s",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                  <Box sx={{ opacity: 0.85, display: "flex" }}>{card.icon}</Box>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.88)", fontWeight: 700 }}>{card.label}</Typography>
                </Stack>
                <Typography variant="h5" fontWeight={900} color="white" lineHeight={1}>{card.count}</Typography>
              </Paper>
            );
          })}
        </Stack>
      </Box>

      {/* ── Search bar ── */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <TextField
          fullWidth
          placeholder={t("complaints@searchPlaceholder")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch("")}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
            sx: { borderRadius: 2.5, bgcolor: "grey.50", fontSize: "1rem" },
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
        />
      </Paper>

      {/* ── List ── */}
      {error ? (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid", borderColor: "error.200", textAlign: "center", bgcolor: "error.50" }}>
          <Typography color="error.dark" fontWeight={700}>{t("loadingFailed")}</Typography>
        </Paper>
      ) : isLoading ? (
        <Stack spacing={1.5}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Paper key={i} elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", borderLeft: "4px solid", borderLeftColor: "grey.200" }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ width: 46, height: 46, borderRadius: 2, bgcolor: "grey.100" }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ width: "40%", height: 14, borderRadius: 1, bgcolor: "grey.200", mb: 0.75 }} />
                  <Box sx={{ width: "80%", height: 11, borderRadius: 1, bgcolor: "grey.100" }} />
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : filteredData.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 3, border: "1px solid", borderColor: "divider", textAlign: "center" }}>
          <Box sx={{ width: 72, height: 72, borderRadius: "50%", bgcolor: "error.50", mx: "auto", display: "flex", alignItems: "center", justifyContent: "center", mb: 2, border: "2px dashed", borderColor: "error.200" }}>
            <ReportProblemIcon sx={{ fontSize: 32, color: "error.300" }} />
          </Box>
          <Typography variant="h6" fontWeight={700} color="text.secondary" gutterBottom>
            {t("complaints@emptyTitle")}
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {t("complaints@emptyHint")}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {paginated.map((c) => {
            const meta = STATUS_META[c.status] ?? STATUS_META[ComplaintStatus.Pending];
            return (
              <Paper
                key={c.id}
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                  borderLeft: "4px solid",
                  borderLeftColor: meta.hex,
                  transition: "box-shadow 0.15s, border-color 0.15s",
                  "&:hover": { boxShadow: 4, borderColor: meta.hex },
                }}
              >
                {/* Header row */}
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={1.5} sx={{ px: 2.5, py: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: meta.bg, color: meta.hex, width: 42, height: 42, borderRadius: 2 }}>
                      {meta.icon}
                    </Avatar>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1" fontWeight={800}>
                          {t("complaints@complaintId", { id: c.id })}
                        </Typography>
                        <Chip
                          label={t(`complaints@status_${meta.key}`)}
                          size="small"
                          color={meta.color}
                          variant="filled"
                          sx={{ fontWeight: 700, height: 22 }}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                  {/* Quick status select */}
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>{t("complaints@changeStatus")}</InputLabel>
                    <Select
                      value={c.status}
                      label={t("complaints@changeStatus")}
                      disabled={statusMutation.isPending}
                      onChange={(e) => statusMutation.mutate({ id: c.id, status: e.target.value as ComplaintStatus })}
                      sx={{ borderRadius: 2, "& .MuiOutlinedInput-notchedOutline": { borderColor: meta.hex } }}
                    >
                      <MenuItem value={ComplaintStatus.Pending}>{t("complaints@status_pending")}</MenuItem>
                      <MenuItem value={ComplaintStatus.Rejected}>{t("complaints@status_rejected")}</MenuItem>
                      <MenuItem value={ComplaintStatus.Solved}>{t("complaints@status_solved")}</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                <Divider />

                {/* Body */}
                <Stack direction={{ xs: "column", md: "row" }} sx={{ bgcolor: "grey.50" }}>
                  {/* User */}
                  <Box sx={{ flex: 1, p: 2 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.65rem", fontWeight: 700 }}>
                      {t("complaints@columns.user")}
                    </Typography>
                    {c.userAccount ? (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                        <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
                          <PersonIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {c.userAccount.name || t("complaints@unknownUser")}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            #{c.userAccount.id}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<LaunchIcon sx={{ fontSize: 16 }} />}
                          onClick={() => navigate(`/users/${c.userAccount!.id}/edit`)}
                          sx={{
                            fontWeight: 700,
                            textTransform: "none",
                            borderRadius: 2,
                            fontSize: "0.75rem",
                            px: 1.5,
                            boxShadow: "0 2px 8px rgba(13,71,161,0.3)",
                            "&:hover": { boxShadow: "0 3px 12px rgba(13,71,161,0.4)" },
                          }}
                        >
                          {t("complaints@viewUser")}
                        </Button>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.disabled" sx={{ mt: 0.75 }}>—</Typography>
                    )}
                  </Box>

                  <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "flex" } }} />

                  {/* Station */}
                  <Box sx={{ flex: 1, p: 2 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.65rem", fontWeight: 700 }}>
                      {t("complaints@columns.station")}
                    </Typography>
                    {c.chargingPoint ? (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                        <Avatar sx={{ bgcolor: "success.main", width: 36, height: 36 }}>
                          <EvStationIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {c.chargingPoint.name || t("complaints@unknownStation")}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            #{c.chargingPoint.id}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<LaunchIcon sx={{ fontSize: 16 }} />}
                          onClick={() => navigate(`/charge-management/edit/${c.chargingPoint!.id}`)}
                          sx={{
                            fontWeight: 700,
                            textTransform: "none",
                            borderRadius: 2,
                            fontSize: "0.75rem",
                            px: 1.5,
                            boxShadow: "0 2px 8px rgba(46,125,50,0.3)",
                            "&:hover": { boxShadow: "0 3px 12px rgba(46,125,50,0.4)" },
                          }}
                        >
                          {t("complaints@viewStation")}
                        </Button>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.disabled" sx={{ mt: 0.75 }}>—</Typography>
                    )}
                  </Box>
                </Stack>

                <Divider />

                {/* Note */}
                <Box sx={{ px: 2.5, py: 2 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.65rem", fontWeight: 700, display: "block", mb: 0.75 }}>
                    {t("complaints@columns.note")}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {c.note ?? "—"}
                  </Typography>
                </Box>

                {/* Actions */}
                <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ px: 2.5, py: 1.5, borderTop: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<ReplyIcon />}
                    onClick={() => handleOpenReply(c)}
                    sx={{
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 2,
                      background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)",
                      boxShadow: "0 2px 8px rgba(13,71,161,0.3)",
                    }}
                  >
                    {t("complaints@reply")}
                  </Button>
                  <Tooltip title={t("complaints@actions.delete")}>
                    <IconButton
                      size="small"
                      onClick={() => { setComplaintToDelete(c); setDeleteDialogOpen(true); }}
                      sx={{
                        bgcolor: "error.main",
                        color: "white",
                        width: 32,
                        height: 32,
                        "&:hover": { bgcolor: "error.dark" },
                      }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            );
          })}

          <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            rowsPerPage={pageSize}
            rowsPerPageOptions={[10, 20, 50]}
            onPageChange={(_e, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage={t("tableRowsPerPage")}
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${t("tableOf")} ${count}`}
            sx={{ mt: 1 }}
          />
        </Stack>
      )}

      {/* ── Delete Dialog ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteMutation.isPending && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box sx={{ background: "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)", p: 2.5, color: "white", display: "flex", alignItems: "center", gap: 1.5 }}>
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
        <Box sx={{ background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)", p: 3, color: "white", position: "relative", overflow: "hidden" }}>
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
              background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)",
            }}
          >
            {replyMutation.isPending ? t("complaints@sending") : t("complaints@sendReply")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Mark as Solved Follow-up Dialog ── */}
      <Dialog
        open={markSolvedOpen}
        onClose={() => { setMarkSolvedOpen(false); setMarkSolvedTarget(null); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box sx={{ background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)", p: 2.5, color: "white", display: "flex", alignItems: "center", gap: 1.5 }}>
          <CheckCircleIcon />
          <Typography variant="h6" fontWeight={700}>{t("complaints@markSolvedTitle")}</Typography>
        </Box>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1">{t("complaints@markSolvedMessage")}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => { setMarkSolvedOpen(false); setMarkSolvedTarget(null); }} variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>
            {t("complaints@keepStatus")}
          </Button>
          <Button
            onClick={handleConfirmMarkSolved}
            color="success"
            variant="contained"
            disabled={statusMutation.isPending}
            startIcon={statusMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {t("complaints@markSolved")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
