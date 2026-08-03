import { useState, ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Stack, Typography, Avatar, Chip, Button, IconButton, Tooltip, Paper,
  Divider, Grid, Tabs, Tab, Link, CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import EvStationIcon from "@mui/icons-material/EvStation";
import VerifiedIcon from "@mui/icons-material/Verified";
import StarIcon from "@mui/icons-material/Star";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import HandshakeIcon from "@mui/icons-material/Handshake";
import PhoneIcon from "@mui/icons-material/Phone";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PublicIcon from "@mui/icons-material/Public";
import MapIcon from "@mui/icons-material/Map";
import BoltIcon from "@mui/icons-material/Bolt";
import PowerIcon from "@mui/icons-material/Power";
import SpeedIcon from "@mui/icons-material/Speed";
import PaymentsIcon from "@mui/icons-material/Payments";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import NotesIcon from "@mui/icons-material/Notes";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import CollectionsIcon from "@mui/icons-material/Collections";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RateReviewIcon from "@mui/icons-material/RateReview";
import InsightsIcon from "@mui/icons-material/Insights";
import PersonIcon from "@mui/icons-material/Person";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import EmailIcon from "@mui/icons-material/Email";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { getStationById } from "../services/station-form-service";
import { getComplaintsByChargingPointId } from "../../complaints/services/complaints-service";
import StationReviewsSection from "./StationReviewsSection";
import StationPremiumSection from "./StationPremiumSection";
import StationViewImageSection from "./StationViewImageSection";
import SocialLinksDisplay from "../../social-media/components/SocialLinksDisplay";
import ProviderActivityFeed from "../../loyalty/components/ProviderActivityFeed";
import AnalyticsPanel from "../../analytics/components/AnalyticsPanel";
import type { ChargingPointDto } from "../types/api";

function parseList(v?: string | null): string[] {
  if (!v || typeof v !== "string") return [];
  return v.replace(/^\[|\]$/g, "").split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
}
function fmtTime(v?: string | null) { const m = v ? /^(\d{1,2}:\d{2})/.exec(v.trim()) : null; return m ? m[1] : (v ?? ""); }

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Box>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5, pb: 1, borderBottom: "2px solid", borderColor: "primary.100" }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 3px 8px rgba(25,118,210,0.3)",
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle1" fontWeight={800} color="text.primary">{title}</Typography>
      </Stack>
      {children}
    </Box>
  );
}
function InfoItem({ icon, label, value }: { icon?: ReactNode; label: string; value?: ReactNode }) {
  if (value == null || value === "" || value === false) return null;
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        {icon && <Box sx={{ color: "text.disabled", display: "flex", mt: 0.2 }}>{icon}</Box>}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{label}</Typography>
          <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-word" }}>{value}</Typography>
        </Box>
      </Stack>
    </Grid>
  );
}

const COMPLAINT_STATUS: Record<number, { key: string; color: "info" | "default" | "success" | "primary" | "warning" | "error" | "secondary" }> = {
  0: { key: "new", color: "info" },
  1: { key: "notComplaint", color: "default" },
  2: { key: "solved", color: "success" },
  3: { key: "opened", color: "primary" },
  4: { key: "followUp", color: "warning" },
  5: { key: "unsolved", color: "error" },
  6: { key: "systemIssue", color: "secondary" },
};

