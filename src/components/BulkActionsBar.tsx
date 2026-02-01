import { Box, Button, Typography, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useTranslation } from "react-i18next";

export interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
  loading?: boolean;
}

export default function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  loading = false,
}: BulkActionsBarProps) {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        bgcolor: "primary.main",
        color: "primary.contrastText",
        px: 2,
        py: 1.5,
        boxShadow: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Typography variant="body2" fontWeight="medium">
        {t("search@bulkSelected", "{{count}} selected", { count: selectedCount })}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={onClearSelection}
          disabled={loading}
          sx={{ borderColor: "rgba(255,255,255,0.5)", color: "inherit" }}
        >
          {t("search@clearSelection", "Clear")}
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<FileDownloadIcon />}
          onClick={onBulkExport}
          disabled={loading}
          sx={{ borderColor: "rgba(255,255,255,0.5)", color: "inherit" }}
        >
          {t("search@bulkExport", "Export")}
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<DeleteIcon />}
          onClick={onBulkDelete}
          disabled={loading}
          sx={{
            borderColor: "rgba(255,255,255,0.8)",
            color: "inherit",
            "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.1)" },
          }}
        >
          {t("search@bulkDelete", "Delete")}
        </Button>
      </Stack>
    </Box>
  );
}
