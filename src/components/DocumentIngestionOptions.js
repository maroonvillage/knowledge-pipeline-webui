import React, { useRef, useState } from 'react';
import { Button, Typography, LinearProgress, Grid2 } from '@mui/material';

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
    // Removed AppTheme, CssBaseline, SideMenu, AppNavbar wrappers
    // The outermost Box might be unnecessary if MainLayout handles padding
    // Use standard Grid for simple layouts unless Grid2 features are required
     <Grid2 container direction="column" spacing={2} justifyContent="center" alignItems="center" sx={{pt: 4}}> {/* Added Padding Top */}
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
          accept=".pdf" // Specify accepted file types
      />
      <Grid2 item sx={{ minHeight: '24px' }}> {/* Reserve space for file name */}
           {file && <Typography variant="body2">Selected File: {file.name}</Typography>}
     </Grid2>
      <Grid2 item>
         <Button variant="contained" color="secondary" onClick={handleUpload} disabled={uploading || !file}>
              {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
       </Grid2>
        {uploading && <Grid2 item sx={{width: '80%', maxWidth: '400px'}}> <LinearProgress /> </Grid2>}
        {uploadStatus && <Grid2 item> <Typography variant="body2" color={uploadStatus.includes('failed') || uploadStatus.includes('error') ? 'error' : 'textSecondary'}>{uploadStatus}</Typography></Grid2>}
    </Grid2>
 );
}

export default DocumentIngestionOptions;