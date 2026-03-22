import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Divider,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import StoreIcon from "@mui/icons-material/Store";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AddIcon from "@mui/icons-material/Add";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PublicIcon from "@mui/icons-material/Public";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PaymentIcon from "@mui/icons-material/Payment";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CollectionsIcon from "@mui/icons-material/Collections";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useSnackbarStore } from "../../../stores";
import { useCreateServiceProvider } from "../hooks/use-service-providers";
import { useServiceCategories } from "../hooks/use-service-categories";
import type { CreateServiceProviderRequest } from "../types/api";

interface FormData {
  name: string;
  serviceCategoryId: number | "";
  statusId: number;
  description: string;
  phone: string;
  ownerPhone: string;
  address: string;
  countryName: string;
  cityName: string;
  price: string;
  priceDescription: string;
  fromTime: string;
  toTime: string;
  methodPayment: string;
  hasOffer: boolean;
  offerDescription: string;
  service: string;
  whatsAppNumber: string;
  websiteUrl: string;
  latitude: string;
  longitude: string;
  icon: string;
}

const initialFormData: FormData = {
  name: "",
  serviceCategoryId: "",
  statusId: 1,
  description: "",
  phone: "",
  ownerPhone: "",
  address: "",
  countryName: "",
  cityName: "",
  price: "",
  priceDescription: "",
  fromTime: "",
  toTime: "",
  methodPayment: "",
  hasOffer: false,
  offerDescription: "",
  service: "",
  whatsAppNumber: "",
  websiteUrl: "",
  latitude: "",
  longitude: "",
  icon: "",
};

