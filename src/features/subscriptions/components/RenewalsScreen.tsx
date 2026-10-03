import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Grid,
	MenuItem,
	Paper,
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PaymentsIcon from "@mui/icons-material/Payments";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { formatShortDate } from "../../../utils/date-format";
import { useRenewals, useGraceSettings, useUpdateGraceSettings } from "../hooks/use-subscriptions";
import { useSnackbarStore } from "../../../stores";
import RecordPaymentDialog from "./RecordPaymentDialog";
import type { GraceMode, RenewalRowDto, SubscriptionEntityType } from "../types/api";

const WINDOW_OPTIONS = [7, 14, 30, 60, 90];

/** The entity a row points at, once we know it is complete enough to pay for. */
interface PayTarget {
	entityType: SubscriptionEntityType;
	entityId: number;
	entityName?: string | null;
}

function rowKey(r: RenewalRowDto, i: number) {
	return `${r.subscriptionId ?? r.id ?? "row"}-${r.entityType ?? ""}-${r.entityId ?? i}`;
}

function StatTile({
	label,
	value,
	hint,
	icon,
	color,
}: {
	label: string;
	value: number | string;
	hint?: string;
	icon: React.ReactElement;
	color: string;
}) {
	return (
		<Card variant="outlined" sx={{ height: "100%", borderInlineStartWidth: 4, borderInlineStartColor: color, borderInlineStartStyle: "solid" }}>
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
				{hint && (
					<Typography variant="caption" color="text.secondary">
						{hint}
					</Typography>
				)}
			</CardContent>
		</Card>
	);
}

