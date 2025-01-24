import logo from './logo.svg';
import './App.css';
import ExtractionComponent from './components/ExtractionComponent';
import DocumentIngestionOptions from './components/DocumentIngestionOptions'
//import Dashboard from './dashboard/Dashboard'
import Mydashboard from './components/Mydashboard';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, AppBar } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DashboardIcon from '@mui/icons-material/Dashboard';


function App() {
  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
           <Routes>
            <Route path="/" element={<Mydashboard />} />
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
