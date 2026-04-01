import type { PaletteMode } from "@mui/material";

const THEME_STATE_KEY = "CABLE_ADMIN_THEME";

export const THEME_TYPES = {
  LIGHT: "light" as PaletteMode,
  DARK: "dark" as PaletteMode,
};

export const THEMES = {
  DARK: {
    palette: {
      primary: { main: "#64B5F6", light: "#90CAF9", dark: "#42A5F5" },
      secondary: { main: "#4FC3F7", light: "#81D4FA", dark: "#0288D1" },
      background: {
        paper: "#0F1929",
        default: "#0A1120",
      },
      divider: "rgba(255, 255, 255, 0.10)",
      text: {
        primary: "#E8F1FF",
        secondary: "#90A8C8",
      },
      mode: THEME_TYPES.DARK,
    },
    typography: {
      fontFamily:
        "Roboto, Cairo, -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    },
  },
  LIGHT: {
    palette: {
      primary: { main: "#1565C0", light: "#1E88E5", dark: "#0D47A1" },
      secondary: { main: "#0288D1", light: "#29B6F6", dark: "#01579B" },
      background: {
        paper: "#FFFFFF",
        default: "#EEF2F8",
      },
      text: {
        primary: "#0D1929",
        secondary: "#3A5070",
      },
      mode: THEME_TYPES.LIGHT,
    },
    typography: {
      fontFamily:
        "Roboto, Cairo, -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    },
  },
};

export { THEME_STATE_KEY };
