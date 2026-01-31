import { Box, Typography, CircularProgress, useTheme, Button, Alert } from "@mui/material";
import { OpenInNew as OpenInNewIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import AppScreenContainer from "../../app/components/AppScreenContainer";

const CampingAreasScreen = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [key, setKey] = useState(0);

	const gisUrl = window.env?.campingAreas?.gisUrl || "https://gis.openware.com.kw/portal/apps/experiencebuilder/experience/?id=8fe75a3b702f4a589df5121ab42be779";

	useEffect(() => {
		// Set a timeout to detect if iframe fails to load
		const timer = setTimeout(() => {
			if (isLoading) {
				setIsLoading(false);
				setHasError(true);
			}
		}, 15000); // 15 seconds timeout

		return () => clearTimeout(timer);
	}, [isLoading, key]);

	const handleIframeLoad = () => {
		setIsLoading(false);
		setHasError(false);
	};

	const handleIframeError = () => {
		setIsLoading(false);
		setHasError(true);
	};

	const handleOpenInNewTab = () => {
		window.open(gisUrl, "_blank", "noopener,noreferrer");
	};

	const handleRefresh = () => {
		setIsLoading(true);
		setHasError(false);
		setKey(prev => prev + 1);
	};

	return (
		<AppScreenContainer>
			<Box
				sx={{
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					position: "relative",
				}}
			>
				{/* Header */}
				<Box
					sx={{
						p: 2,
						borderBottom: `1px solid ${theme.palette.divider}`,
						backgroundColor: theme.palette.background.paper,
					}}
				>
					<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
						<Box>
							<Typography variant="h5" component="h1" fontWeight="bold">
								{t("campingAreas@campingAreasManagement")}
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
								{t("campingAreas@drawCampingAreas")}
							</Typography>
						</Box>
						<Box sx={{ display: "flex", gap: 1 }}>
							<Button
								variant="outlined"
								size="small"
								startIcon={<RefreshIcon />}
								onClick={handleRefresh}
								disabled={isLoading}
							>
								{t("refresh")}
							</Button>
							<Button
								variant="outlined"
								size="small"
								startIcon={<OpenInNewIcon />}
								onClick={handleOpenInNewTab}
							>
								{t("campingAreas@openInNewTab")}
							</Button>
						</Box>
					</Box>
					{hasError && (
						<Alert severity="warning" sx={{ mt: 2 }}>
							{t("campingAreas@iframeBlockedWarning")}
						</Alert>
					)}
				</Box>

				{/* Loading Indicator */}
				{isLoading && !hasError && (
					<Box
						sx={{
							position: "absolute",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							zIndex: 10,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: 2,
						}}
					>
						<CircularProgress size={48} />
						<Typography variant="body2" color="text.secondary">
							{t("campingAreas@loadingMap")}
						</Typography>
					</Box>
				)}

				{/* GIS Iframe */}
				<Box
					sx={{
						flex: 1,
						position: "relative",
						overflow: "hidden",
					}}
				>
					<iframe
						key={key}
						src={gisUrl}
						title={t("campingAreas@gisMapTool")}
						style={{
							width: "100%",
							height: "100%",
							border: "none",
							display: "block",
						}}
						onLoad={handleIframeLoad}
						onError={handleIframeError}
						allow="geolocation"
					/>
				</Box>
			</Box>
		</AppScreenContainer>
	);
};

export default CampingAreasScreen;
