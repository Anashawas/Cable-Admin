import { useTranslation } from "react-i18next";
import Chip, { type ChipProps } from "@mui/material/Chip";

const COLOR: Record<string, ChipProps["color"]> = {
  Active: "success",
  ExpiringSoon: "warning",
  InGrace: "error",
  Expired: "default",
  SwitchedOff: "default",
  Scheduled: "info",
  Exhausted: "error",
  Cancelled: "default",
  Upgraded: "secondary",
  Renewed: "secondary",
  Pending: "warning",
  Fulfilled: "success",
  Rejected: "default",
};

/** A subscription-record / upgrade-request status (server-computed). */
export default function PlanStatusChip({ status, size = "small" }: { status: string; size?: ChipProps["size"] }) {
  const { t } = useTranslation();
  return (
    <Chip
      size={size}
      color={COLOR[status] ?? "default"}
      variant={COLOR[status] && COLOR[status] !== "default" ? "filled" : "outlined"}
      label={t(`billing@status.${status}`, { defaultValue: status })}
      sx={{ fontWeight: 700 }}
    />
  );
}
