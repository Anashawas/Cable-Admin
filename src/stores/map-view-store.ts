import { create } from "zustand";
import MapView from "@arcgis/core/views/MapView";

interface MapViewState {
	mapView: MapView | null;
	mapViewReady: boolean;
	mapViewError: Error | null;
	mapViewClickLocation: any;
	mapViewContextMenuLocation: any;
	setMapView: (mapView: MapView | null) => void;
	setMapViewReady: (ready: boolean) => void;
	setMapViewError: (error: Error | null) => void;
	setMapViewClickLocation: (location: any) => void;
	setMapViewContextMenuLocation: (location: any) => void;
}

const useMapViewStore = create<MapViewState>((set) => ({
	mapView: null,
	mapViewReady: false,
	mapViewError: null,
	mapViewClickLocation: null,
	mapViewContextMenuLocation: null,
	setMapView: (mapView) => set({ mapView }),
	setMapViewReady: (ready) => set({ mapViewReady: ready }),
	setMapViewError: (error) => set({ mapViewError: error }),
	setMapViewClickLocation: (location) => set({ mapViewClickLocation: location }),
	setMapViewContextMenuLocation: (location) => set({ mapViewContextMenuLocation: location }),
}));

export default useMapViewStore;