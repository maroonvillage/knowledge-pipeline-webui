import logo from './logo.svg';
import './App.css';
import ExtractionComponent from './components/ExtractionComponent';
import DocumentIngestionOptions from './components/DocumentIngestionOptions'
import Dashboard from './dashboard/Dashboard'
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, AppBar } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DashboardIcon from '@mui/icons-material/Dashboard';


function App() {
  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
         <Toolbar>
          <Typography variant="h6" noWrap component="div">
            My AI Compliance Dashboard
          </Typography>
        </Toolbar>
       </AppBar>
        <Drawer
         variant="permanent"
           sx={{
             width: 240,
             flexShrink: 0,
             [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
           }}
        >
         <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              <ListItem key="dashboard" disablePadding>
                <ListItemButton component={Link} to="/">
                  <ListItemIcon>
                     <DashboardIcon />
                  </ListItemIcon>
                   <ListItemText primary="Dashboard" />
                 </ListItemButton>
               </ListItem>
               <ListItem key="upload" disablePadding>
                 <ListItemButton component={Link} to="/upload">
                    <ListItemIcon>
                      <CloudUploadIcon />
                    </ListItemIcon>
                     <ListItemText primary="Upload" />
                 </ListItemButton>
               </ListItem>
             </List>
           </Box>
         </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
           <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={
              <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                 <DocumentIngestionOptions />
               </Box>
            } />
           </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
