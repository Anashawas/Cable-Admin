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
	Divider,
	Avatar,
	Tooltip
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
	EvStation as EvStationIcon,
	People as PeopleIcon,
	Settings as SettingsIcon,
	ListAlt as ListAltIcon,
	LocalHospital as LocalHospitalIcon,
	NotificationsActive as NotificationsActiveIcon,
	ReportProblem as ReportProblemIcon,
	Store as StoreIcon,
	Category as CategoryIcon,
	LocalOffer as LocalOfferIcon,
	MonetizationOn as MonetizationOnIcon,
	PendingActions as PendingActionsIcon,
	AccountBalance as AccountBalanceIcon,
	Handshake as HandshakeIcon,
	LocalOffer as ActiveOfferIcon,
	ReceiptLong as ReceiptLongIcon,
	CardGiftcard as CardGiftcardIcon,
	ManageAccounts as ManageAccountsIcon,
	Redeem as RedeemIcon,
	AccountBalanceWallet as AccountBalanceWalletIcon,
	QueryStats as QueryStatsIcon,
	Insights as InsightsIcon,
} from "@mui/icons-material";
import { PRIVILEGES, PrivilegeCode } from "../../../constants/privileges-constants";

const EXPANDED_WIDTH = 300;
const COLLAPSED_WIDTH = 64;

interface NavigationGroup {
	id: string;
	label: string;
	icon: React.ReactElement;
	items: NavigationItem[];
}

interface NavigationItem {
	label: string;
	path: string;
	icon: React.ReactElement;
	requiredPrivileges?: PrivilegeCode[];
}

