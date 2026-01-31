import { memo } from "react";

import Box from "@mui/material/Box";

const AppScreenContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box
      sx={{
        height: 1,
        position: "relative",
        overflowY: "auto",
        overflowX: "hidden",
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        // Hide scrollbar while keeping scroll functionality
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE and Edge
        "&::-webkit-scrollbar": {
          display: "none", // Chrome, Safari, Opera
        },
      }}
      bgcolor={"background.paper"}
    >
      {children}
    </Box>
  );
};

export default memo(AppScreenContainer);
