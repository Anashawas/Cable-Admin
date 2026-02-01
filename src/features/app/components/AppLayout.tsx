import { Box } from "@mui/material";
import AppCollapsibleSidebar from "./AppCollapsibleSidebar";
import AppHeader from "./AppHeader";
import { GlobalSearch } from "../../../components";
import { useLayoutStore } from "../../../stores";

interface AppLayoutProps {
	children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
	const sidebarExpanded = useLayoutStore((state) => state.sidebarExpanded);
	const smallScreen = useLayoutStore((state) => state.smallScreen);
	const sidebarWidth = sidebarExpanded ? 280 : 64;

	return (
		<Box sx={{ display: "flex", height: "100vh", m: 0, p: 0, overflow: "hidden" }}>
			<GlobalSearch />
			{!smallScreen && <AppCollapsibleSidebar />}
			<Box
				component="main"
				sx={{
					flexGrow: 1,
					bgcolor: "background.default",
					display: "flex",
					flexDirection: "column",
					ml: smallScreen ? 0 : `${sidebarWidth}px`,
					width: smallScreen ? "100%" : `calc(100% - ${sidebarWidth}px)`,
					maxWidth: smallScreen ? "100%" : `calc(100% - ${sidebarWidth}px)`,
					minWidth: 0,
					overflow: "hidden",
					m: 0,
					p: 0,
				}}
			>
				<AppHeader />
				<Box sx={{ flexGrow: 1, p: smallScreen ? 2 : 3, minWidth: 0, overflow: "auto" }}>
					{children}
				</Box>
			</Box>
		</Box>
	);
};

export default AppLayout;