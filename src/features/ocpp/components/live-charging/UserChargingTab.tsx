import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useUserSessions } from "../../hooks/use-live-charging";
import { fmtJod } from "../../utils/live-charging";
import { fmtNum } from "../../utils/payments-format";
import SessionsTable from "./SessionsTable";
import { Figure, Ltr } from "./live-ui";

const PAGE_SIZE = 10;

/** The user profile's "Charging" tab: their sessions with totals (RFID cards belong to stations, not drivers). */
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
    </Stack>
  );
}
