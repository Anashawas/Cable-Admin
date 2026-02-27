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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Paper,
  Avatar,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BlockIcon from "@mui/icons-material/Block";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import { useAdjustPoints, useBlockUser, useUnblockUser } from "../hooks/use-loyalty";

type AdjustmentType = "add" | "deduct";

export default function PointAdjustmentsScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const adjustMutation = useAdjustPoints();
  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();

  // Adjust points form
  const [userId, setUserId] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("add");
  const [pointsAmount, setPointsAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // Block/unblock user form
  const [blockTab, setBlockTab] = useState<0 | 1>(0);
  const [blockUserId, setBlockUserId] = useState<string>("");
  const [blockReason, setBlockReason] = useState<string>("");
  const [blockUntil, setBlockUntil] = useState<string>("");
  const [unblockUserId, setUnblockUserId] = useState<string>("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!userId || !userId.trim()) { openErrorSnackbar({ message: t("loyalty@userIdRequired") }); return; }
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum) || userIdNum <= 0) { openErrorSnackbar({ message: t("loyalty@invalidUserId") }); return; }
      if (!pointsAmount || !pointsAmount.trim()) { openErrorSnackbar({ message: t("loyalty@pointsRequired") }); return; }
      const points = parseInt(pointsAmount, 10);
      if (isNaN(points) || points <= 0) { openErrorSnackbar({ message: t("loyalty@invalidPoints") }); return; }
      if (!note || !note.trim()) { openErrorSnackbar({ message: t("loyalty@noteRequired") }); return; }
      const finalPoints = adjustmentType === "add" ? points : -points;
      adjustMutation.mutate(
        { userId: userIdNum, points: finalPoints, note: note.trim() },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t(adjustmentType === "add" ? "loyalty@pointsAddedSuccess" : "loyalty@pointsDeductedSuccess") });
            setUserId(""); setPointsAmount(""); setNote("");
          },
          onError: (err: Error) => { openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }); },
        }
      );
    },
    [userId, pointsAmount, note, adjustmentType, adjustMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const handleBlockUser = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const id = parseInt(blockUserId, 10);
      if (isNaN(id) || id <= 0) { openErrorSnackbar({ message: t("loyalty@invalidUserId") }); return; }
      if (!blockReason.trim()) { openErrorSnackbar({ message: t("loyalty@blockReasonRequired") }); return; }
      blockUserMutation.mutate(
        { userId: id, reason: blockReason.trim(), blockUntil: blockUntil ? new Date(blockUntil).toISOString() : null },
        {
          onSuccess: () => { openSuccessSnackbar({ message: t("loyalty@userBlocked") }); setBlockUserId(""); setBlockReason(""); setBlockUntil(""); },
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
        onSuccess: () => { openSuccessSnackbar({ message: t("loyalty@userUnblocked") }); setUnblockUserId(""); },
        onError: (err: Error) => { openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }); },
      });
    },
    [unblockUserId, unblockUserMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  return (
    <AppScreenContainer>
      <ScreenHeader
        icon={<AccountBalanceWalletIcon />}
        title={t("pointAdjustments")}
        subtitle={t("loyalty@pointAdjustmentsSubtitle")}
      />

      <Box sx={{ mt: 3, maxWidth: 600 }}>
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          {t("loyalty@pointAdjustmentsInfo")}
        </Alert>

        {/* Adjust Points Card */}
        <Card elevation={6} sx={{ borderRadius: 3, mb: 4 }}>
          <CardContent sx={{ p: 0 }}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: "primary.50", borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
                  <AccountBalanceWalletIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600} color="primary.dark">{t("adjustUserPoints")}</Typography>
                  <Typography variant="body2" color="text.secondary">{t("loyalty@pointAdjustmentsSubtitle")}</Typography>
                </Box>
              </Stack>
            </Paper>
            <Divider />
            <Box sx={{ p: 3 }}>
              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <TextField label={t("userId")} value={userId} onChange={(e) => setUserId(e.target.value)} required fullWidth type="number" placeholder={t("loyalty@enterUserId")} helperText={t("loyalty@userIdHelp")} />
                  <FormControl fullWidth required>
                    <InputLabel>{t("adjustmentType")}</InputLabel>
                    <Select value={adjustmentType} label={t("adjustmentType")} onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}>
                      <MenuItem value="add"><Stack direction="row" spacing={1} alignItems="center"><AddCircleIcon color="success" fontSize="small" /><span>{t("addPoints")}</span></Stack></MenuItem>
                      <MenuItem value="deduct"><Stack direction="row" spacing={1} alignItems="center"><RemoveCircleIcon color="error" fontSize="small" /><span>{t("deductPoints")}</span></Stack></MenuItem>
                    </Select>
                  </FormControl>
                  <TextField label={t("pointsAmount")} value={pointsAmount} onChange={(e) => setPointsAmount(e.target.value)} required fullWidth type="number" placeholder="100" InputProps={{ endAdornment: <InputAdornment position="end">pts</InputAdornment> }} helperText={t("loyalty@pointsAmountHelp")} />
                  <TextField label={t("note")} value={note} onChange={(e) => setNote(e.target.value)} required fullWidth multiline rows={3} placeholder={t("loyalty@notePlaceholder")} helperText={t("loyalty@noteHelp")} />
                  <Button type="submit" variant="contained" size="large" fullWidth disabled={adjustMutation.isPending}
                    startIcon={adjustMutation.isPending ? <CircularProgress size={20} /> : adjustmentType === "add" ? <AddCircleIcon /> : <RemoveCircleIcon />}
                    color={adjustmentType === "add" ? "success" : "error"} sx={{ py: 1.5, borderRadius: 2, fontWeight: 600, fontSize: "1rem" }}>
                    {adjustMutation.isPending ? t("processing") : adjustmentType === "add" ? t("addPoints") : t("deductPoints")}
                  </Button>
                </Stack>
              </form>
            </Box>
          </CardContent>
        </Card>

        {/* Block / Unblock User Card */}
        <Card elevation={6} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: "error.50", borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "error.main", width: 48, height: 48 }}><BlockIcon /></Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600} color="error.dark">{t("loyalty@blockUnblockUser")}</Typography>
                  <Typography variant="body2" color="text.secondary">{t("loyalty@blockUnblockUserSubtitle")}</Typography>
                </Box>
              </Stack>
            </Paper>
            <Tabs value={blockTab} onChange={(_, v) => setBlockTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
              <Tab label={t("loyalty@blockUser")} icon={<BlockIcon fontSize="small" />} iconPosition="start" />
              <Tab label={t("loyalty@unblockUser")} icon={<LockOpenIcon fontSize="small" />} iconPosition="start" />
            </Tabs>
            <Box sx={{ p: 3 }}>
              {blockTab === 0 ? (
                <form onSubmit={handleBlockUser}>
                  <Stack spacing={3}>
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>{t("loyalty@blockUserInfo")}</Alert>
                    <TextField label={t("userId")} value={blockUserId} onChange={(e) => setBlockUserId(e.target.value)} required fullWidth type="number" placeholder={t("loyalty@enterUserId")} />
                    <TextField label={t("loyalty@blockReason")} value={blockReason} onChange={(e) => setBlockReason(e.target.value)} required fullWidth multiline rows={2} placeholder={t("loyalty@blockReasonPlaceholder")} />
                    <TextField label={t("loyalty@blockUntil")} value={blockUntil} onChange={(e) => setBlockUntil(e.target.value)} fullWidth type="datetime-local" helperText={t("loyalty@blockUntilHelp")} InputLabelProps={{ shrink: true }} />
                    <Button type="submit" variant="contained" color="error" size="large" fullWidth disabled={blockUserMutation.isPending}
                      startIcon={blockUserMutation.isPending ? <CircularProgress size={20} /> : <BlockIcon />}
                      sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}>
                      {blockUserMutation.isPending ? t("processing") : t("loyalty@blockUser")}
                    </Button>
                  </Stack>
                </form>
              ) : (
                <form onSubmit={handleUnblockUser}>
                  <Stack spacing={3}>
                    <Alert severity="info" sx={{ borderRadius: 2 }}>{t("loyalty@unblockUserInfo")}</Alert>
                    <TextField label={t("userId")} value={unblockUserId} onChange={(e) => setUnblockUserId(e.target.value)} required fullWidth type="number" placeholder={t("loyalty@enterUserId")} />
                    <Button type="submit" variant="contained" color="success" size="large" fullWidth disabled={unblockUserMutation.isPending}
                      startIcon={unblockUserMutation.isPending ? <CircularProgress size={20} /> : <LockOpenIcon />}
                      sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}>
                      {unblockUserMutation.isPending ? t("processing") : t("loyalty@unblockUser")}
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
