import { memo, useMemo } from "react";
import { FilterList, Refresh, CheckCircle } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";

interface RefundsScreenHeaderProps {
  showFilters: boolean;
  showCompleted: boolean;
  onToggleFilters: () => void;
  onToggleCompleted: () => void;
  onRefresh: () => void;
}

const RefundsScreenHeader = ({
  showFilters,
  showCompleted,
  onToggleFilters,
  onToggleCompleted,
  onRefresh,
}: RefundsScreenHeaderProps) => {
  const { t } = useTranslation();

  const actions: ScreenHeaderAction[] = useMemo(() => [
    {
      id: "completed",
      icon: <CheckCircle />,
      label: t("refunds@filters.showCompleted"),
      onClick: onToggleCompleted,
      color: showCompleted ? "primary" : "default",
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
  ], [showFilters, showCompleted, onToggleFilters, onToggleCompleted, onRefresh, t]);

  return (
    <ScreenHeader
      title={t("refunds@title")}
      actions={actions}
    />
  );
};

export default memo(RefundsScreenHeader);
