import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { DecimalField } from "../../../components";
import type { PlanCategory } from "../types/api";
import { validatePriceOption, type PriceOptionDraft } from "../utils/plan-rules";

interface PriceOptionsEditorProps {
  category: PlanCategory;
  value: PriceOptionDraft[];
  onChange: (options: PriceOptionDraft[]) => void;
  disabled?: boolean;
}

const intOrNull = (v: string): number | null => (v.trim() === "" ? null : Math.trunc(Number(v)));

/**
 * The price options table: months / price / scans or "unlimited". Options with
 * an id are updated, new ones added, and removed ones retired by the server
 * (never deleted — records keep their snapshot).
 */
export default function PriceOptionsEditor({ category, value, onChange, disabled }: PriceOptionsEditorProps) {
  const { t } = useTranslation();
  const loyalty = category === "Loyalty";

  const setRow = (index: number, patch: Partial<PriceOptionDraft>) =>
    onChange(value.map((o, i) => (i === index ? { ...o, ...patch } : o)));

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t("billing@option.monthsCol")}</TableCell>
            <TableCell>{t("billing@option.priceCol")}</TableCell>
            {loyalty && <TableCell>{t("billing@option.scansCol")}</TableCell>}
            {loyalty && <TableCell>{t("billing@option.unlimitedCol")}</TableCell>}
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {value.map((o, i) => {
            const error = validatePriceOption(category, o);
            return (
              <TableRow key={o.id ?? `new-${i}`}>
                <TableCell sx={{ minWidth: 110 }}>
                  <TextField size="small" type="number" value={o.months ?? ""} disabled={disabled}
                    placeholder={loyalty ? t("billing@option.noTimeLimit") : undefined}
                    onChange={(e) => setRow(i, { months: intOrNull(e.target.value) })} inputProps={{ min: 1, max: 24 }} />
                </TableCell>
                <TableCell sx={{ minWidth: 140 }}>
                  <DecimalField size="small" value={o.priceJod} disabled={disabled} onValueChange={(n) => setRow(i, { priceJod: n })}
                    InputProps={{ endAdornment: <InputAdornment position="end">JOD</InputAdornment> }} />
                </TableCell>
                {loyalty && (
                  <TableCell sx={{ minWidth: 110 }}>
                    <TextField size="small" type="number" value={o.unlimited ? "" : o.scans ?? ""} disabled={disabled || o.unlimited}
                      placeholder={o.unlimited ? "∞" : undefined}
                      onChange={(e) => setRow(i, { scans: intOrNull(e.target.value) })} inputProps={{ min: 1 }} />
                  </TableCell>
                )}
                {loyalty && (
                  <TableCell>
                    <Checkbox size="small" checked={o.unlimited} disabled={disabled}
                      onChange={(e) => setRow(i, { unlimited: e.target.checked, scans: e.target.checked ? null : o.scans })} />
                  </TableCell>
                )}
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  {error && (
                    <Typography variant="caption" color="error" sx={{ marginInlineEnd: 1 }}>
                      {t(`billing@rules.${error.key}`, error.values)}
                    </Typography>
                  )}
                  <Tooltip title={o.id ? t("billing@option.retire") : t("billing@option.remove")}>
                    <span>
                      <IconButton size="small" disabled={disabled} onClick={() => onChange(value.filter((_, j) => j !== i))}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
          {value.length === 0 && (
            <TableRow>
              <TableCell colSpan={loyalty ? 5 : 3}>
                <Typography variant="body2" color="text.secondary">{t("billing@option.none")}</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Button size="small" startIcon={<AddIcon />} disabled={disabled} sx={{ mt: 1 }}
        onClick={() => onChange([...value, { months: loyalty ? null : 1, priceJod: null, scans: loyalty ? 100 : null, unlimited: false }])}>
        {t("billing@option.add")}
      </Button>
      <Typography variant="caption" color="text.secondary" display="block">
        {loyalty ? t("billing@option.loyaltyHint") : t("billing@option.subscriptionHint")}
      </Typography>
    </Box>
  );
}
