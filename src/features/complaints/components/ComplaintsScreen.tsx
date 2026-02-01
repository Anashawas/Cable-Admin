import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid } from "../../../components";
import { getAllComplaints, deleteComplaint } from "../services/complaints-service";
import type { UserComplaintDto } from "../types/api";
import { useSnackbarStore } from "../../../stores";

function formatUserDisplay(row: UserComplaintDto): string {
  const u = row.userAccount;
  if (!u) return "—";
  const name = u.name?.trim();
  return name ? `${name} (ID: ${u.id})` : `User #${u.id}`;
}

function formatStationDisplay(row: UserComplaintDto): string {
  const s = row.chargingPoint;
  if (!s) return "—";
  const name = s.name?.trim();
  return name ? `${name} (ID: ${s.id})` : `Station #${s.id}`;
}

export default function ComplaintsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] =
    useState<UserComplaintDto | null>(null);

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["complaints"],
    queryFn: ({ signal }) => getAllComplaints(signal),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteComplaint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      openSuccessSnackbar({ message: t("complaints@deleted") });
      setDeleteDialogOpen(false);
      setComplaintToDelete(null);
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return data.slice(start, start + paginationModel.pageSize);
  }, [data, paginationModel.page, paginationModel.pageSize]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, row: UserComplaintDto) => {
      e.stopPropagation();
      setComplaintToDelete(row);
      setDeleteDialogOpen(true);
    },
    []
  );

  const handleCloseDeleteDialog = useCallback(() => {
    if (!deleteMutation.isPending) {
      setDeleteDialogOpen(false);
      setComplaintToDelete(null);
    }
  }, [deleteMutation.isPending]);

  const handleConfirmDelete = useCallback(() => {
    if (complaintToDelete) {
      deleteMutation.mutate(complaintToDelete.id);
    }
  }, [complaintToDelete, deleteMutation]);

  const columns: GridColDef<UserComplaintDto>[] = useMemo(
    () => [
      {
        field: "id",
        headerName: t("complaints@columns.id"),
        width: 70,
        minWidth: 70,
        filterable: false,
        sortable: true,
      },
      {
        field: "user",
        headerName: t("complaints@columns.user"),
        minWidth: 180,
        flex: 0.5,
        valueGetter: (_, row) => formatUserDisplay(row),
        filterable: false,
        sortable: false,
      },
      {
        field: "station",
        headerName: t("complaints@columns.station"),
        minWidth: 180,
        flex: 0.5,
        valueGetter: (_, row) => formatStationDisplay(row),
        filterable: false,
        sortable: false,
      },
      {
        field: "note",
        headerName: t("complaints@columns.note"),
        minWidth: 200,
        flex: 1,
        filterable: false,
        sortable: false,
        renderCell: ({ row }) => (
          <Box
            sx={{
              whiteSpace: "normal",
              wordBreak: "break-word",
              py: 0.5,
              alignSelf: "center",
            }}
          >
            {row.note ?? "—"}
          </Box>
        ),
      },
      {
        field: "actions",
        headerName: t("complaints@columns.actions"),
        width: 80,
        minWidth: 80,
        filterable: false,
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => (
          <Tooltip title={t("complaints@actions.delete")}>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => handleDeleteClick(e, row)}
              aria-label={t("complaints@actions.delete")}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [t, handleDeleteClick]
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
            title={t("complaints@title")}
            actions={headerActions}
          />

          <AppDataGrid<UserComplaintDto>
            data={paginatedData}
            columns={columns}
            loading={isLoading}
            getRowId={(row) => row.id}
            disablePagination={false}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            total={data.length}
            minHeight="70vh"
          />
        </Stack>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 10002 }}
      >
        <DialogTitle>{t("complaints@deleteConfirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography>{t("complaints@deleteConfirmMessage")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteDialog}
            color="inherit"
            disabled={deleteMutation.isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("delete")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
