import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton,
  Menu, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import PowerOffIcon from "@mui/icons-material/PowerOff";
import PowerIcon from "@mui/icons-material/Power";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import HistoryIcon from "@mui/icons-material/History";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import SyncIcon from "@mui/icons-material/Sync";
import { useSnackbarStore } from "../../../stores";
import {
  useChangeAvailability, useOcppCommands, useResetChargePoint, useSyncLocalList, useTriggerMessage, useUnlockConnector,
} from "../hooks/use-ocpp";
import type { OcppChargePointDetailDto, OcppCommandDto, OcppCommandResultDto, OcppTriggerMessage } from "../types/api";
import { errMessage, useDateFmt } from "./ocpp-ui";

/** The transport outcome + the unit's verdict in one chip. */
export function CommandOutcomeChip({ status, resultStatus, accepted }: { status: string; resultStatus?: string | null; accepted?: boolean }) {
  const { t } = useTranslation();
  const label = status === "Answered" ? (resultStatus ?? t("ocpp@commands.answered")) : t(`ocpp@commands.status.${status}`, { defaultValue: status });
  const color = status !== "Answered" ? "error" : accepted ?? (resultStatus == null || ["Accepted", "Scheduled", "Unlocked"].includes(resultStatus)) ? "success" : "warning";
  return <Chip size="small" label={label} color={color} variant={color === "success" ? "filled" : "outlined"} sx={{ fontWeight: 700 }} />;
}

