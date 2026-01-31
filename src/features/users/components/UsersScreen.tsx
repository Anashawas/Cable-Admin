import { memo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import UsersScreenHeader from "./UsersScreenHeader";
import UsersDataGrid from "./UsersDataGrid";
import UserDetails from "./UserDetails";
import UserForm from "./UserForm";
import UserDeleteConfirmationDialog from "./UserDeleteConfirmationDialog";
import { useUsersScreen } from "../hooks/use-users-screen";
import { CollapsibleFilters } from "../../../components";
import PrivilegeScreenProtection from "../../../components/PrivilegeScreenProtection";
import { PRIVILEGES } from "../../../constants/privileges-constants";
import type { CreateUserRequest, UpdateUserRequest } from "../types/api";

const UsersScreen = () => {
  const { t } = useTranslation();

  const {
    data,
    isLoading,
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
    isCreating,
    isUpdating,
    isDeleting,

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
  } = useUsersScreen();

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
    <PrivilegeScreenProtection requiredPrivileges={[PRIVILEGES.VIEW_USERS]}>
      <AppScreenContainer>
        <Box
          sx={{
            width: "100%",
            maxWidth: "100vw",
            minWidth: 0,
            overflow: "hidden",
            boxSizing: "border-box",
            p: { xs: 1, sm: 2 },
          }}
        >
          <Stack spacing={2} sx={{ width: "100%", minWidth: 0 }}>
            <UsersScreenHeader
              showFilters={showFilters}
              onToggleFilters={handleToggleFilters}
              onRefresh={handleRefresh}
              onAddUser={handleOpenCreateDialog}
            />

            <CollapsibleFilters
              title={t("users@filters.filter")}
              open={showFilters}
              filters={filters}
              fields={filterFields}
              onFiltersChange={handleFiltersChange}
              activeFiltersLabelKey="activeFilters"
              clearAllFiltersLabelKey="clearAllFilters"
            />

            <UsersDataGrid
              data={data?.items || []}
              loading={isLoading}
              total={data?.totalCount || 0}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationModelChange}
              onShowUserDetails={handleShowUserDetails}
              onEditUser={handleOpenEditDialog}
              onDeleteUser={handleDeleteUser}
            />

            <UserDetails
              open={dialogOpen}
              user={selectedUser}
              onClose={handleCloseDialog}
            />

            <UserForm
              open={formDialogOpen}
              user={selectedUser}
              editMode={editMode}
              isSubmitting={isCreating || isUpdating}
              onClose={handleCloseFormDialog}
              onSubmit={(data) => {
                if (editMode && selectedUser) {
                  updateUser(selectedUser.id, data as UpdateUserRequest);
                } else {
                  createUser(data as CreateUserRequest);
                }
              }}
            />

            <UserDeleteConfirmationDialog
              userName={userToDelete?.name || ""}
              open={deleteConfirmOpen}
              isPending={isDeleting}
              onClose={handleCloseDeleteConfirm}
              onConfirm={handleConfirmDelete}
            />
          </Stack>
        </Box>
      </AppScreenContainer>
    </PrivilegeScreenProtection>
  );
};

export default memo(UsersScreen);