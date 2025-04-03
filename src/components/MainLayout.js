// src/components/MainLayout.js (NEW FILE)
import React from 'react';
import { Box, Toolbar } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from '../shared-theme/AppTheme'; // Assuming path is correct
import SideMenu from './_dashboard_components/SideMenu'; // Adjust path if needed
import AppNavbar from './_dashboard_components/AppNavbar'; // Adjust path if needed
import BreadcrumbsComponent from './BreadcrumbsComponent'; // We will ll create this next
import { Outlet } from 'react-router-dom'; // Used to render child routes

export default function MainLayout(props) {
  return (
    // AppTheme likely handles MUI ThemeProvider internally, including color mode
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* SideMenu is likely permanent */}
        <SideMenu />
        {/* AppNavbar is for mobile, but keep it in the structure */}
        <AppNavbar />

        {/* Main content area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default', // Use theme background
            p: 3,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Add a Toolbar spacer matching the AppBar height for non-mobile */}
          {/* Adjust height based on your actual desktop header if you add one later */}
          <Toolbar sx={{ display: { xs: 'none', md: 'block' } }} />
          {/* Add another spacer for the mobile AppNavbar */}
          <Toolbar sx={{ display: { xs: 'block', md: 'none' } }} />

          {/* Breadcrumbs */}
          <BreadcrumbsComponent />

          {/* Render the actual page component for the current route */}
          <Box sx={{ flexGrow: 1, mt: 2 }}> {/* Add margin top */}
             <Outlet />
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
}