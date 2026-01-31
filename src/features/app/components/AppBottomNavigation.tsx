import { memo } from "react";

import { BottomNavigation, BottomNavigationAction } from "@mui/material";

import { useLayoutStore } from "src/stores";

const AppBottomNavigation = () => {
  const selectedScreenIndex = useLayoutStore((state) => state.selectedScreenIndex);
  const setSelectedScreenIndex = useLayoutStore((state) => state.setSelectedScreenIndex);
  const screens = useLayoutStore((state) => state.screens);

  return (
    screens.length > 0 && (
      <BottomNavigation
        sx={(theme) => ({
          // Remove safeAreaRightBottomLeft since parent container now handles safe area
          pr: "env(safe-area-inset-right)",
          pl: "env(safe-area-inset-left)",
          boxSizing: "content-box",
          boxShadow: theme.shadows[3],
          "& .MuiBottomNavigationAction-root": {
            color: theme.palette.mode === 'dark' ? theme.palette.grey[600] : theme.palette.text.disabled,
          },
          "& .Mui-selected": {
            color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
            "& .MuiBottomNavigationAction-label": {
              color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
            },
          },
        })}
        showLabels
        value={selectedScreenIndex}
        onChange={(_, i) => setSelectedScreenIndex(i)}
      >
        {screens.map((screen) => (
          <BottomNavigationAction
            key={screen.label}
            value={screen.index}
            label={screen.label}
            icon={screen.icon}
          />
        ))}
      </BottomNavigation>
    )
  );
};

export default memo(AppBottomNavigation);
