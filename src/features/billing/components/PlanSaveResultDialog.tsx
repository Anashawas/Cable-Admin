import { useTranslation } from "react-i18next";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import type { PlanSaveResult } from "../types/api";
import PlanChangesList from "./PlanChangesList";

/** After a save: what changed, and the server's warnings about who it affects. */
export default function PlanSaveResultDialog({ result, onClose }: { result: PlanSaveResult | null; onClose: () => void }) {
  const { t } = useTranslation();
  if (!result) return null;
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>{t("billing@plan.savedTitle")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {result.affectedSubscribers > 0 && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              {t("billing@plan.affectedSubscribers", { count: result.affectedSubscribers })}
            </Alert>
          )}
          {result.pricingChangedForNewOnly && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>{t("billing@plan.pricingForNewOnly")}</Alert>
          )}
          <PlanChangesList changes={result.changes ?? []} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="contained" onClick={onClose}>{t("close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
