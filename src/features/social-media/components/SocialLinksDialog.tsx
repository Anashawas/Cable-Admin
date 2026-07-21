import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Avatar,
  CircularProgress,
  Skeleton,
  Alert,
  Divider,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ShareIcon from "@mui/icons-material/Share";
import LinkIcon from "@mui/icons-material/Link";
import SaveIcon from "@mui/icons-material/Save";
import { useSnackbarStore } from "../../../stores";
import {
  useActiveSocialMediaPlatforms,
  useSocialLinks,
  useSetSocialLinks,
} from "../hooks/use-social-media";
import type { SocialProviderType } from "../types/api";

interface EditableRow {
  key: number;
  socialMediaPlatformId: number | "";
  url: string;
}

interface SocialLinksDialogProps {
  open: boolean;
  providerType: SocialProviderType;
  providerId: number | null;
  providerName?: string;
  onClose: () => void;
}

export default function SocialLinksDialog({
  open,
  providerType,
  providerId,
  providerName,
  onClose,
}: SocialLinksDialogProps) {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data: platforms = [], isLoading: platformsLoading } = useActiveSocialMediaPlatforms(open);
  const { data: links, isLoading: linksLoading } = useSocialLinks(providerType, providerId, open);
  const setMutation = useSetSocialLinks();

  const [rows, setRows] = useState<EditableRow[]>([]);
  const keyCounter = useRef(0);
  const nextKey = () => ++keyCounter.current;

  // Seed rows from server data whenever the dialog (re)opens for a provider.
  useEffect(() => {
    if (!open || links === undefined) return;
    setRows(
      links.map((l) => ({ key: nextKey(), socialMediaPlatformId: l.socialMediaPlatformId, url: l.url }))
    );
  }, [open, links]);

  const platformById = useMemo(() => {
    const m = new Map<number, { name: string; iconUrl: string | null }>();
    platforms.forEach((p) => m.set(p.id, { name: p.name, iconUrl: p.iconUrl }));
    return m;
  }, [platforms]);

  const addRow = useCallback(() => {
    setRows((r) => [...r, { key: nextKey(), socialMediaPlatformId: "", url: "" }]);
  }, []);

  const removeRow = useCallback((key: number) => {
    setRows((r) => r.filter((row) => row.key !== key));
  }, []);

  const updateRow = useCallback((key: number, patch: Partial<EditableRow>) => {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }, []);

  const moveRow = useCallback((index: number, dir: -1 | 1) => {
    setRows((r) => {
      const target = index + dir;
      if (target < 0 || target >= r.length) return r;
      const copy = [...r];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (providerId == null || providerId <= 0) return;
    // Validate
    for (const row of rows) {
      if (!row.socialMediaPlatformId) { openErrorSnackbar({ message: t("socialMedia@selectPlatform") }); return; }
      if (!row.url.trim()) { openErrorSnackbar({ message: t("socialMedia@urlRequired") }); return; }
      if (row.url.trim().length > 1000) { openErrorSnackbar({ message: t("socialMedia@urlTooLong") }); return; }
    }
    setMutation.mutate(
      {
        providerType,
        providerId,
        links: rows.map((row, i) => ({
          socialMediaPlatformId: row.socialMediaPlatformId as number,
          url: row.url.trim(),
          displayOrder: i + 1,
        })),
      },
      {
        onSuccess: () => { openSuccessSnackbar({ message: t("socialMedia@linksSaved") }); onClose(); },
        onError: (err: Error) => openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
      }
    );
  }, [rows, providerType, providerId, setMutation, openSuccessSnackbar, openErrorSnackbar, onClose, t]);

  const loading = platformsLoading || linksLoading;
  const noPlatforms = !platformsLoading && platforms.length === 0;

  return (
    <Dialog open={open} onClose={() => !setMutation.isPending && onClose()} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar variant="rounded" sx={{ bgcolor: "primary.main", width: 40, height: 40 }}><ShareIcon /></Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{t("socialMedia@linksTitle")}</Typography>
            <Typography variant="caption" color="text.secondary">
              {providerName ? `${providerName} · ` : ""}{t(`socialMedia@providerType.${providerType}`)} #{providerId}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {noPlatforms ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>{t("socialMedia@noPlatformsWarning")}</Alert>
        ) : loading ? (
          <Stack spacing={1.5} sx={{ py: 1 }}>
            {[0, 1].map((i) => <Skeleton key={i} variant="rounded" height={56} />)}
          </Stack>
        ) : (
          <Stack spacing={1.5} sx={{ py: 1 }}>
            {rows.length === 0 && (
              <Box sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
                <LinkIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                <Typography variant="body2">{t("socialMedia@noLinks")}</Typography>
              </Box>
            )}

            {rows.map((row, index) => {
              const meta = typeof row.socialMediaPlatformId === "number" ? platformById.get(row.socialMediaPlatformId) : undefined;
              return (
                <Stack key={row.key} direction="row" spacing={1} alignItems="flex-start">
                  <Stack sx={{ pt: 0.5 }}>
                    <Tooltip title={t("socialMedia@moveUp")}>
                      <span>
                        <IconButton size="small" disabled={index === 0} onClick={() => moveRow(index, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={t("socialMedia@moveDown")}>
                      <span>
                        <IconButton size="small" disabled={index === rows.length - 1} onClick={() => moveRow(index, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                  <TextField
                    select size="small" label={t("socialMedia@platform")}
                    value={row.socialMediaPlatformId}
                    onChange={(e) => updateRow(row.key, { socialMediaPlatformId: Number(e.target.value) })}
                    sx={{ minWidth: 150 }}
                    InputProps={{
                      startAdornment: meta?.iconUrl ? (
                        <InputAdornment position="start"><Avatar src={meta.iconUrl} sx={{ width: 20, height: 20 }} /></InputAdornment>
                      ) : undefined,
                    }}
                  >
                    {platforms.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar src={p.iconUrl ?? undefined} sx={{ width: 20, height: 20, bgcolor: "grey.100" }}>
                            {!p.iconUrl && <LinkIcon sx={{ fontSize: 12 }} />}
                          </Avatar>
                          <span>{p.name}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small" fullWidth label={t("socialMedia@url")} placeholder="https://…"
                    value={row.url}
                    onChange={(e) => updateRow(row.key, { url: e.target.value })}
                  />
                  <Tooltip title={t("socialMedia@removeLink")}>
                    <IconButton size="small" color="error" sx={{ mt: 0.5 }} onClick={() => removeRow(row.key)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </Stack>
              );
            })}

            <Button startIcon={<AddIcon />} onClick={addRow} variant="outlined" sx={{ alignSelf: "flex-start", borderRadius: 2, textTransform: "none" }}>
              {t("socialMedia@addLink")}
            </Button>
          </Stack>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={setMutation.isPending} color="inherit">{t("cancel")}</Button>
        <Button
          onClick={handleSave} variant="contained" disabled={setMutation.isPending || loading || noPlatforms}
          startIcon={setMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
        >
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
