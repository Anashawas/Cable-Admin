import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import PhoneIcon from "@mui/icons-material/Phone";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import RedeemIcon from "@mui/icons-material/Redeem";
import { useDebounce } from "use-debounce";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid, ScreenHeader } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import { formatFullDateTime } from "../../../utils/date-format";
import { apiErrorMessage, saveBlob } from "../../../utils/api-error";
import { toTelHref, toWhatsAppHref } from "../../../utils/phone";
import { useAdminGifts, useGiftOrders } from "../hooks/use-gifts";
import { exportGiftOrders } from "../services/gifts-service";
import { GIFT_ORDER_STATUSES, type AdminGiftOrderDto, type GiftOrderFilters, type GiftOrderStatus } from "../types/api";
import GiftOrderActionDialog from "./GiftOrderActionDialog";

const STATUS_COLOR: Record<GiftOrderStatus, "warning" | "success" | "default"> = {
  Pending: "warning",
  Fulfilled: "success",
  Cancelled: "default",
};

/** "طلبات الهدايا": filter by status / gift / dates, fulfil or cancel, call the user, export CSV. */
export default function GiftOrdersScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;
  const isAr = lang.startsWith("ar");
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const [params] = useSearchParams();

  const [status, setStatus] = useState<GiftOrderStatus | "all">("Pending");
  const [giftId, setGiftId] = useState<number | "">(() => Number(params.get("giftId")) || "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 350);
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [target, setTarget] = useState<{ order: AdminGiftOrderDto; action: "fulfill" | "cancel" } | null>(null);
  const [exporting, setExporting] = useState(false);

  const filters = useMemo<GiftOrderFilters>(
    () => ({
      status: status === "all" ? null : status,
      giftId: giftId === "" ? null : giftId,
      from: from || null,
      to: to || null,
      search: debouncedSearch || null,
    }),
    [status, giftId, from, to, debouncedSearch]
  );

  const { data, isLoading, isFetching } = useGiftOrders(filters, pagination.page + 1, pagination.pageSize);
  const { data: gifts = [] } = useAdminGifts(null, "");
  const rows = data?.items ?? [];

  const resetPage = () => setPagination((p) => ({ ...p, page: 0 }));

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportGiftOrders(filters);
      saveBlob(blob, `gift-orders-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) });
    } finally {
      setExporting(false);
    }
  };

  const columns = useMemo<GridColDef<AdminGiftOrderDto>[]>(
    () => [
      {
        field: "orderCode",
        headerName: t("gifts@orders.columns.code"),
        width: 150,
        renderCell: ({ row }) => (
          <Box>
            <Typography variant="body2" fontWeight={800} sx={{ fontFamily: "monospace" }}>{row.orderCode}</Typography>
            <Typography variant="caption" color="text.secondary">{formatFullDateTime(row.createdAt, lang)}</Typography>
          </Box>
        ),
      },
      {
        field: "gift",
        headerName: t("gifts@orders.columns.gift"),
        flex: 1,
        minWidth: 180,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>{isAr ? row.giftNameAr : row.giftNameEn}</Typography>
            <Typography variant="caption" color="text.secondary">{t(`gifts@type.${row.giftType}`)}</Typography>
          </Box>
        ),
      },
      {
        field: "user",
        headerName: t("gifts@orders.columns.user"),
        width: 230,
        sortable: false,
        renderCell: ({ row }) => {
          const phone = row.contactPhone || row.userPhone;
          const tel = toTelHref(phone);
          const wa = toWhatsAppHref(phone);
          return (
            <Box sx={{ minWidth: 0 }}>
              <Link component="button" type="button" variant="body2" fontWeight={700} onClick={() => navigate(`/users/${row.userId}`)}>
                {row.userName || `#${row.userId}`}
              </Link>
              <Stack direction="row" spacing={0.25} alignItems="center">
                <Typography variant="caption" color="text.secondary" dir="ltr">{phone ?? "—"}</Typography>
                {tel && (
                  <Tooltip title={t("gifts@orders.call")}>
                    <IconButton size="small" component="a" href={tel}><PhoneIcon sx={{ fontSize: 15 }} /></IconButton>
                  </Tooltip>
                )}
                {wa && (
                  <Tooltip title="WhatsApp">
                    <IconButton size="small" component="a" href={wa} target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon sx={{ fontSize: 15, color: "#25D366" }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
              {row.contactPhone && row.userPhone && row.contactPhone !== row.userPhone && (
                <Typography variant="caption" color="text.disabled" dir="ltr" display="block">
                  {t("gifts@orders.accountPhone")}: {row.userPhone}
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: "pointsSpent",
        headerName: t("gifts@orders.columns.points"),
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => <Typography variant="body2" fontWeight={800}>{row.pointsSpent.toLocaleString("en-US")}</Typography>,
      },
      {
        field: "status",
        headerName: t("gifts@orders.columns.status"),
        width: 130,
        renderCell: ({ row }) => (
          <Chip size="small" color={STATUS_COLOR[row.status]} label={t(`gifts@status.${row.status}`)} sx={{ fontWeight: 700 }} />
        ),
      },
      {
        field: "details",
        headerName: t("gifts@orders.columns.details"),
        width: 260,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ minWidth: 0, py: 0.5 }}>
            {row.note && <Typography variant="caption" display="block" noWrap>{t("gifts@orders.userNote")}: {row.note}</Typography>}
            {row.status === "Fulfilled" && (
              <Typography variant="caption" display="block" color="success.main" noWrap>
                {row.fulfillmentNote || t("gifts@orders.noNote")} · {formatFullDateTime(row.fulfilledAt, lang)}
              </Typography>
            )}
            {row.status === "Cancelled" && (
              <Typography variant="caption" display="block" color="text.secondary" noWrap>
                {row.cancelReason || t("gifts@orders.noReason")} · {formatFullDateTime(row.cancelledAt, lang)}
              </Typography>
            )}
            {!row.note && row.status === "Pending" && <Typography variant="caption" color="text.disabled">—</Typography>}
          </Box>
        ),
      },
      {
        field: "actions",
        headerName: t("actions"),
        width: 120,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: ({ row }) =>
          row.status === "Pending" ? (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title={t("gifts@orders.fulfill")}>
                <IconButton size="small" color="success" onClick={() => setTarget({ order: row, action: "fulfill" })}>
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("gifts@orders.cancel")}>
                <IconButton size="small" color="error" onClick={() => setTarget({ order: row, action: "cancel" })}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : (
            <Typography variant="caption" color="text.disabled">—</Typography>
          ),
      },
    ],
    [t, lang, isAr, navigate]
  );

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <ScreenHeader title={t("gifts@orders.title")} subtitle={t("gifts@orders.subtitle")} icon={<RedeemIcon fontSize="large" />} />

          <Tabs
            value={status}
            onChange={(_, v) => {
              setStatus(v);
              resetPage();
            }}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <Tab value="all" label={t("all")} />
            {GIFT_ORDER_STATUSES.map((s) => (
              <Tab key={s} value={s} label={t(`gifts@status.${s}`)} />
            ))}
          </Tabs>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} flexWrap="wrap" useFlexGap>
            <TextField
              size="small"
              placeholder={t("gifts@orders.searchPlaceholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              sx={{ minWidth: 240 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            <TextField select size="small" label={t("gifts@orders.columns.gift")} value={giftId}
              onChange={(e) => {
                setGiftId(e.target.value === "" ? "" : Number(e.target.value));
                resetPage();
              }}
              sx={{ minWidth: 200 }}>
              <MenuItem value="">{t("all")}</MenuItem>
              {gifts.map((g) => (
                <MenuItem key={g.id} value={g.id}>{isAr ? g.nameAr : g.nameEn}</MenuItem>
              ))}
            </TextField>
            <TextField size="small" type="date" label={t("gifts@orders.from")} value={from} InputLabelProps={{ shrink: true }}
              onChange={(e) => {
                setFrom(e.target.value);
                resetPage();
              }} />
            <TextField size="small" type="date" label={t("gifts@orders.to")} value={to} InputLabelProps={{ shrink: true }}
              onChange={(e) => {
                setTo(e.target.value);
                resetPage();
              }} />
            <Box sx={{ flex: 1 }} />
            <Button variant="outlined" onClick={handleExport} disabled={exporting}
              startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}>
              {t("gifts@orders.exportCsv")}
            </Button>
          </Stack>

          <AppDataGrid<AdminGiftOrderDto>
            data={rows}
            columns={columns}
            loading={isLoading || isFetching}
            getRowId={(r) => r.id}
            total={data?.totalCount ?? 0}
            paginationModel={pagination}
            onPaginationModelChange={setPagination}
            getRowHeight={() => 72}
            minHeight="50vh"
          />
        </Stack>
      </Box>

      <GiftOrderActionDialog order={target?.order ?? null} action={target?.action ?? null} onClose={() => setTarget(null)} />
    </AppScreenContainer>
  );
}
