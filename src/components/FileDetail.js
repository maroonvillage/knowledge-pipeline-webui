import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Typography, Box, CircularProgress,Button, Grid2 } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import logger from '../utils/logger'; // Import the logger

function FileDetail() {
    const { filename } = useParams();
    const [file, setFile] = useState(null);
    const [sections, setSections] = useState([]);
    const [tables, setTables] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [extracting, setExtracting] = useState(false);
    const [extractionStatus, setExtractionStatus] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:5001/get_file/${filename}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setFile(data);


                // Fetch additional data if the file is found
                if (data.found) {
                    const sectionsResponse = await fetch(`http://localhost:5001/sections/${filename}`);
                    const tablesResponse = await fetch(`http://localhost:5001/tables/${filename}`);
                    const keywordsResponse = await fetch(`http://localhost:5001/query_results/${filename}`);

                    const [sectionsData, tablesData, keywordsData] = await Promise.all([
                        sectionsResponse.ok ? sectionsResponse.json() : Promise.resolve([]),
                        tablesResponse.ok ? tablesResponse.json() : Promise.resolve([]),
                        keywordsResponse.ok ? keywordsResponse.json() : Promise.resolve([]),
                    ]);

                    setSections(sectionsData);
                    setTables(tablesData);
                    setKeywords(keywordsData);
                }

            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filename, extractionStatus]);

    const handleStartExtraction = async () => {
        setExtracting(true);
         setExtractionStatus("Starting Extraction...");
          try {
              logger.debug(filename)
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

    const sectionsColumns = [
        { field: 'sectionTitle', headerName: 'Section Title', width: 300 },
        { field: 'sectionContent', headerName: 'Section Content', width: 600 },
    ];

    const tablesColumns = [
        { field: 'tableTitle', headerName: 'Table Title', width: 300 },
        { field: 'columns', headerName: 'Columns', width: 150 },
        { field: 'rows', headerName: 'Rows', width: 150 },
    ];

    const keywordsColumns = [
        { field: 'keyword', headerName: 'Keyword', width: 200 },
        { field: 'relevantContent', headerName: 'Relevant Content', width: 600 },
    ];

    const handleReload = () => {
        navigate(0); // Reload the current page
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
                       <Grid2 container spacing={2}>
                            <Grid2 item xs={12} md={4}>
                                <Typography variant="h6">Sections</Typography>
                                <div style={{ height: 300, width: '100%' }}>
                                    <DataGrid
                                        rows={sections}
                                        columns={sectionsColumns}
                                        getRowId={(row) => row.sectionTitle}  // Adjust to a unique identifier
                                    />
                                </div>
                            </Grid2>
                            <Grid2 item xs={12} md={4}>
                                <Typography variant="h6">Tables</Typography>
                                <div style={{ height: 300, width: '100%' }}>
                                    <DataGrid
                                        rows={tables}
                                        columns={tablesColumns}
                                        getRowId={(row) => row.tableTitle}  // Adjust to a unique identifier
                                    />
                                </div>
                            </Grid2>
                            <Grid2 item xs={12} md={4}>
                                <Typography variant="h6">Keyword Query Results</Typography>
                                <div style={{ height: 300, width: '100%' }}>
                                    <DataGrid
                                        rows={keywords}
                                        columns={keywordsColumns}
                                        getRowId={(row) => row.keyword}  // Adjust to a unique identifier
                                    />
                                </div>
                            </Grid2>
                        </Grid2>
                  </>
                ) : (
                    <Box>
                        <Typography>File "{filename}" not found.</Typography>
                        <Button variant="contained" color="primary" onClick={handleStartExtraction} disabled={extracting}>
                            {extracting ? 'Extracting...' : 'Start Extraction'}
                        </Button>
                        {extractionStatus &&
                            <Box>
                                <Typography variant="body2">{extractionStatus}</Typography>
                                {extractionStatus.startsWith('Extraction Complete') && (
                                    <Button variant="contained" color="primary" onClick={handleReload}>
                                        Reload Page
                                    </Button>
                                )}
                            </Box>}
                    </Box>
                )
            ) : (
                <Typography>No file information available.</Typography>
            )}
        </Box>
    );
}

export default FileDetail;