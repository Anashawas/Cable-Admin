import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import TuneIcon from "@mui/icons-material/Tune";
import HistoryIcon from "@mui/icons-material/History";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import BackButton from "../../../components/BackButton";
import { DecimalField } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import { apiErrorMessage, apiFieldErrors } from "../../../utils/api-error";
import { usePlan, usePlanFeatures, usePlans, useSavePlan, useSetPlanActive } from "../hooks/use-billing";
import {
  BILLING_PROVIDER_TYPES,
  LEGACY_ENTITY_TYPES,
  type PlanCategory,
  type PlanDto,
  type PlanInput,
  type PlanSaveResult,
  type PointsRule,
} from "../types/api";
import { PLAN_KEY_PATTERN, validatePointsRule, validatePriceOption, type PriceOptionDraft } from "../utils/plan-rules";
import PointsRuleEditor from "./PointsRuleEditor";
import PriceOptionsEditor from "./PriceOptionsEditor";
import MarginCalculator from "./MarginCalculator";
import PlanSaveResultDialog from "./PlanSaveResultDialog";
import PlanHistoryPanel from "./PlanHistoryPanel";

interface FormState {
  key: string;
  category: PlanCategory;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  appliesTo: string[];
  features: string[];
  includesPlanIds: number[];
  legacyEntityTypes: string[];
  priceOptions: PriceOptionDraft[];
  pointsRule: PointsRule;
  trialDays: string;
  trialScans: string;
  isVisible: boolean;
  sortOrder: string;
  badgeColor: string;
  dailySoftCap: string;
  targetMarginPercent: number | null;
  note: string;
}

const DEFAULT_RULE: PointsRule = {
  mode: "Tiered",
  fixedPoints: null,
  tiers: [
    { fromJod: 1, toJod: 3, points: 10 },
    { fromJod: 3, toJod: null, points: 20 },
  ],
};

const emptyForm = (category: PlanCategory): FormState => ({
  key: "",
  category,
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  appliesTo: ["ChargingPoint", "ServiceProvider"],
  features: [],
  includesPlanIds: [],
  legacyEntityTypes: [],
  priceOptions: category === "Loyalty"
    ? [{ months: null, priceJod: null, scans: 400, unlimited: false }]
    : [{ months: 1, priceJod: null, scans: null, unlimited: false }],
  pointsRule: DEFAULT_RULE,
  trialDays: "0",
  trialScans: "0",
  isVisible: true,
  sortOrder: "0",
  badgeColor: "#00897B",
  dailySoftCap: "",
  targetMarginPercent: 20,
  note: "",
});

const fromPlan = (p: PlanDto): FormState => ({
  key: p.key,
  category: p.category,
  nameAr: p.nameAr ?? "",
  nameEn: p.nameEn ?? "",
  descriptionAr: p.descriptionAr ?? "",
  descriptionEn: p.descriptionEn ?? "",
  appliesTo: p.appliesTo ?? [],
  features: p.features ?? [],
  includesPlanIds: p.includesPlanIds ?? [],
  legacyEntityTypes: p.legacyEntityTypes ?? [],
  // Retired options stay on old records but are not editable any more.
  priceOptions: (p.priceOptions ?? [])
    .filter((o) => o.isActive)
    .map((o) => ({ id: o.id, months: o.months ?? null, priceJod: o.priceJod, scans: o.scans ?? null, unlimited: o.isUnlimited })),
  pointsRule: p.pointsRule ?? DEFAULT_RULE,
  trialDays: String(p.trialDays ?? 0),
  trialScans: String(p.trialScans ?? 0),
  isVisible: p.isVisible,
  sortOrder: String(p.sortOrder ?? 0),
  badgeColor: p.badgeColor ?? "#00897B",
  dailySoftCap: p.dailySoftCap == null ? "" : String(p.dailySoftCap),
  targetMarginPercent: p.targetMarginPercent ?? 20,
  note: "",
});

