import React, { memo, ReactNode } from "react";
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
  Collapse,
  FormControlLabel,
  Switch,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { Clear, FilterList, Close } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { useTranslation } from "react-i18next";
import Card from "./Card";

export type FilterFieldType =
  | "text"
  | "select"
  | "multiselect"
  | "date"
  | "boolean"
  | "number"
  | "autocomplete";

export interface FilterSelectOption {
  value: string | number;
  label: string;
}

export interface FilterField {
  key: string;
  type: FilterFieldType;
  labelKey: string;
  options?: FilterSelectOption[];
  placeholder?: string;
  gridSize?: { xs?: number; sm?: number; md?: number; lg?: number };
  valueAsArray?: boolean; // If true, select will store value as [value] array
  searchable?: boolean; // If true, select will be searchable (uses Autocomplete instead)
  // Autocomplete specific props
  onSearch?: (value: string) => Promise<FilterSelectOption[]>;
  isLoadingOptions?: boolean;
  freeSolo?: boolean; // Allow entering custom values not in options
}

export interface CollapsibleFiltersProps<T extends Record<string, any>> {
  title: string;
  open: boolean;
  filters: T;
  fields: FilterField[];
  onFiltersChange: (filters: T) => void;
  activeFiltersLabelKey?: string;
  clearAllFiltersLabelKey?: string;
  backgroundColor?: string;
}

