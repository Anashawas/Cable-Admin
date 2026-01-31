import { useEffect, memo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useOrientation } from "react-use";
import { useSpring, animated, config } from "react-spring";

import Portal from "@mui/material/Portal";
import Paper from "@mui/material/Paper";
import { useLayoutStore } from "src/stores";

import { APP_BOTTOM_SHEET_HEIGHT as HEIGHTS } from "@/constants";
import AppBottomSheetHeader from "./AppBottomSheetHeader";
import useAppStandardSheet from "../hooks/use-app-standard-sheet";

const WobblyBottomSheet = animated(Paper);

const AppBottomSheet = ({ children }: { children: React.ReactNode }) => {
  const orientation = useOrientation();
  const { standardSheet } = useAppStandardSheet();

  const screensContainerVisible = useLayoutStore((state) => state.screensContainerVisible);
  const bottomSheetHeight = useLayoutStore((state) => state.bottomSheetHeight);
  const setBottomSheetHeight = useLayoutStore((state) => state.setBottomSheetHeight);


  const getHeightValue = (height: string): number => {
    if (height === HEIGHTS.HIDDEN) return 0;
    if (height === HEIGHTS.TIP) return 125; 
    if (height === HEIGHTS.HALF) return window.innerHeight * 0.5;
    if (height === HEIGHTS.FULL) return window.innerHeight - 56 - 16;
    return 0;
  };

  const targetHeight = getHeightValue(bottomSheetHeight.height);

  const styles = useSpring({
    height: targetHeight,
    immediate: bottomSheetHeight.height === HEIGHTS.HIDDEN,
    config: config.gentle 
  });

  useEffect(() => {
    if (screensContainerVisible)
      setBottomSheetHeight(
        standardSheet?.open
          ? { heightId: uuidv4(), height: HEIGHTS.HIDDEN }
          : { heightId: uuidv4(), height: HEIGHTS.TIP }
      );
    else setBottomSheetHeight({ heightId: uuidv4(), height: HEIGHTS.HIDDEN });
  }, [orientation, standardSheet?.open, screensContainerVisible, setBottomSheetHeight]);
  
  
  return (
    <Portal>
      <WobblyBottomSheet
        sx={(theme) => ({
          position: "absolute",
          bottom: 0,
          display: "grid",
          gridTemplateRows: "max-content 1fr",
          width: 1,
          borderTopLeftRadius: theme.spacing(1),
          borderTopRightRadius: theme.spacing(1),
          overflow: "hidden",
          zIndex: 2,
        })}
        style={styles}
      >
        <AppBottomSheetHeader />
        {children}
      </WobblyBottomSheet>
    </Portal>
  );
};

export default memo(AppBottomSheet);
