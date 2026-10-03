import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Autocomplete,
	Box,
	CircularProgress,
	FormControlLabel,
	Stack,
	Switch,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { usePayers } from "../hooks/use-subscriptions";
import type { PayerDto, PayerRef } from "../types/api";

type Mode = "existing" | "owner" | "new";

interface PayerPickerProps {
	value: PayerRef | null;
	onChange: (value: PayerRef | null) => void;
	/** The entity owner's user account, when there is one — enables "owner" mode. */
	ownerUserAccountId?: number | null;
	ownerName?: string | null;
	disabled?: boolean;
}

/**
 * Chooses who paid, in the three shapes the API accepts: reuse a previous
 * payer, link the entity owner's user account (name/phone/email are then read
 * live from that account), or type in someone else — a matching phone number
 * reuses the existing payer record server-side.
 */
export default function PayerPicker({
	value,
	onChange,
	ownerUserAccountId,
	ownerName,
	disabled,
}: PayerPickerProps) {
	const { t } = useTranslation();
	const hasOwner = ownerUserAccountId != null && ownerUserAccountId > 0;

	const [mode, setMode] = useState<Mode>(hasOwner ? "owner" : "existing");
	const [search, setSearch] = useState("");
	const [selected, setSelected] = useState<PayerDto | null>(null);
	const [draft, setDraft] = useState({ name: "", phone: "", email: "" });
	const [hasWhatsApp, setHasWhatsApp] = useState(true);

	const { data: payers = [], isFetching } = usePayers(search, mode === "existing");

	// Keep the emitted value in step with the mode without a useEffect loop:
	// every input handler below emits, and switching mode re-emits immediately.
	const emit = (next: Mode, overrides?: Partial<typeof draft>, wa = hasWhatsApp) => {
		if (next === "owner" && hasOwner) {
			onChange({ userAccountId: ownerUserAccountId, hasWhatsApp: wa });
			return;
		}
		if (next === "existing") {
			onChange(selected ? { payerId: selected.id } : null);
			return;
		}
		const d = { ...draft, ...overrides };
		onChange(
			d.name.trim()
				? {
						name: d.name.trim(),
						phone: d.phone.trim() || null,
						email: d.email.trim() || null,
						hasWhatsApp: wa,
				  }
				: null
		);
	};

	const handleMode = (next: Mode | null) => {
		if (!next) return;
		setMode(next);
		emit(next);
	};

	const summary = useMemo(() => {
		if (!value) return null;
		if ("payerId" in value) return selected?.name ?? `#${value.payerId}`;
		if ("userAccountId" in value) return ownerName ?? `#${value.userAccountId}`;
		return value.name;
	}, [value, selected, ownerName]);

	return (
		<Stack spacing={1.5}>
			<Stack direction="row" spacing={0.75} alignItems="center">
				<PersonIcon fontSize="small" color="action" />
				<Typography variant="subtitle2" fontWeight={700} color="text.secondary">
					{t("subscriptions@payer.title")}
				</Typography>
			</Stack>

			<ToggleButtonGroup
				exclusive
				size="small"
				value={mode}
				onChange={(_, v) => handleMode(v as Mode | null)}
				disabled={disabled}
				sx={{ flexWrap: "wrap" }}
			>
				{hasOwner && (
					<ToggleButton value="owner">{t("subscriptions@payer.owner")}</ToggleButton>
				)}
				<ToggleButton value="existing">{t("subscriptions@payer.existing")}</ToggleButton>
				<ToggleButton value="new">{t("subscriptions@payer.new")}</ToggleButton>
			</ToggleButtonGroup>

			{mode === "owner" && hasOwner && (
				<Box sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: "divider" }}>
					<Typography variant="body2" fontWeight={600}>
						{ownerName ?? `#${ownerUserAccountId}`}
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{t("subscriptions@payer.ownerHint")}
					</Typography>
				</Box>
			)}

			{mode === "existing" && (
				<Autocomplete<PayerDto>
					options={payers}
					value={selected}
					disabled={disabled}
					loading={isFetching}
					onInputChange={(_, v) => setSearch(v)}
					onChange={(_, v) => {
						setSelected(v);
						onChange(v ? { payerId: v.id } : null);
					}}
					getOptionLabel={(o) => [o.name, o.phone].filter(Boolean).join(" · ") || `#${o.id}`}
					isOptionEqualToValue={(a, b) => a.id === b.id}
					noOptionsText={t("noResultsFound")}
					renderInput={(params) => (
						<TextField
							{...params}
							size="small"
							label={t("subscriptions@payer.search")}
							placeholder={t("subscriptions@payer.searchPlaceholder")}
							InputProps={{
								...params.InputProps,
								endAdornment: (
									<>
										{isFetching ? <CircularProgress size={16} /> : null}
										{params.InputProps.endAdornment}
									</>
								),
							}}
						/>
					)}
				/>
			)}

			{mode === "new" && (
				<Stack spacing={1.5}>
					<TextField
						size="small"
						fullWidth
						required
						label={t("subscriptions@payer.name")}
						value={draft.name}
						disabled={disabled}
						onChange={(e) => {
							setDraft((d) => ({ ...d, name: e.target.value }));
							emit("new", { name: e.target.value });
						}}
					/>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
						<TextField
							size="small"
							fullWidth
							label={t("subscriptions@payer.phone")}
							placeholder="07xxxxxxxx"
							value={draft.phone}
							disabled={disabled}
							onChange={(e) => {
								setDraft((d) => ({ ...d, phone: e.target.value }));
								emit("new", { phone: e.target.value });
							}}
						/>
						<TextField
							size="small"
							fullWidth
							type="email"
							label={t("subscriptions@payer.email")}
							value={draft.email}
							disabled={disabled}
							onChange={(e) => {
								setDraft((d) => ({ ...d, email: e.target.value }));
								emit("new", { email: e.target.value });
							}}
						/>
					</Stack>
					<Typography variant="caption" color="text.secondary">
						{t("subscriptions@payer.dedupeHint")}
					</Typography>
				</Stack>
			)}

			{mode !== "existing" && (
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={hasWhatsApp}
							disabled={disabled}
							onChange={(e) => {
								setHasWhatsApp(e.target.checked);
								emit(mode, undefined, e.target.checked);
							}}
						/>
					}
					label={
						<Stack direction="row" spacing={0.5} alignItems="center">
							<WhatsAppIcon fontSize="small" sx={{ color: "success.main" }} />
							<Typography variant="body2">{t("subscriptions@payer.hasWhatsApp")}</Typography>
						</Stack>
					}
				/>
			)}

			{summary && (
				<Typography variant="caption" color="text.secondary">
					{t("subscriptions@payer.selected")}: <b>{summary}</b>
				</Typography>
			)}
		</Stack>
	);
}
