import React from 'react';
import { Box, Typography, Button} from '@mui/material';
import { Block as BlockIcon, Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useAuthenticationStore from '../stores/auth-store';
import { PrivilegeCode } from '../constants/privileges-constants';

interface PrivilegeScreenProtectionProps {
  children: React.ReactNode;
  requiredPrivileges?: PrivilegeCode[];
}

const PrivilegeScreenProtection: React.FC<PrivilegeScreenProtectionProps> = ({
  children,
  requiredPrivileges = []
}) => {
  const navigate = useNavigate();
  const { privileges } = useAuthenticationStore();

  const hasRequiredPrivileges = requiredPrivileges.length === 0 ||
    requiredPrivileges.some(privilege => privileges.includes(privilege));

  if (!hasRequiredPrivileges) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        textAlign="center"
        p={4}
      >
        <BlockIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
        <Typography variant="h4" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          You don't have the required privileges to access this screen.
        </Typography>
       
        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
        >
          Go Home
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
};

export default PrivilegeScreenProtection;