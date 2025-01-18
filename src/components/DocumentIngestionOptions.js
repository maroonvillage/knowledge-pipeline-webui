import React, {useRef, useState} from 'react';
import { Button, Typography, Box, LinearProgress } from '@mui/material';

function DocumentIngestionOptions() {

    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false)

    const handleLocalFileUpload = () => {
        // Implement local file upload logic here
        //alert('Implement Local file upload logic');
        //console.log("Implement file upload functionality")
        fileInputRef.current.click();
    };

    const handleFileSelected = (event) => {
        const file = event.target.files[0];
        if (file) {
           // Implement file upload logic here
           //alert(`File name is: ${file.name}`);
           //console.log("Selected file:", file);
           setFile(file);
        }
    };

    const handleUpload = () => {
        if (!file) {
            alert("Please select a file");
            return;
        }
        setUploading(true);
       // Here you will implement the file upload to your backend
       alert(`File name: ${file.name}, File type: ${file.type}, File size: ${file.size}`);
       console.log("Selected file:", file);
       setUploading(false);

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
        </Box>
    );
}

export default DocumentIngestionOptions;