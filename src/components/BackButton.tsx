import { IconButton, Tooltip, alpha, useTheme, type SxProps, type Theme } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useTranslation } from "react-i18next";
import { useSmartBack } from "../hooks/use-smart-back";

export interface BackButtonProps {
  /** Where to go when there is no in-app history (direct link / refresh). */
  fallback: string;
  /** "onDark" for the coloured gradient headers, "default" for light surfaces. */
  variant?: "default" | "onDark";
  size?: "small" | "medium";
  /** Override the default behaviour (rarely needed). */
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

/** RTL-aware, history-aware back button used across detail/form screens. */
export default function BackButton({ fallback, variant = "default", size = "medium", onClick, sx }: BackButtonProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const goBack = useSmartBack(fallback);
  const isRtl = theme.direction === "rtl";
  const label = t("common@back");
  const Icon = isRtl ? ArrowForwardIcon : ArrowBackIcon;

  const variantSx: SxProps<Theme> =
    variant === "onDark"
      ? {
          color: "#fff",
          bgcolor: "rgba(255,255,255,0.14)",
          border: "1px solid rgba(255,255,255,0.22)",
          "&:hover": { bgcolor: "rgba(255,255,255,0.24)" },
          "&:focus-visible": { outline: "2px solid rgba(255,255,255,0.8)", outlineOffset: 2 },
        }
      : {
          color: "text.primary",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08), borderColor: alpha(theme.palette.primary.main, 0.3) },
          "&:focus-visible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
        };

  return (
    <Tooltip title={label} arrow>
      <IconButton
        aria-label={label}
        size={size}
        onClick={onClick ?? goBack}
        sx={[
          { borderRadius: 2, flexShrink: 0, transition: "background-color 120ms, border-color 120ms" },
          variantSx,
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ] as SxProps<Theme>}
      >
        <Icon fontSize={size === "small" ? "small" : "medium"} />
      </IconButton>
    </Tooltip>
  );
}

/** Direction-aware "back" arrow (points right in RTL) for text buttons / menus. */
export function BackArrowIcon(props: { fontSize?: "inherit" | "small" | "medium" | "large"; sx?: SxProps<Theme> }) {
  const theme = useTheme();
  const Icon = theme.direction === "rtl" ? ArrowForwardIcon : ArrowBackIcon;
  return <Icon {...props} />;
}
