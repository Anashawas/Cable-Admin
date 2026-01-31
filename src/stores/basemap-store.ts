import { create } from "zustand";

interface BasemapState {
    basemapListOpen: boolean;
    basemapGalleryViewModel: any;
    toggleBasemapList: (open: boolean) => void;
    setBasemapGalleryViewModel: (basemapGalleryViewModel: any) => void;
}

const useBasemapStore = create<BasemapState>((set, get) => ({
    basemapListOpen: false,
    basemapGalleryViewModel: null,
    toggleBasemapList: (open: boolean) => set(state => ({ ...state, basemapListOpen: open })),
    setBasemapGalleryViewModel: (basemapGalleryViewModel: any) =>
        set(state => ({ ...state, basemapGalleryViewModel: basemapGalleryViewModel }))
}));

export default useBasemapStore;