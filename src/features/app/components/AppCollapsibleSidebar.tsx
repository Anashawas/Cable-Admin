import {
	Box,
	Drawer,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	useTheme,
	IconButton,
	Collapse,
	Typography,
	Tooltip,
	alpha,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useLayoutStore, useAuthenticationStore } from "../../../stores";
import {
	Dashboard as DashboardIcon,
	ChevronLeft as ChevronLeftIcon,
	ChevronRight as ChevronRightIcon,
	ExpandLess,
	ExpandMore,
} from "@mui/icons-material";
import { PrivilegeCode } from "../../../constants/privileges-constants";
import { getNavigationGroups, isNavPathActive, NavigationGroup, NavigationItem } from "./navigation-config";

const EXPANDED_WIDTH = 300;
const COLLAPSED_WIDTH = 64;

const AppCollapsibleSidebar = () => {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const theme = useTheme();
	const sidebarExpanded = useLayoutStore((state) => state.sidebarExpanded);
	const toggleSidebar = useLayoutStore((state) => state.toggleSidebar);
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
		chargeManagement: false,
		userManagement: false,
		providerManagement: false,
		partnerManagement: false,
		loyaltySystem: false,
		systemData: false,
	});

	const isRTL = i18n.language === "ar";

	const drawerWidth = sidebarExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

	// ── Theme-aware palette ─────────────────────────────────────────────
	// Dark mode keeps the navy gradient; light mode is a clean white sidebar.
	const isDark = theme.palette.mode === "dark";
	const c = {
		bg: isDark
			? "linear-gradient(180deg, #0d1f4e 0%, #0d3276 60%, #0a4a8f 100%)"
			: theme.palette.background.paper,
		border: isDark ? "rgba(255,255,255,0.10)" : theme.palette.divider,
		text: isDark ? "#ffffff" : theme.palette.text.primary,
		textMuted: isDark ? "rgba(255,255,255,0.6)" : theme.palette.text.secondary,
		iconMuted: isDark ? "rgba(255,255,255,0.75)" : theme.palette.text.secondary,
		activeBg: isDark ? "rgba(255,255,255,0.18)" : alpha(theme.palette.primary.main, 0.12),
		hoverBg: isDark ? "rgba(255,255,255,0.08)" : alpha(theme.palette.primary.main, 0.06),
		groupActiveBg: isDark ? "rgba(255,255,255,0.10)" : alpha(theme.palette.primary.main, 0.06),
		accent: isDark ? "rgba(255,255,255,0.8)" : theme.palette.primary.main,
		activeText: isDark ? "#ffffff" : theme.palette.primary.main,
		activeIcon: isDark ? "#ffffff" : theme.palette.primary.main,
		footerText: isDark ? "rgba(255,255,255,0.45)" : theme.palette.text.secondary,
	};

	const navigationGroups: NavigationGroup[] = getNavigationGroups(t);
	const standaloneNavigationItems: NavigationItem[] = [];

	const handleNavigate = (path: string) => {
		navigate(path);
	};

	const handleToggleExpanded = () => {
		toggleSidebar();
		if (!sidebarExpanded) {
			setExpandedGroups({
				chargeManagement: false,
				userManagement: false,
				providerManagement: false,
				partnerManagement: false,
				loyaltySystem: false,
				systemData: false,
			});
		}
	};

	const handleToggleGroup = (groupId: string) => {
		if (!sidebarExpanded) {
			toggleSidebar();
			setExpandedGroups(prev => ({
				...prev,
				[groupId]: true,
			}));
			return;
		}
		setExpandedGroups(prev => ({
			...prev,
			[groupId]: !prev[groupId],
		}));
	};

	const isPathInGroup = (groupItems: NavigationItem[]) => {
		return groupItems.some(
			item =>
				isNavPathActive(location.pathname, item.path) ||
				(item.path === "/offers" &&
					(location.pathname === "/pending-offers" || location.pathname === "/active-offers"))
		);
	};

	const hasPrivilege = (requiredPrivileges?: PrivilegeCode[]) => {
		if (!requiredPrivileges || requiredPrivileges.length === 0) return true;
		const userPrivileges = useAuthenticationStore.getState().privileges;
		return requiredPrivileges.some(privilege => userPrivileges.includes(privilege));
	};

	const filterVisibleItems = (items: NavigationItem[]) => {
		return items.filter(item => hasPrivilege(item.requiredPrivileges));
	};

	const filterVisibleGroups = (groups: NavigationGroup[]) => {
		return groups.map(group => ({
			...group,
			items: filterVisibleItems(group.items)
		})).filter(group => group.items.length > 0);
	};

	const collapseBtnSx = {
		color: c.iconMuted,
		"&:hover": { color: c.text, bgcolor: c.hoverBg },
		"&.Mui-focusVisible": { outline: `2px solid ${c.accent}`, outlineOffset: 2 },
	};

	const navItemSx = (isActive: boolean) => ({
		mx: 1,
		mb: 0.5,
		borderRadius: 2,
		color: c.text,
		justifyContent: sidebarExpanded ? "initial" : "center",
		backgroundColor: isActive ? c.activeBg : "transparent",
		borderLeft: isActive && !isRTL ? `3px solid ${c.accent}` : "3px solid transparent",
		borderRight: isActive && isRTL ? `3px solid ${c.accent}` : "3px solid transparent",
		"&:hover": { backgroundColor: isActive ? c.activeBg : c.hoverBg },
		"& .MuiListItemIcon-root": { color: isActive ? c.activeIcon : c.iconMuted },
		"& .MuiListItemText-primary": {
			fontWeight: isActive ? 700 : 500,
			fontSize: "0.875rem",
			color: isActive ? c.activeText : c.text,
		},
		"&.Mui-selected": {
			backgroundColor: c.activeBg,
			"&:hover": { backgroundColor: c.activeBg },
		},
	});

	return (
		<Drawer
			variant="permanent"
			sx={{
				width: drawerWidth,
				flexShrink: 0,
				zIndex: 1400,
				"& .MuiDrawer-paper": {
					width: drawerWidth,
					boxSizing: "border-box",
					border: "none",
					borderInlineEnd: isDark ? "none" : `1px solid ${theme.palette.divider}`,
					background: c.bg,
					color: c.text,
					boxShadow: isDark ? "none" : "0 0 20px rgba(15,25,41,0.06)",
					transition: theme.transitions.create("width", {
						easing: theme.transitions.easing.sharp,
						duration: theme.transitions.duration.enteringScreen,
					}),
					overflowX: "hidden",
					position: "fixed",
					height: "100vh",
					top: 0,
					left: 0,
					zIndex: 1400,
				},
			}}
		>
			{/* ── Brand + collapse control ── */}
			{sidebarExpanded ? (
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						px: 2,
						height: 64,
						flexShrink: 0,
						borderBottom: `1px solid ${c.border}`,
					}}
				>
					{/* Brand lives here on desktop; the header shows the page title instead. */}
					<Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
						<Box
							component="img"
							src={`${window.env.host.virtualPath}/images/Cable-Logo.png`}
							alt=""
							sx={{
								height: 32,
								width: 32,
								borderRadius: 1,
								objectFit: "contain",
								flexShrink: 0,
								bgcolor: isDark ? "rgba(255,255,255,0.9)" : "transparent",
								p: isDark ? 0.25 : 0,
							}}
						/>
						<Typography variant="subtitle1" noWrap fontWeight={600} sx={{ color: c.text }}>
							{t("app@appTitle")}
						</Typography>
					</Box>
					<Tooltip title={t("app@collapseSidebar")} arrow>
						<IconButton
							onClick={handleToggleExpanded}
							size="small"
							aria-label={t("app@collapseSidebar")}
							aria-expanded
							sx={collapseBtnSx}
						>
							{isRTL ? <ChevronRightIcon /> : <ChevronLeftIcon />}
						</IconButton>
					</Tooltip>
				</Box>
			) : (
				<Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 64, flexShrink: 0, borderBottom: `1px solid ${c.border}` }}>
					<Tooltip title={t("app@expandSidebar")} placement={isRTL ? "left" : "right"} arrow>
						<IconButton
							onClick={handleToggleExpanded}
							size="small"
							aria-label={t("app@expandSidebar")}
							aria-expanded={false}
							sx={collapseBtnSx}
						>
							{isRTL ? <ChevronLeftIcon /> : <ChevronRightIcon />}
						</IconButton>
					</Tooltip>
				</Box>
			)}

			{/* ── Nav list ── */}
			<Box sx={{ overflow: "auto", flexGrow: 1, pt: 1 }}>
				<List disablePadding>
					{/* Dashboard */}
					<Tooltip title={!sidebarExpanded ? t("dashboard") : ""} placement="right" arrow>
						<ListItemButton
							selected={location.pathname === "/"}
							onClick={() => handleNavigate("/")}
							sx={navItemSx(location.pathname === "/")}
						>
							<ListItemIcon sx={{ minWidth: 0, mr: sidebarExpanded ? 2 : "auto", justifyContent: "center" }}>
								<DashboardIcon fontSize="small" />
							</ListItemIcon>
							{sidebarExpanded && <ListItemText primary={t("dashboard")} />}
						</ListItemButton>
					</Tooltip>

					{sidebarExpanded ? (
						filterVisibleGroups(navigationGroups).map((group) => {
							const groupActive = isPathInGroup(group.items);
							const groupOpen = expandedGroups[group.id];
							return (
								<Box key={group.id}>
									<ListItemButton
										onClick={() => handleToggleGroup(group.id)}
										sx={{
											mx: 1,
											mb: 0.5,
											borderRadius: 2,
											color: c.text,
											backgroundColor: groupActive && !groupOpen ? c.groupActiveBg : "transparent",
											"&:hover": { backgroundColor: c.hoverBg },
											"& .MuiListItemIcon-root": { color: c.iconMuted },
											"& .MuiListItemText-primary": { fontWeight: 600, fontSize: "0.875rem", color: c.text },
										}}
									>
										<ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: "center" }}>
											{group.icon}
										</ListItemIcon>
										<ListItemText primary={group.label} />
										{groupOpen
											? <ExpandLess sx={{ color: c.textMuted }} />
											: <ExpandMore sx={{ color: c.textMuted }} />}
									</ListItemButton>

									<Collapse in={groupOpen} timeout="auto" unmountOnExit>
										<List component="div" disablePadding>
											{group.items.map((item) => {
												const isActive = isNavPathActive(location.pathname, item.path);
												return (
													<ListItemButton
														key={item.path}
														selected={isActive}
														onClick={() => handleNavigate(item.path)}
														sx={{
															px: 2,
															paddingInlineStart: 4,
															mx: 1,
															mb: 0.5,
															borderRadius: 2,
															color: c.text,
															backgroundColor: isActive ? c.activeBg : "transparent",
															borderLeft: isActive && !isRTL ? `3px solid ${c.accent}` : "3px solid transparent",
															borderRight: isActive && isRTL ? `3px solid ${c.accent}` : "3px solid transparent",
															"&:hover": { backgroundColor: isActive ? c.activeBg : c.hoverBg },
															"& .MuiListItemIcon-root": { color: isActive ? c.activeIcon : c.iconMuted },
															"& .MuiListItemText-primary": { fontWeight: isActive ? 700 : 400, fontSize: "0.85rem", color: isActive ? c.activeText : c.text },
															"&.Mui-selected": { backgroundColor: c.activeBg, "&:hover": { backgroundColor: c.activeBg } },
														}}
													>
														<ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
															{item.icon}
														</ListItemIcon>
														<ListItemText primary={item.label} />
													</ListItemButton>
												);
											})}
										</List>
									</Collapse>
								</Box>
							);
						})
					) : (
						filterVisibleGroups(navigationGroups).flatMap(group => group.items).map((item) => (
							<Tooltip key={item.path} title={item.label} placement="right" arrow>
								<ListItemButton
									selected={isNavPathActive(location.pathname, item.path)}
									onClick={() => handleNavigate(item.path)}
									sx={navItemSx(isNavPathActive(location.pathname, item.path))}
								>
									<ListItemIcon sx={{ minWidth: 0, mr: "auto", justifyContent: "center" }}>
										{item.icon}
									</ListItemIcon>
								</ListItemButton>
							</Tooltip>
						))
					)}

					{filterVisibleItems(standaloneNavigationItems).map((item) => (
						<Tooltip key={item.path} title={!sidebarExpanded ? item.label : ""} placement="right" arrow>
							<ListItemButton
								selected={isNavPathActive(location.pathname, item.path)}
								onClick={() => handleNavigate(item.path)}
								sx={navItemSx(isNavPathActive(location.pathname, item.path))}
							>
								<ListItemIcon sx={{ minWidth: 0, mr: sidebarExpanded ? 2 : "auto", justifyContent: "center" }}>
									{item.icon}
								</ListItemIcon>
								{sidebarExpanded && <ListItemText primary={item.label} />}
							</ListItemButton>
						</Tooltip>
					))}
				</List>
			</Box>

			{/* ── Footer ── */}
			<Box sx={{ p: 2, borderTop: `1px solid ${c.border}` }}>
				{sidebarExpanded && (
					<>
						<Typography variant="caption" display="block" sx={{ color: c.footerText }}>
							© {new Date().getFullYear()} {t("app@appTitle")}
						</Typography>
						<Typography variant="caption" display="block" sx={{ color: c.footerText }}>
							{t("version")}: {import.meta.env.VITE_APP_VERSION || "1.0.0"}
						</Typography>
					</>
				)}
			</Box>
		</Drawer>
	);
};

export default AppCollapsibleSidebar;
