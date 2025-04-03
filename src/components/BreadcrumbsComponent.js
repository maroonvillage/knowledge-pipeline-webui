// src/components/BreadcrumbsComponent.js (NEW FILE)
import React from 'react';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';

// Helper function to generate breadcrumb names (customize as needed)
function getPathName(segment, params) {
  if (segment === 'file' && params.filename) {
    // Decode URI component for display
    return decodeURIComponent(params.filename);
  }
  // Add more specific names here if needed
  switch (segment) {
    case 'upload': return 'Upload Document';
    case 'file': return 'File Details'; // Generic name if no filename yet
    // Add cases for other top-level routes
    default: return segment.charAt(0).toUpperCase() + segment.slice(1); // Capitalize
  }
}

export default function BreadcrumbsComponent() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const params = useParams(); // Get route params like :filename

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
      {/* Always link to Home/Dashboard */}
      <Link
        component={RouterLink}
        underline="hover"
        sx={{ display: 'flex', alignItems: 'center' }}
        color="inherit"
        to="/"
      >
        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
        Dashboard
      </Link>

      {/* Map through path segments */}
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        // Construct the path incrementally
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const displayName = getPathName(value, params); // Get display name

        return last ? (
          <Typography color="text.primary" key={to}>
            {displayName}
          </Typography>
        ) : (
          <Link component={RouterLink} underline="hover" color="inherit" to={to} key={to}>
            {displayName}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}