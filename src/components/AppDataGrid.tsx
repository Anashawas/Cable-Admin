import { memo, useEffect, useRef, ReactNode, JSX } from "react";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { GridApiCommunity } from "@mui/x-data-grid/internals";
import { Box, LinearProgress, Typography, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

interface AppDataGridProps<T = any> {
  data: T[];
  columns: GridColDef[];
  loading?: boolean;
  total?: number;
  paginationModel?: GridPaginationModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  pageSizeOptions?: number[];
  minHeight?: string;
  children?: ReactNode; // For dialogs or other components that need to be rendered alongside
  getRowId?: (row: T) => string | number;
  onRowClick?: (params: any) => void;
  disablePagination?: boolean;
}

const AppDataGrid = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  total,
  paginationModel,
  onPaginationModelChange,
  minHeight = "75vh",
  children,
  getRowId,
  onRowClick,
  disablePagination = false,
}: AppDataGridProps<T>) => {
  const { t } = useTranslation();
  const apiRef = useRef<GridApiCommunity>(
    null
  ) as React.MutableRefObject<GridApiCommunity>;


  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (apiRef.current) {
        apiRef.current.resize();
      }
    });

    if (apiRef.current?.rootElementRef?.current) {
      resizeObserver.observe(apiRef.current.rootElementRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const CustomLoadingOverlay = () => (
    <Box
      sx={{
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 1,
      }}
    >
      <LinearProgress />
    </Box>
  );

  const CustomNoRowsOverlay = () => (
    <Stack
      height="100%"
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{ py: 8 }}
    >
      <Typography variant="h6" color="text.secondary">
        {t("noResultsFound")}
      </Typography>
      <Typography variant="body2" color="text.disabled">
        {t("noResultsFoundTagline")}
      </Typography>
    </Stack>
  );

  const baseProps = {
    apiRef,
    rows: data,
    columns,
    loading,
    disableRowSelectionOnClick: !onRowClick,
    disableColumnFilter: true,
    disableColumnMenu: true,
    disableColumnSelector: true,
    disableDensitySelector: true,
    disableMultipleRowSelection: true,
    hideFooterSelectedRowCount: true,
    autoHeight: true,
    getRowId,
    onRowClick,
    scrollbarSize: 17,
    slots: {
      loadingOverlay: CustomLoadingOverlay,
      noRowsOverlay: CustomNoRowsOverlay,
    },
    sx: {
      minHeight,
      '& .MuiLinearProgress-root': {
        height: 3,
      },
      width: "100%",
      maxWidth: "100%",
      border: 1,
      borderColor: "divider",
      borderRadius: 1,
      transition: "none",
      "& .MuiDataGrid-main": {
        width: "100%",
        maxWidth: "100%",
        transition: "none",
      },
      "& .MuiDataGrid-root": {
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        border: "none",
        transition: "none",
      },
      "& .MuiDataGrid-container--top [role=row]": {
        minWidth: "max-content",
      },
      "& .MuiDataGrid-virtualScroller": {
        overflow: "auto !important",
        maxWidth: "100%",
        overflowX: "auto",
        overflowY: "auto",
      },
      "& .MuiDataGrid-scrollArea": {
        overflow: "auto !important",
      },
      "& .MuiDataGrid-scrollbar": {
        display: "block !important",
      },
      "& .MuiDataGrid-scrollbar--horizontal": {
        display: "block !important",
        height: "12px",
      },
      "& .MuiDataGrid-columnHeaders": {
        minWidth: "max-content",
      },
      "& .MuiDataGrid-footerContainer": {
        minWidth: "max-content",
      },
      "& .MuiDataGrid-columnHeaderTitle": {
        fontWeight: "bold",
      },
      "& .MuiDataGrid-columnHeader": {
        outline: "none !important",
        border: "none !important",
        boxShadow: "none !important",
      },
      "& .MuiDataGrid-columnHeader:focus": {
        outline: "none !important",
        border: "none !important",
        boxShadow: "none !important",
      },
      "& .MuiDataGrid-columnHeader:focus-within": {
        outline: "none !important",
        border: "none !important",
        boxShadow: "none !important",
      },
      "& .MuiDataGrid-columnHeader:focus-visible": {
        outline: "none !important",
        border: "none !important",
        boxShadow: "none !important",
      },
      "& .MuiDataGrid-columnHeader--focused": {
        outline: "none !important",
        border: "none !important",
        boxShadow: "none !important",
      },
      "& .MuiDataGrid-columnHeader.Mui-focusVisible": {
        outline: "none !important",
        border: "none !important",
        boxShadow: "none !important",
      },
      "& .MuiDataGrid-columnHeaderTitleContainer": {
        outline: "none !important",
        border: "none !important",
        boxShadow: "none !important",
      },
      "& .MuiDataGrid-row": {
        minWidth: "max-content",
        cursor: onRowClick ? "pointer" : "default",
      },
      "& .MuiTablePagination-select": {
        display: "none",
      },
      "& .MuiTablePagination-selectLabel": {
        display: "none",
      },
      "& .MuiTablePagination-spacer": {
        display: "none",
      },
    },
  };

  const paginationProps =
    !disablePagination && paginationModel && onPaginationModelChange
      ? {
          paginationMode: "server" as const,
          rowCount: total,
          paginationModel,
          onPaginationModelChange,
          pageSizeOptions: [],
        }
      : {};

  return (
    <>
      <DataGrid {...baseProps} {...paginationProps} />
      {children}
    </>
  );
};

export default memo(AppDataGrid) as <T extends Record<string, any>>(
  props: AppDataGridProps<T>
) => JSX.Element;
