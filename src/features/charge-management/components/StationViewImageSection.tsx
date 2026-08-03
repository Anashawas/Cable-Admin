import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { useSnackbarStore } from "../../../stores";
import {
  uploadStationViewImage,
  deleteViewImage,
} from "../services/view-image-review-service";

/**
 * Validate the promo image so it renders great on the home premium card (a
 * wide landscape card, `BoxFit.cover`): must be a landscape ~16:9 image, at
 * least 1000×560 (1280×720 recommended). Returns an error string or null.
 */
const MIN_W = 1000;
const MIN_H = 560;
function validatePromoImage(file: File, isAr: boolean): Promise<string | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(isAr ? "يرجى اختيار ملف صورة." : "Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      resolve(isAr ? "حجم الملف كبير — أقل من 8MB." : "File too large — keep it under 8MB.");
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = img.width / img.height;
      // ~16:9 (1.78), tolerant enough to also accept 16:10 (1.6) landscapes.
      if (Math.abs(ratio - 16 / 9) > 0.18) {
        resolve(
          isAr
            ? "الصورة لازم تكون أفقية بنسبة 16:9 تقريباً (مش عمودية ولا مربّعة)."
            : "Use a landscape ~16:9 image (not portrait or square)."
        );
        return;
      }
      if (img.width < MIN_W || img.height < MIN_H) {
        resolve(
          isAr
            ? `الدقة صغيرة — لازم ${MIN_W}×${MIN_H} على الأقل (يُفضّل 1280×720).`
            : `Resolution too low — at least ${MIN_W}×${MIN_H} (1280×720 recommended).`
        );
        return;
      }
      resolve(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(isAr ? "ملف صورة غير صالح." : "Invalid image file.");
    };
    img.src = url;
  });
}

type Props = {
  stationId: number;
  viewImage?: string | null;
  viewImageStatus?: string | null;
};

/**
 * Premium ad-image (viewImage) management on the station profile: shows the
 * current creative + review status, and lets the admin upload/replace/remove it.
 * (Previously only reachable from the list's premium dialog.)
 */
export default function StationViewImageSection({ stationId, viewImage, viewImageStatus }: Props) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const qc = useQueryClient();
  const openSuccess = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openError = useSnackbarStore((s) => s.openErrorSnackbar);
  const fileRef = useRef<HTMLInputElement>(null);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["charge-management", "station", stationId] });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadStationViewImage(stationId, file),
    onSuccess: () => {
      invalidate();
      openSuccess({ message: isAr ? "تم رفع صورة الإعلان" : "Ad image uploaded" });
    },
    onError: (err: Error) => openError({ message: err?.message ?? "Upload failed" }),
  });

  const removeMutation = useMutation({
    mutationFn: () => deleteViewImage(stationId),
    onSuccess: () => {
      invalidate();
      openSuccess({ message: isAr ? "تمت إزالة صورة الإعلان" : "Ad image removed" });
    },
    onError: (err: Error) => openError({ message: err?.message ?? "Remove failed" }),
  });

  const busy = uploadMutation.isPending || removeMutation.isPending;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    const err = await validatePromoImage(file, isAr);
    if (err) {
      openError({ message: err });
      return;
    }
    uploadMutation.mutate(file);
  };

  const statusChip = () => {
    const st = (viewImageStatus ?? "").toLowerCase();
    if (!viewImage) return null;
    if (st === "approved")
      return <Chip size="small" color="success" label={isAr ? "معتمدة" : "Approved"} />;
    if (st === "rejected")
      return <Chip size="small" color="error" label={isAr ? "مرفوضة" : "Rejected"} />;
    return <Chip size="small" color="warning" label={isAr ? "بانتظار المراجعة" : "Pending review"} />;
  };

  return (
    <Box
      sx={{
        borderRadius: 3,
        p: { xs: 2, sm: 2.5 },
        border: "1.5px solid",
        borderColor: "#F5A623",
        background: "linear-gradient(135deg, rgba(245,166,35,0.10) 0%, rgba(245,166,35,0.02) 60%)",
        boxShadow: "0 4px 16px rgba(245,166,35,0.15)",
      }}
    >
      {/* Highlighted header */}
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            bgcolor: "#F5A623",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 3px 10px rgba(245,166,35,0.45)",
          }}
        >
          <WorkspacePremiumIcon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={900} lineHeight={1.15}>
            {isAr ? "صورة الإعلان المميّز" : "Premium Ad Image"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isAr ? "تظهر على كرت الهوم المميّز · 16:9" : "Shown on the highlighted home card · 16:9"}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        {statusChip()}
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        {isAr
          ? "الصورة الترويجية اللي بتظهر على كرت الهوم المميّز. بتنراجع قبل ما تظهر للمستخدمين."
          : "The promo image on the highlighted home card. Reviewed before it appears to users."}
      </Typography>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />

      {viewImage ? (
        <Stack spacing={1.5}>
          <Box
            component="img"
            src={viewImage}
            alt="ad"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
            sx={{
              width: "100%",
              maxWidth: 420,
              aspectRatio: "16 / 9",
              objectFit: "cover",
              borderRadius: 2,
              border: 1,
              borderColor: "divider",
              bgcolor: "action.hover",
            }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {isAr ? "استبدال" : "Replace"}
            </Button>
            <Button
              size="small"
              color="error"
              disabled={busy}
              onClick={() => {
                if (window.confirm(isAr ? "إزالة صورة الإعلان؟" : "Remove the ad image?")) {
                  removeMutation.mutate();
                }
              }}
            >
              {isAr ? "إزالة" : "Remove"}
            </Button>
            {busy && <CircularProgress size={20} sx={{ ml: 1 }} />}
          </Stack>
        </Stack>
      ) : (
        <Box
          onClick={() => !busy && fileRef.current?.click()}
          sx={{
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            cursor: busy ? "default" : "pointer",
            transition: "border-color .2s",
            "&:hover": { borderColor: "primary.main" },
          }}
        >
          {busy ? (
            <CircularProgress size={24} />
          ) : (
            <Stack alignItems="center" spacing={0.5} color="text.secondary">
              <ImageOutlinedIcon />
              <Typography variant="body2">
                {isAr ? "لا توجد صورة إعلان — اضغط للرفع" : "No ad image — click to upload"}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {isAr ? "أفقية 16:9 · ≥ 1280×720 · JPG/PNG" : "Landscape 16:9 · ≥ 1280×720 · JPG/PNG"}
              </Typography>
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
}
