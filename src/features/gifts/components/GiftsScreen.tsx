import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RedeemIcon from "@mui/icons-material/Redeem";
import SearchIcon from "@mui/icons-material/Search";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { useDebounce } from "use-debounce";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid, ScreenHeader } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import { formatShortDate } from "../../../utils/date-format";
import { apiErrorMessage } from "../../../utils/api-error";
import { cityLabel } from "../../dashboard/utils/city-names";
import { useAdminGifts, usePendingGiftOrdersCount, useSetGiftActive } from "../hooks/use-gifts";
import type { AdminCableGiftDto } from "../types/api";
import GiftFormDialog from "./GiftFormDialog";

/** "هدايا كيبل": the catalogue table with create / edit and the active switch. */
export default function GiftsScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;
  const isAr = lang.startsWith("ar");
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 350);
  const [editing, setEditing] = useState<AdminCableGiftDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const isActive = activeFilter === "all" ? null : activeFilter === "active";
  const { data: gifts = [], isLoading, isFetching } = useAdminGifts(isActive, debouncedSearch);
  const { data: pendingCount } = usePendingGiftOrdersCount();
  const setActive = useSetGiftActive();

  const openForm = (gift: AdminCableGiftDto | null) => {
    setEditing(gift);
    setFormOpen(true);
  };

  const columns = useMemo<GridColDef<AdminCableGiftDto>[]>(
    () => [
      {
        field: "name",
        headerName: t("gifts@columns.gift"),
        flex: 1,
        minWidth: 240,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, py: 0.75 }}>
            <Avatar variant="rounded" src={row.imageUrl ?? undefined} sx={{ width: 40, height: 40, bgcolor: "action.hover" }}>
              <RedeemIcon fontSize="small" color="action" />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>{isAr ? row.nameAr : row.nameEn}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{isAr ? row.nameEn : row.nameAr}</Typography>
            </Box>
          </Stack>
        ),
      },
      {
        field: "giftType",
        headerName: t("gifts@columns.type"),
        width: 130,
        renderCell: ({ row }) => <Chip size="small" variant="outlined" label={t(`gifts@type.${row.giftType}`)} />,
      },
      {
        field: "pointsCost",
        headerName: t("gifts@columns.pointsCost"),
        width: 110,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => <Typography variant="body2" fontWeight={800}>{row.pointsCost.toLocaleString("en-US")}</Typography>,
      },
      {
        field: "remaining",
        headerName: t("gifts@columns.stock"),
        width: 130,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: ({ row }) =>
          row.stock == null ? (
            <Chip size="small" label={t("gifts@unlimited")} variant="outlined" />
          ) : (
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" fontWeight={700} color={row.remaining === 0 ? "error.main" : "text.primary"}>
                {row.remaining ?? 0} / {row.stock}
              </Typography>
              <Typography variant="caption" color="text.secondary">{t("gifts@remainingOfStock")}</Typography>
            </Box>
          ),
      },
      {
        field: "perUserLimit",
        headerName: t("gifts@columns.perUser"),
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (row.perUserLimit == null ? "∞" : row.perUserLimit),
      },
      {
        field: "orders",
        headerName: t("gifts@columns.orders"),
        width: 170,
        sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title={t("gifts@status.Pending")}>
              <Chip size="small" color={row.pendingOrders > 0 ? "warning" : "default"} label={row.pendingOrders} />
            </Tooltip>
            <Tooltip title={t("gifts@status.Fulfilled")}>
              <Chip size="small" color="success" variant="outlined" label={row.fulfilledOrders} />
            </Tooltip>
            <Tooltip title={t("gifts@status.Cancelled")}>
              <Chip size="small" variant="outlined" label={row.cancelledOrders} />
            </Tooltip>
          </Stack>
        ),
      },
      {
        field: "dates",
        headerName: t("gifts@columns.dates"),
        width: 190,
        sortable: false,
        renderCell: ({ row }) => (
          <Typography variant="caption" color="text.secondary">
            {row.startsAt || row.endsAt
              ? `${row.startsAt ? formatShortDate(row.startsAt, lang) : "…"} → ${row.endsAt ? formatShortDate(row.endsAt, lang) : "…"}`
              : t("gifts@noDates")}
          </Typography>
        ),
      },
      {
        field: "cities",
        headerName: t("gifts@columns.cities"),
        width: 170,
        sortable: false,
        renderCell: ({ row }) => (
          <Typography variant="caption" color="text.secondary" noWrap>
            {row.cities?.length ? row.cities.map((c) => cityLabel(c, lang)).join("، ") : t("gifts@allCities")}
          </Typography>
        ),
      },
      {
        field: "isActive",
        headerName: t("gifts@columns.active"),
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Switch
            size="small"
            checked={row.isActive}
            disabled={setActive.isPending}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              setActive.mutate(
                { id: row.id, isActive: e.target.checked },
                { onError: (err) => openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) }) }
              )
            }
          />
        ),
      },
      {
        field: "actions",
        headerName: t("actions"),
        width: 110,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title={t("edit")}>
              <IconButton size="small" onClick={() => openForm(row)}><EditIcon fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title={t("gifts@viewOrders")}>
              <IconButton size="small" color="primary" onClick={() => navigate(`/gift-orders?giftId=${row.id}`)}>
                <ListAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [t, isAr, lang, setActive, openErrorSnackbar, navigate]
  );

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <ScreenHeader title={t("gifts@title")} subtitle={t("gifts@subtitle")} icon={<RedeemIcon fontSize="large" />} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} flexWrap="wrap" useFlexGap>
            <TextField
              size="small"
              placeholder={t("gifts@searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 240 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            <TextField select size="small" label={t("gifts@columns.active")} value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)} sx={{ minWidth: 150 }}>
              <MenuItem value="all">{t("all")}</MenuItem>
              <MenuItem value="active">{t("active")}</MenuItem>
              <MenuItem value="inactive">{t("inactive")}</MenuItem>
            </TextField>
            <Box sx={{ flex: 1 }} />
            <Button variant="outlined" startIcon={<ListAltIcon />} onClick={() => navigate("/gift-orders")}>
              {t("gifts@orders.navTitle")}
              {pendingCount ? <Chip size="small" color="warning" label={pendingCount} sx={{ marginInlineStart: 1, height: 20 }} /> : null}
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)}>
              {t("gifts@add")}
            </Button>
          </Stack>

          <AppDataGrid<AdminCableGiftDto>
            data={gifts}
            columns={columns}
            loading={isLoading || isFetching}
            getRowId={(r) => r.id}
            getRowHeight={() => 60}
            minHeight="50vh"
            disablePagination
          />
        </Stack>
      </Box>

      <GiftFormDialog open={formOpen} gift={editing} onClose={() => setFormOpen(false)} />
    </AppScreenContainer>
  );
}
