import { memo } from "react";

import Box from "@mui/material/Box";

const AppBottomSheetHeaderHandle = () => {
	return (
		<Box
			className="drag-handle"
			sx={(theme) => ({
				position: "absolute",
				top: 8,
				left: "calc(50% - 24px)",
				width: 48,
				height: 8,
				backgroundColor: theme.palette.grey[400],
				borderRadius: 4,
				transition: "all 0.2s ease",
				"&:hover": {
					backgroundColor: theme.palette.grey[500],
					height: 10,
				}
			})}
		/>
	);
};

export default memo(AppBottomSheetHeaderHandle);
