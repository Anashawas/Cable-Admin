import { memo, useMemo } from "react";
import { FilterList, Refresh, Add } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";

interface UsersScreenHeaderProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  onRefresh: () => void;
  onAddUser: () => void;
}

const UsersScreenHeader = ({
  showFilters,
  onToggleFilters,
  onRefresh,
  onAddUser,
}: UsersScreenHeaderProps) => {
  const { t } = useTranslation();

  const actions: ScreenHeaderAction[] = useMemo(() => [
    {
      id: "add",
      icon: <Add />,
      label: t("users@actions.addUser"),
      onClick: onAddUser,
      color: "primary",
    },
    {
      id: "filter",
      icon: <FilterList />,
      label: t("filter"),
      onClick: onToggleFilters,
      color: showFilters ? "primary" : "default",
    },
    {
      id: "refresh",
      icon: <Refresh />,
      label: t("refresh"),
      onClick: onRefresh,
    },
  ], [showFilters, onToggleFilters, onRefresh, onAddUser, t]);

  return (
    <ScreenHeader
      title={t("users@title")}
      actions={actions}
    />
  );
};

export default memo(UsersScreenHeader);
