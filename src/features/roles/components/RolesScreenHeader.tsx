import { memo, useMemo } from "react";
import { FilterList, Refresh, Add } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";

interface RolesScreenHeaderProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  onRefresh: () => void;
  onAddRole: () => void;
}

const RolesScreenHeader = ({
  showFilters,
  onToggleFilters,
  onRefresh,
  onAddRole,
}: RolesScreenHeaderProps) => {
  const { t } = useTranslation();

  const actions: ScreenHeaderAction[] = useMemo(() => [
    {
      id: "add",
      icon: <Add />,
      label: t("roles@actions.addRole"),
      onClick: onAddRole,
      color: "primary",
    },
    {
      id: "refresh",
      icon: <Refresh />,
      label: t("refresh"),
      onClick: onRefresh,
    },
  ], [showFilters, onToggleFilters, onRefresh, onAddRole, t]);

  return (
    <ScreenHeader
      title={t("roles@title")}
      actions={actions}
    />
  );
};

export default memo(RolesScreenHeader);
