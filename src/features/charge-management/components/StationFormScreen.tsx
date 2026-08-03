import { useEffect, useCallback, useState } from "react";
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
  Chip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import TuneIcon from "@mui/icons-material/Tune";
import PowerIcon from "@mui/icons-material/Power";
import PaymentsIcon from "@mui/icons-material/Payments";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import EvStationIcon from "@mui/icons-material/EvStation";
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
  deleteStation,
} from "../services/station-form-service";
import { stationFormSchema, type StationFormValues } from "../validators/station-schema";
import { useChargerBrands } from "../hooks/use-charger-brands";
import LocationPicker from "./LocationPicker";
import { useSnackbarStore } from "../../../stores";
import type { ChargingPointDto } from "../types/api";

// ── Services chip categories (display only) ───────────────────────────────────
const SERVICE_CATEGORIES: { label: string; items: string[] }[] = [
  { label: "Parking", items: ["Covered Parking", "Open Parking", "Valet Parking", "Long-Term Parking", "Reserved Parking Spots"] },
  { label: "Restrooms", items: ["Public Restrooms", "Male/Female Restrooms", "Shower Facilities", "Baby Changing Room"] },
  { label: "Food & Drinks", items: ["Restaurant", "Cafeteria", "Cafe", "Branded Cafe", "Food Court", "Coffee Machines", "Vending Machines", "Fast Food"] },
  { label: "Shopping", items: ["Supermarket", "Convenience Store", "Shopping Mall Nearby", "Pharmacy", "ATM", "Gift Shop"] },
  { label: "Vehicle", items: ["Car Wash", "Tire Service", "Car Maintenance", "Oil Change", "Auto Parts Store", "Vehicle Inspection"] },
  { label: "Comfort", items: ["Air-Conditioned Lounge", "Waiting Lounge", "VIP Lounge", "Entertainment Area", "Children's Play Area", "Gaming Zone", "Reading Area"] },
  { label: "Personal", items: ["Barber Shop", "Beauty Salon", "Spa & Massage", "Laundry Service", "Dry Cleaning"] },
  { label: "Health", items: ["Gym/Fitness Center", "Medical Clinic", "First Aid", "Dental Clinic"] },
  { label: "Tech & Work", items: ["Wi-Fi", "Phone/Laptop Charging"] },
  { label: "Religious", items: ["Prayer Room (Musalla)", "Mosque Nearby", "Wudu Area"] },
  { label: "Accommodation", items: ["Hotel", "Rest Cabins", "Sleeping Pods"] },
  { label: "Entertainment", items: ["Movie Theater", "Kids Entertainment", "Arcade Games"] },
  { label: "Security", items: ["24/7 Security", "Emergency Services"] },
  { label: "Pets", items: ["Pet Washing Station", "Pet Shop"] },
  { label: "Smart Services", items: ["Mobile App Booking", "Online Reservation", "Real-Time Availability", "QR Code Check-In", "Digital Payment Only", "Contactless Payment", "Pre-Book Charging Slot", "Queue Management System"] },
  { label: "Accessibility", items: ["Wheelchair Accessible", "Elevator Access"] },
  { label: "Membership", items: ["Loyalty Program", "Fleet Charging"] },
  { label: "Other", items: ["Recycling Facilities", "Car Rental", "Currency Exchange", "Other"] },
];

interface ServicesChipPickerProps {
  value: string[];
  onChange: (v: string[]) => void;
}

