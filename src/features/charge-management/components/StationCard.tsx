import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Divider,
  Button,
  Skeleton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import VerifiedIcon from "@mui/icons-material/Verified";
import BoltIcon from "@mui/icons-material/Bolt";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EvStationIcon from "@mui/icons-material/EvStation";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import HandshakeIcon from "@mui/icons-material/Handshake";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PlugChips from "./PlugChips";
import { cityLabel } from "../../dashboard/utils/city-names";
import type { ChargingPointDto } from "../types/api";

const Num = ({ v }: { v: number }) => <bdi>{v.toLocaleString("en-US")}</bdi>;

/** Wraps the first case-insensitive occurrence of `query` in <mark>. */
function Highlight({ text, query }: { text: string; query?: string }) {
  const q = query?.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <Box component="mark" sx={{ bgcolor: (th) => alpha(th.palette.warning.main, 0.3), color: "inherit", borderRadius: 0.5, px: 0.25 }}>
        {text.slice(i, i + q.length)}
      </Box>
      {text.slice(i + q.length)}
    </>
  );
}

export const isStationActive = (row: ChargingPointDto) =>
  row.statusSummary?.id === 1 || row.statusSummary?.name?.toLowerCase() === "active";

/** "Visa, CliQ" / "visa|cliq" → ["Visa", "CliQ"]. */
export function paymentMethods(raw?: string | null): string[] {
  return (raw ?? "")
    .split(/[,،/|;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (/^cliq$/i.test(s) ? "CliQ" : /^visa$/i.test(s) ? "Visa" : s));
}

interface StationCardProps {
  row: ChargingPointDto;
  onOpen: (row: ChargingPointDto) => void;
  onEdit: (e: React.MouseEvent, id: number) => void;
  onMedia: (e: React.MouseEvent, id: number) => void;
  onActivity: (e: React.MouseEvent, row: ChargingPointDto) => void;
  onMenu: (e: React.MouseEvent<HTMLElement>, row: ChargingPointDto) => void;
  /** Search term to highlight in the station name. */
  highlight?: string;
}

function StationCard({ row, onOpen, onEdit, onMedia, onActivity, onMenu, highlight }: StationCardProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = !!row.iConUrl && !imgFailed;
  const name = row.name || t("chargeManagement@unnamed");
  const active = isStationActive(row);
  const rate = row.avgChargingPointRate != null ? Number(row.avgChargingPointRate) : null;
  const rateCount = row.rateCount ?? 0;
  const stars = rate != null ? Math.round(rate) : 0;
  const city = row.cityName ? cityLabel(row.cityName, i18n.language) : null;
  const payments = paymentMethods(row.methodPayment);

  const statusChip = (
    <Chip
      size="small"
      label={row.statusSummary?.name ?? "—"}
      color={active ? "success" : "default"}
      variant={active ? "filled" : "outlined"}
      sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700 }}
    />
  );
  const powerChip =
    row.chargerSpeed != null ? (
      <Tooltip title={t("chargeManagement@list.maxPower")}>
        <Chip
          size="small"
          variant="outlined"
          icon={<BoltIcon sx={{ fontSize: "15px !important", color: `${theme.palette.warning.main} !important` }} />}
          label={<bdi>{`${row.chargerSpeed} kW`}</bdi>}
          sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700 }}
        />
      </Tooltip>
    ) : null;

  const iconBtnSx = { color: "text.secondary", "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) } };

  return (
    <Card
      elevation={0}
      tabIndex={0}
      aria-label={t("chargeManagement@list.openStation", { name })}
      onClick={() => onOpen(row)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen(row);
        }
      }}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        cursor: "pointer",
        transition: "box-shadow .2s, border-color .2s",
        "&:hover": { borderColor: alpha(theme.palette.primary.main, 0.5), boxShadow: theme.shadows[4] },
        "&:focus-visible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
      }}
    >
      {hasImage && (
        <Box sx={{ position: "relative", height: 120, bgcolor: "action.hover", flexShrink: 0 }}>
          <Box
            component="img"
            src={row.iConUrl ?? undefined}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </Box>
      )}

      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, p: 2, pb: 1.5, minWidth: 0 }}>
        {/* Title row: icon tile (no photo only) + name + verified */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          {!hasImage && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
              }}
            >
              <EvStationIcon />
            </Box>
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap title={name} sx={{ lineHeight: 1.3 }}>
                <Highlight text={name} query={highlight} />
              </Typography>
              {row.isVerified && (
                <Tooltip title={t("chargeManagement@list.verifiedStation")}>
                  <VerifiedIcon
                    aria-label={t("chargeManagement@list.verifiedStation")}
                    sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }}
                  />
                </Tooltip>
              )}
            </Stack>
            {city && (
              <Typography variant="caption" color="text.secondary" noWrap component="div">
                {city}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Status / power / partner / owner flags */}
        <Stack direction="row" gap={0.75} useFlexGap flexWrap="wrap" alignItems="center">
          {statusChip}
          {powerChip}
          {row.isPartner ? (
            <Tooltip title={t("chargeManagement@list.partnerHint")}>
              <Chip
                size="small"
                color="success"
                variant="outlined"
                icon={<HandshakeIcon sx={{ fontSize: "15px !important" }} />}
                label={t("chargeManagement@partner")}
                sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700 }}
              />
            </Tooltip>
          ) : null}
          {row.hasOwner === false && (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              icon={<PersonOffIcon sx={{ fontSize: "15px !important" }} />}
              label={t("chargeManagement@owner.unassigned")}
              sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700 }}
            />
          )}
        </Stack>

        {/* Address / phone / owner — muted single lines */}
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          {row.address && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
              <LocationOnOutlinedIcon sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" noWrap title={row.address}>
                {row.address}
              </Typography>
            </Stack>
          )}
          {row.phone && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
              <PhoneOutlinedIcon sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" noWrap dir="ltr">
                {row.phone}
              </Typography>
            </Stack>
          )}
          {row.ownerName && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
              <PersonOutlineIcon sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" noWrap title={row.ownerName}>
                {row.ownerName}
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Compact stats: rating · chargers · views */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ color: "text.secondary" }}>
          <Tooltip
            title={
              rate != null || rateCount > 0
                ? t("chargeManagement@list.ratingTooltip", { rate: (rate ?? 0).toFixed(1), count: rateCount })
                : t("chargeManagement@list.noRating")
            }
          >
            <Stack direction="row" alignItems="center" spacing={0.25}>
              {[1, 2, 3, 4, 5].map((i) =>
                i <= stars ? (
                  <StarIcon key={i} sx={{ fontSize: 14, color: "warning.main" }} />
                ) : (
                  <StarBorderIcon key={i} sx={{ fontSize: 14, color: "action.disabled" }} />
                )
              )}
              <Typography variant="caption" fontWeight={600} sx={{ marginInlineStart: "4px" }}>
                <Num v={rateCount} />
              </Typography>
            </Stack>
          </Tooltip>
          {row.chargersCount != null && (
            <Tooltip title={t("chargeManagement@list.chargersTooltip")}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <EvStationIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" fontWeight={600}>
                  <Num v={row.chargersCount} />
                </Typography>
              </Stack>
            </Tooltip>
          )}
          <Tooltip title={t("chargeManagement@list.viewsTooltip")}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" fontWeight={600}>
                <Num v={row.visitorsCount ?? 0} />
              </Typography>
            </Stack>
          </Tooltip>
        </Stack>

        {/* Plugs + payment pinned to the bottom of the content so footers line up */}
        <Box sx={{ mt: "auto", display: "flex", flexDirection: "column", gap: 0.75, minWidth: 0 }}>
          <PlugChips plugs={row.plugTypeSummary} max={3} />
          {payments.length > 0 && (
            <Tooltip title={t("chargeManagement@list.payment")}>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0, alignSelf: "flex-start" }}>
                <PaymentsOutlinedIcon sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary" noWrap>
                  {payments.join(" · ")}
                </Typography>
              </Stack>
            </Tooltip>
          )}
        </Box>
      </CardContent>

      <Divider />
      <CardActions sx={{ px: 1, py: 0.75, justifyContent: "space-between", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
        <Button
          size="small"
          startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
          onClick={() => onOpen(row)}
          sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
        >
          {t("chargeManagement@detail.title")}
        </Button>
        <Stack direction="row" spacing={0.25} alignItems="center">
          <Tooltip title={t("chargeManagement@actions.edit")}>
            <IconButton size="small" aria-label={t("chargeManagement@actions.edit")} onClick={(e) => onEdit(e, row.id)} sx={iconBtnSx}>
              <EditIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("chargeManagement@actions.media")}>
            <IconButton size="small" aria-label={t("chargeManagement@actions.media")} onClick={(e) => onMedia(e, row.id)} sx={iconBtnSx}>
              <PhotoLibraryIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("loyalty@activity")}>
            <IconButton size="small" aria-label={t("loyalty@activity")} onClick={(e) => onActivity(e, row)} sx={iconBtnSx}>
              <ReceiptLongIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("more")}>
            <IconButton size="small" aria-label={t("more")} aria-haspopup="menu" onClick={(e) => onMenu(e, row)} sx={iconBtnSx}>
              <MoreVertIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardActions>
    </Card>
  );
}

export default memo(StationCard);

/** Placeholder card with the same footprint as StationCard (compact, no-photo layout). */
export function StationCardSkeleton() {
  return (
    <Card elevation={0} sx={{ height: "100%", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
      <CardContent sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={22} />
            <Skeleton variant="text" width="35%" height={16} />
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.75}>
          <Skeleton variant="rounded" width={56} height={22} sx={{ borderRadius: 4 }} />
          <Skeleton variant="rounded" width={64} height={22} sx={{ borderRadius: 4 }} />
        </Stack>
        <Skeleton variant="text" width="85%" height={16} />
        <Skeleton variant="text" width="50%" height={16} />
        <Stack direction="row" spacing={0.5}>
          <Skeleton variant="rounded" width={84} height={24} sx={{ borderRadius: 4 }} />
          <Skeleton variant="rounded" width={84} height={24} sx={{ borderRadius: 4 }} />
        </Stack>
      </CardContent>
      <Divider />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.5, py: 1 }}>
        <Skeleton variant="text" width={96} height={24} />
        <Stack direction="row" spacing={0.5}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="circular" width={28} height={28} />
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