const intOr = (v: string, fallback: number | null): number | null => {
  if (v.trim() === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}>
      <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>{hint ?? " "}</Typography>
      {children}
    </Paper>
  );
}

/** Create / edit a plan (§2b.10) with the margin calculator for loyalty plans and the change log. */
export default function PlanFormScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language.startsWith("ar");
  const { id } = useParams<{ id: string }>();
  const planId = id && id !== "new" ? Number(id) : null;
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data: plan, isLoading, error } = usePlan(planId);
  const { data: features = [] } = usePlanFeatures();
  const { data: allPlans = [] } = usePlans(true);
  const save = useSavePlan();
  const setActive = useSetPlanActive();

  const [searchParams] = useSearchParams();
  const initialCategory: PlanCategory = searchParams.get("category") === "Loyalty" ? "Loyalty" : "Subscription";
  const [form, setForm] = useState<FormState>(() => emptyForm(initialCategory));
  const [tab, setTab] = useState(0);
  const [touched, setTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PlanSaveResult | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveNote, setArchiveNote] = useState("");

  useEffect(() => {
    if (plan) setForm(fromPlan(plan));
  }, [plan]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const loyalty = form.category === "Loyalty";
  const isFree = plan?.key === "free";

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!planId && !PLAN_KEY_PATTERN.test(form.key)) e.key = t("billing@rules.keyFormat");
    if (!form.nameAr.trim()) e.nameAr = t("billing@rules.required");
    if (!form.nameEn.trim()) e.nameEn = t("billing@rules.required");
    if (form.appliesTo.length === 0) e.appliesTo = t("billing@rules.appliesTo");
    const optionError = form.priceOptions.map((o) => validatePriceOption(form.category, o)).find(Boolean);
    if (optionError) e.priceOptions = t(`billing@rules.${optionError.key}`, optionError.values);
    if (loyalty) {
      const ruleError = validatePointsRule(form.pointsRule);
      if (ruleError) e.pointsRule = t(`billing@rules.${ruleError.key}`, ruleError.values);
    }
    if (intOr(form.trialDays, 0)! < 0) e.trialDays = t("billing@rules.nonNegative");
    if (intOr(form.trialScans, 0)! < 0) e.trialScans = t("billing@rules.nonNegative");
    return e;
  }, [form, planId, loyalty, t]);

  const fieldError = (k: string) => (touched ? errors[k] : undefined) ?? serverErrors[k];
  const valid = Object.keys(errors).length === 0;

  const handleSave = () => {
    setTouched(true);
    if (!valid) {
      openErrorSnackbar({ message: t("billing@plan.fixErrors") });
      return;
    }
    const body: PlanInput = {
      key: form.key.trim(),
      category: form.category,
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      descriptionAr: form.descriptionAr.trim() || null,
      descriptionEn: form.descriptionEn.trim() || null,
      appliesTo: form.appliesTo,
      features: form.features,
      includesPlanIds: form.includesPlanIds,
      legacyEntityTypes: loyalty ? [] : form.legacyEntityTypes,
      priceOptions: form.priceOptions.map((o, i) => ({
        id: o.id ?? null,
        months: o.months,
        priceJod: o.priceJod ?? 0,
        scans: form.category === "Loyalty" && !o.unlimited ? o.scans : null,
        sortOrder: i,
      })),
      pointsRule: loyalty ? form.pointsRule : null,
      trialDays: intOr(form.trialDays, 0) ?? 0,
      trialScans: loyalty ? intOr(form.trialScans, 0) ?? 0 : 0,
      isActive: plan?.isActive ?? true,
      isVisible: form.isVisible,
      sortOrder: intOr(form.sortOrder, 0) ?? 0,
      badgeColor: form.badgeColor || null,
      dailySoftCap: loyalty ? intOr(form.dailySoftCap, null) : null,
      targetMarginPercent: loyalty ? form.targetMarginPercent : null,
      note: planId ? form.note.trim() || null : null,
    };
    save.mutate(
      { id: planId, body },
      {
        onSuccess: (res) => {
          setServerErrors({});
          openSuccessSnackbar({ message: t("billing@plan.saved") });
          set("note", "");
          if (!planId) navigate(`/billing/plans/${res.plan.id}`, { replace: true });
          if (planId && ((res.changes?.length ?? 0) > 0 || res.affectedSubscribers > 0)) setResult(res);
        },
        onError: (err) => {
          setServerErrors(apiFieldErrors(err));
          openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) });
        },
      }
    );
  };

  const handleArchive = () => {
    if (!plan) return;
    setActive.mutate(
      { id: plan.id, isActive: !plan.isActive, note: archiveNote.trim() || null },
      {
        onSuccess: () => {
          setArchiveOpen(false);
          openSuccessSnackbar({ message: t(plan.isActive ? "billing@plan.archived" : "billing@plan.reactivated") });
        },
        onError: (err) => openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) }),
      }
    );
  };

  if (planId && isLoading) {
    return <AppScreenContainer><Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box></AppScreenContainer>;
  }
  if (planId && (error || !plan)) {
    return <AppScreenContainer><Box p={2}><Alert severity="error">{t("loadingFailed")}</Alert></Box></AppScreenContainer>;
  }

  const otherSubscriptionPlans = allPlans.filter((p) => p.category === "Subscription" && p.id !== planId);
  const busy = save.isPending;

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2} sx={{ maxWidth: 1180, mx: "auto" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <BackButton fallback="/billing/plans" />
            <Box sx={{ width: 14, height: 40, borderRadius: 1, bgcolor: form.badgeColor || "primary.main", flexShrink: 0 }} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h5" fontWeight={800} noWrap>
                {plan ? (isAr ? plan.nameAr : plan.nameEn) : t("billing@plan.newTitle")}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip size="small" variant="outlined" label={t(`billing@category.${form.category}`)} />
                {plan && <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{plan.key}</Typography>}
                {plan && !plan.isActive && <Chip size="small" color="default" label={t("billing@plan.archivedChip")} />}
                {plan && <Typography variant="caption" color="text.secondary">{t("billing@plan.subscribers", { count: plan.subscriberCount })}</Typography>}
              </Stack>
            </Box>
            {plan && !isFree && (
              <Button variant="outlined" color={plan.isActive ? "warning" : "success"}
                startIcon={plan.isActive ? <ArchiveIcon /> : <UnarchiveIcon />}
                onClick={() => {
                  setArchiveNote("");
                  setArchiveOpen(true);
                }}>
                {plan.isActive ? t("billing@plan.archive") : t("billing@plan.reactivate")}
              </Button>
            )}
          </Stack>

          {plan && (
            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab icon={<TuneIcon fontSize="small" />} iconPosition="start" label={t("billing@plan.tabPlan")} />
                <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label={t("billing@plan.tabHistory")} />
              </Tabs>
            </Paper>
          )}

          {plan && tab === 1 ? (
            <PlanHistoryPanel planId={plan.id} />
          ) : (
            <>
              <Section title={t("billing@plan.identity")} hint={planId ? t("billing@plan.keyFixed") : t("billing@plan.keyHint")}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField fullWidth size="small" required label={t("billing@plan.key")} value={form.key} disabled={!!planId}
                      onChange={(e) => set("key", e.target.value.toLowerCase())} error={!!fieldError("key")} helperText={fieldError("key")}
                      inputProps={{ dir: "ltr", style: { fontFamily: "monospace" }, maxLength: 50 }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField select fullWidth size="small" label={t("billing@plan.category")} value={form.category} disabled={!!planId}
                      onChange={(e) => setForm(emptyForm(e.target.value as PlanCategory))}>
                      <MenuItem value="Subscription">{t("billing@category.Subscription")}</MenuItem>
                      <MenuItem value="Loyalty">{t("billing@category.Loyalty")}</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>{t("billing@plan.appliesTo")}</Typography>
                    <FormGroup row>
                      {BILLING_PROVIDER_TYPES.map((pt) => (
                        <FormControlLabel key={pt} label={t(`billing@providerType.${pt}`)}
                          control={<Checkbox size="small" checked={form.appliesTo.includes(pt)}
                            onChange={(e) => set("appliesTo", e.target.checked ? [...form.appliesTo, pt] : form.appliesTo.filter((x) => x !== pt))} />} />
                      ))}
                    </FormGroup>
                    {fieldError("appliesTo") && <Typography variant="caption" color="error">{fieldError("appliesTo")}</Typography>}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" required label={t("billing@plan.nameAr")} value={form.nameAr}
                      onChange={(e) => set("nameAr", e.target.value)} error={!!fieldError("nameAr")} helperText={fieldError("nameAr")} inputProps={{ dir: "rtl" }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" required label={t("billing@plan.nameEn")} value={form.nameEn}
                      onChange={(e) => set("nameEn", e.target.value)} error={!!fieldError("nameEn")} helperText={fieldError("nameEn")} inputProps={{ dir: "ltr" }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" multiline minRows={2} label={t("billing@plan.descriptionAr")} value={form.descriptionAr}
                      onChange={(e) => set("descriptionAr", e.target.value)} inputProps={{ dir: "rtl" }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" multiline minRows={2} label={t("billing@plan.descriptionEn")} value={form.descriptionEn}
                      onChange={(e) => set("descriptionEn", e.target.value)} inputProps={{ dir: "ltr" }} />
                  </Grid>
                </Grid>
              </Section>

              <Section title={t("billing@plan.features")} hint={t("billing@plan.featuresHint")}>
                <FormGroup row>
                  {features.map((f) => (
                    <FormControlLabel key={f.key} sx={{ minWidth: 220 }} label={isAr ? f.nameAr : f.nameEn}
                      control={<Checkbox size="small" checked={form.features.includes(f.key)}
                        onChange={(e) => set("features", e.target.checked ? [...form.features, f.key] : form.features.filter((x) => x !== f.key))} />} />
                  ))}
                </FormGroup>
                {fieldError("features") && <Typography variant="caption" color="error">{fieldError("features")}</Typography>}
                {!loyalty && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Autocomplete multiple size="small" options={otherSubscriptionPlans.map((p) => p.id)} value={form.includesPlanIds}
                        onChange={(_, v) => set("includesPlanIds", v)} filterSelectedOptions
                        getOptionLabel={(pid) => {
                          const p = allPlans.find((x) => x.id === pid);
                          return p ? (isAr ? p.nameAr : p.nameEn) : `#${pid}`;
                        }}
                        renderInput={(params) => <TextField {...params} label={t("billing@plan.includes")} helperText={t("billing@plan.includesHint")} />} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>{t("billing@plan.legacy")}</Typography>
                      <FormGroup row>
                        {LEGACY_ENTITY_TYPES.map((et) => (
                          <FormControlLabel key={et} label={t(`subscriptions@entityType.${et}`)}
                            control={<Checkbox size="small" checked={form.legacyEntityTypes.includes(et)}
                              onChange={(e) => set("legacyEntityTypes", e.target.checked ? [...form.legacyEntityTypes, et] : form.legacyEntityTypes.filter((x) => x !== et))} />} />
                        ))}
                      </FormGroup>
                      <Typography variant="caption" color="text.secondary">{t("billing@plan.legacyHint")}</Typography>
                    </Grid>
                  </Grid>
                )}
              </Section>

              <Section title={t("billing@plan.priceOptions")} hint={planId ? t("billing@plan.priceEditHint") : undefined}>
                <PriceOptionsEditor category={form.category} value={form.priceOptions} onChange={(v) => set("priceOptions", v)} disabled={busy} />
                {fieldError("priceOptions") && <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>{fieldError("priceOptions")}</Alert>}
              </Section>

              {loyalty && (
                <Section title={t("billing@plan.pointsRule")} hint={t("billing@plan.pointsRuleHint")}>
                  <PointsRuleEditor value={form.pointsRule} onChange={(r) => set("pointsRule", r)} disabled={busy} />
                </Section>
              )}

              {loyalty && (
                <Section title={t("billing@margin.title")} hint={t("billing@margin.hint")}>
                  <MarginCalculator pointsRule={form.pointsRule} options={form.priceOptions} targetMarginPercent={form.targetMarginPercent} />
                </Section>
              )}

              <Section title={t("billing@plan.settings")}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField fullWidth size="small" type="number" label={t("billing@plan.trialDays")} value={form.trialDays}
                      onChange={(e) => set("trialDays", e.target.value)} error={!!fieldError("trialDays")} helperText={fieldError("trialDays") ?? t("billing@plan.trialDaysHint")} />
                  </Grid>
                  {loyalty && (
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <TextField fullWidth size="small" type="number" label={t("billing@plan.trialScans")} value={form.trialScans}
                        onChange={(e) => set("trialScans", e.target.value)} error={!!fieldError("trialScans")} helperText={fieldError("trialScans")} />
                    </Grid>
                  )}
                  {loyalty && (
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <TextField fullWidth size="small" type="number" label={t("billing@plan.dailySoftCap")} value={form.dailySoftCap}
                        onChange={(e) => set("dailySoftCap", e.target.value)} helperText={t("billing@plan.dailySoftCapHint")} />
                    </Grid>
                  )}
                  {loyalty && (
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <DecimalField fullWidth size="small" label={t("billing@plan.targetMargin")} value={form.targetMarginPercent}
                        onValueChange={(n) => set("targetMarginPercent", n)}
                        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                    </Grid>
                  )}
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField fullWidth size="small" type="number" label={t("billing@plan.sortOrder")} value={form.sortOrder}
                      onChange={(e) => set("sortOrder", e.target.value)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField fullWidth size="small" type="color" label={t("billing@plan.badgeColor")} value={form.badgeColor}
                      onChange={(e) => set("badgeColor", e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel control={<Switch checked={form.isVisible} onChange={(e) => set("isVisible", e.target.checked)} />}
                      label={t("billing@plan.isVisible")} />
                  </Grid>
                </Grid>
              </Section>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, position: "sticky", bottom: 0, zIndex: 2, bgcolor: "background.paper" }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                  {planId ? (
                    <TextField size="small" label={t("billing@plan.note")} value={form.note} onChange={(e) => set("note", e.target.value)}
                      sx={{ flex: 1 }} helperText={t("billing@plan.noteHint")} />
                  ) : <Box sx={{ flex: 1 }} />}
                  <Button variant="contained" onClick={handleSave} disabled={busy}
                    startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}>
                    {planId ? t("save") : t("billing@plan.create")}
                  </Button>
                </Stack>
              </Paper>
            </>
          )}
        </Stack>
      </Box>

      <PlanSaveResultDialog result={result} onClose={() => setResult(null)} />

      <Dialog open={archiveOpen} onClose={() => !setActive.isPending && setArchiveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{plan?.isActive ? t("billing@plan.archiveTitle") : t("billing@plan.reactivateTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>{plan?.isActive ? t("billing@plan.archiveHint") : t("billing@plan.reactivateHint")}</Typography>
          <TextField fullWidth size="small" label={t("billing@plan.note")} value={archiveNote} onChange={(e) => setArchiveNote(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setArchiveOpen(false)} disabled={setActive.isPending}>{t("cancel")}</Button>
          <Button variant="contained" color={plan?.isActive ? "warning" : "success"} onClick={handleArchive} disabled={setActive.isPending}
            startIcon={setActive.isPending ? <CircularProgress size={18} color="inherit" /> : undefined}>
            {plan?.isActive ? t("billing@plan.archive") : t("billing@plan.reactivate")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