export default function AddServiceProviderScreen() {
  const { t } = useTranslation("serviceProviders");
  const navigate = useNavigate();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { allData: categories } = useServiceCategories();
  const createMutation = useCreateServiceProvider();

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const formatTime = (t: string) => {
    const trimmed = t.trim();
    if (!trimmed) return null;
    return trimmed.split(":").length === 2 ? `${trimmed}:00` : trimmed;
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name.trim() || !formData.serviceCategoryId) {
        openErrorSnackbar({ message: t("serviceProviders@nameAndCategoryRequired") });
        return;
      }

      const payload: CreateServiceProviderRequest = {
        name: formData.name.trim(),
        serviceCategoryId: formData.serviceCategoryId as number,
        statusId: formData.statusId,
        description: formData.description.trim() || null,
        phone: formData.phone.trim() || null,
        ownerPhone: formData.ownerPhone.trim() || null,
        address: formData.address.trim() || null,
        countryName: formData.countryName.trim() || null,
        cityName: formData.cityName.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        priceDescription: formData.priceDescription.trim() || null,
        fromTime: formatTime(formData.fromTime),
        toTime: formatTime(formData.toTime),
        methodPayment: formData.methodPayment.trim() || null,
        hasOffer: formData.hasOffer,
        offerDescription: formData.offerDescription.trim() || null,
        service: formData.service.trim() || null,
        whatsAppNumber: formData.whatsAppNumber.trim() || null,
        websiteUrl: formData.websiteUrl.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        icon: formData.icon.trim() || null,
      };

      createMutation.mutate(payload, {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("serviceProviders@created") });
          navigate("/service-providers");
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      });
    },
    [formData, createMutation, openSuccessSnackbar, openErrorSnackbar, navigate, t]
  );

  return (
    <AppScreenContainer>
      {/* ── Header ── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
          borderRadius: 3,
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          position: "relative",
          overflow: "hidden",
          color: "white",
        }}
      >
        <Box sx={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={() => navigate("/service-providers")} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.12)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ width: 52, height: 52, borderRadius: 2.5, background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AddIcon sx={{ color: "white", fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} color="white">{t("addProvider")}</Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.25 }}>{t("formInfoHint")}</Typography>
          </Box>
        </Stack>
      </Box>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Required hint */}
          <Alert
            severity="info"
            icon={<InfoOutlinedIcon fontSize="small" />}
            sx={{ borderRadius: 2.5, py: 0.5, "& .MuiAlert-message": { fontSize: "0.85rem" } }}
          >
            {t("formRequiredHint")}
          </Alert>

          {/* ── Section: Basic Information ── */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "primary.50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <StoreIcon sx={{ fontSize: 18, color: "primary.main" }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="primary.main">{t("basicInfo")}</Typography>
            </Stack>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={7}>
                <TextField
                  label={`${t("name")} *`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  fullWidth
                  autoFocus
                  helperText={t("nameHint")}
                  InputProps={{ startAdornment: <InputAdornment position="start"><StoreIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <FormControl fullWidth required>
                  <InputLabel>{t("category")} *</InputLabel>
                  <Select
                    value={formData.serviceCategoryId}
                    label={`${t("category")} *`}
                    onChange={(e) => setFormData({ ...formData, serviceCategoryId: e.target.value as number })}
                    sx={{ borderRadius: 2.5 }}
                  >
                    {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>{t("status")}</InputLabel>
                  <Select
                    value={formData.statusId}
                    label={t("status")}
                    onChange={(e) => setFormData({ ...formData, statusId: e.target.value as number })}
                    sx={{ borderRadius: 2.5 }}
                  >
                    <MenuItem value={1}>{t("active")}</MenuItem>
                    <MenuItem value={2}>{t("inactive")}</MenuItem>
                    <MenuItem value={3}>{t("pending")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label={t("description")}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                  fullWidth
                  helperText={t("descriptionHint")}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ── Section: Contact & Location ── */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "success.50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ContactPhoneIcon sx={{ fontSize: 18, color: "success.main" }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="success.main">{t("contactInfo")}</Typography>
            </Stack>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={4}>
                <TextField label={t("phone")} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} fullWidth helperText={t("phoneHint")} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label={t("whatsApp")} value={formData.whatsAppNumber} onChange={(e) => setFormData({ ...formData, whatsAppNumber: e.target.value })} fullWidth helperText={t("whatsAppHint")} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label={t("ownerPhone")} value={formData.ownerPhone} onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })} fullWidth helperText={t("ownerPhoneHint")} InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label={t("cityName")} value={formData.cityName} onChange={(e) => setFormData({ ...formData, cityName: e.target.value })} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label={t("countryName")} value={formData.countryName} onChange={(e) => setFormData({ ...formData, countryName: e.target.value })} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><PublicIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t("websiteUrl")} value={formData.websiteUrl} onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })} fullWidth placeholder="https://example.com" helperText={t("websiteHint")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label={t("address")} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} fullWidth helperText={t("addressHint")} InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
            </Grid>
          </Paper>

          {/* ── Section: GPS Location ── */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "warning.50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MyLocationIcon sx={{ fontSize: 18, color: "warning.main" }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="warning.main">{t("locationInfo")}</Typography>
            </Stack>
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2.5, "& .MuiAlert-message": { fontSize: "0.85rem" } }}>{t("coordinatesHint")}</Alert>
            <Grid container spacing={2.5}>
              <Grid item xs={6}>
                <TextField label={t("latitude")} value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} type="number" inputProps={{ step: "any" }} fullWidth placeholder="31.9522" helperText={t("latitudeHint")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label={t("longitude")} value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} type="number" inputProps={{ step: "any" }} fullWidth placeholder="35.9284" helperText={t("longitudeHint")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
            </Grid>
          </Paper>

          {/* ── Section: Business Hours & Pricing ── */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "secondary.50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AccessTimeIcon sx={{ fontSize: 18, color: "secondary.main" }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="secondary.main">{t("hoursAndPricing")}</Typography>
            </Stack>
            <Grid container spacing={2.5}>
              <Grid item xs={6} sm={3}>
                <TextField label={t("fromTime")} value={formData.fromTime} onChange={(e) => setFormData({ ...formData, fromTime: e.target.value })} type="time" fullWidth InputLabelProps={{ shrink: true }} helperText={t("openingHoursHint")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label={t("toTime")} value={formData.toTime} onChange={(e) => setFormData({ ...formData, toTime: e.target.value })} type="time" fullWidth InputLabelProps={{ shrink: true }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label={t("price")} value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} type="number" fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><AttachMoneyIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }} helperText={t("priceHint")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label={t("priceDescription")} value={formData.priceDescription} onChange={(e) => setFormData({ ...formData, priceDescription: e.target.value })} fullWidth placeholder={t("priceDescPlaceholder")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label={t("methodPayment")} value={formData.methodPayment} onChange={(e) => setFormData({ ...formData, methodPayment: e.target.value })} fullWidth placeholder={t("paymentPlaceholder")} helperText={t("paymentHint")} InputProps={{ startAdornment: <InputAdornment position="start"><PaymentIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> }} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
            </Grid>
          </Paper>

          {/* ── Section: Services & Offers ── */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "error.50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LocalOfferIcon sx={{ fontSize: 18, color: "error.main" }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="error.main">{t("servicesAndOffers")}</Typography>
            </Stack>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField label={t("service")} value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} multiline rows={3} fullWidth helperText={t("servicesHint")} placeholder={t("servicesPlaceholder")} sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
              </Grid>
              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{
                    px: 2.5, py: 2, borderRadius: 2.5,
                    borderColor: formData.hasOffer ? "warning.main" : "divider",
                    bgcolor: formData.hasOffer ? "rgba(255, 152, 0, 0.04)" : "transparent",
                    transition: "all 0.2s",
                  }}
                >
                  <FormControlLabel
                    control={<Checkbox checked={formData.hasOffer} onChange={(e) => setFormData({ ...formData, hasOffer: e.target.checked })} color="warning" />}
                    label={
                      <Box>
                        <Typography fontWeight={600} color={formData.hasOffer ? "warning.dark" : "text.secondary"}>{t("hasOffer")}</Typography>
                        <Typography variant="caption" color="text.disabled">{t("hasOfferHint")}</Typography>
                      </Box>
                    }
                  />
                  {formData.hasOffer && (
                    <TextField label={t("offerDescription")} value={formData.offerDescription} onChange={(e) => setFormData({ ...formData, offerDescription: e.target.value })} multiline rows={2} fullWidth sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} placeholder={t("offerDescPlaceholder")} />
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          {/* ── Section: Icon & Images ── */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "info.50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CollectionsIcon sx={{ fontSize: 18, color: "info.main" }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="info.main">{t("serviceProviders@imagesGallery")}</Typography>
            </Stack>

            {/* Icon URL with Preview */}
            <Stack direction="row" spacing={2.5} alignItems="flex-start" sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2.5,
                  overflow: "hidden",
                  border: "2px dashed",
                  borderColor: formData.icon ? "info.main" : "grey.300",
                  bgcolor: formData.icon ? "transparent" : "grey.50",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.25s ease",
                }}
              >
                {formData.icon ? (
                  <Box
                    component="img"
                    src={formData.icon}
                    alt="icon"
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <StoreIcon sx={{ fontSize: 28, color: "text.disabled" }} />
                )}
              </Box>
              <TextField
                label={t("serviceProviders@iconUrlLabel")}
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                fullWidth
                placeholder="https://example.com/icon.png"
                helperText={t("serviceProviders@iconUrlHint")}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
              />
            </Stack>

            {/* Gallery images note */}
            <Alert
              severity="info"
              icon={<CollectionsIcon fontSize="small" />}
              sx={{ borderRadius: 2.5, "& .MuiAlert-message": { fontSize: "0.85rem" } }}
            >
              {t("serviceProviders@galleryImagesAfterCreate")}
            </Alert>
          </Paper>

          {/* ── Actions ── */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "grey.50",
              position: "sticky",
              bottom: 0,
              zIndex: 10,
            }}
          >
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate("/service-providers")}
                sx={{ borderRadius: 2.5, minWidth: 120, fontWeight: 700, textTransform: "none" }}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createMutation.isPending}
                startIcon={createMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
                sx={{
                  borderRadius: 2.5,
                  minWidth: 180,
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  textTransform: "none",
                  py: 1.25,
                  background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
                  boxShadow: "0 4px 14px rgba(13,71,161,0.3)",
                  "&:hover": { background: "linear-gradient(135deg, #0a3880 0%, #0d47a1 100%)", boxShadow: "0 6px 20px rgba(13,71,161,0.4)" },
                }}
              >
                {createMutation.isPending ? t("creating") : t("create")}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </form>
    </AppScreenContainer>
  );
}
