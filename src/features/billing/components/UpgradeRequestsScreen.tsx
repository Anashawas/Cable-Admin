import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import AddTaskIcon from "@mui/icons-material/AddTask";
import BlockIcon from "@mui/icons-material/Block";
import PhoneIcon from "@mui/icons-material/Phone";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid, ScreenHeader } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import { formatFullDateTime } from "../../../utils/date-format";
import { apiErrorMessage } from "../../../utils/api-error";
import { toTelHref, toWhatsAppHref } from "../../../utils/phone";
import RecordPaymentDialog from "../../subscriptions/components/RecordPaymentDialog";
import type { SubscriptionEntityType } from "../../subscriptions/types/api";
import { getAllPartnerAgreements } from "../../partners/services/partners-service";
import { BILLING_QUERY_KEY, usePlans, useRejectUpgradeRequest, useUpgradeRequests } from "../hooks/use-billing";
import { UPGRADE_REQUEST_STATUSES, type UpgradeRequestDto, type UpgradeRequestStatus } from "../types/api";
import { legacyEntityTypeFor, providerProfilePath } from "../utils/links";
import PlanStatusChip from "./PlanStatusChip";
import PlanSubscriptionDialog from "./PlanSubscriptionDialog";
import SellBundleDialog from "./SellBundleDialog";

interface PayTarget {
  request: UpgradeRequestDto;
  entityType: SubscriptionEntityType;
  amount: number | null;
  priceOptionId: number | null;
}

/**
 * "طلبات الترقية": partner upgrade / renew / bundle requests (pending first).
 * "Record payment" opens the existing RecordPaymentDialog prefilled — recording
 * it fulfils the request; loyalty requests are fulfilled by selling the bundle.
 */