const CollapsibleFilters = <T extends Record<string, any>>({
  title,
  open,
  filters,
  fields,
  onFiltersChange,
  activeFiltersLabelKey = "activeFilters",
  clearAllFiltersLabelKey = "clearAllFilters",
  backgroundColor = "secondary",
}: CollapsibleFiltersProps<T>) => {
  const { t } = useTranslation();

  const handleFilterChange = (field: string, value: any) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleClearFilter = (field: string, defaultValue: any = null) => {
    onFiltersChange({ ...filters, [field]: defaultValue });
  };

  const handleClearAllFilters = () => {
    const clearedFilters = {} as T;
    fields.forEach((field) => {
      if (field.type === "boolean") {
        clearedFilters[field.key as keyof T] = false as any;
      } else {
        clearedFilters[field.key as keyof T] = null as any;
      }
    });
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    fields.forEach((field) => {
      const value = filters[field.key];
      if (field.type === "boolean") {
        if (value === true) count++;
      } else if (field.type === "multiselect" || field.valueAsArray) {
        if (Array.isArray(value) && value.length > 0) count++;
      } else {
        if (value !== null && value !== undefined && value !== "") count++;
      }
    });
    return count;
  };

  const activeFilterCount = getActiveFilterCount();
  const hasActiveFilters = activeFilterCount > 0;

  const renderField = (field: FilterField): ReactNode => {
    const value = filters[field.key];
    const hasValue = field.type === "boolean"
      ? value === true
      : field.type === "multiselect" || field.valueAsArray
        ? Array.isArray(value) && value.length > 0
        : value !== null && value !== undefined && value !== "";

    switch (field.type) {
      case "text":
      case "number":
        return (
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            type={field.type}
            label={t(field.labelKey)}
            value={value || ""}
            onChange={(e) => handleFilterChange(field.key, e.target.value || null)}
            placeholder={field.placeholder ? t(field.placeholder) : undefined}
            InputProps={{
              endAdornment: hasValue && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleClearFilter(field.key)}
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
        );

      case "select":
        // Use Autocomplete for searchable selects
        if (field.searchable) {
          const selectedOption = field.valueAsArray
            ? field.options?.find((opt) => opt.value === value?.[0]) || null
            : field.options?.find((opt) => opt.value === value) || null;

          return (
            <Autocomplete
              fullWidth
              size="small"
              options={field.options || []}
              value={selectedOption}
              onChange={(_, newValue) => {
                if (field.valueAsArray) {
                  handleFilterChange(
                    field.key,
                    newValue ? [newValue.value] : null
                  );
                } else {
                  handleFilterChange(field.key, newValue?.value || null);
                }
              }}
              getOptionLabel={(option) => option.label || ""}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              noOptionsText={t("noOptions")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t(field.labelKey)}
                  placeholder={field.placeholder ? t(field.placeholder) : undefined}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              )}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          );
        }

        // Standard non-searchable select
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{t(field.labelKey)}</InputLabel>
            <Select
              value={field.valueAsArray ? (value?.[0] || "") : (value || "")}
              onChange={(e) => {
                const selectedValue = e.target.value;
                handleFilterChange(
                  field.key,
                  field.valueAsArray
                    ? (selectedValue ? [selectedValue] : null)
                    : (selectedValue || null)
                );
              }}
              label={t(field.labelKey)}
              endAdornment={hasValue && (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleClearFilter(field.key)}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">{t("all")}</MenuItem>
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case "multiselect":
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{t(field.labelKey)}</InputLabel>
            <Select
              multiple
              value={value || []}
              onChange={(e) => {
                const selectedValue = e.target.value;
                handleFilterChange(
                  field.key,
                  typeof selectedValue === 'string' ? [] : (selectedValue.length > 0 ? selectedValue : null)
                );
              }}
              label={t(field.labelKey)}
              renderValue={(selected) => {
                if (!selected || selected.length === 0) return t("all");
                return selected
                  .map((val: string | number) => field.options?.find((opt) => opt.value === val)?.label)
                  .filter(Boolean)
                  .join(", ");
              }}
              endAdornment={hasValue && (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleClearFilter(field.key)}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )}
              sx={{ borderRadius: 2 }}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case "date":
        return (
          <DatePicker
            label={t(field.labelKey)}
            value={value ? new Date(value) : null}
            onChange={(date) => {
              if (!date) {
                handleFilterChange(field.key, null);
                return;
              }

              // Format date to include full day range
              const formattedDate = new Date(date);

              // For "to" date fields, set to end of day
              if (field.key.toLowerCase().includes('to')) {
                formattedDate.setHours(23, 59, 59, 999);
              } else {
                // For "from" date fields, set to start of day
                formattedDate.setHours(0, 0, 0, 0);
              }

              handleFilterChange(field.key, formattedDate.toISOString());
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
        );

      case "boolean":
        return (
          <FormControlLabel
            control={
              <Switch
                checked={value || false}
                onChange={(e) => handleFilterChange(field.key, e.target.checked)}
              />
            }
            label={t(field.labelKey)}
          />
        );

      case "autocomplete":
        return (
          <Autocomplete
            fullWidth
            size="small"
            freeSolo={field.freeSolo}
            options={field.options || []}
            value={field.options?.find((opt) => opt.value === value) || null}
            loading={field.isLoadingOptions}
            onChange={(_, newValue) => {
              if (newValue && typeof newValue === "object") {
                handleFilterChange(field.key, newValue.value || null);
              } else {
                handleFilterChange(field.key, null);
              }
            }}
            onInputChange={async (_, newInputValue) => {
              if (field.onSearch && newInputValue) {
                await field.onSearch(newInputValue);
              }
            }}
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;
              return option.label || "";
            }}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            noOptionsText={t("noOptions")}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t(field.labelKey)}
                placeholder={field.placeholder ? t(field.placeholder) : undefined}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {field.isLoadingOptions ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            )}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Collapse in={open} timeout={300}>
      <Card sx={{ backgroundColor }}>
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterList sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {activeFilterCount > 0 && (
              <Chip
                label={`${activeFilterCount} ${t(activeFiltersLabelKey)}`}
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
                {t(clearAllFiltersLabelKey)}
              </Button>
            )}
          </Box>

          <Grid container spacing={2} alignItems="center">
            {fields.map((field) => (
              <Grid
                key={field.key}
                size={field.gridSize || { xs: 12, sm: 6, md: 2 }}
              >
                {renderField(field)}
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Collapse>
  );
};

export default memo(CollapsibleFilters) as <T extends Record<string, any>>(
  props: CollapsibleFiltersProps<T>
) => React.JSX.Element;