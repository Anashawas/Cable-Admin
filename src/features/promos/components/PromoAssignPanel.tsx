import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CityMultiSelect from "../../../components/CityMultiSelect";
import { useSnackbarStore } from "../../../stores";
import { apiErrorMessage } from "../../../utils/api-error";
import { useAssignPromo } from "../hooks/use-promos";
import type { AdminPromoCampaignDto, AssignPromoRequest, PromoAssignTarget } from "../types/api";
import { parseRecipients } from "../utils/recipients";

/** "أعطِ للمستخدمين": All, by city, or a pasted list of user ids / phones — with a push. */
export default function PromoAssignPanel({ campaign }: { campaign: AdminPromoCampaignDto }) {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const assign = useAssignPromo();

  const [target, setTarget] = useState<PromoAssignTarget>("Users");
  const [cities, setCities] = useState<string[]>([]);
  const [recipients, setRecipients] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const parsed = useMemo(() => parseRecipients(recipients), [recipients]);
  const canSend =
    target === "All" || (target === "City" && cities.length > 0) || (target === "Users" && parsed.userIds.length + parsed.phones.length > 0);

  const send = () => {
    const body: AssignPromoRequest =
      target === "All" ? { target } : target === "City" ? { target, cities } : { target, userIds: parsed.userIds, phones: parsed.phones };
    assign.mutate(
      { id: campaign.id, body },
      {
        onSuccess: (r) => {
          setConfirmOpen(false);
          openSuccessSnackbar({ message: t("promos@assign.done", { assigned: r.assigned, skipped: r.skipped }) });
          if (target === "Users") setRecipients("");
        },
        onError: (err) => {
          setConfirmOpen(false);
          openErrorSnackbar({ message: apiErrorMessage(err, t("loadingFailed")) });
        },
      }
    );
  };

  return (
    <Stack spacing={2}>
      {!campaign.isActive && <Alert severity="warning" sx={{ borderRadius: 2 }}>{t("promos@assign.inactive")}</Alert>}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={800}>{t("promos@assign.title")}</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>{t("promos@assign.hint")}</Typography>
        <Stack spacing={2}>
          <ToggleButtonGroup exclusive size="small" value={target} onChange={(_, v) => v && setTarget(v as PromoAssignTarget)}>
            <ToggleButton value="Users">{t("promos@assign.target.Users")}</ToggleButton>
            <ToggleButton value="City">{t("promos@assign.target.City")}</ToggleButton>
            <ToggleButton value="All">{t("promos@assign.target.All")}</ToggleButton>
          </ToggleButtonGroup>
          {target === "City" && (
            <CityMultiSelect value={cities} onChange={setCities} label={t("promos@assign.cities")} />
          )}
          {target === "Users" && (
            <TextField multiline minRows={4} fullWidth label={t("promos@assign.recipients")} value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              helperText={t("promos@assign.recipientsHint", { users: parsed.userIds.length, phones: parsed.phones.length })}
              inputProps={{ dir: "ltr" }} />
          )}
          {target === "All" && <Alert severity="warning" sx={{ borderRadius: 2 }}>{t("promos@assign.allWarning")}</Alert>}
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" startIcon={<SendIcon />} disabled={!canSend || assign.isPending} onClick={() => setConfirmOpen(true)}>
              {t("promos@assign.send")}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Dialog open={confirmOpen} onClose={() => !assign.isPending && setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t("promos@assign.confirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {target === "All"
              ? t("promos@assign.confirmAll")
              : target === "City"
                ? t("promos@assign.confirmCity", { count: cities.length })
                : t("promos@assign.confirmUsers", { count: parsed.userIds.length + parsed.phones.length })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={assign.isPending} color="inherit">{t("cancel")}</Button>
          <Button variant="contained" onClick={send} disabled={assign.isPending}
            startIcon={assign.isPending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}>
            {t("promos@assign.send")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
