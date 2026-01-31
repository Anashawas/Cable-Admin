import { useState, useCallback, useEffect } from "react";
import { GridPaginationModel } from "@mui/x-data-grid";
import { useCampingSeasons } from "./use-camping-seasons";
import { useCampingSeasonById } from "./use-camping-season-by-id";
import {
  useCreateCampingSeason,
  useUpdateCampingSeason,
  useDeleteCampingSeason,
} from "./use-camping-seasons-mutations";
import {
  CampingSeason,
  CreateCampingSeasonRequest,
  UpdateCampingSeasonRequest,
} from "../types/api";

export interface UseCampingSeasonsScreenReturn {
  data: CampingSeason[] | undefined;
  isLoading: boolean;
  error: any;

  paginationModel: GridPaginationModel;

  selectedCampingSeason: CampingSeason | null;
  dialogOpen: boolean;
  formDialogOpen: boolean;
  editMode: boolean;
  deleteConfirmOpen: boolean;
  campingSeasonToDelete: CampingSeason | null;
  isLoadingDetails: boolean;

  createCampingSeason: (seasonData: CreateCampingSeasonRequest) => void;
  updateCampingSeason: (id: number, seasonData: UpdateCampingSeasonRequest) => void;
  deleteCampingSeason: (id: number) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  handleRefresh: () => void;
  handlePaginationModelChange: (model: GridPaginationModel) => void;
  handleShowCampingSeasonDetails: (campingSeason: CampingSeason) => void;
  handleCloseDialog: () => void;
  handleOpenCreateDialog: () => void;
  handleOpenEditDialog: (campingSeason: CampingSeason) => void;
  handleCloseFormDialog: () => void;
  handleDeleteCampingSeason: (campingSeason: CampingSeason) => void;
  handleCloseDeleteConfirm: () => void;
  handleConfirmDelete: () => void;
}

export const useCampingSeasonsScreen = (): UseCampingSeasonsScreenReturn => {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [selectedCampingSeason, setSelectedCampingSeason] = useState<CampingSeason | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [campingSeasonToDelete, setCampingSeasonToDelete] = useState<CampingSeason | null>(null);
  const [editingSeasonId, setEditingSeasonId] = useState<number | null>(null);

  const { data: allCampingSeasons, isLoading, error, refetch } = useCampingSeasons({
    name: null,
    fromDate: null,
    toDate: null,
    includeDeleted: false,
  });

  // Fetch full details when editing
  const { data: fullCampingSeasonDetails, isLoading: isLoadingDetails } = useCampingSeasonById(
    editingSeasonId,
    editMode && formDialogOpen
  );

  const createCampingSeasonMutation = useCreateCampingSeason();
  const updateCampingSeasonMutation = useUpdateCampingSeason();
  const deleteCampingSeasonMutation = useDeleteCampingSeason();

  // Update selectedCampingSeason when full details are loaded
  useEffect(() => {
    if (editMode && fullCampingSeasonDetails) {
      setSelectedCampingSeason(fullCampingSeasonDetails);
    }
  }, [editMode, fullCampingSeasonDetails]);

  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    setPaginationModel(model);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleShowCampingSeasonDetails = useCallback((campingSeason: CampingSeason) => {
    setSelectedCampingSeason(campingSeason);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedCampingSeason(null);
  }, []);

  const handleOpenCreateDialog = useCallback(() => {
    setEditMode(false);
    setSelectedCampingSeason(null);
    setEditingSeasonId(null);
    setFormDialogOpen(true);
  }, []);

  const handleOpenEditDialog = useCallback((campingSeason: CampingSeason) => {
    setEditMode(true);
    setEditingSeasonId(campingSeason.id);
    setSelectedCampingSeason(null); // Will be populated by the fetch
    setFormDialogOpen(true);
  }, []);

  const handleCloseFormDialog = useCallback(() => {
    setFormDialogOpen(false);
    setEditMode(false);
    setSelectedCampingSeason(null);
    setEditingSeasonId(null);
  }, []);

  const handleDeleteCampingSeason = useCallback((campingSeason: CampingSeason) => {
    setCampingSeasonToDelete(campingSeason);
    setDeleteConfirmOpen(true);
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => {
    setDeleteConfirmOpen(false);
    setCampingSeasonToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (campingSeasonToDelete) {
      deleteCampingSeasonMutation.mutate(campingSeasonToDelete.id, {
        onSuccess: () => {
          handleCloseDeleteConfirm();
        },
      });
    }
  }, [campingSeasonToDelete, deleteCampingSeasonMutation, handleCloseDeleteConfirm]);

  const createCampingSeason = useCallback(
    (seasonData: CreateCampingSeasonRequest) => {
      createCampingSeasonMutation.mutate(seasonData, {
        onSuccess: () => {
          handleCloseFormDialog();
        },
      });
    },
    [createCampingSeasonMutation, handleCloseFormDialog]
  );

  const updateCampingSeason = useCallback(
    (id: number, seasonData: UpdateCampingSeasonRequest) => {
      updateCampingSeasonMutation.mutate(
        { id, seasonData },
        {
          onSuccess: () => {
            handleCloseFormDialog();
          },
        }
      );
    },
    [updateCampingSeasonMutation, handleCloseFormDialog]
  );

  return {
    data: allCampingSeasons,
    isLoading,
    error,

    paginationModel,

    selectedCampingSeason,
    dialogOpen,
    formDialogOpen,
    editMode,
    deleteConfirmOpen,
    campingSeasonToDelete,
    isLoadingDetails,

    createCampingSeason,
    updateCampingSeason,
    deleteCampingSeason: deleteCampingSeasonMutation.mutate,
    isCreating: createCampingSeasonMutation.isPending,
    isUpdating: updateCampingSeasonMutation.isPending,
    isDeleting: deleteCampingSeasonMutation.isPending,

    handleRefresh,
    handlePaginationModelChange,
    handleShowCampingSeasonDetails,
    handleCloseDialog,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleCloseFormDialog,
    handleDeleteCampingSeason,
    handleCloseDeleteConfirm,
    handleConfirmDelete,
  };
};