const AppCollapsibleSidebar = () => {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const theme = useTheme();
	const sidebarExpanded = useLayoutStore((state) => state.sidebarExpanded);
	const toggleSidebar = useLayoutStore((state) => state.toggleSidebar);
	const user = useAuthenticationStore((state) => state.user);
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
		chargeManagement: false,
		userManagement: false,
		providerManagement: false,
		partnerManagement: false,
		loyaltySystem: false,
		systemData: false,
	});

	const isRTL = i18n.language === 'ar';

	const drawerWidth = sidebarExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

	const getUserInitial = () => {
		if (!user?.name) return "U";
		return user.name.charAt(0).toUpperCase();
	};



	const navigationGroups: NavigationGroup[] = [
		{
			id: "chargeManagement",
			label: t("chargeManagement"),
			icon: <EvStationIcon />,
			items: [
				{ label: t("chargeManagement"), path: "/charge-management", icon: <EvStationIcon /> },
				{ label: t("stationStatistics"), path: "/station-statistics", icon: <QueryStatsIcon /> },
				{ label: t("stationsRequest"), path: "/stations-request", icon: <ListAltIcon /> },
				{ label: t("userComplaints"), path: "/complaints", icon: <ReportProblemIcon /> },
			],
		},
		{
			id: "userManagement",
			label: t("userManagement"),
			icon: <PeopleIcon />,
			items: [
				{ label: t("userAnalytics"), path: "/user-analytics", icon: <InsightsIcon /> },
				{ label: t("manageUsers"), path: "/users", icon: <PeopleIcon /> },
			],
		},
		{
			id: "providerManagement",
			label: t("providerManagement"),
			icon: <StoreIcon />,
			items: [
				{ label: t("serviceCategories"), path: "/service-categories", icon: <CategoryIcon /> },
				{ label: t("serviceProviders"), path: "/service-providers", icon: <StoreIcon /> },
				{ label: t("pendingOffers"), path: "/pending-offers", icon: <PendingActionsIcon /> },
				{ label: t("activeOffers"), path: "/active-offers", icon: <ActiveOfferIcon /> },
				{ label: t("offerTransactions"), path: "/transactions", icon: <ReceiptLongIcon /> },
				{ label: t("settlements"), path: "/settlements", icon: <AccountBalanceIcon /> },
			],
		},
		{
			id: "partnerManagement",
			label: t("partnerManagement"),
			icon: <HandshakeIcon />,
			items: [
				{ label: t("partners"), path: "/partners", icon: <HandshakeIcon /> },
			],
		},
		{
			id: "loyaltySystem",
			label: t("loyaltySystem"),
			icon: <CardGiftcardIcon />,
			items: [
				{ label: t("conversionRates"), path: "/conversion-rates", icon: <MonetizationOnIcon /> },
				{ label: t("loyaltyManagement"), path: "/loyalty-management", icon: <ManageAccountsIcon /> },
				{ label: t("redemptions"), path: "/redemptions", icon: <RedeemIcon /> },
				{ label: t("pointAdjustments"), path: "/point-adjustments", icon: <AccountBalanceWalletIcon /> },
			],
		},
		{
			id: "systemData",
			label: t("systemData"),
			icon: <SettingsIcon />,
			items: [
				{ label: t("carManagement"), path: "/car-management", icon: <SettingsIcon /> },
				{ label: t("banners"), path: "/banners", icon: <SettingsIcon /> },
				{ label: t("appVersions"), path: "/app-versions", icon: <SettingsIcon /> },
				{ label: t("emergencyServices"), path: "/emergency-services", icon: <LocalHospitalIcon /> },
				{ label: t("sendNotification"), path: "/send-notification", icon: <NotificationsActiveIcon /> },
			],
		},
	];

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
		return groupItems.some(item => location.pathname === item.path);
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

	const SIDEBAR_BG = "linear-gradient(180deg, #0d1f4e 0%, #0d3276 60%, #0a4a8f 100%)";
	const ACTIVE_BG = "rgba(255,255,255,0.18)";
	const HOVER_BG = "rgba(255,255,255,0.08)";
	const GROUP_ACTIVE_BG = "rgba(255,255,255,0.10)";

	const navItemSx = (isActive: boolean) => ({
		mx: 1,
		mb: 0.5,
		borderRadius: 2,
		color: "white",
		justifyContent: sidebarExpanded ? "initial" : "center",
		backgroundColor: isActive ? ACTIVE_BG : "transparent",
		borderLeft: isActive && !isRTL ? "3px solid rgba(255,255,255,0.8)" : "3px solid transparent",
		borderRight: isActive && isRTL ? "3px solid rgba(255,255,255,0.8)" : "3px solid transparent",
		"&:hover": { backgroundColor: isActive ? ACTIVE_BG : HOVER_BG },
		"& .MuiListItemIcon-root": { color: "rgba(255,255,255,0.9)" },
		"& .MuiListItemText-primary": {
			fontWeight: isActive ? 700 : 500,
			fontSize: "0.875rem",
			color: "white",
		},
		"&.Mui-selected": {
			backgroundColor: ACTIVE_BG,
			"&:hover": { backgroundColor: ACTIVE_BG },
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
					background: SIDEBAR_BG,
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
			{/* ── Header / user area ── */}
			{sidebarExpanded ? (
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						px: 2,
						py: 2,
						minHeight: 72,
						background: "rgba(0,0,0,0.15)",
						borderBottom: "1px solid rgba(255,255,255,0.10)",
					}}
				>
					<Box display="flex" alignItems="center" sx={{ minWidth: 0 }}>
						<Avatar
							sx={{
								width: 40,
								height: 40,
								background: "linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)",
								mr: 1.5,
								fontSize: "1.1rem",
								fontWeight: "bold",
								color: "white",
								boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
							}}
						>
							{user ? getUserInitial() : "?"}
						</Avatar>
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="subtitle2" noWrap fontWeight={700} sx={{ color: "white", lineHeight: 1.2 }}>
								{user?.email ?? t("guest")}
							</Typography>
							<Typography variant="caption" noWrap sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1 }}>
								{user?.name ?? ""}
							</Typography>
						</Box>
					</Box>
					<IconButton onClick={handleToggleExpanded} size="small" sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white", bgcolor: HOVER_BG } }}>
						{isRTL ? <ChevronRightIcon /> : <ChevronLeftIcon />}
					</IconButton>
				</Box>
			) : (
				<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 2, minHeight: 72, gap: 1, background: "rgba(0,0,0,0.15)", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
					<Avatar sx={{ width: 32, height: 32, background: "linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)", fontSize: "0.9rem", fontWeight: "bold", color: "white" }}>
						{user ? getUserInitial() : "?"}
					</Avatar>
					<IconButton onClick={handleToggleExpanded} size="small" sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white", bgcolor: HOVER_BG } }}>
						{isRTL ? <ChevronLeftIcon /> : <ChevronRightIcon />}
					</IconButton>
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
											color: "white",
											backgroundColor: groupActive && !groupOpen ? GROUP_ACTIVE_BG : "transparent",
											"&:hover": { backgroundColor: HOVER_BG },
											"& .MuiListItemIcon-root": { color: "rgba(255,255,255,0.75)" },
											"& .MuiListItemText-primary": { fontWeight: 600, fontSize: "0.875rem", color: "white" },
										}}
									>
										<ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: "center" }}>
											{group.icon}
										</ListItemIcon>
										<ListItemText primary={group.label} />
										{groupOpen
											? <ExpandLess sx={{ color: "rgba(255,255,255,0.6)" }} />
											: <ExpandMore sx={{ color: "rgba(255,255,255,0.6)" }} />}
									</ListItemButton>

									<Collapse in={groupOpen} timeout="auto" unmountOnExit>
										<List component="div" disablePadding>
											{group.items.map((item) => {
												const isActive = location.pathname === item.path;
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
															color: "white",
															backgroundColor: isActive ? ACTIVE_BG : "transparent",
															borderLeft: isActive && !isRTL ? "3px solid rgba(255,255,255,0.8)" : "3px solid transparent",
															borderRight: isActive && isRTL ? "3px solid rgba(255,255,255,0.8)" : "3px solid transparent",
															"&:hover": { backgroundColor: isActive ? ACTIVE_BG : HOVER_BG },
															"& .MuiListItemIcon-root": { color: isActive ? "white" : "rgba(255,255,255,0.6)" },
															"& .MuiListItemText-primary": { fontWeight: isActive ? 700 : 400, fontSize: "0.85rem", color: "white" },
															"&.Mui-selected": { backgroundColor: ACTIVE_BG, "&:hover": { backgroundColor: ACTIVE_BG } },
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
									selected={location.pathname === item.path}
									onClick={() => handleNavigate(item.path)}
									sx={navItemSx(location.pathname === item.path)}
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
								selected={location.pathname === item.path}
								onClick={() => handleNavigate(item.path)}
								sx={navItemSx(location.pathname === item.path)}
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
			<Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.10)" }}>
				{sidebarExpanded && (
					<>
						<Typography variant="caption" display="block" sx={{ color: "rgba(255,255,255,0.45)" }}>
							© {new Date().getFullYear()} {t("kmCamping")}
						</Typography>
						<Typography variant="caption" display="block" sx={{ color: "rgba(255,255,255,0.45)" }}>
							{t("version")}: {import.meta.env.VITE_APP_VERSION || "1.0.0"}
						</Typography>
					</>
				)}
			</Box>
		</Drawer>
	);
};

export default AppCollapsibleSidebar;