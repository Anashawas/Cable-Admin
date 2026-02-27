import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Stack,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import BlockIcon from "@mui/icons-material/Block";
import HandshakeIcon from "@mui/icons-material/Handshake";
import { useQuery } from "@tanstack/react-query";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  usePartnerAgreements,
  useCreatePartnerAgreement,
  useUpdatePartnerAgreement,
  useDeactivatePartnerAgreement,
} from "../hooks/use-partners";
import type {
  PartnerAgreementDto,
  PartnerProviderType,
  CreatePartnerAgreementRequest,
} from "../types/api";
import { getAllConversionRates } from "../../offers/services/offers-service";
import { getAllChargingPoints } from "../../charge-management/services/charge-management-service";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";

export default function PartnersScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [activeFilter, setActiveFilter] = useState<boolean | "">("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerAgreementDto | null>(null);
  const [deactivateId, setDeactivateId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreatePartnerAgreementRequest>({
    providerType: "ChargingPoint",
    providerId: 0,
    commissionPercentage: 10,
    pointsRewardPercentage: 5,
    codeExpiryMinutes: 30,
    isActive: true,
    note: "",
  });

  const { data: agreements = [], isLoading, refetch } = usePartnerAgreements(
    activeFilter === "" ? undefined : { isActive: activeFilter }
  );
  const createMutation = useCreatePartnerAgreement();
  const updateMutation = useUpdatePartnerAgreement();
  const deactivateMutation = useDeactivatePartnerAgreement();

  const { data: conversionRates = [] } = useQuery({
    queryKey: ["conversion-rates"],
    queryFn: () => getAllConversionRates(),
    enabled: formOpen,
  });
  const { data: stations = [] } = useQuery({
    queryKey: ["charge-management", "stations-list"],
    queryFn: ({ signal }) =>
      getAllChargingPoints(
        { name: null, chargerPointTypeId: null, cityName: null },
        signal
      ),
    enabled: formOpen && formData.providerType === "ChargingPoint",
  });
  const { data: serviceProviders = [] } = useQuery({
    queryKey: ["service-providers", "list"],
    queryFn: () => getAllServiceProviders(),
    enabled: formOpen && formData.providerType === "ServiceProvider",
  });

  const paginatedData = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return agreements.slice(start, start + paginationModel.pageSize);
  }, [agreements, paginationModel.page, paginationModel.pageSize]);

  const handleAdd = useCallback(() => {
    setEditing(null);
    setFormData({
      providerType: "ChargingPoint",
      providerId: 0,
      commissionPercentage: 10,
      pointsRewardPercentage: 5,
      pointsConversionRateId: conversionRates[0]?.id ?? null,
      codeExpiryMinutes: 30,
      isActive: true,
      note: "",
    });
    setFormOpen(true);
  }, [conversionRates]);

  const handleEdit = useCallback((row: PartnerAgreementDto) => {
    setEditing(row);
    setFormData({
      providerType: row.providerType,
      providerId: row.providerId,
      commissionPercentage: row.commissionPercentage,
      pointsRewardPercentage: row.pointsRewardPercentage,
      pointsConversionRateId: row.pointsConversionRateId ?? null,
      codeExpiryMinutes: row.codeExpiryMinutes,
      isActive: row.isActive,
      note: row.note ?? "",
    });
    setFormOpen(true);
  }, []);

  const handleFormSubmit = useCallback(() => {
    if (formData.providerId <= 0) {
      openErrorSnackbar({ message: t("partners@selectProvider") });
      return;
    }
    if (editing) {
      updateMutation.mutate(
        {
          id: editing.id,
          data: {
            commissionPercentage: formData.commissionPercentage,
            pointsRewardPercentage: formData.pointsRewardPercentage,
            pointsConversionRateId: formData.pointsConversionRateId,
            codeExpiryMinutes: formData.codeExpiryMinutes,
            isActive: formData.isActive,
            note: formData.note || null,
          },
        },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("partners@updated") });
            setFormOpen(false);
            setEditing(null);
          },
          onError: (e: Error) =>
            openErrorSnackbar({ message: e?.message ?? t("loadingFailed") }),
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("partners@created") });
          setFormOpen(false);
        },
        onError: (e: Error) =>
          openErrorSnackbar({ message: e?.message ?? t("loadingFailed") }),
      });
    }
  }, [
    editing,
    formData,
    updateMutation,
    createMutation,
    openSuccessSnackbar,
    openErrorSnackbar,
    t,
  ]);

  const handleDeactivate = useCallback(
    (row: PartnerAgreementDto) => setDeactivateId(row.id),
    []
  );
  const confirmDeactivate = useCallback(() => {
    if (deactivateId == null) return;
    deactivateMutation.mutate(deactivateId, {
      onSuccess: () => {
        openSuccessSnackbar({ message: t("partners@deactivated") });
        setDeactivateId(null);
      },
      onError: (e: Error) =>
        openErrorSnackbar({ message: e?.message ?? t("loadingFailed") }),
    });
  }, [
    deactivateId,
    deactivateMutation,
    openSuccessSnackbar,
    openErrorSnackbar,
    t,
  ]);

  const providerOptions =
    formData.providerType === "ChargingPoint"
      ? stations.map((s) => ({ id: s.id, name: s.name ?? `Station ${s.id}` }))
      : serviceProviders.map((s) => ({ id: s.id, name: s.name ?? `Provider ${s.id}` }));

  const columns: GridColDef<PartnerAgreementDto>[] = [
    { field: "id", headerName: t("id"), width: 70 },
    {
      field: "providerName",
      headerName: t("partners@provider"),
      flex: 1,
      minWidth: 180,
      valueGetter: (_, row) => row.providerName ?? `#${row.providerId}`,
    },
    {
      field: "providerType",
      headerName: t("partners@type"),
      width: 140,
      renderCell: (params) => (
        <Chip
          size="small"
          label={
            params.value === "ChargingPoint"
              ? t("chargingPoint")
              : t("serviceProvider")
          }
        />
      ),
    },
    {
      field: "commissionPercentage",
      headerName: t("partners@commission"),
      width: 100,
      renderCell: (params) => `${params.value}%`,
    },
    {
      field: "pointsRewardPercentage",
      headerName: t("partners@pointsReward"),
      width: 110,
      renderCell: (params) => `${params.value}%`,
    },
    {
      field: "codeExpiryMinutes",
      headerName: t("partners@codeExpiry"),
      width: 100,
      renderCell: (params) => `${params.value} min`,
    },
    {
      field: "isActive",
      headerName: t("partners@active"),
      width: 90,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value ? t("active") : t("inactive")}
          color={params.value ? "success" : "default"}
          variant="outlined"
        />
      ),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={t("edit")}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(params.row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.isActive && (
            <Tooltip title={t("partners@deactivate")}>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeactivate(params.row);
                }}
              >
                <BlockIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const headerActions: ScreenHeaderAction[] = [
    { label: t("partners@add"), icon: <AddIcon />, onClick: handleAdd, variant: "contained" },
    { label: t("refresh"), icon: <RefreshIcon />, onClick: () => refetch(), variant: "outlined" },
  ];

  return (
    <AppScreenContainer>
      <ScreenHeader
        icon={<HandshakeIcon />}
        title={t("partners")}
        subtitle={t("partners@subtitle")}
        actions={headerActions}
      />

      <Alert severity="info" sx={{ mb: 2 }}>
        {t("partners@cablePartnerHint")}
      </Alert>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t("partners@status")}</InputLabel>
          <Select
            value={activeFilter === "" ? "all" : activeFilter}
            label={t("partners@status")}
            onChange={(e) =>
              setActiveFilter(
                e.target.value === "all" ? "" : (e.target.value as boolean)
              )
            }
          >
            <MenuItem value="all">{t("all")}</MenuItem>
            <MenuItem value={true}>{t("active")}</MenuItem>
            <MenuItem value={false}>{t("inactive")}</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <AppDataGrid<PartnerAgreementDto>
        data={paginatedData}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.id}
        disablePagination={false}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        total={agreements.length}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editing ? t("partners@edit") : t("partners@add")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small" disabled={!!editing}>
              <InputLabel>{t("partners@providerType")}</InputLabel>
              <Select
                value={formData.providerType}
                label={t("partners@providerType")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    providerType: e.target.value as PartnerProviderType,
                    providerId: 0,
                  })
                }
              >
                <MenuItem value="ChargingPoint">{t("chargingPoint")}</MenuItem>
                <MenuItem value="ServiceProvider">{t("serviceProvider")}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" disabled={!!editing}>
              <InputLabel>{t("partners@provider")}</InputLabel>
              <Select
                value={formData.providerId || ""}
                label={t("partners@provider")}
                onChange={(e) =>
                  setFormData({ ...formData, providerId: Number(e.target.value) })
                }
              >
                <MenuItem value="">—</MenuItem>
                {providerOptions.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label={t("partners@commission")}
              type="number"
              value={formData.commissionPercentage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  commissionPercentage: parseFloat(e.target.value) || 0,
                })
              }
              inputProps={{ min: 0, max: 100, step: 0.5 }}
              helperText="%"
            />
            <TextField
              size="small"
              label={t("partners@pointsReward")}
              type="number"
              value={formData.pointsRewardPercentage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pointsRewardPercentage: parseFloat(e.target.value) || 0,
                })
              }
              inputProps={{ min: 0, max: 100, step: 0.5 }}
              helperText="%"
            />
            <FormControl fullWidth size="small">
              <InputLabel>{t("partners@conversionRate")}</InputLabel>
              <Select
                value={formData.pointsConversionRateId ?? ""}
                label={t("partners@conversionRate")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pointsConversionRateId:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              >
                <MenuItem value="">{t("default")}</MenuItem>
                {conversionRates.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name} ({r.currencyCode} = {r.pointsPerUnit} pts)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label={t("partners@codeExpiry")}
              type="number"
              value={formData.codeExpiryMinutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  codeExpiryMinutes: parseInt(e.target.value, 10) || 30,
                })
              }
              helperText={t("minutes")}
            />
            {editing && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isActive: e.target.checked,
                      })
                    }
                  />
                }
                label={t("partners@active")}
              />
            )}
            <TextField
              size="small"
              label={t("note")}
              value={formData.note ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleFormSubmit}
            disabled={
              createMutation.isPending ||
              updateMutation.isPending ||
              (formData.providerId <= 0 && !editing)
            }
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              editing ? t("update") : t("partners@add")
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate confirm */}
      <Dialog open={deactivateId !== null} onClose={() => setDeactivateId(null)}>
        <DialogTitle>{t("partners@deactivate")}</DialogTitle>
        <DialogContent>
          {t("partners@deactivateConfirm")}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateId(null)}>{t("cancel")}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDeactivate}
            disabled={deactivateMutation.isPending}
          >
            {deactivateMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              t("partners@deactivate")
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
