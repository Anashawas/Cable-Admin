import { memo, useMemo } from "react";
import { Refresh, Add } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";

interface CampingSeasonsScreenHeaderProps {
  onRefresh: () => void;
  onAdd?: () => void;
  disableAdd?: boolean;
}

const CampingSeasonsScreenHeader = ({
  onRefresh,
  onAdd,
  disableAdd = false,
}: CampingSeasonsScreenHeaderProps) => {
  const { t } = useTranslation();

  const actions: ScreenHeaderAction[] = useMemo(() => {
    const actionsList: ScreenHeaderAction[] = [];

    if (onAdd) {
      actionsList.push({
        id: "add",
        icon: <Add />,
        label: t("campingSeasons@actions.add"),
        onClick: onAdd,
        color: "primary",
        disabled: disableAdd,
      });
    }

    actionsList.push({
      id: "refresh",
      icon: <Refresh />,
      label: t("refresh"),
      onClick: onRefresh,
    });

    return actionsList;
  }, [onRefresh, onAdd, disableAdd, t]);

  return (
    <ScreenHeader
      title={t("campingSeasons@title")}
      actions={actions}
    />
  );
};

export default memo(CampingSeasonsScreenHeader);
