import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface ProtectedRouteProps {
	isAllowed: boolean;
	redirectPath?: string;
	children: ReactNode;
}

const ProtectedRoute = ({ 
	isAllowed, 
	redirectPath = "/login", 
	children 
}: ProtectedRouteProps) => {
	if (!isAllowed) {
		return <Navigate to={redirectPath} replace />;
	}

	return <>{children}</>;
};

export default ProtectedRoute;