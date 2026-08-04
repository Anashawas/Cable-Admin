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
	Tooltip,
	alpha,
	Stack,
	Chip
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
	Block as BlockIcon,
	Share as ShareIcon,
	PersonAddAlt1 as PersonAddAlt1Icon,
	Bolt as BoltIcon,
	EmojiEvents as EmojiEventsIcon,
	Gavel as GavelIcon,
	Campaign as CampaignIcon,
	Image as ImageIcon,
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
				{ label: t("chargerBrands"), path: "/charger-brands", icon: <BoltIcon /> },
				{ label: t("stationStatistics"), path: "/station-statistics", icon: <QueryStatsIcon /> },
				{ label: t("stationsRequest"), path: "/stations-request", icon: <ListAltIcon /> },
				{ label: t("userComplaints"), path: "/complaints", icon: <ReportProblemIcon /> },
				{ label: t("nearestPreview"), path: "/nearest-preview", icon: <QueryStatsIcon /> },
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
				{ label: t("offersManagement"), path: "/offers", icon: <LocalOfferIcon /> },
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
				{ label: t("addNewPartner"), path: "/add-partner", icon: <PersonAddAlt1Icon /> },
			],
		},
		{
			id: "loyaltySystem",
			label: t("loyaltySystem"),
			icon: <CardGiftcardIcon />,
			items: [
				{ label: t("loyaltyDashboard"), path: "/loyalty-dashboard", icon: <AccountBalanceIcon /> },
				{ label: t("conversionRates"), path: "/conversion-rates", icon: <MonetizationOnIcon /> },
				{ label: t("loyaltyManagement"), path: "/loyalty-management", icon: <ManageAccountsIcon /> },
				{ label: t("leaderboard"), path: "/loyalty-leaderboard", icon: <EmojiEventsIcon /> },
				{ label: t("redemptions"), path: "/redemptions", icon: <RedeemIcon /> },
				{ label: t("pointAdjustments"), path: "/point-adjustments", icon: <AccountBalanceWalletIcon /> },
				{ label: t("pointsLedger"), path: "/loyalty-ledger", icon: <ReceiptLongIcon /> },
				{ label: t("bulkAward"), path: "/loyalty-bulk-award", icon: <CardGiftcardIcon /> },
				{ label: t("flaggedActivity"), path: "/loyalty-flagged", icon: <ReportProblemIcon /> },
				{ label: t("blockUsers"), path: "/block-users", icon: <BlockIcon /> },
			],
		},
		{
			id: "ads",
			label: t("ads"),
			icon: <CampaignIcon />,
			items: [
				{ label: t("banners"), path: "/banners", icon: <CampaignIcon /> },
				{ label: t("welcomeMessages"), path: "/welcome-messages", icon: <NotificationsActiveIcon /> },
				{ label: t("stationAdImages"), path: "/view-image-review", icon: <ImageIcon /> },
				{ label: t("campaigns"), path: "/campaigns", icon: <InsightsIcon /> },
			],
		},
		{
			id: "systemData",
			label: t("systemData"),
			icon: <SettingsIcon />,
			items: [
				{ label: t("carManagement"), path: "/car-management", icon: <SettingsIcon /> },
				{ label: t("socialMediaPlatforms"), path: "/social-media-platforms", icon: <ShareIcon /> },
				{ label: t("appVersions"), path: "/app-versions", icon: <SettingsIcon /> },
				{ label: t("emergencyServices"), path: "/emergency-services", icon: <LocalHospitalIcon /> },
				{ label: t("sendNotification"), path: "/send-notification", icon: <NotificationsActiveIcon /> },
				{ label: t("notificationTemplates"), path: "/notification-templates", icon: <NotificationsActiveIcon /> },
				{ label: t("generateReceipt"), path: "/receipts", icon: <ReceiptLongIcon /> },
				{ label: t("termsConditions"), path: "/terms-conditions", icon: <GavelIcon /> },
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
		return groupItems.some(
			item =>
				location.pathname === item.path ||
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

	// Light sidebar: white surface, brand color reserved for the active item.
	const SIDEBAR_BG = theme.palette.background.paper;
	const ACTIVE_BG = alpha(theme.palette.primary.main, 0.12);
	const HOVER_BG = theme.palette.action.hover;
	const GROUP_ACTIVE_BG = alpha(theme.palette.primary.main, 0.06);

	const navItemSx = (isActive: boolean) => ({
		mx: 1,
		mb: 0.5,
		borderRadius: 2,
		color: "text.primary",
		justifyContent: sidebarExpanded ? "initial" : "center",
		backgroundColor: isActive ? ACTIVE_BG : "transparent",
		borderLeft: isActive && !isRTL ? `3px solid ${theme.palette.primary.main}` : "3px solid transparent",
		borderRight: isActive && isRTL ? `3px solid ${theme.palette.primary.main}` : "3px solid transparent",
		"&:hover": { backgroundColor: isActive ? ACTIVE_BG : HOVER_BG },
		"& .MuiListItemIcon-root": { color: isActive ? theme.palette.primary.main : theme.palette.text.secondary },
		"& .MuiListItemText-primary": {
			fontWeight: isActive ? 700 : 500,
			fontSize: "0.875rem",
			color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
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
					borderInlineEnd: `1px solid ${theme.palette.divider}`,
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
						borderBottom: `1px solid ${theme.palette.divider}`,
					}}
				>
					<Box display="flex" alignItems="center" sx={{ minWidth: 0 }}>
						<Avatar
							sx={{
								width: 40,
								height: 40,
								background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
								mr: 1.5,
								fontSize: "1.1rem",
								fontWeight: "bold",
								color: "white",
								boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
							}}
						>
							{user ? getUserInitial() : "?"}
						</Avatar>
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="subtitle2" noWrap fontWeight={700} sx={{ color: "text.primary", lineHeight: 1.2 }}>
								{user?.email ?? t("guest")}
							</Typography>
							<Typography variant="caption" noWrap sx={{ color: "text.secondary", lineHeight: 1 }}>
								{user?.name ?? ""}
							</Typography>
						</Box>
					</Box>
					<IconButton onClick={handleToggleExpanded} size="small" sx={{ color: "text.secondary", "&:hover": { color: "text.primary", bgcolor: HOVER_BG } }}>
						{isRTL ? <ChevronRightIcon /> : <ChevronLeftIcon />}
					</IconButton>
				</Box>
			) : (
				<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 2, minHeight: 72, gap: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
					<Avatar sx={{ width: 32, height: 32, background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`, fontSize: "0.9rem", fontWeight: "bold", color: "white" }}>
						{user ? getUserInitial() : "?"}
					</Avatar>
					<IconButton onClick={handleToggleExpanded} size="small" sx={{ color: "text.secondary", "&:hover": { color: "text.primary", bgcolor: HOVER_BG } }}>
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
											color: "text.primary",
											backgroundColor: groupActive && !groupOpen ? GROUP_ACTIVE_BG : "transparent",
											"&:hover": { backgroundColor: HOVER_BG },
											"& .MuiListItemIcon-root": { color: groupActive ? theme.palette.primary.main : theme.palette.text.secondary },
											"& .MuiListItemText-primary": { fontWeight: 600, fontSize: "0.875rem", color: groupActive ? theme.palette.primary.main : theme.palette.text.primary },
										}}
									>
										<ListItemIcon sx={{ minWidth: 0, mr: 2, justifyContent: "center" }}>
											{group.icon}
										</ListItemIcon>
										<ListItemText primary={group.label} />
										{groupOpen
											? <ExpandLess sx={{ color: "text.disabled" }} />
											: <ExpandMore sx={{ color: "text.disabled" }} />}
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
															color: "text.primary",
															backgroundColor: isActive ? ACTIVE_BG : "transparent",
															borderLeft: isActive && !isRTL ? `3px solid ${theme.palette.primary.main}` : "3px solid transparent",
															borderRight: isActive && isRTL ? `3px solid ${theme.palette.primary.main}` : "3px solid transparent",
															"&:hover": { backgroundColor: isActive ? ACTIVE_BG : HOVER_BG },
															"& .MuiListItemIcon-root": { color: isActive ? theme.palette.primary.main : theme.palette.text.secondary },
															"& .MuiListItemText-primary": { fontWeight: isActive ? 700 : 400, fontSize: "0.85rem", color: isActive ? theme.palette.primary.main : theme.palette.text.primary },
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
			<Box sx={{ px: sidebarExpanded ? 2 : 1, py: 1.25, borderTop: `1px solid ${theme.palette.divider}` }}>
				{sidebarExpanded ? (
					<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
						<Typography variant="caption" noWrap sx={{ color: "text.disabled" }}>
							© {new Date().getFullYear()} {t("app@appTitle")}
						</Typography>
						<Chip
							label={`v${import.meta.env.VITE_APP_VERSION || "1.0.0"}`}
							size="small"
							variant="outlined"
							sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, color: "text.disabled", borderColor: "divider", flexShrink: 0 }}
						/>
					</Stack>
				) : (
					<Typography variant="caption" align="center" display="block" sx={{ color: "text.disabled", fontSize: "0.6rem" }}>
						v{import.meta.env.VITE_APP_VERSION || "1.0.0"}
					</Typography>
				)}
			</Box>
		</Drawer>
	);
};

export default AppCollapsibleSidebar;