import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Grid,
	IconButton,
	LinearProgress,
	MenuItem,
	Paper,
	Skeleton,
	Stack,
	TextField,
	Tooltip,
	Typography,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import HandshakeIcon from "@mui/icons-material/Handshake";
import PhoneIcon from "@mui/icons-material/Phone";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import DownloadIcon from "@mui/icons-material/Download";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { AppDataGrid, DateCell, ScreenHeader } from "../../../components";
import { usePartnerAdoption } from "../hooks/use-partner-adoption";
import { ADOPTION_STAGES } from "../types/api";
import type { AdoptionStage, AdoptionStationDto } from "../types/api";

const WINDOW_OPTIONS = [7, 14, 30, 60, 90];

/** Stage → chip colour. Only Active is good news. */
const STAGE_COLOR: Record<AdoptionStage, "default" | "error" | "warning" | "info" | "success"> = {
	NoOwner: "error",
	DefaultOwner: "error",
	NeverUsedApp: "warning",
	Inactive: "info",
	Active: "success",
};

/** Digits only, for wa.me links. */
function waNumber(phone?: string | null): string | null {
	if (!phone) return null;
	const digits = phone.replace(/[^0-9]/g, "");
	return digits.length >= 9 ? digits : null;
}

function FunnelStep({
	label,
	value,
	total,
	hint,
	color,
}: {
	label: string;
	value: number;
	total: number;
	hint?: string;
	color: string;
}) {
	const pct = total > 0 ? Math.round((value / total) * 100) : 0;
	return (
		<Box>
			<Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
				<Typography variant="body2" fontWeight={700}>
					{label}
				</Typography>
				<Typography
					variant="body2"
					fontWeight={800}
					sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
				>
					{value} <Typography component="span" variant="caption" color="text.secondary">({pct}%)</Typography>
				</Typography>
			</Stack>
			<LinearProgress
				variant="determinate"
				value={pct}
				sx={{
					height: 10,
					borderRadius: 1,
					mt: 0.5,
					bgcolor: alpha(color, 0.12),
					"& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 1 },
				}}
			/>
			{hint && (
				<Typography variant="caption" color="text.secondary">
					{hint}
				</Typography>
			)}
		</Box>
	);
}

function GapCard({
	label,
	value,
	action,
	icon,
	color,
	onClick,
}: {
	label: string;
	value: number;
	action: string;
	icon: React.ReactElement;
	color: string;
	onClick: () => void;
}) {
	return (
		<Card
			variant="outlined"
			onClick={onClick}
			sx={{
				height: "100%",
				cursor: "pointer",
				borderInlineStartWidth: 4,
				borderInlineStartColor: color,
				borderInlineStartStyle: "solid",
				transition: "background-color .15s",
				"&:hover": { bgcolor: alpha(color, 0.06) },
			}}
		>
			<CardContent>
				<Stack direction="row" spacing={1} alignItems="center" sx={{ color, mb: 0.5 }}>
					{icon}
					<Typography variant="body2" fontWeight={700} color="text.secondary">
						{label}
					</Typography>
				</Stack>
				<Typography variant="h4" fontWeight={800} sx={{ fontVariantNumeric: "tabular-nums" }}>
					{value}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					{action}
				</Typography>
			</CardContent>
		</Card>
	);
}

/**
 * How far the station catalogue has moved onto the partner app, and exactly
 * which stations are holding it back. Every drop between funnel steps is a
 * work list, so each one is clickable and filters the table below.
 */
