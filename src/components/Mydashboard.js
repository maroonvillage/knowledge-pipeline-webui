import * as React from 'react';

import Box from '@mui/material/Box';
import MainGrid from './_dashboard_components/MainGrid';


export default function Mydashboard() { // Removed props
  return (
      // The Box and Stack structure might be adjusted based on MainLayout
      // MainGrid should now be the primary content here.
      <Box> {/* Optional: Add specific styling for dashboard page if needed */}
          <MainGrid />
      </Box>
  );
}