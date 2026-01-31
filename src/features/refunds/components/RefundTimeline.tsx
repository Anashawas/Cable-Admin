import { memo } from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useTheme } from "@mui/material/styles";

import { useLayoutStore } from "../../../stores";
import type { RefundTimelineProps } from "../types/timeline";
import { getStatusIcon, getStatusColor, formatDate } from "../utils/timeline-utils";

const RefundTimeline = ({ histories, isLoading, error }: RefundTimelineProps) => {
  const { t } = useTranslation("refunds");
  const { i18n } = useTranslation();
  const { smallScreen } = useLayoutStore();
  const theme = useTheme();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        {error}
      </Alert>
    );
  }

  if (histories.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        {t("timeline.noHistory")}
      </Alert>
    );
  }

  const sortedHistories = [...histories].sort(
    (a, b) => new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime()
  );

  return (
    <Stack spacing={2} padding={1}>
      {sortedHistories.map((history, index) => {
        const formattedDate = formatDate(history.actionDate, i18n.language);
        const isLast = index === sortedHistories.length - 1;

        return (
          <Box key={history.id} sx={{ position: "relative" }}>
            {!isLast && (
              <Box
                sx={{
                  position: "absolute",
                  left: smallScreen ? 15 : 19,
                  top: smallScreen ? 36 : 40,
                  bottom: smallScreen ? -16 : -24,
                  width: 2,
                  bgcolor: theme.palette.divider,
                }}
              />
            )}

            <Stack direction="row" spacing={2}>
              <Box
                sx={{
                  width: smallScreen ? 32 : 40,
                  height: smallScreen ? 32 : 40,
                  borderRadius: "50%",
                  bgcolor: `${getStatusColor(history.currentStatusId)}.main`,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                {getStatusIcon(history.currentStatusId)}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack spacing={1}>
                  <Typography
                    variant={smallScreen ? "body1" : "h6"}
                    fontWeight="medium"
                  >
                    {history.currentStatusName}
                  </Typography>


                  <Stack
                    direction={smallScreen ? "column" : "row"}
                    spacing={smallScreen ? 0.5 : 2}
                    sx={{ mt: 1 }}
                  >
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <AccessTimeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary">
                        {formattedDate}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <PersonIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary">
                        {history.actionByUserName}
                      </Typography>
                    </Stack>
                  </Stack>

                  {history.comments && history.comments.toLowerCase() !== "reservation created" && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1.5,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                        borderLeft: `3px solid ${theme.palette[getStatusColor(history.currentStatusId)].main}`,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {history.comments}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
};

export default memo(RefundTimeline);