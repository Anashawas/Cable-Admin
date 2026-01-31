import { AUTH_STATE_KEY } from "../constants/authentication-constants";
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface User {
	id: number;
	name: string;
	username: string;
	isActiveDirectory: boolean;
	accessToken: string;
	refreshToken: string;
	mapServices: any[];
	privileges: string[];
	persist: boolean;
}

interface AuthState {
	user: User | null;
	loaded: boolean;
	privileges: string[];
	setLoggedInUser: ({ userDetails, persist }: { userDetails: any; persist: boolean }) => void;
	updateLoggedInUserDetails: (user: any) => void;
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
					setLoggedInUser: ({ userDetails, persist }) => {
						const user = {
							id: userDetails.id,
							name: userDetails.name,
							username: userDetails.username,
							isActiveDirectory: userDetails.isActiveDirectory,
							accessToken: userDetails.accessToken,
							refreshToken: userDetails.refreshToken,
							mapServices: userDetails.mapServices,
							privileges: userDetails.privileges || [],
							persist: persist,
						};
						set((state) => {
							state.user = user;
							state.loaded = true;
							state.privileges = userDetails.privileges || [];
						});
					},
					updateLoggedInUserDetails: (user) => {
						const currentUser = get().user;
						set({
							user: {
								...currentUser!,
								id: user.id,
								name: user.name,
								username: user.username,
								isActiveDirectory: user.isActiveDirectory,
								mapServices: user.mapServices,
								privileges: user.privileges || [],
								accessToken: user.accessToken ?? currentUser?.accessToken,
								refreshToken: user.refreshToken ?? currentUser?.refreshToken,
								persist: true,
							},
							privileges: user.privileges || [],
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
					name: AUTH_STATE_KEY,
					partialize: (state) => ({
						user: state.user?.persist ? state.user : null,
						privileges: state.user?.persist ? state.privileges : []
					}),
				}
			)
		),
		{
			name: "Authentication Store"
		}
	)
);

export default useAuthenticationStore;