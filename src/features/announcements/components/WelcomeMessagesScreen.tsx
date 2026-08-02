import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
  Chip,
  FormControlLabel,
  Switch,
  CircularProgress,
  IconButton,
  Tooltip,
  Avatar,
  Collapse,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PublicIcon from "@mui/icons-material/Public";
import PlaceIcon from "@mui/icons-material/Place";
import GroupIcon from "@mui/icons-material/Group";
import BarChartIcon from "@mui/icons-material/BarChart";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LinkIcon from "@mui/icons-material/Link";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import LocationPicker from "../../charge-management/components/LocationPicker";
import { useSnackbarStore } from "../../../stores";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  uploadAnnouncementImage,
  getAnnouncementStats,
} from "../services/announcement-service";
import type { AnnouncementDto, AnnouncementPayload } from "../types/api";

/** One metric in a card's analytics strip. */
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Box sx={{ textAlign: "center", minWidth: 52 }}>
      <Typography variant="subtitle2" fontWeight={700} lineHeight={1.1}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  );
}

/**
 * Inline engagement analytics for one announcement. Fetches per-id stats
 * (GET .../{id}/stats) and degrades to a subtle note if unavailable.
 */
function StatsStrip({ id }: { id: number }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["announcement-stats", id],
    queryFn: ({ signal }) => getAnnouncementStats(id, signal),
    staleTime: 60_000,
  });

  if (isLoading) return <CircularProgress size={16} sx={{ my: 0.5 }} />;
  if (!data) {
    return (
      <Stack direction="row" spacing={0.75} alignItems="center" color="text.disabled">
        <BarChartIcon fontSize="small" />
        <Typography variant="caption">{t("welcome@statsPending")}</Typography>
      </Stack>
    );
  }
  const ctrPct = data.impressions > 0
    ? `${((data.clicks / data.impressions) * 100).toFixed(1)}%`
    : "0%";
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ px: 1.5, py: 1, bgcolor: "action.hover", borderRadius: 2, width: "fit-content", flexWrap: "wrap" }}
      useFlexGap
    >
      <Metric label={t("welcome@statViews")} value={data.impressions} />
      <Metric label={t("welcome@statClicks")} value={data.clicks} />
      <Metric label={t("welcome@statCtr")} value={ctrPct} />
      <Metric label={t("welcome@statConversions")} value={data.conversions} />
      <Metric label={t("welcome@statDismisses")} value={data.dismisses} />
      {data.uniqueUsers != null && (
        <Metric label={t("welcome@statUsers")} value={data.uniqueUsers} />
      )}
    </Stack>
  );
}

const JORDAN_CITIES = [
  "Amman", "Zarqa", "Irbid", "Salt", "Mafraq", "Madaba",
  "Jerash", "Ajloun", "Karak", "Tafilah", "Maan", "Aqaba",
];

const emptyForm: AnnouncementPayload = {
  titleEn: "",
  titleAr: "",
  bodyEn: "",
  bodyAr: "",
  imageUrl: null,
  actionType: null,
  actionUrl: null,
  actionLabelEn: "",
  actionLabelAr: "",
  targetType: "national",
  targetCity: null,
  centerLat: null,
  centerLng: null,
  radiusKm: 15,
  audience: "all",
  startDate: null,
  endDate: null,
  maxPerDay: 1,
  cooldownHours: 24,
  maxLifetime: 3,
  stopOnDismiss: true,
  isActive: true,
};

