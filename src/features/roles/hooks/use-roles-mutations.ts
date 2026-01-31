import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { createRole, updateRole, deleteRole } from "../services/roles-service";
import { CreateRoleRequest, UpdateRoleRequest } from "../types/api";
import useSnackbarStore from "../../../stores/snackbar-store";

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((state) => state.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((state) => state.openErrorSnackbar);

  return useMutation({
    mutationFn: (roleData: CreateRoleRequest) => createRole(roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      openSuccessSnackbar({ message: t("roles@messages.createSuccess") });
    },
    onError: () => {
      openErrorSnackbar({ message: t("roles@messages.createError") });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((state) => state.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((state) => state.openErrorSnackbar);

  return useMutation({
    mutationFn: ({ id, roleData }: { id: number; roleData: UpdateRoleRequest }) =>
      updateRole(id, roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role"] });
      openSuccessSnackbar({ message: t("roles@messages.updateSuccess") });
    },
    onError: () => {
      openErrorSnackbar({ message: t("roles@messages.updateError") });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((state) => state.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((state) => state.openErrorSnackbar);

  return useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      openSuccessSnackbar({ message: t("roles@messages.deleteSuccess") });
    },
    onError: () => {
      openErrorSnackbar({ message: t("roles@messages.deleteError") });
    },
  });
};
