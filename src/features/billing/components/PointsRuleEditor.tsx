import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { DecimalField } from "../../../components";
import type { PointsRule, PointsTier } from "../types/api";
import { appendTier, pointsFor, removeTier, validatePointsRule } from "../utils/plan-rules";

interface PointsRuleEditorProps {
  value: PointsRule;
  onChange: (rule: PointsRule) => void;
  disabled?: boolean;
}

/**
 * Fixed or Tiered points rule with live validation (the same rules the server
 * checks for INVALID_TIERS): the lower bound is inside a tier, the upper bound
 * outside it, no gaps or overlaps, and only the last tier is open-ended.
 */
export default function PointsRuleEditor({ value, onChange, disabled }: PointsRuleEditorProps) {
  const { t } = useTranslation();
  const [previewAmount, setPreviewAmount] = useState<number | null>(4);
  const tiers = value.tiers ?? [];
  const error = validatePointsRule(value);

  const setTier = (index: number, patch: Partial<PointsTier>) => {
    const next = tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : { ...tier }));
    // Keep the tiers joined: a tier's upper bound is the next tier's lower bound.
    if (patch.toJod !== undefined && index + 1 < next.length && patch.toJod != null) next[index + 1].fromJod = patch.toJod;
    if (patch.fromJod !== undefined && index > 0) next[index - 1].toJod = patch.fromJod;
    onChange({ ...value, tiers: next });
  };

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value.mode}
        disabled={disabled}
        onChange={(_, mode) => {
          if (!mode) return;
          onChange(
            mode === "Fixed"
              ? { mode, fixedPoints: value.fixedPoints ?? 10, tiers: null }
              : { mode, fixedPoints: null, tiers: tiers.length ? tiers : [{ fromJod: 1, toJod: 3, points: 10 }, { fromJod: 3, toJod: null, points: 20 }] }
          );
        }}
      >
        <ToggleButton value="Fixed">{t("billing@rule.fixed")}</ToggleButton>
        <ToggleButton value="Tiered">{t("billing@rule.tiered")}</ToggleButton>
      </ToggleButtonGroup>

      {value.mode === "Fixed" ? (
        <TextField
          size="small"
          type="number"
          label={t("billing@rule.fixedPoints")}
          value={value.fixedPoints ?? ""}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, fixedPoints: e.target.value === "" ? null : Math.trunc(Number(e.target.value)) })}
          inputProps={{ min: 1, step: 1 }}
          sx={{ maxWidth: 220 }}
          helperText={t("billing@rule.fixedHint")}
        />
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>{t("billing@rule.from")}</TableCell>
                <TableCell>{t("billing@rule.to")}</TableCell>
                <TableCell>{t("billing@rule.points")}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {tiers.map((tier, i) => {
                const last = i === tiers.length - 1;
                return (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell sx={{ minWidth: 130 }}>
                      <DecimalField size="small" value={tier.fromJod} disabled={disabled}
                        onValueChange={(n) => setTier(i, { fromJod: n ?? 0 })}
                        InputProps={{ endAdornment: <InputAdornment position="end">JOD</InputAdornment> }} />
                    </TableCell>
                    <TableCell sx={{ minWidth: 130 }}>
                      {last ? (
                        <Typography variant="body2" color="text.secondary">{t("billing@rule.andAbove")}</Typography>
                      ) : (
                        <DecimalField size="small" value={tier.toJod} disabled={disabled}
                          onValueChange={(n) => setTier(i, { toJod: n })}
                          InputProps={{ endAdornment: <InputAdornment position="end">JOD</InputAdornment> }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ minWidth: 110 }}>
                      <TextField size="small" type="number" value={tier.points} disabled={disabled}
                        onChange={(e) => setTier(i, { points: Math.trunc(Number(e.target.value) || 0) })}
                        inputProps={{ min: 0, step: 1 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t("billing@rule.removeTier")}>
                        <span>
                          <IconButton size="small" disabled={disabled || tiers.length <= 1}
                            onClick={() => onChange({ ...value, tiers: removeTier(tiers, i) })}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Button size="small" startIcon={<AddIcon />} disabled={disabled} sx={{ mt: 1 }}
            onClick={() => onChange({ ...value, tiers: appendTier(tiers) })}>
            {t("billing@rule.addTier")}
          </Button>
          <Typography variant="caption" color="text.secondary" display="block">{t("billing@rule.tiersHint")}</Typography>
        </Box>
      )}

      {error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{t(`billing@rules.${error.key}`, error.values)}</Alert>
      ) : (
        <Stack direction="row" spacing={1} alignItems="center">
          <DecimalField size="small" label={t("billing@rule.previewAmount")} value={previewAmount}
            onValueChange={(n) => setPreviewAmount(n)} sx={{ width: 160 }}
            InputProps={{ endAdornment: <InputAdornment position="end">JOD</InputAdornment> }} />
          <Typography variant="body2" color="text.secondary">
            {t("billing@rule.previewPoints", { points: pointsFor(value, previewAmount ?? 0) })}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}
