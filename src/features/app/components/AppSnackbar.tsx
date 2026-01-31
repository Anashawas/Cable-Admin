import { Snackbar, Alert } from "@mui/material";
import { useSnackbarStore } from "../../../stores";

const AppSnackbar = () => {
	const { message, open, severity, closeSnackbar } = useSnackbarStore();

	return (
		<Snackbar
			open={open}
			autoHideDuration={6000}
			onClose={closeSnackbar}
			anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
			sx={{ zIndex: 10003 }}
		>
			<Alert
				onClose={closeSnackbar}
				severity={severity}
				variant="filled"
				sx={{ width: '100%' }}
			>
				{message}
			</Alert>
		</Snackbar>
	);
};

export default AppSnackbar;