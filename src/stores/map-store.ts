import { create } from "zustand";
import Map from "@arcgis/core/Map";

interface MapState {
	map: Map | null;
	mapError: Error | null;
	mapLoading: boolean;
	setMap: (map: Map | null) => void;
	setMapLoading: (mapLoading: boolean) => void;
	setMapError: (error: Error | null) => void;
}

const useMapStore = create<MapState>((set) => ({
	map: null,
	mapError: null,
	mapLoading: true,
	setMap: (map) => set({ map }),
	setMapLoading: (mapLoading) => set({ mapLoading }),
	setMapError: (error) => set({ mapError: error }),
}));

export default useMapStore;