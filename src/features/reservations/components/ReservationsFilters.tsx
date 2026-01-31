import { memo, useMemo } from "react";
import {
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Clear, FilterList, Close } from "@mui/icons-material";
import { Card } from "../../../components";
import { DatePicker } from "@mui/x-date-pickers";
import { useTranslation } from "react-i18next";
import { ReservationFilters } from "../types/api";
import { useUsers, useCampingSeasons, useReservationStatuses } from "../hooks/use-filter-options";

interface ReservationsFiltersProps {
  filters: ReservationFilters;
  onFiltersChange: (filters: ReservationFilters) => void;
}

const ReservationsFilters = ({ filters, onFiltersChange }: ReservationsFiltersProps) => {
  const { t } = useTranslation();

  const { data: users, isLoading: isLoadingUsers } = useUsers();
  const { data: campingSeasons, isLoading: isLoadingSeasons } = useCampingSeasons();
  const { data: reservationStatuses, isLoading: isLoadingStatuses } = useReservationStatuses();

  const activeUsers = useMemo(() => {
    return users?.filter(user => user.isActive && user.civilId) || []; // Only show users with Civil IDs
  }, [users]);

  const activeCampingSeasons = useMemo(() => {
    return campingSeasons?.filter(season => !season.isDeleted) || [];
  }, [campingSeasons]);

  const handleFilterChange = (field: keyof ReservationFilters, value: any) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleClearFilter = (field: keyof ReservationFilters) => {
    onFiltersChange({ ...filters, [field]: field === 'includeDeleted' ? false : null });
  };

  const handleClearAllFilters = () => {
    onFiltersChange({
      reservationNumber: null,
      campingSeasonId: null,
      userId: null,
      reservationStatusIds: null,
      fromReservationDate: null,
      toReservationDate: null,
      includeDeleted: false,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.reservationNumber) count++;
    if (filters.campingSeasonId) count++;
    if (filters.userId) count++;
    if (filters.reservationStatusIds && filters.reservationStatusIds.length > 0) count++;
    if (filters.fromReservationDate) count++;
    if (filters.toReservationDate) count++;
    if (filters.includeDeleted) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <Card >
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterList sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {t("reservations@filters.filter")}
          </Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={`${activeFilterCount} ${t("activeFilters")}`}
              size="small"
              color="primary"
              sx={{ ml: 1, mr: 1, fontSize: '0.75rem' }}
            />
          )}
          {hasActiveFilters && (
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={handleClearAllFilters}
              sx={{
                ml: 'auto',
                fontSize: '0.75rem',
                textTransform: 'none'
              }}
            >
              {t("clearAllFilters")}
            </Button>
          )}
        </Box>


        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              label={t("reservations@filters.reservationNumber")}
              value={filters.reservationNumber || ""}
              onChange={(e) => handleFilterChange("reservationNumber", e.target.value || null)}
              InputProps={{
                endAdornment: filters.reservationNumber && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => handleClearFilter("reservationNumber")}
                      edge="end"
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small" disabled={isLoadingSeasons}>
              <InputLabel>{t("reservations@filters.campingSeason")}</InputLabel>
              <Select
                value={filters.campingSeasonId || ""}
                onChange={(e) => handleFilterChange("campingSeasonId", e.target.value || null)}
                label={t("reservations@filters.campingSeason")}
                endAdornment={filters.campingSeasonId && !isLoadingSeasons && (
                  <InputAdornment position="end" sx={{ mr: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleClearFilter("campingSeasonId")}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">{t("all")}</MenuItem>
                {activeCampingSeasons.map((season) => (
                  <MenuItem key={season.id} value={season.id}>
                    {season.name}
                  </MenuItem>
                ))}
              </Select>
              {isLoadingSeasons && (
                <Box sx={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)' }}>
                  <CircularProgress size={20} />
                </Box>
              )}
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small" disabled={isLoadingUsers}>
              <InputLabel>{t("reservations@filters.user")}</InputLabel>
              <Select
                value={filters.userId || ""}
                onChange={(e) => handleFilterChange("userId", e.target.value || null)}
                label={t("reservations@filters.user")}
                endAdornment={filters.userId && !isLoadingUsers && (
                  <InputAdornment position="end" sx={{ mr: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleClearFilter("userId")}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">{t("all")}</MenuItem>
                {activeUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} ({user.civilId})
                  </MenuItem>
                ))}
              </Select>
              {isLoadingUsers && (
                <Box sx={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)' }}>
                  <CircularProgress size={20} />
                </Box>
              )}
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small" disabled={isLoadingStatuses}>
              <InputLabel>{t("reservations@filters.status")}</InputLabel>
              <Select
                value={filters.reservationStatusIds?.[0] || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange("reservationStatusIds", value ? [value] : null);
                }}
                label={t("reservations@filters.status")}
                endAdornment={filters.reservationStatusIds && filters.reservationStatusIds.length > 0 && !isLoadingStatuses && (
                  <InputAdornment position="end" sx={{ mr: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleClearFilter("reservationStatusIds")}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">{t("all")}</MenuItem>
                {reservationStatuses
                  ?.filter(status => status.id !== 6 && status.id !== 12)
                  .map((status) => (
                    <MenuItem key={status.id || status.name} value={status.id}>
                      {status.name}
                    </MenuItem>
                  ))}
              </Select>
              {isLoadingStatuses && (
                <Box sx={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)' }}>
                  <CircularProgress size={20} />
                </Box>
              )}
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <DatePicker
              label={t("reservations@filters.fromDate")}
              value={filters.fromReservationDate ? new Date(filters.fromReservationDate) : null}
              onChange={(date) => {
                if (!date) {
                  handleFilterChange("fromReservationDate", null);
                  return;
                }
                // Set to start of day
                const formattedDate = new Date(date);
                formattedDate.setHours(0, 0, 0, 0);
                handleFilterChange("fromReservationDate", formattedDate.toISOString());
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }
                }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <DatePicker
              label={t("reservations@filters.toDate")}
              value={filters.toReservationDate ? new Date(filters.toReservationDate) : null}
              onChange={(date) => {
                if (!date) {
                  handleFilterChange("toReservationDate", null);
                  return;
                }
                // Set to end of day to be inclusive
                const formattedDate = new Date(date);
                formattedDate.setHours(23, 59, 59, 999);
                handleFilterChange("toReservationDate", formattedDate.toISOString());
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }
                }
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default memo(ReservationsFilters);