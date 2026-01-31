import type { PaletteMode } from "@mui/material";

const THEME_STATE_KEY = "KM_CAMPING_THEME";

export const THEME_TYPES = {
  LIGHT: "light" as PaletteMode,
  DARK: "dark" as PaletteMode,
};

export const THEMES = {
  DARK: {
    palette: {
      primary: { main: "#352C12", dark: "#0F0B02" },
      secondary: { main: "#634B0F" },
      background: {
        paper: "#0F0B02",
        default: "#000000",
      },
      divider: "rgba(255, 255, 255, 0.12)",
      text: {
        primary: "#F7F6F3",
        secondary: "#D8D2C3",
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
      primary: { main: "#5082C8", dark: "#352C12" },
      secondary: { main: "#8A784B" },
      background: {
        paper: "#F7F6F3",
        default: "#EFEDE7",
      },
      text: {
        primary: "#0F0B02",
        secondary: "#634B0F",
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
