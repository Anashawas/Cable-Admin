import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Collapse,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import GridOnIcon from "@mui/icons-material/GridOn";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import PeopleIcon from "@mui/icons-material/People";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { usePlans } from "../hooks/use-billing";
import type { PlanCategory, PlanDto } from "../types/api";
import { optionLabel } from "../utils/plan-rules";

function PlanCard({ plan }: { plan: PlanDto }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language.startsWith("ar");
  const options = plan.priceOptions.filter((o) => o.isActive);
  const accent = plan.badgeColor || "#00897B";

  return (
    <Card variant="outlined" sx={{ height: "100%", borderTop: `4px solid ${accent}`, opacity: plan.isActive ? 1 : 0.75 }}>
      <CardActionArea onClick={() => navigate(`/billing/plans/${plan.id}`)} sx={{ height: "100%", alignItems: "stretch" }}>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={800} noWrap>{isAr ? plan.nameAr : plan.nameEn}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{plan.key}</Typography>
            </Box>
            <Chip size="small" icon={<PeopleIcon />} label={plan.subscriberCount} color={plan.subscriberCount > 0 ? "primary" : "default"}
              title={t("billing@plan.subscribers", { count: plan.subscriberCount })} />
          </Stack>
          <Stack spacing={0.5} sx={{ mt: 1.5 }}>
            {options.length === 0 ? (
              <Typography variant="body2" color="text.secondary">{plan.key === "free" ? t("billing@plans.freeHint") : t("billing@option.none")}</Typography>
            ) : (
              options.slice(0, 4).map((o) => (
                <Typography key={o.id} variant="body2">{optionLabel(o, t)}</Typography>
              ))
            )}
            {options.length > 4 && <Typography variant="caption" color="text.secondary">+{options.length - 4}</Typography>}
          </Stack>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
            {plan.category === "Subscription" && (
              <Chip size="small" variant="outlined" label={t("billing@plans.featuresCount", { count: plan.features.length })} />
            )}
            {plan.pointsRule && (
              <Chip size="small" variant="outlined" label={t(`billing@rule.${plan.pointsRule.mode === "Fixed" ? "fixed" : "tiered"}`)} />
            )}
            {(plan.trialDays > 0 || plan.trialScans > 0) && (
              <Chip size="small" color="info" variant="outlined"
                label={plan.trialScans > 0 ? t("billing@plans.trialScans", { days: plan.trialDays, scans: plan.trialScans }) : t("billing@plans.trialDays", { days: plan.trialDays })} />
            )}
            {!plan.isVisible && <Chip size="small" icon={<VisibilityOffIcon />} label={t("billing@plans.hidden")} />}
            {plan.appliesTo.map((a) => (
              <Chip key={a} size="small" variant="outlined" label={t(`billing@providerType.${a}`)} />
            ))}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

/** "الباقات": plan cards grouped Subscription / Loyalty with subscriber counts; archived ones apart. */
export default function PlansScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: plans = [], isLoading, error } = usePlans(true);
  const [showArchived, setShowArchived] = useState(false);

  const groups = useMemo(() => {
    const sort = (a: PlanDto, b: PlanDto) => a.sortOrder - b.sortOrder || a.id - b.id;
    const active = plans.filter((p) => p.isActive);
    return {
      Subscription: active.filter((p) => p.category === "Subscription").sort(sort),
      Loyalty: active.filter((p) => p.category === "Loyalty").sort(sort),
      archived: plans.filter((p) => !p.isActive).sort(sort),
    };
  }, [plans]);

  const section = (category: PlanCategory) => (
    <Box key={category}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>{t(`billing@plans.group.${category}`)}</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => navigate(`/billing/plans/new?category=${category}`)}>
          {t("billing@plans.add")}
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>{t(`billing@plans.groupHint.${category}`)}</Typography>
      <Grid container spacing={2}>
        {isLoading
          ? [0, 1, 2].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}><Skeleton variant="rounded" height={170} /></Grid>
            ))
          : groups[category].map((p) => (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}><PlanCard plan={p} /></Grid>
            ))}
      </Grid>
    </Box>
  );

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={3}>
          <ScreenHeader title={t("billing@plans.title")} subtitle={t("billing@plans.subtitle")} icon={<WorkspacePremiumIcon fontSize="large" />} />
          <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
            <Button variant="outlined" startIcon={<GridOnIcon />} onClick={() => navigate("/billing/feature-matrix")}>
              {t("billing@matrix.navTitle")}
            </Button>
          </Stack>
          {error && <Alert severity="error">{t("loadingFailed")}</Alert>}
          {section("Subscription")}
          {section("Loyalty")}
          {groups.archived.length > 0 && (
            <Box>
              <Button color="inherit" onClick={() => setShowArchived((v) => !v)}
                endIcon={<ExpandMoreIcon sx={{ transform: showArchived ? "rotate(180deg)" : "none", transition: "transform .2s" }} />}>
                {t("billing@plans.archived", { count: groups.archived.length })}
              </Button>
              <Collapse in={showArchived}>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  {groups.archived.map((p) => (
                    <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}><PlanCard plan={p} /></Grid>
                  ))}
                </Grid>
              </Collapse>
            </Box>
          )}
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