function Confirm({ open, title, body, danger, pending, onClose, onConfirm }: { open: boolean; title: string; body: string; danger?: boolean; pending?: boolean; onClose: () => void; onConfirm: () => void }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={() => !pending && onClose()} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent><Typography variant="body2">{body}</Typography></DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={pending} color="inherit">{t("cancel")}</Button>
        <Button onClick={onConfirm} disabled={pending} variant="contained" color={danger ? "error" : "primary"}
          startIcon={pending ? <CircularProgress size={16} color="inherit" /> : undefined}>{t("confirm")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>{children}</Typography>;
}

type PendingAction =
  | { kind: "reset"; type: "Soft" | "Hard" }
  | { kind: "unlock"; connectorId: number }
  | { kind: "availability"; connectorId: number; type: "Operative" | "Inoperative" };

/**
 * Phase 2 — remote control. Every button sends one OCPP command through the API to
 * Cable.Ocpp, which waits for the unit's reply (≤ 30 s). The result is shown as a toast
 * and lands in the command history below; connector state refreshes on the next poll.
 */
export default function ChargerControlPanel({ cp }: { cp: OcppChargePointDetailDto }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const trigger = useTriggerMessage();
  const reset = useResetChargePoint();
  const unlock = useUnlockConnector();
  const availability = useChangeAvailability();
  const syncList = useSyncLocalList();
  const [showHistory, setShowHistory] = useState(false);
  const { data: history = [], isFetching: historyLoading } = useOcppCommands(cp.id, 30, showHistory);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [triggerMenu, setTriggerMenu] = useState<HTMLElement | null>(null);
  const busy = trigger.isPending || reset.isPending || unlock.isPending || availability.isPending || syncList.isPending;
  const offline = !cp.isConnected;

  const report = (r: OcppCommandResultDto) => {
    const label = t(`ocpp@commands.action.${r.action}`, { defaultValue: r.action });
    if (r.status !== "Answered") {
      openErrorSnackbar({ message: `${label}: ${t(`ocpp@commands.status.${r.status}`, { defaultValue: r.status })}${r.errorDescription ? ` — ${r.errorDescription}` : ""}` });
    } else if (r.accepted) {
      openSuccessSnackbar({ message: `${label}: ${r.resultStatus ?? t("ocpp@commands.answered")} (${r.elapsedMs} ms)` });
    } else {
      openErrorSnackbar({ message: `${label}: ${r.resultStatus}` });
    }
  };

  const run = async (action: () => Promise<OcppCommandResultDto>) => {
    try {
      report(await action());
    } catch (err) {
      openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) });
    } finally {
      setPendingAction(null);
    }
  };

  const doTrigger = (requestedMessage: OcppTriggerMessage) => {
    setTriggerMenu(null);
    return run(() => trigger.mutateAsync({ id: cp.id, requestedMessage }));
  };

  const confirmPending = () => {
    if (!pendingAction) return;
    switch (pendingAction.kind) {
      case "reset": return run(() => reset.mutateAsync({ id: cp.id, type: pendingAction.type }));
      case "unlock": return run(() => unlock.mutateAsync({ id: cp.id, connectorId: pendingAction.connectorId }));
      case "availability": return run(() => availability.mutateAsync({ id: cp.id, connectorId: pendingAction.connectorId, type: pendingAction.type }));
    }
  };

  const confirmText = (a: PendingAction): { title: string; body: string; danger: boolean } => {
    switch (a.kind) {
      case "reset": return { title: t(`ocpp@commands.confirm.reset${a.type}Title`), body: t(`ocpp@commands.confirm.reset${a.type}Body`), danger: a.type === "Hard" };
      case "unlock": return { title: t("ocpp@commands.confirm.unlockTitle", { connector: a.connectorId }), body: t("ocpp@commands.confirm.unlockBody"), danger: false };
      case "availability": return a.type === "Inoperative"
        ? { title: a.connectorId === 0 ? t("ocpp@commands.confirm.unitOffTitle") : t("ocpp@commands.confirm.connectorOffTitle", { connector: a.connectorId }), body: t("ocpp@commands.confirm.offBody"), danger: true }
        : { title: a.connectorId === 0 ? t("ocpp@commands.confirm.unitOnTitle") : t("ocpp@commands.confirm.connectorOnTitle", { connector: a.connectorId }), body: t("ocpp@commands.confirm.onBody"), danger: false };
    }
  };

  const doSyncList = async () => {
    try {
      const r = await syncList.mutateAsync(cp.id);
      if (r.confirmed) openSuccessSnackbar({ message: t("ocpp@localList.synced", { count: r.cardsAtStation }) });
      else openErrorSnackbar({ message: t(`ocpp@localList.status.${r.status ?? "Failed"}`) });
    } catch (err) {
      openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) });
    }
  };

  const ll = cp.localList;
  const llColor = ll.status === "Synced" ? "success" : ll.status === "Pending" ? "warning" : ll.status == null ? "default" : "error";

  const plugs = cp.connectors.filter((c) => c.connectorId > 0);
  const unitUnavailable = cp.connectors.some((c) => c.connectorId === 0 && c.status === "Unavailable");

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap gap={1}>
        <SectionTitle>{t("ocpp@commands.title")}</SectionTitle>
        {offline && <Chip size="small" color="warning" variant="outlined" label={t("ocpp@commands.offlineHint")} />}
      </Stack>

      {/* Unit-level */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
        <Button size="small" variant="contained" startIcon={trigger.isPending ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
          endIcon={<ArrowDropDownIcon />} disabled={busy || offline} onClick={(e) => setTriggerMenu(e.currentTarget)}>
          {t("ocpp@commands.refresh")}
        </Button>
        <Menu anchorEl={triggerMenu} open={!!triggerMenu} onClose={() => setTriggerMenu(null)}>
          {(["StatusNotification", "Heartbeat", "MeterValues", "BootNotification"] as OcppTriggerMessage[]).map((m) => (
            <MenuItem key={m} onClick={() => doTrigger(m)}>{t(`ocpp@commands.trigger.${m}`)}</MenuItem>
          ))}
        </Menu>
        <Button size="small" variant="outlined" startIcon={<RestartAltIcon />} disabled={busy || offline} onClick={() => setPendingAction({ kind: "reset", type: "Soft" })}>
          {t("ocpp@commands.softReset")}
        </Button>
        <Button size="small" variant="outlined" color="error" startIcon={<RestartAltIcon />} disabled={busy || offline} onClick={() => setPendingAction({ kind: "reset", type: "Hard" })}>
          {t("ocpp@commands.hardReset")}
        </Button>
        {unitUnavailable
          ? <Button size="small" variant="contained" color="success" startIcon={<PowerIcon />} disabled={busy || offline} onClick={() => setPendingAction({ kind: "availability", connectorId: 0, type: "Operative" })}>{t("ocpp@commands.unitOn")}</Button>
          : <Button size="small" variant="outlined" color="warning" startIcon={<PowerOffIcon />} disabled={busy || offline} onClick={() => setPendingAction({ kind: "availability", connectorId: 0, type: "Inoperative" })}>{t("ocpp@commands.unitOff")}</Button>}
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<HistoryIcon />} onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? t("ocpp@commands.hideHistory") : t("ocpp@commands.showHistory")}
        </Button>
      </Stack>

      {/* Per plug */}
      {plugs.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {plugs.map((c) => {
            const off = c.status === "Unavailable";
            return (
              <Stack key={c.id} direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="body2" fontWeight={700} sx={{ minWidth: 90 }}>{t("ocpp@columns.connector")} {c.connectorId}</Typography>
                <Tooltip title={t("ocpp@commands.unlockHint")}>
                  <span><Button size="small" variant="outlined" startIcon={<LockOpenIcon />} disabled={busy || offline} onClick={() => setPendingAction({ kind: "unlock", connectorId: c.connectorId })}>{t("ocpp@commands.unlock")}</Button></span>
                </Tooltip>
                {off
                  ? <Button size="small" variant="contained" color="success" startIcon={<PowerIcon />} disabled={busy || offline} onClick={() => setPendingAction({ kind: "availability", connectorId: c.connectorId, type: "Operative" })}>{t("ocpp@commands.connectorOn")}</Button>
                  : <Button size="small" variant="outlined" color="warning" startIcon={<PowerOffIcon />} disabled={busy || offline} onClick={() => setPendingAction({ kind: "availability", connectorId: c.connectorId, type: "Inoperative" })}>{t("ocpp@commands.connectorOff")}</Button>}
              </Stack>
            );
          })}
        </Stack>
      )}

      {/* Cards on the unit (SendLocalList) */}
      <Divider sx={{ my: 2 }} />
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <CreditCardIcon fontSize="small" color="action" />
        <Typography variant="body2" fontWeight={700}>{t("ocpp@localList.title")}</Typography>
        <Chip size="small" color={llColor} variant={ll.status === "Synced" ? "filled" : "outlined"} sx={{ fontWeight: 700 }}
          label={ll.status ? t(`ocpp@localList.status.${ll.status}`) : t("ocpp@localList.never")} />
        {ll.status === "Synced" && (
          <Typography variant="caption" color="text.secondary">
            v{ll.version} · {fmt.relative(ll.syncedAt)} · {t("ocpp@localList.cards", { count: ll.cardsAtStation })}
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <Tooltip title={t("ocpp@localList.hint")}>
          <span>
            <Button size="small" variant="outlined" startIcon={syncList.isPending ? <CircularProgress size={14} color="inherit" /> : <SyncIcon />}
              disabled={busy || offline || ll.status === "NotSupported"} onClick={doSyncList}>
              {t("ocpp@localList.syncNow")}
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {/* History */}
      {showHistory && (
        <>
          <Divider sx={{ my: 2 }} />
          {historyLoading && history.length === 0 ? (
            <Box display="flex" justifyContent="center" py={2}><CircularProgress size={20} /></Box>
          ) : history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">{t("ocpp@commands.noHistory")}</Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("ocpp@columns.when")}</TableCell>
                    <TableCell>{t("ocpp@commands.command")}</TableCell>
                    <TableCell>{t("ocpp@commands.result")}</TableCell>
                    <TableCell>{t("ocpp@commands.by")}</TableCell>
                    <TableCell align="right">{t("ocpp@commands.took")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((h: OcppCommandDto) => (
                    <TableRow key={h.id} hover>
                      <TableCell><Typography variant="caption">{fmt.full(h.createdAt)}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{t(`ocpp@commands.action.${h.action}`, { defaultValue: h.action })}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{h.requestPayload}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25} alignItems="flex-start">
                          <CommandOutcomeChip status={h.status} resultStatus={h.resultStatus} />
                          {h.errorDescription && <Typography variant="caption" color="error.main">{h.errorCode ? `${h.errorCode}: ` : ""}{h.errorDescription}</Typography>}
                        </Stack>
                      </TableCell>
                      <TableCell>{h.requestedByName ?? (h.requestedById ? `#${h.requestedById}` : "—")}</TableCell>
                      <TableCell align="right">{h.durationMs != null ? `${h.durationMs} ms` : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </>
      )}

      {pendingAction && (
        <Confirm open {...confirmText(pendingAction)} pending={busy} onClose={() => setPendingAction(null)} onConfirm={confirmPending} />
      )}
    </Paper>
  );
}

/** Small reusable icon button for places that need a one-off command (e.g. the table). */
export function IconCommandButton({ title, icon, onClick, disabled }: { title: string; icon: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <Tooltip title={title}><span><IconButton size="small" onClick={onClick} disabled={disabled}>{icon}</IconButton></span></Tooltip>;
}