function RenewalTable({
	rows,
	emptyLabel,
	onPay,
	lang,
	highlight,
}: {
	rows: RenewalRowDto[];
	emptyLabel: string;
	onPay: (target: PayTarget) => void;
	lang: string;
	highlight?: boolean;
}) {
	const { t } = useTranslation();
	const theme = useTheme();

	if (rows.length === 0) {
		return (
			<Alert severity="success" sx={{ borderRadius: 2 }}>
				{emptyLabel}
			</Alert>
		);
	}

	return (
		<Box sx={{ overflowX: "auto" }}>
			<Table size="small">
				<TableHead>
					<TableRow>
						<TableCell>{t("subscriptions@columns.entity")}</TableCell>
						<TableCell>{t("subscriptions@columns.type")}</TableCell>
						<TableCell>{t("subscriptions@columns.expiresAt")}</TableCell>
						<TableCell align="right">{t("subscriptions@columns.daysLeft")}</TableCell>
						<TableCell>{t("subscriptions@columns.payer")}</TableCell>
						<TableCell align="right">{t("subscriptions@columns.actions")}</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{rows.map((r, i) => {
						const days = r.daysUntilExpiry;
						const overdue = days != null && days < 0;
						return (
							<TableRow
								key={rowKey(r, i)}
								sx={
									highlight
										? { bgcolor: alpha(theme.palette.error.main, 0.06) }
										: undefined
								}
							>
								<TableCell>
									<Typography variant="body2" fontWeight={600}>
										{r.entityName ?? `#${r.entityId ?? "—"}`}
									</Typography>
								</TableCell>
								<TableCell>
									{r.entityType ? (
										<Chip size="small" variant="outlined" label={t(`subscriptions@entityType.${r.entityType}`)} />
									) : (
										"—"
									)}
								</TableCell>
								<TableCell sx={{ whiteSpace: "nowrap" }}>
									{formatShortDate(r.expiresAt, lang)}
								</TableCell>
								<TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
									{days == null ? (
										"—"
									) : (
										<Typography
											variant="body2"
											fontWeight={700}
											color={overdue ? "error.main" : days <= 7 ? "warning.main" : "text.primary"}
										>
											{overdue
												? t("subscriptions@overdueBy", { count: Math.abs(days) })
												: t("subscriptions@daysLeft", { count: days })}
										</Typography>
									)}
								</TableCell>
								<TableCell>
									<Typography variant="caption" color="text.secondary">
										{r.payerName ?? "—"}
										{r.payerPhone ? ` · ${r.payerPhone}` : ""}
									</Typography>
								</TableCell>
								<TableCell align="right">
									{r.entityType && r.entityId != null ? (
										<Tooltip title={t("subscriptions@record.renew")}>
											<Button
												size="small"
												variant="outlined"
												startIcon={<ReceiptLongIcon />}
												onClick={() =>
													onPay({
														entityType: r.entityType as SubscriptionEntityType,
														entityId: r.entityId as number,
														entityName: r.entityName,
													})
												}
											>
												{t("subscriptions@record.renew")}
											</Button>
										</Tooltip>
									) : (
										"—"
									)}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</Box>
	);
}

/**
 * The money view: what is about to lapse, what has already lapsed but is still
 * switched on (the costly bucket), what has expired, and what was collected
 * over the last 12 months.
 */
export default function RenewalsScreen() {
	const { t, i18n } = useTranslation();
	const theme = useTheme();
	const lang = i18n.language;
	const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
	const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

	const [withinDays, setWithinDays] = useState(30);
	const [payTarget, setPayTarget] = useState<PayTarget | null>(null);

	const { data, isLoading, error } = useRenewals(withinDays);
	const { data: grace } = useGraceSettings();
	const updateGrace = useUpdateGraceSettings();

	const monthly = useMemo(() => {
		const rows = data?.monthly ?? [];
		return {
			labels: rows.map((m) => m.month ?? String(m.year ?? "")),
			totals: rows.map((m) => Number(m.total ?? 0)),
			lastTotal: rows.length ? Number(rows[rows.length - 1]?.total ?? 0) : 0,
		};
	}, [data?.monthly]);

	if (error) {
		return (
			<AppScreenContainer>
				<Box p={2}>
					<Typography color="error">{t("loadingFailed")}</Typography>
				</Box>
			</AppScreenContainer>
		);
	}

	const expiringSoon = data?.expiringSoon ?? [];
	const lapsedStillOn = data?.lapsedStillOn ?? [];
	const expired = data?.expired ?? [];

	return (
		<AppScreenContainer>
			<Box sx={{ p: { xs: 1, sm: 2 } }}>
				<Stack spacing={2}>
					<ScreenHeader title={t("subscriptions@title")} />

					<Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
						<TextField
							select
							size="small"
							label={t("subscriptions@window")}
							value={withinDays}
							onChange={(e) => setWithinDays(Number(e.target.value))}
							sx={{ minWidth: 170 }}
						>
							{WINDOW_OPTIONS.map((d) => (
								<MenuItem key={d} value={d}>
									{t("subscriptions@windowDays", { count: d })}
								</MenuItem>
							))}
						</TextField>

						{grace && (
							<>
								<TextField
									select
									size="small"
									label={t("subscriptions@grace.mode")}
									value={grace.graceMode}
									onChange={(e) =>
										updateGrace.mutate(
											{ graceMode: e.target.value as GraceMode, graceDays: grace.graceDays },
											{
												onSuccess: () =>
													openSuccessSnackbar({ message: t("subscriptions@grace.saved") }),
												onError: (err: Error) =>
													openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
											}
										)
									}
									sx={{ minWidth: 190 }}
								>
									<MenuItem value="Manual">{t("subscriptions@grace.manual")}</MenuItem>
									<MenuItem value="AfterDays">{t("subscriptions@grace.afterDays")}</MenuItem>
								</TextField>
								{grace.graceMode === "AfterDays" && (
									<TextField
										size="small"
										type="number"
										label={t("subscriptions@grace.days")}
										defaultValue={grace.graceDays}
										onBlur={(e) =>
											updateGrace.mutate(
												{ graceMode: grace.graceMode, graceDays: Number(e.target.value) || 0 },
												{
													onSuccess: () =>
														openSuccessSnackbar({ message: t("subscriptions@grace.saved") }),
													onError: (err: Error) =>
														openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
												}
											)
										}
										inputProps={{ min: 0, max: 90 }}
										sx={{ width: 130 }}
									/>
								)}
							</>
						)}
						{updateGrace.isPending && <CircularProgress size={18} />}
					</Stack>

					{/* Summary before detail. */}
					<Grid container spacing={2}>
						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<StatTile
								label={t("subscriptions@buckets.lapsedStillOn")}
								value={isLoading ? "—" : lapsedStillOn.length}
								hint={t("subscriptions@buckets.lapsedStillOnHint")}
								icon={<HourglassBottomIcon fontSize="small" />}
								color={theme.palette.error.main}
							/>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<StatTile
								label={t("subscriptions@buckets.expiringSoon")}
								value={isLoading ? "—" : expiringSoon.length}
								hint={t("subscriptions@windowDays", { count: withinDays })}
								icon={<WarningAmberIcon fontSize="small" />}
								color={theme.palette.warning.main}
							/>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<StatTile
								label={t("subscriptions@buckets.expired")}
								value={isLoading ? "—" : expired.length}
								hint={t("subscriptions@buckets.expiredHint")}
								icon={<ErrorOutlineIcon fontSize="small" />}
								color={theme.palette.text.disabled}
							/>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 3 }}>
							<StatTile
								label={t("subscriptions@collectedThisMonth")}
								value={isLoading ? "—" : `${monthly.lastTotal} JOD`}
								hint={t("subscriptions@collectedHint")}
								icon={<PaymentsIcon fontSize="small" />}
								color={theme.palette.success.main}
							/>
						</Grid>
					</Grid>

					{/* The costly bucket leads — these are live and unpaid. */}
					<Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: "divider" }}>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
							<HourglassBottomIcon fontSize="small" sx={{ color: "error.main" }} />
							<Typography variant="subtitle1" fontWeight={800}>
								{t("subscriptions@buckets.lapsedStillOn")}
							</Typography>
						</Stack>
						{isLoading ? (
							<Skeleton variant="rounded" height={120} />
						) : (
							<RenewalTable
								rows={lapsedStillOn}
								emptyLabel={t("subscriptions@buckets.lapsedStillOnEmpty")}
								onPay={setPayTarget}
								lang={lang}
								highlight
							/>
						)}
					</Paper>

					<Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: "divider" }}>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
							<WarningAmberIcon fontSize="small" sx={{ color: "warning.main" }} />
							<Typography variant="subtitle1" fontWeight={800}>
								{t("subscriptions@buckets.expiringSoon")}
							</Typography>
						</Stack>
						{isLoading ? (
							<Skeleton variant="rounded" height={120} />
						) : (
							<RenewalTable
								rows={expiringSoon}
								emptyLabel={t("subscriptions@buckets.expiringSoonEmpty")}
								onPay={setPayTarget}
								lang={lang}
							/>
						)}
					</Paper>

					<Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: "divider" }}>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
							<ErrorOutlineIcon fontSize="small" color="disabled" />
							<Typography variant="subtitle1" fontWeight={800}>
								{t("subscriptions@buckets.expired")}
							</Typography>
						</Stack>
						{isLoading ? (
							<Skeleton variant="rounded" height={120} />
						) : (
							<RenewalTable
								rows={expired}
								emptyLabel={t("subscriptions@buckets.expiredEmpty")}
								onPay={setPayTarget}
								lang={lang}
							/>
						)}
					</Paper>

					{/* 12-month collections. */}
					<Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: "divider" }}>
						<Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ pl: 1 }}>
							{t("subscriptions@monthlyCollections")}
						</Typography>
						{isLoading ? (
							<Skeleton variant="rounded" height={260} />
						) : monthly.labels.length === 0 ? (
							<Box sx={{ py: 4, textAlign: "center" }}>
								<Typography variant="body2" color="text.secondary">
									{t("subscriptions@noCollections")}
								</Typography>
							</Box>
						) : (
							<BarChart
								height={260}
								xAxis={[{ scaleType: "band", data: monthly.labels, tickLabelStyle: { fontSize: 10 } }]}
								series={[
									{
										data: monthly.totals,
										label: t("subscriptions@collected"),
										color: theme.palette.success.main,
									},
								]}
								margin={{ top: 24, right: 20, bottom: 30, left: 55 }}
							/>
						)}
					</Paper>
				</Stack>
			</Box>

			{payTarget && (
				<RecordPaymentDialog
					open
					onClose={() => setPayTarget(null)}
					entityType={payTarget.entityType}
					entityId={payTarget.entityId}
					entityName={payTarget.entityName}
				/>
			)}
		</AppScreenContainer>
	);
}
