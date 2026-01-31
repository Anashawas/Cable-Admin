import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface LayersListState {
	basemapLayerListBaseItems: any[];
	layerListOperationalItems: any[];
	operationalLayersInfo: any[];
	referenceLayersItems: any[];
	layersListOpen: boolean;
	layersListSettingsOpen: boolean;
	toggleLayersList: (open: boolean) => void;
	toggleLayersListSettings: (open: boolean) => void;
	populateLayersList: (data: {
		basemapLayerListBaseItems: any[];
		layerListOperationalItems: any[];
		operationalLayersInfo: any[];
		referenceLayersItems: any[];
	}) => void;
}

const useLayersListStore = create<LayersListState>()(
	immer((set, get) => ({
		basemapLayerListBaseItems: [],
		layerListOperationalItems: [],
		operationalLayersInfo: [],
		referenceLayersItems: [],
		layersListOpen: false,
		layersListSettingsOpen: false,
		toggleLayersList: (open: boolean) => {
			set({ layersListOpen: open });
		},
		toggleLayersListSettings: (open: boolean) => {
			set({ layersListSettingsOpen: open });
		},
		populateLayersList: ({
			basemapLayerListBaseItems,
			layerListOperationalItems,
			operationalLayersInfo,
			referenceLayersItems,
		}) => {
			set({
				basemapLayerListBaseItems,
				layerListOperationalItems,
				operationalLayersInfo,
				referenceLayersItems,
			});
		},
	}))
);

export default useLayersListStore;