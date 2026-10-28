import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Skeleton, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { useSnackbarStore } from "../../../../stores";
import { useConnectorCodes, useRenewConnectorCode } from "../../hooks/use-live-charging";
import { downloadStickers } from "../../services/live-charging-service";
import type { ConnectorCodeDto } from "../../types/live-charging";
import { saveBlob } from "../../utils/live-charging";
import { useDateFmt } from "../ocpp-ui";
import { Ltr, useProblemToast } from "./live-ui";

/**
 * Plug stickers (§10.5): the active CHG- code of every plug, "revoke and renew" for one code
 * (the old sticker then answers "replaced"), and the A4 sticker PDF for the station or one charger.
 */
export default function StationStickersPanel({ chargingPointId }: { chargingPointId: number }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const q = useConnectorCodes(chargingPointId);
  const renew = useRenewConnectorCode();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const toastError = useProblemToast();
  const [renewing, setRenewing] = useState<ConnectorCodeDto | null>(null);
  const [downloading, setDownloading] = useState<number | "all" | null>(null);

  const codes = q.data ?? [];
  const byCharger = new Map<number, ConnectorCodeDto[]>();
  codes.forEach((c) => byCharger.set(c.chargerId, [...(byCharger.get(c.chargerId) ?? []), c]));

  const pdf = async (chargerId: number | null) => {
    setDownloading(chargerId ?? "all");
    try {
      const f = await downloadStickers(chargingPointId, chargerId);
      saveBlob(f.blob, f.fileName);
    } catch (err) {
      await toastError(err);
    } finally {
      setDownloading(null);
    }
  };

  const doRenew = async () => {
    if (!renewing) return;
    try {
      const r = await renew.mutateAsync({ chargingPointId, codeId: renewing.codeId });
      openSuccessSnackbar({ message: t("liveCharging@stickers.renewed", { code: r.code }) });
      setRenewing(null);
    } catch (err) {
      await toastError(err);
    }
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); openSuccessSnackbar({ message: t("liveCharging@stickers.copied") }); }
    catch { /* clipboard blocked: the link stays visible in the tooltip */ }
  };

  if (q.isLoading) return <Skeleton variant="rounded" height={140} sx={{ borderRadius: 2 }} />;
  if (q.isError)
    return (
      <Alert severity="warning" action={<Button color="inherit" size="small" onClick={() => q.refetch()}>{t("liveCharging@retry")}</Button>}>
        {t("liveCharging@stickers.loadError")}
      </Alert>
    );

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }}>
        <Typography variant="caption" color="text.secondary">{t("liveCharging@stickers.hint")}</Typography>
        <Button
          size="small" variant="outlined" onClick={() => pdf(null)} disabled={codes.length === 0 || downloading != null}
          startIcon={downloading === "all" ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfOutlinedIcon />}
          sx={{ textTransform: "none", fontWeight: 600, flexShrink: 0 }}
        >
          {t("liveCharging@stickers.printStation")}
        </Button>
      </Stack>

      {codes.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>{t("liveCharging@stickers.none")}</Typography>
      ) : (
        <Stack spacing={2} sx={{ mt: 1.5 }}>
          {Array.from(byCharger.entries()).map(([chargerId, rows]) => (
            <Box key={chargerId}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="subtitle2" fontWeight={800}>
                  <bdi>{rows[0].chargerName}</bdi>{" "}
                  <Typography component="span" variant="caption" color="text.secondary"><bdi dir="ltr" style={{ fontFamily: "monospace" }}>{rows[0].chargePointId}</bdi></Typography>
                </Typography>
                <Button
                  size="small" onClick={() => pdf(chargerId)} disabled={downloading != null}
                  startIcon={downloading === chargerId ? <CircularProgress size={14} color="inherit" /> : <PictureAsPdfOutlinedIcon fontSize="small" />}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  {t("liveCharging@stickers.printCharger")}
                </Button>
              </Stack>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small" aria-label={t("liveCharging@stickers.tableLabel", { charger: rows[0].chargerName })}>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("liveCharging@stickers.plug")}</TableCell>
                      <TableCell>{t("liveCharging@stickers.code")}</TableCell>
                      <TableCell>{t("liveCharging@stickers.plugType")}</TableCell>
                      <TableCell>{t("liveCharging@stickers.issued")}</TableCell>
                      <TableCell>{t("liveCharging@stickers.revoked")}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((c) => (
                      <TableRow key={c.codeId} hover>
                        <TableCell sx={{ fontWeight: 700 }}><Ltr>{c.connectorId}</Ltr></TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title={c.link}>
                            <Typography component="span" variant="body2" fontWeight={800} sx={{ fontFamily: "monospace" }}><Ltr>{c.code}</Ltr></Typography>
                          </Tooltip>
                          <IconButton size="small" onClick={() => copy(c.link)} aria-label={t("liveCharging@stickers.copyLink", { code: c.code })}>
                            <ContentCopyIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <bdi>{[c.plugTypeName, c.powerKw != null ? `${c.powerKw} kW` : null].filter(Boolean).join(" · ") || "—"}</bdi>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}><Typography variant="caption">{fmt.full(c.issuedAt)}</Typography></TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {c.revokedCodes > 0
                            ? <Tooltip title={c.lastRevokedAt ? fmt.full(c.lastRevokedAt) : ""}><Typography variant="caption"><Ltr>{c.revokedCodes}</Ltr></Typography></Tooltip>
                            : <Typography variant="caption" color="text.disabled">—</Typography>}
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" color="warning" startIcon={<AutorenewIcon fontSize="small" />} onClick={() => setRenewing(c)} sx={{ textTransform: "none", fontWeight: 600 }}>
                            {t("liveCharging@stickers.renew")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      <Dialog open={!!renewing} onClose={() => !renew.isPending && setRenewing(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("liveCharging@stickers.renewTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            <bdi>{t("liveCharging@stickers.renewBody", { code: renewing?.code ?? "", charger: renewing?.chargerName ?? "", plug: renewing?.connectorId ?? "" })}</bdi>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setRenewing(null)} disabled={renew.isPending} color="inherit">{t("cancel")}</Button>
          <Button variant="contained" color="warning" onClick={doRenew} disabled={renew.isPending}
            startIcon={renew.isPending ? <CircularProgress size={16} color="inherit" /> : <AutorenewIcon />}>
            {t("liveCharging@stickers.renew")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
