import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	Link,
	Skeleton,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DownloadIcon from "@mui/icons-material/Download";
import BlockIcon from "@mui/icons-material/Block";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import ImageIcon from "@mui/icons-material/Image";
import HistoryIcon from "@mui/icons-material/History";
import { useSnackbarStore } from "../../../stores";
import { formatShortDate } from "../../../utils/date-format";
import { downloadReceipt } from "../services/subscriptions-service";
import {
	useSubscription,
	useSwitchSubscription,
	useVoidPayment,
} from "../hooks/use-subscriptions";
import RecordPaymentDialog from "./RecordPaymentDialog";
import SubscriptionStatusChip from "./SubscriptionStatusChip";
import type { PaymentDto, SubscriptionEntityType } from "../types/api";

interface SubscriptionPanelProps {
	entityType: SubscriptionEntityType;
	entityId: number;
	entityName?: string | null;
	ownerUserAccountId?: number | null;
	ownerName?: string | null;
	enabled?: boolean;
}

/**
 * Subscription status plus the full payment history for one station, banner or
 * provider. Drop it into a profile screen; it handles its own empty state for
 * entities that have never been paid for.
 */
export default function SubscriptionPanel({
	entityType,
	entityId,
	entityName,
	ownerUserAccountId,
	ownerName,
	enabled = true,
}: SubscriptionPanelProps) {
	const { t, i18n } = useTranslation();
	const lang = i18n.language;
	const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
	const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

	const { data: sub, isLoading } = useSubscription(entityType, entityId, enabled);
	const switchMutation = useSwitchSubscription();
	const voidMutation = useVoidPayment();

	const [recordOpen, setRecordOpen] = useState(false);
	const [voidTarget, setVoidTarget] = useState<PaymentDto | null>(null);
	const [voidReason, setVoidReason] = useState("");
	const [downloadingId, setDownloadingId] = useState<number | null>(null);

	/** The PDF needs the auth header, so fetch it as a blob and save it. */
	const handleReceipt = useCallback(
		async (payment: PaymentDto) => {
			setDownloadingId(payment.id);
			try {
				const blob = await downloadReceipt(payment.id);
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `${payment.referenceNo ?? `receipt-${payment.id}`}.pdf`;
				document.body.appendChild(a);
				a.click();
				a.remove();
				URL.revokeObjectURL(url);
			} catch (err) {
				openErrorSnackbar({ message: (err as Error)?.message ?? t("loadingFailed") });
			} finally {
				setDownloadingId(null);
			}
		},
		[openErrorSnackbar, t]
	);

	const handleSwitch = useCallback(() => {
		if (!sub) return;
		switchMutation.mutate(
			{ subscriptionId: sub.id, on: !sub.isOn },
			{
				onSuccess: () =>
					openSuccessSnackbar({
						message: sub.isOn
							? t("subscriptions@switchedOff")
							: t("subscriptions@switchedOn"),
					}),
				onError: (err: Error) =>
					openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
			}
		);
	}, [sub, switchMutation, openSuccessSnackbar, openErrorSnackbar, t]);

	const handleVoid = useCallback(() => {
		if (!voidTarget) return;
		voidMutation.mutate(
			{ id: voidTarget.id, reason: voidReason.trim() },
			{
				onSuccess: () => {
					openSuccessSnackbar({ message: t("subscriptions@voided") });
					setVoidTarget(null);
					setVoidReason("");
				},
				onError: (err: Error) =>
					openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
			}
		);
	}, [voidTarget, voidReason, voidMutation, openSuccessSnackbar, openErrorSnackbar, t]);

	if (isLoading) {
		return (
			<Stack spacing={1}>
				<Skeleton variant="rounded" height={64} />
				<Skeleton variant="rounded" height={48} />
			</Stack>
		);
	}

	const payments = sub?.payments ?? [];

	return (
		<Stack spacing={2}>
			{/* Header: status + actions */}
			<Stack
				direction={{ xs: "column", sm: "row" }}
				spacing={1.5}
				alignItems={{ xs: "stretch", sm: "center" }}
				justifyContent="space-between"
			>
				<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
					{sub ? (
						<>
							<SubscriptionStatusChip status={sub.status} />
							{sub.expiresAt && (
								<Typography variant="body2" color="text.secondary">
									{t("subscriptions@expiresOn")}: <b>{formatShortDate(sub.expiresAt, lang)}</b>
								</Typography>
							)}
							{sub.daysUntilExpiry != null && sub.daysUntilExpiry >= 0 && (
								<Chip
									size="small"
									variant="outlined"
									color={sub.daysUntilExpiry <= 7 ? "warning" : "default"}
									label={t("subscriptions@daysLeft", { count: sub.daysUntilExpiry })}
									sx={{ fontWeight: 700 }}
								/>
							)}
						</>
					) : (
						<Chip size="small" label={t("subscriptions@neverPaid")} />
					)}
				</Stack>

				<Stack direction="row" spacing={1}>
					{sub && (
						<Button
							size="small"
							variant="outlined"
							color={sub.isOn ? "error" : "success"}
							startIcon={
								switchMutation.isPending ? (
									<CircularProgress size={16} color="inherit" />
								) : (
									<PowerSettingsNewIcon />
								)
							}
							disabled={switchMutation.isPending}
							onClick={handleSwitch}
						>
							{sub.isOn ? t("subscriptions@switchOff") : t("subscriptions@switchOn")}
						</Button>
					)}
					<Button
						size="small"
						variant="contained"
						startIcon={<ReceiptLongIcon />}
						onClick={() => setRecordOpen(true)}
					>
						{sub ? t("subscriptions@record.renew") : t("subscriptions@record.record")}
					</Button>
				</Stack>
			</Stack>

			{sub?.status === "InGrace" && (
				<Alert severity="warning" sx={{ borderRadius: 2 }}>
					{t("subscriptions@inGraceHint")}
					{sub.autoOffAt && ` ${t("subscriptions@autoOffAt", { date: formatShortDate(sub.autoOffAt, lang) })}`}
				</Alert>
			)}

			<Divider />

			{/* Payment history */}
			<Stack direction="row" spacing={0.75} alignItems="center">
				<HistoryIcon fontSize="small" color="action" />
				<Typography variant="subtitle2" fontWeight={700} color="text.secondary">
					{t("subscriptions@history")}
				</Typography>
			</Stack>

			{payments.length === 0 ? (
				<Alert severity="info" sx={{ borderRadius: 2 }}>
					{t("subscriptions@noPayments")}
				</Alert>
			) : (
				<Stack spacing={1}>
					{payments.map((p) => (
						<Box
							key={p.id}
							sx={{
								p: 1.5,
								borderRadius: 2,
								border: 1,
								borderColor: "divider",
								opacity: p.isVoid ? 0.6 : 1,
							}}
						>
							<Stack
								direction="row"
								justifyContent="space-between"
								alignItems="center"
								flexWrap="wrap"
								useFlexGap
								spacing={1}
							>
								<Box sx={{ minWidth: 0 }}>
									<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
										<Typography variant="body2" fontWeight={600}>
											{formatShortDate(p.periodStart, lang)} → {formatShortDate(p.periodEnd, lang)}
										</Typography>
										{p.isVoid && (
											<Chip size="small" color="error" variant="outlined" label={t("subscriptions@void")} />
										)}
									</Stack>
									<Typography variant="caption" color="text.secondary">
										{p.referenceNo ?? `#${p.id}`}
										{p.methodName ? ` · ${p.methodName}` : ""}
										{p.payerName ? ` · ${p.payerName}` : ""}
										{p.payerPhone ? ` · ${p.payerPhone}` : ""}
									</Typography>
									{p.note && (
										<Typography variant="caption" color="text.secondary" display="block">
											{p.note}
										</Typography>
									)}
								</Box>

								<Stack direction="row" spacing={0.5} alignItems="center">
									<Chip
										size="small"
										color="success"
										variant="outlined"
										label={`${p.amount} ${p.currency ?? "JOD"}`}
										sx={{ fontWeight: 700 }}
									/>
									{p.receiptImageUrl && (
										<Tooltip title={t("subscriptions@viewProof")}>
											<IconButton
												size="small"
												component={Link}
												href={p.receiptImageUrl}
												target="_blank"
												rel="noopener"
											>
												<ImageIcon fontSize="small" />
											</IconButton>
										</Tooltip>
									)}
									<Tooltip title={t("subscriptions@downloadReceipt")}>
										<span>
											<IconButton
												size="small"
												disabled={downloadingId === p.id}
												onClick={() => handleReceipt(p)}
											>
												{downloadingId === p.id ? (
													<CircularProgress size={16} />
												) : (
													<DownloadIcon fontSize="small" />
												)}
											</IconButton>
										</span>
									</Tooltip>
									{!p.isVoid && (
										<Tooltip title={t("subscriptions@voidPayment")}>
											<IconButton size="small" color="error" onClick={() => setVoidTarget(p)}>
												<BlockIcon fontSize="small" />
											</IconButton>
										</Tooltip>
									)}
								</Stack>
							</Stack>
						</Box>
					))}
				</Stack>
			)}

			<RecordPaymentDialog
				open={recordOpen}
				onClose={() => setRecordOpen(false)}
				entityType={entityType}
				entityId={entityId}
				entityName={entityName}
				ownerUserAccountId={ownerUserAccountId}
				ownerName={ownerName}
				subscription={sub}
			/>

			{/* Void needs a reason — the payment is kept for audit. */}
			<Dialog
				open={voidTarget != null}
				onClose={() => !voidMutation.isPending && setVoidTarget(null)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>{t("subscriptions@voidPayment")}</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ pt: 1 }}>
						<Alert severity="warning" sx={{ borderRadius: 2 }}>
							{t("subscriptions@voidHint")}
						</Alert>
						<TextField
							label={t("subscriptions@voidReason")}
							value={voidReason}
							onChange={(e) => setVoidReason(e.target.value)}
							fullWidth
							multiline
							rows={2}
							size="small"
							disabled={voidMutation.isPending}
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button color="inherit" disabled={voidMutation.isPending} onClick={() => setVoidTarget(null)}>
						{t("cancel")}
					</Button>
					<Button
						color="error"
						variant="contained"
						disabled={voidMutation.isPending || !voidReason.trim()}
						onClick={handleVoid}
					>
						{voidMutation.isPending ? (
							<CircularProgress size={20} color="inherit" />
						) : (
							t("subscriptions@void")
						)}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
