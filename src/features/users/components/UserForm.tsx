import { memo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  MenuItem,
  Grid,
  Box,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { User, CreateUserRequest, UpdateUserRequest } from "../types/api";
import UserFormHeader from "./UserFormHeader";
import { useRoles } from "../hooks/use-roles";
import { GOVERNORATES } from "@/constants";

interface UserFormProps {
  open: boolean;
  user: User | null;
  editMode: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => void;
}

interface FormData {
  name: string;
  userName: string;
  email: string;
  password?: string;
  phone: string;
  civilId: string;
  roleId: number | string;
  governorateId: number | string;
  isLdap: boolean;
  isActive: boolean;
}

const UserForm = ({
  open,
  user,
  editMode,
  isSubmitting,
  onClose,
  onSubmit,
}: UserFormProps) => {
  const { t, i18n } = useTranslation();

  // Fetch roles using the useRoles hook
  const { data: roles, isLoading: isLoadingRoles } = useRoles({
    name: null,
    includeDeleted: false,
    includePrivileges: false,
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      userName: "",
      email: "",
      password: "",
      phone: "",
      civilId: "",
      roleId: "",
      governorateId: "",
      isLdap: false,
      isActive: true,
    }
  });

  // Watch form values for conditional logic
  const selectedRoleId = watch("roleId");
  const isLdap = watch("isLdap");

  // Role-based conditions
  const roleIdNumber = selectedRoleId ? Number(selectedRoleId) : null;
  const isSpecialRole = roleIdNumber && [2, 3, 4].includes(roleIdNumber); // Roles 2,3,4 have special rules
  const requiresCivilId = isSpecialRole; // Only roles 2,3,4 need civil ID
  const requiresGovernorate = roleIdNumber === 6; // Only role 6 requires governorate
  const showGovernorate = requiresGovernorate; // Show governorate only for role 6
  const showPassword = !isSpecialRole && !isLdap && !editMode; // Hide password for roles 2,3,4 and when LDAP is true
  const showUsername = !isSpecialRole; // Hide username for roles 2,3,4
  const showEmail = !isSpecialRole; // Hide email for roles 2,3,4

  // Auto-set isLdap to false for special roles (2, 3, 4)
  useEffect(() => {
    if (isSpecialRole) {
      setValue("isLdap", false);
    }
  }, [isSpecialRole, setValue]);

  useEffect(() => {
    if (user && editMode) {
      reset({
        name: user.name || "",
        userName: user.userName || "",
        email: user.email || "",
        phone: user.phone || "",
        civilId: user.civilId || "",
        roleId: user.role?.id || "",
        governorateId: user.governorate?.id || "",
        isLdap: user.isLdap || false,
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
    } else {
      reset({
        name: "",
        userName: "",
        email: "",
        password: "",
        phone: "",
        civilId: "",
        roleId: "",
        governorateId: "",
        isLdap: false,
        isActive: true,
      });
    }
  }, [user, editMode, reset, open]);

  const onFormSubmit = (data: FormData) => {
    const roleId = Number(data.roleId);
    const isSpecialRoleSubmit = [2, 3, 4].includes(roleId);

    const formattedData = {
      name: data.name,
      // For special roles (2,3,4), username is not needed, use civil ID instead
      userName: isSpecialRoleSubmit ? data.civilId || "" : data.userName,
      // Email: empty string for special roles
      email: isSpecialRoleSubmit ? "" : data.email,
      phone: data.phone,
      // Civil ID: null if not special role, otherwise use the value
      civilId: requiresCivilId ? (data.civilId || null) : null,
      roleId: roleId,
      // Governorate: only for role 6
      governorateId: requiresGovernorate ? (data.governorateId ? Number(data.governorateId) : null) : null,
      // isLdap: always false for special roles
      isLdap: isSpecialRoleSubmit ? false : data.isLdap,
      isActive: data.isActive,
      // Password: not needed for special roles or when LDAP is true
      ...(editMode ? {} : { password: (isSpecialRoleSubmit || data.isLdap) ? "" : (data.password || "") }), 

    };

    onSubmit(formattedData as CreateUserRequest | UpdateUserRequest);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          zIndex: 9999,
        },
        zIndex: 9999,
        "& .MuiBackdrop-root": {
          zIndex: 9998,
        },
      }}
    >
      <UserFormHeader
        editMode={editMode}
        isSubmitting={isSubmitting}
        onClose={onClose}
      />

      <DialogContent sx={{ p: 3 }}>
        <Box component="form">
          <Grid container spacing={2}>
            {/* Row 1: Role */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="roleId"
                control={control}
                rules={{ required: t("users@form.validation.roleRequired") }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label={t("users@form.role")}
                    fullWidth
                    error={!!errors.roleId}
                    helperText={errors.roleId?.message}
                    disabled={isSubmitting || isLoadingRoles}
                    SelectProps={{
                      MenuProps: {
                        sx: {
                          zIndex: 10000,
                        },
                      },
                    }}
                  >
                    <MenuItem value="">{t("users@form.selectRole")}</MenuItem>
                    {roles?.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Row 2: Name | Username */}
            <Grid size={{ xs: 12, sm: showUsername ? 6 : 12 }}>
              <Controller
                name="name"
                control={control}
                rules={{ required: t("users@form.validation.nameRequired") }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t("users@form.name")}
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>

            {showUsername && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="userName"
                  control={control}
                  rules={{ required: showUsername ? t("users@form.validation.userNameRequired") : false }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t("users@form.userName")}
                      fullWidth
                      error={!!errors.userName}
                      helperText={errors.userName?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Row 3: Email | Phone */}
            {showEmail && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: showEmail ? t("users@form.validation.emailRequired") : false,
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t("users@form.validation.emailInvalid")
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t("users@form.email")}
                      type="email"
                      fullWidth
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: showEmail ? 6 : 12 }}>
              <Controller
                name="phone"
                control={control}
                rules={{ required: t("users@form.validation.phoneRequired") }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t("users@form.phone")}
                    fullWidth
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>

            {/* Row 3: Password | Civil ID */}
            {showPassword && (
              <Grid size={{ xs: 12, sm: requiresCivilId ? 6 : 12 }}>
                <Controller
                  name="password"
                  control={control}
                  rules={{ required: showPassword ? t("users@form.validation.passwordRequired") : false }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t("users@form.password")}
                      type="password"
                      fullWidth
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
            )}

            {requiresCivilId && (
              <Grid size={{ xs: 12, sm: showPassword ? 6 : 12 }}>
                <Controller
                  name="civilId"
                  control={control}
                  rules={{ required: requiresCivilId ? t("users@form.validation.civilIdRequired") : false }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t("users@form.civilId")}
                      fullWidth
                      error={!!errors.civilId}
                      helperText={errors.civilId?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Row 4: Governorate (if role 6) */}
            {showGovernorate && (
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="governorateId"
                  control={control}
                  rules={{ required: requiresGovernorate ? t("users@form.validation.governorateRequired") : false }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label={t("users@form.governorate")}
                      fullWidth
                      error={!!errors.governorateId}
                      helperText={errors.governorateId?.message}
                      disabled={isSubmitting}
                      SelectProps={{
                        MenuProps: {
                          sx: {
                            zIndex: 10000,
                          },
                        },
                      }}
                    >
                      <MenuItem value="">{t("users@form.selectGovernorate")}</MenuItem>
                      {GOVERNORATES.map((gov) => (
                        <MenuItem key={gov.id} value={gov.id}>
                          {i18n.language === "ar" ? gov.arabicName : gov.englishName}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}

            {/* Row 5: isActive (edit mode only) */}
            {editMode && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          {...field}
                          checked={field.value}
                          disabled={isSubmitting}
                        />
                      }
                      label={t("users@form.isActive")}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Row 5: LDAP Switch (only show if not special role) */}
            {!isSpecialRole && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="isLdap"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          {...field}
                          checked={field.value}
                          disabled={isSubmitting}
                        />
                      }
                      label={t("users@form.isLdap")}
                    />
                  )}
                />
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t("users@form.cancel")}
        </Button>
        <Button
          onClick={handleSubmit(onFormSubmit)}
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {editMode ? t("users@form.update") : t("users@form.create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(UserForm);
