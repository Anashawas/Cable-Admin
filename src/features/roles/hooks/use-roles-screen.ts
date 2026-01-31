import { useMemo, useState, useCallback } from "react";
import { GridPaginationModel } from "@mui/x-data-grid";
import { useRoles } from "./use-roles";
import { useCreateRole, useUpdateRole, useDeleteRole } from "./use-roles-mutations";
import { Role, CreateRoleRequest, UpdateRoleRequest } from "../types/api";
import { FilterField } from "../../../components";

export interface RoleFilters {
  name: string | null;
}

export interface UseRolesScreenReturn {
  data: Role[] | undefined;
  isLoading: boolean;
  error: any;

  filters: RoleFilters;
  showFilters: boolean;
  filterFields: FilterField[];

  paginationModel: GridPaginationModel;

  selectedRole: Role | null;
  dialogOpen: boolean;
  formDialogOpen: boolean;
  editMode: boolean;
  deleteConfirmOpen: boolean;
  roleToDelete: Role | null;

  createRole: (roleData: CreateRoleRequest) => void;
  updateRole: (id: number, roleData: UpdateRoleRequest) => void;
  deleteRole: (id: number) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  handleFiltersChange: (newFilters: RoleFilters) => void;
  handleToggleFilters: () => void;
  handleRefresh: () => void;
  handlePaginationModelChange: (model: GridPaginationModel) => void;
  handleShowRoleDetails: (role: Role) => void;
  handleCloseDialog: () => void;
  handleOpenCreateDialog: () => void;
  handleOpenEditDialog: (role: Role) => void;
  handleCloseFormDialog: () => void;
  handleDeleteRole: (role: Role) => void;
  handleCloseDeleteConfirm: () => void;
  handleConfirmDelete: () => void;
}

export const useRolesScreen = (): UseRolesScreenReturn => {
  const [filters, setFilters] = useState<RoleFilters>({
    name: null,
  });

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const { data: allRoles, isLoading, error, refetch } = useRoles({
    name: null,
    includeDeleted: false,
    includePrivileges: false,
  });

  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  // Paginate roles
  const paginatedRoles = useMemo(() => {
    if (!allRoles) return [];
    const startIndex = paginationModel.page * paginationModel.pageSize;
    const endIndex = startIndex + paginationModel.pageSize;
    return allRoles.slice(startIndex, endIndex);
  }, [allRoles, paginationModel]);

  const filterFields: FilterField[] = useMemo(() => [
    {
      key: "name",
      type: "text",
      labelKey: "roles@filters.name",
      gridSize: { xs: 12, sm: 6, md: 4 }
    }
  ], []);

  const handleFiltersChange = useCallback((newFilters: RoleFilters) => {
    setFilters(newFilters);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    setPaginationModel(model);
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleShowRoleDetails = useCallback((role: Role) => {
    setSelectedRole(role);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedRole(null);
  }, []);

  const handleOpenCreateDialog = useCallback(() => {
    setEditMode(false);
    setSelectedRole(null);
    setFormDialogOpen(true);
  }, []);

  const handleOpenEditDialog = useCallback((role: Role) => {
    setEditMode(true);
    setSelectedRole(role);
    setFormDialogOpen(true);
  }, []);

  const handleCloseFormDialog = useCallback(() => {
    setFormDialogOpen(false);
    setEditMode(false);
    setSelectedRole(null);
  }, []);

  const handleDeleteRole = useCallback((role: Role) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => {
    setDeleteConfirmOpen(false);
    setRoleToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (roleToDelete) {
      deleteRoleMutation.mutate(roleToDelete.id, {
        onSuccess: () => {
          handleCloseDeleteConfirm();
        }
      });
    }
  }, [roleToDelete, deleteRoleMutation, handleCloseDeleteConfirm]);

  const createRole = useCallback((roleData: CreateRoleRequest) => {
    createRoleMutation.mutate(roleData, {
      onSuccess: () => {
        handleCloseFormDialog();
      }
    });
  }, [createRoleMutation, handleCloseFormDialog]);

  const updateRole = useCallback((id: number, roleData: UpdateRoleRequest) => {
    updateRoleMutation.mutate({ id, roleData }, {
      onSuccess: () => {
        handleCloseFormDialog();
      }
    });
  }, [updateRoleMutation, handleCloseFormDialog]);

  return {
    data: paginatedRoles,
    isLoading,
    error,

    filters,
    showFilters,
    filterFields,

    paginationModel,

    selectedRole,
    dialogOpen,
    formDialogOpen,
    editMode,
    deleteConfirmOpen,
    roleToDelete,

    createRole,
    updateRole,
    deleteRole: deleteRoleMutation.mutate,
    isCreating: createRoleMutation.isPending,
    isUpdating: updateRoleMutation.isPending,
    isDeleting: deleteRoleMutation.isPending,

    handleFiltersChange,
    handleToggleFilters,
    handleRefresh,
    handlePaginationModelChange,
    handleShowRoleDetails,
    handleCloseDialog,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleCloseFormDialog,
    handleDeleteRole,
    handleCloseDeleteConfirm,
    handleConfirmDelete,
  };
};
