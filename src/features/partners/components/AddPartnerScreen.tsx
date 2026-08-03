import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  TextField,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  useTheme,
} from "@mui/material";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import EvStationIcon from "@mui/icons-material/EvStation";
import StoreIcon from "@mui/icons-material/Store";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useSnackbarStore } from "../../../stores";
import {
  getAllChargingPoints,
} from "../../charge-management/services/charge-management-service";
import { changeStationOwner } from "../../charge-management/services/station-form-service";
import { getUsersList } from "../../users/services/user-service";
import { PROVIDER_ROLE_ID } from "../../users/constants/roles";
import { getAllConversionRates } from "../../offers/services/offers-service";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";
import { useCreatePartnerAgreement } from "../hooks/use-partners";
import type { CreatePartnerAgreementRequest, PartnerProviderType } from "../types/api";

export default function AddPartnerScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [activeStep, setActiveStep] = useState(0);

  // Step 1 — station & owner
  const [stationId, setStationId] = useState<number | null>(null);
  const [ownerId, setOwnerId] = useState<number | null>(null);

  // Steps 2-4 — partner agreement
  const [formData, setFormData] = useState<CreatePartnerAgreementRequest>({
    providerType: "ChargingPoint",
    providerId: 0,
    commissionPercentage: 10,
    pointsRewardPercentage: 5,
    pointsConversionRateId: null,
    codeExpirySeconds: 60,
    minimumTransactionAmount: null,
    isActive: true,
    note: "",
  });

  const steps = [
    t("partners@wizard.step1"),
    t("partners@wizard.step2"),
    t("partners@wizard.step3"),
    t("partners@wizard.step4"),
  ];

  // ── Data ──
  const { data: stations = [], isLoading: loadingStations } = useQuery({
    queryKey: ["charge-management", "stations-list"],
    queryFn: ({ signal }) =>
      getAllChargingPoints({ name: null, chargerPointTypeId: null, cityName: null }, signal),
    staleTime: 5 * 60 * 1000,
  });
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users", "list"],
    queryFn: ({ signal }) => getUsersList(signal),
    staleTime: 60 * 1000,
  });
  const { data: conversionRates = [] } = useQuery({
    queryKey: ["conversion-rates"],
    queryFn: () => getAllConversionRates(),
  });
  const { data: serviceProviders = [] } = useQuery({
    queryKey: ["service-providers", "list"],
    queryFn: () => getAllServiceProviders(),
    enabled: formData.providerType === "ServiceProvider",
  });

  const owners = useMemo(
    () => allUsers.filter((u) => u.role?.id === PROVIDER_ROLE_ID),
    [allUsers]
  );
  const stationOptions = useMemo(
    () => stations.map((s) => ({ id: s.id, name: s.name ?? `Station ${s.id}` })),
    [stations]
  );
  const ownerOptions = useMemo(
    () => owners.map((u) => ({ id: u.id ?? 0, name: u.name, email: u.email })),
    [owners]
  );
  const providerOptions =
    formData.providerType === "ChargingPoint"
      ? stationOptions
      : serviceProviders.map((s) => ({ id: s.id, name: s.name ?? `Provider ${s.id}` }));

  const assignOwnerMutation = useMutation({
    mutationFn: ({ station, owner }: { station: number; owner: number }) =>
      changeStationOwner(station, owner),
  });
  const createMutation = useCreatePartnerAgreement();

  // ── Navigation ──
  const goToProviderStep = () => {
    // Pre-fill the agreement provider from the station chosen in step 1.
    setFormData((prev) => ({
      ...prev,
      providerType: "ChargingPoint",
      providerId: stationId ?? 0,
      pointsConversionRateId: prev.pointsConversionRateId ?? conversionRates[0]?.id ?? null,
    }));
    setActiveStep(1);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!stationId) return openErrorSnackbar({ message: t("partners@wizard.selectStationFirst") });
      if (!ownerId) return openErrorSnackbar({ message: t("partners@wizard.selectOwnerFirst") });
      assignOwnerMutation.mutate(
        { station: stationId, owner: ownerId },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("partners@wizard.ownerAssigned") });
            goToProviderStep();
          },
          onError: (e: Error) => openErrorSnackbar({ message: e?.message ?? t("loadingFailed") }),
        }
      );
      return;
    }
    if (activeStep === 1 && formData.providerId <= 0) {
      return openErrorSnackbar({ message: t("partners@selectProvider") });
    }
    if (activeStep === steps.length - 1) {
      handleCreate();
      return;
    }
    setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const handleCreate = () => {
    if (formData.providerId <= 0) {
      return openErrorSnackbar({ message: t("partners@selectProvider") });
    }
    createMutation.mutate(
      {
        ...formData,
        minimumTransactionAmount: formData.minimumTransactionAmount || null,
        note: formData.note || null,
      },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("partners@created") });
          navigate("/partners");
        },
        onError: (e: Error) => openErrorSnackbar({ message: e?.message ?? t("loadingFailed") }),
      }
    );
  };

  const sectionLabelSx = {
    mb: 1.5,
    display: "block",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  } as const;

  return (
    <AppScreenContainer>
      {/* ── Gradient Banner ── */}
      <Box
        sx={{
          background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: 3,
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          position: "relative",
          overflow: "hidden",
          color: "white",
        }}
      >
        <Box sx={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -40, left: -20, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <PersonAddAlt1Icon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} color="white" lineHeight={1.2}>{t("addNewPartner")}</Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5 }}>{t("partners@wizard.subtitle")}</Typography>
          </Box>
        </Stack>
      </Box>

      {/* ── Stepper ── */}
      <Paper elevation={1} sx={{ borderRadius: 2, p: { xs: 2, md: 3 } }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ maxWidth: 560, mx: "auto" }}>
          {/* ── Step 1: Station & Owner ── */}
          {activeStep === 0 && (
            <Stack spacing={3}>
              <Typography variant="body2" color="text.secondary">
                {t("partners@wizard.stationOwnerHint")}
              </Typography>

              <Autocomplete
                fullWidth
                loading={loadingStations}
                options={stationOptions}
                getOptionLabel={(opt) => `#${opt.id} — ${opt.name}`}
                value={stationOptions.find((s) => s.id === stationId) ?? null}
                onChange={(_, val) => setStationId(val?.id ?? null)}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                filterOptions={(options, { inputValue }) => {
                  const q = inputValue.trim().toLowerCase();
                  if (!q) return options;
                  return options.filter(
                    (opt) => String(opt.id).includes(q) || opt.name.toLowerCase().includes(q)
                  );
                }}
                noOptionsText={t("noResults")}
                renderInput={(params) => (
                  <TextField {...params} label={t("partners@wizard.selectStation")} placeholder={t("partners@wizard.selectStationPlaceholder")} />
                )}
                renderOption={(props, opt) => (
                  <li {...props} key={opt.id}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%", py: 0.5 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.100", color: "primary.dark" }}>
                        <EvStationIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      <Typography variant="body2" noWrap>#{opt.id} — {opt.name}</Typography>
                    </Stack>
                  </li>
                )}
              />

              <Autocomplete
                fullWidth
                loading={loadingUsers}
                options={ownerOptions}
                getOptionLabel={(opt) => `${opt.name} (#${opt.id})`}
                value={ownerOptions.find((o) => o.id === ownerId) ?? null}
                onChange={(_, val) => setOwnerId(val?.id ?? null)}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                filterOptions={(options, { inputValue }) => {
                  const q = inputValue.trim().toLowerCase();
                  if (!q) return options;
                  return options.filter(
                    (opt) =>
                      String(opt.id).includes(q) ||
                      opt.name.toLowerCase().includes(q) ||
                      (opt.email ?? "").toLowerCase().includes(q)
                  );
                }}
                noOptionsText={t("noResults")}
                renderInput={(params) => (
                  <TextField {...params} label={t("partners@wizard.selectOwner")} placeholder={t("partners@wizard.selectOwnerPlaceholder")} />
                )}
                renderOption={(props, opt) => (
                  <li {...props} key={opt.id}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%", py: 0.5 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: "secondary.main", fontSize: 12, fontWeight: 700 }}>
                        {opt.name.slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap>{opt.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{opt.email} · ID {opt.id}</Typography>
                      </Box>
                    </Stack>
                  </li>
                )}
              />
            </Stack>
          )}

          {/* ── Step 2: Provider ── */}
          {activeStep === 1 && (
            <Stack spacing={2}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={sectionLabelSx}>
                {t("partners@providerType")}
              </Typography>
              <Stack direction="row" spacing={1}>
                {(["ChargingPoint", "ServiceProvider"] as PartnerProviderType[]).map((type) => (
                  <Paper
                    key={type}
                    variant="outlined"
                    onClick={() => setFormData({ ...formData, providerType: type, providerId: 0 })}
                    sx={{
                      flex: 1, py: 1.5, px: 2, borderRadius: 2, cursor: "pointer", textAlign: "center",
                      borderColor: formData.providerType === type ? "primary.main" : "divider",
                      bgcolor: formData.providerType === type ? "primary.50" : "transparent",
                      transition: "all 0.15s ease",
                      "&:hover": { borderColor: "primary.light", bgcolor: "action.hover" },
                    }}
                  >
                    <Stack alignItems="center" spacing={0.5}>
                      {type === "ChargingPoint"
                        ? <EvStationIcon sx={{ fontSize: 22, color: formData.providerType === type ? "primary.main" : "text.disabled" }} />
                        : <StoreIcon sx={{ fontSize: 22, color: formData.providerType === type ? "primary.main" : "text.disabled" }} />}
                      <Typography variant="caption" fontWeight={600} color={formData.providerType === type ? "primary.main" : "text.secondary"}>
                        {type === "ChargingPoint" ? t("chargingPoint") : t("serviceProvider")}
                      </Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>

              <Autocomplete
                fullWidth
                size="small"
                options={providerOptions}
                getOptionLabel={(opt) => `#${opt.id} — ${opt.name}`}
                value={providerOptions.find((p) => p.id === formData.providerId) ?? null}
                onChange={(_, val) => setFormData({ ...formData, providerId: val?.id ?? 0 })}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                filterOptions={(options, { inputValue }) => {
                  const q = inputValue.trim().toLowerCase();
                  if (!q) return options;
                  return options.filter(
                    (opt) => String(opt.id).includes(q) || (opt.name ?? "").toLowerCase().includes(q)
                  );
                }}
                noOptionsText={t("noResults")}
                renderInput={(params) => (
                  <TextField {...params} label={t("partners@provider")} placeholder={t("partners@searchProvider")} />
                )}
                renderOption={(props, opt) => (
                  <li {...props} key={opt.id}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%", py: 0.5 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: "primary.100", color: "primary.dark", fontSize: 11, fontWeight: 700 }}>
                        {opt.id}
                      </Avatar>
                      <Typography variant="body2" noWrap>{opt.name}</Typography>
                    </Stack>
                  </li>
                )}
              />
            </Stack>
          )}

          {/* ── Step 3: Commission & Rewards ── */}
          {activeStep === 2 && (
            <Stack spacing={2}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={sectionLabelSx}>
                {t("partners@commissionAndRewards")}
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  size="small" fullWidth label={t("partners@commission")} type="number"
                  value={formData.commissionPercentage}
                  onChange={(e) => setFormData({ ...formData, commissionPercentage: parseFloat(e.target.value) || 0 })}
                  inputProps={{ min: 0, max: 100, step: 0.5 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
                <TextField
                  size="small" fullWidth label={t("partners@pointsReward")} type="number"
                  value={formData.pointsRewardPercentage}
                  onChange={(e) => setFormData({ ...formData, pointsRewardPercentage: parseFloat(e.target.value) || 0 })}
                  inputProps={{ min: 0, max: 100, step: 0.5 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Stack>
              <FormControl fullWidth size="small">
                <InputLabel>{t("partners@conversionRate")}</InputLabel>
                <Select
                  value={formData.pointsConversionRateId ?? ""}
                  label={t("partners@conversionRate")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pointsConversionRateId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                >
                  <MenuItem value="">{t("default")}</MenuItem>
                  {conversionRates.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name} ({r.currencyCode} = {r.pointsPerUnit} pts)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}

          {/* ── Step 4: Limits & Details ── */}
          {activeStep === 3 && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {t("partners@wizard.reviewHint")}
              </Typography>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={sectionLabelSx}>
                {t("partners@limitsAndExpiry")}
              </Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  size="small" fullWidth label={t("partners@codeExpiry")} type="number"
                  value={formData.codeExpirySeconds}
                  onChange={(e) => setFormData({ ...formData, codeExpirySeconds: parseInt(e.target.value, 10) || 60 })}
                  InputProps={{ endAdornment: <InputAdornment position="end">{t("seconds")}</InputAdornment> }}
                />
                <TextField
                  size="small" fullWidth label={t("partners@minimumAmount")} type="number"
                  value={formData.minimumTransactionAmount ?? ""}
                  onChange={(e) => setFormData({ ...formData, minimumTransactionAmount: e.target.value ? parseFloat(e.target.value) : null })}
                  InputProps={{ endAdornment: <InputAdornment position="end">JOD</InputAdornment> }}
                  inputProps={{ min: 0, step: 0.001 }}
                  helperText={t("partners@minimumAmountHint")}
                />
              </Stack>
              <Divider />
              <TextField
                size="small" label={t("note")} value={formData.note ?? ""}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                multiline rows={2} placeholder={t("partners@notePlaceholder")}
              />
            </Stack>
          )}
        </Box>

        {/* ── Navigation ── */}
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 4, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={handleBack} disabled={activeStep === 0 || assignOwnerMutation.isPending || createMutation.isPending} color="inherit">
            {t("partners@wizard.back")}
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={assignOwnerMutation.isPending || createMutation.isPending}
            startIcon={(assignOwnerMutation.isPending || createMutation.isPending) ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ minWidth: 120, fontWeight: 600 }}
          >
            {activeStep === steps.length - 1 ? t("partners@wizard.finish") : t("partners@wizard.next")}
          </Button>
        </Stack>
      </Paper>
    </AppScreenContainer>
  );
}
