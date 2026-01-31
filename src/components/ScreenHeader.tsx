import { memo, ReactNode } from "react";
import { Box, Typography, Grid, IconButton, Tooltip } from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

export interface ScreenHeaderAction {
  id: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  color?: "inherit" | "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
  disabled?: boolean;
}

interface ScreenHeaderProps {
  title: string;
  actions?: ScreenHeaderAction[];
  showMoreButton?: boolean;
  onMoreClick?: () => void;
}

const ScreenHeader = ({
  title,
  actions = [],
  showMoreButton = true,
  onMoreClick,
}: ScreenHeaderProps) => {
  const { t } = useTranslation();

  return (
    <Grid container spacing={1} alignItems="center" sx={{ flexWrap: { xs: "wrap", sm: "nowrap" } }}>
      <Grid size={{ xs: 12, sm: "auto" }} sx={{ mb: { xs: 1, sm: 0 } }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontSize: { xs: "1.5rem", sm: "2.125rem" },
            textAlign: { xs: "center", sm: "left" }
          }}
        >
          {title}
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, sm: "grow" }}>
        <Box sx={{
          display: "flex",
          gap: 1,
          justifyContent: { xs: "center", sm: "flex-end" },
          flexWrap: "wrap"
        }}>
          {actions.map((action) => (
            <Tooltip key={action.id} title={action.label}>
              <IconButton
                aria-label={action.label}
                size="large"
                onClick={action.onClick}
                color={action.color || "default"}
                disabled={action.disabled}
              >
                {action.icon}
              </IconButton>
            </Tooltip>
          ))}
          {/* {showMoreButton && (
            <Tooltip title={t("more")}>
              <IconButton
                aria-label={t("more")}
                size="large"
                onClick={onMoreClick}
              >
                <MoreVert />
              </IconButton>
            </Tooltip>
          )} */}
        </Box>
      </Grid>
    </Grid>
  );
};

export default memo(ScreenHeader);