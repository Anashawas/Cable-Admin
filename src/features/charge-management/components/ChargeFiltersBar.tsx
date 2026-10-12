import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Badge,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Popover,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import TuneIcon from "@mui/icons-material/Tune";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import type { SortOption } from "../hooks/use-charge-management";
import type { DateRangePreset } from "../../../utils/date-format";
import type { PlugTypeDto } from "../types/api";
import { plugDisplay } from "../utils/plug-catalog";

export const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: "NONE", labelKey: "chargeManagement@sort.none" },
  { value: "VISITORS_HIGH_TO_LOW", labelKey: "chargeManagement@sort.visitorsHighToLow" },
  { value: "VISITORS_LOW_TO_HIGH", labelKey: "chargeManagement@sort.visitorsLowToHigh" },
  { value: "RATING_HIGH_TO_LOW", labelKey: "chargeManagement@sort.ratingHighToLow" },
  { value: "NAME_A_TO_Z", labelKey: "chargeManagement@sort.nameAtoZ" },
  { value: "JOINED_NEWEST", labelKey: "chargeManagement@sort.joinedNewest" },
  { value: "JOINED_OLDEST", labelKey: "chargeManagement@sort.joinedOldest" },
  { value: "EDITED_NEWEST", labelKey: "chargeManagement@sort.editedNewest" },
  { value: "EDITED_OLDEST", labelKey: "chargeManagement@sort.editedOldest" },
];

export const DATE_RANGE_OPTIONS: { value: DateRangePreset; labelKey: string }[] = [
  { value: "all", labelKey: "chargeManagement@filters.all" },
  { value: "7d", labelKey: "chargeManagement@filters.last7Days" },
  { value: "30d", labelKey: "chargeManagement@filters.last30Days" },
  { value: "90d", labelKey: "chargeManagement@filters.last90Days" },
  { value: "365d", labelKey: "chargeManagement@filters.lastYear" },
];

export interface ChargeFilterValues {
  search: string;
  sort: SortOption;
  city: string;
  status: string;
  verified: string;
  stationType: string;
  plugTypes: number[];
  joined: DateRangePreset;
  edited: DateRangePreset;
}

interface ChargeFiltersBarProps {
  values: ChargeFilterValues;
  /** City grouping keys (canonical English) with their display labels. */
  cities: { key: string; label: string }[];
  statuses: string[];
  stationTypes: string[];
  plugTypes: PlugTypeDto[];
  resultCount: number;
  /** e.g. «آخر تحديث منذ 30 ث» — shown under the result count. */
  lastUpdatedLabel?: string;
  viewMode: "card" | "table";
  onViewModeChange: (mode: "card" | "table") => void;
  onSearchChange: (v: string) => void;
  onSortChange: (v: SortOption) => void;
  onCityChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onVerifiedChange: (v: string) => void;
  onStationTypeChange: (v: string) => void;
  onPlugTypesChange: (v: number[]) => void;
  onJoinedChange: (v: DateRangePreset) => void;
  onEditedChange: (v: DateRangePreset) => void;
  onClearAll: () => void;
}

const Num = ({ v }: { v: number }) => <bdi>{v.toLocaleString("en-US")}</bdi>;

