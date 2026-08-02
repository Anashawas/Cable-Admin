import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Tabs,
  Tab,
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
  Chip,
  IconButton,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import InsightsIcon from "@mui/icons-material/Insights";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import CampaignStatsDialog from "./CampaignStatsDialog";
import {
  getAdvertisers, createAdvertiser, updateAdvertiser,
  getCampaigns, createCampaign, updateCampaign,
} from "../services/ads-service";
import type {
  AdvertiserDto, AdvertiserPayload,
  CampaignDto, CampaignPayload, CampaignType, CampaignStatus,
} from "../types/api";

const emptyAdvertiser: AdvertiserPayload = { name: "", contact: null, notes: null };
const emptyCampaign: CampaignPayload = {
  advertiserId: 0, name: null, type: "banner", city: null,
  startDate: null, endDate: null, price: null, status: "active",
};

export default function CampaignsScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const ok = useSnackbarStore((s) => s.openSuccessSnackbar);
  const err = useSnackbarStore((s) => s.openErrorSnackbar);
  const [tab, setTab] = useState(0);

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <ScreenHeader title={t("campaigns@title")} />
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label={t("campaigns@tabCampaigns")} />
            <Tab label={t("campaigns@tabAdvertisers")} />
          </Tabs>
          {tab === 0 ? <CampaignsPanel t={t} qc={qc} ok={ok} err={err} /> : <AdvertisersPanel t={t} qc={qc} ok={ok} err={err} />}
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}

type TFn = ReturnType<typeof useTranslation>["t"];
type Snack = (a: { message: string }) => void;
interface PanelProps { t: TFn; qc: ReturnType<typeof useQueryClient>; ok: Snack; err: Snack; }

