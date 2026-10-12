import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Box, Chip, Stack, Tooltip } from "@mui/material";
import EvStationIcon from "@mui/icons-material/EvStation";
import { plugDisplays } from "../utils/plug-catalog";
import type { ChargingPointDto } from "../types/api";

interface PlugChipsProps {
  plugs: ChargingPointDto["plugTypeSummary"];
  /** Chips shown before collapsing the rest into "+N". */
  max?: number;
  /** Keep chips on one line (table cells). */
  nowrap?: boolean;
}

function PlugChips({ plugs, max = 3, nowrap = false }: PlugChipsProps) {
  const { t, i18n } = useTranslation();
  const items = plugDisplays(plugs, i18n.language);
  if (items.length === 0) return null;
  const shown = items.slice(0, max);
  const rest = items.slice(max);

  return (
    <Stack direction="row" gap={0.5} useFlexGap flexWrap={nowrap ? "nowrap" : "wrap"} sx={{ minWidth: 0 }}>
      {shown.map((p) => (
        <Tooltip key={p.key} title={p.full}>
          <Chip
            size="small"
            variant="outlined"
            label={p.short}
            icon={
              p.icon ? (
                <Box component="img" src={p.icon} alt="" sx={{ width: 16, height: 16, objectFit: "contain" }} />
              ) : (
                <EvStationIcon sx={{ fontSize: "16px !important" }} />
              )
            }
            sx={{ height: 24, fontSize: "0.72rem", fontWeight: 600, "& .MuiChip-icon": { mx: 0.5 } }}
          />
        </Tooltip>
      ))}
      {rest.length > 0 && (
        <Tooltip
          title={
            <Box component="ul" sx={{ m: 0, paddingInlineStart: "16px" }}>
              {rest.map((p) => (
                <li key={p.key}>{p.full}</li>
              ))}
            </Box>
          }
        >
          <Chip
            size="small"
            label={<bdi>+{rest.length}</bdi>}
            aria-label={t("chargeManagement@list.morePlugs", { count: rest.length })}
            sx={{ height: 24, fontSize: "0.72rem", fontWeight: 700 }}
          />
        </Tooltip>
      )}
    </Stack>
  );
}

export default memo(PlugChips);
