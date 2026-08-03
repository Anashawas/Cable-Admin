import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  getNotificationTypes,
  getNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
} from "../services/notification-service";
import type {
  NotificationTypeDto,
  NotificationTemplateDto,
} from "../types/api";

/** Human label for a type: prefer display names once BE adds them, else code. */
function typeLabel(t: NotificationTypeDto, isAr: boolean): string {
  if (isAr && t.nameAr) return t.nameAr;
  if (!isAr && t.nameEn) return t.nameEn;
  return t.nameEn ?? t.nameAr ?? t.name;
}

export default function NotificationTemplatesScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [filterTypeId, setFilterTypeId] = useState<number | "">("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formTypeId, setFormTypeId] = useState<number | "">("");
  const [formBody, setFormBody] = useState("");

  const { data: types = [] } = useQuery({
    queryKey: ["notification-types"],
    queryFn: ({ signal }) => getNotificationTypes(signal),
  });

  const {
    data: templates = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notification-templates", filterTypeId],
    queryFn: ({ signal }) =>
      getNotificationTemplates(filterTypeId || undefined, signal),
  });

  const typeById = useMemo(() => {
    const m = new Map<number, NotificationTypeDto>();
    types.forEach((x) => m.set(x.id, x));
    return m;
  }, [types]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { notificationTypeId: Number(formTypeId), body: formBody.trim() };
      return editId == null
        ? createNotificationTemplate(payload)
        : updateNotificationTemplate(editId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      openSuccessSnackbar({ message: t("templates@saved") });
      setOpen(false);
    },
    onError: (err: Error) =>
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNotificationTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
      openSuccessSnackbar({ message: t("templates@deleted") });
    },
    onError: (err: Error) =>
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
  });

  const handleAdd = useCallback(() => {
    setEditId(null);
    setFormTypeId(filterTypeId || "");
    setFormBody("");
    setOpen(true);
  }, [filterTypeId]);

  const handleEdit = useCallback((tpl: NotificationTemplateDto) => {
    setEditId(tpl.id);
    setFormTypeId(tpl.notificationTypeId);
    setFormBody(tpl.body);
    setOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formTypeId) {
      openErrorSnackbar({ message: t("templates@typeRequired") });
      return;
    }
    if (!formBody.trim()) {
      openErrorSnackbar({ message: t("templates@bodyRequired") });
      return;
    }
    saveMutation.mutate();
  }, [formTypeId, formBody, saveMutation, openErrorSnackbar, t]);

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <ScreenHeader title={t("templates@title")} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>
            {t("templates@subtitle")}
          </Typography>

          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              select
              size="small"
              label={t("templates@filterType")}
              value={filterTypeId}
              onChange={(e) => setFilterTypeId(e.target.value === "" ? "" : Number(e.target.value))}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">{t("templates@allTypes")}</MenuItem>
              {types.map((ty) => (
                <MenuItem key={ty.id} value={ty.id}>
                  {typeLabel(ty, isAr)}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<RefreshIcon />} onClick={() => refetch()} size="small">
                {t("refresh")}
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
                {t("templates@add")}
              </Button>
            </Stack>
          </Stack>

          {error ? (
            <Typography color="error">{t("loadingFailed")}</Typography>
          ) : isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : templates.length === 0 ? (
            <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
              <CardContent sx={{ textAlign: "center", py: 5 }}>
                <Typography color="text.secondary">{t("templates@empty")}</Typography>
              </CardContent>
            </Card>
          ) : (
            <Stack spacing={1.5}>
              {templates.map((tpl) => {
                const ty = typeById.get(tpl.notificationTypeId);
                const label = ty ? typeLabel(ty, isAr) : (tpl.notificationTypeName ?? `#${tpl.notificationTypeId}`);
                return (
                  <Card key={tpl.id} variant="outlined">
                    <CardContent>
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Chip size="small" label={label} sx={{ mb: 0.75 }} />
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {tpl.body}
                          </Typography>
                        </Box>
                        <Stack direction="row">
                          <Tooltip title={t("templates@edit")}>
                            <IconButton onClick={() => handleEdit(tpl)} aria-label="edit">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("templates@delete")}>
                            <IconButton
                              color="error"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (window.confirm(t("templates@deleteConfirm"))) {
                                  deleteMutation.mutate(tpl.id);
                                }
                              }}
                              aria-label="delete"
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Box>

      <Dialog open={open} onClose={() => !saveMutation.isPending && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId == null ? t("templates@add") : t("templates@edit")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label={t("templates@type")}
              fullWidth
              value={formTypeId}
              onChange={(e) => setFormTypeId(e.target.value === "" ? "" : Number(e.target.value))}
            >
              {types.map((ty) => (
                <MenuItem key={ty.id} value={ty.id}>
                  {typeLabel(ty, isAr)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("templates@body")}
              fullWidth
              multiline
              minRows={3}
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              helperText={t("templates@bodyHint")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit" disabled={saveMutation.isPending}>
            {t("cancel")}
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : t("templates@save")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
