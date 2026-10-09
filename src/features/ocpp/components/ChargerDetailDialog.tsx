import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid,
  IconButton, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import KeyIcon from "@mui/icons-material/Key";
import KeyOffIcon from "@mui/icons-material/KeyOff";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import TerminalIcon from "@mui/icons-material/Terminal";
import EvStationIcon from "@mui/icons-material/EvStation";
import { useSnackbarStore } from "../../../stores";
import {
  useDeleteChargePoint, useOcppChargePoint, useOcppRawMessages, useRotateChargePointPassword,
  useSetChargePointEnabled, useUpdateChargePoint, useUpdateConnector,
} from "../hooks/use-ocpp";
import type { ChargerCredentials, OcppConnectorDto } from "../types/api";
import { CredentialsDialog } from "./RegisterChargerDialog";
import ChargerControlPanel from "./ChargerControlPanel";
import ChargerConfigPanel from "./ChargerConfigPanel";
import { ConnectionChip, ConnectorStatusChip, OnboardingCard, ReliabilityChip, SubscriptionChip, errMessage, fmtDuration, fmtKwh, ocppBaseUrl, useDateFmt } from "./ocpp-ui";
import { useQuery } from "@tanstack/react-query";
import { getAllPlugTypes } from "../../charge-management/services/station-form-service";
import MenuItem from "@mui/material/MenuItem";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

function Info({ label, value, mono = false }: { label: string; value?: ReactNode; mono?: boolean }) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{label}</Typography>
      <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-all", fontFamily: mono ? "monospace" : undefined }}>{value}</Typography>
    </Grid>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>{children}</Typography>;
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

/** Per-connector plug type + rated power, editable inline. The plug type is what the driver app shows next to "free". */
function ConnectorRow({ c }: { c: OcppConnectorDto }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const update = useUpdateConnector();
  const [editing, setEditing] = useState(false);
  const [power, setPower] = useState(c.powerKw != null ? String(c.powerKw) : "");
  const [plugTypeId, setPlugTypeId] = useState<number | "">(c.plugTypeId ?? "");
  const { data: plugTypes = [] } = useQuery({ queryKey: ["plug-types"], queryFn: ({ signal }) => getAllPlugTypes(signal), enabled: editing, staleTime: 5 * 60_000 });

  const startEdit = () => { setPower(c.powerKw != null ? String(c.powerKw) : ""); setPlugTypeId(c.plugTypeId ?? ""); setEditing(true); };
  const cancelEdit = () => setEditing(false);

  const save = async () => {
    try {
      await update.mutateAsync({ id: c.id, body: { plugTypeId: plugTypeId === "" ? null : Number(plugTypeId), powerKw: power ? Number(power) : null } });
      openSuccessSnackbar({ message: t("ocpp@toast.connectorSaved") });
      setEditing(false);
    } catch (err) {
      openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) });
    }
  };

  return (
    <TableRow hover>
      <TableCell sx={{ fontWeight: 700 }}>{c.connectorId === 0 ? "⚡ 0" : c.connectorId}</TableCell>
      <TableCell><ConnectorStatusChip status={c.status} /></TableCell>
      <TableCell>
        {c.errorCode !== "NoError" ? (
          <Stack spacing={0.25}>
            <Chip size="small" color="error" variant="outlined" label={c.errorCode} sx={{ width: "fit-content" }} />
            {(c.info || c.vendorErrorCode) && <Typography variant="caption" color="text.secondary">{[c.vendorErrorCode, c.info].filter(Boolean).join(" · ")}</Typography>}
          </Stack>
        ) : <Typography variant="caption" color="text.disabled">—</Typography>}
      </TableCell>
      <TableCell>
        {editing
          ? <TextField select size="small" value={plugTypeId} onChange={(e) => setPlugTypeId(e.target.value === "" ? "" : Number(e.target.value))} sx={{ minWidth: 150 }}>
              <MenuItem value="">{t("ocpp@detail.noPlugType")}</MenuItem>
              {plugTypes.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}{p.plugTypeFamily ? ` (${p.plugTypeFamily})` : ""}</MenuItem>)}
            </TextField>
          : c.plugTypeName ?? <Typography variant="caption" color="warning.main">{t("ocpp@detail.setPlugType")}</Typography>}
      </TableCell>
      <TableCell>
        {editing
          ? <TextField size="small" type="number" value={power} onChange={(e) => setPower(e.target.value)} sx={{ width: 90 }} inputProps={{ step: 0.1, min: 0 }} />
          : c.powerKw != null ? `${c.powerKw} kW` : <Typography variant="caption" color="text.disabled">—</Typography>}
      </TableCell>
      <TableCell><Typography variant="caption">{fmt.relative(c.statusUpdatedAt ?? c.statusReceivedAt)}</Typography></TableCell>
      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
        {editing
          ? (<>
              <Tooltip title={t("ocpp@actions.saveConnector")}><span><IconButton size="small" color="primary" onClick={save} disabled={update.isPending}>{update.isPending ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}</IconButton></span></Tooltip>
              <IconButton size="small" onClick={cancelEdit} disabled={update.isPending}><CloseRoundedIcon fontSize="small" /></IconButton>
            </>)
          : <Tooltip title={t("ocpp@actions.edit")}><IconButton size="small" onClick={startEdit}><EditIcon fontSize="small" /></IconButton></Tooltip>}
      </TableCell>
    </TableRow>
  );
}

