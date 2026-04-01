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
import EvStationIcon from "@mui/icons-material/EvStation";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
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
  const { t } = useTranslation(["offers", "common"]);
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
        subtitle={t("offers@pendingOffers_subtitle")}
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
        PaperProps={{ sx: { borderRadius: 3, display: "flex", flexDirection: "column", maxHeight: "90vh" } }}
      >
        {/* Gradient Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            px: 3,
            pt: 3,
            pb: 4,
            position: "relative",
            flexShrink: 0,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.25)", width: 52, height: 52, mt: 0.5 }}>
              <LocalOfferIcon sx={{ color: "white", fontSize: 28 }} />
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" fontWeight={800} color="white" sx={{ lineHeight: 1.2 }}>
                {selectedOffer?.title}
              </Typography>
              {selectedOffer?.titleAr && (
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", mt: 0.5 }}>
                  {selectedOffer.titleAr}
                </Typography>
              )}
              <Chip
                label={t("pending")}
                size="small"
                sx={{ mt: 1, bgcolor: "rgba(255,255,255,0.25)", color: "white", fontWeight: 700 }}
              />
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ py: 3, overflowY: "auto", flex: 1, mt: -1 }}>
          {selectedOffer && (
            <Stack spacing={2.5}>
              {/* Provider + Proposed By row */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, height: "100%" }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor:
                            selectedOffer.providerType === "ChargingPoint"
                              ? "primary.main"
                              : "secondary.main",
                          width: 40,
                          height: 40,
                        }}
                      >
                        {selectedOffer.providerType === "ChargingPoint" ? (
                          <EvStationIcon fontSize="small" />
                        ) : (
                          <BusinessIcon fontSize="small" />
                        )}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {t("provider")}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                          {selectedOffer.providerName}
                        </Typography>
                        <Chip
                          label={
                            selectedOffer.providerType === "ChargingPoint"
                              ? t("chargingPoint")
                              : t("serviceProvider")
                          }
                          size="small"
                          color={
                            selectedOffer.providerType === "ChargingPoint" ? "primary" : "secondary"
                          }
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, height: "100%" }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: "purple", width: 40, height: 40 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {t("proposedBy")}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {selectedOffer.proposedByUserName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(selectedOffer.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {/* Stats Grid */}
              <Grid container spacing={1.5}>
                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "primary.50",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "primary.100",
                      textAlign: "center",
                    }}
                  >
                    <StarsIcon sx={{ fontSize: 28, color: "primary.main", mb: 0.5 }} />
                    <Typography variant="h5" fontWeight={800} color="primary.dark">
                      {selectedOffer.pointsCost}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t("pointsCost")}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "success.50",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "success.100",
                      textAlign: "center",
                    }}
                  >
                    <AttachMoneyIcon sx={{ fontSize: 28, color: "success.main", mb: 0.5 }} />
                    <Typography variant="h5" fontWeight={800} color="success.dark">
                      {selectedOffer.monetaryValue}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                        {selectedOffer.currencyCode}
                      </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t("monetaryValue")}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "warning.50",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "warning.100",
                      textAlign: "center",
                    }}
                  >
                    <TimerIcon sx={{ fontSize: 28, color: "warning.main", mb: 0.5 }} />
                    <Typography variant="h5" fontWeight={800} color="warning.dark">
                      {selectedOffer.offerCodeExpirySeconds}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                        {t("offers@seconds")}
                      </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t("codeExpiry")}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "error.50",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "error.100",
                      textAlign: "center",
                    }}
                  >
                    <PeopleIcon sx={{ fontSize: 28, color: "error.main", mb: 0.5 }} />
                    <Typography variant="h5" fontWeight={800} color="error.dark">
                      {selectedOffer.maxUsesPerUser ?? "∞"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t("maxUsesPerUser")}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Validity Period */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: "grey.50",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: "primary.main",
                      borderRadius: 1.5,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <CalendarTodayIcon sx={{ fontSize: 20, color: "white" }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {t("validPeriod")}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Chip
                        label={new Date(selectedOffer.validFrom).toLocaleDateString()}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                      <Typography variant="body2" color="text.secondary">→</Typography>
                      <Chip
                        label={new Date(selectedOffer.validTo).toLocaleDateString()}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </Stack>
                  </Box>
                  {selectedOffer.maxTotalUses && (
                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {t("offers@maxTotalUses")}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {selectedOffer.maxTotalUses}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>

              {/* Description */}
              {selectedOffer.description && (
                <Paper
                  elevation={0}
                  sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                    {t("description")}
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    {selectedOffer.description}
                  </Typography>
                  {selectedOffer.descriptionAr && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} dir="rtl">
                      {selectedOffer.descriptionAr}
                    </Typography>
                  )}
                </Paper>
              )}
            </Stack>
          )}
        </DialogContent>

        <Divider sx={{ flexShrink: 0 }} />
        <DialogActions sx={{ px: 3, py: 2, gap: 1, flexShrink: 0 }}>
          <Button onClick={() => setDetailDialogOpen(false)} size="large" sx={{ mr: "auto" }}>
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
                startIcon={
                  approveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />
                }
                disabled={approveMutation.isPending}
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
      <Dialog
        open={rejectDialogOpen}
        onClose={() => !rejectMutation.isPending && setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {/* Red gradient header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
            px: 3,
            pt: 2.5,
            pb: 3,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}>
              <WarningAmberIcon sx={{ color: "white" }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} color="white">
                {t("rejectOffer")}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                {selectedOffer?.title}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            <Alert severity="warning" variant="outlined">
              {t("offers@rejectConfirmation")}: <strong>{selectedOffer?.title}</strong>
            </Alert>
            <TextField
              label={t("rejectReason")}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              multiline
              rows={4}
              required
              fullWidth
              placeholder={t("offers@rejectReasonPlaceholder")}
              disabled={rejectMutation.isPending}
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setRejectDialogOpen(false)}
            disabled={rejectMutation.isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirmReject}
            variant="contained"
            color="error"
            size="large"
            disabled={rejectMutation.isPending}
            startIcon={
              rejectMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <CancelIcon />
            }
          >
            {t("confirmReject")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
