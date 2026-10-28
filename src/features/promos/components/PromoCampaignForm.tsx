import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import SaveIcon from "@mui/icons-material/Save";
import { DecimalField } from "../../../components";
import CityMultiSelect from "../../../components/CityMultiSelect";
import { useSnackbarStore } from "../../../stores";
import { apiErrorMessage, apiFieldErrors, fmtJod, fromDateTimeInput, toDateTimeInput } from "../../../utils/api-error";
import { useServiceCategories } from "../../service-providers/hooks/use-service-categories";
import { useSavePromoCampaign } from "../hooks/use-promos";
import {
  PROMO_APPLIES_TO,
  PROMO_EFFECT_TYPES,
  PROMO_TARGET_SCOPES,
  type AdminPromoCampaignDto,
  type PromoCampaignInput,
  type PromoCodeMode,
  type PromoEffectType,
  type PromoTargetScope,
} from "../types/api";
import { budgetUsedPercent, isDiscount, normalizePublicCode, validatePromo, type RuleError } from "../utils/promo-rules";
import PartnerMultiSelect from "./PartnerMultiSelect";

interface FormState {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  scopeLabelAr: string;
  scopeLabelEn: string;
  cableSharePercent: number | null;
  cableBudgetJod: number | null;
  stationsScope: PromoTargetScope;
  stationIds: number[];
  serviceProvidersScope: PromoTargetScope;
  serviceProviderIds: number[];
  effectType: PromoEffectType;
  effectValue: number | null;
  maxDiscountJod: number | null;
  serviceCategoryIds: number[];
  cities: string[];
  minAmountJod: number | null;
  startsAt: string;
  endsAt: string;
  validDaysAfterClaim: string;
  totalLimit: string;
  perUserLimit: string;
  newUsersOnly: boolean;
  codeMode: PromoCodeMode;
  publicCode: string;
  isActive: boolean;
}

const emptyForm = (): FormState => ({
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  scopeLabelAr: "",
  scopeLabelEn: "",
  cableSharePercent: 100,
  cableBudgetJod: null,
  stationsScope: "None",
  stationIds: [],
  serviceProvidersScope: "Selected",
  serviceProviderIds: [],
  effectType: "DiscountPercent",
  effectValue: null,
  maxDiscountJod: null,
  serviceCategoryIds: [],
  cities: [],
  minAmountJod: null,
  startsAt: "",
  endsAt: "",
  validDaysAfterClaim: "30",
  totalLimit: "",
  perUserLimit: "1",
  newUsersOnly: false,
  codeMode: "Public",
  publicCode: "",
  isActive: true,
});

const fromCampaign = (c: AdminPromoCampaignDto): FormState => ({
  titleAr: c.titleAr ?? "",
  titleEn: c.titleEn ?? "",
  descriptionAr: c.descriptionAr ?? "",
  descriptionEn: c.descriptionEn ?? "",
  scopeLabelAr: c.scopeLabelAr ?? "",
  scopeLabelEn: c.scopeLabelEn ?? "",
  cableSharePercent: c.cableSharePercent,
  cableBudgetJod: c.cableBudgetJod ?? null,
  stationsScope: c.stationsScope,
  stationIds: c.stationIds ?? [],
  serviceProvidersScope: c.serviceProvidersScope,
  serviceProviderIds: c.serviceProviderIds ?? [],
  effectType: c.effectType,
  effectValue: c.effectValue,
  maxDiscountJod: c.maxDiscountJod ?? null,
  serviceCategoryIds: c.serviceCategoryIds ?? [],
  cities: c.cities ?? [],
  minAmountJod: c.minAmountJod ?? null,
  startsAt: toDateTimeInput(c.startsAt),
  endsAt: toDateTimeInput(c.endsAt),
  validDaysAfterClaim: c.validDaysAfterClaim == null ? "" : String(c.validDaysAfterClaim),
  totalLimit: c.totalLimit == null ? "" : String(c.totalLimit),
  perUserLimit: String(c.perUserLimit ?? 1),
  newUsersOnly: c.newUsersOnly,
  codeMode: c.codeMode,
  publicCode: c.publicCode ?? "",
  isActive: c.isActive,
});

const intOrNull = (v: string): number | null => {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}>
      <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
      {hint && <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>{hint}</Typography>}
      {!hint && <Box sx={{ mb: 1.5 }} />}
      {children}
    </Paper>
  );
}

