import React, { useRef, useState } from 'react';
import { Button, Typography, Box, LinearProgress, Alert } from '@mui/material';
import { getConfig } from '../utils/config';

function DocumentIngestionOptions() {
    const fileInputRef = useRef(null);
    const [selectedFile, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    //const [uploadStatus, setUploadStatus] = useState('');
   
    const [uploadStatus, setUploadStatus] = useState({ message: '', type: '' }); // 'success', 'error'



const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setUploadStatus({ message: '', type: '' }); // Set as object or reset to initial object state
            setUploadProgress(0);
        }
    };

const handleUpload = async () => {
    if (!selectedFile) {
        setUploadStatus({ message: "Please select a file", type: "error" });
        return;
    }
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus({ message: 'Preparing upload...', type: 'info' })

    const formData = new FormData();
    formData.append('file', selectedFile);
    // STAGE 1: Get Presigned URL
    
    try {
        let uploadUrl, objectKey, backendContentType;
        try {
            // 1. Get Presigned URL from your backend
            // Pass filename and content_type as query parameters
                // const params = new URLSearchParams({
                //     filename: encodeURIComponent(selectedFile.name),
                //     content_type: encodeURIComponent(selectedFile.type || 'application/octet-stream') // Fallback if file.type is missing
                // });
                const filename = encodeURIComponent(selectedFile.name);
                const content_type = encodeURIComponent(selectedFile.type || 'application/octet-stream'); // Fallback if file.type is missing
                const config = getConfig();
                const API_ENDPOINT = config?.DNS_PUBLIC_NAME ?? ''; 
                const presignedUrlEndpoint = `${API_ENDPOINT}/api/generate-presigned-url/${filename}?content_type=${content_type}`;

                const presignedUrlResponse = await fetch(presignedUrlEndpoint);
                console.log('[DEBUG] Fetching presigned URL from:', presignedUrlEndpoint);
                console.log('[DEBUG] Presigned URL Response Status:', presignedUrlResponse.status);
                if (!presignedUrlResponse.ok) {
                    //const errorData = await presignedUrlResponse.json().catch(() => ({ detail: "Failed to get upload URL." }));
                    //throw new Error(errorData.detail || `Failed to get upload URL: ${presignedUrlResponse.statusText}`);
                    // Try to parse JSON, if it fails, get text, then throw.
                    let errorDetailMessage = `Failed to get upload URL: ${presignedUrlResponse.status} ${presignedUrlResponse.statusText}`;
                    try {
                        const errorData = await presignedUrlResponse.json();
                        errorDetailMessage = errorData.detail || errorDetailMessage;
                    } catch (jsonParseError) {
                        try {
                            const textError = await presignedUrlResponse.text();
                            console.error("Non-JSON error response from presigned URL endpoint:", textError.substring(0, 500));
                            errorDetailMessage += ` - Server Response: ${textError.substring(0,100)}`;
                        } catch (textParseError) {
                            console.error("Could not parse error response as JSON or text.");
                        }
                    }
                    throw new Error(errorDetailMessage);
                }
                const jsonData = await presignedUrlResponse.json();
                uploadUrl = jsonData.uploadUrl;
                objectKey = jsonData.objectKey;
                backendContentType = jsonData.content_type; // Use the content type from the response if available
                console.log('[DEBUG] Got presigned URL:', uploadUrl, 'Object Key:', objectKey);
            } catch (presignedError) {
                console.error("ERROR GETTING PRESIGNED URL:", presignedError);
                setUploadStatus({ message: `Failed to prepare upload: ${presignedError.message}`, type: 'error' });
                setUploading(false);
                return; // Stop further execution
            }

            setUploadStatus({ message: 'Uploading to S3...', type: 'info' });
            try {

                if (selectedFile.type !== backendContentType) {
                    setUploadStatus({
                        message: `Content-Type mismatch. Expected '${backendContentType}' but got '${selectedFile.type}'.`,
                        type: 'error'
                    });
                    console.warn('[GUARD] Aborting upload due to Content-Type mismatch.');
                    return;
                    }

                // 2. Upload the file directly to S3 using the presigned URL
                const xhr = new XMLHttpRequest(); // Using XHR for progress tracking

                xhr.open('PUT', uploadUrl, true);
                //Comment out request header if not needed, since the pre-signed-url was not signed with the content type.
                xhr.setRequestHeader('Content-Type', selectedFile.type || 'application/octet-stream');
                console.log('[DEBUG] XHR opened. Uploading with Content-Type:', selectedFile.type || 'application/octet-stream');
                // You might need to set other headers if your S3 policy/CORS requires them,
                // or if you included them in the presigned URL generation (e.g., x-amz-acl)

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(percentComplete);
                    }
                };

                xhr.onload = () => {
                    console.log('[DEBUG] XHR onload triggered. Status:', xhr.status);
                    try{
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
                            let s3ErrorMessage = `S3 upload failed: ${xhr.status} ${xhr.statusText}`;
                            if (xhr.responseText) {
                                console.error('[DEBUG] S3 Raw Error Response:', xhr.responseText);
                                const parser = new DOMParser();
                                const xmlDoc = parser.parseFromString(xhr.responseText, "text/xml");
                                const messageNode = xmlDoc.getElementsByTagName("Message")[0];
                                if (messageNode) {
                                    s3ErrorMessage += ` - S3 Message: ${messageNode.textContent}`;
                                }
                            }
                            setUploadStatus({ message: s3ErrorMessage, type: 'error' });
                            console.error('S3 Upload Error:', xhr.status, xhr.responseText);
                        }
                    } catch (onloadError) {
                        console.error("ERROR IN XHR ONLOAD LOGIC:", onloadError);
                        setUploadStatus({ message: `Error processing upload response: ${onloadError.message}`, type: 'error' });
                    } finally {
                        setUploading(false);
                    }
                };

                xhr.onerror = () => {
                    try {
                        setUploadStatus({ message: 'S3 upload failed due to network error or CORS issue.', type: 'error' });
                        console.error('S3 Upload Network Error or CORS. Check S3 bucket CORS configuration and network.');
                    } catch (onerrorError) {
                        console.error("ERROR IN XHR ONERROR LOGIC:", onerrorError);
                    } finally {
                        setUploading(false);
                    }
                };

                xhr.send(selectedFile);
                console.log('[DEBUG] XHR send initiated.');
            } catch (s3UploadError) {
                console.error("ERROR INITIATING S3 UPLOAD (XHR setup/send):", s3UploadError);
                setUploadStatus({ message: `S3 upload initiation failed: ${s3UploadError.message}`, type: 'error' });
                setUploading(false);
            }
    } catch (generalError) {
         setUploadStatus({ message: `Upload Failed with error: ${generalError.message}`, type: 'error' });
       //console.error('There was an error:', error);
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
        {selectedFile && (
            <Typography variant="body1">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </Typography>
        )}
        <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
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