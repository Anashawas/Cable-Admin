import { memo } from "react";

import Slide from "@mui/material/Slide";
import Paper from "@mui/material/Paper";

import AppStandardSheetToolbar from "./AppStandardSheetToolbar";
import useAppStandardSheet from "../hooks/use-app-standard-sheet";

const AppStandardSlideSheet = () => {
    const { standardSheet } = useAppStandardSheet();
    return (
        <Slide
            key={standardSheet?.type}
            in={standardSheet?.open}
            direction="left"
            timeout={300}
            unmountOnExit
        >
            <Paper
                sx={{
                    position: "absolute",
                    display: "grid",
                    gridTemplateRows: "max-content 1fr",
                    top: 0,
                    height: 1,
                    width: 1,
                    overflow: "hidden",
                    zIndex: 1,
                }}
            >
                <AppStandardSheetToolbar
                    title={standardSheet?.title}
                    onClose={standardSheet?.onClose}
                />
                {standardSheet?.sheet}
            </Paper>
        </Slide>
    );
};

export default memo(AppStandardSlideSheet);