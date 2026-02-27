import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
  Divider,
  Paper,
  Card,
  CardContent,
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import RedeemIcon from "@mui/icons-material/Redeem";
import PersonIcon from "@mui/icons-material/Person";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import StarsIcon from "@mui/icons-material/Stars";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  useRedemptions,
  useFulfillRedemption,
  useCancelRedemption,
} from "../hooks/use-loyalty";
import type { RedemptionDto, RedemptionStatus } from "../types/api";

export default function RedemptionsScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [statusFilter, setStatusFilter] = useState<RedemptionStatus | undefined>(1); // Default to Pending

  const {
    data,
    isLoading,
    search,
    handleSearchChange,
    handleRefresh,
  } = useRedemptions(statusFilter);

  const fulfillMutation = useFulfillRedemption();
  const cancelMutation = useCancelRedemption();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState<RedemptionDto | null>(null);

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return data.slice(start, start + paginationModel.pageSize);
  }, [data, paginationModel.page, paginationModel.pageSize]);

  const handleViewDetails = useCallback((e: React.MouseEvent, row: RedemptionDto) => {
    e.stopPropagation();
    setSelectedRedemption(row);
    setDetailDialogOpen(true);
  }, []);

  const handleFulfill = useCallback(
    (e: React.MouseEvent, row: RedemptionDto) => {
      e.stopPropagation();
      fulfillMutation.mutate(row.id, {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("loyalty@redemptionFulfilled") });
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      });
    },
    [fulfillMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const handleCancel = useCallback(
    (e: React.MouseEvent, row: RedemptionDto) => {
      e.stopPropagation();
      cancelMutation.mutate(row.id, {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("loyalty@redemptionCancelled") });
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      });
    },
    [cancelMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const getStatusColor = (status: RedemptionStatus): "warning" | "success" | "error" => {
    switch (status) {
      case 1: // Pending
        return "warning";
      case 2: // Fulfilled
        return "success";
      case 3: // Cancelled
        return "error";
      default:
        return "warning";
    }
  };

  const getStatusLabel = (status: RedemptionStatus): string => {
    switch (status) {
      case 1:
        return t("pending");
      case 2:
        return t("fulfilled");
      case 3:
        return t("cancelled");
      default:
        return t("unknown");
    }
  };

  const columns: GridColDef<RedemptionDto>[] = [
    {
      field: "id",
      headerName: t("id"),
      width: 70,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "redemptionCode",
      headerName: t("redemptionCode"),
      width: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" fontFamily="monospace">
          {params.value}
        </Typography>
      ),
    },
    {
      field: "userName",
      headerName: t("user"),
      width: 150,
    },
    {
      field: "rewardName",
      headerName: t("reward"),
      flex: 1,
      minWidth: 200,
    },
    {
      field: "pointsSpent",
      headerName: t("pointsSpent"),
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip label={`${params.value} pts`} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      field: "status",
      headerName: t("status"),
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value)}
          size="small"
          color={getStatusColor(params.value)}
        />
      ),
    },
    {
      field: "redeemedAt",
      headerName: t("redeemedAt"),
      width: 160,
      valueFormatter: (value) => new Date(value).toLocaleString(),
    },
    {
      field: "fulfilledAt",
      headerName: t("fulfilledAt"),
      width: 160,
      valueFormatter: (value) => (value ? new Date(value).toLocaleString() : "-"),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 150,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t("viewDetails")}>
            <IconButton size="small" onClick={(e) => handleViewDetails(e, params.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === 1 && (
            <>
              <Tooltip title={t("fulfill")}>
                <IconButton
                  size="small"
                  color="success"
                  onClick={(e) => handleFulfill(e, params.row)}
                  disabled={fulfillMutation.isPending}
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("cancel")}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => handleCancel(e, params.row)}
                  disabled={cancelMutation.isPending}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      ),
    },
  ];

  const headerActions: ScreenHeaderAction[] = [
    {
      id: "refresh",
      label: t("refresh"),
      icon: <RefreshIcon />,
      onClick: handleRefresh,
    },
  ];

  return (
    <AppScreenContainer>
      <ScreenHeader
        icon={<RedeemIcon />}
        title={t("redemptions")}
        subtitle={t("loyalty@redemptionsSubtitle")}
        actions={headerActions}
      />

      {data.length === 0 && !isLoading && (
        <Alert severity="info" sx={{ mt: 3 }}>
          {t("loyalty@noRedemptions")}
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
          <TextField
            size="small"
            placeholder={t("search")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            sx={{ minWidth: 300 }}
          />

          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(_, value) => setStatusFilter(value)}
            size="small"
          >
            <ToggleButton value={undefined}>{t("all")}</ToggleButton>
            <ToggleButton value={1}>{t("pending")}</ToggleButton>
            <ToggleButton value={2}>{t("fulfilled")}</ToggleButton>
            <ToggleButton value={3}>{t("cancelled")}</ToggleButton>
          </ToggleButtonGroup>

          <Chip label={`${data.length} ${t("redemptions")}`} color="primary" />
        </Stack>

        <AppDataGrid
          data={paginatedData}
          columns={columns}
          loading={isLoading}
          disablePagination={false}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          total={data.length}
        />
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <RedeemIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {t("redemptionDetails")}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          {selectedRedemption && (
            <Stack spacing={3}>
              {/* Redemption Code Card */}
              <Card elevation={0} sx={{ bgcolor: "primary.50", borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {t("redemptionCode")}
                  </Typography>
                  <Typography variant="h5" fontWeight={700} fontFamily="monospace" color="primary.dark">
                    {selectedRedemption.redemptionCode}
                  </Typography>
                </CardContent>
              </Card>

              {/* User Info */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "secondary.main" }}>
                    <PersonIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t("user")}
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedRedemption.userName}
                    </Typography>
                  </Box>
                  <Box>
                    <Chip
                      label={getStatusLabel(selectedRedemption.status)}
                      color={getStatusColor(selectedRedemption.status)}
                      size="medium"
                    />
                  </Box>
                </Stack>
              </Paper>

              {/* Reward Info */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: "success.50", borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "success.main" }}>
                    <CardGiftcardIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t("reward")}
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedRedemption.rewardName}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Stats Grid */}
              <Grid container spacing={2}>
                {/* Points Spent */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "warning.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <StarsIcon sx={{ fontSize: 18, color: "warning.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("pointsSpent")}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={700} color="warning.dark">
                      {selectedRedemption.pointsSpent} pts
                    </Typography>
                  </Paper>
                </Grid>

                {/* Redeemed Date */}
                <Grid item xs={12} sm={6}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "info.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 18, color: "info.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("redeemedAt")}
                      </Typography>
                    </Stack>
                    <Typography variant="body1" fontWeight={600} color="info.dark">
                      {new Date(selectedRedemption.redeemedAt).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Fulfilled Date (if exists) */}
                {selectedRedemption.fulfilledAt && (
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={2} sx={{ p: 2, bgcolor: "success.50", borderRadius: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <CheckCircleIcon sx={{ fontSize: 18, color: "success.main" }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {t("fulfilledAt")}
                        </Typography>
                      </Stack>
                      <Typography variant="body1" fontWeight={600} color="success.dark">
                        {new Date(selectedRedemption.fulfilledAt).toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>

              {/* Provider Info (if exists) */}
              {selectedRedemption.providerType && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 1 }}>
                    {t("providerType")}
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedRedemption.providerType === "ChargingPoint"
                      ? t("chargingPoint")
                      : t("serviceProvider")}
                  </Typography>
                  {selectedRedemption.providerId && (
                    <>
                      <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>
                        {t("providerId")}
                      </Typography>
                      <Typography variant="body1">{selectedRedemption.providerId}</Typography>
                    </>
                  )}
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ gap: 1, px: 3, py: 2 }}>
          <Button onClick={() => setDetailDialogOpen(false)} size="large">
            {t("close")}
          </Button>
          {selectedRedemption && selectedRedemption.status === 1 && (
            <>
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<CancelIcon />}
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleCancel({} as React.MouseEvent, selectedRedemption);
                }}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircleIcon />}
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleFulfill({} as React.MouseEvent, selectedRedemption);
                }}
              >
                {t("fulfill")}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
