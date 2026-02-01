import { memo, useEffect, useRef, ReactNode, JSX } from "react";
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRowSelectionModel,
  GridToolbar,
  GridToolbarFilterButton,
  type GridRowHeightParams,
} from "@mui/x-data-grid";
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
  children?: ReactNode;
  getRowId?: (row: T) => string | number;
  onRowClick?: (params: any) => void;
  disablePagination?: boolean;
  /** Enable column filters and client-side filter mode. */
  enableColumnFilter?: boolean;
  /** Show toolbar with filter button. */
  enableToolbar?: boolean;
  /** Show checkbox column for multi-select (bulk actions). */
  checkboxSelection?: boolean;
  rowSelectionModel?: GridRowSelectionModel;
  onRowSelectionModelChange?: (model: GridRowSelectionModel) => void;
  /** Optional class name for rows (e.g. for Premium styling). */
  getRowClassName?: (params: { row: T }) => string;
  /** Optional fixed or dynamic row height (px). */
  getRowHeight?: (params: { row: T }) => number;
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
  enableColumnFilter = false,
  enableToolbar = false,
  checkboxSelection = false,
  rowSelectionModel,
  onRowSelectionModelChange,
  getRowClassName,
  getRowHeight,
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

  const slots = {
    loadingOverlay: CustomLoadingOverlay,
    noRowsOverlay: CustomNoRowsOverlay,
    ...(enableToolbar && {
      toolbar: () => (
        <GridToolbar sx={{ gap: 0.5, py: 0.5, px: 1 }}>
          <GridToolbarFilterButton />
        </GridToolbar>
      ),
    }),
  };

  const baseProps = {
    apiRef,
    rows: data,
    columns,
    loading,
    disableRowSelectionOnClick: checkboxSelection ? false : !onRowClick,
    disableColumnFilter: !enableColumnFilter,
    disableColumnMenu: !enableColumnFilter,
    disableColumnSelector: true,
    disableDensitySelector: true,
    disableMultipleRowSelection: !checkboxSelection,
    hideFooterSelectedRowCount: !checkboxSelection,
    checkboxSelection,
    rowSelectionModel: checkboxSelection ? rowSelectionModel : undefined,
    onRowSelectionModelChange: checkboxSelection ? onRowSelectionModelChange : undefined,
    filterMode: enableColumnFilter ? ("client" as const) : undefined,
    autoHeight: true,
    getRowId,
    onRowClick,
    getRowClassName: getRowClassName as ((params: { row: Record<string, unknown> }) => string) | undefined,
    getRowHeight: getRowHeight
      ? (params: GridRowHeightParams) => getRowHeight({ row: params.model as T })
      : undefined,
    scrollbarSize: 17,
    slots,
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
