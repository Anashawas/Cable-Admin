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
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { AppDataGrid } from "../../../components";
import { Role } from "../types/api";

interface RolesDataGridProps {
  data: Role[];
  loading: boolean;
  total: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  onShowRoleDetails: (role: Role) => void;
  onEditRole: (role: Role) => void;
  onDeleteRole: (role: Role) => void;
}

const RolesDataGrid = ({
  data,
  loading,
  total,
  paginationModel,
  onPaginationModelChange,
  onShowRoleDetails,
  onEditRole,
  onDeleteRole,
}: RolesDataGridProps) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRole, setMenuRole] = useState<Role | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, role: Role) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuRole(role);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRole(null);
  };

  const handleShowDetails = () => {
    if (menuRole) {
      onShowRoleDetails(menuRole);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (menuRole) {
      onEditRole(menuRole);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (menuRole) {
      onDeleteRole(menuRole);
    }
    handleMenuClose();
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: "name",
      headerName: t("roles@columns.name"),
      minWidth: 200,
      width: 200,
      flex: 1,
      filterable: false,
      sortable: false,
    },
    {
      field: "actions",
      headerName: t("roles@columns.actions"),
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
          aria-label={t("roles@actions.openMenu")}
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
          <ListItemText primary={t("roles@actions.viewDetails")} />
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("roles@actions.edit")} />
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("roles@actions.delete")} />
        </MenuItem>
      </Menu>
    </>
  );
};

export default memo(RolesDataGrid);
