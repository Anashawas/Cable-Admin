import { memo, useState, useMemo } from "react";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { AppDataGrid } from "../../../components";
import { CampingSeason } from "../types/api";

interface CampingSeasonsDataGridProps {
  data: CampingSeason[];
  loading: boolean;
  total: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  onShowCampingSeasonDetails: (campingSeason: CampingSeason) => void;
  onEditCampingSeason: (campingSeason: CampingSeason) => void;
  onDeleteCampingSeason: (campingSeason: CampingSeason) => void;
}


const CampingSeasonsDataGrid = ({
  data,
  loading,
  total,
  paginationModel,
  onPaginationModelChange,
  onShowCampingSeasonDetails,
  onEditCampingSeason,
  onDeleteCampingSeason,
}: CampingSeasonsDataGridProps) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuCampingSeason, setMenuCampingSeason] =
    useState<CampingSeason | null>(null);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    campingSeason: CampingSeason
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuCampingSeason(campingSeason);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCampingSeason(null);
  };

  const handleShowDetails = () => {
    if (menuCampingSeason) {
      onShowCampingSeasonDetails(menuCampingSeason);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (menuCampingSeason) {
      onEditCampingSeason(menuCampingSeason);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (menuCampingSeason) {
      onDeleteCampingSeason(menuCampingSeason);
    }
    handleMenuClose();
  };

  // Check if a camping season is currently active (current date within its range)
  const isCampingSeasonActive = (campingSeason: CampingSeason): boolean => {
    const now = new Date();
    const fromDate = new Date(campingSeason.fromDate);
    const toDate = new Date(campingSeason.toDate);
    return now >= fromDate && now <= toDate;
  };

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "name",
        headerName: t("campingSeasons@columns.name"),
        minWidth: 200,
        width: 200,
        filterable: false,
        sortable: false,
      },
      {
        field: "fromDate",
        headerName: t("campingSeasons@columns.fromDate"),
        minWidth: 150,
        width: 150,
        filterable: false,
        sortable: false,
      },
      {
        field: "toDate",
        headerName: t("campingSeasons@columns.toDate"),
        minWidth: 150,
        width: 150,
        filterable: false,
        sortable: false,
      },
      {
        field: "campingSeasonStatus",
        headerName: t("campingSeasons@columns.status"),
        minWidth: 150,
        width: 150,
        valueGetter: (value, row) => row.campingSeasonStatus?.name || "",
        filterable: false,
        sortable: false,
      },
      {
        field: "isDeleted",
        headerName: t("campingSeasons@columns.isDeleted"),
        minWidth: 120,
        width: 120,
        valueGetter: (value) =>
          value
            ? t("campingSeasons@columns.deleted")
            : t("campingSeasons@columns.active"),
        filterable: false,
        sortable: false,
      },
      {
        field: "actions",
        headerName: t("campingSeasons@columns.actions"),
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
            aria-label={t("campingSeasons@actions.openMenu")}
          >
            <MoreVertIcon />
          </IconButton>
        ),
      },
    ],
    [t]
  );

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
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
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
          <ListItemText primary={t("campingSeasons@actions.viewDetails")} />
        </MenuItem>
        <MenuItem
          onClick={handleEdit}
          disabled={
            menuCampingSeason ? isCampingSeasonActive(menuCampingSeason) : false
          }
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("campingSeasons@actions.edit")} />
        </MenuItem>
        <MenuItem
          onClick={handleDelete}
          disabled={
            menuCampingSeason ? isCampingSeasonActive(menuCampingSeason) : false
          }
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("campingSeasons@actions.delete")} />
        </MenuItem>
      </Menu>
    </>
  );
};

export default memo(CampingSeasonsDataGrid);
