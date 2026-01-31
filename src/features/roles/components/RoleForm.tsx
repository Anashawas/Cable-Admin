import { memo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  FormHelperText,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Role, CreateRoleRequest, UpdateRoleRequest } from "../types/api";
import RoleFormHeader from "./RoleFormHeader";
import { usePrivileges } from "../hooks/use-privileges";
import { useRoleById } from "../hooks/use-role-by-id";

interface RoleFormProps {
  open: boolean;
  role: Role | null;
  editMode: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRoleRequest | UpdateRoleRequest) => void;
}

interface FormData {
  name: string;
  privilegeIds: number[];
}

const RoleForm = ({
  open,
  role,
  editMode,
  isSubmitting,
  onClose,
  onSubmit,
}: RoleFormProps) => {
  const { t } = useTranslation();

  // Fetch privileges using the usePrivileges hook
  const { data: privileges, isLoading: isLoadingPrivileges } = usePrivileges({
    name: null,
    code: null,
  });

  // Fetch full role details with privileges when editing
  const { data: roleDetails, isLoading: isLoadingRoleDetails } = useRoleById(
    { id: role?.id || 0 },
    open && editMode && !!role?.id
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      privilegeIds: [],
    }
  });

  useEffect(() => {
    if (editMode && roleDetails) {
      // Use full role details with privileges when editing
      reset({
        name: roleDetails.name || "",
        privilegeIds: roleDetails.rolePrivileges?.map(rp => rp.privilegeId) || [],
      });
    } else if (!editMode) {
      // Reset form for create mode
      reset({
        name: "",
        privilegeIds: [],
      });
    }
  }, [roleDetails, editMode, reset, open]);

  const onFormSubmit = (data: FormData) => {
    const formattedData = {
      name: data.name,
      privilegeIds: data.privilegeIds.length > 0 ? data.privilegeIds : null,
      ...(editMode && role ? { id: role.id } : {}),
    };

    onSubmit(formattedData as CreateRoleRequest | UpdateRoleRequest);
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
      <RoleFormHeader
        editMode={editMode}
        isSubmitting={isSubmitting}
        onClose={onClose}
      />

      <DialogContent sx={{ p: 3 }}>
        {isLoadingRoleDetails && editMode ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box component="form">
            <Grid container spacing={2}>
            {/* Row 1: Role Name */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="name"
                control={control}
                rules={{ required: t("roles@form.validation.nameRequired") }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t("roles@form.name")}
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>

            {/* Row 2: Privileges */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="privilegeIds"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.privilegeIds}>
                    <InputLabel id="privileges-label">{t("roles@form.privileges")}</InputLabel>
                    <Select
                      {...field}
                      labelId="privileges-label"
                      multiple
                      input={<OutlinedInput label={t("roles@form.privileges")} />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as number[]).map((value) => {
                            const privilege = privileges?.find(p => p.id === value);
                            return (
                              <Chip
                                key={value}
                                label={privilege?.name || value}
                                size="small"
                              />
                            );
                          })}
                        </Box>
                      )}
                      disabled={isSubmitting || isLoadingPrivileges}
                      MenuProps={{
                        sx: {
                          zIndex: 10000,
                        },
                        PaperProps: {
                          style: {
                            maxHeight: 400,
                          },
                        },
                      }}
                    >
                      {privileges?.map((privilege) => (
                        <MenuItem key={privilege.id} value={privilege.id}>
                          {privilege.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.privilegeIds && (
                      <FormHelperText>{errors.privilegeIds.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t("roles@form.cancel")}
        </Button>
        <Button
          onClick={handleSubmit(onFormSubmit)}
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {editMode ? t("roles@form.update") : t("roles@form.create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(RoleForm);
