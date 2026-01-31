import { memo, useState, useMemo } from "react";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
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
} from "@mui/icons-material";
import { AppDataGrid } from "../../../components";

interface CampingConfigurationsDataGridProps {
  data: any[];
  loading: boolean;
  total: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  onShowCampingConfigurationDetails: (campingConfiguration: any) => void;
}

const CampingConfigurationsDataGrid = ({
  data,
  loading,
  total,
  paginationModel,
  onPaginationModelChange,
  onShowCampingConfigurationDetails,
}: CampingConfigurationsDataGridProps) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuCampingConfiguration, setMenuCampingConfiguration] = useState<any | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, campingConfiguration: any) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuCampingConfiguration(campingConfiguration);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCampingConfiguration(null);
  };

  const handleShowDetails = () => {
    if (menuCampingConfiguration) {
      onShowCampingConfigurationDetails(menuCampingConfiguration);
    }
    handleMenuClose();
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: "name",
      headerName: t("campingConfigurations@columns.name"),
      minWidth: 200,
      width: 200,
      filterable: false,
      sortable: false,
    },
    {
      field: "value",
      headerName: t("campingConfigurations@columns.value"),
      minWidth: 250,
      width: 250,
      filterable: false,
      sortable: false,
    },
    {
      field: "description",
      headerName: t("campingConfigurations@columns.description"),
      minWidth: 300,
      width: 300,
      filterable: false,
      sortable: false,
    },
    {
      field: "actions",
      headerName: t("campingConfigurations@columns.actions"),
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
          aria-label={t("campingConfigurations@actions.openMenu")}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ], [t]);

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
          <ListItemText primary={t("campingConfigurations@actions.viewDetails")} />
        </MenuItem>
      </Menu>
    </>
  );
};

export default memo(CampingConfigurationsDataGrid);
