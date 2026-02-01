import { useTranslation } from "react-i18next";
import {
	Grid,
	TextField,
	Typography,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import type { ValidationError } from "../validators/login";
import {
	Key as KeyIcon,
} from "@mui/icons-material";

interface LoginFormProps {
	emailInput: {
		value: string;
		ref: React.RefObject<HTMLInputElement | null>;
		onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	};
	passwordInput: {
		value: string;
		ref: React.RefObject<HTMLInputElement | null>;
		onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	};
	onSubmit: (e: React.FormEvent) => void;
	loginValidationResults: ValidationError[];
	loginLoading: boolean;
}

const LoginForm = ({
	emailInput,
	passwordInput,
	onSubmit,
	loginValidationResults,
	loginLoading
}: LoginFormProps) => {
	const { t } = useTranslation();

	return (
		<Grid
			sx={(theme) => ({
				pt: theme.spacing(3),
				pr: theme.spacing(3),
				pb: theme.spacing(3),
				pl: theme.spacing(3)
			})}
			container
			direction="column"
			spacing={2}
			component="form"
			onSubmit={onSubmit}
		>
			<Grid>
				<Typography variant="h5" fontWeight="bold" gutterBottom>
					{t('login')}
				</Typography>
				<Typography variant="body2" color="textSecondary" gutterBottom>
					{t('loginInstructions')}
				</Typography>
			</Grid>
			<Grid>
				<TextField
					inputRef={emailInput.ref}
					fullWidth
					margin="dense"
					type="email"
					autoComplete="email"
					label={t('email')}
					placeholder={t('enterEmail')}
					InputLabelProps={{ shrink: true }}
					value={emailInput.value}
					onChange={emailInput.onChange}
					error={!!loginValidationResults?.find((r) => r.email)}
					helperText={loginValidationResults?.find((r) => r.email)?.email ? t(loginValidationResults?.find((r) => r.email)?.email || '') : ''}
				/>
			</Grid>
			<Grid>
				<TextField
					inputRef={passwordInput.ref}
					fullWidth
					margin="dense"
					type="password"
					autoComplete="current-password"
					label={t('password')}
					placeholder={t('enterPassword')}
					InputLabelProps={{ shrink: true }}
					value={passwordInput.value}
					onChange={passwordInput.onChange}
					error={!!loginValidationResults?.find((r) => r.password)}
					helperText={loginValidationResults?.find((r) => r.password)?.password ? t(loginValidationResults?.find((r) => r.password)?.password || '') : ''}
				/>
			</Grid>
			<Grid>
				<LoadingButton
					fullWidth
					variant="contained"
					size="large"
					type="submit"
					loading={loginLoading}
					loadingPosition="end"
					endIcon={<KeyIcon />}
					onClick={onSubmit}
				>
					{t('login')}
				</LoadingButton>
			</Grid>
		</Grid>
	);
};

export default LoginForm;