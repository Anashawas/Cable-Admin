import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  Box,
  Stack,
  Typography,
  Avatar,
  IconButton,
  Chip,
  Skeleton,
  Alert,
  TextField,
  InputAdornment,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RedeemIcon from "@mui/icons-material/Redeem";
import SearchIcon from "@mui/icons-material/Search";
import { useProviderRedemptions } from "../hooks/use-loyalty";
import { RedemptionStatus } from "../types/api";

interface ProviderRedemptionsDialogProps {
  open: boolean;
  providerType: "ChargingPoint" | "ServiceProvider";
  providerId: number | null;
  providerName?: string;
  onClose: () => void;
}

const STATUS_CFG: Record<number, { key: string; color: "warning" | "success" | "error" }> = {
  [RedemptionStatus.Pending]: { key: "loyalty@pending", color: "warning" },
  [RedemptionStatus.Fulfilled]: { key: "loyalty@fulfilled", color: "success" },
  [RedemptionStatus.Cancelled]: { key: "loyalty@cancelled", color: "error" },
};

export default function ProviderRedemptionsDialog({
  open,
  providerType,
  providerId,
  providerName,
  onClose,
}: ProviderRedemptionsDialogProps) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useProviderRedemptions(providerType, providerId ?? undefined, open);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const list = data ?? [];
    const q = search.trim().toLowerCase();
    return q
      ? list.filter(
          (r) =>
            (r.userName ?? "").toLowerCase().includes(q) ||
            (r.rewardName ?? "").toLowerCase().includes(q) ||
            (r.redemptionCode ?? "").toLowerCase().includes(q)
        )
      : list;
  }, [data, search]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
      <Box sx={{ background: "linear-gradient(135deg, #4a148c 0%, #6a1b9a 100%)", color: "#fff", px: 3, py: 2.25, position: "relative" }}>
        <IconButton onClick={onClose} sx={{ position: "absolute", top: 8, right: 8, color: "rgba(255,255,255,0.85)" }}><CloseIcon /></IconButton>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar variant="rounded" sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 42, height: 42 }}><RedeemIcon /></Avatar>
          <Box sx={{ minWidth: 0, pr: 4 }}>
            <Typography variant="h6" fontWeight={800} noWrap>{t("loyalty@redemptions")}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>{providerName ?? "—"} · #{providerId}</Typography>
          </Box>
          {!isLoading && data && (
            <Chip label={data.length} size="small" sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 700, ml: "auto" }} />
          )}
        </Stack>
      </Box>

      <DialogContent sx={{ p: 2.5 }}>
        {isLoading ? (
          <Stack spacing={1}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={64} />)}</Stack>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>{t("loadingFailed")}</Alert>
        ) : (data ?? []).length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
            <RedeemIcon sx={{ fontSize: 44, color: "text.disabled", mb: 1 }} />
            <Typography variant="body2">{t("loyalty@noRedemptions")}</Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            <TextField
              size="small" fullWidth placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment> }}
            />
            <Stack spacing={1} divider={<Divider flexItem />}>
              {rows.map((r) => {
                const cfg = STATUS_CFG[r.status];
                return (
                  <Stack key={r.id} direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 36, height: 36, bgcolor: "secondary.main", fontSize: 14, fontWeight: 700 }}>
                      {(r.userName ?? "?").charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="body2" fontWeight={700} noWrap>{r.rewardName}</Typography>
                        <Chip label={t(cfg?.key ?? "loyalty@pending")} size="small" color={cfg?.color ?? "default"} variant="outlined" sx={{ height: 18, fontSize: 10, fontWeight: 600 }} />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {r.userName} · {r.redemptionCode} · {new Date(r.redeemedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={800} color="secondary.main" sx={{ flexShrink: 0 }}>
                      {r.pointsSpent.toLocaleString()} {t("loyalty@pts")}
                    </Typography>
                  </Stack>
                );
              })}
              {rows.length === 0 && (
                <Typography variant="body2" color="text.disabled" sx={{ textAlign: "center", py: 2 }}>{t("noResults")}</Typography>
              )}
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