function ServicesChipPicker({ value, onChange }: ServicesChipPickerProps) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  const toggle = (service: string) => {
    if (value.includes(service)) {
      onChange(value.filter((s) => s !== service));
    } else {
      onChange([...value, service]);
    }
  };

  const visibleCategories = SERVICE_CATEGORIES
    .map((cat) => ({
      ...cat,
      items: q ? cat.items.filter((s) => s.toLowerCase().includes(q)) : cat.items,
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <Box>
      <TextField
        size="small"
        fullWidth
        placeholder="Search services…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
      <Box sx={{ maxHeight: 320, overflowY: "auto", pr: 0.5 }}>
        {visibleCategories.map((cat) => (
          <Box key={cat.label} sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 0.75, display: "block" }}>
              {cat.label}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {cat.items.map((service) => {
                const selected = value.includes(service);
                return (
                  <Chip
                    key={service}
                    label={service}
                    size="small"
                    onClick={() => toggle(service)}
                    color={selected ? "primary" : "default"}
                    variant={selected ? "filled" : "outlined"}
                    sx={{ cursor: "pointer", fontWeight: selected ? 600 : 400, fontSize: "0.75rem" }}
                  />
                );
              })}
            </Box>
          </Box>
        ))}
        {visibleCategories.length === 0 && (
          <Typography variant="body2" color="text.disabled" sx={{ textAlign: "center", py: 3 }}>
            No services match "{search}"
          </Typography>
        )}
      </Box>
    </Box>
  );
}

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
  chargerBrandId: null,
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
    chargerBrandId: station.chargerBrandId ?? null,
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
  const theme = useTheme();
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

  const { data: chargerBrands = [] } = useChargerBrands();

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

  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: (sid: number) => deleteStation(sid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-management"] });
      openSuccessSnackbar({ message: t("chargeManagement@stationDeleted") });
      setDeleteOpen(false);
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
        chargerBrandId: values.chargerBrandId ?? null,
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
        {/* ── Gradient hero ── */}
        <Box sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, borderRadius: 3, p: { xs: 2, md: 2.5 }, mb: 3, color: "#fff", position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)" }} />
          <Stack direction="row" spacing={2} alignItems="center">
            <Tooltip title={t("back")}>
              <IconButton onClick={() => navigate(isEditMode && stationId ? `/charge-management/${stationId}` : "/charge-management")} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <EvStationIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" fontWeight={800} noWrap>
                {isEditMode ? t("chargeManagement@form.editTitle") : t("chargeManagement@form.addTitle")}
              </Typography>
              {isEditMode && station?.name && <Typography variant="body2" sx={{ opacity: 0.8 }} noWrap>{station.name}</Typography>}
            </Box>
          </Stack>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Left: Basic Info + Location */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={3}>
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: "primary.50", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center" }}><InfoOutlinedIcon fontSize="small" /></Box>
                    <Typography variant="subtitle1" fontWeight={700}>{t("chargeManagement@form.basicInfo")}</Typography>
                  </Stack>
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

                <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: "error.50", color: "error.main", display: "flex", alignItems: "center", justifyContent: "center" }}><LocationOnIcon fontSize="small" /></Box>
                    <Typography variant="subtitle1" fontWeight={700}>{t("chargeManagement@form.location")}</Typography>
                  </Stack>
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
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Controller
                          name="latitude"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="number"
                              label={t("chargeManagement@form.latitude")}
                              fullWidth
                              inputProps={{ step: "any" }}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : Number(e.target.value);
                                field.onChange(val);
                                setValue("latitude", val);
                              }}
                              error={!!errors.latitude}
                              helperText={errors.latitude?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Controller
                          name="longitude"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="number"
                              label={t("chargeManagement@form.longitude")}
                              fullWidth
                              inputProps={{ step: "any" }}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : Number(e.target.value);
                                field.onChange(val);
                                setValue("longitude", val);
                              }}
                              error={!!errors.longitude}
                              helperText={errors.longitude?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
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
                <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: "info.50", color: "info.main", display: "flex", alignItems: "center", justifyContent: "center" }}><TuneIcon fontSize="small" /></Box>
                    <Typography variant="subtitle1" fontWeight={700}>{t("chargeManagement@form.settings")}</Typography>
                  </Stack>
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
                    <Controller
                      name="chargerBrandId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label={t("chargeManagement@form.chargerBrand")}
                          fullWidth
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                        >
                          <MenuItem value="">—</MenuItem>
                          {chargerBrands.map((b) => (
                            <MenuItem key={b.id} value={b.id}>
                              {b.name}
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

                <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: "success.50", color: "success.main", display: "flex", alignItems: "center", justifyContent: "center" }}><PowerIcon fontSize="small" /></Box>
                    <Typography variant="subtitle1" fontWeight={700}>{t("chargeManagement@form.plugTypes")}</Typography>
                  </Stack>
                  <Controller
                    name="plugTypeIds"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        options={plugTypes}
                        getOptionLabel={(opt) =>
                          opt.serialNumber
                            ? `${opt.name ?? ""} (${opt.serialNumber})`
                            : (opt.name ?? String(opt.id))
                        }
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

                <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: "warning.50", color: "warning.main", display: "flex", alignItems: "center", justifyContent: "center" }}><PaymentsIcon fontSize="small" /></Box>
                    <Typography variant="subtitle1" fontWeight={700}>{t("chargeManagement@form.paymentMethods")}</Typography>
                  </Stack>
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

                <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: "secondary.50", color: "secondary.main", display: "flex", alignItems: "center", justifyContent: "center" }}><RoomServiceIcon fontSize="small" /></Box>
                      <Typography variant="subtitle1" fontWeight={700}>{t("chargeManagement@form.services")}</Typography>
                    </Stack>
                    <Controller
                      name="services"
                      control={control}
                      render={({ field }) =>
                        field.value.length > 0 ? (
                          <Chip
                            label={`${field.value.length} selected`}
                            size="small"
                            color="primary"
                            onDelete={() => field.onChange([])}
                          />
                        ) : <span />
                      }
                    />
                  </Stack>
                  <Controller
                    name="services"
                    control={control}
                    render={({ field }) => (
                      <ServicesChipPicker value={field.value} onChange={field.onChange} />
                    )}
                  />
                </Paper>
              </Stack>
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              mt: 3,
              p: { xs: 1.5, sm: 2 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
              position: "sticky",
              bottom: 12,
              zIndex: 2,
              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                startIcon={!isSubmitting && <SaveIcon />}
                sx={{
                  borderRadius: 2,
                  fontWeight: 800,
                  px: 3,
                  minWidth: 140,
                  boxShadow: "0 4px 14px rgba(25,118,210,0.35)",
                  "&:hover": { boxShadow: "0 6px 20px rgba(25,118,210,0.45)" },
                }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t("save")}
              </Button>
              <Button
                type="button"
                variant="outlined"
                size="large"
                onClick={() => navigate(isEditMode ? `/charge-management/${stationId}` : "/charge-management")}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                {t("cancel")}
              </Button>
              {isEditMode && (
                <>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    type="button"
                    variant="contained"
                    color="error"
                    size="large"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => setDeleteOpen(true)}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 800,
                      px: 3,
                      boxShadow: "0 4px 14px rgba(211,47,47,0.4)",
                      "&:hover": { boxShadow: "0 6px 20px rgba(211,47,47,0.5)" },
                    }}
                  >
                    {t("chargeManagement@deleteStation")}
                  </Button>
                </>
              )}
            </Stack>
          </Paper>
        </form>

        {/* ── Delete Confirmation Dialog ── */}
        <Dialog
          open={deleteOpen}
          onClose={() => !deleteMutation.isPending && setDeleteOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ background: "linear-gradient(135deg, #b71c1c 0%, #c62828 100%)", color: "#fff", display: "flex", alignItems: "center", gap: 1.5 }}>
            <DeleteOutlineIcon />
            {t("chargeManagement@confirmDeleteTitle")}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body1" sx={{ mb: 1, mt: 2 }}>
              {t("chargeManagement@confirmDeleteMessage")}
            </Typography>
            {station && (
              <Paper elevation={0} sx={{ p: 2, mt: 1.5, borderRadius: 2, bgcolor: "error.50", border: "1px solid", borderColor: "error.200" }}>
                <Typography variant="subtitle1" fontWeight={800} color="error.dark">
                  {station.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  #{station.id}
                </Typography>
              </Paper>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              onClick={() => setDeleteOpen(false)}
              disabled={deleteMutation.isPending}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => stationId && deleteMutation.mutate(stationId)}
              disabled={deleteMutation.isPending}
              variant="contained"
              color="error"
              startIcon={deleteMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              {deleteMutation.isPending ? t("deleting") : t("delete")}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppScreenContainer>
  );
}
