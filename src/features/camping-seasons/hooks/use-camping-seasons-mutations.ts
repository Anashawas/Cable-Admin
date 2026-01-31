import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  createCampingSeason,
  updateCampingSeason,
  deleteCampingSeason,
} from "../services/camping-seasons-service";
import {
  CreateCampingSeasonRequest,
  UpdateCampingSeasonRequest,
} from "../types/api";
import useSnackbarStore from "../../../stores/snackbar-store";

export const useCreateCampingSeason = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((state) => state.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((state) => state.openErrorSnackbar);

  return useMutation({
    mutationFn: (seasonData: CreateCampingSeasonRequest) =>
      createCampingSeason(seasonData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["camping-seasons"] });
      openSuccessSnackbar({ message: t("campingSeasons@messages.createSuccess") });
    },
    onError: () => {
      openErrorSnackbar({ message: t("campingSeasons@messages.createError") });
    },
  });
};

export const useUpdateCampingSeason = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((state) => state.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((state) => state.openErrorSnackbar);

  return useMutation({
    mutationFn: ({
      id,
      seasonData,
    }: {
      id: number;
      seasonData: UpdateCampingSeasonRequest;
    }) => updateCampingSeason(id, seasonData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["camping-seasons"] });
      openSuccessSnackbar({ message: t("campingSeasons@messages.updateSuccess") });
    },
    onError: () => {
      openErrorSnackbar({ message: t("campingSeasons@messages.updateError") });
    },
  });
};

export const useDeleteCampingSeason = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((state) => state.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((state) => state.openErrorSnackbar);

  return useMutation({
    mutationFn: (id: number) => deleteCampingSeason(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["camping-seasons"] });
      openSuccessSnackbar({ message: t("campingSeasons@messages.deleteSuccess") });
    },
    onError: () => {
      openErrorSnackbar({ message: t("campingSeasons@messages.deleteError") });
    },
  });
};
