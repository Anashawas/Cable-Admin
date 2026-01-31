import { memo } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import { Person as PersonIcon, Comment as CommentIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLanguageStore } from "../../../stores";
import type { RefundComment } from "../types/comments";

interface RefundCommentsProps {
  comments: RefundComment[];
  isLoading: boolean;
  error: string | null;
}

const RefundComments = ({
  comments,
  isLoading,
  error,
}: RefundCommentsProps) => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t("refunds@comments.noDate");
    
    try {
      const date = new Date(dateString);
      return format(date, "PPp", {
        locale: language === "ar" ? ar : enUS,
      });
    } catch {
      return t("refunds@comments.invalidDate");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="150px"
      >
        <CircularProgress size={30} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        <Typography variant="body2">
          {t("refunds@comments.errorLoading")}: {error}
        </Typography>
      </Alert>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="150px"
        textAlign="center"
      >
        <CommentIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {t("refunds@comments.noComments")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <List sx={{ width: "100%", bgcolor: "background.paper", p: 0 }}>
        {comments.map((comment, index) => (
          <Box key={comment.id}>
            <ListItem alignItems="flex-start" sx={{ px: 0, py: 2 }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  {comment.user?.name ? (
                    getInitials(comment.user.name)
                  ) : (
                    <PersonIcon />
                  )}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography
                      variant="subtitle2"
                      color="text.primary"
                      fontWeight="medium"
                    >
                      {comment.user?.name || t("refunds@comments.unknownUser")}
                    </Typography>
                    {comment.user?.applicationRole?.name && (
                      <Chip
                        label={comment.user.applicationRole.name}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ fontSize: "0.75rem" }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ mb: 1, lineHeight: 1.5 }}
                    >
                      {comment.description}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      {formatDate(comment.createdAt)}
                    </Typography>
                    {comment.user?.email && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontSize: "0.7rem" }}
                      >
                        {comment.user.email}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
            {index < comments.length - 1 && (
              <Divider variant="inset" component="li" />
            )}
          </Box>
        ))}
      </List>
    </Box>
  );
};

export default memo(RefundComments);