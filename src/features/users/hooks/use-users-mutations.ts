import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { createUser, updateUser, deleteUser } from "../services/users-service";
import { CreateUserRequest, UpdateUserRequest } from "../types/api";
import useSnackbarStore from "../../../stores/snackbar-store";

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((state) => state.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((state) => state.openErrorSnackbar);

  return useMutation({
    mutationFn: (userData: CreateUserRequest) => createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      openSuccessSnackbar({ message: t("users@messages.createSuccess") });
    },
    onError: () => {
      openErrorSnackbar({ message: t("users@messages.createError") });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((state) => state.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((state) => state.openErrorSnackbar);

  return useMutation({
    mutationFn: ({ id, userData }: { id: number; userData: UpdateUserRequest }) =>
      updateUser(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      openSuccessSnackbar({ message: t("users@messages.updateSuccess") });
    },
    onError: () => {
      openErrorSnackbar({ message: t("users@messages.updateError") });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((state) => state.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((state) => state.openErrorSnackbar);

  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      openSuccessSnackbar({ message: t("users@messages.deleteSuccess") });
    },
    onError: () => {
      openErrorSnackbar({ message: t("users@messages.deleteError") });
    },
  });
};
