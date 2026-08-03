import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Stack,
  TextField,
  MenuItem,
  Button,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Avatar,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import {
  getNearestStations,
  type NearestPremiumFilter,
} from "../services/nearest-service";

const AMMAN = { lat: 31.9566, lng: 35.9132 };

export default function NearestPreviewScreen() {
  const { t } = useTranslation();

  const [lat, setLat] = useState(String(AMMAN.lat));
  const [lng, setLng] = useState(String(AMMAN.lng));
  const [premium, setPremium] = useState<NearestPremiumFilter>("all");
  const [applied, setApplied] = useState({ lat: AMMAN.lat, lng: AMMAN.lng, premium: "all" as NearestPremiumFilter });

  const { data: rows = [], isFetching, error } = useQuery({
    queryKey: ["nearest-preview", applied.lat, applied.lng, applied.premium],
    queryFn: ({ signal }) => getNearestStations(applied.lat, applied.lng, applied.premium, signal),
  });

  const load = () => {
    const la = Number(lat), ln = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return;
    setApplied({ lat: la, lng: ln, premium });
  };

  const statusColor = (s?: string | null) =>
    s === "approved" ? "success" : s === "rejected" ? "error" : s ? "warning" : "default";

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <ScreenHeader title={t("nearestPreview@title")} />
          <Typography variant="body2" color="text.secondary">
            {t("nearestPreview@subtitle")}
          </Typography>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
              <TextField label={t("nearestPreview@lat")} size="small" value={lat}
                onChange={(e) => setLat(e.target.value)} sx={{ maxWidth: 160 }} />
              <TextField label={t("nearestPreview@lng")} size="small" value={lng}
                onChange={(e) => setLng(e.target.value)} sx={{ maxWidth: 160 }} />
              <TextField select label={t("nearestPreview@premium")} size="small" value={premium}
                onChange={(e) => setPremium(e.target.value as NearestPremiumFilter)} sx={{ maxWidth: 160 }}>
                <MenuItem value="all">{t("nearestPreview@all")}</MenuItem>
                <MenuItem value="true">{t("nearestPreview@onlyPremium")}</MenuItem>
                <MenuItem value="false">{t("nearestPreview@onlyNormal")}</MenuItem>
              </TextField>
              <Button variant="contained" startIcon={<SearchIcon />} onClick={load}>
                {t("nearestPreview@load")}
              </Button>
            </Stack>
          </Paper>

          {error ? (
            <Typography color="error">{t("loadingFailed")}</Typography>
          ) : isFetching ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
          ) : rows.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4 }}>{t("nearestPreview@empty")}</Typography>
          ) : (
            <Paper variant="outlined" sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("nearestPreview@image")}</TableCell>
                    <TableCell>#</TableCell>
                    <TableCell>{t("nearestPreview@name")}</TableCell>
                    <TableCell align="right">{t("nearestPreview@distance")}</TableCell>
                    <TableCell>{t("nearestPreview@isPremium")}</TableCell>
                    <TableCell>{t("nearestPreview@viewImageStatus")}</TableCell>
                    <TableCell>{t("nearestPreview@stationType")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <Avatar variant="rounded" src={r.viewImage || r.iConUrl || undefined}
                          sx={{ width: 56, height: 32 }} />
                      </TableCell>
                      <TableCell>{r.id}</TableCell>
                      <TableCell sx={{ minWidth: 140 }}>{r.name ?? "—"}</TableCell>
                      <TableCell align="right">
                        {r.distanceKm != null ? `${r.distanceKm} km` : "—"}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={r.isPremium ? t("nearestPreview@yes") : t("nearestPreview@no")}
                          color={r.isPremium ? "warning" : "default"} variant={r.isPremium ? "filled" : "outlined"} />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={r.viewImageStatus ?? "—"} color={statusColor(r.viewImageStatus)}
                          variant={r.viewImageStatus ? "filled" : "outlined"} />
                      </TableCell>
                      <TableCell>{r.stationType?.id ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
