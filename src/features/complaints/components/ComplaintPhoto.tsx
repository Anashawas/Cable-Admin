import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { server } from "../../../lib/@axios";

/**
 * The driver's photo on a "problem with this session" complaint. Served only through the authorized
 * GET /api/usercomplaints/{id}/photo (the file sits in a private folder), so it is fetched as a blob
 * with the admin's token and shown from an object URL; click opens it full size.
 */
export default function ComplaintPhoto({ complaintId }: { complaintId: number }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    server
      .get<Blob>(`api/usercomplaints/${complaintId}/photo`, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [complaintId]);

  if (failed) return null;
  if (!url) return <CircularProgress size={18} />;
  return (
    <Box
      component="a"
      href={url}
      target="_blank"
      rel="noreferrer"
      sx={{ display: "inline-block", borderRadius: 1.5, overflow: "hidden", border: 1, borderColor: "divider", lineHeight: 0 }}
    >
      <Box component="img" src={url} alt="" sx={{ width: 120, height: 90, objectFit: "cover" }} />
    </Box>
  );
}
