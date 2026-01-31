import { Box, Typography, Button } from "@mui/material";
import { Home as HomeIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
	const navigate = useNavigate();

	return (
		<Box
			display="flex"
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			height="100vh"
			textAlign="center"
			p={4}
		>
			<Typography variant="h1" color="primary" fontWeight="bold">
				404
			</Typography>
			<Typography variant="h4" gutterBottom>
				Page Not Found
			</Typography>
			<Typography variant="body1" color="text.secondary" mb={4}>
				The page you're looking for doesn't exist.
			</Typography>
			<Button
				variant="contained"
				startIcon={<HomeIcon />}
				onClick={() => navigate("/")}
			>
				Go Home
			</Button>
		</Box>
	);
};

export default NotFound;