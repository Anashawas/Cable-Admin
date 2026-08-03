import { useState, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Stack, Typography, Avatar, Chip, Button, IconButton, Tooltip, Paper,
  Divider, Grid, Tabs, Tab, Link, CircularProgress, Rating, useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import VerifiedIcon from "@mui/icons-material/Verified";
import StarIcon from "@mui/icons-material/Star";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import PhoneIcon from "@mui/icons-material/Phone";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PublicIcon from "@mui/icons-material/Public";
import MapIcon from "@mui/icons-material/Map";
import PaymentsIcon from "@mui/icons-material/Payments";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import NotesIcon from "@mui/icons-material/Notes";
import CollectionsIcon from "@mui/icons-material/Collections";
import CategoryIcon from "@mui/icons-material/Category";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RateReviewIcon from "@mui/icons-material/RateReview";
import InsightsIcon from "@mui/icons-material/Insights";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { getServiceProviderById, getServiceProviderRatings } from "../services/service-provider-service";
import type { ServiceProviderDto } from "../types/api";
import SocialLinksDisplay from "../../social-media/components/SocialLinksDisplay";
import ProviderActivityFeed from "../../loyalty/components/ProviderActivityFeed";
import AnalyticsPanel from "../../analytics/components/AnalyticsPanel";

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Box>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5, pb: 1, borderBottom: "2px solid", borderColor: "secondary.100" }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "secondary.main", color: "secondary.contrastText", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 8px rgba(123,31,162,0.3)" }}>{icon}</Box>
        <Typography variant="subtitle1" fontWeight={800}>{title}</Typography>
      </Stack>
      {children}
    </Box>
  );
}

function InfoItem({ icon, label, value }: { icon?: ReactNode; label: string; value?: ReactNode }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ py: 0.5 }}>
        {icon && <Box sx={{ color: "text.disabled", display: "flex", mt: 0.2 }}>{icon}</Box>}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
          <Box sx={{ fontSize: "0.9rem", fontWeight: 600 }}>{value ?? "—"}</Box>
        </Box>
      </Stack>
    </Grid>
  );
}