interface ChargerDetailDialogProps {
  id: number | null;
  onClose: () => void;
}

export default function ChargerDetailDialog({ id, onClose }: ChargerDetailDialogProps) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const { data: cp, isLoading } = useOcppChargePoint(id);
  const [showLog, setShowLog] = useState(false);
  const { data: log = [] } = useOcppRawMessages(id, 50, showLog);

  const rotate = useRotateChargePointPassword();
  const setEnabled = useSetChargePointEnabled();
  const remove = useDeleteChargePoint();
  const update = useUpdateChargePoint();

  const [confirm, setConfirm] = useState<"rotate" | "clear" | "disable" | "delete" | null>(null);
  const [credentials, setCredentials] = useState<ChargerCredentials | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [heartbeat, setHeartbeat] = useState("");

  const pending = rotate.isPending || setEnabled.isPending || remove.isPending || update.isPending;

  const run = async (action: () => Promise<unknown>, successKey: string) => {
    try {
      await action();
      openSuccessSnackbar({ message: t(successKey) });
      setConfirm(null);
    } catch (err) {
      openErrorSnackbar({ message: errMessage(err, t("ocpp@toast.error")) });
    }
  };

  const onConfirm = () => {
    if (!cp) return;
    switch (confirm) {
      case "rotate":
        return run(async () => setCredentials(await rotate.mutateAsync({ id: cp.id, requirePassword: true })), "ocpp@toast.passwordRotated");
      case "clear":
        return run(() => rotate.mutateAsync({ id: cp.id, requirePassword: false }), "ocpp@toast.passwordCleared");
      case "disable":
        return run(() => setEnabled.mutateAsync({ id: cp.id, isEnabled: false }), "ocpp@toast.disabled");
      case "delete":
        return run(async () => { await remove.mutateAsync(cp.id); onClose(); }, "ocpp@toast.deleted");
    }
  };

  const openEdit = () => {
    if (!cp) return;
    setDisplayName(cp.displayName ?? "");
    setHeartbeat(String(cp.heartbeatInterval));
    setEditOpen(true);
  };
  const saveEdit = () => cp && run(async () => {
    await update.mutateAsync({ id: cp.id, body: { displayName: displayName.trim() || null, heartbeatInterval: heartbeat ? Number(heartbeat) : null } });
    setEditOpen(false);
  }, "ocpp@edit.success");

  const confirmText: Record<NonNullable<typeof confirm>, { title: string; body: string; danger: boolean }> = {
    rotate: { title: t("ocpp@confirm.rotateTitle"), body: t("ocpp@confirm.rotateBody"), danger: false },
    clear: { title: t("ocpp@confirm.clearTitle"), body: t("ocpp@confirm.clearBody"), danger: false },
    disable: { title: t("ocpp@confirm.disableTitle"), body: t("ocpp@confirm.disableBody"), danger: true },
    delete: { title: t("ocpp@confirm.deleteTitle"), body: t("ocpp@confirm.deleteBody"), danger: true },
  };

  return (
    <>
      <Dialog open={id != null} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 7 }}>
          <EvStationIcon color="primary" />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" fontWeight={800} noWrap>{cp ? (cp.displayName || cp.chargePointId) : t("ocpp@detail.title")}</Typography>
            {cp && <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{cp.chargePointId} · {cp.stationName} (#{cp.chargingPointId})</Typography>}
          </Box>
          {cp && <ConnectionChip state={cp.connectionState} isEnabled={cp.isEnabled} lockedUntil={cp.lockedUntil} size="medium" />}
          <IconButton onClick={onClose} sx={{ position: "absolute", right: 12, top: 12 }}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "action.hover" }}>
          {isLoading || !cp ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : (
            <Stack spacing={2.5}>
              {/* Actions */}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={openEdit}>{t("ocpp@actions.edit")}</Button>
                <Button size="small" variant="outlined" startIcon={<KeyIcon />} onClick={() => setConfirm("rotate")}>{t("ocpp@actions.rotatePassword")}</Button>
                {cp.hasPassword && <Button size="small" variant="outlined" startIcon={<KeyOffIcon />} onClick={() => setConfirm("clear")}>{t("ocpp@actions.clearPassword")}</Button>}
                {cp.isEnabled
                  ? <Button size="small" variant="outlined" color="warning" startIcon={<PowerSettingsNewIcon />} onClick={() => setConfirm("disable")}>{t("ocpp@actions.disable")}</Button>
                  : <Button size="small" variant="contained" color="success" startIcon={<PowerSettingsNewIcon />} disabled={pending}
                      onClick={() => run(() => setEnabled.mutateAsync({ id: cp.id, isEnabled: true }), "ocpp@toast.enabled")}>{t("ocpp@actions.enable")}</Button>}
                <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirm("delete")}>{t("ocpp@actions.delete")}</Button>
              </Stack>

              {/* Commissioning: shown until the first BootNotification (and once more, green, right after it) */}
              {(!cp.lastBootAt || cp.onboarding.state !== "Booted") && (
                <OnboardingCard ob={cp.onboarding} vendor={cp.vendor} model={cp.model} firmware={cp.firmwareVersion} />
              )}

              {/* Today + subscription */}
              <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
                  <Stack direction="row" spacing={3}>
                    <Box><Typography variant="caption" color="text.secondary">{t("ocpp@detail.today")}</Typography><Typography variant="h6" fontWeight={800}>{fmtKwh(cp.today.energyKwh)}</Typography></Box>
                    <Box><Typography variant="caption" color="text.secondary">&nbsp;</Typography><Typography variant="h6" fontWeight={800}>{t("ocpp@detail.sessionsCount", { count: cp.today.sessions })}</Typography></Box>
                    <Box><Typography variant="caption" color="text.secondary">&nbsp;</Typography><Typography variant="h6" fontWeight={800} color={cp.today.faults > 0 ? "error.main" : undefined}>{t("ocpp@detail.faultsCount", { count: cp.today.faults })}</Typography></Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">{t("ocpp@reliability.title", { days: cp.reliability.windowDays })}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ReliabilityChip pct={cp.reliability.pct} size="medium" />
                        {cp.reliability.pct != null && (
                          <Tooltip title={`${t("ocpp@reliability.computedAt")} ${fmt.full(cp.reliability.computedAt)}`}>
                            <Typography variant="caption" color="text.secondary">
                              {t("ocpp@reliability.breakdown", { online: Number(cp.reliability.onlinePct ?? 0).toFixed(1), faultFree: Number(cp.reliability.faultFreePct ?? 0).toFixed(1), offline: cp.reliability.offlineIncidents ?? 0, faults: cp.reliability.faultIncidents ?? 0 })}
                            </Typography>
                          </Tooltip>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                  <Stack spacing={0.5} alignItems={{ sm: "flex-end" }}>
                    <Typography variant="caption" color="text.secondary">{t("ocpp@subscription.title")}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <SubscriptionChip sub={cp.subscription} />
                      {cp.subscription.expiresAt && <Typography variant="caption" color="text.secondary">{t("ocpp@subscription.expiresOn")} {fmt.full(cp.subscription.expiresAt)}</Typography>}
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>

              {/* Charger + connection info */}
              <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                <Stack spacing={2} divider={<Divider />}>
                  <Box>
                    <SectionTitle>{t("ocpp@detail.info")}</SectionTitle>
                    <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                      <Info label={t("ocpp@detail.vendor")} value={cp.vendor} />
                      <Info label={t("ocpp@detail.model")} value={cp.model} />
                      <Info label={t("ocpp@detail.firmware")} value={cp.firmwareVersion} mono />
                      <Info label={t("ocpp@detail.serial")} value={cp.serialNumber} mono />
                      <Info label={t("ocpp@detail.chargeBoxSerial")} value={cp.chargeBoxSerialNumber} mono />
                      <Info label={t("ocpp@detail.meterSerial")} value={cp.meterSerialNumber} mono />
                      <Info label={t("ocpp@detail.iccid")} value={cp.iccid} mono />
                      <Info label={t("ocpp@detail.imsi")} value={cp.imsi} mono />
                      <Info label={t("ocpp@detail.heartbeat")} value={cp.heartbeatInterval} />
                    </Grid>
                  </Box>
                  <Box>
                    <SectionTitle>{t("ocpp@detail.connection")}</SectionTitle>
                    <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                      <Info label={t("ocpp@detail.url")} value={cp.webSocketBaseUrl ? `${cp.webSocketBaseUrl}${cp.chargePointId}` : `${ocppBaseUrl()}${cp.urlPath}`} mono />
                      <Info label={t("ocpp@credentials.port")} value={cp.port ?? undefined} mono />
                      <Info label={t("ocpp@detail.lastBoot")} value={fmt.full(cp.lastBootAt)} />
                      <Info label={t("ocpp@detail.lastMessage")} value={cp.lastMessageAt ? `${fmt.relative(cp.lastMessageAt)} · ${fmt.full(cp.lastMessageAt)}` : "—"} />
                      <Info label={t("ocpp@detail.connectedSince")} value={cp.isConnected ? fmt.full(cp.connectedAt) : undefined} />
                      <Info label={t("ocpp@detail.disconnectedAt")} value={!cp.isConnected ? fmt.full(cp.disconnectedAt) : undefined} />
                      <Info label={t("ocpp@detail.remoteIp")} value={cp.lastRemoteIp} mono />
                      <Info label={t("ocpp@detail.password")} value={cp.hasPassword ? t("ocpp@detail.passwordSet") : t("ocpp@detail.passwordNone")} />
                      <Info label={t("ocpp@detail.failedAuth")} value={cp.failedAuthCount > 0 ? cp.failedAuthCount : undefined} />
                      <Info label={t("ocpp@detail.lockedUntil")} value={cp.lockedUntil && new Date(cp.lockedUntil) > new Date() ? fmt.full(cp.lockedUntil) : undefined} />
                    </Grid>
                  </Box>
                </Stack>
              </Paper>

              {/* Phase 2 — remote control + the unit's settings */}
              <ChargerControlPanel cp={cp} />
              <ChargerConfigPanel cp={cp} />

              {/* Connectors */}
              <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                <SectionTitle>{t("ocpp@detail.connectors")}</SectionTitle>
                {cp.connectors.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t("ocpp@detail.noConnectors")}</Typography>
                ) : (
                  <Box sx={{ overflowX: "auto", mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t("ocpp@columns.connector")}</TableCell>
                          <TableCell>{t("ocpp@columns.status")}</TableCell>
                          <TableCell>{t("ocpp@columns.error")}</TableCell>
                          <TableCell>{t("ocpp@columns.plugType")}</TableCell>
                          <TableCell>{t("ocpp@columns.power")}</TableCell>
                          <TableCell>{t("ocpp@columns.updated")}</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>{cp.connectors.map((c) => <ConnectorRow key={c.id} c={c} />)}</TableBody>
                    </Table>
                  </Box>
                )}
              </Paper>

              {/* Recent sessions */}
              <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                <SectionTitle>{t("ocpp@detail.recent")}</SectionTitle>
                {cp.recentTransactions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t("ocpp@detail.noSessions")}</Typography>
                ) : (
                  <Box sx={{ overflowX: "auto", mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t("ocpp@columns.session")}</TableCell>
                          <TableCell>{t("ocpp@columns.connector")}</TableCell>
                          <TableCell>{t("ocpp@columns.tag")}</TableCell>
                          <TableCell>{t("ocpp@columns.started")}</TableCell>
                          <TableCell>{t("ocpp@columns.duration")}</TableCell>
                          <TableCell>{t("ocpp@columns.energy")}</TableCell>
                          <TableCell>{t("ocpp@columns.price")}</TableCell>
                          <TableCell>{t("ocpp@columns.source")}</TableCell>
                          <TableCell>{t("ocpp@columns.reason")}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cp.recentTransactions.map((tx) => (
                          <TableRow key={tx.id} hover>
                            <TableCell>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography variant="body2" fontWeight={700}>#{tx.id}</Typography>
                                {tx.isOpen && <Chip size="small" color="primary" label={t("ocpp@detail.open")} sx={{ height: 18, fontSize: 10 }} />}
                                {tx.isStale && <Chip size="small" color="warning" label={t("ocpp@detail.stale")} sx={{ height: 18, fontSize: 10 }} />}
                                {tx.isOrphan && <Chip size="small" color="default" label={t("ocpp@detail.orphan")} sx={{ height: 18, fontSize: 10 }} />}
                                {tx.wasRejected && <Chip size="small" color="error" variant="outlined" label={t("ocpp@detail.rejected")} sx={{ height: 18, fontSize: 10 }} />}
                              </Stack>
                            </TableCell>
                            <TableCell>{tx.connectorId}</TableCell>
                            <TableCell sx={{ fontFamily: "monospace" }}>{tx.idTag || "—"}</TableCell>
                            <TableCell><Typography variant="caption">{fmt.full(tx.startedAt)}</Typography></TableCell>
                            <TableCell>{fmtDuration(tx.durationSec)}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{fmtKwh(tx.energyKwh)}</TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>{tx.costJod != null ? `${tx.costJod.toFixed(3)} JOD` : "—"}</TableCell>
                            <TableCell><Chip size="small" variant="outlined" label={t(`ocpp@source.${tx.startSource ?? "Card"}`, { defaultValue: tx.startSource ?? "Card" })} sx={{ height: 20, fontSize: 11 }} /></TableCell>
                            <TableCell><Tooltip title={tx.stopReason ?? ""}><span>{tx.stopReasonText ?? tx.stopReason ?? "—"}</span></Tooltip></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Paper>

              {/* Raw log */}
              <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <SectionTitle>{t("ocpp@detail.rawLog")}</SectionTitle>
                  <Button size="small" startIcon={<TerminalIcon />} onClick={() => setShowLog((v) => !v)}>{showLog ? t("ocpp@detail.hideRawLog") : t("ocpp@detail.showRawLog")}</Button>
                </Stack>
                {showLog && (
                  log.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t("ocpp@detail.noMessages")}</Typography>
                  ) : (
                    <Box sx={{ mt: 1, maxHeight: 360, overflow: "auto", bgcolor: "grey.900", color: "grey.100", borderRadius: 2, p: 1.5, fontFamily: "monospace", fontSize: 12 }}>
                      {log.map((m) => (
                        <Box key={m.id} sx={{ display: "flex", gap: 1.5, py: 0.25, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <Box sx={{ color: "grey.500", whiteSpace: "nowrap" }}>{new Date(m.createdAt).toLocaleTimeString()}</Box>
                          <Box sx={{ color: m.direction === "in" ? "#4fc3f7" : m.direction === "out" ? "#aed581" : "#ffb74d", width: 28, flexShrink: 0 }}>{m.direction === "in" ? "→" : m.direction === "out" ? "←" : "•"}</Box>
                          <Box sx={{ color: "#fff", width: 170, flexShrink: 0, fontWeight: 600 }}>{m.direction === "sys" ? t(`ocpp@sys.${m.action}`, { defaultValue: m.action }) : m.action}</Box>
                          <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-all", opacity: 0.85 }}>{m.payload}</Box>
                        </Box>
                      ))}
                    </Box>
                  )
                )}
              </Paper>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {confirm && (
        <Confirm open title={confirmText[confirm].title} body={confirmText[confirm].body} danger={confirmText[confirm].danger}
          pending={pending} onClose={() => setConfirm(null)} onConfirm={onConfirm} />
      )}

      <Dialog open={editOpen} onClose={() => !pending && setEditOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t("ocpp@edit.title")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField label={t("ocpp@register.displayName")} value={displayName} onChange={(e) => setDisplayName(e.target.value)} fullWidth inputProps={{ maxLength: 100 }} autoFocus />
            <TextField label={t("ocpp@register.heartbeat")} value={heartbeat} onChange={(e) => setHeartbeat(e.target.value)} type="number" fullWidth inputProps={{ min: 10, max: 3600 }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setEditOpen(false)} disabled={pending} color="inherit">{t("cancel")}</Button>
          <Button onClick={saveEdit} variant="contained" disabled={pending} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}>{t("save")}</Button>
        </DialogActions>
      </Dialog>

      <CredentialsDialog open={!!credentials} credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  );
}
