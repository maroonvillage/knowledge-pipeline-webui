import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Typography, Box, CircularProgress,Button } from '@mui/material';

function FileDetail() {
    const { filename } = useParams();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [extracting, setExtracting] = useState(false);
    const [extractionStatus, setExtractionStatus] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:5001/get_file/${filename}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setFile(data);
            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filename]);

    const handleStartExtraction = async () => {
        setExtracting(true);
         setExtractionStatus("Starting Extraction...");
          try {
              const response = await fetch(`http://localhost:5001/extract/${filename}`, {
                  method: 'POST',
              });
  
              if (response.ok) {
                const data = await response.json();
                 setExtractionStatus(`Extraction Complete! ${data.message}`);
              } else {
                   const errorData = await response.json();
                   setExtractionStatus(`Extraction failed with error: ${errorData.error}`);
                  throw new Error(`Extraction failed with status: ${response.status}`);
              }
          } catch (error) {
               setError(error);
              setExtractionStatus(`Extraction failed with error: ${error.message}`);
          } finally {
              setExtracting(false);
          }
      };

    if (loading) {
        return <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px"><CircularProgress /></Box>;
    }

    if (error) {
        return <Typography color="error">Error: {error.message}</Typography>;
    }

    return (
        <Box>
            <Typography variant="h4">File Details</Typography>
            {file ? (
                file.found ? (  // Check if the file was found
                  <>
                     <Typography>Filename: {file.filename}</Typography>
                      <Typography>Size: {file.size} bytes</Typography>
                      <Typography>Upload Date: {file.time}</Typography>
                       {/* Add more details and action buttons here */}
                  </>
                ) : (
                    <Box>
                        <Typography>File "{filename}" not found.</Typography>
                        <Button variant="contained" color="primary" onClick={handleStartExtraction} disabled={extracting}>
                            {extracting ? 'Extracting...' : 'Start Extraction'}
                        </Button>
                        {extractionStatus && <Typography variant="body2">{extractionStatus}</Typography>}
                    </Box>
                )
            ) : (
                <Typography>No file information available.</Typography>
            )}
        </Box>
    );
}

export default FileDetail;