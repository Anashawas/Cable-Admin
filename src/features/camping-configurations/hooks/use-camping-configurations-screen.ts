import { useMemo, useState, useCallback } from "react";
import { GridPaginationModel } from "@mui/x-data-grid";
import { FilterField } from "../../../components";

export interface CampingConfigurationFilters {
  name: string | null;
}

export interface UseCampingConfigurationsScreenReturn {
  data: any;
  isLoading: boolean;
  error: any;

  filters: CampingConfigurationFilters;
  showFilters: boolean;
  filterFields: FilterField[];

  paginationModel: GridPaginationModel;

  selectedCampingConfiguration: any | null;
  dialogOpen: boolean;

  handleFiltersChange: (newFilters: CampingConfigurationFilters) => void;
  handleToggleFilters: () => void;
  handleRefresh: () => void;
  handlePaginationModelChange: (model: GridPaginationModel) => void;
  handleShowCampingConfigurationDetails: (campingConfiguration: any) => void;
  handleCloseDialog: () => void;
}

export const useCampingConfigurationsScreen = (): UseCampingConfigurationsScreenReturn => {
  const [filters, setFilters] = useState<CampingConfigurationFilters>({
    name: null,
  });

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedCampingConfiguration, setSelectedCampingConfiguration] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // TODO: Implement actual API call
  const data = { data: [], total: 0 };
  const isLoading = false;
  const error = null;

  const filterFields: FilterField[] = useMemo(() => [
    {
      key: "name",
      type: "text",
      labelKey: "campingConfigurations@filters.name",
      gridSize: { xs: 12, sm: 6, md: 3 }
    }
  ], []);

  const handleFiltersChange = useCallback((newFilters: CampingConfigurationFilters) => {
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
    // TODO: Implement refresh
    console.log('Refresh camping configurations');
  }, []);

  const handleShowCampingConfigurationDetails = useCallback((campingConfiguration: any) => {
    setSelectedCampingConfiguration(campingConfiguration);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedCampingConfiguration(null);
  }, []);

  return {
    data,
    isLoading,
    error,

    filters,
    showFilters,
    filterFields,

    paginationModel,

    selectedCampingConfiguration,
    dialogOpen,

    handleFiltersChange,
    handleToggleFilters,
    handleRefresh,
    handlePaginationModelChange,
    handleShowCampingConfigurationDetails,
    handleCloseDialog,
  };
};
