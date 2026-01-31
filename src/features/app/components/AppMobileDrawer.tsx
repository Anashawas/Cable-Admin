import {
	Drawer,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Box,
	Typography,
	Divider,
	Avatar,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthenticationStore } from "../../../stores";
import {
	Dashboard as DashboardIcon,
	EventNote as ReservationsIcon,
	MonetizationOn as RefundsIcon,
	People as UsersIcon,
	Security as RolesIcon,
	CalendarToday as CampingSeasonsIcon,
	Tune as ConfigurationsIcon,
} from "@mui/icons-material";
import { PRIVILEGES, PrivilegeCode } from "../../../constants/privileges-constants";

interface AppMobileDrawerProps {
	open: boolean;
	onClose: () => void;
}

const AppMobileDrawer = ({ open, onClose }: AppMobileDrawerProps) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const user = useAuthenticationStore((state) => state.user);

	const getUserInitial = () => {
		if (!user?.name) return "U";
		return user.name.charAt(0).toUpperCase();
	};

	const getUserRole = () => {
		if (!user?.privileges || user.privileges.length === 0) return t("user");
		return user.privileges[0].charAt(0).toUpperCase() + user.privileges[0].slice(1);
	};

	interface NavigationItem {
		label: string;
		path: string;
		icon: React.ReactElement;
		requiredPrivileges?: PrivilegeCode[];
	}

	const navigationItems: NavigationItem[] = [
		{
			label: t("dashboard"),
			path: "/",
			icon: <DashboardIcon />,
		},
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
			label: t("campingConfigurations"),
			path: "/camping-configurations",
			icon: <ConfigurationsIcon />,
			requiredPrivileges: [PRIVILEGES.VIEW_SYSTEM_CONFIGURATIONS],
		},
		{
			label: t("roles"),
			path: "/roles",
			icon: <RolesIcon />,
			requiredPrivileges: [PRIVILEGES.VIEW_ROLES],
		},
	];

	const hasPrivilege = (requiredPrivileges?: PrivilegeCode[]) => {
		if (!requiredPrivileges || requiredPrivileges.length === 0) return true;
		const userPrivileges = useAuthenticationStore.getState().privileges;
		return requiredPrivileges.some(privilege => userPrivileges.includes(privilege));
	};

	const visibleNavigationItems = navigationItems.filter(item => hasPrivilege(item.requiredPrivileges));

	const handleNavigate = (path: string) => {
		navigate(path);
		onClose();
	};

	return (
		<Drawer
			anchor="left"
			open={open}
			onClose={onClose}
			sx={{
				"& .MuiDrawer-paper": {
					width: 280,
					boxSizing: "border-box",
				},
			}}
		>
			<Box sx={{ p: 2 }}>
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
								{user.name}
							</Typography>
							<Typography variant="caption" color="text.secondary" noWrap sx={{ lineHeight: 1 }}>
								{getUserRole()}
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
			</Box>

			<Divider />

			<List sx={{ px: 1 }}>
				{visibleNavigationItems.map((item) => (
					<ListItemButton
						key={item.path}
						selected={location.pathname === item.path}
						onClick={() => handleNavigate(item.path)}
						sx={{
							mb: 0.5,
							borderRadius: 1,
							"&.Mui-selected": {
								backgroundColor: "primary.main",
								color: "primary.contrastText",
								"&:hover": {
									backgroundColor: "primary.dark",
								},
								"& .MuiListItemIcon-root": {
									color: "primary.contrastText",
								},
							},
						}}
					>
						<ListItemIcon
							sx={{
								minWidth: 0,
								mr: 2,
								color: location.pathname === item.path
									? "inherit"
									: "text.secondary",
							}}
						>
							{item.icon}
						</ListItemIcon>
						<ListItemText primary={item.label} />
					</ListItemButton>
				))}
			</List>

			<Box sx={{ mt: "auto", p: 2 }}>
				<Divider sx={{ mb: 2 }} />
				<Typography variant="caption" color="text.secondary" display="block">
					© {new Date().getFullYear()} {t("kmCamping")}
				</Typography>
				<Typography variant="caption" color="text.secondary" display="block">
					{t("version")}: {import.meta.env.VITE_APP_VERSION || "1.0.0"}
				</Typography>
			</Box>
		</Drawer>
	);
};

export default AppMobileDrawer;