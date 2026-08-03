import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Chip,
  Stack,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Link,
  Grid,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EvStationIcon from "@mui/icons-material/EvStation";
import VerifiedIcon from "@mui/icons-material/Verified";
import StarIcon from "@mui/icons-material/Star";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PhoneIcon from "@mui/icons-material/Phone";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PublicIcon from "@mui/icons-material/Public";
import MapIcon from "@mui/icons-material/Map";
import BoltIcon from "@mui/icons-material/Bolt";
import PowerIcon from "@mui/icons-material/Power";
import EvStationOutlinedIcon from "@mui/icons-material/EvStation";
import PaymentsIcon from "@mui/icons-material/Payments";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import NotesIcon from "@mui/icons-material/Notes";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import CollectionsIcon from "@mui/icons-material/Collections";
import SpeedIcon from "@mui/icons-material/Speed";
import { useTranslation } from "react-i18next";
import type { ChargingPointDto } from "../types/api";
import SocialLinksDisplay from "../../social-media/components/SocialLinksDisplay";
import StationReviewsSection from "./StationReviewsSection";
import StationPremiumSection from "./StationPremiumSection";

/** Parse a delimited string (e.g. comma-separated) into list of labels. */
function parseList(value: string | null | undefined): string[] {
  if (!value || typeof value !== "string") return [];
  return value.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
}

/** Normalize image entry to URL string. */
function getImageUrl(entry: string | { url?: string }): string {
  if (typeof entry === "string") return entry;
  return entry?.url ?? "";
}

/** Trim trailing seconds from a "HH:mm:ss" time string. */
function fmtTime(v?: string | null): string {
  if (!v) return "";
  const m = /^(\d{1,2}:\d{2})(:\d{2})?$/.exec(v.trim());
  return m ? m[1] : v;
}

interface StationRowDetailDialogProps {
  open: boolean;
  onClose: () => void;
  station: ChargingPointDto | null;
}

// ── Small building blocks ─────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Box>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">{title}</Typography>
      </Stack>
      {children}
    </Box>
  );
}

/** One labelled value; renders nothing when value is empty/null. */
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

