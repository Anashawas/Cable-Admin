import { useEffect, useMemo, useCallback } from "react";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { getUserById, updateUserProfile } from "../services/user-service";
import { editUserFormSchema, type EditUserFormValues } from "../validators/edit-user-schema";
import { DEFAULT_ROLES } from "../constants/roles";
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
        phone: values.phone,
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

  const headerActions = useMemo(
    () => [
      {
        id: "back",
        icon: <ArrowBackIcon />,
        label: t("back"),
        onClick: handleBack,
      },
    ],
    [t, handleBack]
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

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
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
    </AppScreenContainer>
  );
}
