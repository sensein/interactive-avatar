import React from 'react';
import { Box } from '@mui/material';

interface PanelLayoutProps {
  topLeft: React.ReactNode;
  topRight: React.ReactNode;
  bottomLeft: React.ReactNode;
  bottomRight: React.ReactNode;
}

const PanelLayout: React.FC<PanelLayoutProps> = ({ topLeft, topRight, bottomLeft, bottomRight }) => {
  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Box display="flex" flex={1}>
        <Box flex={1} p={2}>{topLeft}</Box>
        <Box flex={1} p={2}>{topRight}</Box>
      </Box>
      <Box display="flex" flex={1}>
        <Box flex={1} p={2}>{bottomLeft}</Box>
        <Box flex={1} p={2}>{bottomRight}</Box>
      </Box>
    </Box>
  );
};

export default PanelLayout;
