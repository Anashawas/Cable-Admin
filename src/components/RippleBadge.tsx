import { memo } from 'react';
import Badge from '@mui/material/Badge';

interface RippleBadgeProps {
  color: string;
  invisible: boolean;
  children: React.ReactNode;
}

const RippleBadge = ({ color, invisible, children }: RippleBadgeProps) => {
  return (
    <Badge
      color="error"
      variant="dot"
      invisible={invisible}
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: color,
          '&::after': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            animation: 'ripple 1.2s infinite ease-in-out',
            border: `1px solid ${color}`,
            content: '""',
          },
        },
        '@keyframes ripple': {
          '0%': {
            transform: 'scale(.8)',
            opacity: 1,
          },
          '100%': {
            transform: 'scale(2.4)',
            opacity: 0,
          },
        },
      }}
    >
      {children}
    </Badge>
  );
};

export default memo(RippleBadge);