import { memo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import RolesScreenHeader from "./RolesScreenHeader";
import RolesDataGrid from "./RolesDataGrid";
import RoleDetails from "./RoleDetails";
import RoleForm from "./RoleForm";
import RoleDeleteConfirmationDialog from "./RoleDeleteConfirmationDialog";
import { useRolesScreen } from "../hooks/use-roles-screen";
import { CollapsibleFilters } from "../../../components";
import PrivilegeScreenProtection from "../../../components/PrivilegeScreenProtection";
import { PRIVILEGES } from "../../../constants/privileges-constants";
import type { CreateRoleRequest, UpdateRoleRequest } from "../types/api";

const RolesScreen = () => {
  const { t } = useTranslation();

  const {
    data,
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
    isCreating,
    isUpdating,
    isDeleting,

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
  } = useRolesScreen();

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
    <PrivilegeScreenProtection requiredPrivileges={[PRIVILEGES.VIEW_ROLES]}>
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
            <RolesScreenHeader
              showFilters={showFilters}
              onToggleFilters={handleToggleFilters}
              onRefresh={handleRefresh}
              onAddRole={handleOpenCreateDialog}
            />

            <CollapsibleFilters
              title={t("roles@filters.filter")}
              open={showFilters}
              filters={filters}
              fields={filterFields}
              onFiltersChange={handleFiltersChange}
              activeFiltersLabelKey="activeFilters"
              clearAllFiltersLabelKey="clearAllFilters"
            />

            <RolesDataGrid
              data={data || []}
              loading={isLoading}
              total={data?.length || 0}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationModelChange}
              onShowRoleDetails={handleShowRoleDetails}
              onEditRole={handleOpenEditDialog}
              onDeleteRole={handleDeleteRole}
            />

            <RoleDetails
              open={dialogOpen}
              role={selectedRole}
              onClose={handleCloseDialog}
            />

            <RoleForm
              open={formDialogOpen}
              role={selectedRole}
              editMode={editMode}
              isSubmitting={isCreating || isUpdating}
              onClose={handleCloseFormDialog}
              onSubmit={(data) => {
                if (editMode && selectedRole) {
                  updateRole(selectedRole.id, data as UpdateRoleRequest);
                } else {
                  createRole(data as CreateRoleRequest);
                }
              }}
            />

            <RoleDeleteConfirmationDialog
              roleName={roleToDelete?.name || ""}
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

export default memo(RolesScreen);