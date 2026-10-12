import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  ButtonBase,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Avatar,
  useMediaQuery,
  useTheme,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  DarkModeOutlined,
  LightModeOutlined,
  Menu as MenuIcon,
  Search as SearchIcon,
  KeyboardArrowDown,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import {
  useAuthenticationStore,
  useThemeStore,
  useLanguageStore,
  useLayoutStore,
} from "../../../stores";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LANGUAGE } from "../../../constants/language-constants";
import { useEffect, useMemo, useState } from "react";
import AppMobileDrawer from "./AppMobileDrawer";
import { useGlobalSearchStore } from "../../../stores";
import { logoutUser } from "../../authentication/services/authentication-service";
import { getNavigationGroups, isNavPathActive } from "./navigation-config";

const HEADER_HEIGHT = 64;

const AppHeader = () => {
  const user = useAuthenticationStore((state) => state.user);
  const logout = useAuthenticationStore((state) => state.logout);
  const currentTheme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const smallScreen = useLayoutStore((state) => state.smallScreen);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("app");
  const { t: tCommon } = useTranslation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isRTL = theme.direction === "rtl";
  const setGlobalSearchOpen = useGlobalSearchStore((s) => s.setOpen);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const open = Boolean(anchorEl);

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform);
  const showBrand = smallScreen; // desktop shows the brand in the sidebar

  // Current page title (+ its nav group) for the header breadcrumb.
  const pageInfo = useMemo(() => {
    const path = location.pathname;
    if (path === "/") return { group: null as string | null, title: tCommon("dashboard") };
    const groups = getNavigationGroups(tCommon);
    let best: { group: string; title: string; len: number } | null = null;
    for (const g of groups) {
      for (const item of g.items) {
        const hit =
          isNavPathActive(path, item.path) ||
          (item.path === "/offers" && (path === "/pending-offers" || path === "/active-offers"));
        if (hit && (!best || item.path.length > best.len)) {
          best = { group: g.label, title: item.label, len: item.path.length };
        }
      }
    }
    return best ? { group: best.group, title: best.title } : null;
  }, [location.pathname, tCommon]);

  // Browser tab title: "<screen> · <app name>".
  useEffect(() => {
    const suffix = tCommon("appTabTitle");
    document.title = pageInfo?.title ? `${pageInfo.title} · ${suffix}` : suffix;
  }, [pageInfo, tCommon]);

  const handleLogout = async () => {
    try { await logoutUser(); } catch { /* best-effort — logout locally regardless */ }
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
  };

  const toggleLanguage = () => {
    setLanguage(language === LANGUAGE.EN ? LANGUAGE.AR : LANGUAGE.EN);
  };

  const handleLogoutClick = () => {
    handleClose();
    handleLogout();
  };

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  const focusRing = {
    "&.Mui-focusVisible, &:focus-visible": {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  };

  const iconBtnSx = {
    width: 40,
    height: 40,
    color: "text.secondary",
    "&:hover": { color: "text.primary", bgcolor: "action.hover" },
    ...focusRing,
  };

  const searchLabel = t("searchPlaceholder", "Search…");
  const shortcut = isMac ? "⌘K" : "Ctrl K";

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          top: 0,
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundImage: "none",
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            minHeight: `${HEADER_HEIGHT}px !important`,
            height: HEADER_HEIGHT,
            px: { xs: 2, md: 3 },
            gap: { xs: 1, md: 2 },
          }}
        >
          {/* ── Start: drawer button + brand (mobile) / page title (desktop) ── */}
          <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0, flexShrink: 1 }}>
            {smallScreen && (
              <Tooltip title={t("openMenu", "Open menu")} arrow>
                <IconButton
                  edge="start"
                  onClick={handleMobileDrawerToggle}
                  aria-label={t("openMenu", "Open menu")}
                  sx={iconBtnSx}
                >
                  <MenuIcon />
                </IconButton>
              </Tooltip>
            )}
            {showBrand ? (
              <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
                <Box
                  component="img"
                  src={`${window.env.host.virtualPath}/images/Cable-Logo.png`}
                  alt=""
                  sx={{ height: 32, width: 32, borderRadius: 1, objectFit: "contain", flexShrink: 0 }}
                />
                <Typography
                  variant="subtitle1"
                  component="div"
                  fontWeight={600}
                  noWrap
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  {t("appTitle", "Cable Admin")}
                </Typography>
              </Box>
            ) : (
              pageInfo && (
                <Box
                  component="nav"
                  aria-label="breadcrumb"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  sx={{ minWidth: 0 }}
                >
                  {pageInfo.group && (
                    <>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ display: { xs: "none", lg: "block" } }}>
                        {pageInfo.group}
                      </Typography>
                      <Box
                        component="span"
                        sx={{ display: { xs: "none", lg: "flex" }, color: "text.disabled" }}
                        aria-hidden
                      >
                        {isRTL ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
                      </Box>
                    </>
                  )}
                  <Typography variant="subtitle1" component="h1" fontWeight={600} noWrap aria-current="page">
                    {pageInfo.title}
                  </Typography>
                </Box>
              )
            )}
          </Box>

          {/* ── Middle: search ── */}
          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
            {!isMobile && (
              <ButtonBase
                onClick={() => setGlobalSearchOpen(true)}
                aria-label={t("search@openShortcut", "Search (Ctrl+K)")}
                aria-keyshortcuts="Control+K Meta+K"
                sx={{
                  width: "100%",
                  maxWidth: 420,
                  height: 40,
                  px: 1.5,
                  gap: 1,
                  justifyContent: "flex-start",
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.06 : 0.03),
                  color: "text.secondary",
                  transition: theme.transitions.create(["border-color", "background-color"]),
                  "&:hover": {
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                    bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.09 : 0.05),
                  },
                  ...focusRing,
                }}
              >
                <SearchIcon fontSize="small" />
                <Typography variant="body2" sx={{ flexGrow: 1, textAlign: "start" }} noWrap>
                  {searchLabel}
                </Typography>
                <Box
                  component="kbd"
                  dir="ltr"
                  sx={{
                    fontFamily: "inherit",
                    fontSize: "0.75rem",
                    lineHeight: 1,
                    px: 0.75,
                    py: 0.5,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: "background.paper",
                    color: "text.secondary",
                  }}
                >
                  {shortcut}
                </Box>
              </ButtonBase>
            )}
          </Box>

          {/* ── End: actions ── */}
          <Box display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
            {isMobile && (
              <Tooltip title={t("search@openShortcut", "Search (Ctrl+K)")} arrow>
                <IconButton
                  onClick={() => setGlobalSearchOpen(true)}
                  aria-label={t("search@openShortcut", "Search (Ctrl+K)")}
                  sx={iconBtnSx}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title={tCommon("changeLanguage")} arrow>
              <ButtonBase
                onClick={toggleLanguage}
                aria-label={
                  language === LANGUAGE.EN
                    ? t("switchToArabic", "العربية")
                    : t("switchToEnglish", "English")
                }
                lang={language === LANGUAGE.EN ? "ar" : "en"}
                sx={{
                  minWidth: 40,
                  height: 32,
                  px: 1.5,
                  borderRadius: 999,
                  border: `1px solid ${theme.palette.divider}`,
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "text.secondary",
                  "&:hover": { color: "text.primary", bgcolor: "action.hover" },
                  ...focusRing,
                }}
              >
                {language === LANGUAGE.EN ? "ع" : "EN"}
              </ButtonBase>
            </Tooltip>

            <Tooltip
              title={
                currentTheme === "light"
                  ? tCommon("switchToDarkMode")
                  : tCommon("switchToLightMode")
              }
              arrow
            >
              <IconButton
                onClick={toggleTheme}
                aria-label={
                  currentTheme === "light"
                    ? tCommon("switchToDarkMode")
                    : tCommon("switchToLightMode")
                }
                sx={iconBtnSx}
              >
                {currentTheme === "light" ? <DarkModeOutlined /> : <LightModeOutlined />}
              </IconButton>
            </Tooltip>

            {user && (
              <>
                <Tooltip title={t("userMenu", "Account")} arrow>
                  <ButtonBase
                    id="user-menu-button"
                    onClick={handleClick}
                    aria-label={t("userMenu", "Account")}
                    aria-controls={open ? "user-menu" : undefined}
                    aria-haspopup="menu"
                    aria-expanded={open ? "true" : undefined}
                    sx={{
                      height: 40,
                      pl: 0.5,
                      pr: { xs: 0.5, md: 1 },
                      gap: 1,
                      borderRadius: 999,
                      color: "text.primary",
                      "&:hover": { bgcolor: "action.hover" },
                      ...focusRing,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                      }}
                    >
                      {userInitial}
                    </Avatar>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      noWrap
                      sx={{ display: { xs: "none", md: "block" }, maxWidth: 160 }}
                    >
                      {user.name}
                    </Typography>
                    <KeyboardArrowDown
                      fontSize="small"
                      sx={{ display: { xs: "none", md: "block" }, color: "text.secondary" }}
                    />
                  </ButtonBase>
                </Tooltip>
                <Menu
                  id="user-menu"
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: isRTL ? "left" : "right" }}
                  transformOrigin={{ vertical: "top", horizontal: isRTL ? "left" : "right" }}
                  MenuListProps={{ "aria-labelledby": "user-menu-button", dense: false }}
                  slotProps={{ paper: { sx: { mt: 1, minWidth: 240, borderRadius: 2 } } }}
                >
                  <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 700 }}>
                      {userInitial}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap>
                        {user.name}
                      </Typography>
                      {user.email && (
                        <Typography variant="caption" color="text.secondary" noWrap display="block" dir="ltr" sx={{ textAlign: "start" }}>
                          {user.email}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Divider />
                  <MenuItem onClick={handleLogoutClick} sx={{ py: 1.25, mt: 0.5, color: "error.main" }}>
                    <ListItemIcon sx={{ color: "error.main" }}>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    {t("logout", "Logout")}
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
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
