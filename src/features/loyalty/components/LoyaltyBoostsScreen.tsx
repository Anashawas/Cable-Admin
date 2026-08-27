import { useMemo, useState } from "react";
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
  Chip,
  IconButton,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import BoltIcon from "@mui/icons-material/Bolt";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import WelcomeBonusCard from "./WelcomeBonusCard";
import {
  getBoosts,
  createBoost,
  updateBoost,
  deactivateBoost,
} from "../services/boosts-service";
import { getAllChargingPoints } from "../../charge-management/services/charge-management-service";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";
import type { BoostDto, BoostPayload, BoostProviderRef } from "../types/boosts";

type TFn = ReturnType<typeof useTranslation>["t"];

const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6]; // bit 0 = Sunday … bit 6 = Saturday

interface BoostFormState {
  name: string | null;
  nameAr: string | null;
  multiplier: number;
  startsAt: string | null;
  endsAt: string | null;
  dailyStartMinute: number | null;
  dailyEndMinute: number | null;
  daysOfWeekMask: number;
  appliesToAllProviders: boolean;
  providers: BoostProviderRef[];
  priority: number;
  maxBonusPointsPerUser: number | null;
  maxTotalBonusPoints: number | null;
}

const emptyBoost = (): BoostFormState => ({
  name: null,
  nameAr: null,
  multiplier: 2,
  startsAt: null,
  endsAt: null,
  dailyStartMinute: null,
  dailyEndMinute: null,
  daysOfWeekMask: 0, // 0 = every day (BE convention)
  appliesToAllProviders: true,
  providers: [],
  priority: 0,
  maxBonusPointsPerUser: null,
  maxTotalBonusPoints: null,
});

const buildPayload = (f: BoostFormState): BoostPayload => ({
  name: f.name?.trim() ? f.name.trim() : null,
  nameAr: f.nameAr?.trim() ? f.nameAr.trim() : null,
  multiplier: f.multiplier,
  startsAt: f.startsAt,
  endsAt: f.endsAt,
  dailyStartMinute: f.dailyStartMinute,
  dailyEndMinute: f.dailyEndMinute,
  daysOfWeekMask: f.daysOfWeekMask,
  appliesToAllProviders: f.appliesToAllProviders,
  providers: f.appliesToAllProviders
    ? []
    : f.providers.map((p) => ({ providerType: p.providerType, providerId: p.providerId })),
  priority: Number.isFinite(f.priority) ? f.priority : 0,
  maxBonusPointsPerUser: f.maxBonusPointsPerUser,
  maxTotalBonusPoints: f.maxTotalBonusPoints,
});

const pad2 = (n: number) => String(n).padStart(2, "0");