export default function UpgradeRequestsScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [status, setStatus] = useState<UpgradeRequestStatus | "all">("Pending");
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const { data, isLoading, isFetching } = useUpgradeRequests(status === "all" ? null : status, pagination.page + 1, pagination.pageSize);
  const { data: plans = [] } = usePlans(true);
  const { data: agreements = [] } = useQuery({
    queryKey: ["partners", "agreements", "all-for-billing"],
    queryFn: () => getAllPartnerAgreements(),
    staleTime: 5 * 60 * 1000,
  });
  const reject = useRejectUpgradeRequest();
  const queryClient = useQueryClient();

  const [payTarget, setPayTarget] = useState<PayTarget | null>(null);
  const [subscribeTarget, setSubscribeTarget] = useState<UpgradeRequestDto | null>(null);
  const [bundleTarget, setBundleTarget] = useState<{ request: UpgradeRequestDto; agreementId: number } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<UpgradeRequestDto | null>(null);
  const [reason, setReason] = useState("");

  const planById = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans]);

  /** How this request is fulfilled: through the existing payment engine, a bundle sale, or a plan subscription. */
  const actionFor = (r: UpgradeRequestDto) => {
    const plan = planById.get(r.planId);
    if (plan?.category === "Loyalty" || r.kind === "bundle") {
      const agreement = agreements.find((a) => a.providerType === r.providerType && a.providerId === r.providerId);
      return { kind: "bundle" as const, agreementId: agreement?.id ?? null };
    }
    const entityType = legacyEntityTypeFor(plan?.legacyEntityTypes, r.providerType) as SubscriptionEntityType | null;
    if (entityType) return { kind: "payment" as const, entityType };
    return { kind: "subscription" as const };
  };

  const openPayment = (r: UpgradeRequestDto, entityType: SubscriptionEntityType) => {
    const plan = planById.get(r.planId);
    const option =
      plan?.priceOptions.find((o) => o.id === r.priceOptionId) ??
      plan?.priceOptions.find((o) => o.isActive && o.months === r.months) ??
      null;
    setPayTarget({ request: r, entityType, amount: option?.priceJod ?? null, priceOptionId: option?.id ?? null });
  };

  const handleReject = () => {
    if (!rejectTarget || !reason.trim()) return;
    reject.mutate(
      { id: rejectTarget.id, reason: reason.trim() },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("billing@requests.rejected") });
          setRejectTarget(null);
        },
        onError: (err) => openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) }),
      }
    );
  };

  const columns: GridColDef<UpgradeRequestDto>[] = [
    {
      field: "createdAt",
      headerName: t("billing@requests.columns.created"),
      width: 170,
      renderCell: ({ row }) => <Typography variant="caption">{formatFullDateTime(row.createdAt, lang)}</Typography>,
    },
    {
      field: "provider",
      headerName: t("billing@requests.columns.provider"),
      flex: 1,
      minWidth: 200,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ minWidth: 0 }}>
          <Link component="button" type="button" variant="body2" fontWeight={700} onClick={() => navigate(providerProfilePath(row.providerType, row.providerId))}>
            {row.providerName ?? `#${row.providerId}`}
          </Link>
          <Typography variant="caption" color="text.secondary" display="block">{t(`billing@providerType.${row.providerType}`)} · #{row.providerId}</Typography>
        </Box>
      ),
    },
    {
      field: "plan",
      headerName: t("billing@requests.columns.plan"),
      width: 210,
      sortable: false,
      renderCell: ({ row }) => (
        <Box>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="body2" fontWeight={700}>{row.planName}</Typography>
            <Chip size="small" variant="outlined" label={t(`billing@requests.kind.${row.kind}`, { defaultValue: row.kind })} />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {row.months ? t("billing@option.months", { count: row.months }) : row.tier}
          </Typography>
        </Box>
      ),
    },
    {
      field: "requester",
      headerName: t("billing@requests.columns.requester"),
      width: 210,
      sortable: false,
      renderCell: ({ row }) => {
        const tel = toTelHref(row.requestedByPhone);
        const wa = toWhatsAppHref(row.requestedByPhone);
        return (
          <Box>
            <Link component="button" type="button" variant="body2" fontWeight={600} onClick={() => navigate(`/users/${row.requestedByUserId}`)}>
              {row.requestedByName ?? `#${row.requestedByUserId}`}
            </Link>
            <Stack direction="row" spacing={0.25} alignItems="center">
              <Typography variant="caption" color="text.secondary" dir="ltr">{row.requestedByPhone ?? "—"}</Typography>
              {tel && <IconButton size="small" component="a" href={tel}><PhoneIcon sx={{ fontSize: 15 }} /></IconButton>}
              {wa && (
                <IconButton size="small" component="a" href={wa} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon sx={{ fontSize: 15, color: "#25D366" }} />
                </IconButton>
              )}
            </Stack>
          </Box>
        );
      },
    },
    {
      field: "note",
      headerName: t("billing@requests.columns.note"),
      width: 180,
      sortable: false,
      renderCell: ({ row }) => (
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "normal" }}>
          {row.status === "Rejected" ? row.rejectReason || "—" : row.note || "—"}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: t("billing@requests.columns.status"),
      width: 120,
      renderCell: ({ row }) => (
        <Box>
          <PlanStatusChip status={row.status} />
          {row.handledAt && <Typography variant="caption" color="text.secondary" display="block">{formatFullDateTime(row.handledAt, lang)}</Typography>}
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 200,
      sortable: false,
      renderCell: ({ row }) => {
        if (row.status !== "Pending") return <Typography variant="caption" color="text.disabled">—</Typography>;
        const action = actionFor(row);
        return (
          <Stack direction="row" spacing={0.5} alignItems="center">
            {action.kind === "payment" && (
              <Button size="small" variant="contained" startIcon={<ReceiptLongIcon />} onClick={() => openPayment(row, action.entityType)}>
                {t("billing@requests.recordPayment")}
              </Button>
            )}
            {action.kind === "bundle" && (
              <Tooltip title={action.agreementId ? "" : t("billing@requests.noAgreement")}>
                <span>
                  <Button size="small" variant="contained" color="secondary" startIcon={<ShoppingCartCheckoutIcon />}
                    disabled={!action.agreementId}
                    onClick={() => action.agreementId && setBundleTarget({ request: row, agreementId: action.agreementId })}>
                    {t("billing@bundle.sell")}
                  </Button>
                </span>
              </Tooltip>
            )}
            {action.kind === "subscription" && (
              <Button size="small" variant="contained" startIcon={<AddTaskIcon />} onClick={() => setSubscribeTarget(row)}>
                {t("billing@records.new")}
              </Button>
            )}
            <Tooltip title={t("billing@requests.reject")}>
              <IconButton size="small" color="error" onClick={() => {
                setReason("");
                setRejectTarget(row);
              }}>
                <BlockIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <ScreenHeader title={t("billing@requests.title")} subtitle={t("billing@requests.subtitle")} icon={<UpgradeIcon fontSize="large" />} />
          <Tabs value={status} onChange={(_, v) => {
            setStatus(v);
            setPagination((p) => ({ ...p, page: 0 }));
          }} variant="scrollable" allowScrollButtonsMobile>
            {UPGRADE_REQUEST_STATUSES.map((s) => <Tab key={s} value={s} label={t(`billing@status.${s}`)} />)}
            <Tab value="all" label={t("all")} />
          </Tabs>
          <AppDataGrid<UpgradeRequestDto>
            data={data?.items ?? []}
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

      {payTarget && (
        <RecordPaymentDialog
          open
          onClose={() => setPayTarget(null)}
          entityType={payTarget.entityType}
          entityId={payTarget.request.providerId}
          entityName={payTarget.request.providerName}
          ownerUserAccountId={payTarget.request.requestedByUserId}
          ownerName={payTarget.request.requestedByName}
          initialPlanMonths={payTarget.request.months}
          initialAmount={payTarget.amount}
          planId={payTarget.request.planId}
          priceOptionId={payTarget.priceOptionId}
          upgradeRequestId={payTarget.request.id}
          onRecorded={() => queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY })}
        />
      )}

      {subscribeTarget && (
        <PlanSubscriptionDialog
          open
          mode="new"
          onClose={() => setSubscribeTarget(null)}
          providerType={subscribeTarget.providerType}
          providerId={subscribeTarget.providerId}
          providerName={subscribeTarget.providerName}
          ownerUserAccountId={subscribeTarget.requestedByUserId}
          ownerName={subscribeTarget.requestedByName}
          initialPlanId={subscribeTarget.planId}
          initialPriceOptionId={subscribeTarget.priceOptionId}
          upgradeRequestId={subscribeTarget.id}
        />
      )}

      {bundleTarget && (
        <SellBundleDialog
          open
          onClose={() => setBundleTarget(null)}
          agreementId={bundleTarget.agreementId}
          providerType={bundleTarget.request.providerType}
          providerId={bundleTarget.request.providerId}
          providerName={bundleTarget.request.providerName}
          initialPlanId={bundleTarget.request.planId}
          initialPriceOptionId={bundleTarget.request.priceOptionId}
          upgradeRequestId={bundleTarget.request.id}
        />
      )}

      <Dialog open={!!rejectTarget} onClose={() => !reject.isPending && setRejectTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t("billing@requests.rejectTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {rejectTarget?.providerName ?? `#${rejectTarget?.providerId}`} · {rejectTarget?.planName}
          </Typography>
          <TextField autoFocus fullWidth multiline minRows={2} required label={t("billing@records.reason")} value={reason}
            onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setRejectTarget(null)} disabled={reject.isPending}>{t("cancel")}</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={reject.isPending || !reason.trim()}
            startIcon={reject.isPending ? <CircularProgress size={18} color="inherit" /> : <BlockIcon />}>
            {t("billing@requests.reject")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
