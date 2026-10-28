import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import { useDebounce } from "use-debounce";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid, ScreenHeader } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import { formatShortDate } from "../../../utils/date-format";
import { apiErrorMessage, fmtJod } from "../../../utils/api-error";
import { usePromoCampaigns, useSetPromoCampaignActive } from "../hooks/use-promos";
import type { AdminPromoCampaignDto } from "../types/api";
import { budgetUsedPercent, effectSummary } from "../utils/promo-rules";

/** "الأكواد والعروض": every campaign with its effect, code, dates, usage and Cable's budget. */
export default function PromosScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;
  const isAr = lang.startsWith("ar");
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");
  const [debounced] = useDebounce(search, 350);
  const isActive = activeFilter === "all" ? null : activeFilter === "active";
  const { data: campaigns = [], isLoading, isFetching } = usePromoCampaigns(isActive, debounced);
  const setActive = useSetPromoCampaignActive();

  const columns = useMemo<GridColDef<AdminPromoCampaignDto>[]>(
    () => [
      {
        field: "title",
        headerName: t("promos@columns.campaign"),
        flex: 1,
        minWidth: 220,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>{isAr ? row.titleAr : row.titleEn}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>#{row.id} · {isAr ? row.titleEn : row.titleAr}</Typography>
          </Box>
        ),
      },
      {
        field: "effect",
        headerName: t("promos@columns.effect"),
        width: 170,
        sortable: false,
        renderCell: ({ row }) => (
          <Chip size="small" color="secondary" variant="outlined" label={effectSummary(row.effectType, row.effectValue, row.maxDiscountJod, t)} />
        ),
      },
      {
        field: "code",
        headerName: t("promos@columns.code"),
        width: 150,
        sortable: false,
        renderCell: ({ row }) =>
          row.codeMode === "Public" ? (
            <Typography variant="body2" fontWeight={800} sx={{ fontFamily: "monospace" }}>{row.publicCode ?? "—"}</Typography>
          ) : (
            <Box>
              <Typography variant="body2" fontWeight={700}>{t("promos@codeMode.Unique")}</Typography>
              <Typography variant="caption" color="text.secondary">{t("promos@columns.codesClaimed", { claimed: row.codesClaimed, total: row.codesCount })}</Typography>
            </Box>
          ),
      },
      {
        field: "dates",
        headerName: t("promos@columns.dates"),
        width: 190,
        sortable: false,
        renderCell: ({ row }) => (
          <Typography variant="caption" color="text.secondary">
            {row.startsAt || row.endsAt
              ? `${row.startsAt ? formatShortDate(row.startsAt, lang) : "…"} → ${row.endsAt ? formatShortDate(row.endsAt, lang) : "…"}`
              : t("promos@noDates")}
          </Typography>
        ),
      },
      {
        field: "usage",
        headerName: t("promos@columns.usage"),
        width: 140,
        sortable: false,
        renderCell: ({ row }) => (
          <Box>
            <Typography variant="body2" fontWeight={700}>{t("promos@columns.claimsUses", { claims: row.claimsCount, uses: row.usesCount })}</Typography>
            {row.totalLimit != null && (
              <Typography variant="caption" color="text.secondary">{t("promos@columns.limit", { limit: row.totalLimit })}</Typography>
            )}
          </Box>
        ),
      },
      {
        field: "budget",
        headerName: t("promos@columns.budget"),
        width: 200,
        sortable: false,
        renderCell: ({ row }) => {
          const pct = budgetUsedPercent(row.cableBudgetJod, row.cableSpentJod);
          return row.cableBudgetJod == null ? (
            <Typography variant="caption" color="text.secondary">
              {t("promos@columns.share", { share: row.cableSharePercent })} · {t("promos@noBudget")}
            </Typography>
          ) : (
            <Box sx={{ width: "100%" }}>
              <Typography variant="caption" fontWeight={700}>
                {fmtJod(row.cableSpentJod)} / {fmtJod(row.cableBudgetJod)}
              </Typography>
              <LinearProgress variant="determinate" value={pct ?? 0} color={(pct ?? 0) >= 90 ? "error" : (pct ?? 0) >= 70 ? "warning" : "primary"}
                sx={{ height: 6, borderRadius: 3, my: 0.25 }} />
              <Typography variant="caption" color="text.secondary">{t("promos@columns.share", { share: row.cableSharePercent })}</Typography>
            </Box>
          );
        },
      },
      {
        field: "isActive",
        headerName: t("promos@columns.active"),
        width: 130,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Stack alignItems="center" onClick={(e) => e.stopPropagation()}>
            <Switch
              size="small"
              checked={row.isActive}
              disabled={setActive.isPending}
              onChange={(e) =>
                setActive.mutate(
                  { id: row.id, isActive: e.target.checked },
                  { onError: (err) => openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) }) }
                )
              }
            />
            {row.deactivatedReason === "BudgetExhausted" && (
              <Tooltip title={t("promos@form.budgetExhaustedHint")}>
                <Chip size="small" color="error" label={t("promos@budgetExhausted")} sx={{ height: 18, fontSize: 10 }} />
              </Tooltip>
            )}
          </Stack>
        ),
      },
    ],
    [t, isAr, lang, setActive, openErrorSnackbar]
  );

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <ScreenHeader title={t("promos@title")} subtitle={t("promos@subtitle")} icon={<LocalActivityIcon fontSize="large" />} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
            <TextField size="small" placeholder={t("promos@searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 240 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
            <TextField select size="small" label={t("promos@columns.active")} value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)} sx={{ minWidth: 150 }}>
              <MenuItem value="all">{t("all")}</MenuItem>
              <MenuItem value="active">{t("active")}</MenuItem>
              <MenuItem value="inactive">{t("inactive")}</MenuItem>
            </TextField>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/promos/new")}>{t("promos@newCampaign")}</Button>
          </Stack>
          <AppDataGrid<AdminPromoCampaignDto>
            data={campaigns}
            columns={columns}
            loading={isLoading || isFetching}
            getRowId={(r) => r.id}
            onRowClick={(p) => navigate(`/promos/${p.row.id}`)}
            getRowHeight={() => 64}
            minHeight="50vh"
            disablePagination
          />
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