interface PromoCampaignFormProps {
  campaign: AdminPromoCampaignDto | null;
  onSaved: (id: number) => void;
}

/**
 * The campaign form (§2.14). The server rules are mirrored live (see
 * promo-rules.ts): a discount the partner pays part of can't target All, a
 * discount Cable pays part of needs a budget (and a cap for a percent).
 */
export default function PromoCampaignForm({ campaign, onSaved }: PromoCampaignFormProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language.startsWith("ar");
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const save = useSavePromoCampaign();
  const { allData: categories } = useServiceCategories();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [touched, setTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(campaign ? fromCampaign(campaign) : emptyForm());
    setTouched(false);
    setServerErrors({});
  }, [campaign]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const effectLocked = !!campaign?.effectLocked;
  const codeModeLocked = !!campaign && (campaign.codesCount > 0 || campaign.claimsCount > 0);
  const discount = isDiscount(form.effectType);
  const partnerPays = discount && form.cableSharePercent != null && form.cableSharePercent < 100;
  const cablePays = discount && form.cableSharePercent != null && form.cableSharePercent > 0;

  const ruleErrors = useMemo(() => {
    const e = validatePromo({
      effectType: form.effectType,
      effectValue: form.effectValue,
      maxDiscountJod: form.maxDiscountJod,
      cableSharePercent: form.cableSharePercent,
      cableBudgetJod: form.cableBudgetJod,
      stationsScope: form.stationsScope,
      stationIds: form.stationIds,
      serviceProvidersScope: form.serviceProvidersScope,
      serviceProviderIds: form.serviceProviderIds,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      validDaysAfterClaim: intOrNull(form.validDaysAfterClaim),
      totalLimit: intOrNull(form.totalLimit),
      perUserLimit: intOrNull(form.perUserLimit),
      minAmountJod: form.minAmountJod,
      codeMode: form.codeMode,
      publicCode: form.publicCode || null,
    });
    const extra: Record<string, RuleError> = {};
    if (!form.titleAr.trim()) extra.titleAr = { key: "required" };
    if (!form.titleEn.trim()) extra.titleEn = { key: "required" };
    if (campaign && form.cableBudgetJod != null && form.cableBudgetJod < campaign.cableSpentJod)
      extra.cableBudgetJod = { key: "budgetBelowSpent", values: { spent: campaign.cableSpentJod.toFixed(3) } };
    return { ...e, ...extra };
  }, [form, campaign]);

  const err = (key: string): string | undefined => {
    const rule = ruleErrors[key];
    // The scope rule is shown as soon as it is broken — it's the key rule of the form.
    const show = touched || key === "stationsScope" || key === "serviceProvidersScope";
    if (rule && show) return t(`promos@rules.${rule.key}`, rule.values);
    return serverErrors[key];
  };
  const valid = Object.keys(ruleErrors).length === 0;

  const handleSubmit = () => {
    setTouched(true);
    if (!valid) {
      openErrorSnackbar({ message: t("promos@form.fixErrors") });
      return;
    }
    const body: PromoCampaignInput = {
      titleAr: form.titleAr.trim(),
      titleEn: form.titleEn.trim(),
      descriptionAr: form.descriptionAr.trim() || null,
      descriptionEn: form.descriptionEn.trim() || null,
      scopeLabelAr: form.scopeLabelAr.trim() || null,
      scopeLabelEn: form.scopeLabelEn.trim() || null,
      cableSharePercent: form.cableSharePercent ?? 0,
      cableBudgetJod: form.cableBudgetJod,
      stationsScope: form.stationsScope,
      stationIds: form.stationsScope === "Selected" ? form.stationIds : [],
      serviceProvidersScope: form.serviceProvidersScope,
      serviceProviderIds: form.serviceProvidersScope === "Selected" ? form.serviceProviderIds : [],
      effectType: form.effectType,
      effectValue: form.effectValue ?? 0,
      maxDiscountJod: discount ? form.maxDiscountJod : null,
      appliesTo: [...PROMO_APPLIES_TO],
      serviceCategoryIds: form.serviceCategoryIds,
      cities: form.cities,
      minAmountJod: form.minAmountJod,
      startsAt: fromDateTimeInput(form.startsAt),
      endsAt: fromDateTimeInput(form.endsAt),
      validDaysAfterClaim: intOrNull(form.validDaysAfterClaim),
      totalLimit: intOrNull(form.totalLimit),
      perUserLimit: intOrNull(form.perUserLimit),
      newUsersOnly: form.newUsersOnly,
      codeMode: form.codeMode,
      publicCode: form.codeMode === "Public" ? normalizePublicCode(form.publicCode) : null,
      isActive: form.isActive,
    };
    save.mutate(
      { id: campaign?.id ?? null, body },
      {
        onSuccess: (id) => {
          setServerErrors({});
          openSuccessSnackbar({ message: t(campaign ? "promos@toast.updated" : "promos@toast.created") });
          onSaved(id);
        },
        onError: (e) => {
          setServerErrors(apiFieldErrors(e));
          openErrorSnackbar({ message: apiErrorMessage(e, t("loadingFailed")) });
        },
      }
    );
  };

  const scopeToggle = (key: "stationsScope" | "serviceProvidersScope") => (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={form[key]}
      onChange={(_, v) => v && set(key, v as PromoTargetScope)}
    >
      {/* ToggleButtonGroup clones its direct children, so no Tooltip wrapper here —
          the rule is explained in the section hint instead. */}
      {PROMO_TARGET_SCOPES.map((s) => (
        <ToggleButton key={s} value={s} disabled={s === "All" && partnerPays && form[key] !== "All"}>
          {t(`promos@scope.${s}`)}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );

  const spentPct = campaign ? budgetUsedPercent(form.cableBudgetJod ?? campaign.cableBudgetJod, campaign.cableSpentJod) : null;
  const busy = save.isPending;

  return (
    <Stack spacing={2}>
      {campaign?.deactivatedReason === "BudgetExhausted" && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{t("promos@form.budgetExhaustedHint")}</Alert>
      )}

      <Section title={t("promos@form.texts")} hint={t("promos@form.textsHint")}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" required label={t("promos@form.titleAr")} value={form.titleAr}
              onChange={(e) => set("titleAr", e.target.value)} error={!!err("titleAr")} helperText={err("titleAr")}
              inputProps={{ maxLength: 150, dir: "rtl" }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" required label={t("promos@form.titleEn")} value={form.titleEn}
              onChange={(e) => set("titleEn", e.target.value)} error={!!err("titleEn")} helperText={err("titleEn")}
              inputProps={{ maxLength: 150, dir: "ltr" }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" multiline minRows={2} label={t("promos@form.descriptionAr")} value={form.descriptionAr}
              onChange={(e) => set("descriptionAr", e.target.value)} inputProps={{ maxLength: 1000, dir: "rtl" }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" multiline minRows={2} label={t("promos@form.descriptionEn")} value={form.descriptionEn}
              onChange={(e) => set("descriptionEn", e.target.value)} inputProps={{ maxLength: 1000, dir: "ltr" }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label={t("promos@form.scopeLabelAr")} value={form.scopeLabelAr}
              onChange={(e) => set("scopeLabelAr", e.target.value)} helperText={t("promos@form.scopeLabelHint")}
              inputProps={{ maxLength: 200, dir: "rtl" }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label={t("promos@form.scopeLabelEn")} value={form.scopeLabelEn}
              onChange={(e) => set("scopeLabelEn", e.target.value)} inputProps={{ maxLength: 200, dir: "ltr" }} />
          </Grid>
        </Grid>
      </Section>

      <Section title={t("promos@form.effect")}>
        {effectLocked && (
          <Alert severity="info" icon={<LockIcon />} sx={{ borderRadius: 2, mb: 2 }}>{t("promos@form.effectLocked")}</Alert>
        )}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField select fullWidth size="small" label={t("promos@form.effectType")} value={form.effectType} disabled={effectLocked}
              onChange={(e) => set("effectType", e.target.value as PromoEffectType)}>
              {PROMO_EFFECT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>{t(`promos@effect.${type}`)}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <DecimalField fullWidth size="small" label={t(`promos@effectValueLabel.${form.effectType}`)} value={form.effectValue}
              onValueChange={(n) => set("effectValue", n)} disabled={effectLocked}
              error={!!err("effectValue")} helperText={err("effectValue") ?? t(`promos@effectValueHint.${form.effectType}`)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {form.effectType === "DiscountPercent" ? "%" : form.effectType === "DiscountFixed" ? "JOD" : form.effectType === "PointsMultiplier" ? "×" : t("promos@points")}
                  </InputAdornment>
                ),
              }} />
          </Grid>
          {discount && (
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DecimalField fullWidth size="small" label={t("promos@form.maxDiscountJod")} value={form.maxDiscountJod}
                onValueChange={(n) => set("maxDiscountJod", n)} disabled={effectLocked}
                error={!!err("maxDiscountJod")} helperText={err("maxDiscountJod") ?? t("promos@form.maxDiscountHint")}
                InputProps={{ endAdornment: <InputAdornment position="end">JOD</InputAdornment> }} />
            </Grid>
          )}
        </Grid>
      </Section>

      <Section title={t("promos@form.funding")} hint={discount ? t("promos@form.fundingHint") : t("promos@form.fundingPointsHint")}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <DecimalField fullWidth size="small" label={t("promos@form.cableSharePercent")} value={form.cableSharePercent}
              onValueChange={(n) => set("cableSharePercent", n)} disabled={effectLocked}
              error={!!err("cableSharePercent")}
              helperText={err("cableSharePercent") ?? (discount && form.cableSharePercent != null
                ? t("promos@form.shareSplit", { cable: form.cableSharePercent, partner: Math.max(0, 100 - form.cableSharePercent) })
                : undefined)}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <DecimalField fullWidth size="small" label={t("promos@form.cableBudgetJod")} value={form.cableBudgetJod}
              onValueChange={(n) => set("cableBudgetJod", n)} required={cablePays}
              error={!!err("cableBudgetJod")} helperText={err("cableBudgetJod") ?? t("promos@form.budgetHint")}
              InputProps={{ endAdornment: <InputAdornment position="end">JOD</InputAdornment> }} />
          </Grid>
          {campaign && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>{t("promos@form.spent")}</Typography>
              <Typography variant="body2" fontWeight={800}>
                {fmtJod(campaign.cableSpentJod)}
                {campaign.cableBudgetJod != null && (
                  <Typography component="span" variant="caption" color="text.secondary">
                    {" "}/ {fmtJod(campaign.cableBudgetJod)} · {t("promos@form.left")} {fmtJod(campaign.budgetLeftJod)}
                  </Typography>
                )}
              </Typography>
              {spentPct != null && (
                <LinearProgress variant="determinate" value={spentPct} color={spentPct >= 90 ? "error" : spentPct >= 70 ? "warning" : "primary"}
                  sx={{ mt: 0.75, height: 8, borderRadius: 4 }} />
              )}
            </Grid>
          )}
        </Grid>
      </Section>

      <Section title={t("promos@form.where")} hint={partnerPays ? t("promos@rules.noAllWhenPartnerPays") : t("promos@form.whereHint")}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={1}>
              <Typography variant="body2" fontWeight={700}>{t("promos@form.stations")}</Typography>
              {scopeToggle("stationsScope")}
              {err("stationsScope") && <Typography variant="caption" color="error">{err("stationsScope")}</Typography>}
              {form.stationsScope === "Selected" && (
                <PartnerMultiSelect kind="stations" value={form.stationIds} onChange={(ids) => set("stationIds", ids)}
                  label={t("promos@form.pickStations")} error={!!err("stationIds")} helperText={err("stationIds")} />
              )}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={1}>
              <Typography variant="body2" fontWeight={700}>{t("promos@form.providers")}</Typography>
              {scopeToggle("serviceProvidersScope")}
              {err("serviceProvidersScope") && <Typography variant="caption" color="error">{err("serviceProvidersScope")}</Typography>}
              {form.serviceProvidersScope === "Selected" && (
                <PartnerMultiSelect kind="providers" value={form.serviceProviderIds} onChange={(ids) => set("serviceProviderIds", ids)}
                  label={t("promos@form.pickProviders")} error={!!err("serviceProviderIds")} helperText={err("serviceProviderIds")} />
              )}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              multiple
              size="small"
              options={categories.map((c) => c.id)}
              value={form.serviceCategoryIds}
              onChange={(_, v) => set("serviceCategoryIds", v)}
              getOptionLabel={(id) => {
                const c = categories.find((x) => x.id === id);
                return c ? (isAr ? c.nameAr || c.name : c.name) : `#${id}`;
              }}
              filterSelectedOptions
              renderTags={(tags, getTagProps) =>
                tags.map((id, index) => {
                  const { key, ...rest } = getTagProps({ index });
                  const c = categories.find((x) => x.id === id);
                  return <Chip key={key} size="small" label={c ? (isAr ? c.nameAr || c.name : c.name) : `#${id}`} {...rest} />;
                })
              }
              renderInput={(params) => (
                <TextField {...params} label={t("promos@form.categories")} helperText={err("serviceCategoryIds") ?? t("promos@form.categoriesHint")}
                  error={!!err("serviceCategoryIds")} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <CityMultiSelect value={form.cities} onChange={(v) => set("cities", v)} label={t("promos@form.cities")}
              helperText={err("cities") ?? t("promos@form.citiesHint")} error={!!err("cities")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <DecimalField fullWidth size="small" label={t("promos@form.minAmountJod")} value={form.minAmountJod}
              onValueChange={(n) => set("minAmountJod", n)} error={!!err("minAmountJod")} helperText={err("minAmountJod")}
              InputProps={{ endAdornment: <InputAdornment position="end">JOD</InputAdornment> }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControlLabel control={<Checkbox checked disabled />} label={t("promos@appliesTo.PartnerScan")} />
            <Typography variant="caption" color="text.secondary" display="block">{t("promos@form.appliesToHint")}</Typography>
          </Grid>
        </Grid>
      </Section>

      <Section title={t("promos@form.limits")}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth size="small" type="datetime-local" label={t("promos@form.startsAt")} value={form.startsAt}
              onChange={(e) => set("startsAt", e.target.value)} InputLabelProps={{ shrink: true }} helperText={t("promos@form.jordanTime")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth size="small" type="datetime-local" label={t("promos@form.endsAt")} value={form.endsAt}
              onChange={(e) => set("endsAt", e.target.value)} InputLabelProps={{ shrink: true }}
              error={!!err("endsAt")} helperText={err("endsAt") ?? t("promos@form.jordanTime")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField fullWidth size="small" type="number" label={t("promos@form.validDaysAfterClaim")} value={form.validDaysAfterClaim}
              onChange={(e) => set("validDaysAfterClaim", e.target.value)} error={!!err("validDaysAfterClaim")}
              helperText={err("validDaysAfterClaim") ?? t("promos@form.validDaysHint")} inputProps={{ min: 1, max: 365 }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField fullWidth size="small" type="number" label={t("promos@form.totalLimit")} value={form.totalLimit}
              onChange={(e) => set("totalLimit", e.target.value)} error={!!err("totalLimit")}
              helperText={err("totalLimit") ?? t("promos@form.totalLimitHint")} inputProps={{ min: 1 }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField fullWidth size="small" type="number" label={t("promos@form.perUserLimit")} value={form.perUserLimit}
              onChange={(e) => set("perUserLimit", e.target.value)} error={!!err("perUserLimit")} helperText={err("perUserLimit")}
              inputProps={{ min: 1, max: 100 }} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel control={<Switch checked={form.newUsersOnly} onChange={(e) => set("newUsersOnly", e.target.checked)} />}
              label={t("promos@form.newUsersOnly")} />
          </Grid>
        </Grid>
      </Section>

      <Section title={t("promos@form.code")} hint={codeModeLocked ? t("promos@form.codeModeLocked") : t("promos@form.codeHint")}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 5 }}>
            <ToggleButtonGroup exclusive size="small" value={form.codeMode} onChange={(_, v) => v && set("codeMode", v as PromoCodeMode)}
              disabled={codeModeLocked}>
              <ToggleButton value="Public">{t("promos@codeMode.Public")}</ToggleButton>
              <ToggleButton value="Unique">{t("promos@codeMode.Unique")}</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
              {t(`promos@codeModeHint.${form.codeMode}`)}
            </Typography>
          </Grid>
          {form.codeMode === "Public" && (
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth size="small" label={t("promos@form.publicCode")} value={form.publicCode}
                onChange={(e) => set("publicCode", e.target.value.toUpperCase())} error={!!err("publicCode")}
                helperText={err("publicCode") ?? t("promos@form.publicCodeHint")}
                inputProps={{ maxLength: 40, dir: "ltr", style: { fontFamily: "monospace", fontWeight: 700 } }} />
            </Grid>
          )}
        </Grid>
      </Section>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, position: "sticky", bottom: 0, zIndex: 2, bgcolor: "background.paper" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
          <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />}
            label={t("promos@form.isActive")} />
          <Box sx={{ flex: 1 }} />
          {touched && !valid && <Typography variant="caption" color="error">{t("promos@form.fixErrors")}</Typography>}
          <Button variant="contained" onClick={handleSubmit} disabled={busy}
            startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}>
            {campaign ? t("save") : t("promos@form.create")}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
