import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Grid,
} from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import RefreshIcon from "@mui/icons-material/Refresh";
import { format } from "date-fns";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid } from "../../../components";
import {
  getPendingRequests,
  approveRequest,
  rejectRequest,
} from "../services/request-service";
import type { UpdateRequestDto } from "../types/api";
import { useSnackbarStore } from "../../../stores";

function getStatusChipColor(
  status: string | null | undefined
): "warning" | "success" | "error" | "default" {
  if (!status) return "default";
  const s = status.toLowerCase();
  if (s === "pending") return "warning";
  if (s === "approved") return "success";
  if (s === "rejected") return "error";
  return "default";
}

export default function StationsRequestScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["stations-request", "pending", statusFilter || null],
    queryFn: ({ signal }) =>
      getPendingRequests(statusFilter.trim() || null, signal),
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: number) => approveRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations-request"] });
      openSuccessSnackbar({ message: t("stationsRequest@approved") });
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: number) => rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations-request"] });
      openSuccessSnackbar({ message: t("stationsRequest@rejected") });
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return data.slice(start, start + paginationModel.pageSize);
  }, [data, paginationModel.page, paginationModel.pageSize]);

  const stationId = useCallback((row: UpdateRequestDto) => {
    return row.chargingPointId ?? row.chargingPoint?.id ?? 0;
  }, []);

  const handleRowClick = useCallback(
    (params: { row: UpdateRequestDto }) => {
      const sid = stationId(params.row);
      if (sid > 0) navigate(`/charge-management/edit/${sid}`);
    },
    [navigate, stationId]
  );

  const handleApprove = useCallback(
    (e: React.MouseEvent, requestId: number) => {
      e.stopPropagation();
      approveMutation.mutate(requestId);
    },
    [approveMutation]
  );

  const handleReject = useCallback(
    (e: React.MouseEvent, requestId: number) => {
      e.stopPropagation();
      rejectMutation.mutate(requestId);
    },
    [rejectMutation]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent, row: UpdateRequestDto) => {
      e.stopPropagation();
      const sid = stationId(row);
      if (sid > 0) navigate(`/charge-management/edit/${sid}`);
    },
    [navigate, stationId]
  );

  const handleMedia = useCallback(
    (e: React.MouseEvent, row: UpdateRequestDto) => {
      e.stopPropagation();
      const sid = stationId(row);
      if (sid > 0) navigate(`/charge-management/${sid}/media`);
    },
    [navigate, stationId]
  );

  const columns: GridColDef<UpdateRequestDto>[] = useMemo(
    () => [
      {
        field: "id",
        headerName: t("stationsRequest@columns.requestId"),
        width: 100,
        minWidth: 90,
        filterable: false,
        sortable: true,
      },
      {
        field: "stationName",
        headerName: t("stationsRequest@columns.stationName"),
        minWidth: 200,
        flex: 1,
        valueGetter: (_, row) => row.chargingPoint?.name ?? "—",
        filterable: false,
        sortable: false,
      },
      {
        field: "status",
        headerName: t("stationsRequest@columns.status"),
        minWidth: 110,
        width: 110,
        filterable: false,
        sortable: false,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            label={row.status ?? "—"}
            color={getStatusChipColor(row.status)}
            variant="filled"
          />
        ),
      },
      {
        field: "requestedAt",
        headerName: t("stationsRequest@columns.requestedAt"),
        minWidth: 160,
        width: 160,
        valueFormatter: (value) =>
          value ? format(new Date(value), "dd/MM/yyyy HH:mm") : "—",
        filterable: false,
        sortable: true,
      },
      {
        field: "actions",
        headerName: t("stationsRequest@columns.actions"),
        width: 180,
        minWidth: 180,
        filterable: false,
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => (
          <Stack
            direction="row"
            spacing={0.5}
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip title={t("stationsRequest@actions.approve")}>
              <IconButton
                size="small"
                color="success"
                onClick={(e) => handleApprove(e, row.id)}
                disabled={approveMutation.isPending}
                aria-label={t("stationsRequest@actions.approve")}
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("stationsRequest@actions.reject")}>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => handleReject(e, row.id)}
                disabled={rejectMutation.isPending}
                aria-label={t("stationsRequest@actions.reject")}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("stationsRequest@actions.edit")}>
              <IconButton
                size="small"
                onClick={(e) => handleEdit(e, row)}
                aria-label={t("stationsRequest@actions.edit")}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("stationsRequest@actions.media")}>
              <IconButton
                size="small"
                onClick={(e) => handleMedia(e, row)}
                aria-label={t("stationsRequest@actions.media")}
              >
                <PhotoLibraryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [
      t,
      handleApprove,
      handleReject,
      handleEdit,
      handleMedia,
      approveMutation.isPending,
      rejectMutation.isPending,
    ]
  );

  const headerActions: ScreenHeaderAction[] = useMemo(
    () => [
      {
        id: "refresh",
        icon: <RefreshIcon />,
        label: t("refresh"),
        onClick: () => refetch(),
      },
    ],
    [t, refetch]
  );

  if (error) {
    return (
      <AppScreenContainer>
        <Box p={2}>
          <Typography color="error">{t("loadingFailed")}</Typography>
        </Box>
      </AppScreenContainer>
    );
  }

  return (
    <AppScreenContainer>
      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          boxSizing: "border-box",
          p: { xs: 1, sm: 2 },
        }}
      >
        <Stack spacing={2} sx={{ width: "100%", minWidth: 0 }}>
          <ScreenHeader
            title={t("stationsRequest@title")}
            actions={headerActions}
          />

          <TextField
            size="small"
            label={t("stationsRequest@filterByStatus")}
            placeholder={t("stationsRequest@filterPlaceholder")}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ maxWidth: 280 }}
          />

          <AppDataGrid<UpdateRequestDto>
            data={paginatedData}
            columns={columns}
            loading={isLoading}
            getRowId={(row) => row.id}
            onRowClick={handleRowClick}
            disablePagination={false}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            total={data.length}
            minHeight="70vh"
          />
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
