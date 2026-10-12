import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box, LinearProgress } from "@mui/material";
import { useLocation } from "react-router-dom";
import AppCollapsibleSidebar from "./AppCollapsibleSidebar";
import AppHeader from "./AppHeader";
import { GlobalSearch } from "../../../components";
import ContentFallback from "../../../components/ContentFallback";
import { useLayoutStore } from "../../../stores";
import { useScrollManager } from "../../../hooks/use-scroll-manager";
import { useRouteChunkLoading } from "../../../lib/lazy-route";

interface AppLayoutProps {
	children: React.ReactNode;
}

/** Thin bar under the header while the next screen's code is downloading.
 *  Delayed a little so instant (cached) navigations don't flash it. */
const RouteProgress = () => {
	const loading = useRouteChunkLoading();
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		if (!loading) {
			setVisible(false);
			return;
		}
		const id = window.setTimeout(() => setVisible(true), 120);
		return () => window.clearTimeout(id);
	}, [loading]);
	return (
		<Box sx={{ position: "relative", height: 0, zIndex: 3 }} aria-hidden={!visible}>
			{visible && <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3 }} />}
		</Box>
	);
};

const prefersReducedMotion = () =>
	typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const AppLayout = ({ children }: AppLayoutProps) => {
	const sidebarExpanded = useLayoutStore((state) => state.sidebarExpanded);
	const smallScreen = useLayoutStore((state) => state.smallScreen);
	const sidebarWidth = sidebarExpanded ? 280 : 64;
	const location = useLocation();
	const contentRef = useRef<HTMLDivElement>(null);
	const fadeRef = useRef<HTMLDivElement>(null);
	const firstPathRef = useRef(true);

	useScrollManager(contentRef);

	// Subtle fade-in of the content when the screen (pathname) changes.
	useLayoutEffect(() => {
		if (firstPathRef.current) {
			firstPathRef.current = false;
			return;
		}
		const el = fadeRef.current;
		if (!el || typeof el.animate !== "function" || prefersReducedMotion()) return;
		const anim = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" });
		return () => anim.cancel();
	}, [location.pathname]);

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
				<RouteProgress />
				<Box ref={contentRef} sx={{ flexGrow: 1, p: smallScreen ? 2 : 3, minWidth: 0, overflow: "auto" }}>
					<Box ref={fadeRef} sx={{ height: "100%", minWidth: 0 }}>
						<Suspense fallback={<ContentFallback />}>{children}</Suspense>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default AppLayout;
