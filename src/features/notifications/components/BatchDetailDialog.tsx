import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Avatar,
  Divider,
  Paper,
  LinearProgress,
  Button,
  Tooltip,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PeopleIcon from "@mui/icons-material/People";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LaunchIcon from "@mui/icons-material/Launch";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SearchIcon from "@mui/icons-material/Search";
import { getNotificationBatchById } from "../services/notification-service";

type RecipientFilter = "all" | "read" | "unread";

interface BatchDetailDialogProps {
  batchId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function BatchDetailDialog({ batchId, open, onClose }: BatchDetailDialogProps) {
  const { t, i18n } = useTranslation("notifications");
  const navigate = useNavigate();

  const [filter, setFilter] = useState<RecipientFilter>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["notification-batch", batchId],
    queryFn: ({ signal }) => getNotificationBatchById(batchId!, signal),
    enabled: !!batchId && open,
  });

  const filteredRecipients = useMemo(() => {
    if (!data) return [];
    let list = data.recipients;
    if (filter === "read") list = list.filter((r) => r.isRead);
    else if (filter === "unread") list = list.filter((r) => !r.isRead);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        (r.userName ?? "").toLowerCase().includes(q) ||
        (r.phone ?? "").toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        String(r.userId).includes(q)
      );
    }
    return list;
  }, [data, filter, search]);

  const formatDate = (val: string) =>
    new Date(val).toLocaleString(i18n.language === "ar" ? "ar-KW" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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
              <NotificationsActiveIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>{t("history.batchDetailTitle")}</Typography>
              {data && (
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>
                  {data.title}
                </Typography>
              )}
            </Box>
          </Stack>
          <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { bgcolor: "rgba(255,255,255,0.12)" } }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {data && (
          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            <Chip
              label={data.notificationTypeName}
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "white", fontWeight: 700 }}
            />
            <Chip
              icon={<CalendarMonthIcon sx={{ fontSize: "16px !important", color: "rgba(255,255,255,0.8) !important" }} />}
              label={formatDate(data.sentAt)}
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)" }}
            />
          </Stack>
        )}
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
        ) : data ? (
          <Box sx={{ p: 3 }}>
            {/* Body */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2.5, bgcolor: "grey.50" }}>
              <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.8, display: "block", mb: 0.75 }}>
                {t("send.body")}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {data.body}
              </Typography>
              {data.deepLink && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.8, display: "block", mb: 0.5 }}>
                    {t("send.deepLink")}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{data.deepLink}</Typography>
                </Box>
              )}
              {data.data && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.8, display: "block", mb: 0.5 }}>
                    {t("send.data")}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{data.data}</Typography>
                </Box>
              )}
            </Paper>

            {/* Stats */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2.5 }}>
              <Paper elevation={0} sx={{ flex: 1, p: 2, borderRadius: 2, border: "1px solid", borderColor: "primary.200", bgcolor: "primary.50" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <PeopleIcon sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography variant="caption" fontWeight={700} color="primary.dark" sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                    {t("history.totalRecipients")}
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={900} color="primary.dark">{data.totalRecipients}</Typography>
              </Paper>
              <Paper elevation={0} sx={{ flex: 1, p: 2, borderRadius: 2, border: "1px solid", borderColor: "success.200", bgcolor: "success.50" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <MarkEmailReadIcon sx={{ fontSize: 18, color: "success.main" }} />
                  <Typography variant="caption" fontWeight={700} color="success.dark" sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                    {t("history.readCount")}
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={900} color="success.dark">{data.readCount}</Typography>
              </Paper>
              <Paper elevation={0} sx={{ flex: 1, p: 2, borderRadius: 2, border: "1px solid", borderColor: "warning.200", bgcolor: "warning.50" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <MarkEmailUnreadIcon sx={{ fontSize: 18, color: "warning.main" }} />
                  <Typography variant="caption" fontWeight={700} color="warning.dark" sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
                    {t("history.unreadCount")}
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={900} color="warning.dark">{data.unreadCount}</Typography>
              </Paper>
            </Stack>

            {/* Read rate bar */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider", mb: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>{t("history.readRate")}</Typography>
                <Typography variant="h6" fontWeight={800} color="success.dark">
                  {data.readRate.toFixed(2)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, Math.max(0, data.readRate))}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: "grey.200",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 5,
                    background: "linear-gradient(90deg, #2e7d32 0%, #66bb6a 100%)",
                  },
                }}
              />
            </Paper>

            {/* Recipients */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={800}>
                {t("history.recipients")} ({filteredRecipients.length})
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <ToggleButtonGroup
                  value={filter}
                  exclusive
                  size="small"
                  onChange={(_e, v) => v && setFilter(v)}
                  sx={{
                    "& .MuiToggleButton-root": {
                      fontWeight: 700,
                      textTransform: "none",
                      fontSize: "0.75rem",
                      px: 1.5,
                      borderRadius: "8px !important",
                    },
                  }}
                >
                  <ToggleButton value="all">{t("all")}</ToggleButton>
                  <ToggleButton value="read">{t("history.readFilter")}</ToggleButton>
                  <ToggleButton value="unread">{t("history.unreadFilter")}</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>

            <TextField
              fullWidth
              size="small"
              placeholder={t("history.searchRecipients")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1.5, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />

            <Stack spacing={1}>
              {filteredRecipients.length === 0 ? (
                <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 2, border: "1px dashed", borderColor: "divider" }}>
                  <PeopleIcon sx={{ fontSize: 36, color: "grey.400", mb: 1 }} />
                  <Typography variant="body2" color="text.disabled">{t("history.noRecipients")}</Typography>
                </Paper>
              ) : (
                filteredRecipients.map((r) => (
                  <Paper
                    key={r.userId}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: r.isRead ? "success.200" : "warning.200",
                      borderLeft: "4px solid",
                      borderLeftColor: r.isRead ? "success.main" : "warning.main",
                      "&:hover": { boxShadow: 2 },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: r.isRead ? "success.main" : "warning.main", width: 38, height: 38 }}>
                        <PersonIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {r.userName || `User #${r.userId}`}
                          </Typography>
                          <Chip
                            icon={r.isRead ? <MarkEmailReadIcon sx={{ fontSize: "13px !important" }} /> : <MarkEmailUnreadIcon sx={{ fontSize: "13px !important" }} />}
                            label={r.isRead ? t("history.read") : t("history.unread")}
                            size="small"
                            color={r.isRead ? "success" : "warning"}
                            sx={{ height: 20, fontWeight: 700, fontSize: "0.65rem" }}
                          />
                        </Stack>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.25 }}>
                          <Typography variant="caption" color="text.secondary">#{r.userId}</Typography>
                          {r.phone && (
                            <Stack direction="row" spacing={0.3} alignItems="center">
                              <PhoneIcon sx={{ fontSize: 12, color: "text.disabled" }} />
                              <Typography variant="caption" color="text.secondary">{r.phone}</Typography>
                            </Stack>
                          )}
                          {r.email && (
                            <Stack direction="row" spacing={0.3} alignItems="center" sx={{ minWidth: 0 }}>
                              <EmailIcon sx={{ fontSize: 12, color: "text.disabled" }} />
                              <Typography variant="caption" color="text.secondary" noWrap>{r.email}</Typography>
                            </Stack>
                          )}
                        </Stack>
                      </Box>
                      <Tooltip title={t("history.viewUser")}>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<LaunchIcon sx={{ fontSize: 14 }} />}
                          onClick={() => {
                            navigate(`/users/${r.userId}/edit`);
                            onClose();
                          }}
                          sx={{
                            fontWeight: 700,
                            textTransform: "none",
                            fontSize: "0.72rem",
                            borderRadius: 1.5,
                            px: 1.25,
                            minWidth: 0,
                            boxShadow: "0 2px 6px rgba(13,71,161,0.25)",
                          }}
                        >
                          {t("history.view")}
                        </Button>
                      </Tooltip>
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