function dtoToForm(d: AnnouncementDto): AnnouncementPayload {
  return {
    titleEn: d.titleEn ?? "",
    titleAr: d.titleAr ?? "",
    bodyEn: d.bodyEn ?? "",
    bodyAr: d.bodyAr ?? "",
    imageUrl: d.imageUrl ?? null,
    actionType: d.actionType ?? null,
    actionUrl: d.actionUrl ?? null,
    actionLabelEn: d.actionLabelEn ?? "",
    actionLabelAr: d.actionLabelAr ?? "",
    targetType: d.targetType ?? "national",
    targetCity: d.targetCity ?? null,
    centerLat: d.centerLat ?? null,
    centerLng: d.centerLng ?? null,
    radiusKm: d.radiusKm ?? 15,
    audience: d.audience ?? "all",
    startDate: d.startDate ?? null,
    endDate: d.endDate ?? null,
    maxPerDay: d.maxPerDay ?? 1,
    cooldownHours: d.cooldownHours ?? 24,
    maxLifetime: d.maxLifetime ?? 3,
    stopOnDismiss: d.stopOnDismiss ?? true,
    campaignId: d.campaignId ?? null,
    isActive: d.isActive,
  };
}

function buildPayload(form: AnnouncementPayload): AnnouncementPayload {
  const p: AnnouncementPayload = { ...form };
  if (form.targetType === "national") {
    p.targetCity = null; p.centerLat = null; p.centerLng = null; p.radiusKm = null;
  } else if (form.targetType === "city") {
    p.centerLat = null; p.centerLng = null; p.radiusKm = null;
  } else if (form.targetType === "radius") {
    p.targetCity = null;
  }
  // Drop empty action labels so the app uses its default CTA.
  if (!p.actionLabelEn?.trim()) p.actionLabelEn = null;
  if (!p.actionLabelAr?.trim()) p.actionLabelAr = null;
  return p;
}

