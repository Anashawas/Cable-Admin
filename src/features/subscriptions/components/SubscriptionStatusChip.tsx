import { useTranslation } from "react-i18next";
import Chip from "@mui/material/Chip";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import type { ChipProps } from "@mui/material/Chip";
import type { SubscriptionStatus } from "../types/api";

/** Status is computed server-side, so the same five states appear everywhere. */
const CONFIG: Record<
	SubscriptionStatus,
	{ color: ChipProps["color"]; icon: React.ReactElement }
> = {
	Active: { color: "success", icon: <CheckCircleIcon /> },
	ExpiringSoon: { color: "warning", icon: <WarningAmberIcon /> },
	// Past expiry but still switched on — this one is costing money.
	InGrace: { color: "error", icon: <HourglassBottomIcon /> },
	Expired: { color: "default", icon: <ErrorOutlineIcon /> },
	SwitchedOff: { color: "default", icon: <PowerSettingsNewIcon /> },
};

export default function SubscriptionStatusChip({
	status,
	size = "small",
}: {
	status: SubscriptionStatus;
	size?: ChipProps["size"];
}) {
	const { t } = useTranslation();
	const cfg = CONFIG[status] ?? CONFIG.Expired;
	return (
		<Chip
			size={size}
			color={cfg.color}
			icon={cfg.icon}
			label={t(`subscriptions@status.${status}`)}
			sx={{ fontWeight: 700, "& .MuiChip-icon": { fontSize: 16 } }}
		/>
	);
}
