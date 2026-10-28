import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  MenuItem,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import { useSnackbarStore } from "../../../stores";
import { formatFullDateTime } from "../../../utils/date-format";
import { apiErrorMessage } from "../../../utils/api-error";
import { useRevokeUserPromo, useUserPromos } from "../hooks/use-promos";
import { USER_PROMO_STATUSES, type AdminUserPromoDto, type UserPromoStatus } from "../types/api";

const STATUS_COLOR: Record<UserPromoStatus, "success" | "info" | "default" | "error"> = {
  Available: "success",
  Used: "info",
  Expired: "default",
  Revoked: "error",
};

const PAGE_SIZE = 10;

/** User profile → "codes": the user's promos with a revoke action for available ones. */
export default function UserPromosPanel({ userId }: { userId: number }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [status, setStatus] = useState<UserPromoStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminUserPromoDto | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading, error } = useUserPromos(userId, status === "all" ? null : status, page, PAGE_SIZE);
  const revoke = useRevokeUserPromo();
  const rows = data?.items ?? [];
  const pages = Math.max(1, Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE));

  const handleRevoke = () => {
    if (!target) return;
    revoke.mutate(
      { id: target.id, reason: reason.trim() || null },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("promos@userPromos.revoked") });
          setTarget(null);
        },
        onError: (err) => openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) }),
      }
    );
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Typography variant="subtitle1" fontWeight={800} sx={{ flex: 1 }}>{t("promos@userPromos.title")}</Typography>
        <TextField select size="small" label={t("promos@userPromos.status")} value={status} sx={{ minWidth: 150 }}
          onChange={(e) => {
            setStatus(e.target.value as UserPromoStatus | "all");
            setPage(1);
          }}>
          <MenuItem value="all">{t("all")}</MenuItem>
          {USER_PROMO_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{t(`promos@userStatus.${s}`)}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>
      ) : error ? (
        <Alert severity="error">{t("loadingFailed")}</Alert>
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>{t("promos@userPromos.empty")}</Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("promos@userPromos.campaign")}</TableCell>
                <TableCell>{t("promos@userPromos.code")}</TableCell>
                <TableCell>{t("promos@userPromos.status")}</TableCell>
                <TableCell>{t("promos@userPromos.claimedAt")}</TableCell>
                <TableCell>{t("promos@userPromos.expiresAt")}</TableCell>
                <TableCell align="right">{t("actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link component="button" type="button" variant="body2" fontWeight={700} onClick={() => navigate(`/promos/${p.campaignId}`)}>
                      {p.campaignTitle}
                    </Link>
                    <Typography variant="caption" color="text.secondary" display="block">{t(`promos@source.${p.source}`)}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontWeight: 700 }}>{p.code ?? "—"}</TableCell>
                  <TableCell>
                    <Chip size="small" color={STATUS_COLOR[p.status]} label={t(`promos@userStatus.${p.status}`)} />
                    {p.status === "Used" && p.usedAt && (
                      <Typography variant="caption" color="text.secondary" display="block">{formatFullDateTime(p.usedAt, lang)}</Typography>
                    )}
                    {p.status === "Revoked" && (
                      <Typography variant="caption" color="text.secondary" display="block">{p.revokeReason || formatFullDateTime(p.revokedAt, lang)}</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{formatFullDateTime(p.claimedAt, lang)}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{p.expiresAt ? formatFullDateTime(p.expiresAt, lang) : "—"}</TableCell>
                  <TableCell align="right">
                    {p.status === "Available" ? (
                      <Button size="small" color="error" variant="outlined" startIcon={<BlockIcon />}
                        onClick={() => {
                          setReason("");
                          setTarget(p);
                        }}>
                        {t("promos@userPromos.revoke")}
                      </Button>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {pages > 1 && (
        <Stack alignItems="center">
          <Pagination count={pages} page={page} onChange={(_, p) => setPage(p)} size="small" />
        </Stack>
      )}

      <Dialog open={!!target} onClose={() => !revoke.isPending && setTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t("promos@userPromos.revokeTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t("promos@userPromos.revokeHint", { title: target?.campaignTitle ?? "" })}
          </Typography>
          <TextField autoFocus fullWidth multiline minRows={2} label={t("promos@userPromos.reason")} value={reason}
            onChange={(e) => setReason(e.target.value)} inputProps={{ maxLength: 500 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTarget(null)} disabled={revoke.isPending} color="inherit">{t("cancel")}</Button>
          <Button variant="contained" color="error" onClick={handleRevoke} disabled={revoke.isPending}
            startIcon={revoke.isPending ? <CircularProgress size={18} color="inherit" /> : <BlockIcon />}>
            {t("promos@userPromos.revoke")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
