import { Box, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  formatFullDateTime,
  formatRelative,
  formatShortDate,
} from "../utils/date-format";

interface DateCellProps {
  value?: string | null;
  /** Hide the relative line when vertical space is tight. */
  compact?: boolean;
  /** Placeholder when there is no date. */
  emptyLabel?: string;
}

/**
 * Audit timestamp shown as an exact short date with its age underneath, and
 * the full timestamp on hover. Admins scan for "how old" but occasionally need
 * the precise moment, so both are reachable without a click.
 */
export default function DateCell({
  value,
  compact = false,
  emptyLabel = "—",
}: DateCellProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "en";

  if (!value) {
    return (
      <Typography variant="body2" color="text.disabled">
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <Tooltip title={formatFullDateTime(value, lang)} arrow>
      <Box sx={{ minWidth: 0, lineHeight: 1.3, py: 0.25 }}>
        <Typography
          variant="body2"
          fontWeight={600}
          noWrap
          sx={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatShortDate(value, lang)}
        </Typography>
        {!compact && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {formatRelative(value, lang)}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}
