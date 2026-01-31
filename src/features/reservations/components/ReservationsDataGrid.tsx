import { memo, useState, useMemo } from "react";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import { ReservationResponse } from "../types/api";
import { AppDataGrid } from "../../../components";

interface ReservationsDataGridProps {
  data: ReservationResponse[];
  loading: boolean;
  total: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  onShowReservationDetails: (reservation: ReservationResponse) => void;
  onShowLicense: (reservation: ReservationResponse) => void;
  onShowPaymentInvoice: (reservation: ReservationResponse) => void;
  onShowOnMap: (reservation: ReservationResponse) => void;
}

const ReservationsDataGrid = ({
  data,
  loading,
  total,
  paginationModel,
  onPaginationModelChange,
  onShowReservationDetails,
  onShowLicense,
  onShowPaymentInvoice,
}: ReservationsDataGridProps) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuReservation, setMenuReservation] = useState<ReservationResponse | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, reservation: ReservationResponse) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuReservation(reservation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuReservation(null);
  };

  const handleShowDetails = () => {
    if (menuReservation) {
      onShowReservationDetails(menuReservation);
    }
    handleMenuClose();
  };

  const handleShowLicenseClick = () => {
    if (menuReservation) {
      onShowLicense(menuReservation);
    }
    handleMenuClose();
  };

  const handleShowPaymentInvoiceClick = () => {
    if (menuReservation) {
      onShowPaymentInvoice(menuReservation);
    }
    handleMenuClose();
  };



  const columns: GridColDef[] = useMemo(() => [
    {
      field: "reservationNumber",
      headerName: t("reservations@columns.reservationNumber"),
      minWidth: 140,
      width: 140,
      filterable: false,
      sortable: false,
    },
    {
      field: "reservationDate",
      headerName: t("reservations@columns.reservationDate"),
      minWidth: 120,
      width: 120,
      valueFormatter: (value) => value ? format(new Date(value), "dd/MM/yyyy") : "",
      filterable: false,
      sortable: false,
    },
    {
      field: "amount",
      headerName: t("reservations@columns.amount"),
      minWidth: 90,
      width: 90,
      valueFormatter: (value) => value ? `${value} KWD` : "",
      filterable: false,
      sortable: false,
    },
    {
      field: "campingSeason",
      headerName: t("reservations@columns.campingSeason"),
      minWidth: 120,
      width: 120,
      valueGetter: (value, row) => row.campingSeason?.name || "",
      filterable: false,
      sortable: false,
    },
    {
      field: "reservationStatus",
      headerName: t("reservations@columns.status"),
      minWidth: 100,
      width: 200,
      valueGetter: (value, row) => row.reservationStatus?.name || "",
      filterable: false,
      sortable: false,
    },
    {
      field: "user",
      headerName: t("reservations@columns.user"),
      minWidth: 120,
      width: 120,
      valueGetter: (value, row) => row.user?.name || "",
      filterable: false,
      sortable: false,
    },
    {
      field: "civilId",
      headerName: t("reservations@columns.civilId"),
      minWidth: 140,
      width: 140,
      valueGetter: (value, row) => row.user?.civilId || "",
      filterable: false,
      sortable: false,
    },
    {
      field: "phone",
      headerName: t("reservations@columns.phone"),
      minWidth: 120,
      width: 120,
      valueGetter: (value, row) => row.user?.phone || "",
      filterable: false,
      sortable: false,
    },
    {
      field: "applicationRole",
      headerName: t("reservations@columns.applicationRole"),
      minWidth: 140,
      width: 140,
      valueGetter: (value, row) => row.user?.applicationRole?.name || "",
      filterable: false,
      sortable: false,
    },
    {
      field: "isPaid",
      headerName: t("reservations@columns.isPaid"),
      minWidth: 100,
      width: 100,
      valueGetter: (value, row) => row.paymentStatus === "Success" ? "Yes" : "No",
      filterable: false,
      sortable: false,
    },
    {
      field: "actions",
      headerName: t("reservations@columns.actions"),
      minWidth: 80,
      width: 80,
      filterable: false,
      sortable: false,
      disableExport: true,
      disableColumnMenu: true,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(event) => handleMenuOpen(event, params.row)}
          aria-label={t("reservations@actions.openMenu")}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ], [t, handleMenuOpen]);

  return (
    <>
      <AppDataGrid
        data={data}
        columns={columns}
        loading={loading}
        total={total}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          zIndex: 9999,
          "& .MuiPaper-root": {
            zIndex: 9999,
          },
        }}
      >
        <MenuItem onClick={handleShowDetails}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("reservations@actions.viewDetails")} />
        </MenuItem>
        <MenuItem onClick={handleShowLicenseClick}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("reservations@actions.showLicense")} />
        </MenuItem>
        <MenuItem onClick={handleShowPaymentInvoiceClick}>
          <ListItemIcon>
            <ReceiptIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("reservations@actions.showPaymentInvoice")} />
        </MenuItem>
      </Menu>
    </>
  );
};

export default memo(ReservationsDataGrid);