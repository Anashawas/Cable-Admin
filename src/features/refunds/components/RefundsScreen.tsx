import { memo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import RefundsScreenHeader from "./RefundsScreenHeader";
import RefundsDataGrid from "./RefundsDataGrid";
import RefundDetails from "./RefundDetails";
import { useRefundsScreen } from "../hooks/use-refunds-screen";
import { CollapsibleFilters } from "../../../components";
import PrivilegeScreenProtection from "../../../components/PrivilegeScreenProtection";
import { PRIVILEGES } from "../../../constants/privileges-constants";

const RefundsScreen = () => {
  const { t } = useTranslation();

  const {
    data,
    isLoading,
    error,

    filters,
    showFilters,
    showCompleted,
    filterFields,

    paginationModel,

    selectedRefund,
    dialogOpen,

    handleFiltersChange,
    handleToggleFilters,
    handleToggleCompleted,
    handleRefresh,
    handlePaginationModelChange,
    handleShowRefundDetails,
    handleCloseDialog,
  } = useRefundsScreen();

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
      requiredPrivileges={[PRIVILEGES.VIEW_REFUNDS, PRIVILEGES.VIEW_REFUNDS_GOVERNORATE]}
    >
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
            <RefundsScreenHeader
              showFilters={showFilters}
              showCompleted={showCompleted}
              onToggleFilters={handleToggleFilters}
              onToggleCompleted={handleToggleCompleted}
              onRefresh={handleRefresh}
            />

            <CollapsibleFilters
              title={t("refunds@filters.filter")}
              open={showFilters}
              filters={filters}
              fields={filterFields}
              onFiltersChange={handleFiltersChange}
              activeFiltersLabelKey="activeFilters"
              clearAllFiltersLabelKey="clearAllFilters"
            />

            <RefundsDataGrid
              data={data?.data || []}
              loading={isLoading}
              total={data?.total || 0}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationModelChange}
              onShowRefundDetails={handleShowRefundDetails}
            />
          </Stack>
        </Box>

        <RefundDetails
          open={dialogOpen}
          refund={selectedRefund}
          onClose={handleCloseDialog}
        />
      </AppScreenContainer>
    </PrivilegeScreenProtection>
  );
};

export default memo(RefundsScreen);