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
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PersonIcon from "@mui/icons-material/Person";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import { useAdjustPoints } from "../hooks/use-loyalty";

type AdjustmentType = "add" | "deduct";

export default function PointAdjustmentsScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const adjustMutation = useAdjustPoints();

  // ── Adjust Points state ──────────────────────────────────────────────────
  const [userId, setUserId] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("add");
  const [pointsAmount, setPointsAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const isAdd = adjustmentType === "add";
  const accentColor = isAdd ? "success" : "error";
  const accentBorder = isAdd ? "#2e7d32" : "#c62828";
  const previewPts = pointsAmount ? parseInt(pointsAmount, 10) : null;
  const hasValidPreview = previewPts !== null && !isNaN(previewPts) && previewPts > 0;

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
      const finalPoints = isAdd ? points : -points;
      adjustMutation.mutate(
        { userId: userIdNum, points: finalPoints, note: note.trim() },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t(isAdd ? "loyalty@pointsAddedSuccess" : "loyalty@pointsDeductedSuccess") });
            setUserId(""); setPointsAmount(""); setNote("");
          },
          onError: (err: Error) => { openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }); },
        }
      );
    },
    [userId, pointsAmount, note, isAdd, adjustMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  return (
    <AppScreenContainer>
      <ScreenHeader
        icon={<AccountBalanceWalletIcon />}
        title={t("pointAdjustments")}
        subtitle={t("loyalty@pointAdjustmentsSubtitle")}
      />

      <Box sx={{ mt: 3, maxWidth: 640 }}>
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          {t("loyalty@pointAdjustmentsInfo")}
        </Alert>

        {/* ── Adjust Points Card ── */}
        <Card
          elevation={4}
          sx={{
            borderRadius: 3,
            borderLeft: `4px solid ${accentBorder}`,
            transition: "border-color 0.25s ease",
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Card header */}
            <Paper
              elevation={0}
              sx={{
                px: 3,
                py: 2.5,
                bgcolor: isAdd ? "success.50" : "error.50",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                transition: "background-color 0.25s ease",
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: `${accentColor}.main`,
                    width: 46,
                    height: 46,
                    transition: "background-color 0.25s ease",
                  }}
                >
                  {isAdd ? <AddCircleIcon /> : <RemoveCircleIcon />}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight={700} color={`${accentColor}.dark`}>
                    {t("loyalty@adjustUserPoints")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("loyalty@pointAdjustmentsSubtitle")}
                  </Typography>
                </Box>
                {/* Live preview chip */}
                {hasValidPreview && (
                  <Chip
                    label={`${isAdd ? "+" : "−"}${previewPts} pts`}
                    color={accentColor}
                    variant="filled"
                    sx={{ fontWeight: 700, fontSize: "0.9rem", px: 0.5 }}
                  />
                )}
              </Stack>
            </Paper>

            <Divider />

            <Box sx={{ p: 3 }}>
              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>

                  {/* Adjustment Type Toggle */}
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      sx={{ mb: 1, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      {t("loyalty@adjustmentType")}
                    </Typography>
                    <ToggleButtonGroup
                      value={adjustmentType}
                      exclusive
                      onChange={(_, v) => { if (v) setAdjustmentType(v); }}
                      fullWidth
                      size="medium"
                    >
                      <ToggleButton
                        value="add"
                        sx={{
                          py: 1.2,
                          fontWeight: 600,
                          gap: 1,
                          color: "success.main",
                          borderColor: "success.main",
                          "&.Mui-selected": {
                            bgcolor: "success.main",
                            color: "#fff",
                            "&:hover": { bgcolor: "success.dark" },
                          },
                        }}
                      >
                        <AddCircleIcon fontSize="small" />
                        {t("loyalty@addPoints")}
                      </ToggleButton>
                      <ToggleButton
                        value="deduct"
                        sx={{
                          py: 1.2,
                          fontWeight: 600,
                          gap: 1,
                          color: "error.main",
                          borderColor: "error.main",
                          "&.Mui-selected": {
                            bgcolor: "error.main",
                            color: "#fff",
                            "&:hover": { bgcolor: "error.dark" },
                          },
                        }}
                      >
                        <RemoveCircleIcon fontSize="small" />
                        {t("loyalty@deductPoints")}
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* User ID */}
                  <TextField
                    label={t("loyalty@userId")}
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                    fullWidth
                    type="number"
                    placeholder={t("loyalty@enterUserId")}
                    helperText={t("loyalty@userIdHelp")}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Points Amount */}
                  <TextField
                    label={t("loyalty@pointsAmount")}
                    value={pointsAmount}
                    onChange={(e) => setPointsAmount(e.target.value)}
                    required
                    fullWidth
                    type="number"
                    placeholder="100"
                    color={accentColor}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">pts</InputAdornment>,
                    }}
                    helperText={t("loyalty@pointsAmountHelp")}
                  />

                  {/* Note */}
                  <TextField
                    label={t("note")}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    required
                    fullWidth
                    multiline
                    rows={3}
                    placeholder={t("loyalty@notePlaceholder")}
                    helperText={t("loyalty@noteHelp")}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}>
                          <EditNoteIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Submit */}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={adjustMutation.isPending}
                    startIcon={
                      adjustMutation.isPending
                        ? <CircularProgress size={20} color="inherit" />
                        : isAdd ? <AddCircleIcon /> : <RemoveCircleIcon />
                    }
                    color={accentColor}
                    sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: "1rem", transition: "all 0.25s" }}
                  >
                    {adjustMutation.isPending
                      ? t("loyalty@processing")
                      : isAdd ? t("loyalty@addPoints") : t("loyalty@deductPoints")}
                  </Button>
                </Stack>
              </form>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AppScreenContainer>
  );
}
