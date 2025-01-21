import React, { useRef, useState } from 'react';
import { Button, Typography, Box, LinearProgress } from '@mui/material';

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
           setUploadStatus(`Upload Successful! Filename: ${result.filename}`);
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
       <Box>
            <Typography variant="h6" component="h2">
               Ingest Document
            </Typography>
            <Button variant="contained" color="primary" onClick={handleLocalFileUpload}>
                Upload from local computer
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                style={{display: 'none'}}
                onChange={handleFileSelected}
            />
            {file && <Typography variant="body2">Selected File: {file.name}</Typography>}
             <Button variant="contained" color="secondary" onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Start Extraction'}
             </Button>
            {uploading && <LinearProgress />}
             {uploadStatus && <Typography variant="body2">{uploadStatus}</Typography>}
        </Box>
    );
}

export default DocumentIngestionOptions;