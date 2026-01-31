import { memo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useDrag } from "@use-gesture/react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { APP_BOTTOM_SHEET_HEIGHT as HEIGHTS } from "@/constants";

import useLayoutStore from "src/stores/layout-store";
import { safeAreaRightLeft } from "src/constants";
import AppBottomSheetHeaderHandle from "./AppBottomSheetHeaderHandle";

const AppBottomSheetHeader = () => {
  const screens = useLayoutStore((state) => state.screens);
  const selectedScreenIndex = useLayoutStore((state) => state.selectedScreenIndex);
  const bottomSheetHeight = useLayoutStore((state) => state.bottomSheetHeight);
  const setBottomSheetHeight = useLayoutStore((state) => state.setBottomSheetHeight);

  const bottomSheetHeaderLabel =
    screens.find((screen) => screen.index === selectedScreenIndex)?.label ??
    null;

  const onDrag = useDrag(
    ({ last, direction: [], velocity: [, vy], movement: [, my], distance }) => {
      if (!last && (Array.isArray(distance) ? Math.hypot(...distance) < 5 : distance < 5)) return; // Only need 5px movement to start
      
      if (!last) return;

      const dragDown = my > 0;
      const dragUp = my < 0;

      if (dragDown) {
        if (bottomSheetHeight.height === HEIGHTS.FULL) {
          setBottomSheetHeight(
            Math.abs(vy) > 2 // Reduced velocity threshold
              ? { heightId: uuidv4(), height: HEIGHTS.TIP }
              : { heightId: uuidv4(), height: HEIGHTS.HALF }
          );
        } else if (bottomSheetHeight.height === HEIGHTS.HALF) {
          setBottomSheetHeight({ heightId: uuidv4(), height: HEIGHTS.TIP });
        }
      } else if (dragUp) {
        if (bottomSheetHeight.height === HEIGHTS.TIP) {
          setBottomSheetHeight(
            Math.abs(vy) > 2 // Reduced velocity threshold
              ? { heightId: uuidv4(), height: HEIGHTS.FULL }
              : { heightId: uuidv4(), height: HEIGHTS.HALF }
          );
        } else if (bottomSheetHeight.height === HEIGHTS.HALF) {
          setBottomSheetHeight({ heightId: uuidv4(), height: HEIGHTS.FULL });
        }
      }
    },
    { 
      axis: "y",
      threshold: 5, // Very low threshold for starting drag
      rubberband: true, // Adds rubber band effect
      from: () => [0, 0], // Reset from position each time
      bounds: { top: -200, bottom: 200 } // Allow more drag range
    }
  );

  return (
    <Box
      sx={{
        ...safeAreaRightLeft,
        touchAction: "none",
        cursor: "grab",
        userSelect: "none",
        "&:active": {
          cursor: "grabbing",
        },
        "&:hover .drag-handle": {
          backgroundColor: "rgba(0, 0, 0, 0.4)",
        },
        // Increase drag area by adding padding
        py: 1,
      }}
      {...onDrag()}
    >
      {bottomSheetHeaderLabel && (
        <>
          <AppBottomSheetHeaderHandle />
          <Typography
            sx={(theme) => ({
              px: theme.spacing(2.5),
              py: theme.spacing(1.5),
              userSelect: "none",
            })}
            fontWeight="bold"
            variant="h6"
          >
            {bottomSheetHeaderLabel}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default memo(AppBottomSheetHeader);

