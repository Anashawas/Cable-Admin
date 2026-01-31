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
import { User } from "../types/api";

interface UsersDataGridProps {
  data: User[];
  loading: boolean;
  total: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  onShowUserDetails: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

const UsersDataGrid = ({
  data,
  loading,
  total,
  paginationModel,
  onPaginationModelChange,
  onShowUserDetails,
  onEditUser,
  onDeleteUser,
}: UsersDataGridProps) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = useState<User | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const handleShowDetails = () => {
    if (menuUser) {
      onShowUserDetails(menuUser);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (menuUser) {
      onEditUser(menuUser);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (menuUser) {
      onDeleteUser(menuUser);
    }
    handleMenuClose();
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: "name",
      headerName: t("users@columns.name"),
      minWidth: 180,
      width: 180,
      filterable: false,
      sortable: false,
    },
    {
      field: "userName",
      headerName: t("users@columns.userName"),
      minWidth: 150,
      width: 150,
      filterable: false,
      sortable: false,
    },
    {
      field: "email",
      headerName: t("users@columns.email"),
      minWidth: 200,
      width: 200,
      filterable: false,
      sortable: false,
    },
    {
      field: "phone",
      headerName: t("users@columns.phone"),
      minWidth: 140,
      width: 140,
      filterable: false,
      sortable: false,
    },
    {
      field: "civilId",
      headerName: t("users@columns.civilId"),
      minWidth: 140,
      width: 140,
      filterable: false,
      sortable: false,
    },
    {
      field: "role",
      headerName: t("users@columns.role"),
      minWidth: 150,
      width: 150,
      valueGetter: (value, row) => row.role?.name || "",
      filterable: false,
      sortable: false,
    },
    {
      field: "governorate",
      headerName: t("users@columns.governorate"),
      minWidth: 150,
      width: 150,
      valueGetter: (value, row) => row.governorate?.name || "",
      filterable: false,
      sortable: false,
    },
    {
      field: "isActive",
      headerName: t("users@columns.isActive"),
      minWidth: 100,
      width: 100,
      valueGetter: (value) => value ? t("users@columns.active") : t("users@columns.inactive"),
      filterable: false,
      sortable: false,
    },
    {
      field: "actions",
      headerName: t("users@columns.actions"),
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
          aria-label={t("users@actions.openMenu")}
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
          <ListItemText primary={t("users@actions.viewDetails")} />
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("users@actions.edit")} />
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("users@actions.delete")} />
        </MenuItem>
      </Menu>
    </>
  );
};

export default memo(UsersDataGrid);
