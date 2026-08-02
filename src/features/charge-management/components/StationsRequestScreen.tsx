import { useState, useCallback, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Stack, Typography, Chip, IconButton, Tooltip, Button, Avatar, Paper, Link, Grid,
  Dialog, DialogContent, DialogTitle, DialogContentText, DialogActions, TextField, CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import EvStationIcon from "@mui/icons-material/EvStation";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import VisibilityIcon from "@mui/icons-material/Visibility";
import GavelIcon from "@mui/icons-material/Gavel";
import ListAltIcon from "@mui/icons-material/ListAlt";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import { format } from "date-fns";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { getPendingRequests, approveRequest, rejectRequest } from "../services/request-service";
import type { UpdateRequestDto } from "../types/api";
import { useSnackbarStore } from "../../../stores";

const STATUS_CFG: Record<string, { color: "warning" | "success" | "error"; hex: string; bg: string }> = {
  pending:  { color: "warning", hex: "#e65100", bg: "#fff3e0" },
  approved: { color: "success", hex: "#2e7d32", bg: "#e8f5e9" },
  rejected: { color: "error",   hex: "#c62828", bg: "#ffebee" },
};
const cfgFor = (s?: string | null) => STATUS_CFG[(s ?? "").toLowerCase()] ?? { color: "warning" as const, hex: "#607d8b", bg: "#eceff1" };

const FILTERS: { value: string; key: string }[] = [
  { value: "", key: "all" },
  { value: "Pending", key: "pending" },
  { value: "Approved", key: "approved" },
  { value: "Rejected", key: "rejected" },
];

// Higher-severity flags render red, the rest amber.
const RISK_RED = new Set(["location_moved", "owner_contact_changed"]);

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

export default function StationsRequestScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const isRtl = i18n.language === "ar";

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailReq, setDetailReq] = useState<UpdateRequestDto | null>(null);

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["stations-request", "pending", statusFilter || null],
    queryFn: ({ signal }) => getPendingRequests(statusFilter.trim() || null, signal),
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: number) => approveRequest(requestId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["stations-request"] }); openSuccessSnackbar({ message: t("stationsRequest@approved") }); },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: number; reason: string }) => rejectRequest(requestId, reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["stations-request"] }); openSuccessSnackbar({ message: t("stationsRequest@rejected") }); setRejectTarget(null); setRejectReason(""); },
    onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const handleConfirmReject = useCallback(() => {
    if (rejectTarget != null) rejectMutation.mutate({ requestId: rejectTarget, reason: rejectReason.trim() });
  }, [rejectTarget, rejectReason, rejectMutation]);

  const fmt = (v?: string | null) => (v ? format(new Date(v), "dd MMM yyyy · HH:mm") : "—");
  const fmtShort = (v?: string | null) => (v ? format(new Date(v), "dd MMM yyyy") : "—");

  // Render any diff value (string / number / bool / array / lookup object) as text.
  const fmtVal = (v: unknown): string => {
    if (v == null || v === "") return "—";
    if (Array.isArray(v)) {
      if (!v.length) return "—";
      return v.map((x) => (x && typeof x === "object" && "name" in (x as object) ? String((x as { name?: unknown }).name) : String(x))).join(", ");
    }
    if (typeof v === "boolean") return v ? "✓" : "✗";
    if (typeof v === "object") return "name" in (v as object) ? String((v as { name?: unknown }).name) : JSON.stringify(v);
    return String(v);
  };

  const fieldLabel = (f: string) => t(`stationsRequest@fields.${f}`, f);

  // Image-valued change fields render as before/after thumbnails, not URL text.
  const IMAGE_FIELDS = new Set(["icon", "iconurl", "images", "image", "viewimage", "photo", "photos"]);
  const isImageField = (f: string) => IMAGE_FIELDS.has(f.toLowerCase());

  const toUrls = (v: unknown): string[] => {
    if (v == null || v === "") return [];
    const arr = Array.isArray(v) ? v : [v];
    return arr
      .map((x) => (x && typeof x === "object" && "url" in (x as object) ? String((x as { url?: unknown }).url) : String(x)))
      .filter((s) => s && s !== "null" && s !== "undefined");
  };

  const ImgThumb = ({ url, tone, size }: { url: string; tone: "old" | "new"; size: number }) => (
    <Link href={url} target="_blank" rel="noopener" sx={{ display: "inline-block", lineHeight: 0 }}>
      <Box component="img" src={url} alt=""
        sx={{
          width: size, height: size, objectFit: "cover", borderRadius: 1.5,
          border: "2px solid", borderColor: tone === "new" ? "success.main" : "divider",
          opacity: tone === "old" ? 0.6 : 1,
          filter: tone === "old" ? "grayscale(0.35)" : "none",
        }} />
    </Link>
  );

  // One change rendered as old → new. Image fields show thumbnails; everything
  // else keeps the strikethrough-text diff.
  const DiffPair = ({ c, size }: { c: { field: string; oldValue?: unknown; newValue?: unknown }; size: number }) => {
    if (isImageField(c.field)) {
      const oldUrls = toUrls(c.oldValue);
      const newUrls = toUrls(c.newValue);
      return (
        <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
          {oldUrls.length ? (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>{oldUrls.map((u, i) => <ImgThumb key={i} url={u} tone="old" size={size} />)}</Stack>
          ) : (
            <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic" }}>{t("stationsRequest@diff.noImage", "no image")}</Typography>
          )}
          <ArrowRightAltIcon sx={{ fontSize: 18, color: "text.disabled", transform: isRtl ? "scaleX(-1)" : "none" }} />
          {newUrls.length ? (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>{newUrls.map((u, i) => <ImgThumb key={i} url={u} tone="new" size={size} />)}</Stack>
          ) : (
            <Typography variant="body2" sx={{ color: "error.main", fontStyle: "italic" }}>{t("stationsRequest@diff.removed", "removed")}</Typography>
          )}
        </Stack>
      );
    }
    return (
      <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap" useFlexGap>
        <Typography variant="body2" sx={{ color: "text.disabled", textDecoration: "line-through" }}>{fmtVal(c.oldValue)}</Typography>
        <ArrowRightAltIcon sx={{ fontSize: 16, color: "text.disabled", transform: isRtl ? "scaleX(-1)" : "none" }} />
        <Typography variant="body2" fontWeight={800} sx={{ color: "success.dark" }}>{fmtVal(c.newValue)}</Typography>
      </Stack>
    );
  };

  // "location_moved (123 m)" → { label, detail: "(123 m)", red }
  const riskParts = (flag: string) => {
    const m = /^([a-z_]+)\s*(\(.*\))?$/i.exec(flag);
    const base = m?.[1] ?? flag;
    const detail = m?.[2] ?? "";
    return { label: t(`stationsRequest@risk.${base}`, base.replace(/_/g, " ")), detail, red: RISK_RED.has(base) };
  };

  const RiskChips = ({ flags }: { flags?: string[] | null }) =>
    !flags?.length ? null : (
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
        {flags.map((flag, i) => {
          const { label, detail, red } = riskParts(flag);
          const hex = red ? "#c62828" : "#e65100";
          return (
            <Chip key={i} size="small" icon={<WarningAmberIcon sx={{ fontSize: 15 }} />}
              label={`${label}${detail ? ` ${detail}` : ""}`}
              sx={{ bgcolor: `${hex}14`, color: hex, fontWeight: 700, "& .MuiChip-icon": { color: hex } }} />
          );
        })}
      </Stack>
    );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    data.forEach((r) => { const k = (r.requestStatus ?? "").toLowerCase(); c[k] = (c[k] ?? 0) + 1; });
    return c;
  }, [data]);

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2.5} sx={{ maxWidth: 1000, mx: "auto" }}>

          {/* Hero */}
          <Box sx={{ background: "linear-gradient(135deg, #bf360c 0%, #e65100 55%, #f57c00 100%)", borderRadius: 3, p: { xs: 2.5, md: 3 }, color: "#fff", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: -40, insetInlineEnd: -40, width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.07)" }} />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ position: "relative" }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 52, height: 52, borderRadius: 2.5 }}><ListAltIcon /></Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={800}>{t("stationsRequest@title")}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>{t("stationsRequest@subtitle")}</Typography>
              </Box>
              <Tooltip title={t("refresh")}>
                <IconButton onClick={() => refetch()} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}><RefreshIcon /></IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Status filter */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {FILTERS.map((f) => (
              <Chip key={f.key}
                label={f.value ? `${t(`stationsRequest@status.${f.key}`)}${counts[f.key] ? ` (${counts[f.key]})` : ""}` : `${t("all")}${data.length ? ` (${data.length})` : ""}`}
                onClick={() => setStatusFilter(f.value)}
                color={statusFilter === f.value ? "primary" : "default"}
                variant={statusFilter === f.value ? "filled" : "outlined"}
                sx={{ fontWeight: 700, cursor: "pointer" }} />
            ))}
          </Stack>

          {/* List */}
          {isLoading ? (
            <Stack spacing={2}>{[0, 1, 2].map((i) => <Box key={i} sx={{ height: 120, borderRadius: 3, bgcolor: "action.hover" }} />)}</Stack>
          ) : data.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <ListAltIcon sx={{ fontSize: 48, color: "grey.300", mb: 1 }} />
              <Typography variant="h6" color="text.disabled">{t("stationsRequest@empty")}</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {data.map((r) => {
                const cfg = cfgFor(r.requestStatus);
                const isPending = (r.requestStatus ?? "").toLowerCase() === "pending";
                const isRejected = (r.requestStatus ?? "").toLowerCase() === "rejected";
                const changeCount = r.changes?.length ?? 0;
                return (
                  <Paper key={r.id} elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider", boxShadow: `0 2px 12px ${cfg.hex}12`, transition: "box-shadow .2s, transform .15s", "&:hover": { boxShadow: "0 8px 26px rgba(0,0,0,0.10)", transform: "translateY(-2px)" } }}>
                    <Box sx={{ height: 5, background: `linear-gradient(90deg, ${cfg.hex}, ${cfg.hex}99)` }} />
                    <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                      {/* Row 1: station + status */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1.5 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                          <Avatar sx={{ bgcolor: "primary.50", color: "primary.main", width: 44, height: 44, borderRadius: 2.5 }}><EvStationIcon /></Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Link component="button" type="button" onClick={() => r.chargingPointId && navigate(`/charge-management/${r.chargingPointId}`)} variant="subtitle1" fontWeight={800} sx={{ textAlign: "start", display: "block" }} noWrap>
                              {r.chargingPointName || `#${r.chargingPointId ?? "—"}`}
                            </Link>
                            <Typography variant="caption" color="text.disabled">{t("stationsRequest@columns.requestId")} #{r.id}</Typography>
                          </Box>
                        </Stack>
                        <Chip label={t(`stationsRequest@status.${(r.requestStatus ?? "").toLowerCase()}`, r.requestStatus ?? "—")} sx={{ bgcolor: cfg.bg, color: cfg.hex, fontWeight: 800 }} />
                      </Stack>

                      {/* Requester + dates */}
                      <Grid container spacing={1}>
                        <InfoItem icon={<PersonIcon sx={{ fontSize: 16 }} />} label={t("stationsRequest@requestedBy")}
                          value={r.requestedByUserId
                            ? <Link component="button" type="button" onClick={() => navigate(`/users/${r.requestedByUserId}`)} fontWeight={700} sx={{ textAlign: "start" }}>{r.requestedByUserName || `#${r.requestedByUserId}`}</Link>
                            : (r.requestedByUserName || "—")} />
                        <InfoItem icon={<PhoneIcon sx={{ fontSize: 16 }} />} label={t("stationsRequest@phone")}
                          value={r.requestedByUserPhone ? <Link href={`tel:${r.requestedByUserPhone}`} fontWeight={600}>{r.requestedByUserPhone}</Link> : "—"} />
                        <InfoItem icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />} label={t("stationsRequest@columns.requestedAt")} value={fmt(r.createdAt)} />
                        {r.reviewedByUserName && (
                          <InfoItem icon={<GavelIcon sx={{ fontSize: 16 }} />} label={t("stationsRequest@reviewedBy")} value={`${r.reviewedByUserName} · ${fmtShort(r.reviewedAt)}`} />
                        )}
                      </Grid>

                      {/* Risk flags */}
                      <RiskChips flags={r.riskFlags} />

                      {/* Inline old → new diff */}
                      {!!r.changes?.length && (
                        <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
                          <Stack spacing={0.75}>
                            {r.changes.map((c, i) => (
                              <Stack key={i} direction="row" spacing={1} alignItems={isImageField(c.field) ? "center" : "baseline"} flexWrap="wrap" useFlexGap>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ minWidth: 96 }}>{fieldLabel(c.field)}</Typography>
                                <DiffPair c={c} size={56} />
                              </Stack>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {isRejected && r.rejectionReason && (
                        <Paper elevation={0} sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: "error.50", borderInlineStart: "4px solid", borderColor: "error.main" }}>
                          <Typography variant="caption" color="error.dark" fontWeight={800} display="block">{t("stationsRequest@rejectReason")}</Typography>
                          <Typography variant="body2">{r.rejectionReason}</Typography>
                        </Paper>
                      )}

                      {/* Actions */}
                      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{ mt: 2, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }} flexWrap="wrap" useFlexGap>
                        <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setDetailReq(r)} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                          {t("stationsRequest@viewData")}{changeCount ? ` (${changeCount})` : ""}
                        </Button>
                        <Tooltip title={t("stationsRequest@actions.media")}>
                          <IconButton size="small" onClick={() => r.chargingPointId && navigate(`/charge-management/${r.chargingPointId}/media`)}><PhotoLibraryIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title={t("stationsRequest@actions.edit")}>
                          <IconButton size="small" onClick={() => r.chargingPointId && navigate(`/charge-management/edit/${r.chargingPointId}`)}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        {isPending && (
                          <>
                            <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => { setRejectTarget(r.id); setRejectReason(""); }} disabled={rejectMutation.isPending} sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}>
                              {t("stationsRequest@actions.reject")}
                            </Button>
                            <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => approveMutation.mutate(r.id)} disabled={approveMutation.isPending} sx={{ borderRadius: 2, fontWeight: 800, textTransform: "none" }}>
                              {t("stationsRequest@actions.approve")}
                            </Button>
                          </>
                        )}
                      </Stack>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* ── Detail dialog: the requested changes (old → new) ── */}
      <Dialog open={detailReq != null} onClose={() => setDetailReq(null)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, overflow: "hidden" } } }}>
        <Box sx={{ background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)", p: 2.5, color: "#fff" }}>
          <Typography variant="h6" fontWeight={800}>{detailReq?.chargingPointName || t("stationsRequest@viewData")}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>{t("stationsRequest@columns.requestId")} #{detailReq?.id} · {t(`stationsRequest@status.${(detailReq?.requestStatus ?? "").toLowerCase()}`, detailReq?.requestStatus ?? "")}</Typography>
        </Box>
        <DialogContent sx={{ p: 2.5 }}>
          {/* Risk flags */}
          <RiskChips flags={detailReq?.riskFlags} />

          {/* Requested changes diff */}
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1, mt: detailReq?.riskFlags?.length ? 2 : 0 }}>{t("stationsRequest@requestedChanges")}</Typography>
          {detailReq?.changes?.length ? (
            <Stack spacing={1.25}>
              {detailReq.changes.map((c, i) => (
                <Box key={i} sx={{ p: 1.25, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 0.5 }}>{fieldLabel(c.field)}</Typography>
                  <DiffPair c={c} size={76} />
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>{t("stationsRequest@diff.none")}</Typography>
          )}

          {/* Attachments */}
          {!!detailReq?.attachments?.length && (
            <Box sx={{ mt: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>{t("stationsRequest@attachments")}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {detailReq.attachments.map((url, i) => (
                  <Link key={i} href={url} target="_blank" rel="noopener">
                    <Box component="img" src={url} alt="" sx={{ width: 72, height: 72, objectFit: "cover", borderRadius: 1.5, border: "1px solid", borderColor: "divider" }} />
                  </Link>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {detailReq?.chargingPointId && (
            <Button onClick={() => { navigate(`/charge-management/${detailReq.chargingPointId}`); setDetailReq(null); }} startIcon={<VisibilityIcon />} sx={{ textTransform: "none" }}>
              {t("chargeManagement@detail.title")}
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" onClick={() => setDetailReq(null)}>{t("close")}</Button>
        </DialogActions>
      </Dialog>

      {/* ── Reject with reason ── */}
      <Dialog open={rejectTarget != null} onClose={() => { if (!rejectMutation.isPending) setRejectTarget(null); }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t("stationsRequest@actions.reject")}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>{t("stationsRequest@rejectReasonHint")}</DialogContentText>
          <TextField autoFocus fullWidth multiline rows={3} label={t("stationsRequest@rejectReason")} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t("stationsRequest@rejectReasonPlaceholder")} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectTarget(null)} disabled={rejectMutation.isPending}>{t("cancel")}</Button>
          <Button variant="contained" color="error" onClick={handleConfirmReject} disabled={rejectMutation.isPending} startIcon={rejectMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}>
            {t("stationsRequest@actions.reject")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
