import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import { getVersions, addVersion, updateVersion } from "../services/version-service";
import type { SystemVersionDto, AddSystemVersionRequest } from "../types/api";
import { useSnackbarStore } from "../../../stores";

const PLATFORMS = ["ANDROID", "IOS"] as const;

/** Semantic versioning: major.minor.patch (e.g. 1.0.0), optional -pre or +build. */
const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;

function isSemver(value: string): boolean {
  return SEMVER_REGEX.test(value.trim());
}

function toForceBoolean(value: string | boolean | undefined): boolean {
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

export default function VersionControl() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<SystemVersionDto | null>(null);
  const [editVersion, setEditVersion] = useState("");
  const [editForce, setEditForce] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addPlatform, setAddPlatform] = useState<string>("ANDROID");
  const [addVersionStr, setAddVersionStr] = useState("");
  const [addForce, setAddForce] = useState(false);

  const { data: versions = [], isLoading, error, refetch } = useQuery({
    queryKey: ["system-versions"],
    queryFn: ({ signal }) => getVersions(signal),
  });

  const updateMutation = useMutation({
    mutationFn: (body: { id: number; platform: string; version: string; updateForce: boolean }) =>
      updateVersion(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-versions"] });
      openSuccessSnackbar({ message: t("platform@versions.updated") });
      setEditOpen(false);
      setEditRow(null);
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const addMutation = useMutation({
    mutationFn: (body: AddSystemVersionRequest) => addVersion(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-versions"] });
      openSuccessSnackbar({ message: t("platform@versions.added") });
      setAddOpen(false);
      setAddPlatform("ANDROID");
      setAddVersionStr("");
      setAddForce(false);
    },
    onError: (err: Error) => {
      openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
    },
  });

  const handleOpenEdit = useCallback((row: SystemVersionDto) => {
    setEditRow(row);
    setEditVersion(row.version ?? "");
    setEditForce(toForceBoolean(row.updateForce));
    setEditOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    if (!updateMutation.isPending) {
      setEditOpen(false);
      setEditRow(null);
    }
  }, [updateMutation.isPending]);

  const handleSaveEdit = useCallback(() => {
    if (!editRow) return;
    const versionStr = editVersion.trim() || editRow.version;
    if (!isSemver(versionStr)) {
      openErrorSnackbar({ message: t("platform@versions.invalidVersion") });
      return;
    }
    updateMutation.mutate({
      id: editRow.id,
      platform: editRow.platform,
      version: versionStr,
      updateForce: editForce,
    });
  }, [editRow, editVersion, editForce, updateMutation, openErrorSnackbar, t]);

  const handleOpenAdd = useCallback(() => {
    setAddPlatform("ANDROID");
    setAddVersionStr("");
    setAddForce(false);
    setAddOpen(true);
  }, []);

  const handleCloseAdd = useCallback(() => {
    if (!addMutation.isPending) {
      setAddOpen(false);
    }
  }, [addMutation.isPending]);

  const handleAddSubmit = useCallback(() => {
    const versionStr = addVersionStr.trim();
    if (!versionStr) {
      openErrorSnackbar({ message: t("platform@versions.versionRequired") });
      return;
    }
    if (!isSemver(versionStr)) {
      openErrorSnackbar({ message: t("platform@versions.invalidVersion") });
      return;
    }
    addMutation.mutate({
      platform: addPlatform,
      version: versionStr,
      forceUpdate: addForce,
    });
  }, [addPlatform, addVersionStr, addForce, addMutation, openErrorSnackbar, t]);

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{t("loadingFailed")}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshIcon />} onClick={() => refetch()} size="small">
            {t("refresh")}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            {t("platform@versions.addVersion")}
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 560 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("platform@versions.platform")}</TableCell>
              <TableCell>{t("platform@versions.version")}</TableCell>
              <TableCell>{t("platform@versions.forceUpdate")}</TableCell>
              <TableCell align="right" width={80}>
                {t("platform@versions.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : versions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    {t("platform@versions.noVersions")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              versions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.platform}</TableCell>
                  <TableCell>{row.version}</TableCell>
                  <TableCell>
                    <Switch
                      checked={toForceBoolean(row.updateForce)}
                      onChange={() => {
                        updateMutation.mutate({
                          id: row.id,
                          platform: row.platform,
                          version: row.version,
                          updateForce: !toForceBoolean(row.updateForce),
                        });
                      }}
                      color="primary"
                      disabled={updateMutation.isPending}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenEdit(row)}
                      disabled={updateMutation.isPending}
                    >
                      {t("edit")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="xs" fullWidth>
        <DialogTitle>{t("platform@versions.editTitle")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t("platform@versions.platform")}
              value={editRow?.platform ?? ""}
              fullWidth
              disabled
            />
            <TextField
              label={t("platform@versions.version")}
              value={editVersion}
              onChange={(e) => setEditVersion(e.target.value)}
              fullWidth
              required
              placeholder="1.0.0"
              error={editVersion.trim() !== "" && !isSemver(editVersion)}
              helperText={
                editVersion.trim() !== "" && !isSemver(editVersion)
                  ? t("platform@versions.invalidVersion")
                  : undefined
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editForce}
                  onChange={(e) => setEditForce(e.target.checked)}
                  color="primary"
                />
              }
              label={t("platform@versions.forceUpdate")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit} color="inherit" disabled={updateMutation.isPending}>
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={
              updateMutation.isPending ||
              !editVersion.trim() ||
              !isSemver(editVersion.trim())
            }
          >
            {updateMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("save")
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add dialog */}
      <Dialog open={addOpen} onClose={handleCloseAdd} maxWidth="xs" fullWidth>
        <DialogTitle>{t("platform@versions.addVersion")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label={t("platform@versions.platform")}
              value={addPlatform}
              onChange={(e) => setAddPlatform(e.target.value)}
              fullWidth
            >
              {PLATFORMS.map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("platform@versions.version")}
              value={addVersionStr}
              onChange={(e) => setAddVersionStr(e.target.value)}
              fullWidth
              required
              placeholder="1.0.0"
              error={addVersionStr.trim() !== "" && !isSemver(addVersionStr)}
              helperText={
                addVersionStr.trim() !== "" && !isSemver(addVersionStr)
                  ? t("platform@versions.invalidVersion")
                  : undefined
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={addForce}
                  onChange={(e) => setAddForce(e.target.checked)}
                  color="primary"
                />
              }
              label={t("platform@versions.forceUpdate")}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdd} color="inherit" disabled={addMutation.isPending}>
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleAddSubmit}
            disabled={
              addMutation.isPending ||
              !addVersionStr.trim() ||
              !isSemver(addVersionStr.trim())
            }
          >
            {addMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t("add")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
