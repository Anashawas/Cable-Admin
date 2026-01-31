import { create } from "zustand";

const useMapFeaturesStore = create((set, _get) => ({
  identifiedMapFeature: null,
  setIdentifiedMapFeature: (identifiedMapFeature: any) =>
    set((state: any) => ({ ...state, identifiedMapFeature })),
  clearSelection: () =>
    set((state: any) => ({ ...state, identifiedMapFeature: null })),
}));

export default useMapFeaturesStore;
