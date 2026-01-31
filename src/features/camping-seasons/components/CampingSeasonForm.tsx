import { memo, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { useTranslation } from "react-i18next";
import {
  CampingSeason,
  CreateCampingSeasonRequest,
  UpdateCampingSeasonRequest,
  CampingSeasonDetail,
} from "../types/api";
import { useRoles } from "../hooks/use-roles";
import CampingSeasonFormHeader from "./CampingSeasonFormHeader";

interface CampingSeasonFormProps {
  open: boolean;
  campingSeason: CampingSeason | null;
  editMode: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCampingSeasonRequest | UpdateCampingSeasonRequest) => void;
}

interface FormData {
  name: string;
  fromDate: string;
  toDate: string;
  safeDistanceCamps: number | string;
  campingSeasonDetails: Array<{
    id?: number | null;
    roleId: number | string;
    insuranceValue: number | string;
    feeValue: number | string;
    startDate: string;
    maxAreaSize: number | string;
    allowedReservationTimes: number | string;
  }>;
}

const CampingSeasonForm = ({
  open,
  campingSeason,
  editMode,
  isSubmitting,
  onClose,
  onSubmit,
}: CampingSeasonFormProps) => {
  const { t } = useTranslation();

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
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      fromDate: "",
      toDate: "",
      safeDistanceCamps: 1,
      campingSeasonDetails: [
        {
          roleId: "",
          insuranceValue: 0,
          feeValue: 0,
          startDate: "",
          maxAreaSize: 0,
          allowedReservationTimes: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "campingSeasonDetails",
  });

  useEffect(() => {
    if (campingSeason && editMode) {
      reset({
        name: campingSeason.name || "",
        fromDate: campingSeason.fromDate || "",
        toDate: campingSeason.toDate || "",
        safeDistanceCamps: campingSeason.safeDistanceCamps || 1,
        campingSeasonDetails:
          campingSeason.campingSeasonDetails && campingSeason.campingSeasonDetails.length > 0
            ? campingSeason.campingSeasonDetails.map((detail) => ({
                id: detail.id,
                roleId: detail.role?.id || detail.roleId || "",
                insuranceValue: detail.insuranceValue || 0,
                feeValue: detail.feeValue || 0,
                startDate: detail.startDate || "",
                maxAreaSize: detail.maxAreaSize || 0,
                allowedReservationTimes: detail.allowedReservationTimes || 1,
              }))
            : [
                {
                  roleId: "",
                  insuranceValue: 0,
                  feeValue: 0,
                  startDate: "",
                  maxAreaSize: 0,
                  allowedReservationTimes: 1,
                },
              ],
      });
    } else {
      reset({
        name: "",
        fromDate: "",
        toDate: "",
        safeDistanceCamps: 1,
        campingSeasonDetails: [
          {
            roleId: "",
            insuranceValue: 0,
            feeValue: 0,
            startDate: "",
            maxAreaSize: 0,
            allowedReservationTimes: 1,
          },
        ],
      });
    }
  }, [campingSeason, editMode, reset, open]);

  const onFormSubmit = (data: FormData) => {
    const formattedData = {
      ...(editMode && campingSeason ? { id: campingSeason.id } : {}),
      name: data.name,
      fromDate: data.fromDate,
      toDate: data.toDate,
      safeDistanceCamps: Number(data.safeDistanceCamps),
      campingSeasonDetails: data.campingSeasonDetails.map((detail) => ({
        ...(detail.id ? { id: detail.id } : {}),
        roleId: Number(detail.roleId),
        insuranceValue: Number(detail.insuranceValue),
        feeValue: Number(detail.feeValue),
        startDate: detail.startDate,
        maxAreaSize: Number(detail.maxAreaSize),
        allowedReservationTimes: Number(detail.allowedReservationTimes),
      })),
    };

    onSubmit(formattedData as CreateCampingSeasonRequest | UpdateCampingSeasonRequest);
  };

  const handleAddDetail = () => {
    append({
      roleId: "",
      insuranceValue: 0,
      feeValue: 0,
      startDate: "",
      maxAreaSize: 0,
      allowedReservationTimes: 1,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
      <CampingSeasonFormHeader
        editMode={editMode}
        isSubmitting={isSubmitting}
        onClose={onClose}
      />

      <DialogContent sx={{ p: 3 }}>
        {isSubmitting && editMode && !campingSeason ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        ) : (
          <Box component="form">
            <Grid container spacing={2}>
            {/* Season Basic Information */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                {t("campingSeasons@form.basicInformation")}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="name"
                control={control}
                rules={{ required: t("campingSeasons@form.validation.nameRequired") }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t("campingSeasons@form.name")}
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="safeDistanceCamps"
                control={control}
                rules={{ required: t("campingSeasons@form.validation.safeDistanceRequired") }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t("campingSeasons@form.safeDistanceCamps")}
                    type="number"
                    fullWidth
                    error={!!errors.safeDistanceCamps}
                    helperText={errors.safeDistanceCamps?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="fromDate"
                control={control}
                rules={{ required: t("campingSeasons@form.validation.fromDateRequired") }}
                render={({ field }) => (
                  <DatePicker
                    label={t("campingSeasons@form.fromDate")}
                    value={field.value ? new Date(field.value) : null}
                    onChange={(date) => {
                      if (!date) {
                        field.onChange(null);
                        return;
                      }
                      // Format to YYYY-MM-DD
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      field.onChange(`${year}-${month}-${day}`);
                    }}
                    disabled={isSubmitting}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.fromDate,
                        helperText: errors.fromDate?.message,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }
                      },
                      popper: {
                        sx: {
                          zIndex: 10000,
                        }
                      }
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="toDate"
                control={control}
                rules={{ required: t("campingSeasons@form.validation.toDateRequired") }}
                render={({ field }) => (
                  <DatePicker
                    label={t("campingSeasons@form.toDate")}
                    value={field.value ? new Date(field.value) : null}
                    onChange={(date) => {
                      if (!date) {
                        field.onChange(null);
                        return;
                      }
                      // Format to YYYY-MM-DD
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      field.onChange(`${year}-${month}-${day}`);
                    }}
                    disabled={isSubmitting}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.toDate,
                        helperText: errors.toDate?.message,
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }
                      },
                      popper: {
                        sx: {
                          zIndex: 10000,
                        }
                      }
                    }}
                  />
                )}
              />
            </Grid>

            {/* Season Details */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  {t("campingSeasons@form.seasonDetails")}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddDetail}
                  disabled={isSubmitting}
                >
                  {t("campingSeasons@form.addDetail")}
                </Button>
              </Box>
            </Grid>

            {fields.map((field, index) => (
              <Grid size={{ xs: 12 }} key={field.id}>
                <Box
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    position: "relative",
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1">
                      {t("campingSeasons@form.detail")} #{index + 1}
                    </Typography>
                    {fields.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => remove(index)}
                        disabled={isSubmitting}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Controller
                        name={`campingSeasonDetails.${index}.roleId`}
                        control={control}
                        rules={{
                          required: t("campingSeasons@form.validation.roleRequired"),
                        }}
                        render={({ field: roleField }) => (
                          <TextField
                            {...roleField}
                            select
                            label={t("campingSeasons@form.role")}
                            fullWidth
                            error={!!errors.campingSeasonDetails?.[index]?.roleId}
                            helperText={errors.campingSeasonDetails?.[index]?.roleId?.message}
                            disabled={isSubmitting || isLoadingRoles}
                            SelectProps={{
                              MenuProps: {
                                sx: {
                                  zIndex: 10000,
                                },
                              },
                            }}
                          >
                            <MenuItem value="">
                              {t("campingSeasons@form.selectRole")}
                            </MenuItem>
                            {roles?.map((role) => (
                              <MenuItem key={role.id} value={role.id}>
                                {role.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Controller
                        name={`campingSeasonDetails.${index}.insuranceValue`}
                        control={control}
                        rules={{
                          required: t("campingSeasons@form.validation.insuranceValueRequired"),
                        }}
                        render={({ field: insuranceField }) => (
                          <TextField
                            {...insuranceField}
                            label={t("campingSeasons@form.insuranceValue")}
                            type="number"
                            fullWidth
                            error={!!errors.campingSeasonDetails?.[index]?.insuranceValue}
                            helperText={
                              errors.campingSeasonDetails?.[index]?.insuranceValue?.message
                            }
                            disabled={isSubmitting}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Controller
                        name={`campingSeasonDetails.${index}.feeValue`}
                        control={control}
                        rules={{
                          required: t("campingSeasons@form.validation.feeValueRequired"),
                        }}
                        render={({ field: feeField }) => (
                          <TextField
                            {...feeField}
                            label={t("campingSeasons@form.feeValue")}
                            type="number"
                            fullWidth
                            error={!!errors.campingSeasonDetails?.[index]?.feeValue}
                            helperText={errors.campingSeasonDetails?.[index]?.feeValue?.message}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Controller
                        name={`campingSeasonDetails.${index}.startDate`}
                        control={control}
                        rules={{
                          required: t("campingSeasons@form.validation.startDateRequired"),
                        }}
                        render={({ field: startDateField }) => (
                          <DatePicker
                            label={t("campingSeasons@form.startDate")}
                            value={startDateField.value ? new Date(startDateField.value) : null}
                            onChange={(date) => {
                              if (!date) {
                                startDateField.onChange(null);
                                return;
                              }
                              // Format to YYYY-MM-DD
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              startDateField.onChange(`${year}-${month}-${day}`);
                            }}
                            disabled={isSubmitting}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.campingSeasonDetails?.[index]?.startDate,
                                helperText: errors.campingSeasonDetails?.[index]?.startDate?.message,
                                sx: {
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                  }
                                }
                              },
                              popper: {
                                sx: {
                                  zIndex: 10000,
                                }
                              }
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Controller
                        name={`campingSeasonDetails.${index}.maxAreaSize`}
                        control={control}
                        rules={{
                          required: t("campingSeasons@form.validation.maxAreaSizeRequired"),
                        }}
                        render={({ field: maxAreaField }) => (
                          <TextField
                            {...maxAreaField}
                            label={t("campingSeasons@form.maxAreaSize")}
                            type="number"
                            fullWidth
                            error={!!errors.campingSeasonDetails?.[index]?.maxAreaSize}
                            helperText={errors.campingSeasonDetails?.[index]?.maxAreaSize?.message}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Controller
                        name={`campingSeasonDetails.${index}.allowedReservationTimes`}
                        control={control}
                        rules={{
                          required: t(
                            "campingSeasons@form.validation.allowedReservationTimesRequired"
                          ),
                        }}
                        render={({ field: timesField }) => (
                          <TextField
                            {...timesField}
                            label={t("campingSeasons@form.allowedReservationTimes")}
                            type="number"
                            fullWidth
                            error={
                              !!errors.campingSeasonDetails?.[index]?.allowedReservationTimes
                            }
                            helperText={
                              errors.campingSeasonDetails?.[index]?.allowedReservationTimes
                                ?.message
                            }
                            disabled={isSubmitting}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t("campingSeasons@form.cancel")}
        </Button>
        <Button
          onClick={handleSubmit(onFormSubmit)}
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {editMode ? t("campingSeasons@form.update") : t("campingSeasons@form.create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(CampingSeasonForm);
