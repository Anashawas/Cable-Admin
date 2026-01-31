interface LoginData {
	username: string;
	password: string;
}

export interface ValidationError {
	username?: string;
	password?: string;
}

interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

const validateLogin = (data: LoginData): ValidationResult => {
	const errors: ValidationError[] = [];
	const error: ValidationError = {};

	if (!data.username || data.username.trim().length === 0) {
		error.username = 'usernameRequired';
	}

	if (!data.password || data.password.trim().length === 0) {
		error.password = 'passwordRequired';
	}

	if (Object.keys(error).length > 0) {
		errors.push(error);
	}

	return {
		isValid: errors.length === 0,
		errors
	};
};

export default validateLogin;