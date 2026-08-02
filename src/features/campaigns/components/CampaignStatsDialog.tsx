import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box,
} from "@mui/material";
import { getCampaignStats } from "../services/ads-service";
import type { CampaignDto } from "../types/api";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" fontWeight={700}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </CardContent>
    </Card>
  );
}

export default function CampaignStatsDialog({
  campaign,
  onClose,
}: {
  campaign: CampaignDto | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["campaign-stats", campaign?.id, from, to],
    queryFn: ({ signal }) => getCampaignStats(campaign!.id, from || undefined, to || undefined, signal),
    enabled: campaign != null,
  });

  const ctrPct = data ? `${(data.ctr * (data.ctr > 1 ? 1 : 100)).toFixed(1)}%` : "—";

  return (
    <Dialog open={campaign != null} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {t("campaigns@statsTitle")}{campaign?.name ? ` — ${campaign.name}` : ""}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction="row" spacing={1}>
            <TextField label={t("campaigns@from")} type="date" size="small" InputLabelProps={{ shrink: true }}
              value={from} onChange={(e) => setFrom(e.target.value)} />
            <TextField label={t("campaigns@to")} type="date" size="small" InputLabelProps={{ shrink: true }}
              value={to} onChange={(e) => setTo(e.target.value)} />
          </Stack>

          {error ? (
            <Typography color="error">{t("loadingFailed")}</Typography>
          ) : isLoading ? (
            <Box display="flex" justifyContent="center" py={3}><CircularProgress /></Box>
          ) : data ? (
            <>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6, md: 3 }}><StatTile label={t("campaigns@impressions")} value={data.impressions ?? 0} /></Grid>
                <Grid size={{ xs: 6, md: 3 }}><StatTile label={t("campaigns@clicks")} value={data.clicks ?? 0} /></Grid>
                <Grid size={{ xs: 6, md: 3 }}><StatTile label={t("campaigns@ctr")} value={ctrPct} /></Grid>
                <Grid size={{ xs: 6, md: 3 }}><StatTile label={t("campaigns@uniqueUsers")} value={data.uniqueUsers ?? 0} /></Grid>
                {data.dismisses != null && (
                  <Grid size={{ xs: 6, md: 3 }}><StatTile label={t("campaigns@dismisses")} value={data.dismisses} /></Grid>
                )}
              </Grid>

              {!!data.byCity?.length && (
                <>
                  <Typography variant="subtitle2">{t("campaigns@byCity")}</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("campaigns@city")}</TableCell>
                        <TableCell align="right">{t("campaigns@impressions")}</TableCell>
                        <TableCell align="right">{t("campaigns@clicks")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.byCity.map((r) => (
                        <TableRow key={r.city}>
                          <TableCell>{r.city}</TableCell>
                          <TableCell align="right">{r.impressions}</TableCell>
                          <TableCell align="right">{r.clicks}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}

              {!!data.byDay?.length && (
                <>
                  <Typography variant="subtitle2">{t("campaigns@byDay")}</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("campaigns@date")}</TableCell>
                        <TableCell align="right">{t("campaigns@impressions")}</TableCell>
                        <TableCell align="right">{t("campaigns@clicks")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.byDay.map((r) => (
                        <TableRow key={r.date}>
                          <TableCell>{r.date}</TableCell>
                          <TableCell align="right">{r.impressions}</TableCell>
                          <TableCell align="right">{r.clicks}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("campaigns@close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
