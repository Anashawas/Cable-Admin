import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Tooltip,
} from "@mui/material";
import {
  ExitToApp as LogoutIcon,
  Brightness4,
  Brightness7,
  MoreVert,
  Language,
  Menu as MenuIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  useAuthenticationStore,
  useThemeStore,
  useLanguageStore,
  useLayoutStore,
} from "../../../stores";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LANGUAGE } from "../../../constants/language-constants";
import { useState } from "react";
import AppMobileDrawer from "./AppMobileDrawer";
import { useGlobalSearchStore } from "../../../stores";

const AppHeader = () => {
  const user = useAuthenticationStore((state) => state.user);
  const logout = useAuthenticationStore((state) => state.logout);
  const currentTheme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const smallScreen = useLayoutStore((state) => state.smallScreen);
  const navigate = useNavigate();
  const { t } = useTranslation("app");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const setGlobalSearchOpen = useGlobalSearchStore((s) => s.setOpen);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const open = Boolean(anchorEl);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const toggleTheme = () => {
    setTheme(currentTheme === "light" ? "dark" : "light");
    handleClose();
  };

  const toggleLanguage = () => {
    setLanguage(language === LANGUAGE.EN ? LANGUAGE.AR : LANGUAGE.EN);
    handleClose();
  };

  const handleLogoutClick = () => {
    handleLogout();
    handleClose();
  };

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <>
      <AppBar position="static" sx={{ minHeight: 72, boxShadow: "none" }}>
        <Toolbar sx={{ minHeight: 72, px: 3 }}>
          {smallScreen && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleMobileDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box display="flex" alignItems="center" sx={{ mr: 2 }}>
            {/* <img
              src={`${window.env.host.virtualPath}/images/Cable-Logo.png`}
              alt="KM Camping Logo"
              style={{
                height: "40px",
                marginRight: "10px",
                marginLeft: "10px",
              }}
            /> */}
            <Typography variant="h6" component="div">
              {t("appTitle", "KM Camping")}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title={t("search@openShortcut", "Search (Ctrl+K)")} arrow>
            <IconButton color="inherit" onClick={() => setGlobalSearchOpen(true)} aria-label="Open search">
              <SearchIcon />
            </IconButton>
          </Tooltip>

          {isMobile ? (
            <Box display="flex" alignItems="center">
              {user && (
                <Typography
                  variant="body2"
                  sx={{ mr: 1, display: { xs: "none", sm: "block" } }}
                >
                  {user.name}
                </Typography>
              )}
              <IconButton
                color="inherit"
                onClick={handleClick}
                aria-controls={open ? "mobile-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
              >
                <MoreVert />
              </IconButton>
              <Menu
                id="mobile-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  "aria-labelledby": "mobile-menu-button",
                }}
              >
                <MenuItem onClick={toggleTheme}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {currentTheme === "light" ? (
                      <Brightness4 />
                    ) : (
                      <Brightness7 />
                    )}
                    <Typography>
                      {currentTheme === "light"
                        ? t("darkMode", "Dark Mode")
                        : t("lightMode", "Light Mode")}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem onClick={toggleLanguage}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Language />
                    <Typography>
                      {language === LANGUAGE.EN
                        ? t("switchToArabic", "العربية")
                        : t("switchToEnglish", "English")}
                    </Typography>
                  </Box>
                </MenuItem>
                {user && (
                  <MenuItem onClick={handleLogoutClick}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LogoutIcon />
                      <Typography>{t("logout", "Logout")}</Typography>
                    </Box>
                  </MenuItem>
                )}
              </Menu>
            </Box>
          ) : (
            <Box display="flex" alignItems="center" gap={1}>
              <Tooltip
                title={
                  currentTheme === "light"
                    ? t("common@switchToDarkMode")
                    : t("common@switchToLightMode")
                }
                arrow
              >
                <IconButton color="inherit" onClick={toggleTheme}>
                  {currentTheme === "light" ? <Brightness4 /> : <Brightness7 />}
                </IconButton>
              </Tooltip>
              <Tooltip title={t("common@changeLanguage")} arrow>
                <Button color="inherit" onClick={toggleLanguage}>
                  {language === LANGUAGE.EN ? "العربية" : "English"}
                </Button>
              </Tooltip>
              {user && (
                <>
                  <Typography variant="body2">
                    {t("welcomeMessage", "Welcome")}, {user.name}
                  </Typography>
                  <Tooltip title={t("logout", "Logout")} arrow>
                    <IconButton color="inherit" onClick={handleLogout}>
                      <LogoutIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <AppMobileDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />
    </>
  );
};

export default AppHeader;