export default function WelcomeMessagesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AnnouncementPayload>(emptyForm);

  // Image upload state (picked file + preview + optional "paste URL" fallback).
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const { data: items = [], isLoading, error, refetch } = useQuery({
    queryKey: ["announcements"],
    queryFn: ({ signal }) => getAnnouncements(signal),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: AnnouncementPayload) => {
      let id = editId;
      if (id == null) {
        id = await createAnnouncement(payload);
      } else {
        await updateAnnouncement(id, payload);
      }
      // Chain the image upload when a file was picked and we know the id.
      if (pendingImage && id != null) {
        await uploadAnnouncementImage(id, pendingImage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      openSuccessSnackbar({ message: t("welcome@saved") });
      setOpen(false);
    },
    onError: (err: Error) =>
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  // No hard-delete endpoint on the backend yet → "remove" = deactivate
  // (isActive=false) so it stops showing to users. Toggle re-activates.
  const toggleActiveMutation = useMutation({
    mutationFn: (d: AnnouncementDto) =>
      updateAnnouncement(d.id, buildPayload({ ...dtoToForm(d), isActive: !d.isActive })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      openSuccessSnackbar({ message: t("welcome@saved") });
    },
    onError: (err: Error) =>
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const resetImageState = useCallback((existingUrl?: string | null) => {
    setPendingImage(null);
    setImagePreview(existingUrl ?? null);
    setShowUrlField(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleAdd = useCallback(() => {
    setEditId(null);
    setForm(emptyForm);
    resetImageState(null);
    setOpen(true);
  }, [resetImageState]);

  const handleEdit = useCallback((d: AnnouncementDto) => {
    setEditId(d.id);
    setForm(dtoToForm(d));
    resetImageState(d.imageUrl);
    setOpen(true);
  }, [resetImageState]);

  const handlePickImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      openErrorSnackbar({ message: t("welcome@imageTypeError") });
      return;
    }
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPendingImage(file);
    setForm((f) => ({ ...f, imageUrl: null })); // a picked file overrides a URL
  }, [openErrorSnackbar, t]);

  const handleClearImage = useCallback(() => {
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setPendingImage(null);
    setForm((f) => ({ ...f, imageUrl: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleSave = useCallback(() => {
    if (!form.titleEn.trim() || !form.titleAr.trim()) {
      openErrorSnackbar({ message: t("welcome@titleRequired") });
      return;
    }
    if (form.targetType === "city" && !form.targetCity) {
      openErrorSnackbar({ message: t("welcome@cityRequired") });
      return;
    }
    if (
      form.targetType === "radius" &&
      (form.centerLat == null || form.centerLng == null || !form.radiusKm)
    ) {
      openErrorSnackbar({ message: t("welcome@radiusRequired") });
      return;
    }
    saveMutation.mutate(buildPayload(form));
  }, [form, saveMutation, openErrorSnackbar, t]);

  const set = <K extends keyof AnnouncementPayload>(key: K, value: AnnouncementPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const targetLabel = (d: AnnouncementDto) =>
    d.targetType === "city"
      ? `${t("welcome@targetCityOpt")}: ${d.targetCity ?? ""}`
      : t(`welcome@target_${d.targetType ?? "national"}`);

  const targetIcon = (d: AnnouncementDto) =>
    d.targetType === "national" ? <PublicIcon fontSize="small" /> : <PlaceIcon fontSize="small" />;

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <ScreenHeader title={t("welcome@title")} />

          <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>
            {t("welcome@subtitle")}
          </Typography>

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button startIcon={<RefreshIcon />} onClick={() => refetch()} size="small">
              {t("refresh")}
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
              {t("welcome@add")}
            </Button>
          </Stack>

          {error ? (
            <Typography color="error">{t("loadingFailed")}</Typography>
          ) : isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <ImageOutlinedIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                <Typography color="text.secondary">{t("welcome@empty")}</Typography>
              </CardContent>
            </Card>
          ) : (
            <Stack spacing={1.5}>
              {items.map((d) => {
                const title = d.titleEn || d.titleAr || `#${d.id}`;
                const body = d.bodyEn || d.bodyAr || "";
                return (
                  <Card
                    key={d.id}
                    variant="outlined"
                    sx={{
                      borderColor: d.isActive ? "success.light" : "divider",
                      opacity: d.isActive ? 1 : 0.72,
                      transition: "box-shadow .2s",
                      "&:hover": { boxShadow: 2 },
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        {/* Thumbnail */}
                        {d.imageUrl ? (
                          <Avatar
                            variant="rounded"
                            src={d.imageUrl}
                            sx={{ width: 72, height: 72, flexShrink: 0 }}
                          />
                        ) : (
                          <Avatar
                            variant="rounded"
                            sx={{ width: 72, height: 72, flexShrink: 0, bgcolor: "action.hover", color: "text.disabled" }}
                          >
                            <ImageOutlinedIcon />
                          </Avatar>
                        )}

                        {/* Main column */}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography variant="subtitle1" fontWeight={700} noWrap>
                              {title}
                            </Typography>
                            <Chip
                              size="small"
                              label={d.isActive ? t("welcome@active") : t("welcome@inactive")}
                              color={d.isActive ? "success" : "default"}
                            />
                          </Stack>

                          {body && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }} noWrap>
                              {body}
                            </Typography>
                          )}

                          <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                            <Chip size="small" variant="outlined" icon={targetIcon(d)} label={targetLabel(d)} />
                            {d.audience && d.audience !== "all" && (
                              <Chip
                                size="small"
                                variant="outlined"
                                icon={<GroupIcon fontSize="small" />}
                                label={t(`welcome@audience${d.audience === "guests" ? "Guests" : "LoggedIn"}`)}
                              />
                            )}
                            {(d.startDate || d.endDate) && (
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`${(d.startDate ?? "").slice(0, 10)} → ${(d.endDate ?? "∞").slice(0, 10)}`}
                              />
                            )}
                          </Stack>

                          <Box sx={{ mt: 1.25 }}>
                            <StatsStrip id={d.id} />
                          </Box>
                        </Box>

                        {/* Actions */}
                        <Stack>
                          <Tooltip title={d.isActive ? t("welcome@deactivate") : t("welcome@activate")}>
                            <span>
                              <IconButton
                                onClick={() => toggleActiveMutation.mutate(d)}
                                disabled={toggleActiveMutation.isPending}
                                aria-label="toggle-active"
                                color={d.isActive ? "default" : "success"}
                              >
                                {d.isActive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={t("welcome@edit")}>
                            <IconButton onClick={() => handleEdit(d)} aria-label="edit">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Create / edit dialog */}
      <Dialog open={open} onClose={() => !saveMutation.isPending && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId == null ? t("welcome@add") : t("welcome@edit")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Divider textAlign="left">{t("welcome@contentSection")}</Divider>
            <TextField label={`${t("welcome@titleEn")} *`} fullWidth value={form.titleEn}
              onChange={(e) => set("titleEn", e.target.value)} />
            <TextField label={`${t("welcome@titleAr")} *`} fullWidth dir="rtl" value={form.titleAr}
              onChange={(e) => set("titleAr", e.target.value)} />
            <TextField label={t("welcome@bodyEn")} fullWidth multiline minRows={2} value={form.bodyEn ?? ""}
              onChange={(e) => set("bodyEn", e.target.value)} />
            <TextField label={t("welcome@bodyAr")} fullWidth multiline minRows={2} dir="rtl" value={form.bodyAr ?? ""}
              onChange={(e) => set("bodyAr", e.target.value)} />
            {/* ── Image: upload (preferred) or paste URL ── */}
            <Box>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePickImage} />
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: `1px dashed ${theme.palette.divider}`,
                  borderRadius: 2,
                  p: imagePreview ? 1 : 3,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "border-color .2s",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                {imagePreview ? (
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="preview"
                    sx={{ maxHeight: 150, maxWidth: "100%", borderRadius: 1, display: "block", mx: "auto" }}
                  />
                ) : (
                  <Stack alignItems="center" spacing={0.5} color="text.secondary">
                    <CloudUploadIcon />
                    <Typography variant="body2">{t("welcome@uploadImage")}</Typography>
                    <Typography variant="caption" color="text.disabled">{t("welcome@uploadHint")}</Typography>
                  </Stack>
                )}
              </Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                {imagePreview ? (
                  <Button size="small" color="error" onClick={handleClearImage}>
                    {t("welcome@removeImage")}
                  </Button>
                ) : <span />}
                <Button size="small" startIcon={<LinkIcon />} onClick={() => setShowUrlField((v) => !v)}>
                  {t("welcome@pasteUrl")}
                </Button>
              </Stack>
              <Collapse in={showUrlField}>
                <TextField
                  label={t("welcome@imageUrl")}
                  fullWidth
                  size="small"
                  placeholder="https://..."
                  sx={{ mt: 1 }}
                  value={form.imageUrl ?? ""}
                  onChange={(e) => {
                    const url = e.target.value || null;
                    setPendingImage(null);
                    setForm((f) => ({ ...f, imageUrl: url }));
                    setImagePreview(url);
                  }}
                />
              </Collapse>
              {editId == null && pendingImage && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  {t("welcome@uploadAfterCreate")}
                </Typography>
              )}
            </Box>

            <Divider textAlign="left">{t("welcome@actionSection")}</Divider>
            <TextField select label={t("welcome@actionType")} fullWidth value={form.actionType ?? 0}
              onChange={(e) => set("actionType", Number(e.target.value) || null)}>
              <MenuItem value={0}>{t("welcome@actionNone")}</MenuItem>
              <MenuItem value={1}>{t("welcome@action1")}</MenuItem>
              <MenuItem value={2}>{t("welcome@action2")}</MenuItem>
              <MenuItem value={3}>{t("welcome@action3")}</MenuItem>
              <MenuItem value={4}>{t("welcome@action4")}</MenuItem>
              <MenuItem value={5}>{t("welcome@action5")}</MenuItem>
            </TextField>
            {!!form.actionType && (
              <>
                <TextField label={t("welcome@actionUrl")} fullWidth value={form.actionUrl ?? ""}
                  onChange={(e) => set("actionUrl", e.target.value || null)} />
                <TextField label={t("welcome@actionLabelEn")} fullWidth value={form.actionLabelEn ?? ""}
                  onChange={(e) => set("actionLabelEn", e.target.value)} />
                <TextField label={t("welcome@actionLabelAr")} fullWidth dir="rtl" value={form.actionLabelAr ?? ""}
                  onChange={(e) => set("actionLabelAr", e.target.value)} />
              </>
            )}

            <Divider textAlign="left">{t("welcome@targetingSection")}</Divider>
            <TextField select label={t("welcome@audience")} fullWidth value={form.audience ?? "all"}
              onChange={(e) => set("audience", e.target.value as AnnouncementPayload["audience"])}>
              <MenuItem value="all">{t("welcome@audienceAll")}</MenuItem>
              <MenuItem value="guests">{t("welcome@audienceGuests")}</MenuItem>
              <MenuItem value="loggedIn">{t("welcome@audienceLoggedIn")}</MenuItem>
            </TextField>
            <TextField select label={t("welcome@targetType")} fullWidth value={form.targetType ?? "national"}
              onChange={(e) => set("targetType", e.target.value as AnnouncementPayload["targetType"])}>
              <MenuItem value="national">{t("welcome@target_national")}</MenuItem>
              <MenuItem value="city">{t("welcome@targetCityOpt")}</MenuItem>
              <MenuItem value="radius">{t("welcome@target_radius")}</MenuItem>
            </TextField>
            {form.targetType === "city" && (
              <TextField select label={t("welcome@city")} fullWidth value={form.targetCity ?? ""}
                onChange={(e) => set("targetCity", e.target.value || null)}>
                {JORDAN_CITIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            )}
            {form.targetType === "radius" && (
              <>
                <Typography variant="caption" color="text.secondary">{t("welcome@pickCenterHint")}</Typography>
                <Box sx={{ height: 280, borderRadius: 1, overflow: "hidden" }}>
                  <LocationPicker
                    latitude={form.centerLat ?? 0}
                    longitude={form.centerLng ?? 0}
                    radiusMeters={(form.radiusKm ?? 0) * 1000}
                    onLocationSelect={(lat, lng) => setForm((f) => ({ ...f, centerLat: lat, centerLng: lng }))}
                  />
                </Box>
                <TextField label={t("welcome@radiusKm")} type="number" fullWidth value={form.radiusKm ?? ""}
                  onChange={(e) => set("radiusKm", e.target.value === "" ? null : Number(e.target.value))} />
              </>
            )}

            <Divider textAlign="left">{t("welcome@scheduleSection")}</Divider>
            <Stack direction="row" spacing={1}>
              <TextField label={t("welcome@startDate")} type="date" fullWidth InputLabelProps={{ shrink: true }}
                value={form.startDate ?? ""} onChange={(e) => set("startDate", e.target.value || null)} />
              <TextField label={t("welcome@endDate")} type="date" fullWidth InputLabelProps={{ shrink: true }}
                value={form.endDate ?? ""} onChange={(e) => set("endDate", e.target.value || null)} />
            </Stack>

            <Divider textAlign="left">{t("welcome@capsSection")}</Divider>
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
              {t("welcome@capsHint")}
            </Typography>
            <Stack direction="row" spacing={1}>
              <TextField label={t("welcome@maxPerDay")} type="number" fullWidth value={form.maxPerDay ?? ""}
                onChange={(e) => set("maxPerDay", e.target.value === "" ? null : Number(e.target.value))} />
              <TextField label={t("welcome@cooldownHours")} type="number" fullWidth value={form.cooldownHours ?? ""}
                onChange={(e) => set("cooldownHours", e.target.value === "" ? null : Number(e.target.value))} />
              <TextField label={t("welcome@maxLifetime")} type="number" fullWidth value={form.maxLifetime ?? ""}
                onChange={(e) => set("maxLifetime", e.target.value === "" ? null : Number(e.target.value))} />
            </Stack>
            <FormControlLabel
              control={<Switch checked={!!form.stopOnDismiss}
                onChange={(e) => set("stopOnDismiss", e.target.checked)} />}
              label={t("welcome@stopOnDismiss")}
            />
            <FormControlLabel
              control={<Switch checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)} />}
              label={t("welcome@isActive")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit" disabled={saveMutation.isPending}>
            {t("cancel")}
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : t("welcome@save")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
