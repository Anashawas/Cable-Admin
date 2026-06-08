import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  TextField,
  Stack,
  Typography,
  CircularProgress,
  Paper,
  Grid,
  InputAdornment,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import EventIcon from "@mui/icons-material/Event";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

import AppScreenContainer from "../../app/components/AppScreenContainer";
import { generateUtilityInvoice } from "../services/receipt-service";
import { downloadPdfBlob } from "../utils/download-pdf";
import { useSnackbarStore } from "../../../stores";
import type { UtilityInvoiceRequest } from "../types/api";

interface FormState {
  customerName: string;
  email: string;
  phone: string;
  serviceName: string;
  invoiceName: string;
  titleName: string;
  privacyName: string;
  totalAmount: string;
  paymentDate: string;
  durationFrom: string;
  durationTo: string;
  year: string;
}

const INITIAL_STATE: FormState = {
  customerName: "",
  email: "",
  phone: "",
  serviceName: "",
  invoiceName: "",
  titleName: "",
  privacyName: "",
  totalAmount: "",
  paymentDate: "",
  durationFrom: "",
  durationTo: "",
  year: "",
};

export default function ReceiptGeneratorScreen() {
  const { t } = useTranslation("receipts");
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [form, setForm] = useState<FormState>(INITIAL_STATE);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = useCallback(() => setForm(INITIAL_STATE), []);

  const generateMutation = useMutation({
    mutationFn: (payload: UtilityInvoiceRequest) => generateUtilityInvoice(payload),
    onSuccess: ({ blob, fileName }) => {
      if (!blob || blob.size === 0) {
        openErrorSnackbar({ message: t("receipts@errors.emptyFile") });
        return;
      }
      const finalName =
        fileName?.trim() ||
        (form.invoiceName.trim() ? `${form.invoiceName.trim()}.pdf` : "invoice.pdf");
      downloadPdfBlob(blob, finalName);
      openSuccessSnackbar({ message: t("receipts@success") });
    },
    onError: (err: Error) =>
      openErrorSnackbar({ message: err?.message ?? t("common@loadingFailed") }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const required: (keyof FormState)[] = [
      "customerName",
      "email",
      "phone",
      "serviceName",
      "invoiceName",
      "titleName",
      "privacyName",
      "totalAmount",
      "paymentDate",
      "durationFrom",
      "durationTo",
      "year",
    ];
    for (const key of required) {
      if (!String(form[key]).trim()) {
        openErrorSnackbar({ message: t("receipts@errors.allFieldsRequired") });
        return;
      }
    }

    const total = Number(form.totalAmount);
    const year = Number(form.year);
    if (!Number.isFinite(total) || total < 0) {
      openErrorSnackbar({ message: t("receipts@errors.invalidAmount") });
      return;
    }
    if (!Number.isInteger(year) || year < 1) {
      openErrorSnackbar({ message: t("receipts@errors.invalidYear") });
      return;
    }

    const payload: UtilityInvoiceRequest = {
      customerName: form.customerName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      serviceName: form.serviceName.trim(),
      invoiceName: form.invoiceName.trim(),
      titleName: form.titleName.trim(),
      privacyName: form.privacyName.trim(),
      totalAmount: total,
      paymentDate: new Date(form.paymentDate).toISOString(),
      durationFrom: form.durationFrom,
      durationTo: form.durationTo,
      year,
    };

    generateMutation.mutate(payload);
  };

  const isGenerating = generateMutation.isPending;

  return (
    <AppScreenContainer>
      <Box
        sx={{
          background: "linear-gradient(135deg, #0d3b66 0%, #145374 55%, #1f6f8b 100%)",
          borderRadius: 3,
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          position: "relative",
          overflow: "hidden",
          color: "white",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -40,
            left: -40,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            pointerEvents: "none",
          }}
        />

        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              bgcolor: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ReceiptLongIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              {t("receipts@title")}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.25 }}>
              {t("receipts@subtitle")}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto" }}>
          {/* Customer Information */}
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  bgcolor: "primary.50",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PersonIcon sx={{ fontSize: 18, color: "primary.main" }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                {t("receipts@sections.customer")}
              </Typography>
            </Stack>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("receipts@fields.customerName")}
                  value={form.customerName}
                  onChange={(e) => setField("customerName", e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("receipts@fields.email")}
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("receipts@fields.phone")}
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Invoice Information */}
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  bgcolor: "secondary.50",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DescriptionIcon sx={{ fontSize: 18, color: "secondary.main" }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="secondary.main">
                {t("receipts@sections.invoice")}
              </Typography>
            </Stack>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("receipts@fields.invoiceName")}
                  value={form.invoiceName}
                  onChange={(e) => setField("invoiceName", e.target.value)}
                  fullWidth
                  required
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("receipts@fields.titleName")}
                  value={form.titleName}
                  onChange={(e) => setField("titleName", e.target.value)}
                  fullWidth
                  required
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("receipts@fields.serviceName")}
                  value={form.serviceName}
                  onChange={(e) => setField("serviceName", e.target.value)}
                  fullWidth
                  required
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("receipts@fields.privacyName")}
                  value={form.privacyName}
                  onChange={(e) => setField("privacyName", e.target.value)}
                  fullWidth
                  required
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Payment & Duration */}
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  bgcolor: "success.50",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AttachMoneyIcon sx={{ fontSize: 18, color: "success.main" }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="success.main">
                {t("receipts@sections.payment")}
              </Typography>
            </Stack>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("receipts@fields.totalAmount")}
                  type="number"
                  value={form.totalAmount}
                  onChange={(e) => setField("totalAmount", e.target.value)}
                  fullWidth
                  required
                  inputProps={{ step: "0.01", min: 0 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("receipts@fields.year")}
                  type="number"
                  value={form.year}
                  onChange={(e) => setField("year", e.target.value)}
                  fullWidth
                  required
                  inputProps={{ step: 1, min: 1 }}
                  helperText={t("receipts@hints.year")}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("receipts@fields.paymentDate")}
                  type="datetime-local"
                  value={form.paymentDate}
                  onChange={(e) => setField("paymentDate", e.target.value)}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EventIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("receipts@fields.durationFrom")}
                  type="date"
                  value={form.durationFrom}
                  onChange={(e) => setField("durationFrom", e.target.value)}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EventIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={t("receipts@fields.durationTo")}
                  type="date"
                  value={form.durationTo}
                  onChange={(e) => setField("durationTo", e.target.value)}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EventIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Submit */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "grey.50",
            }}
          >
            <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
              <Button
                variant="outlined"
                color="inherit"
                onClick={resetForm}
                disabled={isGenerating}
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 700,
                  textTransform: "none",
                  minWidth: 120,
                }}
              >
                {t("common@reset")}
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isGenerating}
                startIcon={
                  isGenerating ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <PictureAsPdfIcon />
                  )
                }
                sx={{
                  borderRadius: 2.5,
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  textTransform: "none",
                  py: 1.25,
                  px: 4,
                  background:
                    "linear-gradient(135deg, #0d3b66 0%, #145374 55%, #1f6f8b 100%)",
                  boxShadow: "0 4px 14px rgba(13,59,102,0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #082c4d 0%, #0d3b66 100%)",
                    boxShadow: "0 6px 20px rgba(13,59,102,0.4)",
                  },
                }}
              >
                {isGenerating
                  ? t("receipts@generating")
                  : t("receipts@generate")}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </form>
    </AppScreenContainer>
  );
}
