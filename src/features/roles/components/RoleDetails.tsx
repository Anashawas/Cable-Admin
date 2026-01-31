import { memo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useRoleById } from "../hooks/use-role-by-id";
import { Role } from "../types/api";

interface RoleDetailsProps {
  open: boolean;
  role: Role | null;
  onClose: () => void;
}

const RoleDetails = ({
  open,
  role,
  onClose,
}: RoleDetailsProps) => {
  const { t } = useTranslation();

  // Fetch full role details with privileges
  const { data: roleDetails, isLoading } = useRoleById(
    { id: role?.id || 0 },
    open && !!role?.id
  );

  if (!role) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="role-details-title"
      sx={{
        zIndex: 9999,
        "& .MuiDialog-paper": {
          zIndex: 9999,
        },
        "& .MuiBackdrop-root": {
          zIndex: 9998,
        },
      }}
    >
      <DialogTitle id="role-details-title">
        <Typography variant="h5" component="h2">
          {t("roles@details.title")}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Basic Information Section */}
            <Box>
              <Typography variant="h6" gutterBottom>
                {t("roles@details.basicInformation")}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                  {t("roles@details.name")}:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {roleDetails?.name || role.name}
                </Typography>
              </Box>
            </Box>

            {/* Privileges Section */}
            <Box>
              <Typography variant="h6" gutterBottom>
                {t("roles@details.privileges")}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {roleDetails?.rolePrivileges && roleDetails.rolePrivileges.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {roleDetails.rolePrivileges.map((privilege) => (
                    <Chip
                      key={privilege.id}
                      label={privilege.privilegeName}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t("roles@details.noPrivileges")}
                </Typography>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          {t("close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default memo(RoleDetails);
