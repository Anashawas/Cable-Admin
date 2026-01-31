import React from 'react';
import useAuthenticationStore from '../stores/auth-store';
import { PrivilegeCode } from '../constants/privileges-constants';

interface PrivilegeComponentProtectionProps {
  children: React.ReactNode;
  requiredPrivileges?: PrivilegeCode[];
}

const PrivilegeComponentProtection: React.FC<PrivilegeComponentProtectionProps> = ({
  children,
  requiredPrivileges = []
}) => {
  const { privileges } = useAuthenticationStore();

  const hasRequiredPrivileges = requiredPrivileges.length === 0 ||
    requiredPrivileges.some(privilege => privileges.includes(privilege));

  if (!hasRequiredPrivileges) {
    return null;
  }

  return <>{children}</>;
};

export default PrivilegeComponentProtection;