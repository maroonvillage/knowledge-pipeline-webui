import React, { useRef, useState } from 'react';
import { Button, Typography, Box, LinearProgress, Alert } from '@mui/material';

function DocumentIngestionOptions() {
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    //const [uploadStatus, setUploadStatus] = useState('');
   
    const [uploadStatus, setUploadStatus] = useState({ message: '', type: '' }); // 'success', 'error'



const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setUploadStatus('');
            setUploadProgress(0);
        }
    };

const handleUpload = async () => {
    if (!file) {
        setUploadStatus("Please select a file");
        return;
    }
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus({ message: 'Preparing upload...', type: 'info' })

    const formData = new FormData();
    formData.append('file', file);


    try {
/*       const response = await fetch(`/api/upload`, {
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
        } */

        // 1. Get Presigned URL from your backend
            // Ensure your React dev server proxy or Nginx proxy is set up for /api routes
        const presignedUrlResponse = await fetch(
            // Make sure your API prefix is correct for your setup (proxy or Nginx)
            `/api/generate-presigned-url/${encodeURIComponent(file.name)}`
            );
            if (!presignedUrlResponse.ok) {
                const errorData = await presignedUrlResponse.json().catch(() => ({ detail: "Failed to get upload URL." }));
                throw new Error(errorData.detail || `Failed to get upload URL: ${presignedUrlResponse.statusText}`);
            }
            const { uploadUrl, objectKey } = await presignedUrlResponse.json();
            setUploadStatus({ message: 'Uploading to S3...', type: 'info' });

            // 2. Upload the file directly to S3 using the presigned URL
            const xhr = new XMLHttpRequest(); // Using XHR for progress tracking

            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('Content-Type', file.type);
            // You might need to set other headers if your S3 policy/CORS requires them,
            // or if you included them in the presigned URL generation (e.g., x-amz-acl)

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    setUploadStatus({ message: `File uploaded successfully! Object key: ${objectKey}`, type: 'success' });
                    console.log('S3 Upload successful, ETag:', xhr.getResponseHeader('ETag'));

                    // You might want to notify your backend that the upload is complete
                    // and pass the objectKey or other metadata.
                    // E.g., fetch('/api/file-upload-complete', { method: 'POST', body: JSON.stringify({ objectKey, filename: selectedFile.name }) });
                    //file(null); // Clear selection after successful upload
                    setFile(null); // Clear selected file
                    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
                } else {
                    setUploadStatus({ message: `S3 upload failed: ${xhr.status} ${xhr.statusText} - ${xhr.responseText.substring(0,100)}`, type: 'error' });
                    console.error('S3 Upload Error:', xhr.status, xhr.responseText);
                }
                setUploading(false);
            };

            xhr.onerror = () => {
                setUploadStatus({ message: 'S3 upload failed due to network error or CORS issue.', type: 'error' });
                console.error('S3 Upload Network Error or CORS. Check S3 bucket CORS configuration and network.');
                setUploading(false);
            };

            xhr.send(file);

    } catch (error) {
         setUploadStatus(`Upload Failed with error: ${error.message}`)
       console.error('There was an error:', error);
    } finally {
       setUploading(false);
    }


};

return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3 }}>
        <Typography variant="h6">Upload File Directly to S3</Typography>
        <Button variant="outlined" component="label">
            Select File
            <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={handleFileSelect}
            />
        </Button>
        {file && (
            <Typography variant="body1">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </Typography>
        )}
        <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!file || uploading}
        >
            {uploading ? `Uploading... ${uploadProgress}%` : 'Upload to S3'}
        </Button>
        {uploading && (
            <Box sx={{ width: '100%', maxWidth: 400 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
        )}
        {uploadStatus.message && (
            <Alert severity={uploadStatus.type || 'info'} sx={{ mt: 2, width: '100%', maxWidth: 400 }}>
                {uploadStatus.message}
            </Alert>
        )}
    </Box>
);
}

export default DocumentIngestionOptions;