export default function StationProfileScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const stationId = Number(id);
  const valid = Number.isFinite(stationId) && stationId > 0;
  const [tab, setTab] = useState(0);

  const { data: complaints, isLoading: complaintsLoading } = useQuery({
    queryKey: ["complaints", "by-station", stationId],
    queryFn: ({ signal }) => getComplaintsByChargingPointId(stationId, signal),
    enabled: valid && tab === 4,
  });

  const { data: station, isLoading } = useQuery({
    queryKey: ["charge-management", "station", stationId],
    queryFn: ({ signal }) => getStationById(stationId, signal),
    enabled: valid,
  });

  if (isLoading || !station) {
    return (
      <AppScreenContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>
      </AppScreenContainer>
    );
  }

  const s = station as ChargingPointDto;
  const services = parseList(s.service);
  const payments = parseList(s.methodPayment);
  const plugs = (s.plugTypeSummary ?? []).map((p) => p?.name).filter(Boolean) as string[];
  const imageUrls = (s.images ?? []).map((e: any) => (typeof e === "string" ? e : e?.url)).filter(Boolean) as string[];
  const hours = s.fromTime || s.toTime ? `${fmtTime(s.fromTime)} - ${fmtTime(s.toTime)}` : "";
  const hasCoords = s.latitude != null && s.longitude != null;
  const rating = s.avgChargingPointRate != null ? `${s.avgChargingPointRate.toFixed(1)}${s.rateCount != null ? ` (${s.rateCount})` : ""}` : "";
  const isPremium = s.stationType?.id === 2;

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2.5} sx={{ maxWidth: 1100, mx: "auto" }}>

          {/* ── Hero ── */}
          <Box sx={{ background: "linear-gradient(135deg, #0d3276 0%, #1565c0 100%)", borderRadius: 3, p: { xs: 2.5, md: 3 }, color: "#fff", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)" }} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                <Tooltip title={t("back")}>
                  <IconButton onClick={() => navigate("/charge-management")} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}><ArrowBackIcon /></IconButton>
                </Tooltip>
                <Avatar src={s.iConUrl ?? undefined} variant="rounded" sx={{ width: 60, height: 60, bgcolor: "rgba(255,255,255,0.18)" }}><EvStationIcon sx={{ fontSize: 32 }} /></Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="h5" fontWeight={800} noWrap>{s.name ?? "—"}</Typography>
                    {s.isVerified && <Chip icon={<VerifiedIcon sx={{ color: "#fff !important", fontSize: "15px !important" }} />} label={t("chargeManagement@columns.verified")} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600 }} />}
                    {isPremium && <Chip icon={<WorkspacePremiumIcon sx={{ color: "#FFD54F !important", fontSize: "15px !important" }} />} label="Premium" size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600 }} />}
                    {s.isPartner && <Chip icon={<HandshakeIcon sx={{ color: "#fff !important", fontSize: "14px !important" }} />} label={t("chargeManagement@partner")} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600 }} />}
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
                    {s.statusSummary?.name && <Chip label={s.statusSummary.name} size="small" sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff", fontWeight: 600 }} />}
                    {rating && <Chip icon={<StarIcon sx={{ color: "#FFD54F !important", fontSize: "15px !important" }} />} label={rating} size="small" sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff" }} />}
                    {s.visitorsCount != null && <Chip icon={<VisibilityIcon sx={{ color: "#fff !important", fontSize: "14px !important" }} />} label={s.visitorsCount} size="small" sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff" }} />}
                    <Chip label={`ID ${s.id}`} size="small" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }} />
                  </Stack>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" startIcon={<PhotoLibraryIcon />} onClick={() => navigate(`/charge-management/${s.id}/media`)}
                  sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff", fontWeight: 600, textTransform: "none", border: "1px solid rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.28)" } }}>
                  {t("chargeManagement@actions.media")}
                </Button>
                <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/charge-management/edit/${s.id}`)}
                  sx={{ bgcolor: "#fff", color: "primary.main", fontWeight: 700, textTransform: "none", "&:hover": { bgcolor: "grey.100" } }}>
                  {t("edit")}
                </Button>
              </Stack>
            </Stack>
          </Box>

          {/* Premium status (read-only, only for premium) */}
          <StationPremiumSection chargingPointId={s.id} enabled={isPremium} />

          {/* ── Tabs ── */}
          <Paper elevation={1} sx={{ borderRadius: 3, overflow: "hidden" }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              TabIndicatorProps={{ sx: { display: "none" } }}
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                px: 1.5,
                py: 1.25,
                bgcolor: "action.hover",
                minHeight: 0,
                "& .MuiTabs-flexContainer": { gap: 1 },
              }}
            >
              {[
                { icon: <EvStationIcon fontSize="small" />, label: t("chargeManagement@profile.overview") },
                { icon: <ReceiptLongIcon fontSize="small" />, label: t("loyalty@activity") },
                { icon: <RateReviewIcon fontSize="small" />, label: t("chargeManagement@reviews.title") },
                { icon: <InsightsIcon fontSize="small" />, label: t("analytics@title") },
                { icon: <ReportProblemIcon fontSize="small" />, label: t("chargeManagement@complaints.title") },
              ].map((tb, i) => (
                <Tab
                  key={i}
                  icon={tb.icon}
                  iconPosition="start"
                  label={tb.label}
                  disableRipple
                  sx={{
                    minHeight: 44,
                    px: 2,
                    borderRadius: 2.5,
                    fontWeight: 700,
                    textTransform: "none",
                    color: "text.secondary",
                    transition: "all .2s ease",
                    "&:hover": { bgcolor: "action.selected", color: "text.primary" },
                    "&.Mui-selected": {
                      color: "primary.contrastText",
                      bgcolor: "primary.main",
                      boxShadow: "0 4px 12px rgba(25,118,210,0.35)",
                    },
                  }}
                />
              ))}
            </Tabs>

            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Overview */}
              {tab === 0 && (
                <Stack spacing={2.5} divider={<Divider flexItem />}>
                  {/* Premium ad image (viewImage) — pinned at top, highlighted */}
                  <StationViewImageSection
                    stationId={s.id}
                    viewImage={s.viewImage}
                    viewImageStatus={s.viewImageStatus}
                  />

                  <Section icon={<PersonIcon fontSize="small" />} title={t("chargeManagement@owner.title")}>
                    {s.ownerId ? (
                      <Grid container spacing={1.5}>
                        <InfoItem
                          icon={<PersonIcon sx={{ fontSize: 16 }} />}
                          label={t("chargeManagement@owner.current")}
                          value={
                            <Link component="button" type="button" onClick={() => navigate(`/users/${s.ownerId}`)} fontWeight={700} sx={{ textAlign: "start" }}>
                              {s.ownerName ? `${s.ownerName} · #${s.ownerId}` : `#${s.ownerId}`}
                            </Link>
                          }
                        />
                        <InfoItem icon={<EmailIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@owner.email")} value={s.ownerEmail} />
                        <InfoItem icon={<PhoneIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@owner.phone")} value={s.ownerPhone ?? s.ownerAccountPhone} />
                      </Grid>
                    ) : (
                      <Chip icon={<PersonOffIcon />} label={t("chargeManagement@owner.none")} color="warning" variant="outlined" sx={{ fontWeight: 700 }} />
                    )}
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
                          value={<Link href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`} target="_blank" rel="noopener noreferrer" fontWeight={600}>
                            {s.latitude!.toFixed(5)}, {s.longitude!.toFixed(5)} · {t("chargeManagement@detail.viewOnMap")}
                          </Link>} />
                      )}
                    </Grid>
                  </Section>

                  <Section icon={<BoltIcon fontSize="small" />} title={t("chargeManagement@detail.charging")}>
                    <Grid container spacing={1.5}>
                      <InfoItem label={t("chargeManagement@form.chargerPointType")} value={s.chargingPointType?.name} />
                      <InfoItem label={t("chargeManagement@form.stationType")} value={s.stationType?.name} />
                      <InfoItem icon={<BoltIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@detail.brand")} value={s.chargerBrand} />
                      <InfoItem icon={<SpeedIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@columns.speed")} value={s.chargerSpeed != null ? `${s.chargerSpeed} kW` : ""} />
                      <InfoItem icon={<PowerIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@columns.chargers")} value={s.chargersCount} />
                    </Grid>
                    {plugs.length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("chargeManagement@columns.plugs")}</Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap sx={{ mt: 0.5 }}>
                          {plugs.map((p, i) => <Chip key={i} icon={<PowerIcon sx={{ fontSize: "14px !important" }} />} label={p} size="small" variant="outlined" color="primary" />)}
                        </Stack>
                      </Box>
                    )}
                  </Section>

                  {(s.price != null || payments.length > 0) && (
                    <Section icon={<PaymentsIcon fontSize="small" />} title={t("chargeManagement@detail.pricing")}>
                      <Grid container spacing={1.5}>
                        <InfoItem icon={<PaymentsIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@form.price")} value={s.price != null ? s.price : ""} />
                      </Grid>
                      {payments.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("chargeManagement@columns.payment")}</Typography>
                          <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap sx={{ mt: 0.5 }}>
                            {payments.map((p, i) => <Chip key={i} label={p} size="small" variant="outlined" />)}
                          </Stack>
                        </Box>
                      )}
                    </Section>
                  )}

                  {s.hasOffer && (
                    <Section icon={<LocalOfferIcon fontSize="small" />} title={t("chargeManagement@detail.offer")}>
                      <Typography variant="body2">{s.offerDescription || "—"}</Typography>
                    </Section>
                  )}

                  {services.length > 0 && (
                    <Section icon={<RoomServiceIcon fontSize="small" />} title={t("chargeManagement@detail.services")}>
                      <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap>{services.map((l, i) => <Chip key={i} label={l} size="small" variant="outlined" />)}</Stack>
                    </Section>
                  )}

                  {s.note && (
                    <Section icon={<NotesIcon fontSize="small" />} title={t("chargeManagement@form.note")}>
                      <Typography variant="body2" color="text.secondary">{s.note}</Typography>
                    </Section>
                  )}

                  <SocialLinksDisplay providerType="ChargingPoint" providerId={s.id} />

                  {imageUrls.length > 0 && (
                    <Section icon={<CollectionsIcon fontSize="small" />} title={t("chargeManagement@detail.images")}>
                      <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
                        {imageUrls.map((url, i) => (
                          <Box key={i} component="img" src={url} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            sx={{ width: 96, height: 96, borderRadius: 2, objectFit: "cover", bgcolor: "action.hover", border: 1, borderColor: "divider" }} />
                        ))}
                      </Stack>
                    </Section>
                  )}
                </Stack>
              )}

              {/* Activity (transactions + points) */}
              {tab === 1 && <ProviderActivityFeed providerType="ChargingPoint" providerId={s.id} enabled pageSize={15} />}

              {/* Reviews */}
              {tab === 2 && <StationReviewsSection chargingPointId={s.id} enabled />}

              {/* Analytics */}
              {tab === 3 && <AnalyticsPanel entityType="ChargingPoint" entityId={s.id} enabled />}

              {/* Complaints */}
              {tab === 4 && (
                complaintsLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={32} /></Box>
                ) : !complaints || complaints.length === 0 ? (
                  <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
                    <ReportProblemIcon sx={{ fontSize: 42, color: "grey.300" }} />
                    <Typography variant="body2" color="text.secondary">{t("chargeManagement@complaints.empty")}</Typography>
                  </Stack>
                ) : (
                  <Stack spacing={1.5}>
                    {complaints.map((c) => {
                      const cfg = COMPLAINT_STATUS[c.status] ?? COMPLAINT_STATUS[0];
                      return (
                        <Paper key={c.id} elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                          <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${cfg.color}.50`, color: `${cfg.color}.main`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <ReportProblemIcon fontSize="small" />
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                                <Chip size="small" color={cfg.color} variant="outlined" label={t(`complaints@status_${cfg.key}`)} sx={{ height: 20, fontWeight: 700, "& .MuiChip-label": { px: 0.75, fontSize: "0.62rem" } }} />
                                {c.userAccount && (
                                  <Chip size="small" icon={<PersonIcon sx={{ fontSize: "13px !important" }} />}
                                    label={c.userAccount.name ? `${c.userAccount.name} · #${c.userAccount.id}` : `#${c.userAccount.id}`}
                                    variant="outlined" onClick={() => navigate(`/users/${c.userAccount!.id}`)}
                                    sx={{ height: 20, cursor: "pointer", "& .MuiChip-label": { px: 0.5, fontSize: "0.62rem", fontWeight: 700 } }} />
                                )}
                                <Typography variant="caption" color="text.disabled">#{c.id}</Typography>
                              </Stack>
                              <Typography variant="body2">{c.note || "—"}</Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                )
              )}
            </Box>
          </Paper>
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
