import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Alert,
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	InputAdornment,
	Stack,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { addMonths, format } from "date-fns";
import { DecimalField } from "../../../components";
import { useSnackbarStore } from "../../../stores";
import { parseApiDate, formatShortDate } from "../../../utils/date-format";
import { useRecordPayment, useUploadPaymentProof } from "../hooks/use-subscriptions";
import PayerPicker from "./PayerPicker";
import { PAYMENT_METHOD } from "../types/api";
import type {
	PayerRef,
	PaymentMethod,
	SubscriptionDto,
	SubscriptionEntityType,
} from "../types/api";

/** The plans we actually sell; anything 1..24 is still accepted by the API. */
const PLAN_PRESETS = [1, 3, 6, 12];

interface RecordPaymentDialogProps {
	open: boolean;
	onClose: () => void;
	entityType: SubscriptionEntityType;
	entityId: number;
	entityName?: string | null;
	/** Enables paying "as the owner" and prefills the payer. */
	ownerUserAccountId?: number | null;
	ownerName?: string | null;
	/** When present, a renewal extends from the current expiry. */
	subscription?: SubscriptionDto | null;
}

/**
 * Records an offline payment (CliQ or cash). The admin picks a plan length,
 * never an expiry date — the server computes the period, extending from the
 * current expiry when one is still running so no paid days are lost.
 */
