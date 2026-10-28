import { useTranslation } from "react-i18next";
import { Autocomplete, Chip, TextField } from "@mui/material";
import { CITIES } from "../features/charge-management/constants/options";
import { cityKey, cityLabel } from "../features/dashboard/utils/city-names";

interface CityMultiSelectProps {
  value: string[];
  onChange: (cities: string[]) => void;
  label: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  size?: "small" | "medium";
}

/**
 * The 12 canonical Jordan cities the API resolves (`JordanCityResolver`).
 * Values are the canonical English names; the label follows the UI language.
 * An empty selection means "every city".
 */
export default function CityMultiSelect({
  value,
  onChange,
  label,
  helperText,
  error,
  disabled,
  size = "small",
}: CityMultiSelectProps) {
  const { i18n } = useTranslation();
  // Older rows may carry another spelling — map them onto the option with the same city key.
  const toOption = (c: string) => CITIES.find((o) => cityKey(o) === cityKey(c)) ?? c;
  const selected = Array.from(new Set(value.map(toOption)));
  return (
    <Autocomplete
      multiple
      size={size}
      disabled={disabled}
      options={[...CITIES]}
      value={selected}
      onChange={(_, v) => onChange(v)}
      getOptionLabel={(c) => cityLabel(c, i18n.language)}
      filterSelectedOptions
      renderTags={(tags, getTagProps) =>
        tags.map((c, index) => {
          const { key, ...rest } = getTagProps({ index });
          return <Chip key={key} size="small" label={cityLabel(c, i18n.language)} {...rest} />;
        })
      }
      renderInput={(params) => (
        <TextField {...params} label={label} helperText={helperText} error={error} />
      )}
    />
  );
}
