import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Chip, CircularProgress, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import SendIcon from "@mui/icons-material/Send";
import InsightsIcon from "@mui/icons-material/Insights";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import BackButton from "../../../components/BackButton";
import { usePromoCampaign } from "../hooks/use-promos";
import { effectSummary } from "../utils/promo-rules";
import PromoCampaignForm from "./PromoCampaignForm";
import PromoCodesPanel from "./PromoCodesPanel";
import PromoAssignPanel from "./PromoAssignPanel";
import PromoReportPanel from "./PromoReportPanel";

/** One campaign: settings, unique codes, assignment and the report. `/promos/new` shows the form only. */
export default function PromoCampaignScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language.startsWith("ar");
  const { id } = useParams<{ id: string }>();
  const campaignId = id && id !== "new" ? Number(id) : null;
  const [tab, setTab] = useState(0);

  const { data: campaign, isLoading, error } = usePromoCampaign(campaignId);

  if (campaignId != null && isLoading) {
    return (
      <AppScreenContainer>
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>
      </AppScreenContainer>
    );
  }

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2} sx={{ maxWidth: 1180, mx: "auto" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <BackButton fallback="/promos" />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h5" fontWeight={800} noWrap>
                {campaign ? (isAr ? campaign.titleAr : campaign.titleEn) : t("promos@newCampaign")}
              </Typography>
              {campaign && (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                  <Chip size="small" color={campaign.isActive ? "success" : "default"} label={campaign.isActive ? t("active") : t("inactive")} />
                  <Chip size="small" variant="outlined" label={effectSummary(campaign.effectType, campaign.effectValue, campaign.maxDiscountJod, t)} />
                  <Chip size="small" variant="outlined" label={campaign.codeMode === "Public" ? campaign.publicCode ?? "—" : t("promos@codeMode.Unique")}
                    sx={{ fontFamily: campaign.codeMode === "Public" ? "monospace" : undefined, fontWeight: 700 }} />
                  <Typography variant="caption" color="text.secondary">#{campaign.id}</Typography>
                </Stack>
              )}
            </Box>
          </Stack>

          {campaignId != null && (error || !campaign) ? (
            <Alert severity="error">{t("loadingFailed")}</Alert>
          ) : campaign ? (
            <>
              <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
                  <Tab icon={<TuneIcon fontSize="small" />} iconPosition="start" label={t("promos@tabs.settings")} />
                  <Tab icon={<QrCode2Icon fontSize="small" />} iconPosition="start" label={t("promos@tabs.codes")} />
                  <Tab icon={<SendIcon fontSize="small" />} iconPosition="start" label={t("promos@tabs.assign")} />
                  <Tab icon={<InsightsIcon fontSize="small" />} iconPosition="start" label={t("promos@tabs.report")} />
                </Tabs>
              </Paper>
              {tab === 0 && <PromoCampaignForm campaign={campaign} onSaved={() => undefined} />}
              {tab === 1 && <PromoCodesPanel campaign={campaign} />}
              {tab === 2 && <PromoAssignPanel campaign={campaign} />}
              {tab === 3 && <PromoReportPanel campaignId={campaign.id} />}
            </>
          ) : (
            <PromoCampaignForm campaign={null} onSaved={(newId) => navigate(`/promos/${newId}`, { replace: true })} />
          )}
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
