import PendingIcon from "@mui/icons-material/Pending";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CancelIcon from "@mui/icons-material/Cancel";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import WarningIcon from "@mui/icons-material/Warning";
import EditAttributesIcon from "@mui/icons-material/EditAttributes";
import SyncIcon from "@mui/icons-material/Sync";
import EditIcon from "@mui/icons-material/Edit";
import { RESERVATION_STATUS as STATUS_IDS } from "../../../constants/reservation-status-constants";

export const getStatusIcon = (statusId: number | null) => {
  switch (statusId) {
    case STATUS_IDS.PENDING_PAYMENT:
      return <PendingIcon fontSize="small" />;
    case STATUS_IDS.PAID_AND_LICENSED:
      return <CheckCircleIcon fontSize="small" />;
    case STATUS_IDS.REFUND_REQUEST_PENDING_INSPECTOR:
      return <AssignmentIcon fontSize="small" />;
    case STATUS_IDS.REFUND_REQUEST_PENDING_FINANCE:
      return <AccountBalanceIcon fontSize="small" />;
    case STATUS_IDS.LICENSE_CANCELLED:
      return <CancelIcon fontSize="small" />;
    case STATUS_IDS.FEES_REFUNDED:
      return <AttachMoneyIcon fontSize="small" />;
    case STATUS_IDS.INCOMPLETE:
      return <HourglassEmptyIcon fontSize="small" />;
    case STATUS_IDS.REFUND_REQUEST_PENDING_VIOLATION_REMOVAL:
      return <WarningIcon fontSize="small" />;
    case STATUS_IDS.REFUND_REQUEST_PENDING_IBAN_UPDATE:
      return <EditAttributesIcon fontSize="small" />;
    case STATUS_IDS.REFUND_REQUEST_IN_PROCESS:
      return <SyncIcon fontSize="small" />;
    default:
      return <EditIcon fontSize="small" />;
  }
};

export const getStatusColor = (statusId: number | null) => {
  switch (statusId) {
    case STATUS_IDS.PENDING_PAYMENT:
      return "warning" as const;
    case STATUS_IDS.PAID_AND_LICENSED:
      return "success" as const;
    case STATUS_IDS.REFUND_REQUEST_PENDING_INSPECTOR:
      return "info" as const;
    case STATUS_IDS.REFUND_REQUEST_PENDING_FINANCE:
      return "info" as const;
    case STATUS_IDS.LICENSE_CANCELLED:
      return "error" as const;
    case STATUS_IDS.FEES_REFUNDED:
      return "success" as const;
    case STATUS_IDS.INCOMPLETE:
      return "warning" as const;
    case STATUS_IDS.REFUND_REQUEST_PENDING_VIOLATION_REMOVAL:
      return "error" as const;
    case STATUS_IDS.REFUND_REQUEST_PENDING_IBAN_UPDATE:
      return "warning" as const;
    case STATUS_IDS.REFUND_REQUEST_IN_PROCESS:
      return "primary" as const;
    default:
      return "primary" as const;
  }
};

export const formatDate = (dateString: string, locale: string) => {
  const date = new Date(dateString);
  const dateTimeFormat = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return dateTimeFormat.format(date);
};
