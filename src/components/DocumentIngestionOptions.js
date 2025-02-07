import React, { useRef, useState } from 'react';
import { Button, Typography, Box, LinearProgress, Grid2 } from '@mui/material';
import AppTheme from '../shared-theme/AppTheme';
import CssBaseline from '@mui/material/CssBaseline';
import AppNavbar from './_dashboard_components/AppNavbar';
import SideMenu from './_dashboard_components/SideMenu';

function DocumentIngestionOptions() {
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    const handleLocalFileUpload = () => {
        fileInputRef.current.click();
    };

    const handleFileSelected = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setUploadStatus('');
        }
    };

const handleUpload = async () => {
    if (!file) {
        setUploadStatus("Please select a file");
        return;
    }
    setUploading(true);
     setUploadStatus("Uploading...")

    const formData = new FormData();
    formData.append('file', file);


    try {
      const response = await fetch('http://localhost:5001/upload', {
            method: 'POST',
            body: formData,
      });
        if (response.ok) {
           const result = await response.json();
           //setUploadStatus(`Upload Successful! Filename: ${result.filename}`);
           setUploadStatus(`Upload Successful! Filename: ${result.filename}, File size: ${result.size}, File change time: ${result.time}`);
        } else{
            const errorData = await response.json();
            setUploadStatus(`Upload failed with error: ${errorData.error}`)
        }
    } catch (error) {
         setUploadStatus(`Upload Failed with error: ${error.message}`)
       console.error('There was an error:', error);
    } finally {
       setUploading(false);
    }


};

    return (
        <AppTheme>
        <CssBaseline enableColorScheme />
       
        <Box sx={{ flexGrow: 1}}>
        <SideMenu />
        <AppNavbar />
       <Grid2 container direction="column" spacing={2} justifyContent="center" alignItems="center">
          <Grid2 item>
            <Typography variant="h6" component="h2">
              Ingest Document
            </Typography>
         </Grid2>
         <Grid2 item>
           <Button variant="contained" color="primary" onClick={handleLocalFileUpload}>
               Select from local computer
           </Button>
         </Grid2>
         <input
             type="file"
             ref={fileInputRef}
             style={{display: 'none'}}
             onChange={handleFileSelected}
         />
         <Grid2 item>
              {file && <Typography variant="body2">Selected File: {file.name}</Typography>}
        </Grid2>
         <Grid2 item>
            <Button variant="contained" color="secondary" onClick={handleUpload} disabled={uploading}>
                 {uploading ? 'Uploading...' : 'Upload File'}
             </Button>
          </Grid2>
           {uploading &&  <Grid2 item> <LinearProgress /> </Grid2>}
           {uploadStatus &&  <Grid2 item> <Typography variant="body2">{uploadStatus}</Typography></Grid2>}
       </Grid2>
  </Box>
        </AppTheme>
    );
}

export default DocumentIngestionOptions;