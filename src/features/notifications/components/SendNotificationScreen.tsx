import { useCallback, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  CircularProgress,
  FormControlLabel,
  Switch,
  Paper,
  Grid,
} from "@mui/material";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { getNotificationTypes, sendNotification } from "../services/notification-service";
import {
  sendNotificationFormSchema,
  parseUserIds,
  type SendNotificationFormValues,
} from "../validators/send-notification-schema";
import type { SendNotificationRequest } from "../types/api";
import { useSnackbarStore } from "../../../stores";

function isOfferType(typeName: string | undefined): boolean {
  return (typeName ?? "").toLowerCase().includes("offer");
}

/** Normalize time to HH:MM:SS (browser time input may return HH:MM). */
function toTimeString(value: string | null | undefined): string {
  if (!value) return "00:00:00";
  const parts = value.trim().split(":");
  if (parts.length >= 3) return value.trim();
  if (parts.length === 2) return `${parts[0]}:${parts[1]}:00`;
  return "00:00:00";
}

export default function SendNotificationScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data: notificationTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ["notifications", "types"],
    queryFn: ({ signal }) => getNotificationTypes(signal),
  });

  const sendMutation = useMutation({
    mutationFn: (payload: SendNotificationRequest) => sendNotification(payload),
    onSuccess: () => {
      openSuccessSnackbar({ message: t("notifications@send.success") });
      reset(defaultValues);
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const defaultValues: SendNotificationFormValues = useMemo(
    () => ({
      notificationTypeId: 0,
      title: "",
      body: "",
      isForAll: true,
      userIdsString: "",
      offerDate: "",
      offerTime: "",
      deepLink: null,
      data: null,
    }),
    []
  );

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SendNotificationFormValues>({
    resolver: zodResolver(sendNotificationFormSchema),
    defaultValues,
  });

  const isForAll = watch("isForAll");
  const notificationTypeId = watch("notificationTypeId");
  const selectedType = useMemo(
    () => notificationTypes.find((t) => t.id === notificationTypeId),
    [notificationTypes, notificationTypeId]
  );
  const showOfferSchedule = isOfferType(selectedType?.name);

  const onSubmit = useCallback(
    (values: SendNotificationFormValues) => {
      if (showOfferSchedule) {
        if (!values.offerDate?.trim() || !values.offerTime?.trim()) {
          openErrorSnackbar({ message: t("notifications@send.offerDateRequired") });
          return;
        }
      }

      const payload: SendNotificationRequest = {
        notificationTypeId: values.notificationTypeId,
        title: values.title.trim(),
        body: values.body.trim(),
        isForAll: values.isForAll,
        userIds: values.isForAll ? null : parseUserIds(values.userIdsString),
        deepLink: values.deepLink?.trim() || null,
        data: values.data?.trim() || null,
        time: showOfferSchedule && values.offerDate && values.offerTime
          ? `${values.offerDate.trim()} ${toTimeString(values.offerTime)}`
          : null,
      };

      sendMutation.mutate(payload);
    },
    [showOfferSchedule, sendMutation, openErrorSnackbar, t]
  );

  return (
    <AppScreenContainer>
      <Box sx={{ width: "100%", minWidth: 0, p: { xs: 1, sm: 2 } }}>
        <Stack spacing={3}>
          <ScreenHeader title={t("notifications@send.title")} />

          <Paper variant="outlined" sx={{ p: 2, maxWidth: 640 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              {t("notifications@send.formTitle")}
            </Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack spacing={2.5} sx={{ mt: 2 }}>
                <Controller
                  name="notificationTypeId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label={t("notifications@send.type")}
                      fullWidth
                      required
                      error={!!errors.notificationTypeId}
                      helperText={errors.notificationTypeId?.message}
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      disabled={loadingTypes}
                    >
                      <MenuItem value="">
                        <em>{t("notifications@send.selectType")}</em>
                      </MenuItem>
                      {notificationTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.name}
                          {type.description ? ` — ${type.description}` : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t("notifications@send.titleLabel")}
                      fullWidth
                      required
                      error={!!errors.title}
                      helperText={errors.title?.message}
                    />
                  )}
                />

                <Controller
                  name="body"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t("notifications@send.body")}
                      fullWidth
                      required
                      multiline
                      rows={3}
                      error={!!errors.body}
                      helperText={errors.body?.message}
                    />
                  )}
                />

                <Controller
                  name="isForAll"
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
                      label={t("notifications@send.sendToAll")}
                    />
                  )}
                />

                {!isForAll && (
                  <Controller
                    name="userIdsString"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label={t("notifications@send.userIds")}
                        fullWidth
                        placeholder="1, 2, 3"
                        error={!!errors.userIdsString}
                        helperText={errors.userIdsString?.message}
                      />
                    )}
                  />
                )}

                {showOfferSchedule && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="offerDate"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label={t("notifications@send.offerDate")}
                            type="date"
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="offerTime"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label={t("notifications@send.offerTime")}
                            type="time"
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 1 }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                )}

                <Controller
                  name="deepLink"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      label={t("notifications@send.deepLink")}
                      fullWidth
                      placeholder="app://screen/123"
                    />
                  )}
                />

                <Controller
                  name="data"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      label={t("notifications@send.data")}
                      fullWidth
                      placeholder='{"key": "value"}'
                      multiline
                      rows={2}
                    />
                  )}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={sendMutation.isPending}
                >
                  {sendMutation.isPending ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    t("notifications@send.submit")
                  )}
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
