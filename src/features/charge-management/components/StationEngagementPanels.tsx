import { useTranslation } from "react-i18next";
import { useInfiniteQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import PersonIcon from "@mui/icons-material/Person";

import {
  getStationFollowers,
  getStationSentNotifications,
} from "../services/station-engagement-service";

const PAGE_SIZE = 50;

/** Formats an ISO date to a short readable string; empty for null/invalid. */
function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

/** Maps a notification status to an MUI chip color. */
function statusColor(status: string): "success" | "warning" | "error" | "default" {
  switch (status?.toLowerCase()) {
    case "sent":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "error";
    default:
      return "default";
  }
}

interface PanelProps {
  stationId: number | null;
  enabled?: boolean;
}

/** The users who favorited (follow) the station. */
export function StationFollowersPanel({ stationId, enabled = true }: PanelProps) {
  const { t } = useTranslation();
  const query = useInfiniteQuery({
    queryKey: ["station-followers", stationId],
    queryFn: ({ pageParam, signal }) =>
      getStationFollowers(stationId as number, pageParam, PAGE_SIZE, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNextPage ? last.page + 1 : undefined),
    enabled: enabled && stationId != null,
  });

  const followers = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.totalCount ?? followers.length;

  return (
    <QueryBody
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={followers.length === 0}
      errorText={t("loadingFailed")}
      emptyText={t("chargeManagement@engagement.noFollowers")}
    >
      <CountHeader label={t("chargeManagement@engagement.followers")} count={total} />
      <List disablePadding>
        {followers.map((f) => (
          <ListItem key={f.userId} divider>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: "primary.light" }}>
                {f.name?.[0]?.toUpperCase() ?? <PersonIcon />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={f.name || `#${f.userId}`}
              secondary={[f.city, fmtDate(f.favoritedAt)].filter(Boolean).join(" · ")}
            />
          </ListItem>
        ))}
      </List>
      <LoadMore
        show={!!query.hasNextPage}
        loading={query.isFetchingNextPage}
        onClick={() => query.fetchNextPage()}
        label={t("chargeManagement@engagement.loadMore")}
      />
    </QueryBody>
  );
}

/** The notifications the station owner sent to the station's followers. */
export function StationNotificationsPanel({ stationId, enabled = true }: PanelProps) {
  const { t } = useTranslation();
  const query = useInfiniteQuery({
    queryKey: ["station-sent-notifications", stationId],
    queryFn: ({ pageParam, signal }) =>
      getStationSentNotifications(stationId as number, pageParam, PAGE_SIZE, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNextPage ? last.page + 1 : undefined),
    enabled: enabled && stationId != null,
  });

  const notifications = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.totalCount ?? notifications.length;

  return (
    <QueryBody
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={notifications.length === 0}
      errorText={t("loadingFailed")}
      emptyText={t("chargeManagement@engagement.noNotifications")}
    >
      <CountHeader label={t("chargeManagement@engagement.notifications")} count={total} />
      <List disablePadding>
        {notifications.map((n) => (
          <ListItem key={n.id} divider alignItems="flex-start">
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {n.title || "—"}
                  </Typography>
                  {n.typeName ? <Chip label={n.typeName} size="small" variant="outlined" /> : null}
                  <Chip
                    label={t(`chargeManagement@engagement.status.${n.status?.toLowerCase() || "sent"}`, n.status)}
                    size="small"
                    color={statusColor(n.status)}
                    variant="filled"
                  />
                </Stack>
              }
              secondary={
                <>
                  {n.body ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {n.body}
                    </Typography>
                  ) : null}
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
                    {[
                      fmtDate(n.sentAt),
                      n.sentByName || "",
                      n.recipientsCount != null
                        ? t("chargeManagement@engagement.recipients", { count: n.recipientsCount })
                        : "",
                      n.readCount != null
                        ? t("chargeManagement@engagement.read", { count: n.readCount })
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Typography>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
      <LoadMore
        show={!!query.hasNextPage}
        loading={query.isFetchingNextPage}
        onClick={() => query.fetchNextPage()}
        label={t("chargeManagement@engagement.loadMore")}
      />
    </QueryBody>
  );
}

function CountHeader({ label, count }: { label: string; count: number }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      fontWeight={700}
      sx={{ px: 2, py: 1, display: "block" }}
    >
      {label} · {count}
    </Typography>
  );
}

function LoadMore({
  show,
  loading,
  onClick,
  label,
}: {
  show: boolean;
  loading: boolean;
  onClick: () => void;
  label: string;
}) {
  if (!show) return null;
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
      <Button onClick={onClick} disabled={loading} size="small">
        {loading ? <CircularProgress size={18} /> : label}
      </Button>
    </Box>
  );
}

function QueryBody({
  isLoading,
  isError,
  isEmpty,
  errorText,
  emptyText,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  errorText: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (isError) {
    return (
      <Box sx={{ py: 6, textAlign: "center", px: 3 }}>
        <Typography color="error">{errorText}</Typography>
      </Box>
    );
  }
  if (isEmpty) {
    return (
      <Box sx={{ py: 6, textAlign: "center", px: 3 }}>
        <Typography color="text.secondary">{emptyText}</Typography>
      </Box>
    );
  }
  return <>{children}</>;
}
