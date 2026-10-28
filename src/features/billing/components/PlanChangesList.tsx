import { useTranslation } from "react-i18next";
import { Chip, Stack, Typography } from "@mui/material";
import type { PlanChange } from "../types/api";

const show = (v: unknown): string => {
  if (v == null) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

/** One change-log entry's diff: `field: from → to`, or the features added / removed. */
export default function PlanChangesList({ changes }: { changes: PlanChange[] }) {
  const { t } = useTranslation();
  if (!changes.length) return <Typography variant="body2" color="text.secondary">{t("billing@history.noChanges")}</Typography>;
  return (
    <Stack spacing={0.75}>
      {changes.map((c, i) => (
        <Stack key={`${c.field}-${i}`} direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="body2" fontWeight={700} sx={{ fontFamily: "monospace" }}>{c.field}</Typography>
          {c.added || c.removed ? (
            <>
              {(c.added ?? []).map((k) => <Chip key={`+${k}`} size="small" color="success" variant="outlined" label={`+ ${k}`} />)}
              {(c.removed ?? []).map((k) => <Chip key={`-${k}`} size="small" color="error" variant="outlined" label={`− ${k}`} />)}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ wordBreak: "break-all" }}>
              {show(c.from)} → <b>{show(c.to)}</b>
            </Typography>
          )}
        </Stack>
      ))}
    </Stack>
  );
}
