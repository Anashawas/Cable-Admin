import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
	theme: 'light' | 'dark';
	setTheme: (theme: 'light' | 'dark') => void;
}

const useThemeStore = create<ThemeState>()(
	persist(
		(set) => ({
			theme: 'light',
			setTheme: (theme) => set({ theme }),
		}),
		{
			name: "theme-storage",
		}
	)
);

export default useThemeStore;