import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Tabs,
  Tab,
  Skeleton,
  Avatar,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import { useTermsVersion } from "../hooks/use-terms";
import TermsHtmlPreview from "./TermsHtmlPreview";
import { scopeLabelKey } from "./scope";

interface Props {
  /** Version id to display, or null to keep the dialog closed. */
  versionId: number | null;
  onClose: () => void;
}

export default function TermsVersionDialog({ versionId, onClose }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const { data, isLoading } = useTermsVersion(versionId);

  const lang: "ar" | "en" = tab === 0 ? "en" : "ar";
  const html = tab === 0 ? (data?.contentEn ?? "") : (data?.contentAr ?? "");

  return (
    <Dialog open={versionId != null} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <Box sx={{ background: "linear-gradient(135deg, #0d3276 0%, #1565c0 100%)", px: 3, py: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}>
            <GavelIcon sx={{ color: "#fff" }} />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} color="#fff" noWrap>
              {data ? `v${data.systemVersion}` : t("terms@version")}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
              {data && (
                <>
                  <Chip
                    size="small"
                    label={t(scopeLabelKey(data.roleId))}
                    sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: "rgba(255,255,255,0.2)", color: "#fff" }}
                  />
                  <Chip
                    size="small"
                    label={data.isActive ? t("terms@active") : t("terms@inactive")}
                    sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: "rgba(255,255,255,0.2)", color: "#fff" }}
                  />
                  <Chip
                    size="small"
                    label={t("terms@acceptancesCount", { count: data.acceptanceCount })}
                    sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: "rgba(255,255,255,0.2)", color: "#fff" }}
                  />
                </>
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label={t("terms@english")} sx={{ fontWeight: 700 }} />
          <Tab label={t("terms@arabic")} sx={{ fontWeight: 700 }} />
        </Tabs>
        {isLoading ? (
          <Stack spacing={1}>
            <Skeleton variant="text" width="45%" height={32} />
            <Skeleton variant="rounded" height={280} />
          </Stack>
        ) : (
          <TermsHtmlPreview html={html} lang={lang} maxHeight={480} />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">{t("close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
