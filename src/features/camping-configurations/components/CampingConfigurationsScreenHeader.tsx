import { memo, useMemo } from "react";
import { FilterList, Refresh } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";

interface CampingConfigurationsScreenHeaderProps {
  showFilters: boolean;
  onToggleFilters: () => void;
  onRefresh: () => void;
}

const CampingConfigurationsScreenHeader = ({
  showFilters,
  onToggleFilters,
  onRefresh,
}: CampingConfigurationsScreenHeaderProps) => {
  const { t } = useTranslation();

  const actions: ScreenHeaderAction[] = useMemo(() => [
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
  ], [showFilters, onToggleFilters, onRefresh, t]);

  return (
    <ScreenHeader
      title={t("campingConfigurations@title")}
      actions={actions}
    />
  );
};

export default memo(CampingConfigurationsScreenHeader);