// UTC ISO ⇄ <input type="datetime-local"> — the admin's local tz; the absolute
// instant is preserved either way (only the daily minutes are Jordan-local).
const isoToLocalInput = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}`;
};
const localInputToIso = (local: string): string | null => {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

// minutes-of-day (Jordan local) ⇄ <input type="time"> "HH:mm"
const minutesToTime = (m?: number | null): string => {
  if (m == null) return "";
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
};
const timeToMinutes = (v: string): number | null => {
  if (!v) return null;
  const [h, m] = v.split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

// daysOfWeekMask (bit 0 = Sunday) ⇄ selected day indices
const maskToDays = (mask: number): number[] =>
  DAY_INDICES.filter((d) => (mask & (1 << d)) !== 0);
const daysToMask = (days: number[]): number => days.reduce((acc, d) => acc | (1 << d), 0);

const multiplierLabel = (m: number): string => (m % 1 === 0 ? `×${m}` : `×${m.toFixed(1)}`);

const numOrNull = (v: string): number | null => {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

type BoostStatus = "inactive" | "scheduled" | "running" | "ended";
const boostStatus = (b: BoostDto): BoostStatus => {
  if (!b.isActive) return "inactive";
  const now = Date.now();
  const start = b.startsAt ? new Date(b.startsAt).getTime() : null;
  const end = b.endsAt ? new Date(b.endsAt).getTime() : null;
  if (end != null && now > end) return "ended";
  if (start != null && now < start) return "scheduled";
  return "running";
};

const scheduleSummary = (b: BoostDto, t: TFn): string => {
  const parts: string[] = [];
  const fmt = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString();
  };
  const s = fmt(b.startsAt);
  const e = fmt(b.endsAt);
  if (s || e) parts.push(`${s ?? "…"} → ${e ?? "…"}`);
  else parts.push(t("loyalty@boosts.always"));

  if (b.dailyStartMinute != null || b.dailyEndMinute != null) {
    parts.push(
      `${minutesToTime(b.dailyStartMinute) || "00:00"}–${
        minutesToTime(b.dailyEndMinute) || "24:00"
      }`
    );
  }

  const days = maskToDays(b.daysOfWeekMask);
  if (b.daysOfWeekMask !== 0 && days.length < 7) {
    parts.push(days.map((d) => t(`loyalty@boosts.day_${d}`)).join(" "));
  }

  parts.push(
    b.appliesToAllProviders
      ? t("loyalty@boosts.allProviders")
      : t("loyalty@boosts.nProviders", { count: b.providers?.length ?? 0 })
  );
  return parts.join(" · ");
};

export default function LoyaltyBoostsScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const ok = useSnackbarStore((s) => s.openSuccessSnackbar);
  const err = useSnackbarStore((s) => s.openErrorSnackbar);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<BoostFormState>(emptyBoost());
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["loyalty-boosts"],
    queryFn: ({ signal }) => getBoosts(undefined, signal),
  });

  // Provider options for the "specific stations" picker — only fetched while the
  // dialog is open and the boost is scoped (avoids two heavy lists otherwise).
  const providersEnabled = open && !form.appliesToAllProviders;
  const { data: chargingPoints = [], isLoading: cpLoading } = useQuery({
    queryKey: ["boost-provider-options", "charging-points"],
    queryFn: ({ signal }) => getAllChargingPoints(undefined, signal),
    enabled: providersEnabled,
    staleTime: 5 * 60 * 1000,
  });
  const { data: serviceProviders = [], isLoading: spLoading } = useQuery({
    queryKey: ["boost-provider-options", "service-providers"],
    queryFn: () => getAllServiceProviders(),
    enabled: providersEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const providerOptions: BoostProviderRef[] = useMemo(
    () => [
      ...chargingPoints.map((c) => ({
        providerType: "ChargingPoint" as const,
        providerId: c.id,
        providerName: c.name ?? `#${c.id}`,
      })),
      ...serviceProviders.map((s) => ({
        providerType: "ServiceProvider" as const,
        providerId: s.id,
        providerName: s.name ?? `#${s.id}`,
      })),
    ],
    [chargingPoints, serviceProviders]
  );

  const save = useMutation({
    mutationFn: (p: BoostPayload) => (editId == null ? createBoost(p) : updateBoost(editId, p)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loyalty-boosts"] });
      ok({ message: t("loyalty@boosts.saved") });
      setOpen(false);
    },
    onError: (e: Error) => err({ message: errMessage(e, t("loadingFailed")) }),
  });

  const deact = useMutation({
    mutationFn: (id: number) => deactivateBoost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loyalty-boosts"] });
      ok({ message: t("loyalty@boosts.deactivated") });
      setConfirmId(null);
    },
    onError: (e: Error) => err({ message: errMessage(e, t("loadingFailed")) }),
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyBoost());
    setOpen(true);
  };
  const openEdit = (b: BoostDto) => {
    setEditId(b.id);
    setForm({
      name: b.name ?? null,
      nameAr: b.nameAr ?? null,
      multiplier: b.multiplier,
      startsAt: b.startsAt ?? null,
      endsAt: b.endsAt ?? null,
      dailyStartMinute: b.dailyStartMinute ?? null,
      dailyEndMinute: b.dailyEndMinute ?? null,
      daysOfWeekMask: b.daysOfWeekMask ?? 0,
      appliesToAllProviders: b.appliesToAllProviders ?? true,
      providers: b.providers ?? [],
      priority: b.priority ?? 0,
      maxBonusPointsPerUser: b.maxBonusPointsPerUser ?? null,
      maxTotalBonusPoints: b.maxTotalBonusPoints ?? null,
    });
    setOpen(true);
  };

  const statusChip = (b: BoostDto) => {
    const s = boostStatus(b);
    const color =
      s === "running" ? "success" : s === "scheduled" ? "info" : s === "ended" ? "default" : "warning";
    return <Chip size="small" color={color} label={t(`loyalty@boosts.status_${s}`)} />;
  };

  const selectedDays = maskToDays(form.daysOfWeekMask);
  const canSave =
    Number.isFinite(form.multiplier) &&
    form.multiplier > 1 &&
    form.multiplier <= 10 &&
    (form.appliesToAllProviders || form.providers.length > 0);

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <ScreenHeader
            title={t("loyalty@boosts.title")}
            subtitle={t("loyalty@boosts.subtitle")}
            icon={<BoltIcon />}
            showMoreButton={false}
          />

          <WelcomeBonusCard />

          <Divider textAlign="left">
            <Typography variant="overline" color="text.secondary">
              {t("loyalty@boosts.campaignsSection")}
            </Typography>
          </Divider>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1}
          >
            <Typography variant="body2" color="text.secondary">
              {t("loyalty@boosts.campaignsHint")}
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              {t("loyalty@boosts.add")}
            </Button>
          </Stack>

          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4 }}>
              {t("loyalty@boosts.empty")}
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {items.map((b) => {
                const running = boostStatus(b) === "running";
                return (
                  <Card key={b.id} variant="outlined">
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box sx={{ minWidth: 0 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mb: 0.5 }}
                            flexWrap="wrap"
                          >
                            <Typography variant="subtitle1" fontWeight={600} noWrap>
                              {b.name || `#${b.id}`}
                            </Typography>
                            <Chip
                              size="small"
                              color="warning"
                              variant="outlined"
                              label={multiplierLabel(b.multiplier)}
                            />
                            {statusChip(b)}
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {scheduleSummary(b, t)}
                          </Typography>
                        </Box>
                        {b.isActive && (
                          <Stack direction="row">
                            <IconButton
                              onClick={() => openEdit(b)}
                              disabled={running}
                              aria-label="edit"
                              title={running ? t("loyalty@boosts.editLocked") : undefined}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => setConfirmId(b.id)}
                              color="error"
                              aria-label="deactivate"
                            >
                              <BlockIcon />
                            </IconButton>
                          </Stack>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Create / Edit dialog */}
      <Dialog open={open} onClose={() => !save.isPending && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editId == null ? t("loyalty@boosts.add") : t("loyalty@boosts.edit")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction="row" spacing={1}>
              <TextField
                label={t("loyalty@boosts.name")}
                fullWidth
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value || null }))}
              />
              <TextField
                label={t("loyalty@boosts.nameAr")}
                fullWidth
                dir="rtl"
                value={form.nameAr ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value || null }))}
              />
            </Stack>
            <TextField
              type="number"
              label={`${t("loyalty@boosts.multiplier")} *`}
              fullWidth
              value={form.multiplier}
              inputProps={{ min: 1.1, max: 10, step: 0.5 }}
              helperText={t("loyalty@boosts.multiplierHint")}
              onChange={(e) => setForm((f) => ({ ...f, multiplier: Number(e.target.value) }))}
            />
            <Stack direction="row" spacing={1}>
              <TextField
                label={t("loyalty@boosts.startsAt")}
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={isoToLocalInput(form.startsAt)}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: localInputToIso(e.target.value) }))}
              />
              <TextField
                label={t("loyalty@boosts.endsAt")}
                type="datetime-local"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={isoToLocalInput(form.endsAt)}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: localInputToIso(e.target.value) }))}
              />
            </Stack>

            <Alert severity="info" sx={{ py: 0 }}>
              {t("loyalty@boosts.dailyNote")}
            </Alert>
            <Stack direction="row" spacing={1}>
              <TextField
                label={t("loyalty@boosts.dailyStart")}
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={minutesToTime(form.dailyStartMinute)}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dailyStartMinute: timeToMinutes(e.target.value) }))
                }
              />
              <TextField
                label={t("loyalty@boosts.dailyEnd")}
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={minutesToTime(form.dailyEndMinute)}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dailyEndMinute: timeToMinutes(e.target.value) }))
                }
              />
            </Stack>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.5 }}
              >
                {t("loyalty@boosts.days")}
              </Typography>
              <ToggleButtonGroup
                value={selectedDays}
                onChange={(_, days: number[]) =>
                  setForm((f) => ({ ...f, daysOfWeekMask: daysToMask(days) }))
                }
                size="small"
                sx={{ flexWrap: "wrap" }}
              >
                {DAY_INDICES.map((d) => (
                  <ToggleButton key={d} value={d}>
                    {t(`loyalty@boosts.day_${d}`)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                {t("loyalty@boosts.daysHint")}
              </Typography>
            </Box>

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={form.appliesToAllProviders}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, appliesToAllProviders: e.target.checked }))
                  }
                />
              }
              label={t("loyalty@boosts.allProvidersLabel")}
            />
            {!form.appliesToAllProviders && (
              <Autocomplete
                multiple
                options={providerOptions}
                loading={cpLoading || spLoading}
                value={form.providers}
                onChange={(_, val) => setForm((f) => ({ ...f, providers: val }))}
                isOptionEqualToValue={(a, b) =>
                  a.providerType === b.providerType && a.providerId === b.providerId
                }
                getOptionLabel={(o) => `${o.providerName ?? `#${o.providerId}`}`}
                groupBy={(o) =>
                  o.providerType === "ChargingPoint"
                    ? t("loyalty@boosts.stations")
                    : t("loyalty@boosts.serviceProviders")
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`${t("loyalty@boosts.providers")} *`}
                    placeholder={t("loyalty@boosts.providersPlaceholder")}
                    helperText={t("loyalty@boosts.providersHint")}
                  />
                )}
              />
            )}

            <Stack direction="row" spacing={1}>
              <TextField
                type="number"
                label={t("loyalty@boosts.priority")}
                fullWidth
                value={form.priority}
                inputProps={{ min: 0, step: 1 }}
                helperText={t("loyalty@boosts.priorityHint")}
                onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))}
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField
                type="number"
                label={t("loyalty@boosts.maxPerUser")}
                fullWidth
                value={form.maxBonusPointsPerUser ?? ""}
                inputProps={{ min: 0, step: 1 }}
                placeholder={t("loyalty@boosts.noCap")}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxBonusPointsPerUser: numOrNull(e.target.value) }))
                }
              />
              <TextField
                type="number"
                label={t("loyalty@boosts.maxTotal")}
                fullWidth
                value={form.maxTotalBonusPoints ?? ""}
                inputProps={{ min: 0, step: 1 }}
                placeholder={t("loyalty@boosts.noCap")}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxTotalBonusPoints: numOrNull(e.target.value) }))
                }
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit" disabled={save.isPending}>
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            disabled={save.isPending || !canSave}
            onClick={() => save.mutate(buildPayload(form))}
          >
            {save.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("loyalty@boosts.save")
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate confirm */}
      <Dialog
        open={confirmId != null}
        onClose={() => !deact.isPending && setConfirmId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("loyalty@boosts.deactivateTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{t("loyalty@boosts.deactivateConfirm")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)} color="inherit" disabled={deact.isPending}>
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deact.isPending}
            onClick={() => confirmId != null && deact.mutate(confirmId)}
          >
            {deact.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("loyalty@boosts.deactivate")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}

/** Pull the most descriptive message out of an axios error — the BE returns the real
 *  reason (often localized) in the response body; the generic axios `message` hides it. */
function errMessage(e: any, fallback: string): string {
  const d = e?.response?.data;
  if (typeof d === "string" && d.trim()) return d;
  if (d && typeof d === "object") {
    const fromErrors =
      d.errors && typeof d.errors === "object"
        ? Object.values(d.errors as Record<string, unknown>).flat().filter(Boolean).join(" · ")
        : "";
    return d.message || d.Message || d.detail || d.title || fromErrors || e?.message || fallback;
  }
  return e?.message || fallback;
}
