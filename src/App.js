import './App.css';
import DocumentIngestionOptions from './components/DocumentIngestionOptions'
//import Dashboard from './dashboard/Dashboard'
import Mydashboard from './components/Mydashboard';
import FileDetail from './components/FileDetail';
import MainLayout from './components/MainLayout'; // Import the new layout
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';


function App() {
  return (
    <Router>
      {/* Wrap all routes within the MainLayout */}
      <Routes>
        <Route path="/" element={<MainLayout />}> {/* Use MainLayout as the parent route */}
          {/* Child routes will render inside MainLayout's <Outlet /> */}
          <Route index element={<Mydashboard />} /> {/* index route for "/" */}
          <Route path="upload" element={<DocumentIngestionOptions />} />
          <Route path="file/:filename" element={<FileDetail />} />
          {/* Add other routes here */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
