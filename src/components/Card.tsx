import { memo, ReactNode } from "react";
import { Card as MuiCard, CardProps as MuiCardProps } from "@mui/material";

interface CardProps extends Omit<MuiCardProps, 'elevation'> {
  children: ReactNode;
}

const Card = ({ children, sx, ...props }: CardProps) => {
  return (
    <MuiCard
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        ...sx
      }}
      {...props}
    >
      {children}
    </MuiCard>
  );
};

export default memo(Card);