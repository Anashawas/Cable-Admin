import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  Box,
  Stack,
  Typography,
  IconButton,
  CircularProgress,
  Chip,
  Paper,
  Button,
  Avatar,
  MenuItem,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import InboxIcon from "@mui/icons-material/Inbox";
import { getUserNotifications } from "../services/notification-service";

type ReadFilter = "all" | "read" | "unread";

interface UserNotificationsDialogProps {
  userId: number | null;
  userName?: string | null;
  open: boolean;
  onClose: () => void;
}

export default function UserNotificationsDialog({
  userId,
  userName,
  open,
  onClose,
}: UserNotificationsDialogProps) {
  const { t, i18n } = useTranslation("notifications");

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");

  const queryParams = useMemo(() => {
    const p: Record<string, unknown> = {
      pageNumber,
      pageSize,
      ...(userId ? { userId } : {}),
    };
    if (readFilter === "read") p.isRead = true;
    else if (readFilter === "unread") p.isRead = false;
    return p;
  }, [pageNumber, pageSize, readFilter, userId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-notifications", userId, queryParams],
    queryFn: ({ signal }) => getUserNotifications(queryParams, signal),
    enabled: !!userId && open,
  });

  const formatDate = (val: string | null) => {
    if (!val) return "—";
    return new Date(val).toLocaleString(i18n.language === "ar" ? "ar-KW" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "92vh" } }}
    >
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #4a148c 0%, #6a1b9a 55%, #7b1fa2 100%)",
          p: 3,
          color: "white",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Box sx={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <InboxIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>{t("userInbox.title")}</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                {userName || `User #${userId}`}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "rgba(255,255,255,0.12)" } }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Filters */}
        <ToggleButtonGroup
          value={readFilter}
          exclusive
          size="small"
          onChange={(_e, v) => { if (v) { setReadFilter(v); setPageNumber(1); } }}
          sx={{
            mt: 2.5,
            bgcolor: "rgba(255,255,255,0.12)",
            borderRadius: 2,
            "& .MuiToggleButton-root": {
              color: "rgba(255,255,255,0.75)",
              border: "none",
              px: 2,
              py: 0.75,
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.8rem",
              borderRadius: "8px !important",
              "&.Mui-selected": {
                bgcolor: "rgba(255,255,255,0.25)",
                color: "white",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
              },
            },
          }}
        >
          <ToggleButton value="all">{t("all")}</ToggleButton>
          <ToggleButton value="read">
            <MarkEmailReadIcon sx={{ fontSize: 16, mr: 0.5 }} />
            {t("userInbox.read")}
          </ToggleButton>
          <ToggleButton value="unread">
            <MarkEmailUnreadIcon sx={{ fontSize: 16, mr: 0.5 }} />
            {t("userInbox.unread")}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <DialogContent sx={{ p: 0, overflowY: "auto", flex: 1 }}>
        {isLoading ? (
          <Box sx={{ p: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography color="error">{t("loadingFailed")}</Typography>
          </Box>
        ) : !data || data.notifications.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Box sx={{ width: 72, height: 72, borderRadius: "50%", mx: "auto", display: "flex", alignItems: "center", justifyContent: "center", mb: 2, border: "2px dashed", borderColor: "secondary.200", bgcolor: "secondary.50" }}>
              <InboxIcon sx={{ fontSize: 32, color: "secondary.300" }} />
            </Box>
            <Typography variant="h6" fontWeight={700} color="text.secondary" gutterBottom>
              {t("userInbox.emptyTitle")}
            </Typography>
            <Typography variant="body2" color="text.disabled">{t("userInbox.emptyHint")}</Typography>
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            <Stack spacing={1.25}>
              {data.notifications.map((n) => (
                <Paper
                  key={n.id}
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: n.isRead ? "divider" : "secondary.200",
                    borderLeft: "4px solid",
                    borderLeftColor: n.isRead ? "grey.300" : "secondary.main",
                    bgcolor: n.isRead ? "background.paper" : "secondary.50",
                    overflow: "hidden",
                    transition: "box-shadow 0.15s",
                    "&:hover": { boxShadow: 2 },
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ p: 2 }}>
                    <Avatar sx={{ bgcolor: n.isRead ? "grey.300" : "secondary.main", color: n.isRead ? "text.secondary" : "white", width: 42, height: 42, borderRadius: 2, flexShrink: 0 }}>
                      {n.isRead ? <MarkEmailReadIcon sx={{ fontSize: 22 }} /> : <NotificationsActiveIcon sx={{ fontSize: 22 }} />}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ wordBreak: "break-word", color: n.isRead ? "text.primary" : "secondary.dark" }}>
                          {n.title}
                        </Typography>
                        <Chip
                          label={n.notificationTypeName}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ height: 18, fontWeight: 700, fontSize: "0.6rem" }}
                        />
                        {!n.isRead && (
                          <Chip
                            icon={<MarkEmailUnreadIcon sx={{ fontSize: "12px !important" }} />}
                            label={t("userInbox.unread")}
                            size="small"
                            color="warning"
                            sx={{ height: 18, fontWeight: 700, fontSize: "0.6rem" }}
                          />
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", mb: 1 }}>
                        {n.body}
                      </Typography>
                      {n.deepLink && (
                        <Box sx={{ mb: 0.5 }}>
                          <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}>
                            {n.deepLink}
                          </Typography>
                        </Box>
                      )}
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <CalendarMonthIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                        <Typography variant="caption" color="text.disabled">
                          {formatDate(n.createdAt)}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>

            {/* Pagination */}
            <Paper elevation={0} sx={{ mt: 2, p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
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
                    {[10, 20, 50].map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </TextField>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ArrowBackIosIcon sx={{ fontSize: 12 }} />}
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={!data.hasPreviousPage}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, minWidth: 90 }}
                  >
                    {t("history.prev")}
                  </Button>
                  <Chip
                    label={`${data.pageNumber} / ${data.totalPages || 1}`}
                    color="secondary"
                    variant="filled"
                    sx={{ fontWeight: 800 }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<ArrowForwardIosIcon sx={{ fontSize: 12 }} />}
                    onClick={() => setPageNumber((p) => p + 1)}
                    disabled={!data.hasNextPage}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, minWidth: 90 }}
                  >
                    {t("history.next")}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