export default function RecordPaymentDialog({
	open,
	onClose,
	entityType,
	entityId,
	entityName,
	ownerUserAccountId,
	ownerName,
	subscription,
}: RecordPaymentDialogProps) {
	const { t, i18n } = useTranslation();
	const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
	const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);

	const recordMutation = useRecordPayment();
	const proofMutation = useUploadPaymentProof();

	const [planMonths, setPlanMonths] = useState(3);
	const [amount, setAmount] = useState<number | null>(null);
	const [method, setMethod] = useState<PaymentMethod>(PAYMENT_METHOD.CliQ);
	const [paidDate, setPaidDate] = useState<Date | null>(null);
	const [payer, setPayer] = useState<PayerRef | null>(null);
	const [note, setNote] = useState("");
	const [proof, setProof] = useState<File | null>(null);

	useEffect(() => {
		if (!open) return;
		setPlanMonths(3);
		setAmount(null);
		setMethod(PAYMENT_METHOD.CliQ);
		setPaidDate(new Date());
		setPayer(
			ownerUserAccountId != null && ownerUserAccountId > 0
				? { userAccountId: ownerUserAccountId, hasWhatsApp: true }
				: null
		);
		setNote("");
		setProof(null);
	}, [open, entityId, ownerUserAccountId]);

	/** Mirrors the server rule so the admin sees the period before saving. */
	const preview = useMemo(() => {
		const base = paidDate ?? new Date();
		const currentExpiry = parseApiDate(subscription?.expiresAt);
		const extending =
			currentExpiry != null && !subscription?.isSwitchedOff && currentExpiry > base;
		const start = extending ? currentExpiry : base;
		return { start, end: addMonths(start, planMonths), extending };
	}, [paidDate, planMonths, subscription?.expiresAt, subscription?.isSwitchedOff]);

	const canSubmit =
		paidDate != null && amount != null && amount >= 0 && payer != null && planMonths >= 1;

	const handleSubmit = useCallback(() => {
		if (!canSubmit || !paidDate || !payer || amount == null) return;
		recordMutation.mutate(
			{
				entityType,
				entityId,
				planMonths,
				amount,
				method,
				// A naive local timestamp — the API stores Jordan local time and
				// appending a Z here would shift the payment onto the wrong day.
				paidDate: format(paidDate, "yyyy-MM-dd'T'HH:mm:ss"),
				payer,
				note: note.trim() || null,
			},
			{
				onSuccess: (res) => {
					if (res.receiptError) {
						// The payment is recorded even when the PDF fails to render.
						openErrorSnackbar({
							message: t("subscriptions@record.savedNoReceipt", { error: res.receiptError }),
						});
					} else {
						openSuccessSnackbar({
							message: t("subscriptions@record.saved", { ref: res.referenceNo ?? res.paymentId }),
						});
					}
					if (proof) {
						proofMutation.mutate(
							{ id: res.paymentId, file: proof },
							{
								onError: (err: Error) =>
									openErrorSnackbar({
										message: err?.message ?? t("subscriptions@record.proofFailed"),
									}),
							}
						);
					}
					onClose();
				},
				onError: (err: Error) =>
					openErrorSnackbar({ message: err?.message ?? t("loadingFailed") }),
			}
		);
	}, [
		canSubmit,
		paidDate,
		payer,
		amount,
		entityType,
		entityId,
		planMonths,
		method,
		note,
		proof,
		recordMutation,
		proofMutation,
		onClose,
		openSuccessSnackbar,
		openErrorSnackbar,
		t,
	]);

	const busy = recordMutation.isPending || proofMutation.isPending;
	const lang = i18n.language;

	return (
		<Dialog
			open={open}
			onClose={() => !busy && onClose()}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
		>
			<Box
				sx={{
					background: "linear-gradient(135deg, #00695c 0%, #00897b 100%)",
					px: 3,
					py: 2.25,
					color: "#fff",
				}}
			>
				<Stack direction="row" spacing={1.5} alignItems="center">
					<Avatar variant="rounded" sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 42, height: 42 }}>
						<ReceiptLongIcon />
					</Avatar>
					<Box sx={{ minWidth: 0 }}>
						<Typography variant="h6" fontWeight={800} noWrap>
							{subscription ? t("subscriptions@record.renewTitle") : t("subscriptions@record.title")}
						</Typography>
						<Typography variant="caption" sx={{ opacity: 0.9 }}>
							{entityName ?? "—"} · #{entityId}
						</Typography>
					</Box>
				</Stack>
			</Box>

			<DialogTitle sx={{ py: 1.5 }}>
				<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
					<Chip
						size="small"
						label={t(`subscriptions@entityType.${entityType}`)}
						variant="outlined"
						sx={{ fontWeight: 700 }}
					/>
					{subscription?.expiresAt && (
						<Typography variant="body2" color="text.secondary">
							{t("subscriptions@currentExpiry")}: <b>{formatShortDate(subscription.expiresAt, lang)}</b>
						</Typography>
					)}
				</Stack>
			</DialogTitle>

			<DialogContent dividers>
				<Stack spacing={2.5}>
					{/* Plan length — drives the computed expiry. */}
					<Box>
						<Typography variant="subtitle2" fontWeight={700} gutterBottom>
							{t("subscriptions@record.plan")}
						</Typography>
						<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
							<ToggleButtonGroup
								exclusive
								size="small"
								value={PLAN_PRESETS.includes(planMonths) ? planMonths : null}
								onChange={(_, v) => v && setPlanMonths(v as number)}
								disabled={busy}
							>
								{PLAN_PRESETS.map((m) => (
									<ToggleButton key={m} value={m}>
										{t("subscriptions@record.months", { count: m })}
									</ToggleButton>
								))}
							</ToggleButtonGroup>
							<TextField
								size="small"
								type="number"
								label={t("subscriptions@record.customMonths")}
								value={planMonths}
								disabled={busy}
								onChange={(e) => {
									const n = Number(e.target.value);
									if (Number.isFinite(n)) setPlanMonths(Math.min(24, Math.max(1, Math.trunc(n))));
								}}
								inputProps={{ min: 1, max: 24 }}
								sx={{ width: 130 }}
							/>
						</Stack>
					</Box>

					<Alert severity={preview.extending ? "info" : "success"} sx={{ borderRadius: 2 }}>
						{preview.extending
							? t("subscriptions@record.previewExtend", {
									start: formatShortDate(preview.start.toISOString(), lang),
									end: formatShortDate(preview.end.toISOString(), lang),
							  })
							: t("subscriptions@record.previewNew", {
									start: formatShortDate(preview.start.toISOString(), lang),
									end: formatShortDate(preview.end.toISOString(), lang),
							  })}
					</Alert>

					<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
						<DecimalField
							label={t("subscriptions@record.amount")}
							value={amount}
							onValueChange={(n) => setAmount(n)}
							size="small"
							fullWidth
							disabled={busy}
							inputProps={{ min: 0, step: "any" }}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<PaymentsIcon fontSize="small" color="action" />
									</InputAdornment>
								),
								endAdornment: <InputAdornment position="end">JOD</InputAdornment>,
							}}
						/>
						<DatePicker
							label={t("subscriptions@record.paidDate")}
							value={paidDate}
							onChange={setPaidDate}
							disabled={busy}
							slotProps={{ textField: { size: "small", fullWidth: true } }}
						/>
					</Stack>

					<Box>
						<Typography variant="subtitle2" fontWeight={700} gutterBottom>
							{t("subscriptions@record.method")}
						</Typography>
						<ToggleButtonGroup
							exclusive
							size="small"
							value={method}
							onChange={(_, v) => v && setMethod(v as PaymentMethod)}
							disabled={busy}
						>
							<ToggleButton value={PAYMENT_METHOD.CliQ}>
								{t("subscriptions@method.cliq")}
							</ToggleButton>
							<ToggleButton value={PAYMENT_METHOD.Cash}>
								{t("subscriptions@method.cash")}
							</ToggleButton>
						</ToggleButtonGroup>
					</Box>

					<Divider />

					<PayerPicker
						value={payer}
						onChange={setPayer}
						ownerUserAccountId={ownerUserAccountId}
						ownerName={ownerName}
						disabled={busy}
					/>

					<Divider />

					<TextField
						label={t("subscriptions@record.note")}
						value={note}
						onChange={(e) => setNote(e.target.value)}
						multiline
						rows={2}
						size="small"
						fullWidth
						disabled={busy}
						inputProps={{ maxLength: 500 }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
									<EditNoteIcon fontSize="small" color="action" />
								</InputAdornment>
							),
						}}
					/>

					{/* The CliQ screenshot — uploaded right after the payment is created. */}
					<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
						<Button
							component="label"
							variant="outlined"
							size="small"
							startIcon={<AttachFileIcon />}
							disabled={busy}
						>
							{t("subscriptions@record.attachProof")}
							<input
								type="file"
								hidden
								accept="image/*,application/pdf"
								onChange={(e) => {
									setProof(e.target.files?.[0] ?? null);
									e.target.value = "";
								}}
							/>
						</Button>
						{proof && (
							<Chip
								size="small"
								label={proof.name}
								onDelete={busy ? undefined : () => setProof(null)}
								sx={{ maxWidth: 260 }}
							/>
						)}
					</Stack>
				</Stack>
			</DialogContent>

			<DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
				<Button onClick={onClose} disabled={busy} color="inherit">
					{t("cancel")}
				</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					color="primary"
					disabled={busy || !canSubmit}
					startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <ReceiptLongIcon />}
				>
					{subscription ? t("subscriptions@record.renew") : t("subscriptions@record.record")}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