function ChargeFiltersBar(props: ChargeFiltersBarProps) {
  const { values: v, cities, statuses, stationTypes, plugTypes, resultCount, viewMode, lastUpdatedLabel } = props;
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);

  const plugLabel = (id: number) => {
    const p = plugTypes.find((x) => x.id === id);
    return plugDisplay({ id, serialNumber: p?.serialNumber, name: p?.name }, i18n.language);
  };
  const dateLabel = (preset: DateRangePreset) =>
    t(DATE_RANGE_OPTIONS.find((o) => o.value === preset)?.labelKey ?? "chargeManagement@filters.all");

  const hiddenActiveCount =
    (v.stationType ? 1 : 0) + (v.plugTypes.length > 0 ? 1 : 0) + (v.joined !== "all" ? 1 : 0) + (v.edited !== "all" ? 1 : 0);

  // Removable chips for every active filter (and the search term).
  const chips: { key: string; label: string; onDelete: () => void }[] = [];
  if (v.search.trim()) chips.push({ key: "search", label: t("chargeManagement@list.searchChip", { value: v.search.trim() }), onDelete: () => props.onSearchChange("") });
  if (v.city) chips.push({ key: "city", label: `${t("chargeManagement@filters.city")}: ${cities.find((c) => c.key === v.city)?.label ?? v.city}`, onDelete: () => props.onCityChange("") });
  if (v.status) chips.push({ key: "status", label: `${t("chargeManagement@filters.status")}: ${v.status}`, onDelete: () => props.onStatusChange("") });
  if (v.verified) chips.push({ key: "verified", label: `${t("chargeManagement@filters.verified")}: ${t(v.verified === "yes" ? "chargeManagement@filters.yes" : "chargeManagement@filters.no")}`, onDelete: () => props.onVerifiedChange("") });
  if (v.stationType) chips.push({ key: "stationType", label: `${t("chargeManagement@filters.stationType")}: ${v.stationType}`, onDelete: () => props.onStationTypeChange("") });
  v.plugTypes.forEach((id) =>
    chips.push({ key: `plug-${id}`, label: `${t("chargeManagement@filters.plugType")}: ${plugLabel(id).short}`, onDelete: () => props.onPlugTypesChange(v.plugTypes.filter((x) => x !== id)) })
  );
  if (v.joined !== "all") chips.push({ key: "joined", label: `${t("chargeManagement@filters.joined")}: ${dateLabel(v.joined)}`, onDelete: () => props.onJoinedChange("all") });
  if (v.edited !== "all") chips.push({ key: "edited", label: `${t("chargeManagement@filters.lastEdit")}: ${dateLabel(v.edited)}`, onDelete: () => props.onEditedChange("all") });

  const selectSx = { minWidth: { xs: "calc(50% - 4px)", sm: 136 }, flex: { xs: "1 1 calc(50% - 4px)", sm: "0 0 auto" } };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        "& .MuiOutlinedInput-root": { borderRadius: 2 },
      }}
    >
      <Stack direction="row" gap={1} useFlexGap flexWrap="wrap" alignItems="center">
        <TextField
          size="small"
          placeholder={t("chargeManagement@list.searchPlaceholder")}
          value={v.search}
          onChange={(e) => props.onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && v.search) {
              e.preventDefault();
              props.onSearchChange("");
            }
          }}
          inputProps={{ "aria-label": t("chargeManagement@list.searchPlaceholder") }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
              </InputAdornment>
            ),
            endAdornment: v.search ? (
              <InputAdornment position="end">
                <IconButton size="small" aria-label={t("chargeManagement@list.clearSearch")} onClick={() => props.onSearchChange("")}>
                  <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{ flex: "1 1 220px", minWidth: { xs: "100%", sm: 200 } }}
        />

        <FormControl size="small" sx={selectSx}>
          <InputLabel>{t("chargeManagement@filters.city")}</InputLabel>
          <Select value={v.city} label={t("chargeManagement@filters.city")} onChange={(e) => props.onCityChange(e.target.value)}>
            <MenuItem value="">{t("chargeManagement@filters.all")}</MenuItem>
            {cities.map((c) => (
              <MenuItem key={c.key} value={c.key}>{c.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={selectSx}>
          <InputLabel>{t("chargeManagement@filters.status")}</InputLabel>
          <Select value={v.status} label={t("chargeManagement@filters.status")} onChange={(e) => props.onStatusChange(e.target.value)}>
            <MenuItem value="">{t("chargeManagement@filters.all")}</MenuItem>
            {statuses.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={selectSx}>
          <InputLabel>{t("chargeManagement@filters.verified")}</InputLabel>
          <Select value={v.verified} label={t("chargeManagement@filters.verified")} onChange={(e) => props.onVerifiedChange(e.target.value)}>
            <MenuItem value="">{t("chargeManagement@filters.all")}</MenuItem>
            <MenuItem value="yes">{t("chargeManagement@filters.yes")}</MenuItem>
            <MenuItem value="no">{t("chargeManagement@filters.no")}</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ ...selectSx, minWidth: { xs: "calc(50% - 4px)", sm: 160 } }}>
          <InputLabel>{t("chargeManagement@sort.label")}</InputLabel>
          <Select value={v.sort} label={t("chargeManagement@sort.label")} onChange={(e) => props.onSortChange(e.target.value as SortOption)}>
            {SORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Badge color="primary" badgeContent={hiddenActiveCount} invisible={hiddenActiveCount === 0} overlap="rectangular">
          <Button
            variant="outlined"
            color={hiddenActiveCount > 0 ? "primary" : "inherit"}
            startIcon={<TuneIcon />}
            onClick={(e) => setMoreAnchor(e.currentTarget)}
            aria-haspopup="dialog"
            aria-expanded={Boolean(moreAnchor)}
            sx={{ height: 40, borderRadius: 2, textTransform: "none", fontWeight: 600, borderColor: "divider", whiteSpace: "nowrap" }}
          >
            {t("chargeManagement@list.moreFilters")}
          </Button>
        </Badge>

        {/* Result count + view toggle on the row end */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ marginInlineStart: "auto" }}>
          <Box sx={{ textAlign: "end", lineHeight: 1.2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }} aria-live="polite">
              <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}><Num v={resultCount} /></Box>{" "}
              {t("chargeManagement@list.stationsWord")}
            </Typography>
            {lastUpdatedLabel && (
              <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: "nowrap", display: "block" }}>
                {lastUpdatedLabel}
              </Typography>
            )}
          </Box>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            size="small"
            onChange={(_, m) => m && props.onViewModeChange(m)}
            sx={{
              "& .MuiToggleButton-root": {
                px: 1,
                py: 0.5,
                borderColor: "divider",
                "&.Mui-selected": { bgcolor: alpha(theme.palette.primary.main, 0.12), color: "primary.main" },
              },
            }}
          >
            <ToggleButton value="card" aria-label={t("chargeManagement@list.cardView")}>
              <Tooltip title={t("chargeManagement@list.cardView")}><ViewModuleIcon fontSize="small" /></Tooltip>
            </ToggleButton>
            <ToggleButton value="table" aria-label={t("chargeManagement@list.tableView")}>
              <Tooltip title={t("chargeManagement@list.tableView")}><ViewListIcon fontSize="small" /></Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {chips.length > 0 && (
        <Stack direction="row" gap={0.75} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mt: 1.5 }}>
          {chips.map((c) => (
            <Chip
              key={c.key}
              size="small"
              label={c.label}
              onDelete={c.onDelete}
              sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.08), color: "primary.main", "& .MuiChip-deleteIcon": { color: alpha(theme.palette.primary.main, 0.6) } }}
            />
          ))}
          <Button size="small" onClick={props.onClearAll} startIcon={<ClearIcon />} sx={{ textTransform: "none", fontWeight: 600 }}>
            {t("chargeManagement@filters.clearAll")}
          </Button>
        </Stack>
      )}

      <Popover
        open={Boolean(moreAnchor)}
        anchorEl={moreAnchor}
        onClose={() => setMoreAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{ paper: { sx: { mt: 1, p: 2, width: 320, maxWidth: "calc(100vw - 32px)", borderRadius: 3 } } }}
      >
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
          {t("chargeManagement@list.moreFilters")}
        </Typography>
        <Stack spacing={2}>
          <FormControl size="small" fullWidth>
            <InputLabel>{t("chargeManagement@filters.stationType")}</InputLabel>
            <Select value={v.stationType} label={t("chargeManagement@filters.stationType")} onChange={(e) => props.onStationTypeChange(e.target.value)}>
              <MenuItem value="">{t("chargeManagement@filters.all")}</MenuItem>
              {stationTypes.map((st) => (
                <MenuItem key={st} value={st}>{st}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>{t("chargeManagement@filters.joined")}</InputLabel>
            <Select value={v.joined} label={t("chargeManagement@filters.joined")} onChange={(e) => props.onJoinedChange(e.target.value as DateRangePreset)}>
              {DATE_RANGE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{t(o.labelKey)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>{t("chargeManagement@filters.lastEdit")}</InputLabel>
            <Select value={v.edited} label={t("chargeManagement@filters.lastEdit")} onChange={(e) => props.onEditedChange(e.target.value as DateRangePreset)}>
              {DATE_RANGE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{t(o.labelKey)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>{t("chargeManagement@filters.plugType")}</InputLabel>
            <Select
              multiple
              value={v.plugTypes}
              label={t("chargeManagement@filters.plugType")}
              onChange={(e) => {
                const val = e.target.value;
                props.onPlugTypesChange(typeof val === "string" ? [] : val);
              }}
              renderValue={(sel) =>
                sel.length === 0
                  ? t("chargeManagement@filters.all")
                  : sel.length === 1
                    ? plugLabel(sel[0]).short
                    : t("chargeManagement@filters.plugTypeCount", { count: sel.length })
              }
            >
              {plugTypes.map((p) => {
                const d = plugDisplay(p, i18n.language);
                return (
                  <MenuItem key={p.id} value={p.id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {d.icon && <Box component="img" src={d.icon} alt="" sx={{ width: 20, height: 20, objectFit: "contain" }} />}
                      <span>{d.full}</span>
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Stack>
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
          <Button
            size="small"
            disabled={hiddenActiveCount === 0}
            onClick={() => {
              props.onStationTypeChange("");
              props.onPlugTypesChange([]);
              props.onJoinedChange("all");
              props.onEditedChange("all");
            }}
            sx={{ textTransform: "none" }}
          >
            {t("chargeManagement@list.resetMore")}
          </Button>
          <Button size="small" variant="contained" onClick={() => setMoreAnchor(null)} sx={{ textTransform: "none", borderRadius: 2 }}>
            {t("chargeManagement@list.done")}
          </Button>
        </Stack>
      </Popover>
    </Paper>
  );
}

export default memo(ChargeFiltersBar);
