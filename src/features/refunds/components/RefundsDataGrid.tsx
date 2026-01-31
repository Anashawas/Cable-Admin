import { memo, useMemo } from "react";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { IconButton } from "@mui/material";
import { Visibility as VisibilityIcon } from "@mui/icons-material";
import { AppDataGrid } from "../../../components";
import { ReservationResponse } from "../../reservations/types/api";

interface RefundsDataGridProps {
  data: ReservationResponse[];
  loading: boolean;
  total: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  onShowRefundDetails: (refund: ReservationResponse) => void;
}

const RefundsDataGrid = ({
  data,
  loading,
  total,
  paginationModel,
  onPaginationModelChange,
  onShowRefundDetails,
}: RefundsDataGridProps) => {
  const { t } = useTranslation();

  const handleShowDetails = (event: React.MouseEvent<HTMLElement>, refund: ReservationResponse) => {
    event.stopPropagation();
    onShowRefundDetails(refund);
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: "reservationNumber",
      headerName: t("refunds@columns.reservationNumber"),
      minWidth: 140,
      width: 140,
      filterable: false,
      sortable: false,
    },
    {
      field: "paymentDate",
      headerName: t("refunds@columns.paymentDate"),
      minWidth: 120,
      width: 120,
      valueFormatter: (value) => value ? format(new Date(value), "dd/MM/yyyy") : "",
      filterable: false,
      sortable: false,
    },
    {
      field: "paymentReference",
      headerName: t("refunds@columns.paymentReference"),
      minWidth: 140,
      width: 140,
      valueGetter: (value, row) => row.ibanNumber || "",
      filterable: false,
      sortable: false,
    },
    {
      field: "paymentStatus",
      headerName: t("refunds@columns.paymentStatus"),
      minWidth: 120,
      width: 120,
      filterable: false,
      sortable: false,
    },
    {
      field: "status",
      headerName: t("refunds@columns.status"),
      minWidth: 200,
      width: 200,
      valueGetter: (value, row) => row.reservationStatus?.name || "",
      filterable: false,
      sortable: false,
    },
    {
      field: "amount",
      headerName: t("refunds@columns.amount"),
      minWidth: 90,
      width: 90,
      valueFormatter: (value) => value ? `${value} KWD` : "",
      filterable: false,
      sortable: false,
    },
    {
      field: "userName",
      headerName: t("refunds@columns.userName"),
      minWidth: 150,
      width: 150,
      valueGetter: (value, row) => row.user?.name || "",
      filterable: false,
      sortable: false,
    },
    {
      field: "civilId",
      headerName: t("refunds@columns.civilId"),
      minWidth: 140,
      width: 140,
      valueGetter: (value, row) => row.user?.civilId || "",
      filterable: false,
      sortable: false,
    },
    {
      field: "phone",
      headerName: t("refunds@columns.phone"),
      minWidth: 120,
      width: 120,
      valueGetter: (value, row) => row.user?.phone || "",
      filterable: false,
      sortable: false,
    },
    {
      field: "actions",
      headerName: t("refunds@columns.actions"),
      minWidth: 80,
      width: 80,
      filterable: false,
      sortable: false,
      disableExport: true,
      disableColumnMenu: true,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(event) => handleShowDetails(event, params.row)}
          aria-label={t("refunds@actions.viewDetails")}
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ], [t]);

  return (
    <AppDataGrid
      data={data}
      columns={columns}
      loading={loading}
      total={total}
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
    />
  );
};

export default memo(RefundsDataGrid);
