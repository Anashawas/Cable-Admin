import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  Grid,
  LinearProgress,
  InputAdornment,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import LaunchIcon from "@mui/icons-material/Launch";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  getNotificationBatches,
  getNotificationTypes,
} from "../services/notification-service";
import BatchDetailDialog from "./BatchDetailDialog";

export default function NotificationHistoryTab() {
  const { t, i18n } = useTranslation("notifications");

  // Filters & pagination
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [notificationTypeId, setNotificationTypeId] = useState<number | "">("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Detail dialog
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const { data: notificationTypes = [] } = useQuery({
    queryKey: ["notifications", "types"],
    queryFn: ({ signal }) => getNotificationTypes(signal),
  });

  const queryParams = useMemo(
    () => ({
      pageNumber,
      pageSize,
      ...(notificationTypeId ? { notificationTypeId: Number(notificationTypeId) } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    }),
    [pageNumber, pageSize, notificationTypeId, fromDate, toDate]
  );

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["notification-batches", queryParams],
    queryFn: ({ signal }) => getNotificationBatches(queryParams, signal),
  });

  const hasActiveFilters = !!notificationTypeId || !!fromDate || !!toDate;

  const clearFilters = () => {
    setNotificationTypeId("");
    setFromDate("");
    setToDate("");
    setPageNumber(1);
  };

  const formatDate = (val: string) =>
    new Date(val).toLocaleString(i18n.language === "ar" ? "ar-KW" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Box>
      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "divider", mb: 2.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FilterListIcon sx={{ color: "primary.main" }} />
            <Typography variant="subtitle2" fontWeight={800} color="primary.main">{t("history.filters")}</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            {hasActiveFilters && (
              <Button
                size="small"
                color="error"
                startIcon={<CloseIcon />}
                onClick={clearFilters}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              >
                {t("history.clearFilters")}
              </Button>
            )}
            <Tooltip title={t("refresh")}>
              <IconButton size="small" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label={t("history.filterType")}
              value={notificationTypeId}
              onChange={(e) => { setNotificationTypeId(e.target.value ? Number(e.target.value) : ""); setPageNumber(1); }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            >
              <MenuItem value=""><em>{t("history.anyType")}</em></MenuItem>
              {notificationTypes.map((nt) => (
                <MenuItem key={nt.id} value={nt.id}>{nt.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label={t("history.fromDate")}
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPageNumber(1); }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><CalendarMonthIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>,
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label={t("history.toDate")}
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPageNumber(1); }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><CalendarMonthIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>,
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Batch list */}
      {error ? (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid", borderColor: "error.200", bgcolor: "error.50", textAlign: "center" }}>
          <Typography color="error.dark" fontWeight={700}>{t("loadingFailed")}</Typography>
        </Paper>
      ) : isLoading ? (
        <Stack spacing={1.5}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Paper key={i} elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
              <Stack spacing={1.25}>
                <Box sx={{ width: "60%", height: 16, bgcolor: "grey.200", borderRadius: 1 }} />
                <Box sx={{ width: "90%", height: 12, bgcolor: "grey.100", borderRadius: 1 }} />
                <Box sx={{ width: "100%", height: 8, bgcolor: "grey.100", borderRadius: 5, mt: 1 }} />
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : !data || data.batches.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, borderRadius: 3, border: "1px solid", borderColor: "divider", textAlign: "center" }}>
          <Box sx={{ width: 72, height: 72, borderRadius: "50%", mx: "auto", display: "flex", alignItems: "center", justifyContent: "center", mb: 2, border: "2px dashed", borderColor: "secondary.200", bgcolor: "secondary.50" }}>
            <NotificationsActiveIcon sx={{ fontSize: 32, color: "secondary.300" }} />
          </Box>
          <Typography variant="h6" fontWeight={700} color="text.secondary" gutterBottom>
            {t("history.emptyTitle")}
          </Typography>
          <Typography variant="body2" color="text.disabled">{t("history.emptyHint")}</Typography>
        </Paper>
      ) : (
        <>
          <Stack spacing={1.5}>
            {data.batches.map((batch) => {
              const rate = Math.min(100, Math.max(0, batch.readRate));
              return (
                <Paper
                  key={batch.batchId}
                  elevation={0}
                  onClick={() => setSelectedBatchId(batch.batchId)}
                  sx={{
                    borderRadius: 2.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderLeft: "4px solid",
                    borderLeftColor: "secondary.main",
                    cursor: "pointer",
                    overflow: "hidden",
                    transition: "all 0.15s",
                    "&:hover": { boxShadow: 4, borderColor: "secondary.300" },
                  }}
                >
                  {/* Header */}
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "flex-start" }} spacing={1} sx={{ px: 2.5, py: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                      <Avatar sx={{ bgcolor: "secondary.main", width: 42, height: 42, borderRadius: 2, flexShrink: 0 }}>
                        <NotificationsActiveIcon sx={{ fontSize: 22 }} />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Typography variant="subtitle1" fontWeight={800} sx={{ wordBreak: "break-word" }}>
                            {batch.title}
                          </Typography>
                          <Chip
                            label={batch.notificationTypeName}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ height: 20, fontWeight: 700, fontSize: "0.65rem" }}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, wordBreak: "break-word", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {batch.body}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75 }}>
                          <CalendarMonthIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                          <Typography variant="caption" color="text.disabled">{formatDate(batch.sentAt)}</Typography>
                        </Stack>
                      </Box>
                    </Stack>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      startIcon={<LaunchIcon sx={{ fontSize: 15 }} />}
                      onClick={(e) => { e.stopPropagation(); setSelectedBatchId(batch.batchId); }}
                      sx={{
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: 2,
                        fontSize: "0.75rem",
                        boxShadow: "0 2px 8px rgba(106,27,154,0.3)",
                        flexShrink: 0,
                      }}
                    >
                      {t("history.viewDetails")}
                    </Button>
                  </Stack>

                  <Divider />

                  {/* Stats */}
                  <Stack direction="row" sx={{ bgcolor: "grey.50" }} divider={<Divider orientation="vertical" flexItem />}>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, textAlign: "center" }}>
                      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                        <PeopleIcon sx={{ fontSize: 16, color: "primary.main" }} />
                        <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                          {t("history.totalRecipients")}
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={900} color="primary.dark" sx={{ mt: 0.25 }}>{batch.totalRecipients}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, textAlign: "center" }}>
                      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                        <MarkEmailReadIcon sx={{ fontSize: 16, color: "success.main" }} />
                        <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                          {t("history.readCount")}
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={900} color="success.dark" sx={{ mt: 0.25 }}>{batch.readCount}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, px: 2, py: 1.5, textAlign: "center" }}>
                      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                        <MarkEmailUnreadIcon sx={{ fontSize: 16, color: "warning.main" }} />
                        <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                          {t("history.unreadCount")}
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={900} color="warning.dark" sx={{ mt: 0.25 }}>{batch.unreadCount}</Typography>
                    </Box>
                  </Stack>

                  {/* Read rate bar */}
                  <Box sx={{ px: 2.5, py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                        {t("history.readRate")}
                      </Typography>
                      <Typography variant="body2" fontWeight={800} color="success.dark">
                        {batch.readRate.toFixed(2)}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={rate}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: "grey.200",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 4,
                          background: "linear-gradient(90deg, #2e7d32 0%, #66bb6a 100%)",
                        },
                      }}
                    />
                  </Box>
                </Paper>
              );
            })}
          </Stack>

          {/* Pagination */}
          <Paper elevation={0} sx={{ mt: 2, p: 1.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {t("history.showing", {
                    from: (data.pageNumber - 1) * data.pageSize + 1,
                    to: Math.min(data.pageNumber * data.pageSize, data.totalCount),
                    total: data.totalCount,
                  })}
                </Typography>
                <TextField
                  select
                  size="small"
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPageNumber(1); }}
                  sx={{ minWidth: 80, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                >
                  {[10, 20, 50, 100].map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ArrowBackIosIcon sx={{ fontSize: 14 }} />}
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={!data.hasPreviousPage}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, minWidth: 100 }}
                >
                  {t("history.prev")}
                </Button>
                <Chip
                  label={`${data.pageNumber} / ${data.totalPages || 1}`}
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: 800 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  endIcon={<ArrowForwardIosIcon sx={{ fontSize: 14 }} />}
                  onClick={() => setPageNumber((p) => p + 1)}
                  disabled={!data.hasNextPage}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, minWidth: 100 }}
                >
                  {t("history.next")}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </>
      )}

      <BatchDetailDialog
        batchId={selectedBatchId}
        open={!!selectedBatchId}
        onClose={() => setSelectedBatchId(null)}
      />
    </Box>
  );
}
