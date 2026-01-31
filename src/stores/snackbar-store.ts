import { create } from "zustand";

interface SnackbarState {
	message: string;
	open: boolean;
	severity: 'success' | 'error' | 'info' | 'warning';
	openInfoSnackbar: ({ message }: { message: string }) => void;
	openSuccessSnackbar: ({ message }: { message: string }) => void;
	openErrorSnackbar: ({ message }: { message: string }) => void;
	closeSnackbar: () => void;
}

const useSnackbarStore = create<SnackbarState>((set) => ({
	message: '',
	open: false,
	severity: 'info',
	openInfoSnackbar: ({ message }) => set({ message, open: true, severity: 'info' }),
	openSuccessSnackbar: ({ message }) => set({ message, open: true, severity: 'success' }),
	openErrorSnackbar: ({ message }) => set({ message, open: true, severity: 'error' }),
	closeSnackbar: () => set({ open: false }),
}));

export default useSnackbarStore;