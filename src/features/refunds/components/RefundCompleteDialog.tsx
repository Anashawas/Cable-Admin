import { memo, useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  Grid,
} from "@mui/material";
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, InsertDriveFile as FileIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

interface RefundCompleteDialogProps {
  open: boolean;
  reservationNumber: string;
  reservationId: number;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (attachmentIds: number[]) => void;
  onUploadAttachments: (files: File[], reservationId: number) => Promise<number[]>;
}

const RefundCompleteDialog = ({
  open,
  reservationNumber,
  reservationId,
  isPending,
  onClose,
  onConfirm,
  onUploadAttachments,
}: RefundCompleteDialogProps) => {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
      setUploadError(null);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setUploadError(t("refunds@details.complete.noFilesSelected"));
      return;
    }

    setUploadError(null);

    try {
      // First upload attachments
      const attachmentIds = await onUploadAttachments(selectedFiles, reservationId);
      // Then update refund status with attachment IDs
      await onConfirm(attachmentIds);
    } catch (error) {
      setUploadError(t("refunds@details.complete.uploadError"));
      throw error;
    }
  }, [selectedFiles, reservationId, onUploadAttachments, onConfirm, t]);

  const handleClose = useCallback(() => {
    setSelectedFiles([]);
    setUploadError(null);
    onClose();
  }, [onClose]);

  const getFilePreview = useCallback((file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return '';
  }, []);

  const isImageFile = useCallback((file: File): boolean => {
    return file.type.startsWith('image/');
  }, []);

  const isPdfFile = useCallback((file: File): boolean => {
    return file.type === 'application/pdf';
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  const filePreviews = useMemo(() => {
    return selectedFiles.map((file) => ({
      file,
      preview: getFilePreview(file),
      isImage: isImageFile(file),
      isPdf: isPdfFile(file),
    }));
  }, [selectedFiles, getFilePreview, isImageFile, isPdfFile]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 10002 }}
    >
      <DialogTitle>
        {t("refunds@details.complete.title")}
      </DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          {t("refunds@details.complete.message")} {reservationNumber}
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t("refunds@details.complete.uploadProof")}
          </Typography>

          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            fullWidth
            sx={{ mt: 1, mb: 2 }}
            disabled={isPending}
          >
            {t("refunds@details.complete.selectFiles")}
            <input
              type="file"
              hidden
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
          </Button>

          {selectedFiles.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                {t("refunds@details.complete.selectedFiles")} ({selectedFiles.length}):
              </Typography>

              <Grid container spacing={2}>
                {filePreviews.map(({ file, preview, isImage, isPdf }, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                    <Card
                      sx={{
                        position: 'relative',
                        height: '100%',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {isImage ? (
                        <CardMedia
                          component="img"
                          height="160"
                          image={preview}
                          alt={file.name}
                          sx={{
                            objectFit: 'cover',
                            bgcolor: 'action.hover'
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: 160,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'action.hover',
                          }}
                        >
                          <FileIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                            {isPdf ? 'PDF' : file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                          </Typography>
                        </Box>
                      )}

                      <CardContent sx={{ pb: 1 }}>
                        <Typography
                          variant="body2"
                          noWrap
                          title={file.name}
                          sx={{ fontWeight: 500 }}
                        >
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.size)}
                        </Typography>
                      </CardContent>

                      <IconButton
                        size="small"
                        onClick={() => handleRemoveFile(index)}
                        disabled={isPending}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'background.paper',
                          boxShadow: 1,
                          '&:hover': {
                            bgcolor: 'error.light',
                            color: 'error.contrastText',
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="inherit"
          disabled={isPending}
        >
          {t("refunds@details.cancel")}
        </Button>
        <Button
          onClick={handleConfirm}
          color="success"
          variant="contained"
          disabled={isPending || selectedFiles.length === 0}
        >
          {isPending ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            t("refunds@details.complete.confirm")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(RefundCompleteDialog);
