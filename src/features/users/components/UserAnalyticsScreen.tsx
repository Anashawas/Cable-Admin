import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Box, Stack, Typography, Skeleton, Chip, Tooltip, IconButton, Paper, TextField, MenuItem, Divider } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import InsightsIcon from "@mui/icons-material/Insights";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ClearIcon from "@mui/icons-material/Clear";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import UserInsightsPanel from "./UserInsightsPanel";
import { useCarTypeStats } from "../hooks/use-user-stats";
import { getUsersList } from "../services/user-service";

export default function UserAnalyticsScreen() {
  const { t } = useTranslation("userManagement");

  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedPlug, setSelectedPlug] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["users", "list"],
    queryFn: ({ signal }) => getUsersList(signal),
  });

  const carStats = useCarTypeStats(data);

  const modelOptions = useMemo(() => {
    if (!selectedBrand) return [];
    return carStats.find((s) => s.name === selectedBrand)?.models ?? [];
  }, [carStats, selectedBrand]);

  const plugOptions = useMemo(() => {
    if (!selectedBrand) return [];
    return carStats.find((s) => s.name === selectedBrand)?.plugs ?? [];
  }, [carStats, selectedBrand]);

  const filteredUsers = useMemo(() => {
    let result = data;

    if (dateFrom || dateTo) {
      const from = dateFrom ? dateFrom.getTime() : 0;
      const to = dateTo
        ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999).getTime()
        : Infinity;
      result = result.filter((u) => {
        if (!u.createdAt) return false;
        const ms = new Date(u.createdAt).getTime();
        return ms >= from && ms <= to;
      });
    }

    if (selectedBrand) {
      result = result.filter((u) =>
        u.userCars?.some((c) => {
          if (c.carTypeName?.trim() !== selectedBrand) return false;
          if (selectedModel && c.carModelName?.trim() !== selectedModel) return false;
          if (selectedPlug && c.plugTypeName?.trim() !== selectedPlug) return false;
          return true;
        })
      );
    }

    return result;
  }, [data, dateFrom, dateTo, selectedBrand, selectedModel, selectedPlug]);

  const isDateFiltered = !!(dateFrom || dateTo);
  const isCarFiltered = !!selectedBrand;
  const isFiltered = isDateFiltered || isCarFiltered;
  const displayUsers = isFiltered ? filteredUsers : data;

  const clearCarFilter = () => { setSelectedBrand(""); setSelectedModel(""); setSelectedPlug(""); };
  const clearDateFilter = () => { setDateFrom(null); setDateTo(null); };

  return (
    <AppScreenContainer>
      {/* Banner */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
          borderRadius: 3,
          p: { xs: 2.5, md: 4 },
          mb: 3,
          position: "relative",
          overflow: "hidden",
          color: "white",
        }}
      >
        <Box sx={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -60, right: 100, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Box sx={{ width: 64, height: 64, borderRadius: 2, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <InsightsIcon sx={{ fontSize: 36, color: "white" }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700} color="white">{t("userAnalytics")}</Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.5 }}>{t("userAnalytics_subtitle")}</Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap">
              <Box sx={{ background: "rgba(255,255,255,0.13)", borderRadius: 2, px: 2, py: 1, minWidth: 90 }}>
                {isLoading ? (
                  <Skeleton variant="rounded" width={56} height={36} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                ) : (
                  <Typography variant="h5" fontWeight={700} color="white" sx={{ fontSize: isFiltered ? "1rem" : undefined }}>
                    {isFiltered ? `${displayUsers.length} / ${data.length}` : data.length}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("insights_totalUsers")}</Typography>
              </Box>
              <Box sx={{ background: "rgba(255,255,255,0.13)", borderRadius: 2, px: 2, py: 1, minWidth: 90 }}>
                {isLoading ? (
                  <Skeleton variant="rounded" width={56} height={36} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                ) : (
                  <Typography variant="h5" fontWeight={700} color="white">{displayUsers.filter((u) => u.isActive !== false).length}</Typography>
                )}
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("insights_activeUsers")}</Typography>
              </Box>
              <Box sx={{ background: "rgba(255,255,255,0.13)", borderRadius: 2, px: 2, py: 1, minWidth: 90 }}>
                {isLoading ? (
                  <Skeleton variant="rounded" width={56} height={36} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                ) : (
                  <Typography variant="h5" fontWeight={700} color="white">{displayUsers.filter((u) => u.isActive === false).length}</Typography>
                )}
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>{t("insights_inactiveUsers")}</Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* Filter bar */}
      <Paper elevation={1} sx={{ borderRadius: 2, p: 2, mb: 2.5 }}>
        <Stack spacing={1.5}>
          {/* Date row */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
            <CalendarMonthIcon color="action" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={600} sx={{ minWidth: 140 }}>
              {t("insights_registrationDate")}
            </Typography>
            <DatePicker
              label={t("insights_dateFrom")}
              value={dateFrom}
              onChange={(d) => setDateFrom(d)}
              maxDate={dateTo ?? undefined}
              slotProps={{ textField: { size: "small", sx: { minWidth: 160 } } }}
            />
            <DatePicker
              label={t("insights_dateTo")}
              value={dateTo}
              onChange={(d) => setDateTo(d)}
              minDate={dateFrom ?? undefined}
              slotProps={{ textField: { size: "small", sx: { minWidth: 160 } } }}
            />
            {isDateFiltered && (
              <>
                <Chip
                  label={t("insights_usersInRange", { count: filteredUsers.length })}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                <Tooltip title={t("insights_clearDates")}>
                  <IconButton size="small" onClick={clearDateFilter}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>

          <Divider />

          {/* Car filter row */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
            <DirectionsCarIcon color="action" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={600} sx={{ minWidth: 140 }}>
              {t("filterByCar")}
            </Typography>

            {/* Brand */}
            <TextField
              select
              size="small"
              label={t("allBrands")}
              value={selectedBrand}
              onChange={(e) => { setSelectedBrand(e.target.value); setSelectedModel(""); setSelectedPlug(""); }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">{t("allBrands")}</MenuItem>
              <Divider />
              {carStats.map((s) => (
                <MenuItem key={s.name} value={s.name}>
                  {s.name} <Chip label={s.count} size="small" sx={{ ml: 1, height: 18, fontSize: 11 }} />
                </MenuItem>
              ))}
            </TextField>

            {/* Model — only shown when brand selected */}
            {selectedBrand && modelOptions.length > 0 && (
              <TextField
                select
                size="small"
                label={t("allModels")}
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">{t("allModels")}</MenuItem>
                <Divider />
                {modelOptions.map((m) => (
                  <MenuItem key={m.name} value={m.name}>
                    {m.name} <Chip label={m.count} size="small" sx={{ ml: 1, height: 18, fontSize: 11 }} />
                  </MenuItem>
                ))}
              </TextField>
            )}

            {/* Plug type — only shown when brand selected */}
            {selectedBrand && plugOptions.length > 0 && (
              <TextField
                select
                size="small"
                label={t("allPlugTypes")}
                value={selectedPlug}
                onChange={(e) => setSelectedPlug(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">{t("allPlugTypes")}</MenuItem>
                <Divider />
                {plugOptions.map((p) => (
                  <MenuItem key={p.name} value={p.name}>
                    {p.name} <Chip label={p.count} size="small" sx={{ ml: 1, height: 18, fontSize: 11 }} />
                  </MenuItem>
                ))}
              </TextField>
            )}

            {isCarFiltered && (
              <Tooltip title={t("clearFilters")}>
                <IconButton size="small" onClick={clearCarFilter}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>

          {/* Combined result chip */}
          {isFiltered && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={t("insights_usersInRange", { count: displayUsers.length })}
                color="success"
                size="small"
                sx={{ fontWeight: 700 }}
              />
              <Typography variant="caption" color="text.secondary">
                {`/ ${data.length}`}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: 2 }} />
        </Box>
      ) : (
        <UserInsightsPanel users={displayUsers} />
      )}
    </AppScreenContainer>
  );
}
