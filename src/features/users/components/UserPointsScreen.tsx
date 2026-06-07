import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Alert,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Skeleton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import EditNoteIcon from "@mui/icons-material/EditNote";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useSnackbarStore } from "../../../stores";
import { getUserById } from "../services/user-service";
import { useAdjustPoints } from "../../loyalty/hooks/use-loyalty";

type AdjustmentType = "add" | "deduct";

export default function UserPointsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);

  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const adjustMutation = useAdjustPoints();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["users", "detail", userId],
    queryFn: () => getUserById(userId),
    enabled: Number.isFinite(userId) && userId > 0,
    staleTime: 30 * 1000,
  });

  // ── Adjust form state ──────────────────────────────────────────────────────
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("add");
  const [pointsAmount, setPointsAmount] = useState("");
  const [note, setNote] = useState("");

  const isAdd = adjustmentType === "add";
  const accentColor = isAdd ? "success" : "error";
  const previewPts = pointsAmount ? parseInt(pointsAmount, 10) : null;
  const hasValidPreview = previewPts !== null && !isNaN(previewPts) && previewPts > 0;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!Number.isFinite(userId) || userId <= 0) { openErrorSnackbar({ message: t("loyalty@invalidUserId") }); return; }
      const points = parseInt(pointsAmount, 10);
      if (isNaN(points) || points <= 0) { openErrorSnackbar({ message: t("loyalty@invalidPoints") }); return; }
      if (!note.trim()) { openErrorSnackbar({ message: t("loyalty@noteRequired") }); return; }
      const finalPoints = isAdd ? points : -points;
      adjustMutation.mutate(
        { userId, points: finalPoints, note: note.trim() },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t(isAdd ? "loyalty@pointsAddedSuccess" : "loyalty@pointsDeductedSuccess") });
            setPointsAmount(""); setNote("");
          },
          onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
        }
      );
    },
    [userId, pointsAmount, note, isAdd, adjustMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const initials = (user?.name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2.5} sx={{ maxWidth: 680, mx: "auto" }}>

          {/* ── Gradient header with user identity ── */}
          <Box
            sx={{
              background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 55%, #388e3c 100%)",
              borderRadius: 3, p: { xs: 2.5, md: 3 }, color: "white",
              position: "relative", overflow: "hidden",
            }}
          >
            <Box sx={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)" }} />
            <Stack direction="row" spacing={2} alignItems="center">
              <Tooltip title={t("back")}>
                <IconButton onClick={() => navigate(-1)} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56, fontWeight: 700, fontSize: 20 }}>
                {userLoading ? "" : initials}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                {userLoading ? (
                  <Skeleton variant="text" width={180} sx={{ bgcolor: "rgba(255,255,255,0.3)" }} />
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="h5" fontWeight={800} noWrap>{user?.name ?? "—"}</Typography>
                    <Chip label={`#${userId}`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700 }} />
                  </Stack>
                )}
                <Stack direction="row" spacing={2} sx={{ mt: 0.5, opacity: 0.85 }} flexWrap="wrap">
                  {user?.email && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <EmailIcon sx={{ fontSize: 15 }} />
                      <Typography variant="caption">{user.email}</Typography>
                    </Stack>
                  )}
                  {user?.phone && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <PhoneIcon sx={{ fontSize: 15 }} />
                      <Typography variant="caption">{user.phone}</Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>

          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {t("loyalty@pointAdjustmentsInfo")}
          </Alert>

          {/* ── Adjust points form ── */}
          <Paper elevation={2} sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2.5, py: 1.75, bgcolor: isAdd ? "success.main" : "error.main", transition: "background-color 0.25s" }}>
              {isAdd ? <AddCircleIcon sx={{ color: "#fff" }} /> : <RemoveCircleIcon sx={{ color: "#fff" }} />}
              <Typography variant="subtitle1" fontWeight={700} color="#fff" flex={1}>
                {t("loyalty@adjustUserPoints")}
              </Typography>
              {hasValidPreview && (
                <Chip label={`${isAdd ? "+" : "−"}${previewPts} ${t("loyalty@pts")}`} sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 700 }} />
              )}
            </Stack>
            <Box sx={{ p: 2.5 }}>
              <form onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <ToggleButtonGroup
                    value={adjustmentType}
                    exclusive
                    onChange={(_, v) => { if (v) setAdjustmentType(v); }}
                    fullWidth
                  >
                    <ToggleButton value="add" sx={{ py: 1.1, fontWeight: 600, gap: 1, color: "success.main", borderColor: "success.main", "&.Mui-selected": { bgcolor: "success.main", color: "#fff", "&:hover": { bgcolor: "success.dark" } } }}>
                      <AddCircleIcon fontSize="small" />{t("loyalty@addPoints")}
                    </ToggleButton>
                    <ToggleButton value="deduct" sx={{ py: 1.1, fontWeight: 600, gap: 1, color: "error.main", borderColor: "error.main", "&.Mui-selected": { bgcolor: "error.main", color: "#fff", "&:hover": { bgcolor: "error.dark" } } }}>
                      <RemoveCircleIcon fontSize="small" />{t("loyalty@deductPoints")}
                    </ToggleButton>
                  </ToggleButtonGroup>

                  <TextField
                    label={t("loyalty@pointsAmount")}
                    value={pointsAmount}
                    onChange={(e) => setPointsAmount(e.target.value)}
                    required fullWidth type="number" placeholder="100"
                    color={accentColor}
                    InputProps={{ endAdornment: <InputAdornment position="end">{t("loyalty@pts")}</InputAdornment> }}
                    helperText={t("loyalty@pointsAmountHelp")}
                  />

                  <TextField
                    label={t("loyalty@note")}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    required fullWidth multiline rows={3}
                    placeholder={t("loyalty@notePlaceholder")}
                    helperText={t("loyalty@noteHelp")}
                    InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}><EditNoteIcon fontSize="small" color="action" /></InputAdornment> }}
                  />

                  <Button
                    type="submit" variant="contained" size="large" fullWidth
                    disabled={adjustMutation.isPending || userLoading}
                    color={accentColor}
                    startIcon={adjustMutation.isPending ? <CircularProgress size={20} color="inherit" /> : isAdd ? <AddCircleIcon /> : <RemoveCircleIcon />}
                    sx={{ py: 1.4, borderRadius: 2, fontWeight: 700 }}
                  >
                    {adjustMutation.isPending ? t("loyalty@processing") : isAdd ? t("loyalty@addPoints") : t("loyalty@deductPoints")}
                  </Button>
                </Stack>
              </form>
            </Box>
          </Paper>

          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/users")} sx={{ alignSelf: "flex-start", textTransform: "none" }}>
            {t("userManagement@backToUsers")}
          </Button>
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
