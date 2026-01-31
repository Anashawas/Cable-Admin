import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLayoutStore } from "../../../stores";

const Dashboard = () => {
	const { t } = useTranslation();
	const smallScreen = useLayoutStore((state) => state.smallScreen);

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100%",
				width: "100%",
				p: smallScreen ? 2 : 3
			}}
		>
			<Typography variant={smallScreen ? "h5" : "h4"} gutterBottom>
				{t("dashboard")}
			</Typography>
			<Typography variant="body1" color="text.secondary" textAlign="center">
				{t("welcome")}
			</Typography>
		</Box>
	);
};

export default Dashboard;