import { create } from "zustand";

interface GlobalSearchState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const useGlobalSearchStore = create<GlobalSearchState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));

export default useGlobalSearchStore;
