import { memo } from "react";
import Slide from "@mui/material/Slide";
import Paper from "@mui/material/Paper";

import { APP_BOTTOM_SHEET_HEIGHT as HEIGHTS } from "@/constants/app-constants";
import AppStandardSheetToolbar from "./AppStandardSheetToolbar";
import useAppStandardSheet from "../hooks/use-app-standard-sheet";

const AppStandardBottomSheet = () => {
    const { standardSheet } = useAppStandardSheet();
    return (
        <Slide
            key={standardSheet?.type}
            in={standardSheet?.open}
            direction="up"
            timeout={300}
            unmountOnExit
        >
            <Paper
                sx={(theme) => ({
                    position: "fixed",
                    display: "grid",
                    gridTemplateRows: "max-content 1fr",
                    bottom: 0,
                    height: standardSheet?.height || HEIGHTS.HALF,
                    width: 1,
                    transition: "height 0.25s ease-out",
                    borderTopLeftRadius: theme.spacing(1),
                    borderTopRightRadius: theme.spacing(1),
                    overflow: "hidden",
                    zIndex: 1,
                })}
                elevation={10}
            >
                <AppStandardSheetToolbar
                    title={standardSheet?.title}
                    onClose={standardSheet?.onClose}
                    hideCloseButton={standardSheet?.hideCloseButton ?? false}
                />
                {standardSheet?.sheet}
            </Paper>
        </Slide>
    );
};

export default memo(AppStandardBottomSheet);