export default function StationRowDetailDialog({ open, onClose, station }: StationRowDetailDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const services = parseList(station?.service);
  const payments = parseList(station?.methodPayment);
  const plugs = (station?.plugTypeSummary ?? []).map((p) => p?.name).filter(Boolean) as string[];
  const imageUrls = (station?.images ?? []).map(getImageUrl).filter(Boolean) as string[];

  const hours = station && (station.fromTime || station.toTime)
    ? `${fmtTime(station.fromTime)} - ${fmtTime(station.toTime)}`
    : "";
  const hasCoords = station?.latitude != null && station?.longitude != null;
  const rating = station?.avgChargingPointRate != null
    ? `${station.avgChargingPointRate.toFixed(1)}${station.rateCount != null ? ` (${station.rateCount})` : ""}`
    : "";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
      {!station ? (
        <DialogContent><Typography color="text.secondary">No station selected.</Typography></DialogContent>
      ) : (
        <>
          {/* ── Header ── */}
          <Box sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, color: "#fff", p: 2.5, position: "relative" }}>
            <IconButton onClick={onClose} sx={{ position: "absolute", top: 8, right: 8, color: "rgba(255,255,255,0.85)" }}>
              <CloseIcon />
            </IconButton>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src={station.iConUrl ?? undefined} variant="rounded" sx={{ width: 60, height: 60, bgcolor: "rgba(255,255,255,0.18)" }}>
                <EvStationIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box sx={{ minWidth: 0, pr: 4 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="h6" fontWeight={800} noWrap>{station.name ?? "—"}</Typography>
                  {station.isVerified && (
                    <Chip icon={<VerifiedIcon sx={{ color: "#fff !important", fontSize: "16px !important" }} />} label={t("chargeManagement@columns.verified")} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700 }} />
                  )}
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} flexWrap="wrap" useFlexGap>
                  {station.statusSummary?.name && (
                    <Chip label={station.statusSummary.name} size="small" sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff", fontWeight: 600 }} />
                  )}
                  {rating && (
                    <Chip icon={<StarIcon sx={{ color: "#FFD54F !important", fontSize: "15px !important" }} />} label={rating} size="small" sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff", fontWeight: 600 }} />
                  )}
                  {station.visitorsCount != null && (
                    <Chip icon={<VisibilityIcon sx={{ color: "#fff !important", fontSize: "15px !important" }} />} label={station.visitorsCount} size="small" sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff", fontWeight: 600 }} />
                  )}
                  <Chip label={`ID ${station.id}`} size="small" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)", fontWeight: 600 }} />
                </Stack>
              </Box>
            </Stack>
          </Box>

          <DialogContent sx={{ p: 2.5 }}>
            <Stack spacing={2.5} divider={<Divider flexItem />}>

              {/* Premium status (read-only) — only fetches for premium stations */}
              <StationPremiumSection chargingPointId={station.id} enabled={open && station.stationType?.id === 2} />

              {/* Contact & Hours */}
              <Section icon={<PhoneIcon fontSize="small" />} title={t("chargeManagement@detail.contact")}>
                <Grid container spacing={1.5}>
                  <InfoItem icon={<PhoneIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@columns.phone")} value={station.phone} />
                  <InfoItem icon={<AccessTimeIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@detail.hours")} value={hours} />
                  <InfoItem icon={<LocationOnIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@columns.address")} value={station.address} />
                  <InfoItem icon={<LocationOnIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@columns.city")} value={station.cityName} />
                  <InfoItem icon={<PublicIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@detail.country")} value={station.countryName} />
                  {hasCoords && (
                    <InfoItem
                      icon={<MapIcon sx={{ fontSize: 16 }} />}
                      label={t("chargeManagement@detail.coordinates")}
                      value={
                        <Link href={`https://www.google.com/maps?q=${station.latitude},${station.longitude}`} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600 }}>
                          {station.latitude!.toFixed(5)}, {station.longitude!.toFixed(5)} · {t("chargeManagement@detail.viewOnMap")}
                        </Link>
                      }
                    />
                  )}
                </Grid>
              </Section>

              {/* Charging specs */}
              <Section icon={<BoltIcon fontSize="small" />} title={t("chargeManagement@detail.charging")}>
                <Grid container spacing={1.5}>
                  <InfoItem icon={<EvStationOutlinedIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@form.chargerPointType")} value={station.chargingPointType?.name} />
                  <InfoItem icon={<EvStationOutlinedIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@form.stationType")} value={station.stationType?.name} />
                  <InfoItem icon={<BoltIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@detail.brand")} value={station.chargerBrand} />
                  <InfoItem icon={<SpeedIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@columns.speed")} value={station.chargerSpeed != null ? `${station.chargerSpeed} kW` : ""} />
                  <InfoItem icon={<PowerIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@columns.chargers")} value={station.chargersCount} />
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

              {/* Pricing & Payment */}
              {(station.price != null || payments.length > 0) && (
                <Section icon={<PaymentsIcon fontSize="small" />} title={t("chargeManagement@detail.pricing")}>
                  <Grid container spacing={1.5}>
                    <InfoItem icon={<PaymentsIcon sx={{ fontSize: 16 }} />} label={t("chargeManagement@form.price")} value={station.price != null ? station.price : ""} />
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

              {/* Offer */}
              {station.hasOffer && (
                <Section icon={<LocalOfferIcon fontSize="small" />} title={t("chargeManagement@detail.offer")}>
                  <Typography variant="body2">{station.offerDescription || "—"}</Typography>
                </Section>
              )}

              {/* Services */}
              {services.length > 0 && (
                <Section icon={<RoomServiceIcon fontSize="small" />} title={t("chargeManagement@detail.services")}>
                  <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap>
                    {services.map((label, i) => <Chip key={i} label={label} size="small" variant="outlined" />)}
                  </Stack>
                </Section>
              )}

              {/* Note */}
              {station.note && (
                <Section icon={<NotesIcon fontSize="small" />} title={t("chargeManagement@form.note")}>
                  <Typography variant="body2" color="text.secondary">{station.note}</Typography>
                </Section>
              )}

              {/* Social links */}
              <SocialLinksDisplay providerType="ChargingPoint" providerId={station.id} enabled={open} />

              {/* Reviews */}
              <StationReviewsSection chargingPointId={station.id} enabled={open} />

              {/* Images */}
              {imageUrls.length > 0 && (
                <Section icon={<CollectionsIcon fontSize="small" />} title={t("chargeManagement@detail.images")}>
                  <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
                    {imageUrls.map((url, i) => (
                      <Box
                        key={i} component="img" src={url} alt=""
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        sx={{ width: 88, height: 88, borderRadius: 2, objectFit: "cover", bgcolor: "action.hover", border: 1, borderColor: "divider" }}
                      />
                    ))}
                  </Stack>
                </Section>
              )}
            </Stack>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
