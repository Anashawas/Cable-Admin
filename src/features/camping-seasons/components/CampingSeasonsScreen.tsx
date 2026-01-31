import { memo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import CampingSeasonsScreenHeader from "./CampingSeasonsScreenHeader";
import CampingSeasonsDataGrid from "./CampingSeasonsDataGrid";
import CampingSeasonForm from "./CampingSeasonForm";
import CampingSeasonDetails from "./CampingSeasonDetails";
import CampingSeasonDeleteConfirmationDialog from "./CampingSeasonDeleteConfirmationDialog";
import { useCampingSeasonsScreen } from "../hooks/use-camping-seasons-screen";
import PrivilegeScreenProtection from "../../../components/PrivilegeScreenProtection";
import { PRIVILEGES } from "../../../constants/privileges-constants";

const CampingSeasonsScreen = () => {
  const { t } = useTranslation();

  const {
    data,
    isLoading,
    error,

    paginationModel,

    formDialogOpen,
    editMode,
    selectedCampingSeason,
    deleteConfirmOpen,
    campingSeasonToDelete,
    dialogOpen,
    isLoadingDetails,

    createCampingSeason,
    updateCampingSeason,
    isCreating,
    isUpdating,
    isDeleting,

    handleRefresh,
    handlePaginationModelChange,
    handleShowCampingSeasonDetails,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleCloseFormDialog,
    handleDeleteCampingSeason,
    handleCloseDeleteConfirm,
    handleConfirmDelete,
    handleCloseDialog,
  } = useCampingSeasonsScreen();

  if (error) {
    return (
      <AppScreenContainer>
        <Box p={2}>
          <Typography color="error">{t("loadingFailed")}</Typography>
        </Box>
      </AppScreenContainer>
    );
  }

  // Check if any camping season is currently active (current date within its range)
  const isAnySeasonActive = () => {
    if (!data) return false;
    const now = new Date();
    return data.some((season) => {
      const fromDate = new Date(season.fromDate);
      const toDate = new Date(season.toDate);
      return now >= fromDate && now <= toDate;
    });
  };

  const handleFormSubmit = (formData: any) => {
    if (editMode && selectedCampingSeason) {
      updateCampingSeason(selectedCampingSeason.id, formData);
    } else {
      createCampingSeason(formData);
    }
  };

  return (
    <PrivilegeScreenProtection requiredPrivileges={[PRIVILEGES.VIEW_CAMPING_SEASONS]}>
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
            <CampingSeasonsScreenHeader
              onRefresh={handleRefresh}
              onAdd={handleOpenCreateDialog}
              disableAdd={isAnySeasonActive()}
            />

            <CampingSeasonsDataGrid
              data={data || []}
              loading={isLoading}
              total={data?.length || 0}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationModelChange}
              onShowCampingSeasonDetails={handleShowCampingSeasonDetails}
              onEditCampingSeason={handleOpenEditDialog}
              onDeleteCampingSeason={handleDeleteCampingSeason}
            />
          </Stack>
        </Box>

        {/* Details Dialog */}
        <CampingSeasonDetails
          open={dialogOpen}
          campingSeason={selectedCampingSeason}
          onClose={handleCloseDialog}
        />

        {/* Form Dialog */}
        <CampingSeasonForm
          open={formDialogOpen}
          campingSeason={selectedCampingSeason}
          editMode={editMode}
          isSubmitting={isCreating || isUpdating || isLoadingDetails}
          onClose={handleCloseFormDialog}
          onSubmit={handleFormSubmit}
        />

        {/* Delete Confirmation Dialog */}
        <CampingSeasonDeleteConfirmationDialog
          open={deleteConfirmOpen}
          campingSeason={campingSeasonToDelete}
          isDeleting={isDeleting}
          onClose={handleCloseDeleteConfirm}
          onConfirm={handleConfirmDelete}
        />
      </AppScreenContainer>
    </PrivilegeScreenProtection>
  );
};

export default memo(CampingSeasonsScreen);
