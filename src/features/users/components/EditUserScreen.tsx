import { useEffect, useMemo, useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Grid,
  TextField,
  Stack,
  Typography,
  CircularProgress,
  FormControlLabel,
  Switch,
  MenuItem,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import InboxIcon from "@mui/icons-material/Inbox";
import UserNotificationsDialog from "../../notifications/components/UserNotificationsDialog";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import LockResetIcon from "@mui/icons-material/LockReset";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CloseIcon from "@mui/icons-material/Close";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { getUserById, updateUserProfile, changeUserPassword, changeUserPhone } from "../services/user-service";
import { editUserFormSchema, type EditUserFormValues } from "../validators/edit-user-schema";
import { DEFAULT_ROLES, PROVIDER_ROLE_ID } from "../constants/roles";
import type { UserDetailDto, RoleDto } from "../types/api";
import { useSnackbarStore } from "../../../stores";
import UserCarsSection from "./UserCarsSection";

function buildRoleOptions(user: UserDetailDto | undefined): RoleDto[] {
  const list = [...DEFAULT_ROLES];
  const current = user?.role;
  if (current && !list.some((r) => r.id === current.id)) {
    list.push({ id: current.id, name: current.name ?? `Role ${current.id}` });
  }
  return list;
}

export default function EditUserScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const userId = id ? parseInt(id, 10) : NaN;
  const validId = Number.isFinite(userId) && userId > 0;

  const { data: user, isLoading: loadingUser, error, refetch: refetchUser } = useQuery({
    queryKey: ["users", "detail", userId],
    queryFn: ({ signal }) => getUserById(userId, signal),
    enabled: validId,
  });

  const updateMutation = useMutation({
    mutationFn: (values: EditUserFormValues) =>
      updateUserProfile(userId, {
        name: values.name,
        email: values.email,
        country: values.country ?? null,
        city: values.city ?? null,
        isActive: values.isActive,
        roleId: values.roleId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      openSuccessSnackbar({ message: t("userManagement@updated") });
      navigate("/users");
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const roleOptions = useMemo(() => buildRoleOptions(user), [user]);

  const makeProviderMutation = useMutation({
    mutationFn: () =>
      updateUserProfile(userId, {
        name: user!.name,
        email: user!.email,
        isActive: user!.isActive,
        roleId: PROVIDER_ROLE_ID,
        country: user!.country ?? null,
        city: user!.city ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "detail", userId] });
      openSuccessSnackbar({ message: t("userManagement@roleChangedToProvider") });
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  // ── Change password ─────────────────────────────────────────────────────
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: (password: string) => changeUserPassword(userId, password),
    onSuccess: () => {
      openSuccessSnackbar({ message: t("userManagement@passwordChanged") });
      setPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail
        || err?.response?.data?.title
        || err?.message
        || t("loadingFailed");
      openErrorSnackbar({ message: detail });
    },
  });

  const handleOpenPasswordDialog = useCallback(() => {
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setPasswordDialogOpen(true);
  }, []);

  const handleClosePasswordDialog = useCallback(() => {
    if (changePasswordMutation.isPending) return;
    setPasswordDialogOpen(false);
  }, [changePasswordMutation.isPending]);

  const handleSubmitPassword = useCallback(() => {
    if (newPassword.length < 6) {
      openErrorSnackbar({ message: t("userManagement@passwordMinLength") });
      return;
    }
    if (newPassword !== confirmPassword) {
      openErrorSnackbar({ message: t("userManagement@passwordsDoNotMatch") });
      return;
    }
    changePasswordMutation.mutate(newPassword);
  }, [newPassword, confirmPassword, changePasswordMutation, openErrorSnackbar, t]);

  // ── Change phone ────────────────────────────────────────────────────────
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");

  const changePhoneMutation = useMutation({
    mutationFn: (phoneNumber: string) => changeUserPhone(userId, phoneNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "detail", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      openSuccessSnackbar({ message: t("userManagement@phoneChanged") });
      setPhoneDialogOpen(false);
      setNewPhone("");
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail
        || err?.response?.data?.title
        || err?.message
        || t("loadingFailed");
      openErrorSnackbar({ message: detail });
    },
  });

  const handleOpenPhoneDialog = useCallback(() => {
    setNewPhone(user?.phone ?? "");
    setPhoneDialogOpen(true);
  }, [user?.phone]);

  const handleClosePhoneDialog = useCallback(() => {
    if (changePhoneMutation.isPending) return;
    setPhoneDialogOpen(false);
  }, [changePhoneMutation.isPending]);

  const handleSubmitPhone = useCallback(() => {
    const trimmed = newPhone.trim();
    if (!trimmed) {
      openErrorSnackbar({ message: t("userManagement@phoneRequired") });
      return;
    }
    changePhoneMutation.mutate(trimmed);
  }, [newPhone, changePhoneMutation, openErrorSnackbar, t]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      country: null,
      city: null,
      isActive: true,
      roleId: 2,
    },
  });

  useEffect(() => {
    if (!user) return;
    reset({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      country: user.country ?? null,
      city: user.city ?? null,
      isActive: user.isActive ?? true,
      roleId: user.role?.id ?? 2,
    });
  }, [user, reset]);

  const handleBack = useCallback(() => {
    navigate("/users");
  }, [navigate]);

  const onSubmit = useCallback(
    (values: EditUserFormValues) => {
      updateMutation.mutate(values);
    },
    [updateMutation]
  );

  const handleSendNotification = useCallback(() => {
    if (!Number.isNaN(userId) && userId > 0) {
      navigate("/send-notification", { state: { userId } });
    }
  }, [navigate, userId]);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const handleViewNotifications = useCallback(() => {
    setNotificationsOpen(true);
  }, []);

  const headerActions = useMemo(
    () => [
      {
        id: "view-notifications",
        icon: <InboxIcon />,
        label: t("userManagement@viewNotifications"),
        onClick: handleViewNotifications,
      },
      {
        id: "send-notification",
        icon: <NotificationsActiveIcon />,
        label: t("userManagement@sendNotification"),
        onClick: handleSendNotification,
      },
      {
        id: "back",
        icon: <ArrowBackIcon />,
        label: t("back"),
        onClick: handleBack,
      },
    ],
    [t, handleBack, handleSendNotification, handleViewNotifications]
  );

  if (!validId) {
    return (
      <AppScreenContainer>
        <Box p={2}>
          <Typography color="error">{t("userManagement@invalidId")}</Typography>
          <Button onClick={handleBack} sx={{ mt: 1 }}>
            {t("back")}
          </Button>
        </Box>
      </AppScreenContainer>
    );
  }

  if (error) {
    return (
      <AppScreenContainer>
        <Box p={2}>
          <Typography color="error">{t("loadingFailed")}</Typography>
          <Button onClick={handleBack} sx={{ mt: 1 }}>
            {t("back")}
          </Button>
        </Box>
      </AppScreenContainer>
    );
  }

  if (loadingUser && !user) {
    return (
      <AppScreenContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      </AppScreenContainer>
    );
  }

  return (
    <AppScreenContainer>
      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          boxSizing: "border-box",
          p: { xs: 1, sm: 2 },
        }}
      >
        <Stack spacing={3}>
          <ScreenHeader
            title={t("userManagement@editTitle")}
            actions={headerActions}
          />

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            sx={{ maxWidth: 640 }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t("userManagement@form.name")}
                      fullWidth
                      required
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="email"
                      label={t("userManagement@form.email")}
                      fullWidth
                      required
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t("userManagement@form.phone")}
                      fullWidth
                      disabled
                      helperText={t("userManagement@form.phoneReadOnly")}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      label={t("userManagement@form.country")}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      label={t("userManagement@form.city")}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="roleId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label={t("userManagement@form.role")}
                      fullWidth
                      required
                      error={!!errors.roleId}
                      helperText={errors.roleId?.message}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      {roleOptions.map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={t("userManagement@form.isActive")}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} sx={{ mt: 3 }} flexWrap="wrap">
              <Button
                type="submit"
                variant="contained"
                disabled={updateMutation.isPending || !isDirty}
              >
                {updateMutation.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  t("save")
                )}
              </Button>
              <Button type="button" onClick={handleBack} color="inherit">
                {t("cancel")}
              </Button>
              {user && user.role?.id !== PROVIDER_ROLE_ID && (
                <Button
                  type="button"
                  variant="outlined"
                  color="primary"
                  startIcon={makeProviderMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <BusinessCenterIcon />}
                  disabled={makeProviderMutation.isPending}
                  onClick={() => makeProviderMutation.mutate()}
                >
                  {t("userManagement@makeProviderAction")}
                </Button>
              )}
              <Button
                type="button"
                variant="outlined"
                color="warning"
                startIcon={<LockResetIcon />}
                onClick={handleOpenPasswordDialog}
              >
                {t("userManagement@changePassword")}
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="info"
                startIcon={<PhoneIphoneIcon />}
                onClick={handleOpenPhoneDialog}
              >
                {t("userManagement@changePhone")}
              </Button>
            </Stack>
          </Box>

          {user && (
            <UserCarsSection
              userId={user.id}
              userCars={user.userCars}
              onRefresh={() => refetchUser()}
            />
          )}
        </Stack>
      </Box>

      {/* ── Change Password Dialog ── */}
      <Dialog
        open={passwordDialogOpen}
        onClose={handleClosePasswordDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 36, height: 36, bgcolor: "warning.100", color: "warning.dark" }}>
              <LockResetIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {t("userManagement@changePassword")}
              </Typography>
              {user && (
                <Typography variant="caption" color="text.secondary">
                  {user.name} · {user.email}
                </Typography>
              )}
            </Box>
          </Stack>
          <IconButton size="small" onClick={handleClosePasswordDialog} disabled={changePasswordMutation.isPending}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 3 }}>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              {t("userManagement@changePasswordHint")}
            </Typography>

            <TextField
              label={t("userManagement@form.newPassword")}
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              size="small"
              autoFocus
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword((s) => !s)} edge="end">
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label={t("userManagement@form.confirmPassword")}
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              size="small"
              autoComplete="new-password"
              error={confirmPassword.length > 0 && newPassword !== confirmPassword}
              helperText={
                confirmPassword.length > 0 && newPassword !== confirmPassword
                  ? t("userManagement@passwordsDoNotMatch")
                  : t("userManagement@passwordMinLength")
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
          <Button
            onClick={handleClosePasswordDialog}
            disabled={changePasswordMutation.isPending}
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmitPassword}
            variant="contained"
            color="warning"
            disabled={changePasswordMutation.isPending || !newPassword || !confirmPassword}
            startIcon={changePasswordMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <LockResetIcon />}
            sx={{ borderRadius: 2, minWidth: 120, fontWeight: 600 }}
          >
            {changePasswordMutation.isPending ? t("userManagement@changing") : t("userManagement@changePassword")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Change Phone Dialog ── */}
      <Dialog
        open={phoneDialogOpen}
        onClose={handleClosePhoneDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 36, height: 36, bgcolor: "info.100", color: "info.dark" }}>
              <PhoneIphoneIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {t("userManagement@changePhone")}
              </Typography>
              {user && (
                <Typography variant="caption" color="text.secondary">
                  {user.name} · {user.phone ?? "—"}
                </Typography>
              )}
            </Box>
          </Stack>
          <IconButton size="small" onClick={handleClosePhoneDialog} disabled={changePhoneMutation.isPending}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3, py: 3 }}>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              {t("userManagement@changePhoneHint")}
            </Typography>

            <TextField
              label={t("userManagement@form.newPhone")}
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              fullWidth
              size="small"
              autoFocus
              type="tel"
              placeholder="+962790000000"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIphoneIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
          <Button
            onClick={handleClosePhoneDialog}
            disabled={changePhoneMutation.isPending}
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmitPhone}
            variant="contained"
            color="info"
            disabled={changePhoneMutation.isPending || !newPhone.trim()}
            startIcon={changePhoneMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <PhoneIphoneIcon />}
            sx={{ borderRadius: 2, minWidth: 120, fontWeight: 600 }}
          >
            {changePhoneMutation.isPending ? t("userManagement@changing") : t("userManagement@changePhone")}
          </Button>
        </DialogActions>
      </Dialog>

      <UserNotificationsDialog
        userId={!Number.isNaN(userId) && userId > 0 ? userId : null}
        userName={user?.name ?? null}
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </AppScreenContainer>
  );
}
