import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Chip, FormControlLabel, Link, Stack, Switch, Typography } from "@mui/material";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid, ScreenHeader } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import { formatFullDateTime } from "../../../utils/date-format";
import { apiErrorMessage } from "../../../utils/api-error";
import { useAcknowledgeBillingAlert, useBillingAlerts } from "../hooks/use-billing";
import type { BillingAlertDto } from "../types/api";
import { providerProfilePath } from "../utils/links";

const KIND_COLOR: Record<string, "warning" | "error" | "info"> = {
  adminSoftCap: "warning",
  adminBreakEven: "error",
  upgradeRequest: "info",
};

/** Billing alerts: unlimited plans over their daily soft cap or monthly break-even, and new upgrade requests. */
export default function BillingAlertsScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const [unacknowledgedOnly, setUnacknowledgedOnly] = useState(true);
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const { data, isLoading, isFetching } = useBillingAlerts(unacknowledgedOnly, pagination.page + 1, pagination.pageSize);
  const ack = useAcknowledgeBillingAlert();

  const columns: GridColDef<BillingAlertDto>[] = [
    {
      field: "createdAt",
      headerName: t("billing@alerts.columns.created"),
      width: 170,
      renderCell: ({ row }) => <Typography variant="caption">{formatFullDateTime(row.createdAt, lang)}</Typography>,
    },
    {
      field: "kind",
      headerName: t("billing@alerts.columns.kind"),
      width: 160,
      renderCell: ({ row }) => (
        <Chip size="small" color={KIND_COLOR[row.kind] ?? "info"} label={t(`billing@alerts.kind.${row.kind}`, { defaultValue: row.kind })} />
      ),
    },
    {
      field: "message",
      headerName: t("billing@alerts.columns.message"),
      flex: 1,
      minWidth: 260,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ py: 0.75, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} sx={{ whiteSpace: "normal" }}>{row.title ?? "—"}</Typography>
          {row.body && <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "normal" }}>{row.body}</Typography>}
        </Box>
      ),
    },
    {
      field: "provider",
      headerName: t("billing@alerts.columns.provider"),
      width: 200,
      sortable: false,
      renderCell: ({ row }) =>
        row.providerType && row.providerId ? (
          <Link component="button" type="button" variant="body2" fontWeight={700}
            onClick={() => navigate(providerProfilePath(row.providerType as string, row.providerId as number))}>
            {row.providerName ?? `#${row.providerId}`}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 170,
      sortable: false,
      renderCell: ({ row }) =>
        row.acknowledgedAt ? (
          <Typography variant="caption" color="text.secondary">
            {t("billing@alerts.acknowledgedAt", { date: formatFullDateTime(row.acknowledgedAt, lang) })}
          </Typography>
        ) : (
          <Button size="small" variant="outlined" startIcon={<DoneAllIcon />} disabled={ack.isPending}
            onClick={() => ack.mutate(row.id, { onError: (err) => openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) }) })}>
            {t("billing@alerts.acknowledge")}
          </Button>
        ),
    },
  ];

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <ScreenHeader title={t("billing@alerts.title")} subtitle={t("billing@alerts.subtitle")} icon={<NotificationImportantIcon fontSize="large" />} />
          <FormControlLabel
            control={<Switch checked={unacknowledgedOnly} onChange={(e) => {
              setUnacknowledgedOnly(e.target.checked);
              setPagination((p) => ({ ...p, page: 0 }));
            }} />}
            label={t("billing@alerts.unacknowledgedOnly")}
          />
          <AppDataGrid<BillingAlertDto>
            data={data?.items ?? []}
            columns={columns}
            loading={isLoading || isFetching}
            getRowId={(r) => r.id}
            total={data?.totalCount ?? 0}
            paginationModel={pagination}
            onPaginationModelChange={setPagination}
            getRowHeight={() => 64}
            minHeight="50vh"
          />
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