export default function ServiceProviderProfileScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const providerId = Number(id);
  const valid = Number.isFinite(providerId) && providerId > 0;
  const [tab, setTab] = useState(0);

  const { data: provider, isLoading } = useQuery({
    queryKey: ["service-providers", "detail", providerId],
    queryFn: () => getServiceProviderById(providerId),
    enabled: valid,
  });

  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ["service-providers", "ratings", providerId],
    queryFn: () => getServiceProviderRatings(providerId),
    enabled: valid && tab === 2,
  });

  if (isLoading || !provider) {
    return (
      <AppScreenContainer>
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>
      </AppScreenContainer>
    );
  }

  const s = provider as ServiceProviderDto;
  const hasCoords = s.latitude != null && s.longitude != null;
  const hours = s.fromTime && s.toTime ? `${s.fromTime} – ${s.toTime}` : null;
  const payments = (s.methodPayment ?? "").split(/[,،]/).map((p) => p.trim()).filter(Boolean);
  const fmtDate = (v: string) => new Date(v).toLocaleDateString(i18n.language === "ar" ? "ar-KW" : "en-US");

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2.5} sx={{ maxWidth: 1080, mx: "auto" }}>
          {/* Hero */}
          <Box sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, borderRadius: 3, p: { xs: 2.5, md: 3 }, color: "white", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)" }} />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ position: "relative" }}>
              <Tooltip title={t("back")}>
                <IconButton onClick={() => navigate("/service-providers")} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}><ArrowBackIcon /></IconButton>
              </Tooltip>
              <Avatar src={s.icon ?? undefined} sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 60, height: 60 }}><MiscellaneousServicesIcon /></Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="h5" fontWeight={800} noWrap>{s.name}</Typography>
                  <Chip label={`#${s.id}`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700 }} />
                  {s.serviceCategoryName && <Chip icon={<CategoryIcon sx={{ color: "#fff !important", fontSize: "15px !important" }} />} label={s.serviceCategoryName} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600 }} />}
                  {s.isVerified && <Chip icon={<VerifiedIcon sx={{ color: "#fff !important", fontSize: "15px !important" }} />} label={t("chargeManagement@columns.verified")} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600 }} />}
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 0.5, opacity: 0.9 }} flexWrap="wrap" useFlexGap>
                  {s.rateCount > 0 && <Stack direction="row" spacing={0.5} alignItems="center"><StarIcon sx={{ fontSize: 16, color: "#ffd54f" }} /><Typography variant="caption">{s.avgRating.toFixed(1)} ({s.rateCount})</Typography></Stack>}
                  <Stack direction="row" spacing={0.5} alignItems="center"><VisibilityIcon sx={{ fontSize: 15 }} /><Typography variant="caption">{s.visitorsCount}</Typography></Stack>
                  {s.cityName && <Stack direction="row" spacing={0.5} alignItems="center"><LocationOnIcon sx={{ fontSize: 15 }} /><Typography variant="caption">{s.cityName}</Typography></Stack>}
                </Stack>
              </Box>
              <Button size="small" startIcon={<EditIcon sx={{ fontSize: 16 }} />} onClick={() => navigate(`/service-providers/${s.id}/edit`)} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" }, textTransform: "none", fontWeight: 700, borderRadius: 2, flexShrink: 0 }}>
                {t("edit")}
              </Button>
            </Stack>
          </Box>

          {/* Tabs */}
          <Paper elevation={1} sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile
              TabIndicatorProps={{ sx: { display: "none" } }}
              sx={{ borderBottom: 1, borderColor: "divider", px: 1.5, py: 1.25, bgcolor: "action.hover", minHeight: 0, "& .MuiTabs-flexContainer": { gap: 1 } }}>
              {[
                { icon: <MiscellaneousServicesIcon fontSize="small" />, label: t("chargeManagement@profile.overview") },
                { icon: <ReceiptLongIcon fontSize="small" />, label: t("loyalty@activity") },
                { icon: <RateReviewIcon fontSize="small" />, label: t("chargeManagement@reviews.title") },
                { icon: <InsightsIcon fontSize="small" />, label: t("analytics@title") },
              ].map((tb, i) => (
                <Tab key={i} icon={tb.icon} iconPosition="start" label={tb.label} disableRipple
                  sx={{ minHeight: 44, px: 2, borderRadius: 2.5, fontWeight: 700, textTransform: "none", color: "text.secondary", transition: "all .2s ease",
                    "&:hover": { bgcolor: "action.selected", color: "text.primary" },
                    "&.Mui-selected": { color: "secondary.contrastText", bgcolor: "secondary.main", boxShadow: "0 4px 12px rgba(123,31,162,0.35)" } }} />
              ))}
            </Tabs>

            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Overview */}
              {tab === 0 && (
                <Stack spacing={2.5} divider={<Divider flexItem />}>
                  <Section icon={<PersonIcon fontSize="small" />} title={t("chargeManagement@owner.title")}>
                    {s.ownerId ? (
                      <Grid container spacing={1.5}>
                        <InfoItem icon={<PersonIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@owner.current")}
                          value={<Link component="button" type="button" onClick={() => navigate(`/users/${s.ownerId}`)} fontWeight={700} sx={{ textAlign: "start" }}>{s.ownerName ? `${s.ownerName} · #${s.ownerId}` : `#${s.ownerId}`}</Link>} />
                      </Grid>
                    ) : <Chip label={t("chargeManagement@owner.none")} color="warning" variant="outlined" sx={{ fontWeight: 700 }} />}
                  </Section>

                  <Section icon={<PhoneIcon fontSize="small" />} title={t("chargeManagement@detail.contact")}>
                    <Grid container spacing={1.5}>
                      <InfoItem icon={<PhoneIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@columns.phone")} value={s.phone} />
                      <InfoItem icon={<AccessTimeIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@detail.hours")} value={hours} />
                      <InfoItem icon={<LocationOnIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@columns.address")} value={s.address} />
                      <InfoItem icon={<LocationOnIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@columns.city")} value={s.cityName} />
                      <InfoItem icon={<PublicIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@detail.country")} value={s.countryName} />
                      {hasCoords && (
                        <InfoItem icon={<MapIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@detail.coordinates")}
                          value={<Link href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`} target="_blank" rel="noopener noreferrer" fontWeight={600}>{s.latitude!.toFixed(5)}, {s.longitude!.toFixed(5)} · {t("chargeManagement@detail.viewOnMap")}</Link>} />
                      )}
                    </Grid>
                  </Section>

                  <Section icon={<CategoryIcon fontSize="small" />} title={t("serviceProviders@details") || "Details"}>
                    <Grid container spacing={1.5}>
                      <InfoItem label={t("chargeManagement@filters.status")} value={s.statusName} />
                      <InfoItem icon={<CategoryIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@detail.services")} value={s.service} />
                      <InfoItem icon={<AccessTimeIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@columns.detail")} value={fmtDate(s.createdAt)} />
                    </Grid>
                    {s.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{s.description}</Typography>}
                  </Section>

                  {(s.price != null || payments.length > 0) && (
                    <Section icon={<PaymentsIcon fontSize="small" />} title={t("chargeManagement@detail.pricing")}>
                      <Grid container spacing={1.5}>
                        <InfoItem icon={<PaymentsIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@form.price")} value={s.price != null ? `${s.price}${s.priceDescription ? ` · ${s.priceDescription}` : ""}` : ""} />
                      </Grid>
                      {payments.length > 0 && (
                        <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap sx={{ mt: 1 }}>{payments.map((p, i) => <Chip key={i} label={p} size="small" variant="outlined" />)}</Stack>
                      )}
                    </Section>
                  )}

                  {s.hasOffer && (
                    <Section icon={<LocalOfferIcon fontSize="small" />} title={t("chargeManagement@detail.offer")}>
                      <Typography variant="body2">{s.offerDescription || "—"}</Typography>
                    </Section>
                  )}

                  <SocialLinksDisplay providerType="ServiceProvider" providerId={s.id} />

                  {s.images.length > 0 && (
                    <Section icon={<CollectionsIcon fontSize="small" />} title={t("chargeManagement@detail.images")}>
                      <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
                        {s.images.map((url, i) => (
                          <Box key={i} component="img" src={url} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            sx={{ width: 96, height: 96, borderRadius: 2, objectFit: "cover", bgcolor: "action.hover", border: 1, borderColor: "divider" }} />
                        ))}
                      </Stack>
                    </Section>
                  )}
                </Stack>
              )}

              {/* Activity */}
              {tab === 1 && <ProviderActivityFeed providerType="ServiceProvider" providerId={s.id} enabled pageSize={15} />}

              {/* Reviews */}
              {tab === 2 && (
                ratingsLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={32} /></Box>
                ) : !ratings || ratings.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 6 }}>{t("chargeManagement@reviews.noReviews")}</Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {ratings.map((r) => (
                      <Paper key={r.id} elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <Avatar sx={{ width: 36, height: 36, bgcolor: "secondary.50", color: "secondary.main" }}>{(r.userName ?? "?").charAt(0).toUpperCase()}</Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                              <Link component="button" type="button" onClick={() => navigate(`/users/${r.userId}`)} variant="body2" fontWeight={700}>{r.userName || `#${r.userId}`}</Link>
                              <Rating value={r.rating} readOnly size="small" />
                              <Typography variant="caption" color="text.disabled">{fmtDate(r.createdAt)}</Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{r.comment || t("chargeManagement@reviews.noComment")}</Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )
              )}

              {/* Analytics */}
              {tab === 3 && <AnalyticsPanel entityType="ServiceProvider" entityId={s.id} enabled />}
            </Box>
          </Paper>
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
