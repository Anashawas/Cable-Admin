import { memo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import CampingConfigurationsScreenHeader from "./CampingConfigurationsScreenHeader";
import CampingConfigurationsDataGrid from "./CampingConfigurationsDataGrid";
import { useCampingConfigurationsScreen } from "../hooks/use-camping-configurations-screen";
import { CollapsibleFilters } from "../../../components";
import PrivilegeScreenProtection from "../../../components/PrivilegeScreenProtection";
import { PRIVILEGES } from "../../../constants/privileges-constants";

const CampingConfigurationsScreen = () => {
  const { t } = useTranslation();

  const {
    data,
    isLoading,
    error,

    filters,
    showFilters,
    filterFields,

    paginationModel,

    handleFiltersChange,
    handleToggleFilters,
    handleRefresh,
    handlePaginationModelChange,
  } = useCampingConfigurationsScreen();

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
    <PrivilegeScreenProtection requiredPrivileges={[PRIVILEGES.VIEW_SYSTEM_CONFIGURATIONS]}>
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
            <CampingConfigurationsScreenHeader
              showFilters={showFilters}
              onToggleFilters={handleToggleFilters}
              onRefresh={handleRefresh}
            />

            <CollapsibleFilters
              title={t("campingConfigurations@filters.filter")}
              open={showFilters}
              filters={filters}
              fields={filterFields}
              onFiltersChange={handleFiltersChange}
              activeFiltersLabelKey="activeFilters"
              clearAllFiltersLabelKey="clearAllFilters"
            />

            <CampingConfigurationsDataGrid
              data={data?.data || []}
              loading={isLoading}
              total={data?.total || 0}
              paginationModel={paginationModel}
              onPaginationModelChange={handlePaginationModelChange}
              onShowCampingConfigurationDetails={() => {}}
            />
          </Stack>
        </Box>
      </AppScreenContainer>
    </PrivilegeScreenProtection>
  );
};

export default memo(CampingConfigurationsScreen);
