import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Chip,
  Paper,
  Skeleton,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import GavelIcon from "@mui/icons-material/Gavel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useTermsVersions } from "../hooks/use-terms";
import PublishTermsDialog from "./PublishTermsDialog";
import TermsVersionDialog from "./TermsVersionDialog";
import { scopeLabelKey } from "./scope";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function TermsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data = [], isLoading, refetch } = useTermsVersions();

  const [publishOpen, setPublishOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);

  /** Active versions first, then newest id first. */
  const rows = useMemo(
    () =>
      [...data].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return b.id - a.id;
      }),
    [data]
  );

  const activeCount = useMemo(() => data.filter((v) => v.isActive).length, [data]);
  const nothingPublished = !isLoading && data.length === 0;

  return (
    <AppScreenContainer>
      {/* Banner */}
      <Box sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, borderRadius: 3, p: { xs: 2.5, md: 4 }, mb: 3, position: "relative", overflow: "hidden", color: "white" }}>
        <Box sx={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={2.5} alignItems="center">
            <Box sx={{ width: 72, height: 72, borderRadius: 3, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <GavelIcon sx={{ fontSize: 40, color: "white" }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="white">{t("terms@title")}</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5 }}>{t("terms@subtitle")}</Typography>
              <Box sx={{ mt: 2, display: "inline-block", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 2, px: 2, py: 0.75, textAlign: "center" }}>
                {isLoading ? (
                  <Skeleton variant="rounded" width={36} height={26} sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: "auto" }} />
                ) : (
                  <Typography variant="h6" fontWeight={800} color="white" lineHeight={1.1}>{activeCount}</Typography>
                )}
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.68rem" }}>{t("terms@activePolicies")}</Typography>
              </Box>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Tooltip title={t("refresh")}>
              <IconButton onClick={() => refetch()} sx={{ color: "rgba(255,255,255,0.8)", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setPublishOpen(true)}
              sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 600, backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, whiteSpace: "nowrap" }}
            >
              {t("terms@publish")}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {nothingPublished && (
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>{t("terms@emptyTitle")}</AlertTitle>
          {t("terms@emptyBody")}
        </Alert>
      )}

      <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "action.hover" } }}>
                <TableCell>{t("terms@systemVersion")}</TableCell>
                <TableCell>{t("terms@scope")}</TableCell>
                <TableCell>{t("terms@status")}</TableCell>
                <TableCell align="center">{t("terms@acceptances")}</TableCell>
                <TableCell>{t("terms@effectiveFrom")}</TableCell>
                <TableCell align="right">{t("actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton variant="text" height={32} /></TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: "center" }}>
                    <GavelIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }} />
                    <Typography variant="h6" color="text.secondary" fontWeight={600}>{t("terms@noVersions")}</Typography>
                    <Button startIcon={<AddIcon />} onClick={() => setPublishOpen(true)} variant="contained" sx={{ mt: 2, borderRadius: 2 }}>
                      {t("terms@publishFirst")}
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((v) => (
                  <TableRow key={v.id} hover>
                    <TableCell>
                      <Typography fontWeight={700}>v{v.systemVersion}</Typography>
                      <Typography variant="caption" color="text.disabled">#{v.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={t(scopeLabelKey(v.roleId))} sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={v.isActive ? "success" : "default"}
                        variant={v.isActive ? "filled" : "outlined"}
                        label={v.isActive ? t("terms@active") : t("terms@inactive")}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight={700}>{v.acceptanceCount.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{formatDate(v.effectiveFrom)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t("terms@viewContent")}>
                        <IconButton size="small" onClick={() => setViewId(v.id)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <PublishTermsDialog open={publishOpen} onClose={() => setPublishOpen(false)} versions={data} />
      <TermsVersionDialog versionId={viewId} onClose={() => setViewId(null)} />
    </AppScreenContainer>
  );
}
