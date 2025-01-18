import React from 'react';
import { Button, Typography, Box } from '@mui/material';

function DocumentIngestionOptions() {

    const handleLocalFileUpload = () => {
        // Implement local file upload logic here
        alert('Implement Local file upload logic');
        console.log("Implement file upload functionality")
    };

    return (
       <Box>
            <Typography variant="h6" component="h2">
               Ingest Document
            </Typography>
            <Button variant="contained" color="primary" onClick={handleLocalFileUpload}>
                Upload from local computer
            </Button>
        </Box>
    );
}

export default DocumentIngestionOptions;