// ── Advertisers ──────────────────────────────────────────────────────
function AdvertisersPanel({ t, qc, ok, err }: PanelProps) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AdvertiserPayload>(emptyAdvertiser);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["advertisers"],
    queryFn: ({ signal }) => getAdvertisers(signal),
  });

  const save = useMutation({
    mutationFn: (p: AdvertiserPayload) =>
      editId == null ? createAdvertiser(p) : updateAdvertiser(editId, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["advertisers"] });
      ok({ message: t("campaigns@saved") });
      setOpen(false);
    },
    onError: (e: Error) => err({ message: e?.message ?? t("loadingFailed") }),
  });

  return (
    <>
      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => { setEditId(null); setForm(emptyAdvertiser); setOpen(true); }}>
          {t("campaigns@addAdvertiser")}
        </Button>
      </Stack>
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4 }}>{t("campaigns@noAdvertisers")}</Typography>
      ) : (
        <Stack spacing={1.5}>
          {items.map((a) => (
            <Card key={a.id} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>{a.name}</Typography>
                    {a.contact && <Typography variant="body2" color="text.secondary">{a.contact}</Typography>}
                  </Box>
                  <IconButton onClick={() => { setEditId(a.id); setForm({ name: a.name, contact: a.contact ?? null, notes: a.notes ?? null }); setOpen(true); }}>
                    <EditIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={() => !save.isPending && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId == null ? t("campaigns@addAdvertiser") : t("campaigns@editAdvertiser")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label={`${t("campaigns@name")} *`} fullWidth value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <TextField label={t("campaigns@contact")} fullWidth value={form.contact ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value || null }))} />
            <TextField label={t("campaigns@notes")} fullWidth multiline minRows={2} value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit" disabled={save.isPending}>{t("cancel")}</Button>
          <Button variant="contained" disabled={save.isPending || !form.name.trim()}
            onClick={() => save.mutate(form)}>
            {save.isPending ? <CircularProgress size={20} color="inherit" /> : t("campaigns@save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ── Campaigns ────────────────────────────────────────────────────────
function CampaignsPanel({ t, qc, ok, err }: PanelProps) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CampaignPayload>(emptyCampaign);
  const [statsFor, setStatsFor] = useState<CampaignDto | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: ({ signal }) => getCampaigns(signal),
  });
  const { data: advertisers = [] } = useQuery({
    queryKey: ["advertisers"],
    queryFn: ({ signal }) => getAdvertisers(signal),
  });

  const save = useMutation({
    mutationFn: (p: CampaignPayload) =>
      editId == null ? createCampaign(p) : updateCampaign(editId, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      ok({ message: t("campaigns@saved") });
      setOpen(false);
    },
    onError: (e: Error) => err({ message: e?.message ?? t("loadingFailed") }),
  });

  const statusColor = (s: CampaignStatus) =>
    s === "active" ? "success" : s === "paused" ? "warning" : "default";

  return (
    <>
      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => { setEditId(null); setForm(emptyCampaign); setOpen(true); }}>
          {t("campaigns@addCampaign")}
        </Button>
      </Stack>
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4 }}>{t("campaigns@noCampaigns")}</Typography>
      ) : (
        <Stack spacing={1.5}>
          {items.map((c) => (
            <Card key={c.id} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {c.name || `#${c.id}`}
                      </Typography>
                      <Chip size="small" label={t(`campaigns@type_${c.type}`)} variant="outlined" />
                      <Chip size="small" label={t(`campaigns@status_${c.status}`)} color={statusColor(c.status)} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {c.advertiserName ?? ""}
                      {c.city ? ` · ${c.city}` : ""}
                      {c.price != null ? ` · ${c.price} JD` : ""}
                    </Typography>
                  </Box>
                  <Stack direction="row">
                    <IconButton onClick={() => setStatsFor(c)} aria-label="stats"><InsightsIcon /></IconButton>
                    <IconButton onClick={() => {
                      setEditId(c.id);
                      setForm({
                        advertiserId: c.advertiserId, name: c.name ?? null, type: c.type,
                        city: c.city ?? null, startDate: c.startDate ?? null, endDate: c.endDate ?? null,
                        price: c.price ?? null, status: c.status,
                      });
                      setOpen(true);
                    }} aria-label="edit"><EditIcon /></IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={() => !save.isPending && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId == null ? t("campaigns@addCampaign") : t("campaigns@editCampaign")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField select label={`${t("campaigns@advertiser")} *`} fullWidth value={form.advertiserId || ""}
              onChange={(e) => setForm((f) => ({ ...f, advertiserId: Number(e.target.value) }))}>
              {advertisers.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
            </TextField>
            <TextField label={t("campaigns@name")} fullWidth value={form.name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value || null }))} />
            <TextField select label={t("campaigns@type")} fullWidth value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CampaignType }))}>
              <MenuItem value="banner">{t("campaigns@type_banner")}</MenuItem>
              <MenuItem value="premium">{t("campaigns@type_premium")}</MenuItem>
              <MenuItem value="welcome">{t("campaigns@type_welcome")}</MenuItem>
            </TextField>
            <TextField label={t("campaigns@city")} fullWidth value={form.city ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value || null }))} />
            <Stack direction="row" spacing={1}>
              <TextField label={t("campaigns@startDate")} type="date" fullWidth InputLabelProps={{ shrink: true }}
                value={form.startDate ?? ""} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value || null }))} />
              <TextField label={t("campaigns@endDate")} type="date" fullWidth InputLabelProps={{ shrink: true }}
                value={form.endDate ?? ""} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value || null }))} />
            </Stack>
            <TextField label={t("campaigns@price")} type="number" fullWidth value={form.price ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value === "" ? null : Number(e.target.value) }))} />
            <TextField select label={t("campaigns@status")} fullWidth value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CampaignStatus }))}>
              <MenuItem value="active">{t("campaigns@status_active")}</MenuItem>
              <MenuItem value="paused">{t("campaigns@status_paused")}</MenuItem>
              <MenuItem value="ended">{t("campaigns@status_ended")}</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit" disabled={save.isPending}>{t("cancel")}</Button>
          <Button variant="contained" disabled={save.isPending || !form.advertiserId}
            onClick={() => save.mutate(form)}>
            {save.isPending ? <CircularProgress size={20} color="inherit" /> : t("campaigns@save")}
          </Button>
        </DialogActions>
      </Dialog>

      <CampaignStatsDialog campaign={statsFor} onClose={() => setStatsFor(null)} />
    </>
  );
}
