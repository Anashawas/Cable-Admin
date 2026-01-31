import { APP_BOTTOM_SHEET_HEIGHT } from "@/constants";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";



interface LayoutState {
  smallScreen: boolean;
  toggleSmallScreen: (smallScreen: boolean) => void;
  sidebarExpanded: boolean;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  mapFullScreen: boolean;
  setMapFullScreen: (mapFullScreen: boolean) => void;
  screensContainerVisible: boolean;
  toggleScreensContainerVisibile: (visible: boolean) => void;
  screens: { label: string; index: number; icon: any }[];
  setScreens: (screens: { label: string; index: number; icon: any }[]) => void;
  selectedScreenIndex: number;
  setSelectedScreenIndex: (index: number) => void;
  advanceSearchResultsScreenActiveViewIndex: number;
  setAdvanceSearchResultsScreenActiveViewIndex: (index: number) => void;
  freeSearchScreenActiveViewIndex: number;
  setFreeSearchScreenActiveViewIndex: (index: number) => void;
  moiSearchScreenActiveViewIndex: number;
  setMoiSearchScreenActiveViewIndex: (index: number) => void;
  adminScreensActiveViewIndex: number;
  setAdminScreensActiveViewIndex: (index: number) => void;
  bottomSheetHeight: {
    heightId: string;
    height: string;
  };
  setBottomSheetHeight: (height: { heightId: string; height: string }) => void;
  reset: () => void;
}

const useLayoutStore = create<LayoutState>()(
  devtools(
    immer((set) => ({
      smallScreen: false,
      toggleSmallScreen: (smallScreen) => set({ smallScreen }),
      sidebarExpanded: true,
      toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
      setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
      mapFullScreen: false,
      setMapFullScreen: (mapFullScreen) => set({ mapFullScreen }),
      screensContainerVisible: true,
      toggleScreensContainerVisibile: (visible) => set({ screensContainerVisible: visible }),
      screens: [],
      setScreens: (screens) => set({ screens }),
      selectedScreenIndex: 0,
      setSelectedScreenIndex: (index) => set({ selectedScreenIndex: index }),
      advanceSearchResultsScreenActiveViewIndex: 0,
      setAdvanceSearchResultsScreenActiveViewIndex: (index) =>
        set({ advanceSearchResultsScreenActiveViewIndex: index }),
      freeSearchScreenActiveViewIndex: 0,
      setFreeSearchScreenActiveViewIndex: (index) =>
        set({ freeSearchScreenActiveViewIndex: index }),
      moiSearchScreenActiveViewIndex: 0,
      setMoiSearchScreenActiveViewIndex: (index) =>
        set({ moiSearchScreenActiveViewIndex: index }),
      adminScreensActiveViewIndex: 0,
      setAdminScreensActiveViewIndex: (index) => set({ adminScreensActiveViewIndex: index }),
      bottomSheetHeight: {
        heightId: "default-height-id",
        height: APP_BOTTOM_SHEET_HEIGHT.TIP,
      },
      setBottomSheetHeight: (height) => set({ bottomSheetHeight: height }),
      reset: () => {
        set({
          selectedScreenIndex: 0,
          moiSearchScreenActiveViewIndex: 0,
          adminScreensActiveViewIndex: 0,
          advanceSearchResultsScreenActiveViewIndex: 0,
          freeSearchScreenActiveViewIndex: 0,
        });
      },
    }))
  )
);

export default useLayoutStore;
