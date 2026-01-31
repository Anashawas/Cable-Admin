import { useMemo, useState, useCallback } from "react";
import { GridPaginationModel } from "@mui/x-data-grid";
import { useDebounce } from "use-debounce";
import { useUsers } from "./use-users";
import { useCreateUser, useUpdateUser, useDeleteUser } from "./use-users-mutations";
import { useRoles } from "./use-roles";
import { User, CreateUserRequest, UpdateUserRequest } from "../types/api";
import { FilterField } from "../../../components";
import { GOVERNORATES } from "@/constants";

export interface UserFilters {
  name: string | null;
  userName: string | null;
  email: string | null;
  civilId: string | null;
  roleId: number | null;
  governorateId: number | null;
}

export interface UseUsersScreenReturn {
  data: any;
  isLoading: boolean;
  error: any;

  filters: UserFilters;
  showFilters: boolean;
  filterFields: FilterField[];

  paginationModel: GridPaginationModel;

  selectedUser: User | null;
  dialogOpen: boolean;
  formDialogOpen: boolean;
  editMode: boolean;
  deleteConfirmOpen: boolean;
  userToDelete: User | null;

  createUser: (userData: CreateUserRequest) => void;
  updateUser: (id: number, userData: UpdateUserRequest) => void;
  deleteUser: (id: number) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  handleFiltersChange: (newFilters: UserFilters) => void;
  handleToggleFilters: () => void;
  handleRefresh: () => void;
  handlePaginationModelChange: (model: GridPaginationModel) => void;
  handleShowUserDetails: (user: User) => void;
  handleCloseDialog: () => void;
  handleOpenCreateDialog: () => void;
  handleOpenEditDialog: (user: User) => void;
  handleCloseFormDialog: () => void;
  handleDeleteUser: (user: User) => void;
  handleCloseDeleteConfirm: () => void;
  handleConfirmDelete: () => void;
}

export const useUsersScreen = (): UseUsersScreenReturn => {
  // Fetch roles for filter dropdown
  const { data: roles } = useRoles({
    name: null,
    includeDeleted: false,
    includePrivileges: false,
  });

  const [filters, setFilters] = useState<UserFilters>({
    name: null,
    userName: null,
    email: null,
    civilId: null,
    roleId: null,
    governorateId: null,
  });

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [debouncedFilters] = useDebounce(filters, 500);

  // Create stable query filters that won't cause cancellation on pagination
  const queryFilters = useMemo(() => {
    return {
      pagination: {
        pageNumber: paginationModel.page + 1, // API uses 1-based pagination
        pageSize: paginationModel.pageSize,
      },
      name: debouncedFilters.name,
      userName: debouncedFilters.userName,
      civilId: debouncedFilters.civilId,
      isActive: null, // Not using active filter
      roleId: debouncedFilters.roleId,
      governorateId: debouncedFilters.governorateId,
      includeDeleted: false,
    };
  }, [debouncedFilters, paginationModel]);

  // Use server-side pagination and filtering
  const { data, isFetching, error, refetch } = useUsers(queryFilters);

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const filterFields: FilterField[] = useMemo(() => [
    {
      key: "name",
      type: "text",
      labelKey: "users@filters.name",
      gridSize: { xs: 12, sm: 6, md: 3 }
    },
    {
      key: "userName",
      type: "text",
      labelKey: "users@filters.userName",
      gridSize: { xs: 12, sm: 6, md: 3 }
    },
    {
      key: "civilId",
      type: "text",
      labelKey: "users@filters.civilId",
      gridSize: { xs: 12, sm: 6, md: 3 }
    },
    {
      key: "roleId",
      type: "select",
      labelKey: "users@filters.role",
      options: roles?.map(role => ({
        value: role.id,
        label: role.name
      })) || [],
      gridSize: { xs: 12, sm: 6, md: 3 }
    },
    {
      key: "governorateId",
      type: "select",
      labelKey: "users@filters.governorate",
      options: GOVERNORATES.map(gov => ({
        value: gov.id,
        label: gov.arabicName // Using Arabic name as primary
      })),
      gridSize: { xs: 12, sm: 6, md: 3 }
    }
  ], [roles]);

  const handleFiltersChange = useCallback((newFilters: UserFilters) => {
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

  const handleShowUserDetails = useCallback((user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedUser(null);
  }, []);

  const handleOpenCreateDialog = useCallback(() => {
    setEditMode(false);
    setSelectedUser(null);
    setFormDialogOpen(true);
  }, []);

  const handleOpenEditDialog = useCallback((user: User) => {
    setEditMode(true);
    setSelectedUser(user);
    setFormDialogOpen(true);
  }, []);

  const handleCloseFormDialog = useCallback(() => {
    setFormDialogOpen(false);
    setEditMode(false);
    setSelectedUser(null);
  }, []);

  const handleDeleteUser = useCallback((user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => {
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id, {
        onSuccess: () => {
          handleCloseDeleteConfirm();
        }
      });
    }
  }, [userToDelete, deleteUserMutation, handleCloseDeleteConfirm]);

  const createUser = useCallback((userData: CreateUserRequest) => {
    createUserMutation.mutate(userData, {
      onSuccess: () => {
        handleCloseFormDialog();
      }
    });
  }, [createUserMutation, handleCloseFormDialog]);

  const updateUser = useCallback((id: number, userData: UpdateUserRequest) => {
    updateUserMutation.mutate({ id, userData }, {
      onSuccess: () => {
        handleCloseFormDialog();
      }
    });
  }, [updateUserMutation, handleCloseFormDialog]);

  return {
    data,
    isLoading: isFetching, // Use isFetching to show loading during pagination
    error,

    filters,
    showFilters,
    filterFields,

    paginationModel,

    selectedUser,
    dialogOpen,
    formDialogOpen,
    editMode,
    deleteConfirmOpen,
    userToDelete,

    createUser,
    updateUser,
    deleteUser: deleteUserMutation.mutate,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,

    handleFiltersChange,
    handleToggleFilters,
    handleRefresh,
    handlePaginationModelChange,
    handleShowUserDetails,
    handleCloseDialog,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleCloseFormDialog,
    handleDeleteUser,
    handleCloseDeleteConfirm,
    handleConfirmDelete,
  };
};
