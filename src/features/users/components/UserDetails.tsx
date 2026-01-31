import { memo } from "react";
import { Dialog, DialogContent, Box } from "@mui/material";
import { User } from "../types/api";
import UserDetailsHeader from "./UserDetailsHeader";
import UserBasicInfo from "./UserBasicInfo";

interface UserDetailsProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

const UserDetails = ({
  open,
  user,
  onClose,
}: UserDetailsProps) => {
  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          zIndex: 9999,
        },
        zIndex: 9999,
        "& .MuiBackdrop-root": {
          zIndex: 9998,
        },
      }}
    >
      <UserDetailsHeader
        user={user}
        onClose={onClose}
      />

      <DialogContent sx={{ p: 3 }}>
        <Box>
          <UserBasicInfo user={user} />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default memo(UserDetails);
