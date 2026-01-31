import { memo } from "react";
import AppBottomSheet from "./AppBottomSheet";
import AppStandardBottomSheet from "./AppStandardBottomSheet";
import AppStandardSlideSheet from "./AppStandardSlideSheet";
import { useLayoutStore } from "src/stores";
import AppBottomNavigation from "./AppBottomNavigation";
import AppScreens from "./AppScreens";
import AppSidePanel from "./AppSidePanel";

const AppPanel = () => {
  const smallScreen = useLayoutStore((state) => state.smallScreen);

  return (
    <>
      {smallScreen ? (
        <AppBottomSheet>
          <AppScreens />
          <AppBottomNavigation />
          <AppStandardBottomSheet />
        </AppBottomSheet>
      ) : (
        <AppSidePanel>
          <AppScreens />
          <AppBottomNavigation />
          <AppStandardSlideSheet />
        </AppSidePanel>
      )}
    </>
  );
};

export default memo(AppPanel);
