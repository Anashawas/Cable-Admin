import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { formatFullDateTime, formatShortDate } from "../../../utils/date-format";
import { usePlanHistory, usePlanSubscribers } from "../hooks/use-billing";
import PlanChangesList from "./PlanChangesList";
import PlanStatusChip from "./PlanStatusChip";
import { providerProfilePath } from "../utils/links";

/** "السجل": the plan's field-by-field change log and who is on it now. */
export default function PlanHistoryPanel({ planId }: { planId: number }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;
  const history = usePlanHistory(planId);
  const subscribers = usePlanSubscribers(planId);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={800} gutterBottom>{t("billing@history.changes")}</Typography>
          {history.isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>
          ) : history.error ? (
            <Alert severity="error">{t("loadingFailed")}</Alert>
          ) : (history.data ?? []).length === 0 ? (
            <Typography variant="body2" color="text.secondary">{t("billing@history.empty")}</Typography>
          ) : (
            <Stack spacing={1.5}>
              {(history.data ?? []).map((h) => (
                <Paper key={h.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                    <Typography variant="body2" fontWeight={700}>{h.changedByName ?? (h.changedByUserId ? `#${h.changedByUserId}` : "—")}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatFullDateTime(h.changedAt, lang)}</Typography>
                  </Stack>
                  <PlanChangesList changes={h.changes ?? []} />
                  {h.note && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      {t("billing@history.note")}: {h.note}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={800} gutterBottom>
            {t("billing@history.subscribers")}
            {subscribers.data && <Chip size="small" label={subscribers.data.length} sx={{ marginInlineStart: 1 }} />}
          </Typography>
          {subscribers.isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>
          ) : subscribers.error ? (
            <Alert severity="error">{t("loadingFailed")}</Alert>
          ) : (subscribers.data ?? []).length === 0 ? (
            <Typography variant="body2" color="text.secondary">{t("billing@history.noSubscribers")}</Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("billing@history.provider")}</TableCell>
                    <TableCell>{t("billing@history.status")}</TableCell>
                    <TableCell>{t("billing@history.expires")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(subscribers.data ?? []).map((s) => (
                    <TableRow key={`${s.providerType}-${s.providerId}-${s.planSubscriptionId ?? s.subscriptionId}`}>
                      <TableCell>
                        <Link component="button" type="button" variant="body2" fontWeight={700}
                          onClick={() => navigate(providerProfilePath(s.providerType, s.providerId))}>
                          {s.providerName ?? `#${s.providerId}`}
                        </Link>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {t(`billing@providerType.${s.providerType}`)}{s.isTrial ? ` · ${t("billing@records.trial")}` : ""}
                        </Typography>
                      </TableCell>
                      <TableCell><PlanStatusChip status={s.status} /></TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {s.expiresAt ? formatShortDate(s.expiresAt, lang) : "—"}
                        {s.scansRemaining != null && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {t("billing@records.scansLeft", { count: s.scansRemaining })}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}
