import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import RedeemIcon from "@mui/icons-material/Redeem";
import CityMultiSelect from "../../../components/CityMultiSelect";
import { useSnackbarStore } from "../../../stores";
import { apiErrorMessage, apiFieldErrors, fromDateTimeInput, toDateTimeInput } from "../../../utils/api-error";
import { useSaveGift } from "../hooks/use-gifts";
import { GIFT_TYPES, type AdminCableGiftDto, type CableGiftInput, type GiftType } from "../types/api";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface FormState {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  howToReceiveAr: string;
  howToReceiveEn: string;
  giftType: GiftType;
  pointsCost: string;
  stock: string;
  perUserLimit: string;
  startsAt: string;
  endsAt: string;
  cities: string[];
  sortOrder: string;
  isActive: boolean;
}

const emptyForm = (): FormState => ({
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  howToReceiveAr: "",
  howToReceiveEn: "",
  giftType: "Physical",
  pointsCost: "",
  stock: "",
  perUserLimit: "1",
  startsAt: "",
  endsAt: "",
  cities: [],
  sortOrder: "0",
  isActive: true,
});

const fromGift = (g: AdminCableGiftDto): FormState => ({
  nameAr: g.nameAr ?? "",
  nameEn: g.nameEn ?? "",
  descriptionAr: g.descriptionAr ?? "",
  descriptionEn: g.descriptionEn ?? "",
  howToReceiveAr: g.howToReceiveAr ?? "",
  howToReceiveEn: g.howToReceiveEn ?? "",
  giftType: g.giftType,
  pointsCost: String(g.pointsCost ?? ""),
  stock: g.stock == null ? "" : String(g.stock),
  perUserLimit: g.perUserLimit == null ? "" : String(g.perUserLimit),
  startsAt: toDateTimeInput(g.startsAt),
  endsAt: toDateTimeInput(g.endsAt),
  cities: g.cities ?? [],
  sortOrder: String(g.sortOrder ?? 0),
  isActive: g.isActive,
});

