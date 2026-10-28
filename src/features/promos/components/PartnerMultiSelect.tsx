import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Autocomplete, Box, Chip, TextField, Typography } from "@mui/material";
import { getAllChargingPoints } from "../../charge-management/services/charge-management-service";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";
import { cityLabel } from "../../dashboard/utils/city-names";

interface PartnerOption {
  id: number;
  name: string;
  city?: string | null;
  extra?: string | null;
}

interface PartnerMultiSelectProps {
  kind: "stations" | "providers";
  value: number[];
  onChange: (ids: number[]) => void;
  label: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

/** Searchable multi-select of stations or service providers (by name, city, id). */
export default function PartnerMultiSelect({ kind, value, onChange, label, error, helperText, disabled }: PartnerMultiSelectProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { data: options = [], isLoading } = useQuery({
    queryKey: ["promos", "partner-options", kind],
    queryFn: async ({ signal }): Promise<PartnerOption[]> => {
      if (kind === "stations") {
        const rows = await getAllChargingPoints(undefined, signal);
        return rows.map((s) => ({ id: s.id, name: s.name?.trim() || `#${s.id}`, city: s.cityName }));
      }
      const rows = await getAllServiceProviders();
      return (rows ?? []).map((p) => ({
        id: p.id,
        name: p.name?.trim() || `#${p.id}`,
        city: p.cityName ?? null,
        extra: lang.startsWith("ar") ? p.serviceCategoryNameAr ?? p.serviceCategoryName : p.serviceCategoryName,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  // Keep ids the list doesn't know (deleted partner) visible so they can be removed.
  const selected = value.map((id) => byId.get(id) ?? { id, name: `#${id}` });

  return (
    <Autocomplete
      multiple
      size="small"
      disabled={disabled}
      loading={isLoading}
      options={options}
      value={selected}
      onChange={(_, v) => onChange(v.map((o) => o.id))}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      getOptionLabel={(o) => o.name}
      filterSelectedOptions
      filterOptions={(opts, state) => {
        const q = state.inputValue.trim().toLowerCase();
        if (!q) return opts.slice(0, 200);
        return opts
          .filter((o) => o.name.toLowerCase().includes(q) || String(o.id) === q || (o.city ?? "").toLowerCase().includes(q)
            || cityLabel(o.city ?? "", lang).includes(q))
          .slice(0, 200);
      }}
      renderOption={(props, o) => {
        const { key, ...rest } = props as typeof props & { key: string };
        return (
          <li key={key} {...rest}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600}>{o.name} <Typography component="span" variant="caption" color="text.disabled">#{o.id}</Typography></Typography>
              <Typography variant="caption" color="text.secondary">
                {[o.city ? cityLabel(o.city, lang) : null, o.extra].filter(Boolean).join(" · ")}
              </Typography>
            </Box>
          </li>
        );
      }}
      renderTags={(tags, getTagProps) =>
        tags.map((o, index) => {
          const { key, ...rest } = getTagProps({ index });
          return <Chip key={key} size="small" label={o.name} {...rest} />;
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText ?? t("promos@form.selectedCount", { count: value.length })}
        />
      )}
    />
  );
}
