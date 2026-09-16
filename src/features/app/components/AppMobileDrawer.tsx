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
	Collapse,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuthenticationStore } from "../../../stores";
import {
	Dashboard as DashboardIcon,
	ExpandLess,
	ExpandMore,
} from "@mui/icons-material";
import { PrivilegeCode } from "../../../constants/privileges-constants";
import { getNavigationGroups, NavigationGroup, NavigationItem } from "./navigation-config";

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

	const groups = getNavigationGroups(t);

	const hasPrivilege = (requiredPrivileges?: PrivilegeCode[]) => {
		if (!requiredPrivileges || requiredPrivileges.length === 0) return true;
		const userPrivileges = useAuthenticationStore.getState().privileges;
		return requiredPrivileges.some((privilege) => userPrivileges.includes(privilege));
	};

	const filterVisibleGroups = (list: NavigationGroup[]) =>
		list
			.map((group) => ({ ...group, items: group.items.filter((i) => hasPrivilege(i.requiredPrivileges)) }))
			.filter((group) => group.items.length > 0);

	const visibleGroups = filterVisibleGroups(groups);

	// Open the group that contains the current route by default.
	const initialOpen: Record<string, boolean> = {};
	for (const g of visibleGroups) {
		initialOpen[g.id] = g.items.some((i) => i.path === location.pathname);
	}
	const [expanded, setExpanded] = useState<Record<string, boolean>>(initialOpen);

	const toggleGroup = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

	const handleNavigate = (path: string) => {
		navigate(path);
		onClose();
	};

	const isItemActive = (item: NavigationItem) => location.pathname === item.path;

	const selectedItemSx = {
		mb: 0.5,
		borderRadius: 1.5,
		"&.Mui-selected": {
			backgroundColor: "primary.main",
			color: "primary.contrastText",
			"&:hover": { backgroundColor: "primary.dark" },
			"& .MuiListItemIcon-root": { color: "primary.contrastText" },
		},
	};

	return (
		<Drawer
			anchor="left"
			open={open}
			onClose={onClose}
			sx={{ "& .MuiDrawer-paper": { width: 280, boxSizing: "border-box" } }}
		>
			{/* Header */}
			<Box sx={{ p: 2 }}>
				<Box display="flex" alignItems="center">
					<Avatar
						sx={{
							width: 40,
							height: 40,
							background: "linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)",
							color: "white",
							mr: 1.5,
							fontSize: "1.1rem",
							fontWeight: "bold",
						}}
					>
						{user ? getUserInitial() : "?"}
					</Avatar>
					<Box sx={{ minWidth: 0 }}>
						<Typography variant="subtitle2" noWrap fontWeight={700} sx={{ lineHeight: 1.2 }}>
							{user?.email ?? t("guest")}
						</Typography>
						<Typography variant="caption" color="text.secondary" noWrap sx={{ lineHeight: 1 }}>
							{user?.name ?? ""}
						</Typography>
					</Box>
				</Box>
			</Box>

			<Divider />

			{/* Nav */}
			<Box sx={{ overflow: "auto", flexGrow: 1 }}>
				<List sx={{ px: 1 }}>
					{/* Dashboard */}
					<ListItemButton
						selected={location.pathname === "/"}
						onClick={() => handleNavigate("/")}
						sx={selectedItemSx}
					>
						<ListItemIcon sx={{ minWidth: 0, mr: 2, color: location.pathname === "/" ? "inherit" : "text.secondary" }}>
							<DashboardIcon />
						</ListItemIcon>
						<ListItemText primary={t("dashboard")} />
					</ListItemButton>

					{visibleGroups.map((group) => {
						const groupOpen = !!expanded[group.id];
						return (
							<Box key={group.id}>
								<ListItemButton onClick={() => toggleGroup(group.id)} sx={{ mb: 0.5, borderRadius: 1.5 }}>
									<ListItemIcon sx={{ minWidth: 0, mr: 2, color: "text.secondary" }}>
										{group.icon}
									</ListItemIcon>
									<ListItemText primary={group.label} primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }} />
									{groupOpen ? <ExpandLess sx={{ color: "text.secondary" }} /> : <ExpandMore sx={{ color: "text.secondary" }} />}
								</ListItemButton>

								<Collapse in={groupOpen} timeout="auto" unmountOnExit>
									<List component="div" disablePadding>
										{group.items.map((item) => {
											const active = isItemActive(item);
											return (
												<ListItemButton
													key={item.path}
													selected={active}
													onClick={() => handleNavigate(item.path)}
													sx={{ ...selectedItemSx, paddingInlineStart: 4 }}
												>
													<ListItemIcon sx={{ minWidth: 0, mr: 2, color: active ? "inherit" : "text.secondary" }}>
														{item.icon}
													</ListItemIcon>
													<ListItemText primary={item.label} primaryTypographyProps={{ fontSize: "0.875rem" }} />
												</ListItemButton>
											);
										})}
									</List>
								</Collapse>
							</Box>
						);
					})}
				</List>
			</Box>

			{/* Footer */}
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
