import React from 'react';
import { Box, Typography } from '@mui/material';

interface FullAreaTextDisplayProps {
  text: string | null;
}

const FullAreaTextDisplay: React.FC<FullAreaTextDisplayProps> = ({ text }) => {
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      height="100%" 
      bgcolor="lightgray" 
      p={2}
    >
      <Typography variant="h6" align="center">
        {text}
      </Typography>
    </Box>
  );
};

export default FullAreaTextDisplay;
