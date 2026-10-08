import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Skeleton, Stack, Switch,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { useSnackbarStore } from "../../../stores";
import { useAddAuthorizedTag, useOcppAuthorizedTags, useRemoveAuthorizedTag, useSetAuthorizedTagEnabled } from "../hooks/use-ocpp";
import type { OcppAuthorizedTagDto } from "../types/api";
import { errMessage, useDateFmt } from "./ocpp-ui";

/** The cards / passwords a station allows to charge through Cable. */
export default function AuthorizedTagsSection({ chargingPointId }: { chargingPointId: number }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data: tags = [], isLoading } = useOcppAuthorizedTags(chargingPointId);
  const add = useAddAuthorizedTag();
  const setEnabled = useSetAuthorizedTagEnabled();
  const remove = useRemoveAuthorizedTag();

  const [addOpen, setAddOpen] = useState(false);
  const [idTag, setIdTag] = useState("");
  const [label, setLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [removeTarget, setRemoveTarget] = useState<OcppAuthorizedTagDto | null>(null);

  const submitAdd = async () => {
    if (!idTag.trim()) return;
    try {
      // datetime-local is the admin's wall clock; send the absolute instant (ISO/UTC) like every other screen.
      const expiresAtUtc = expiresAt ? new Date(expiresAt).toISOString() : null;
      await add.mutateAsync({ chargingPointId, idTag: idTag.trim(), label: label.trim() || null, expiresAt: expiresAtUtc });
      openSuccessSnackbar({ message: t("ocpp@toast.tagAdded") });
      setAddOpen(false);
      setIdTag(""); setLabel(""); setExpiresAt("");
    } catch (err) {
      openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) });
    }
  };

  const toggle = async (tag: OcppAuthorizedTagDto, isEnabled: boolean) => {
    try {
      await setEnabled.mutateAsync({ id: tag.id, isEnabled });
      openSuccessSnackbar({ message: t("ocpp@toast.tagUpdated") });
    } catch (err) {
      openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) });
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    try {
      await remove.mutateAsync(removeTarget.id);
      openSuccessSnackbar({ message: t("ocpp@toast.tagRemoved") });
      setRemoveTarget(null);
    } catch (err) {
      openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) });
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={800}>{t("ocpp@tags.title")}</Typography>
          <Typography variant="caption" color="text.secondary">{t("ocpp@tags.subtitle")}</Typography>
        </Box>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>{t("ocpp@tags.add")}</Button>
      </Stack>

      {isLoading ? <Skeleton variant="rounded" height={80} /> : tags.length === 0 ? (
        <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, textAlign: "center" }}>
          <CreditCardIcon sx={{ color: "text.disabled", mb: 0.5 }} />
          <Typography variant="body2" color="text.secondary">{t("ocpp@tags.empty")}</Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "action.hover" } }}>
                  <TableCell>{t("ocpp@columns.tag")}</TableCell>
                  <TableCell>{t("ocpp@columns.label")}</TableCell>
                  <TableCell>{t("ocpp@columns.expires")}</TableCell>
                  <TableCell align="center">{t("ocpp@columns.enabled")}</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id} hover sx={{ opacity: tag.isEnabled ? 1 : 0.6 }}>
                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 700 }}>{tag.idTag}</TableCell>
                    <TableCell>{tag.label ?? <Typography variant="caption" color="text.disabled">—</Typography>}</TableCell>
                    <TableCell>
                      {tag.expiresAt
                        ? <Chip size="small" variant="outlined" color={new Date(tag.expiresAt) < new Date() ? "error" : "default"} label={fmt.full(tag.expiresAt)} />
                        : <Typography variant="caption" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell align="center"><Switch size="small" checked={tag.isEnabled} disabled={setEnabled.isPending && setEnabled.variables?.id === tag.id} onChange={(e) => toggle(tag, e.target.checked)} /></TableCell>
                    <TableCell align="right">
                      <Tooltip title={t("delete")}><IconButton size="small" color="error" onClick={() => setRemoveTarget(tag)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      <Dialog open={addOpen} onClose={() => !add.isPending && setAddOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("ocpp@tags.add")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField label={t("ocpp@tags.idTag")} value={idTag} onChange={(e) => setIdTag(e.target.value)} fullWidth autoFocus required
              helperText={t("ocpp@tags.idTagHint")} inputProps={{ maxLength: 20, style: { fontFamily: "monospace" } }}
              onKeyDown={(e) => { if (e.key === "Enter") submitAdd(); }} />
            <TextField label={t("ocpp@tags.label")} value={label} onChange={(e) => setLabel(e.target.value)} fullWidth inputProps={{ maxLength: 100 }} />
            <TextField label={t("ocpp@tags.expiresAt")} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setAddOpen(false)} disabled={add.isPending} color="inherit">{t("cancel")}</Button>
          <Button onClick={submitAdd} variant="contained" disabled={add.isPending || !idTag.trim()}
            startIcon={add.isPending ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}>{t("create")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!removeTarget} onClose={() => !remove.isPending && setRemoveTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("ocpp@confirm.removeTagTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{t("ocpp@confirm.removeTagBody")}</Typography>
          {removeTarget && <Typography variant="body2" fontWeight={700} sx={{ fontFamily: "monospace", mt: 1 }}>{removeTarget.idTag}{removeTarget.label ? ` · ${removeTarget.label}` : ""}</Typography>}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setRemoveTarget(null)} disabled={remove.isPending} color="inherit">{t("cancel")}</Button>
          <Button onClick={confirmRemove} variant="contained" color="error" disabled={remove.isPending}
            startIcon={remove.isPending ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}>{t("delete")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
