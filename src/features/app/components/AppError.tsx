import { Box, Typography, Button } from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";

interface AppErrorProps {
	error?: Error;
	resetErrorBoundary?: () => void;
}

const AppError = ({ error, resetErrorBoundary }: AppErrorProps) => {
	return (
		<Box
			display="flex"
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			height="100vh"
			p={4}
			textAlign="center"
		>
			<ErrorOutline color="error" sx={{ fontSize: 64, mb: 2 }} />
			<Typography variant="h4" gutterBottom>
				Oops! Something went wrong
			</Typography>
			<Typography variant="body1" color="text.secondary" mb={4}>
				{error?.message || "An unexpected error occurred"}
			</Typography>
			{resetErrorBoundary && (
				<Button variant="contained" onClick={resetErrorBoundary}>
					Try Again
				</Button>
			)}
		</Box>
	);
};

export default AppError;