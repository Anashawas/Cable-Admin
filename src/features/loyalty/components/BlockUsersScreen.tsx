import { useState, useCallback } from "react";
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
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PersonIcon from "@mui/icons-material/Person";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import { useBlockUser, useUnblockUser } from "../hooks/use-loyalty";

export default function BlockUsersScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();

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

  return (
    <AppScreenContainer>
      <ScreenHeader
        icon={<BlockIcon />}
        title={t("loyalty@blockUnblockUser")}
        subtitle={t("loyalty@blockUnblockUserSubtitle")}
      />

      <Box sx={{ mt: 3, maxWidth: 640 }}>
        <Card elevation={4} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Header */}
            <Paper
              elevation={0}
              sx={{
                px: 3, py: 2.5,
                background: blockTab === 0
                  ? "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)"
                  : "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                transition: "background 0.3s ease",
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
      </Box>
    </AppScreenContainer>
  );
}
