import { Paper, Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLayoutStore } from "../../../stores";

const AppSearchPanel = () => {
	const { t } = useTranslation('search');
	const smallScreen = useLayoutStore((state) => state.smallScreen);

	if (smallScreen) {
		return (
			<Paper
				elevation={4}
				sx={{
					position: "fixed",
					bottom: 0,
					left: 0,
					right: 0,
					height: 300,
					borderRadius: "16px 16px 0 0",
					zIndex: 1200,
					overflow: "hidden",
				}}
			>
				<Box p={3}>
					<Typography variant="h6" gutterBottom>
						{t('searchPanel')}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{t('simplifiedFloatingPanel')}
						{t('searchFunctionalityRemoved')}
					</Typography>
				</Box>
			</Paper>
		);
	}

	return (
		<Paper
			elevation={4}
			sx={{
				position: "fixed",
				top: 80,
				left: 16,
				width: 450,
				height: "calc(100vh - 96px)",
				zIndex: 1200,
				overflow: "hidden",
			}}
		>
			<Box p={3}>
				<Typography variant="h6" gutterBottom>
					{t('searchPanel')}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{t('simplifiedSidePanel')}
					{t('searchFunctionalityRemoved')}
				</Typography>
			</Box>
		</Paper>
	);
};

export default AppSearchPanel;