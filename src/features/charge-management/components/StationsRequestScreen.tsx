import { useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box, Stack, Typography, Chip, IconButton, Tooltip, Button, Avatar, Paper, Link, Grid,
  Dialog, DialogContent, DialogTitle, DialogContentText, DialogActions, TextField, CircularProgress,
  useTheme, useMediaQuery, alpha, Divider,
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { format } from "date-fns";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { getPendingRequests, approveRequest, rejectRequest } from "../services/request-service";
import { useSnackbarStore } from "../../../stores";

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
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const isRtl = i18n.language === "ar";
  const smallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // On phones the pane flips between list and detail.
  const [mobileDetail, setMobileDetail] = useState(false);

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["stations-request", "pending", statusFilter || null],
    queryFn: ({ signal }) => getPendingRequests(statusFilter.trim() || null, signal),
  });

  // Status → theme color mapping (single source for pill, bar and shadows).
  const cfgFor = useCallback((s?: string | null) => {
    const key = (s ?? "").toLowerCase();
    if (key === "approved") return { main: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.12) };
    if (key === "rejected") return { main: theme.palette.error.dark, bg: alpha(theme.palette.error.main, 0.12) };
    if (key === "pending") return { main: theme.palette.warning.dark, bg: alpha(theme.palette.warning.main, 0.12) };
    return { main: theme.palette.text.disabled, bg: theme.palette.action.hover };
  }, [theme]);

  const selected = useMemo(() => data.find((r) => r.id === selectedId) ?? null, [data, selectedId]);

  // Keep a sensible selection: first pending item, else first item.
  useEffect(() => {
    if (data.length === 0) { setSelectedId(null); return; }
    if (selectedId != null && data.some((r) => r.id === selectedId)) return;
    const firstPending = data.find((r) => (r.requestStatus ?? "").toLowerCase() === "pending");
    setSelectedId((firstPending ?? data[0]).id);
  }, [data, selectedId]);

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
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {flags.map((flag, i) => {
          const { label, detail, red } = riskParts(flag);
          const clr = red ? theme.palette.error.dark : theme.palette.warning.dark;
          return (
            <Chip key={i} size="small" icon={<WarningAmberIcon sx={{ fontSize: 15 }} />}
              label={`${label}${detail ? ` ${detail}` : ""}`}
              sx={{ bgcolor: alpha(clr, 0.08), color: clr, fontWeight: 700, "& .MuiChip-icon": { color: clr } }} />
          );
        })}
      </Stack>
    );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    data.forEach((r) => { const k = (r.requestStatus ?? "").toLowerCase(); c[k] = (c[k] ?? 0) + 1; });
    return c;
  }, [data]);

  const paneMaxHeight = { md: "calc(100vh - 240px)" };

  const showList = !smallScreen || !mobileDetail;
  const showDetail = !smallScreen || mobileDetail;

  const openRequest = (id: number) => {
    setSelectedId(id);
    if (smallScreen) setMobileDetail(true);
  };

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>

          {/* Hero */}
          <Box sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, borderRadius: 3, p: { xs: 2, md: 2.5 }, color: "common.white", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: -40, insetInlineEnd: -40, width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.07)" }} />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ position: "relative" }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 48, height: 48, borderRadius: 2.5 }}><ListAltIcon /></Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={800}>{t("stationsRequest@title")}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>{t("stationsRequest@subtitle")}</Typography>
              </Box>
              <Tooltip title={t("refresh")}>
                <IconButton onClick={() => refetch()} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}><RefreshIcon /></IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Master–detail */}
          <Grid container spacing={2}>

            {/* ── Request list ── */}
            {showList && (
              <Grid size={{ xs: 12, md: 4.5, lg: 4 }}>
                <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: paneMaxHeight }}>
                  {/* Filters */}
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ p: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                    {FILTERS.map((f) => (
                      <Chip key={f.key} size="small"
                        label={f.value ? `${t(`stationsRequest@status.${f.key}`)}${counts[f.key] ? ` (${counts[f.key]})` : ""}` : `${t("all")}${data.length ? ` (${data.length})` : ""}`}
                        onClick={() => setStatusFilter(f.value)}
                        color={statusFilter === f.value ? "primary" : "default"}
                        variant={statusFilter === f.value ? "filled" : "outlined"}
                        sx={{ fontWeight: 700, cursor: "pointer" }} />
                    ))}
                  </Stack>

                  {/* Items */}
                  <Box sx={{ overflow: "auto", flex: 1 }}>
                    {isLoading ? (
                      <Stack spacing={1} sx={{ p: 1.5 }}>{[0, 1, 2, 3].map((i) => <Box key={i} sx={{ height: 72, borderRadius: 2, bgcolor: "action.hover" }} />)}</Stack>
                    ) : data.length === 0 ? (
                      <Box sx={{ py: 6, textAlign: "center" }}>
                        <ListAltIcon sx={{ fontSize: 40, color: "grey.300", mb: 1 }} />
                        <Typography variant="body2" color="text.disabled">{t("stationsRequest@empty")}</Typography>
                      </Box>
                    ) : (
                      data.map((r) => {
                        const cfg = cfgFor(r.requestStatus);
                        const isSelected = r.id === selectedId && !smallScreen;
                        const changeCount = r.changes?.length ?? 0;
                        const hasRisk = !!r.riskFlags?.length;
                        return (
                          <Box key={r.id} onClick={() => openRequest(r.id)}
                            sx={{
                              px: 1.75, py: 1.25, cursor: "pointer", display: "flex", alignItems: "center", gap: 1.25,
                              borderBottom: "1px solid", borderColor: "divider",
                              borderInlineStart: "3px solid", borderInlineStartColor: isSelected ? "primary.main" : "transparent",
                              bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.06) : "transparent",
                              "&:hover": { bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : "action.hover" },
                            }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: cfg.main, flexShrink: 0 }} />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>{r.chargingPointName || `#${r.chargingPointId ?? "—"}`}</Typography>
                              <Typography variant="caption" color="text.secondary" noWrap display="block">
                                {(r.requestedByUserName || "—")} · {fmtShort(r.createdAt)}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
                              {hasRisk && <WarningAmberIcon sx={{ fontSize: 16, color: "warning.dark" }} />}
                              {changeCount > 0 && (
                                <Chip size="small" label={changeCount} sx={{ height: 20, fontWeight: 800, fontSize: "0.7rem", bgcolor: cfg.bg, color: cfg.main }} />
                              )}
                            </Stack>
                          </Box>
                        );
                      })
                    )}
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* ── Detail pane ── */}
            {showDetail && (
              <Grid size={{ xs: 12, md: 7.5, lg: 8 }}>
                <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: paneMaxHeight, minHeight: { md: 420 } }}>
                  {!selected ? (
                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10 }}>
                      <VisibilityIcon sx={{ fontSize: 44, color: "grey.300", mb: 1 }} />
                      <Typography variant="body1" color="text.disabled">{t("stationsRequest@selectPrompt")}</Typography>
                    </Box>
                  ) : (() => {
                    const cfg = cfgFor(selected.requestStatus);
                    const isPending = (selected.requestStatus ?? "").toLowerCase() === "pending";
                    const isRejected = (selected.requestStatus ?? "").toLowerCase() === "rejected";
                    return (
                      <>
                        {/* Header */}
                        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                            {smallScreen && (
                              <IconButton size="small" onClick={() => setMobileDetail(false)}>
                                <ArrowBackIcon sx={{ transform: isRtl ? "scaleX(-1)" : "none" }} />
                              </IconButton>
                            )}
                            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", width: 44, height: 44, borderRadius: 2.5 }}><EvStationIcon /></Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Link component="button" type="button" onClick={() => selected.chargingPointId && navigate(`/charge-management/${selected.chargingPointId}`)} variant="subtitle1" fontWeight={800} sx={{ textAlign: "start", display: "block" }} noWrap>
                                {selected.chargingPointName || `#${selected.chargingPointId ?? "—"}`}
                              </Link>
                              <Typography variant="caption" color="text.disabled">{t("stationsRequest@columns.requestId")} #{selected.id}</Typography>
                            </Box>
                            <Chip label={t(`stationsRequest@status.${(selected.requestStatus ?? "").toLowerCase()}`, selected.requestStatus ?? "—")} sx={{ bgcolor: cfg.bg, color: cfg.main, fontWeight: 800 }} />
                            <Tooltip title={t("stationsRequest@actions.media")}>
                              <IconButton size="small" onClick={() => selected.chargingPointId && navigate(`/charge-management/${selected.chargingPointId}/media`)}><PhotoLibraryIcon fontSize="small" /></IconButton>
                            </Tooltip>
                            <Tooltip title={t("stationsRequest@actions.edit")}>
                              <IconButton size="small" onClick={() => selected.chargingPointId && navigate(`/charge-management/edit/${selected.chargingPointId}`)}><EditIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>

                        {/* Scrollable body */}
                        <Box sx={{ p: 2.5, overflow: "auto", flex: 1 }}>
                          <Grid container spacing={1}>
                            <InfoItem icon={<PersonIcon sx={{ fontSize: 16 }} />} label={t("stationsRequest@requestedBy")}
                              value={selected.requestedByUserId
                                ? <Link component="button" type="button" onClick={() => navigate(`/users/${selected.requestedByUserId}`)} fontWeight={700} sx={{ textAlign: "start" }}>{selected.requestedByUserName || `#${selected.requestedByUserId}`}</Link>
                                : (selected.requestedByUserName || "—")} />
                            <InfoItem icon={<PhoneIcon sx={{ fontSize: 16 }} />} label={t("stationsRequest@phone")}
                              value={selected.requestedByUserPhone ? <Link href={`tel:${selected.requestedByUserPhone}`} fontWeight={600}>{selected.requestedByUserPhone}</Link> : "—"} />
                            <InfoItem icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />} label={t("stationsRequest@columns.requestedAt")} value={fmt(selected.createdAt)} />
                            {selected.reviewedByUserName && (
                              <InfoItem icon={<GavelIcon sx={{ fontSize: 16 }} />} label={t("stationsRequest@reviewedBy")} value={`${selected.reviewedByUserName} · ${fmtShort(selected.reviewedAt)}`} />
                            )}
                          </Grid>

                          {!!selected.riskFlags?.length && <Box sx={{ mt: 1.5 }}><RiskChips flags={selected.riskFlags} /></Box>}

                          {isRejected && selected.rejectionReason && (
                            <Paper elevation={0} sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.error.main, 0.06), borderInlineStart: "4px solid", borderColor: "error.main" }}>
                              <Typography variant="caption" color="error.dark" fontWeight={800} display="block">{t("stationsRequest@rejectReason")}</Typography>
                              <Typography variant="body2">{selected.rejectionReason}</Typography>
                            </Paper>
                          )}

                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>{t("stationsRequest@requestedChanges")}</Typography>
                          {selected.changes?.length ? (
                            <Stack spacing={1}>
                              {selected.changes.map((c, i) => (
                                <Box key={i} sx={{ p: 1.5, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
                                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 0.5 }}>{fieldLabel(c.field)}</Typography>
                                  <DiffPair c={c} size={72} />
                                </Box>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>{t("stationsRequest@diff.none")}</Typography>
                          )}

                          {!!selected.attachments?.length && (
                            <Box sx={{ mt: 2.5 }}>
                              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>{t("stationsRequest@attachments")}</Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {selected.attachments.map((url, i) => (
                                  <Link key={i} href={url} target="_blank" rel="noopener">
                                    <Box component="img" src={url} alt="" sx={{ width: 72, height: 72, objectFit: "cover", borderRadius: 1.5, border: "1px solid", borderColor: "divider" }} />
                                  </Link>
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </Box>

                        {/* Action bar — always visible for pending requests */}
                        {isPending && (
                          <Box sx={{ p: 1.5, px: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => { setRejectTarget(selected.id); setRejectReason(""); }} disabled={rejectMutation.isPending} sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}>
                                {t("stationsRequest@actions.reject")}
                              </Button>
                              <Button variant="contained" color="success" startIcon={approveMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />} onClick={() => approveMutation.mutate(selected.id)} disabled={approveMutation.isPending} sx={{ borderRadius: 2, fontWeight: 800, textTransform: "none" }}>
                                {t("stationsRequest@actions.approve")}
                              </Button>
                            </Stack>
                          </Box>
                        )}
                      </>
                    );
                  })()}
                </Paper>
              </Grid>
            )}
          </Grid>
        </Stack>
      </Box>

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
