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
	EventNote as ReservationsIcon,
	MonetizationOn as RefundsIcon,
	People as UsersIcon,
	Security as RolesIcon,
	ChevronLeft as ChevronLeftIcon,
	ChevronRight as ChevronRightIcon,
	ExpandLess,
	ExpandMore,
	Business as BusinessIcon,
	AdminPanelSettings as AdminIcon,
	CalendarToday as CampingSeasonsIcon,
	Tune as ConfigurationsIcon,
	Map as MapIcon,
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
	const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
		business: false,
		dataEntry: false,
	});

	const isRTL = i18n.language === 'ar';

	const drawerWidth = sidebarExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

	const getUserInitial = () => {
		if (!user?.name) return "U";
		return user.name.charAt(0).toUpperCase();
	};



	const navigationGroups: NavigationGroup[] = [
		{
			id: "business",
			label: t("businessModule"),
			icon: <BusinessIcon />,
			items: [
				{
					label: t("reservations"),
					path: "/reservations",
					icon: <ReservationsIcon />,
					requiredPrivileges: [PRIVILEGES.VIEW_RESERVATIONS, PRIVILEGES.VIEW_RESERVATIONS_GOVERNORATE],
				},
				{
					label: t("refunds"),
					path: "/refunds",
					icon: <RefundsIcon />,
					requiredPrivileges: [PRIVILEGES.VIEW_REFUNDS, PRIVILEGES.VIEW_REFUNDS_GOVERNORATE],
				},
			],
		},
		{
			id: "dataEntry",
			label: t("dataEntryModule"),
			icon: <AdminIcon />,
			items: [
				{
					label: t("users"),
					path: "/users",
					icon: <UsersIcon />,
					requiredPrivileges: [PRIVILEGES.VIEW_USERS],
				},
				{
					label: t("campingSeasons"),
					path: "/camping-seasons",
					icon: <CampingSeasonsIcon />,
					requiredPrivileges: [PRIVILEGES.VIEW_CAMPING_SEASONS],
				},
				{
					label: t("campingAreas"),
					path: "/camping-areas",
					icon: <MapIcon />,
					requiredPrivileges: [PRIVILEGES.MANAGE_SYSTEM_CONFIGURATIONS],
				},
				{
					label: t("roles"),
					path: "/roles",
					icon: <RolesIcon />,
					requiredPrivileges: [PRIVILEGES.VIEW_ROLES],
				},
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
				business: false,
				dataEntry: false,
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
					borderRight: `1px solid ${theme.palette.divider}`,
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
			{sidebarExpanded ? (
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						px: 2,
						py: 2,
						minHeight: 72,
					}}
				>
					{user ? (
						<Box display="flex" alignItems="center">
							<Avatar
								sx={{
									width: 40,
									height: 40,
									bgcolor: "primary.main",
									mr: 1.5,
									fontSize: "1.1rem",
									fontWeight: "bold",
								}}
							>
								{getUserInitial()}
							</Avatar>
							<Box sx={{ minWidth: 0 }}>
								<Typography variant="subtitle1" noWrap fontWeight="bold" sx={{ lineHeight: 1.2 }}>
									{user.username}
								</Typography>
								<Typography variant="caption" color="text.secondary" noWrap sx={{ lineHeight: 1 }}>
									{user.name}
								</Typography>
							</Box>
						</Box>
					) : (
						<Box display="flex" alignItems="center">
							<Avatar
								sx={{
									width: 40,
									height: 40,
									bgcolor: "grey.400",
									mr: 1.5,
								}}
							>
								<Typography variant="h6" color="white">
									?
								</Typography>
							</Avatar>
							<Box>
								<Typography variant="subtitle1" noWrap color="text.secondary">
									{t("guest")}
								</Typography>
							</Box>
						</Box>
					)}
					<IconButton onClick={handleToggleExpanded} size="small">
						{isRTL ? <ChevronRightIcon /> : <ChevronLeftIcon />}
					</IconButton>
				</Box>
			) : (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						py: 2,
						minHeight: 72,
						gap: 1,
					}}
				>
					<Avatar
						sx={{
							width: 32,
							height: 32,
							bgcolor: user ? "primary.main" : "grey.400",
							fontSize: "0.9rem",
							fontWeight: "bold",
						}}
					>
						{user ? getUserInitial() : "?"}
					</Avatar>
					<IconButton onClick={handleToggleExpanded} size="small">
						{isRTL ? <ChevronLeftIcon /> : <ChevronRightIcon />}
					</IconButton>
				</Box>
			)}

			<Divider />

			<Box sx={{ overflow: "auto", flexGrow: 1 }}>
				<List>
					{/* Dashboard - always first */}
					<Tooltip title={!sidebarExpanded ? t("dashboard") : ""} placement="right" arrow>
						<ListItemButton
							selected={location.pathname === "/"}
							onClick={() => handleNavigate("/")}
							sx={{
								mx: 1,
								mb: 0.5,
								borderRadius: 1,
								justifyContent: sidebarExpanded ? "initial" : "center",
								"&.Mui-selected": {
									backgroundColor: theme.palette.primary.main,
									color: theme.palette.primary.contrastText,
									"&:hover": {
										backgroundColor: theme.palette.primary.dark,
									},
									"& .MuiListItemIcon-root": {
										color: theme.palette.primary.contrastText,
									},
								},
							}}
						>
							<ListItemIcon
								sx={{
									minWidth: 0,
									mr: sidebarExpanded ? 3 : "auto",
									justifyContent: "center",
									color: location.pathname === "/"
										? theme.palette.primary.contrastText
										: theme.palette.text.secondary,
								}}
							>
								<DashboardIcon />
							</ListItemIcon>
							{sidebarExpanded && <ListItemText primary={t("dashboard")} />}
						</ListItemButton>
					</Tooltip>

					{sidebarExpanded ? (
						filterVisibleGroups(navigationGroups).map((group) => (
							<Box key={group.id}>
								<ListItemButton
									onClick={() => handleToggleGroup(group.id)}
									sx={{
										mx: 1,
										mb: 0.5,
										borderRadius: 1,
										justifyContent: sidebarExpanded ? "initial" : "center",
										backgroundColor: isPathInGroup(group.items)
											? theme.palette.action.selected
											: "transparent",
									}}
								>
									<ListItemIcon
										sx={{
											minWidth: 0,
											mr: sidebarExpanded ? 3 : "auto",
											justifyContent: "center",
										}}
									>
										{group.icon}
									</ListItemIcon>
									{sidebarExpanded && (
										<>
											<ListItemText primary={group.label} />
											{expandedGroups[group.id] ? <ExpandLess /> : <ExpandMore />}
										</>
									)}
								</ListItemButton>

								{sidebarExpanded && (
									<Collapse in={expandedGroups[group.id]} timeout="auto" unmountOnExit>
										<List component="div" disablePadding>
											{group.items.map((item) => (
												<ListItemButton
													key={item.path}
													selected={location.pathname === item.path}
													onClick={() => handleNavigate(item.path)}
													sx={{
														pl: 4,
														mx: 1,
														mb: 0.5,
														borderRadius: 1,
														"&.Mui-selected": {
															backgroundColor: theme.palette.primary.main,
															color: theme.palette.primary.contrastText,
															"&:hover": {
																backgroundColor: theme.palette.primary.dark,
															},
															"& .MuiListItemIcon-root": {
																color: theme.palette.primary.contrastText,
															},
														},
													}}
												>
													<ListItemIcon
														sx={{
															minWidth: 0,
															mr: 3,
															color: location.pathname === item.path
																? theme.palette.primary.contrastText
																: theme.palette.text.secondary,
														}}
													>
														{item.icon}
													</ListItemIcon>
													<ListItemText primary={item.label} />
												</ListItemButton>
											))}
										</List>
									</Collapse>
								)}
							</Box>
						))
					) : (
						filterVisibleGroups(navigationGroups).flatMap(group => group.items).map((item) => (
							<Tooltip key={item.path} title={item.label} placement="right" arrow>
								<ListItemButton
									selected={location.pathname === item.path}
									onClick={() => handleNavigate(item.path)}
									sx={{
										mx: 1,
										mb: 0.5,
										borderRadius: 1,
										justifyContent: "center",
										"&.Mui-selected": {
											backgroundColor: theme.palette.primary.main,
											color: theme.palette.primary.contrastText,
											"&:hover": {
												backgroundColor: theme.palette.primary.dark,
											},
											"& .MuiListItemIcon-root": {
												color: theme.palette.primary.contrastText,
											},
										},
									}}
								>
									<ListItemIcon
										sx={{
											minWidth: 0,
											mr: "auto",
											justifyContent: "center",
											color: location.pathname === item.path
												? theme.palette.primary.contrastText
												: theme.palette.text.secondary,
										}}
									>
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
								sx={{
									mx: 1,
									mb: 0.5,
									borderRadius: 1,
									justifyContent: sidebarExpanded ? "initial" : "center",
									"&.Mui-selected": {
										backgroundColor: theme.palette.primary.main,
										color: theme.palette.primary.contrastText,
										"&:hover": {
											backgroundColor: theme.palette.primary.dark,
										},
										"& .MuiListItemIcon-root": {
											color: theme.palette.primary.contrastText,
										},
									},
								}}
							>
								<ListItemIcon
									sx={{
										minWidth: 0,
										mr: sidebarExpanded ? 3 : "auto",
										justifyContent: "center",
										color: location.pathname === item.path
											? theme.palette.primary.contrastText
											: theme.palette.text.secondary,
									}}
								>
									{item.icon}
								</ListItemIcon>
								{sidebarExpanded && <ListItemText primary={item.label} />}
							</ListItemButton>
						</Tooltip>
					))}
				</List>
			</Box>

			<Box sx={{ mt: "auto", p: 2 }}>
				<Divider sx={{ mb: 2 }} />
				{sidebarExpanded && (
					<>
						<Typography variant="caption" color="text.secondary" display="block">
							© {new Date().getFullYear()} {t("kmCamping")}
						</Typography>
						<Typography variant="caption" color="text.secondary" display="block">
							{t("version")}: {import.meta.env.VITE_APP_VERSION || "1.0.0"}
						</Typography>
					</>
				)}
			</Box>

		</Drawer>
	);
};

export default AppCollapsibleSidebar;