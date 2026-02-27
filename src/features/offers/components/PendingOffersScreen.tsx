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
  Card,
  CardContent,
  Divider,
  Avatar,
  Paper,
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import StarsIcon from "@mui/icons-material/Stars";
import StoreIcon from "@mui/icons-material/Store";
import TimerIcon from "@mui/icons-material/Timer";
import PeopleIcon from "@mui/icons-material/People";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  usePendingOffers,
  useApproveOffer,
  useRejectOffer,
} from "../hooks/use-offers";
import type { OfferDto } from "../types/api";

export default function PendingOffersScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const {
    data,
    isLoading,
    search,
    handleSearchChange,
    handleRefresh,
  } = usePendingOffers();

  const approveMutation = useApproveOffer();
  const rejectMutation = useRejectOffer();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferDto | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return data.slice(start, start + paginationModel.pageSize);
  }, [data, paginationModel.page, paginationModel.pageSize]);

  const handleViewDetails = useCallback((e: React.MouseEvent, row: OfferDto) => {
    e.stopPropagation();
    setSelectedOffer(row);
    setDetailDialogOpen(true);
  }, []);

  const handleApprove = useCallback(
    (e: React.MouseEvent, row: OfferDto) => {
      e.stopPropagation();
      approveMutation.mutate(row.id, {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("offers@approved") });
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      });
    },
    [approveMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const handleRejectClick = useCallback((e: React.MouseEvent, row: OfferDto) => {
    e.stopPropagation();
    setSelectedOffer(row);
    setRejectNote("");
    setRejectDialogOpen(true);
  }, []);

  const handleConfirmReject = useCallback(() => {
    if (!selectedOffer) return;

    if (!rejectNote.trim()) {
      openErrorSnackbar({ message: t("offers@rejectNoteRequired") });
      return;
    }

    rejectMutation.mutate(
      { id: selectedOffer.id, data: { note: rejectNote } },
      {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("offers@rejected") });
          setRejectDialogOpen(false);
          setSelectedOffer(null);
          setRejectNote("");
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      }
    );
  }, [selectedOffer, rejectNote, rejectMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const columns: GridColDef<OfferDto>[] = [
    {
      field: "id",
      headerName: t("id"),
      width: 70,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "title",
      headerName: t("offerTitle"),
      flex: 1,
      minWidth: 200,
    },
    {
      field: "providerName",
      headerName: t("provider"),
      width: 180,
    },
    {
      field: "providerType",
      headerName: t("providerType"),
      width: 140,
      renderCell: (params) => (
        <Chip
          label={
            params.value === "ChargingPoint" ? t("chargingPoint") : t("serviceProvider")
          }
          size="small"
          color={params.value === "ChargingPoint" ? "primary" : "secondary"}
        />
      ),
    },
    {
      field: "pointsCost",
      headerName: t("pointsCost"),
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Chip label={`${params.value} pts`} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      field: "monetaryValue",
      headerName: t("monetaryValue"),
      width: 140,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => `${params.value} ${params.row.currencyCode}`,
    },
    {
      field: "proposedByUserName",
      headerName: t("proposedBy"),
      width: 150,
    },
    {
      field: "createdAt",
      headerName: t("createdAt"),
      width: 160,
      valueFormatter: (value) => new Date(value).toLocaleString(),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 180,
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
          <Tooltip title={t("approve")}>
            <IconButton
              size="small"
              color="success"
              onClick={(e) => handleApprove(e, params.row)}
              disabled={approveMutation.isPending}
            >
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("reject")}>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => handleRejectClick(e, params.row)}
              disabled={rejectMutation.isPending}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
        icon={<PendingActionsIcon />}
        title={t("pendingOffers")}
        subtitle={t("pendingOffers@subtitle")}
        actions={headerActions}
      />

      {data.length === 0 && !isLoading && (
        <Alert severity="info" sx={{ mt: 3 }}>
          {t("offers@noPendingOffers")}
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder={t("search")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            sx={{ minWidth: 300 }}
          />
          <Chip label={`${data.length} ${t("pendingOffers")}`} color="warning" />
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
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "warning.main" }}>
              <PendingActionsIcon />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              {t("offerDetails")}
            </Typography>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3 }}>
          {selectedOffer && (
            <Stack spacing={3}>
              {/* Title Card */}
              <Card elevation={0} sx={{ bgcolor: "primary.50", borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h5" fontWeight={700} color="primary.dark" gutterBottom>
                    {selectedOffer.title}
                  </Typography>
                  {selectedOffer.titleAr && (
                    <Typography variant="body1" color="text.secondary">
                      {selectedOffer.titleAr}
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Provider Info */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "secondary.main" }}>
                    <StoreIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {t("provider")}
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedOffer.providerName}
                    </Typography>
                    <Chip
                      label={
                        selectedOffer.providerType === "ChargingPoint"
                          ? t("chargingPoint")
                          : t("serviceProvider")
                      }
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Stack>
              </Paper>

              {/* Stats Grid */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "info.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <StarsIcon sx={{ fontSize: 20, color: "info.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("pointsCost")}
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="info.dark">
                      {selectedOffer.pointsCost}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                        pts
                      </Typography>
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "success.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <AttachMoneyIcon sx={{ fontSize: 20, color: "success.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("monetaryValue")}
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="success.dark">
                      {selectedOffer.monetaryValue}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                        {selectedOffer.currencyCode}
                      </Typography>
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "warning.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <TimerIcon sx={{ fontSize: 20, color: "warning.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("codeExpiry")}
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="warning.dark">
                      {selectedOffer.offerCodeExpiryMinutes}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                        {t("minutes")}
                      </Typography>
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "error.50", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <PeopleIcon sx={{ fontSize: 20, color: "error.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("maxUsesPerUser")}
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="error.dark">
                      {selectedOffer.maxUsesPerUser ?? t("unlimited")}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Validity Period */}
              <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.100", borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarTodayIcon sx={{ fontSize: 20, color: "primary.main" }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t("validPeriod")}
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {new Date(selectedOffer.validFrom).toLocaleDateString()} -{" "}
                      {new Date(selectedOffer.validTo).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Description */}
              {selectedOffer.description && (
                <Paper elevation={0} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom>
                    {t("description")}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {selectedOffer.description}
                  </Typography>
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setDetailDialogOpen(false)}
            variant="outlined"
            size="large"
          >
            {t("close")}
          </Button>
          {selectedOffer && (
            <>
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<CancelIcon />}
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleRejectClick({} as React.MouseEvent, selectedOffer);
                }}
              >
                {t("reject")}
              </Button>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircleIcon />}
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleApprove({} as React.MouseEvent, selectedOffer);
                }}
              >
                {t("approve")}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("rejectOffer")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Typography>
              {t("offers@rejectConfirmation")}: <strong>{selectedOffer?.title}</strong>
            </Typography>
            <TextField
              label={t("rejectReason")}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              multiline
              rows={3}
              required
              fullWidth
              placeholder={t("offers@rejectReasonPlaceholder")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>{t("cancel")}</Button>
          <Button
            onClick={handleConfirmReject}
            variant="contained"
            color="error"
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? <CircularProgress size={20} /> : t("confirmReject")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
