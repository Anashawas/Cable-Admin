import { memo } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Box,
  CircularProgress,
  Button,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { Attachment } from "../services/attachments-service";

interface RefundAttachmentsProps {
  attachments: Attachment[] | undefined;
  isLoading: boolean;
  onDownload: (fileName: string, fileData: string, contentType: string) => void;
}

const RefundAttachments = ({
  attachments,
  isLoading,
  onDownload,
}: RefundAttachmentsProps) => {
  const { t } = useTranslation();

  return (
    <Card
      sx={{
        flex: 1,
        boxShadow: 0,
        borderRadius: 1,
        border: "2px solid #ddd",
        height: "400px",
      }}
    >
      <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          {t("refunds@details.attachments")}
          {attachments && ` (${attachments.length})`}
        </Typography>
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={30} />
            </Box>
          ) : attachments && attachments.length > 0 ? (
            <Box display="flex" flexDirection="column" gap={2}>
              {attachments.map((attachment) => (
                <Card
                  key={attachment.id}
                  variant="outlined"
                  sx={{ borderRadius: 1, boxShadow: 1 }}
                >
                  {attachment.contentType.startsWith("image/") && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={`data:${attachment.contentType};base64,${attachment.fileData}`}
                      alt={attachment.fileName}
                      sx={{
                        objectFit: "cover",
                        bgcolor: "grey.100",
                        borderRadius: "4px 4px 0 0",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        // Convert base64 to blob for better browser compatibility
                        const byteCharacters = atob(attachment.fileData);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: attachment.contentType });
                        const blobUrl = URL.createObjectURL(blob);

                        const newWindow = window.open(blobUrl, "_blank");
                        // Clean up the blob URL after a delay
                        if (newWindow) {
                          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                        }
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 2 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      title={attachment.fileName}
                    >
                      {attachment.fileName}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      size="small"
                      fullWidth
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() =>
                        onDownload(
                          attachment.fileName,
                          attachment.fileData,
                          attachment.contentType
                        )
                      }
                    >
                      {t("refunds@details.download")}
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          ) : (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="100px"
            >
              <Typography variant="body2" color="text.secondary">
                {t("refunds@details.noAttachments")}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default memo(RefundAttachments);
