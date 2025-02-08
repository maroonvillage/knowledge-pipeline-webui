import './App.css';
import DocumentIngestionOptions from './components/DocumentIngestionOptions'
//import Dashboard from './dashboard/Dashboard'
import Mydashboard from './components/Mydashboard';
import FileDetail from './components/FileDetail';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';


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
            <Route path="/file/:filename" element={<FileDetail />} />
           </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