export default function PartnerAdoptionScreen() {
	const { t, i18n } = useTranslation();
	const theme = useTheme();
	const lang = i18n.language;

	const [activeWindowDays, setActiveWindowDays] = useState(30);
	const [stageFilter, setStageFilter] = useState<AdoptionStage | "all">("all");
	const [search, setSearch] = useState("");
	const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

	const { data, isLoading, error } = usePartnerAdoption(activeWindowDays);

	const stations = useMemo(() => data?.stations ?? [], [data?.stations]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return stations.filter((s) => {
			if (stageFilter !== "all" && s.stage !== stageFilter) return false;
			if (!q) return true;
			return [s.name, s.cityName, s.ownerName, s.ownerPhone]
				.filter(Boolean)
				.some((v) => String(v).toLowerCase().includes(q));
		});
	}, [stations, stageFilter, search]);

	const paginated = useMemo(() => {
		const start = paginationModel.page * paginationModel.pageSize;
		return filtered.slice(start, start + paginationModel.pageSize);
	}, [filtered, paginationModel]);

	/** The filtered set as a chase list — name, city, owner, phone, stage. */
	const handleExport = useCallback(() => {
		const header = ["Station", "City", "Owner", "Phone", "Stage", "LastPartnerLogin"];
		const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
		const csv = [
			header.join(","),
			...filtered.map((s) =>
				[s.name, s.cityName, s.ownerName, s.ownerPhone, s.stage, s.ownerLastLoginAt]
					.map(escape)
					.join(",")
			),
		].join("\n");
		// A BOM so Excel opens the Arabic station names correctly.
		const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `partner-adoption-${stageFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}, [filtered, stageFilter]);

	const columns = useMemo<GridColDef<AdoptionStationDto>[]>(
		() => [
			{
				field: "name",
				headerName: t("partnerAdoption@columns.station"),
				minWidth: 180,
				flex: 1,
				renderCell: ({ row }) => (
					<Box sx={{ minWidth: 0 }}>
						<Typography variant="body2" fontWeight={600} noWrap>
							{row.name ?? `#${row.chargingPointId}`}
						</Typography>
						<Typography variant="caption" color="text.secondary" noWrap>
							{row.cityName ?? "—"}
						</Typography>
					</Box>
				),
			},
			{
				field: "ownerName",
				headerName: t("partnerAdoption@columns.owner"),
				minWidth: 170,
				flex: 1,
				renderCell: ({ row }) =>
					row.ownerId == null ? (
						<Typography variant="caption" color="text.secondary">
							{t("partnerAdoption@noOwnerCell")}
						</Typography>
					) : (
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="body2" noWrap>
								{row.ownerName ?? `#${row.ownerId}`}
							</Typography>
							{row.isDefaultOwner && (
								<Chip
									size="small"
									color="error"
									variant="outlined"
									label={t("partnerAdoption@defaultOwnerTag")}
									sx={{ height: 18, fontSize: 10 }}
								/>
							)}
						</Box>
					),
			},
			{
				field: "ownerPhone",
				headerName: t("partnerAdoption@columns.contact"),
				width: 110,
				sortable: false,
				filterable: false,
				renderCell: ({ row }) => {
					const wa = waNumber(row.ownerPhone);
					if (!row.ownerPhone) return "—";
					return (
						<Stack direction="row" spacing={0.25} onClick={(e) => e.stopPropagation()}>
							<Tooltip title={row.ownerPhone}>
								<IconButton size="small" href={`tel:${row.ownerPhone}`}>
									<PhoneIcon fontSize="small" />
								</IconButton>
							</Tooltip>
							{wa && (
								<Tooltip title="WhatsApp">
									<IconButton
										size="small"
										href={`https://wa.me/${wa}`}
										target="_blank"
										rel="noopener"
										sx={{ color: "success.main" }}
									>
										<WhatsAppIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							)}
						</Stack>
					);
				},
			},
			{
				field: "stage",
				headerName: t("partnerAdoption@columns.stage"),
				width: 150,
				renderCell: ({ row }) => (
					<Chip
						size="small"
						color={STAGE_COLOR[row.stage] ?? "default"}
						variant={row.stage === "Active" ? "filled" : "outlined"}
						label={t(`partnerAdoption@stage.${row.stage}`)}
						sx={{ fontWeight: 700 }}
					/>
				),
			},
			{
				field: "client",
				headerName: t("partnerAdoption@columns.client"),
				width: 110,
				sortable: false,
				filterable: false,
				renderCell: ({ row }) => (
					<Stack direction="row" spacing={0.5}>
						{row.ownerUsesPartnerApp && (
							<Chip size="small" label={t("partnerAdoption@app")} sx={{ height: 20, fontSize: 10 }} />
						)}
						{row.ownerUsesPartnerWeb && (
							<Chip size="small" label={t("partnerAdoption@web")} sx={{ height: 20, fontSize: 10 }} />
						)}
						{!row.ownerUsesPartnerApp && !row.ownerUsesPartnerWeb && "—"}
					</Stack>
				),
			},
			{
				field: "ownerLastLoginAt",
				headerName: t("partnerAdoption@columns.lastLogin"),
				minWidth: 130,
				width: 145,
				filterable: false,
				renderCell: ({ row }) =>
					row.ownerLastLoginAt ? <DateCell value={row.ownerLastLoginAt} /> : "—",
			},
			{
				field: "lastPartnerActivityAt",
				headerName: t("partnerAdoption@columns.lastActivity"),
				minWidth: 130,
				width: 145,
				filterable: false,
				renderCell: ({ row }) =>
					row.lastPartnerActivityAt ? <DateCell value={row.lastPartnerActivityAt} /> : "—",
			},
		],
		[t, lang]
	);

	if (error) {
		return (
			<AppScreenContainer>
				<Box p={2}>
					<Typography color="error">{t("loadingFailed")}</Typography>
				</Box>
			</AppScreenContainer>
		);
	}

	const f = data?.funnel;
	const total = f?.allStations ?? 0;

	const jumpTo = (stage: AdoptionStage) => {
		setStageFilter(stage);
		setPaginationModel((p) => ({ ...p, page: 0 }));
	};

	return (
		<AppScreenContainer>
			<Box sx={{ p: { xs: 1, sm: 2 } }}>
				<Stack spacing={2}>
					<ScreenHeader title={t("partnerAdoption@title")} />

					<Typography variant="body2" color="text.secondary">
						{t("partnerAdoption@subtitle")}
					</Typography>

					<Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
						<TextField
							select
							size="small"
							label={t("partnerAdoption@window")}
							value={activeWindowDays}
							onChange={(e) => setActiveWindowDays(Number(e.target.value))}
							sx={{ minWidth: 170 }}
						>
							{WINDOW_OPTIONS.map((d) => (
								<MenuItem key={d} value={d}>
									{t("partnerAdoption@windowDays", { count: d })}
								</MenuItem>
							))}
						</TextField>
						<TextField
							size="small"
							label={t("partnerAdoption@search")}
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPaginationModel((p) => ({ ...p, page: 0 }));
							}}
							sx={{ minWidth: 220 }}
						/>
						<TextField
							select
							size="small"
							label={t("partnerAdoption@columns.stage")}
							value={stageFilter}
							onChange={(e) => {
								setStageFilter(e.target.value as AdoptionStage | "all");
								setPaginationModel((p) => ({ ...p, page: 0 }));
							}}
							sx={{ minWidth: 180 }}
						>
							<MenuItem value="all">{t("partnerAdoption@allStages")}</MenuItem>
							{ADOPTION_STAGES.map((s) => (
								<MenuItem key={s} value={s}>
									{t(`partnerAdoption@stage.${s}`)}
								</MenuItem>
							))}
						</TextField>
						<Button
							size="small"
							variant="outlined"
							startIcon={<DownloadIcon />}
							onClick={handleExport}
							disabled={filtered.length === 0}
						>
							{t("partnerAdoption@exportCsv", { count: filtered.length })}
						</Button>
					</Stack>

					{/* The funnel — each step is a share of all stations. */}
					<Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: "divider" }}>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
							<HandshakeIcon fontSize="small" color="primary" />
							<Typography variant="subtitle1" fontWeight={800}>
								{t("partnerAdoption@funnel")}
							</Typography>
						</Stack>
						{isLoading || !f ? (
							<Stack spacing={2}>
								{[0, 1, 2, 3].map((i) => (
									<Skeleton key={i} variant="rounded" height={38} />
								))}
							</Stack>
						) : (
							<Stack spacing={2}>
								<FunnelStep
									label={t("partnerAdoption@funnelSteps.all")}
									value={f.allStations}
									total={total}
									color={theme.palette.text.secondary}
								/>
								<FunnelStep
									label={t("partnerAdoption@funnelSteps.realOwner")}
									value={f.withRealOwner}
									total={total}
									hint={t("partnerAdoption@funnelSteps.realOwnerHint", {
										count: f.distinctRealOwners,
									})}
									color={theme.palette.info.main}
								/>
								<FunnelStep
									label={t("partnerAdoption@funnelSteps.usedApp")}
									value={f.ownerUsedPartnerApp}
									total={total}
									color={theme.palette.warning.main}
								/>
								<FunnelStep
									label={t("partnerAdoption@funnelSteps.active")}
									value={f.activeInWindow}
									total={total}
									hint={t("partnerAdoption@windowDays", { count: activeWindowDays })}
									color={theme.palette.success.main}
								/>
							</Stack>
						)}
					</Paper>

					{/* Each drop between steps is a work list. */}
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<GapCard
								label={t("partnerAdoption@stage.DefaultOwner")}
								value={f?.defaultOwner ?? 0}
								action={t("partnerAdoption@gaps.defaultOwner")}
								icon={<AdminPanelSettingsIcon fontSize="small" />}
								color={theme.palette.error.main}
								onClick={() => jumpTo("DefaultOwner")}
							/>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<GapCard
								label={t("partnerAdoption@stage.NoOwner")}
								value={f?.noOwner ?? 0}
								action={t("partnerAdoption@gaps.noOwner")}
								icon={<PersonOffIcon fontSize="small" />}
								color={theme.palette.error.main}
								onClick={() => jumpTo("NoOwner")}
							/>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<GapCard
								label={t("partnerAdoption@stage.NeverUsedApp")}
								value={Math.max((f?.withRealOwner ?? 0) - (f?.ownerUsedPartnerApp ?? 0), 0)}
								action={t("partnerAdoption@gaps.neverUsedApp")}
								icon={<HandshakeIcon fontSize="small" />}
								color={theme.palette.warning.main}
								onClick={() => jumpTo("NeverUsedApp")}
							/>
						</Grid>
					</Grid>

					<AppDataGrid<AdoptionStationDto>
						data={paginated}
						columns={columns}
						loading={isLoading}
						getRowId={(row) => row.chargingPointId}
						disablePagination={false}
						paginationModel={paginationModel}
						onPaginationModelChange={setPaginationModel}
						total={filtered.length}
						minHeight="55vh"
						enableToolbar
					/>
				</Stack>
			</Box>
		</AppScreenContainer>
	);
}
