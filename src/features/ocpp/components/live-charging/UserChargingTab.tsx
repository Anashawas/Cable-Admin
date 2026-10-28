import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Skeleton, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useSnackbarStore } from "../../../../stores";
import { useUnlinkUserCard, useUserCards, useUserSessions } from "../../hooks/use-live-charging";
import type { OcppCardDto } from "../../types/live-charging";
import { fmtJod } from "../../utils/live-charging";
import { fmtNum } from "../../utils/payments-format";
import { useDateFmt } from "../ocpp-ui";
import SessionsTable from "./SessionsTable";
import { Figure, Ltr, useProblemToast } from "./live-ui";

const PAGE_SIZE = 10;

/** The user profile's "Charging" tab: their sessions with totals, and the RFID cards linked to the account. */
export default function UserChargingTab({ userId }: { userId: number }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"" | "open" | "closed">("");
  const [page, setPage] = useState(0);
  const sessions = useUserSessions(userId, status, page + 1, PAGE_SIZE);
  const totals = sessions.data?.totals;

  return (
    <Stack spacing={2.5}>
      {/* Sessions */}
      <Box component="section" aria-labelledby="user-charging-sessions">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
          <Typography id="user-charging-sessions" variant="subtitle1" fontWeight={800} component="h2">{t("liveCharging@user.sessions")}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup size="small" exclusive value={status} onChange={(_e, v) => { if (v != null) { setStatus(v); setPage(0); } }} aria-label={t("liveCharging@filters.status")}>
              <ToggleButton value="" sx={{ textTransform: "none", fontWeight: 700 }}>{t("liveCharging@filters.all")}</ToggleButton>
              <ToggleButton value="open" sx={{ textTransform: "none", fontWeight: 700 }}>{t("liveCharging@state.open")}</ToggleButton>
              <ToggleButton value="closed" sx={{ textTransform: "none", fontWeight: 700 }}>{t("liveCharging@state.closed")}</ToggleButton>
            </ToggleButtonGroup>
            <Button
              size="small" component={RouterLink} to={`/charging-sessions?user=${userId}`} endIcon={<OpenInNewIcon fontSize="small" />}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              {t("liveCharging@user.allSessions")}
            </Button>
          </Stack>
        </Stack>
        <Box sx={{ display: "grid", gap: 1, mb: 1.5, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
          <Figure loading={sessions.isLoading} label={t("liveCharging@totals.sessions")} value={<Ltr>{totals?.sessions ?? 0}</Ltr>} />
          <Figure loading={sessions.isLoading} label={t("liveCharging@totals.energy")} value={<Ltr>{fmtNum(totals?.energyKwh ?? 0, 2)} kWh</Ltr>} />
          <Figure loading={sessions.isLoading} label={t("liveCharging@totals.cost")} color="primary.main" value={<Ltr>{fmtJod(totals?.costJod ?? 0)}</Ltr>} />
          <Figure loading={sessions.isLoading} label={t("liveCharging@totals.openNow")} value={<Ltr>{totals?.openNow ?? 0}</Ltr>} />
        </Box>
        {sessions.isError ? (
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => sessions.refetch()}>{t("liveCharging@retry")}</Button>}>
            {t("liveCharging@sessions.loadError")}
          </Alert>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
            <SessionsTable
              rows={sessions.data?.items ?? []} loading={sessions.isLoading} hideWho
              emptyText={t("liveCharging@user.noSessions")}
              paging={{ page, pageSize: PAGE_SIZE, total: sessions.data?.totalCount ?? 0, onPage: setPage }}
            />
          </Paper>
        )}
      </Box>

      <UserCards userId={userId} />
    </Stack>
  );
}

function UserCards({ userId }: { userId: number }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const cards = useUserCards(userId);
  const unlink = useUnlinkUserCard();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const toastError = useProblemToast();
  const [target, setTarget] = useState<OcppCardDto | null>(null);

  const doUnlink = async () => {
    if (!target) return;
    try {
      await unlink.mutateAsync({ userId, cardId: target.id });
      openSuccessSnackbar({ message: t(target.isAppTag ? "liveCharging@user.appTagOff" : "liveCharging@user.unlinked") });
      setTarget(null);
    } catch (err) {
      await toastError(err);
    }
  };

  const list = cards.data ?? [];
  return (
    <Box component="section" aria-labelledby="user-charging-cards">
      <Typography id="user-charging-cards" variant="subtitle1" fontWeight={800} component="h2">{t("liveCharging@user.cards")}</Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>{t("liveCharging@user.cardsHint")}</Typography>
      {cards.isLoading ? (
        <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
      ) : cards.isError ? (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => cards.refetch()}>{t("liveCharging@retry")}</Button>}>
          {t("liveCharging@user.cardsError")}
        </Alert>
      ) : list.length === 0 ? (
        <Typography variant="body2" color="text.secondary">{t("liveCharging@user.noCards")}</Typography>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 3, overflowX: "auto" }}>
          <Table size="small" aria-label={t("liveCharging@user.cards")}>
            <TableHead>
              <TableRow>
                <TableCell>{t("liveCharging@user.idTag")}</TableCell>
                <TableCell>{t("liveCharging@user.label")}</TableCell>
                <TableCell>{t("liveCharging@user.linkedAt")}</TableCell>
                <TableCell>{t("liveCharging@user.state")}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, whiteSpace: "nowrap" }}>
                    <Ltr>{c.idTag}</Ltr>
                    {c.isAppTag && <Chip size="small" variant="outlined" color="primary" label={t("liveCharging@user.appTag")} sx={{ height: 20, fontSize: 11, marginInlineStart: 1, fontFamily: "inherit" }} />}
                  </TableCell>
                  <TableCell>{c.label ? <bdi>{c.label}</bdi> : "—"}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}><Typography variant="caption">{fmt.full(c.linkedAt)}</Typography></TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" color={c.isEnabled ? "success" : "default"} label={t(c.isEnabled ? "liveCharging@user.enabled" : "liveCharging@user.disabled")} sx={{ height: 20, fontSize: 11 }} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" color="error" startIcon={<LinkOffIcon fontSize="small" />} onClick={() => setTarget(c)} sx={{ textTransform: "none", fontWeight: 600 }}>
                      {c.isAppTag ? t("liveCharging@user.switchOffApp") : t("liveCharging@user.unlink")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={!!target} onClose={() => !unlink.isPending && setTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t(target?.isAppTag ? "liveCharging@user.confirmAppTitle" : "liveCharging@user.confirmUnlinkTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            <bdi>{t(target?.isAppTag ? "liveCharging@user.confirmAppBody" : "liveCharging@user.confirmUnlinkBody", { card: target?.label || target?.idTag || "" })}</bdi>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setTarget(null)} disabled={unlink.isPending} color="inherit">{t("cancel")}</Button>
          <Button variant="contained" color="error" onClick={doUnlink} disabled={unlink.isPending}
            startIcon={unlink.isPending ? <CircularProgress size={16} color="inherit" /> : <LinkOffIcon />}>{t("confirm")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
