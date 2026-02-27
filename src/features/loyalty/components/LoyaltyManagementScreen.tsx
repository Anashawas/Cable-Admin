import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Tabs,
  Tab,
  Stack,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Typography,
  Avatar,
  Divider,
} from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader, ScreenHeaderAction } from "../../../components";
import { AppDataGrid } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import {
  useSeasons,
  useCreateSeason,
  useEndSeason,
  useRewards,
  useCreateReward,
  useUpdateReward,
  RewardSortOption,
} from "../hooks/use-loyalty";
import type {
  SeasonDto,
  CreateSeasonRequest,
  RewardDto,
  CreateRewardRequest,
  RewardType,
} from "../types/api";

export default function LoyaltyManagementScreen() {
  const { t } = useTranslation();
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

  const [currentTab, setCurrentTab] = useState(0);

  // Seasons
  const seasonsQuery = useSeasons();
  const createSeasonMutation = useCreateSeason();
  const endSeasonMutation = useEndSeason();

  // Rewards
  const rewardsQuery = useRewards();
  const createRewardMutation = useCreateReward();
  const updateRewardMutation = useUpdateReward();

  const [seasonFormOpen, setSeasonFormOpen] = useState(false);
  const [seasonFormData, setSeasonFormData] = useState<CreateSeasonRequest>({
    name: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    activateImmediately: false,
  });

  const [rewardFormOpen, setRewardFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardDto | null>(null);
  const [rewardFormData, setRewardFormData] = useState<CreateRewardRequest>({
    name: "",
    description: "",
    pointsCost: 100,
    rewardType: 1,
    rewardValue: "",
    validFrom: new Date().toISOString().split("T")[0],
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });

  const paginatedSeasons = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return seasonsQuery.data.slice(start, start + paginationModel.pageSize);
  }, [seasonsQuery.data, paginationModel.page, paginationModel.pageSize]);

  const paginatedRewards = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return rewardsQuery.data.slice(start, start + paginationModel.pageSize);
  }, [rewardsQuery.data, paginationModel.page, paginationModel.pageSize]);

  const handleEndSeason = useCallback(
    (e: React.MouseEvent, season: SeasonDto) => {
      e.stopPropagation();
      if (!confirm(t("loyalty@confirmEndSeason"))) return;

      endSeasonMutation.mutate(season.id, {
        onSuccess: (result) => {
          openSuccessSnackbar({
            message: t("loyalty@seasonEnded", {
              users: result.usersProcessed,
              points: result.totalBonusPointsAwarded,
            }),
          });
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      });
    },
    [endSeasonMutation, openSuccessSnackbar, openErrorSnackbar, t]
  );

  const handleCreateSeason = useCallback(() => {
    if (!seasonFormData.name.trim()) {
      openErrorSnackbar({ message: t("nameRequired") });
      return;
    }

    createSeasonMutation.mutate(seasonFormData, {
      onSuccess: () => {
        openSuccessSnackbar({ message: t("loyalty@seasonCreated") });
        setSeasonFormOpen(false);
      },
      onError: (err: Error) => {
        openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
      },
    });
  }, [seasonFormData, createSeasonMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const handleEditReward = useCallback((e: React.MouseEvent, reward: RewardDto) => {
    e.stopPropagation();
    setEditingReward(reward);
    setRewardFormData({
      name: reward.name,
      description: reward.description || "",
      pointsCost: reward.pointsCost,
      rewardType: reward.rewardType,
      rewardValue: reward.rewardValue || "",
      providerType: reward.providerType,
      providerId: reward.providerId,
      serviceCategoryId: reward.serviceCategoryId,
      maxRedemptions: reward.maxRedemptions,
      imageUrl: reward.imageUrl,
      validFrom: reward.validFrom.split("T")[0],
      validTo: reward.validTo.split("T")[0],
    });
    setRewardFormOpen(true);
  }, []);

  const handleSaveReward = useCallback(() => {
    if (!rewardFormData.name.trim() || rewardFormData.pointsCost <= 0) {
      openErrorSnackbar({ message: t("loyalty@rewardValidation") });
      return;
    }

    if (editingReward) {
      updateRewardMutation.mutate(
        {
          id: editingReward.id,
          data: { ...rewardFormData, isActive: editingReward.isActive },
        },
        {
          onSuccess: () => {
            openSuccessSnackbar({ message: t("loyalty@rewardUpdated") });
            setRewardFormOpen(false);
            setEditingReward(null);
          },
          onError: (err: Error) => {
            openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
          },
        }
      );
    } else {
      createRewardMutation.mutate(rewardFormData, {
        onSuccess: () => {
          openSuccessSnackbar({ message: t("loyalty@rewardCreated") });
          setRewardFormOpen(false);
        },
        onError: (err: Error) => {
          openErrorSnackbar({ message: err?.message ?? t("loadingFailed") });
        },
      });
    }
  }, [rewardFormData, editingReward, createRewardMutation, updateRewardMutation, openSuccessSnackbar, openErrorSnackbar, t]);

  const seasonColumns: GridColDef<SeasonDto>[] = [
    { field: "id", headerName: t("id"), width: 70 },
    { field: "name", headerName: t("name"), flex: 1, minWidth: 200 },
    {
      field: "startDate",
      headerName: t("startDate"),
      width: 120,
      valueFormatter: (value) => new Date(value).toLocaleDateString(),
    },
    {
      field: "endDate",
      headerName: t("endDate"),
      width: 120,
      valueFormatter: (value) => new Date(value).toLocaleDateString(),
    },
    {
      field: "isActive",
      headerName: t("status"),
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value ? t("active") : t("ended")} color={params.value ? "success" : "default"} size="small" />
      ),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 100,
      renderCell: (params) => (
        params.row.isActive && (
          <Tooltip title={t("endSeason")}>
            <IconButton size="small" color="error" onClick={(e) => handleEndSeason(e, params.row)}>
              <StopCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      ),
    },
  ];

  const rewardColumns: GridColDef<RewardDto>[] = [
    { field: "id", headerName: t("id"), width: 70 },
    { field: "name", headerName: t("name"), flex: 1, minWidth: 200 },
    {
      field: "pointsCost",
      headerName: t("pointsCost"),
      width: 120,
      renderCell: (params) => `${params.value} ${t("points")}`,
    },
    {
      field: "rewardType",
      headerName: t("type"),
      width: 130,
      valueFormatter: (value) => {
        const types: Record<number, string> = {
          1: t("discount"),
          2: t("freeCharge"),
          3: t("freeService"),
          4: t("priorityAccess"),
          5: t("badge"),
        };
        return types[value] || value;
      },
    },
    {
      field: "currentRedemptions",
      headerName: t("redeemed"),
      width: 110,
      renderCell: (params) => `${params.value}${params.row.maxRedemptions ? `/${params.row.maxRedemptions}` : ""}`,
    },
    {
      field: "isActive",
      headerName: t("status"),
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value ? t("active") : t("inactive")} color={params.value ? "success" : "default"} size="small" />
      ),
    },
    {
      field: "actions",
      headerName: t("actions"),
      width: 80,
      renderCell: (params) => (
        <Tooltip title={t("edit")}>
          <IconButton size="small" onClick={(e) => handleEditReward(e, params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const headerActions: ScreenHeaderAction[] = [
    {
      id: "refresh",
      label: t("refresh"),
      icon: <RefreshIcon />,
      onClick: currentTab === 0 ? seasonsQuery.handleRefresh : rewardsQuery.handleRefresh,
    },
    {
      id: "addNew",
      label: t("addNew"),
      icon: <AddIcon />,
      onClick: () => (currentTab === 0 ? setSeasonFormOpen(true) : setRewardFormOpen(true)),
    },
  ];

  return (
    <AppScreenContainer>
      <ScreenHeader
        icon={<EmojiEventsIcon />}
        title={t("loyaltyManagement")}
        subtitle={t("loyaltyManagement@subtitle")}
        actions={headerActions}
      />

      <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 2 }}>
        <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
          <Tab label={t("seasons")} />
          <Tab label={t("rewards")} />
        </Tabs>
      </Box>

      {/* Seasons Tab */}
      {currentTab === 0 && (
        <Box sx={{ mt: 3 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder={t("search")}
              value={seasonsQuery.search}
              onChange={(e) => seasonsQuery.handleSearchChange(e.target.value)}
              sx={{ minWidth: 300 }}
            />
          </Stack>
          <AppDataGrid
            data={paginatedSeasons}
            columns={seasonColumns}
            loading={seasonsQuery.isLoading}
            disablePagination={false}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            total={seasonsQuery.data.length}
          />
        </Box>
      )}

      {/* Rewards Tab */}
      {currentTab === 1 && (
        <Box sx={{ mt: 3 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder={t("search")}
              value={rewardsQuery.search}
              onChange={(e) => rewardsQuery.handleSearchChange(e.target.value)}
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>{t("status")}</InputLabel>
              <Select
                value={rewardsQuery.statusFilter}
                label={t("status")}
                onChange={(e) => rewardsQuery.handleStatusFilterChange(e.target.value as any)}
              >
                <MenuItem value="all">{t("all")}</MenuItem>
                <MenuItem value="active">{t("active")}</MenuItem>
                <MenuItem value="inactive">{t("inactive")}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <AppDataGrid
            data={paginatedRewards}
            columns={rewardColumns}
            loading={rewardsQuery.isLoading}
            disablePagination={false}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            total={rewardsQuery.data.length}
          />
        </Box>
      )}

      {/* Season Form Dialog */}
      <Dialog
        open={seasonFormOpen}
        onClose={() => setSeasonFormOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "warning.main" }}>
              <EmojiEventsIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {t("loyalty@createSeason")}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label={t("name")}
              value={seasonFormData.name}
              onChange={(e) => setSeasonFormData({ ...seasonFormData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={t("description")}
              value={seasonFormData.description}
              onChange={(e) => setSeasonFormData({ ...seasonFormData, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label={t("startDate")}
              type="date"
              value={seasonFormData.startDate}
              onChange={(e) => setSeasonFormData({ ...seasonFormData, startDate: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t("endDate")}
              type="date"
              value={seasonFormData.endDate}
              onChange={(e) => setSeasonFormData({ ...seasonFormData, endDate: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={seasonFormData.activateImmediately}
                  onChange={(e) => setSeasonFormData({ ...seasonFormData, activateImmediately: e.target.checked })}
                />
              }
              label={t("activateImmediately")}
            />
            <Alert severity="info">{t("loyalty@seasonInfo")}</Alert>
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ gap: 1, px: 3, py: 2 }}>
          <Button onClick={() => setSeasonFormOpen(false)} size="large">
            {t("cancel")}
          </Button>
          <Button
            onClick={handleCreateSeason}
            variant="contained"
            size="large"
            disabled={createSeasonMutation.isPending}
            startIcon={createSeasonMutation.isPending && <CircularProgress size={20} />}
          >
            {createSeasonMutation.isPending ? t("creating") : t("create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reward Form Dialog */}
      <Dialog
        open={rewardFormOpen}
        onClose={() => setRewardFormOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "success.main" }}>
              <CardGiftcardIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {editingReward ? t("loyalty@editReward") : t("loyalty@createReward")}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label={t("name")}
              value={rewardFormData.name}
              onChange={(e) => setRewardFormData({ ...rewardFormData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={t("description")}
              value={rewardFormData.description}
              onChange={(e) => setRewardFormData({ ...rewardFormData, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label={t("pointsCost")}
              type="number"
              value={rewardFormData.pointsCost}
              onChange={(e) => setRewardFormData({ ...rewardFormData, pointsCost: parseInt(e.target.value) || 0 })}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>{t("rewardType")}</InputLabel>
              <Select
                value={rewardFormData.rewardType}
                label={t("rewardType")}
                onChange={(e) => setRewardFormData({ ...rewardFormData, rewardType: e.target.value as RewardType })}
              >
                <MenuItem value={1}>{t("discount")}</MenuItem>
                <MenuItem value={2}>{t("freeCharge")}</MenuItem>
                <MenuItem value={3}>{t("freeService")}</MenuItem>
                <MenuItem value={4}>{t("priorityAccess")}</MenuItem>
                <MenuItem value={5}>{t("badge")}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={t("rewardValue")}
              value={rewardFormData.rewardValue}
              onChange={(e) => setRewardFormData({ ...rewardFormData, rewardValue: e.target.value })}
              fullWidth
              placeholder="e.g., 20% off, 1 free session"
            />
            <TextField
              label={t("maxRedemptions")}
              type="number"
              value={rewardFormData.maxRedemptions || ""}
              onChange={(e) => setRewardFormData({ ...rewardFormData, maxRedemptions: parseInt(e.target.value) || null })}
              fullWidth
              helperText={t("loyalty@maxRedemptionsHelp")}
            />
            <TextField
              label={t("validFrom")}
              type="date"
              value={rewardFormData.validFrom}
              onChange={(e) => setRewardFormData({ ...rewardFormData, validFrom: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t("validTo")}
              type="date"
              value={rewardFormData.validTo}
              onChange={(e) => setRewardFormData({ ...rewardFormData, validTo: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ gap: 1, px: 3, py: 2 }}>
          <Button onClick={() => setRewardFormOpen(false)} size="large">
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSaveReward}
            variant="contained"
            size="large"
            disabled={createRewardMutation.isPending || updateRewardMutation.isPending}
            startIcon={
              (createRewardMutation.isPending || updateRewardMutation.isPending) && (
                <CircularProgress size={20} />
              )
            }
          >
            {createRewardMutation.isPending || updateRewardMutation.isPending
              ? editingReward
                ? t("updating")
                : t("creating")
              : editingReward
              ? t("update")
              : t("create")}
          </Button>
        </DialogActions>
      </Dialog>
    </AppScreenContainer>
  );
}
