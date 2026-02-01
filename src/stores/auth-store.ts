import { JWT_TOKEN_KEY } from "../constants/authentication-constants";
import type { LoginResponse, UserDetails } from "../features/authentication/types/api";
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

/** In-app user shape (from LoginResponse.userDetails + tokens + privileges) */
export interface User {
	id: number;
	name: string;
	email: string;
	phone?: string | null;
	isActive: boolean;
	role: { id: number; name: string };
	accessToken: string;
	refreshToken: string;
	privileges: string[];
	persist: boolean;
}

interface AuthState {
	user: User | null;
	loaded: boolean;
	privileges: string[];
	setLoggedInUser: (payload: { loginResponse: LoginResponse; persist: boolean }) => void;
	updateLoggedInUserDetails: (userDetails: UserDetails, tokens?: { accessToken: string; refreshToken: string }) => void;
	logout: () => void;
	setTokens: (accessToken: string, refreshToken: string) => void;
}

const useAuthenticationStore = create<AuthState>()(
	devtools(
		subscribeWithSelector(
			persist(
				immer((set, get) => ({
					user: null,
					loaded: false,
					privileges: [],
					setLoggedInUser: ({ loginResponse, persist: persistFlag }) => {
						const { userDetails, accessToken, refreshToken, privileges = [] } = loginResponse;
						const user: User = {
							id: userDetails.id,
							name: userDetails.name,
							email: userDetails.email,
							phone: userDetails.phone,
							isActive: userDetails.isActive,
							role: userDetails.role,
							accessToken,
							refreshToken,
							privileges,
							persist: persistFlag,
						};
						set((state) => {
							state.user = user;
							state.loaded = true;
							state.privileges = privileges;
						});
					},
					updateLoggedInUserDetails: (userDetails, tokens) => {
						const currentUser = get().user;
						if (!currentUser) return;
						set({
							user: {
								...currentUser,
								id: userDetails.id,
								name: userDetails.name,
								email: userDetails.email,
								phone: userDetails.phone,
								isActive: userDetails.isActive,
								role: userDetails.role,
								accessToken: tokens?.accessToken ?? currentUser.accessToken,
								refreshToken: tokens?.refreshToken ?? currentUser.refreshToken,
								privileges: currentUser.privileges,
								persist: true,
							},
							loaded: true,
						});
					},
					logout: () =>
						set((state) => {
							state.user = null;
							state.privileges = [];
							state.loaded = false;
						}),
					setTokens: (accessToken, refreshToken) =>
						set((state) => {
							if (state.user) {
								state.user.accessToken = accessToken;
								state.user.refreshToken = refreshToken;
							}
						}),
				})),
				{
					name: JWT_TOKEN_KEY,
					partialize: (state) => ({
						user: state.user?.persist ? state.user : null,
						privileges: state.user?.persist ? state.privileges : [],
					}),
				}
			)
		),
		{
			name: "Authentication Store",
		}
	)
);

export default useAuthenticationStore;
