interface LoginData {
	email: string;
	password: string;
}

export interface ValidationError {
	email?: string;
	password?: string;
}

interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

/** Client-side checks: Email required, Password required (server does not validate). */
const validateLogin = (data: LoginData): ValidationResult => {
	const errors: ValidationError[] = [];
	const error: ValidationError = {};

	if (!data.email || data.email.trim().length === 0) {
		error.email = "emailRequired";
	}

	if (!data.password || data.password.trim().length === 0) {
		error.password = "passwordRequired";
	}

	if (Object.keys(error).length > 0) {
		errors.push(error);
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
};

export default validateLogin;