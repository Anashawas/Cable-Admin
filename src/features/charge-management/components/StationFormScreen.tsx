import { useEffect, useCallback } from "react";
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
  MenuItem,
  Autocomplete,
  Stack,
  Typography,
  CircularProgress,
  Paper,
} from "@mui/material";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import {
  CITIES,
  PAYMENT_METHODS,
  STATION_TYPES,
  CHARGER_POINT_TYPES,
  STATUSES,
  SERVICE_OPTIONS,
} from "../constants/options";
import {
  getAllPlugTypes,
  getStationById,
  addStation,
  updateStation,
} from "../services/station-form-service";
import { stationFormSchema, type StationFormValues } from "../validators/station-schema";
import LocationPicker from "./LocationPicker";
import { useSnackbarStore } from "../../../stores";
import type { ChargingPointDto } from "../types/api";

/** Parse API service string "[A, B]" to array ["A", "B"]. */
function parseServiceString(str: string | null | undefined): string[] {
  if (!str || typeof str !== "string") return [];
  return str
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Parse API methodPayment string "Visa,Cash" to array. */
function parsePaymentString(str: string | null | undefined): string[] {
  if (!str || typeof str !== "string") return [];
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Transform form services array to API string "[A, B]". */
function formatServiceString(arr: string[]): string {
  if (!arr.length) return "";
  return `[${arr.join(", ")}]`;
}

/** Transform form payment methods to API string "Visa,Cash". */
function formatPaymentString(arr: string[]): string {
  return arr.join(",");
}

const defaultValues: StationFormValues = {
  name: "",
  phone: "",
  note: "",
  cityName: "",
  address: "",
  latitude: 0,
  longitude: 0,
  statusId: 1,
  chargerPointTypeId: 1,
  stationTypeId: null,
  plugTypeIds: [],
  paymentMethods: [],
  services: [],
  price: null,
  chargerSpeed: null,
  chargersCount: null,
};

function mapStationToFormValues(station: ChargingPointDto): Partial<StationFormValues> {
  const services = parseServiceString(station.service);
  return {
    name: station.name ?? "",
    phone: station.phone ?? "",
    note: station.note ?? "",
    cityName: station.cityName ?? "",
    address: station.address ?? "",
    latitude: station.latitude ?? 0,
    longitude: station.longitude ?? 0,
    statusId: station.statusSummary?.id ?? 1,
    chargerPointTypeId: station.chargingPointType?.id ?? 1,
    stationTypeId: station.stationType?.id ?? null,
    plugTypeIds: station.plugTypeSummary?.map((p) => p.id) ?? [],
    paymentMethods: [], // Extend when API returns methodPayment
    services,
    price: station.price ?? null,
    chargerSpeed: station.chargerSpeed ?? null,
    chargersCount: station.chargersCount ?? null,
  };
}

export default function StationFormScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const isEditMode = Boolean(id);
  const stationId = id ? Number(id) : 0;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StationFormValues>({
    resolver: zodResolver(stationFormSchema),
    defaultValues,
  });

  const { data: plugTypes = [], isLoading: isLoadingPlugTypes } = useQuery({
    queryKey: ["charge-management", "plug-types"],
    queryFn: ({ signal }) => getAllPlugTypes(signal),
  });

  const { data: station, isLoading: isLoadingStation } = useQuery({
    queryKey: ["charge-management", "station", stationId],
    queryFn: ({ signal }) => getStationById(stationId, signal),
    enabled: isEditMode && stationId > 0,
  });

  useEffect(() => {
    if (station && isEditMode) {
      reset(mapStationToFormValues(station));
    }
  }, [station, isEditMode, reset]);

  const addMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => addStation(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-management"] });
      openSuccessSnackbar({ message: t("chargeManagement@form.saved") });
      navigate("/charge-management");
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id: sid, body }: { id: number; body: Record<string, unknown> }) =>
      updateStation(sid, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-management"] });
      openSuccessSnackbar({ message: t("chargeManagement@form.saved") });
      navigate("/charge-management");
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const onSubmit = useCallback(
    (values: StationFormValues) => {
      const body: Record<string, unknown> = {
        name: values.name,
        phone: values.phone || null,
        note: values.note || null,
        cityName: values.cityName || null,
        address: values.address || null,
        latitude: values.latitude,
        longitude: values.longitude,
        statusId: values.statusId,
        chargerPointTypeId: values.chargerPointTypeId,
        stationTypeId: values.stationTypeId ?? null,
        plugTypeIds: values.plugTypeIds,
        service: formatServiceString(values.services),
        methodPayment: formatPaymentString(values.paymentMethods),
        price: values.price ?? null,
        chargerSpeed: values.chargerSpeed ?? null,
        chargersCount: values.chargersCount ?? null,
      };
      if (isEditMode && stationId > 0) {
        updateMutation.mutate({ id: stationId, body });
      } else {
        addMutation.mutate(body);
      }
    },
    [isEditMode, stationId, addMutation, updateMutation]
  );

  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingStation && !station) {
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
      <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
          {isEditMode ? t("chargeManagement@form.editTitle") : t("chargeManagement@form.addTitle")}
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Left: Basic Info + Location */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                    {t("chargeManagement@form.basicInfo")}
                  </Typography>
                  <Stack spacing={2}>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label={t("chargeManagement@form.name")}
                          fullWidth
                          error={!!errors.name}
                          helperText={errors.name?.message}
                        />
                      )}
                    />
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label={t("chargeManagement@form.phone")} fullWidth />
                      )}
                    />
                    <Controller
                      name="note"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label={t("chargeManagement@form.note")} fullWidth multiline rows={2} />
                      )}
                    />
                  </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                    {t("chargeManagement@form.location")}
                  </Typography>
                  <Stack spacing={2}>
                    <Controller
                      name="cityName"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} select label={t("chargeManagement@form.city")} fullWidth>
                          <MenuItem value="">—</MenuItem>
                          {CITIES.map((city) => (
                            <MenuItem key={city} value={city}>
                              {city}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                    <Controller
                      name="address"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label={t("chargeManagement@form.address")} fullWidth />
                      )}
                    />
                    <Box sx={{ width: "100%", height: 300, borderRadius: 1, overflow: "hidden" }}>
                      <LocationPicker
                        latitude={watch("latitude") ?? 0}
                        longitude={watch("longitude") ?? 0}
                        onLocationSelect={(lat, lng) => {
                          setValue("latitude", lat);
                          setValue("longitude", lng);
                        }}
                      />
                    </Box>
                  </Stack>
                </Paper>
              </Stack>
            </Grid>

            {/* Right: Settings + Multi-Selects */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                    {t("chargeManagement@form.settings")}
                  </Typography>
                  <Stack spacing={2}>
                    <Controller
                      name="statusId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label={t("chargeManagement@form.status")}
                          fullWidth
                          error={!!errors.statusId}
                          helperText={errors.statusId?.message}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        >
                          {STATUSES.map((s) => (
                            <MenuItem key={s.id} value={s.id}>
                              {s.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                    <Controller
                      name="chargerPointTypeId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label={t("chargeManagement@form.chargerPointType")}
                          fullWidth
                          error={!!errors.chargerPointTypeId}
                          helperText={errors.chargerPointTypeId?.message}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        >
                          {CHARGER_POINT_TYPES.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                              {c.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                    <Controller
                      name="stationTypeId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label={t("chargeManagement@form.stationType")}
                          fullWidth
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                        >
                          <MenuItem value="">—</MenuItem>
                          {STATION_TYPES.map((s) => (
                            <MenuItem key={s.id} value={s.id}>
                              {s.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Controller
                          name="chargerSpeed"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="number"
                              label={t("chargeManagement@form.chargerSpeed")}
                              fullWidth
                              value={field.value ?? ""}
                              onChange={(e) =>
                                setValue("chargerSpeed", e.target.value === "" ? null : Number(e.target.value))
                              }
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Controller
                          name="price"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="number"
                              label={t("chargeManagement@form.price")}
                              fullWidth
                              inputProps={{ step: "any" }}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                setValue("price", e.target.value === "" ? null : Number(e.target.value))
                              }
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Controller
                          name="chargersCount"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="number"
                              label={t("chargeManagement@form.chargersCount")}
                              fullWidth
                              value={field.value ?? ""}
                              onChange={(e) =>
                                setValue("chargersCount", e.target.value === "" ? null : Number(e.target.value))
                              }
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                    {t("chargeManagement@form.plugTypes")}
                  </Typography>
                  <Controller
                    name="plugTypeIds"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        options={plugTypes}
                        getOptionLabel={(opt) => opt.name ?? String(opt.id)}
                        value={plugTypes.filter((p) => field.value.includes(p.id))}
                        onChange={(_, selected) => field.onChange(selected.map((p) => p.id))}
                        loading={isLoadingPlugTypes}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={t("chargeManagement@form.plugTypes")}
                            error={!!errors.plugTypeIds}
                            helperText={errors.plugTypeIds?.message}
                          />
                        )}
                      />
                    )}
                  />
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                    {t("chargeManagement@form.paymentMethods")}
                  </Typography>
                  <Controller
                    name="paymentMethods"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        options={PAYMENT_METHODS}
                        value={field.value}
                        onChange={(_, selected) => field.onChange(selected)}
                        renderInput={(params) => (
                          <TextField {...params} label={t("chargeManagement@form.paymentMethods")} />
                        )}
                      />
                    )}
                  />
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                    {t("chargeManagement@form.services")}
                  </Typography>
                  <Controller
                    name="services"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        options={SERVICE_OPTIONS}
                        value={field.value}
                        onChange={(_, selected) => field.onChange(selected)}
                        freeSolo
                        renderInput={(params) => (
                          <TextField {...params} label={t("chargeManagement@form.services")} />
                        )}
                      />
                    )}
                  />
                </Paper>
              </Stack>
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : t("save")}
            </Button>
            <Button type="button" variant="outlined" onClick={() => navigate("/charge-management")}>
              {t("cancel")}
            </Button>
          </Stack>
        </form>
      </Box>
    </AppScreenContainer>
  );
}
