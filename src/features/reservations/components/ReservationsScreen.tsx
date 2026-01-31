import { memo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import ReservationsScreenHeader from "./ReservationsScreenHeader";
import ReservationsDataGrid from "./ReservationsDataGrid";
import ReservationDetails from "./ReservationDetails";
import { useReservationsScreen } from "../hooks/use-reservations-screen";
import { CollapsibleFilters } from "../../../components";
import PrivilegeScreenProtection from "../../../components/PrivilegeScreenProtection";
import { PRIVILEGES } from "../../../constants/privileges-constants";

const ReservationsScreen = () => {
  const { t } = useTranslation();

  const {
    data,
    isLoading,
    error,

    filters,
    showFilters,
    filterFields,

    paginationModel,

    selectedReservation,
    dialogOpen,

    handleFiltersChange,
    handleToggleFilters,
    handleRefresh,
    handlePaginationModelChange,
    handleShowReservationDetails,
    handleCloseDialog,
    handleShowLicense,
    handleShowPaymentInvoice,
    handleShowOnMap,
  } = useReservationsScreen();

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
    <PrivilegeScreenProtection
      requiredPrivileges={[PRIVILEGES.VIEW_RESERVATIONS, PRIVILEGES.VIEW_RESERVATIONS_GOVERNORATE]}
    >
      <AppScreenContainer>
        <Box
          sx={{
            width: "100%",
            minWidth: 0,
            overflow: "hidden",
            boxSizing: "border-box",
            p: { xs: 1, sm: 2 },
          }}
        >
          <Stack spacing={2} sx={{ width: "100%", minWidth: 0 }}>
            <ReservationsScreenHeader
              showFilters={showFilters}
              onToggleFilters={handleToggleFilters}
              onRefresh={handleRefresh}
            />

            <CollapsibleFilters
              title={t("reservations@filters.filter")}
              open={showFilters}
              filters={filters}
              fields={filterFields}
              onFiltersChange={handleFiltersChange}
              activeFiltersLabelKey="activeFilters"
              clearAllFiltersLabelKey="clearAllFilters"
            />

            <ReservationsDataGrid
              data={data?.items || []}
              loading={isLoading}
              total={data?.totalCount || 0}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationModelChange}
              onShowReservationDetails={handleShowReservationDetails}
              onShowLicense={handleShowLicense}
              onShowPaymentInvoice={handleShowPaymentInvoice}
              onShowOnMap={handleShowOnMap}
            />

            <ReservationDetails
              open={dialogOpen}
              reservation={selectedReservation}
              onClose={handleCloseDialog}
            />
          </Stack>
        </Box>
      </AppScreenContainer>
    </PrivilegeScreenProtection>
  );
};

export default memo(ReservationsScreen);