const intOrNull = (v: string): number | null => {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

interface GiftFormDialogProps {
  open: boolean;
  gift: AdminCableGiftDto | null;
  onClose: () => void;
}

/** Create / edit a gift: both languages, cost, stock, limits, dates, cities and the image. */
export default function GiftFormDialog({ open, gift, onClose }: GiftFormDialogProps) {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const save = useSaveGift();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(gift ? fromGift(gift) : emptyForm());
    setImage(null);
    setServerErrors({});
    setTouched(false);
  }, [open, gift]);

  const previewUrl = useMemo(() => (image ? URL.createObjectURL(image) : gift?.imageUrl ?? null), [image, gift]);
  useEffect(() => () => {
    if (image && previewUrl) URL.revokeObjectURL(previewUrl);
  }, [image, previewUrl]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /** Mirrors the server rules so the admin sees the problem before saving. */
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.nameAr.trim()) e.nameAr = t("gifts@form.required");
    if (!form.nameEn.trim()) e.nameEn = t("gifts@form.required");
    const cost = intOrNull(form.pointsCost);
    if (cost == null || cost <= 0) e.pointsCost = t("gifts@form.pointsCostInvalid");
    const stock = intOrNull(form.stock);
    if (form.stock.trim() !== "" && (stock == null || stock < 0)) e.stock = t("gifts@form.stockInvalid");
    else if (gift && stock != null && stock < gift.ordersCount)
      e.stock = t("gifts@form.stockBelowOrdered", { count: gift.ordersCount });
    const perUser = intOrNull(form.perUserLimit);
    if (form.perUserLimit.trim() !== "" && (perUser == null || perUser <= 0)) e.perUserLimit = t("gifts@form.perUserInvalid");
    if (form.startsAt && form.endsAt && form.endsAt <= form.startsAt) e.endsAt = t("gifts@form.endsBeforeStart");
    return e;
  }, [form, gift, t]);

  const fieldError = (key: string) => (touched ? errors[key] : undefined) ?? serverErrors[key];
  const valid = Object.keys(errors).length === 0;

  const handleImage = (file: File | null) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      openErrorSnackbar({ message: t("gifts@form.imageType") });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      openErrorSnackbar({ message: t("gifts@form.imageSize") });
      return;
    }
    setImage(file);
  };

  const handleSubmit = () => {
    setTouched(true);
    if (!valid) return;
    const body: CableGiftInput = {
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      descriptionAr: form.descriptionAr.trim() || null,
      descriptionEn: form.descriptionEn.trim() || null,
      howToReceiveAr: form.howToReceiveAr.trim() || null,
      howToReceiveEn: form.howToReceiveEn.trim() || null,
      giftType: form.giftType,
      pointsCost: intOrNull(form.pointsCost) ?? 0,
      stock: intOrNull(form.stock),
      perUserLimit: intOrNull(form.perUserLimit),
      startsAt: fromDateTimeInput(form.startsAt),
      endsAt: fromDateTimeInput(form.endsAt),
      cities: form.cities,
      sortOrder: intOrNull(form.sortOrder) ?? 0,
      isActive: form.isActive,
    };
    save.mutate(
      { id: gift?.id ?? null, body, image },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t(gift ? "gifts@toast.updated" : "gifts@toast.created") });
          onClose();
        },
        onError: (err) => {
          setServerErrors(apiFieldErrors(err));
          openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) });
        },
      }
    );
  };

  const busy = save.isPending;

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <RedeemIcon color="primary" />
          <span>{gift ? t("gifts@form.editTitle") : t("gifts@form.createTitle")}</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Stack spacing={1} alignItems="center">
              <Avatar variant="rounded" src={previewUrl ?? undefined} sx={{ width: 140, height: 140, bgcolor: "action.hover" }}>
                <RedeemIcon sx={{ fontSize: 48 }} />
              </Avatar>
              <Button component="label" size="small" variant="outlined" startIcon={<AddPhotoAlternateIcon />} disabled={busy}>
                {t("gifts@form.image")}
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    handleImage(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
              </Button>
              <Typography variant="caption" color="text.secondary" textAlign="center">
                {t("gifts@form.imageHint")}
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" required label={t("gifts@form.nameAr")} value={form.nameAr}
                  onChange={(e) => set("nameAr", e.target.value)} error={!!fieldError("nameAr")} helperText={fieldError("nameAr")}
                  inputProps={{ maxLength: 150, dir: "rtl" }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" required label={t("gifts@form.nameEn")} value={form.nameEn}
                  onChange={(e) => set("nameEn", e.target.value)} error={!!fieldError("nameEn")} helperText={fieldError("nameEn")}
                  inputProps={{ maxLength: 150, dir: "ltr" }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" multiline minRows={2} label={t("gifts@form.descriptionAr")} value={form.descriptionAr}
                  onChange={(e) => set("descriptionAr", e.target.value)} inputProps={{ maxLength: 2000, dir: "rtl" }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" multiline minRows={2} label={t("gifts@form.descriptionEn")} value={form.descriptionEn}
                  onChange={(e) => set("descriptionEn", e.target.value)} inputProps={{ maxLength: 2000, dir: "ltr" }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" multiline minRows={2} label={t("gifts@form.howToReceiveAr")} value={form.howToReceiveAr}
                  onChange={(e) => set("howToReceiveAr", e.target.value)} inputProps={{ maxLength: 1000, dir: "rtl" }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" multiline minRows={2} label={t("gifts@form.howToReceiveEn")} value={form.howToReceiveEn}
                  onChange={(e) => set("howToReceiveEn", e.target.value)} inputProps={{ maxLength: 1000, dir: "ltr" }} />
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField select fullWidth size="small" label={t("gifts@form.type")} value={form.giftType}
              onChange={(e) => set("giftType", e.target.value as GiftType)} helperText={t(`gifts@typeHint.${form.giftType}`)}>
              {GIFT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>{t(`gifts@type.${type}`)}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth size="small" required type="number" label={t("gifts@form.pointsCost")} value={form.pointsCost}
              onChange={(e) => set("pointsCost", e.target.value)} error={!!fieldError("pointsCost")} helperText={fieldError("pointsCost")}
              inputProps={{ min: 1, step: 1 }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth size="small" type="number" label={t("gifts@form.stock")} value={form.stock}
              onChange={(e) => set("stock", e.target.value)} error={!!fieldError("stock")}
              helperText={fieldError("stock") ?? (gift ? t("gifts@form.stockHintOrdered", { count: gift.ordersCount }) : t("gifts@form.unlimitedHint"))}
              inputProps={{ min: 0, step: 1 }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth size="small" type="number" label={t("gifts@form.perUserLimit")} value={form.perUserLimit}
              onChange={(e) => set("perUserLimit", e.target.value)} error={!!fieldError("perUserLimit")}
              helperText={fieldError("perUserLimit") ?? t("gifts@form.unlimitedHint")} inputProps={{ min: 1, step: 1 }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth size="small" type="datetime-local" label={t("gifts@form.startsAt")} value={form.startsAt}
              onChange={(e) => set("startsAt", e.target.value)} InputLabelProps={{ shrink: true }} helperText={t("gifts@form.jordanTime")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField fullWidth size="small" type="datetime-local" label={t("gifts@form.endsAt")} value={form.endsAt}
              onChange={(e) => set("endsAt", e.target.value)} InputLabelProps={{ shrink: true }}
              error={!!fieldError("endsAt")} helperText={fieldError("endsAt") ?? t("gifts@form.jordanTime")} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <CityMultiSelect value={form.cities} onChange={(v) => set("cities", v)} label={t("gifts@form.cities")}
              helperText={serverErrors.cities ?? t("gifts@form.citiesHint")} error={!!serverErrors.cities} disabled={busy} />
          </Grid>
          <Grid size={{ xs: 6, md: 1 }}>
            <TextField fullWidth size="small" type="number" label={t("gifts@form.sortOrder")} value={form.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)} inputProps={{ step: 1 }} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />}
              label={t("gifts@form.isActive")} />
          </Grid>
          {gift && gift.pendingOrders > 0 && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>{t("gifts@form.pendingHint", { count: gift.pendingOrders })}</Alert>
            </Grid>
          )}
        </Grid>
        <Box sx={{ mt: 1 }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={busy} color="inherit">{t("cancel")}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={busy || (touched && !valid)}
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}>
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
