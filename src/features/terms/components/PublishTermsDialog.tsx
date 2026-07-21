import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  CircularProgress,
  Avatar,
  Grid,
  Divider,
} from "@mui/material";
import PublishIcon from "@mui/icons-material/Publish";
import GavelIcon from "@mui/icons-material/Gavel";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useSnackbarStore } from "../../../stores";
import { usePublishTermsVersion } from "../hooks/use-terms";
import TermsHtmlPreview, { sanitizeTermsHtml } from "./TermsHtmlPreview";
import {
  TERMS_ROLE_PROVIDER,
  TERMS_ROLE_USER,
  type TermsRoleId,
  type TermsVersionSummaryDto,
} from "../types/api";

function errMessage(err: any, fallback: string): string {
  return err?.response?.data?.detail || err?.response?.data?.title || err?.message || fallback;
}

/** Rough "did the sanitizer eat anything meaningful" check for the paste warning. */
function strippedSomething(raw: string): boolean {
  if (!raw.trim()) return false;
  const clean = sanitizeTermsHtml(raw);
  const textOf = (s: string) => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return textOf(clean).length < textOf(raw).length;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Existing versions — used to warn how many users this will force to re-accept. */
  versions: TermsVersionSummaryDto[];
}

export default function PublishTermsDialog({ open, onClose, versions }: Props) {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const publishMutation = usePublishTermsVersion();
  const isPending = publishMutation.isPending;

  const [systemVersion, setSystemVersion] = useState("");
  const [roleId, setRoleId] = useState<TermsRoleId>(TERMS_ROLE_PROVIDER);
  const [contentEn, setContentEn] = useState("");
  const [contentAr, setContentAr] = useState("");
  const [tab, setTab] = useState(0);
  const [touched, setTouched] = useState(false);

  /**
   * Publishing deactivates the current active version in the SAME scope, which
   * flips every one of its acceptances back to "not accepted". Surface that
   * number before the admin commits — a typo fix should not silently blast a
   * blocking dialog at the whole partner base.
   */
  const impactCount = useMemo(() => {
    const active = versions.find((v) => v.isActive && v.roleId === roleId);
    return active?.acceptanceCount ?? 0;
  }, [versions, roleId]);

  const reset = useCallback(() => {
    setSystemVersion("");
    setRoleId(TERMS_ROLE_PROVIDER);
    setContentEn("");
    setContentAr("");
    setTab(0);
    setTouched(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isPending) return;
    reset();
    onClose();
  }, [isPending, reset, onClose]);

  const versionError = touched && !systemVersion.trim();
  const enError = touched && !contentEn.trim();
  const arError = touched && !contentAr.trim();

  const handleSubmit = useCallback(() => {
    setTouched(true);
    if (!systemVersion.trim() || !contentEn.trim() || !contentAr.trim()) {
      openErrorSnackbar({ message: t("terms@validationRequired") });
      return;
    }
    publishMutation.mutate(
      {
        systemVersion: systemVersion.trim(),
        roleId,
        // Store the sanitized markup, not the raw paste — the partner app
        // renders a restricted tag set anyway, so what admins preview here is
        // exactly what providers will see.
        contentEn: sanitizeTermsHtml(contentEn),
        contentAr: sanitizeTermsHtml(contentAr),
      },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("terms@published") });
          reset();
          onClose();
        },
        onError: (err) => openErrorSnackbar({ message: errMessage(err, t("loadingFailed")) }),
      }
    );
  }, [systemVersion, roleId, contentEn, contentAr, publishMutation, openSuccessSnackbar, openErrorSnackbar, reset, onClose, t]);

  const editorSx = {
    "& .MuiInputBase-root": {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 13,
      lineHeight: 1.6,
      alignItems: "flex-start",
    },
  } as const;

  const lang: "ar" | "en" = tab === 0 ? "en" : "ar";
  const content = tab === 0 ? contentEn : contentAr;
  const setContent = tab === 0 ? setContentEn : setContentAr;
  const contentError = tab === 0 ? enError : arError;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <Box sx={{ background: "linear-gradient(135deg, #0d3276 0%, #1565c0 100%)", px: 3, py: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}>
            <GavelIcon sx={{ color: "#fff" }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#fff">{t("terms@publishTitle")}</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("terms@publishSubtitle")}</Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent dividers sx={{ pt: 2.5 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={t("terms@systemVersion")}
              value={systemVersion}
              onChange={(e) => setSystemVersion(e.target.value)}
              placeholder="2.3.0"
              fullWidth
              required
              error={versionError}
              helperText={versionError ? t("terms@validationRequired") : t("terms@systemVersionHint")}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label={t("terms@scope")}
              value={roleId === null ? "all" : String(roleId)}
              onChange={(e) => setRoleId(e.target.value === "all" ? null : Number(e.target.value))}
              fullWidth
              helperText={t("terms@scopeHint")}
            >
              <MenuItem value={String(TERMS_ROLE_PROVIDER)}>{t("terms@scopeProviders")}</MenuItem>
              <MenuItem value={String(TERMS_ROLE_USER)}>{t("terms@scopeUsers")}</MenuItem>
              <MenuItem value="all">{t("terms@scopeAll")}</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {impactCount > 0 && (
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2, borderRadius: 2 }}>
            <AlertTitle sx={{ fontWeight: 700 }}>{t("terms@impactTitle")}</AlertTitle>
            {t("terms@impactBody", { count: impactCount })}
          </Alert>
        )}

        <Divider sx={{ mb: 2 }} />

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label={t("terms@english")} sx={{ fontWeight: 700 }} />
          <Tab label={t("terms@arabic")} sx={{ fontWeight: 700 }} />
        </Tabs>

        {strippedSomething(content) && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            {t("terms@sanitizeNotice")}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
              {t("terms@htmlSource")}
            </Typography>
            <TextField
              value={content}
              onChange={(e) => setContent(e.target.value)}
              multiline
              minRows={16}
              maxRows={16}
              fullWidth
              required
              error={contentError}
              helperText={contentError ? t("terms@validationRequired") : t("terms@htmlSourceHint")}
              placeholder={lang === "ar" ? "<h1>الشروط والأحكام</h1>\n<p>...</p>" : "<h1>Terms & Conditions</h1>\n<p>...</p>"}
              sx={editorSx}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
              {t("terms@preview")}
            </Typography>
            {content.trim() ? (
              <TermsHtmlPreview html={content} lang={lang} maxHeight={409} />
            ) : (
              <Box
                sx={{
                  height: 409,
                  borderRadius: 2,
                  border: "2px dashed",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.disabled",
                  fontSize: 14,
                  textAlign: "center",
                  px: 3,
                }}
              >
                {t("terms@previewEmpty")}
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={isPending} color="inherit">{t("cancel")}</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isPending}
          startIcon={isPending ? <CircularProgress size={18} color="inherit" /> : <PublishIcon />}
        >
          {t("terms@publish")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
