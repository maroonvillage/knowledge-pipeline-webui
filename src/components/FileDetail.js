import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Typography,
    Box,
    CircularProgress,
    Button,
    Grid2,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
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
    const [tablesFileGenerating, setTablesFileGenerating] = useState(false);
    const [keywordsFileGenerating, setKeywordsFileGenerating] = useState(false);
    const [tablesFileExists, setTablesFileExists] = useState(false);
    const [keywordsFileExists, setKeywordsFileExists] = useState(false);
    const [openConfirmation, setOpenConfirmation] = useState(false);
    const [tablesDownloadUrl, setTablesDownloadUrl] = useState(null);
    const [keywordsDownloadUrl, setKeywordsDownloadUrl] = useState(null);

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
                if (data.processed) {
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


                    // Check if the files already exist by making a get call to the api
                    const checkTablesFile = await fetch(`http://localhost:5001/check_tables_file/${filename}`);
                    if (checkTablesFile.ok) {
                       const checkTablesFileData = await checkTablesFile.json(); // Parse JSON here
                       setTablesFileExists(true);
                       setTablesDownloadUrl(`http://localhost:5001/download/tables/${checkTablesFileData.tables_file}`);
                    } else {
                       setTablesFileExists(false);
                       setTablesDownloadUrl(null);
                    }

                    const checkKeywordsFile = await fetch(`http://localhost:5001/check_keywords_file/${filename}`);
                    if (checkKeywordsFile.ok) {
                       const checkKeywordsFileData = await checkKeywordsFile.json(); // Parse JSON here
                       setKeywordsFileExists(true);
                       setKeywordsDownloadUrl(`http://localhost:5001/download/keywords/${checkKeywordsFileData.keywords_file}`);
                    } else {
                       setKeywordsFileExists(false);
                       setKeywordsDownloadUrl(null);
                    }
                }
                else{
                    setTablesFileExists(false);
                    setKeywordsFileExists(false);
                }

            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filename, extractionStatus, tablesFileExists, keywordsFileExists]);

    /*
    Handlers
    */
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
      const handleGenerateTablesFile = async () => {
        setTablesFileGenerating(true);
        try {
            const response = await fetch(`http://localhost:5001/generate_tables_file/${filename}`, {
                method: 'POST',
            });
            if (response.ok) {
                setTablesFileExists(true);
            } else {
                throw new Error('Failed to generate tables file');
            }
        } catch (error) {
            setError(error);
        } finally {
            setTablesFileGenerating(false);
            // Need to trigger a re-render of the page to update the file listing
            window.location.reload()
        }
    };

    const handleGenerateKeywordsFile = async () => {
        setKeywordsFileGenerating(true);
        try {
            const response = await fetch(`http://localhost:5001/generate_keywords_file/${filename}`, {
                method: 'POST',
            });
            if (response.ok) {
                setKeywordsFileExists(true);
            } else {
                throw new Error('Failed to generate keywords file');
            }
        } catch (error) {
            setError(error);
        } finally {
            setKeywordsFileGenerating(false);
            // Need to trigger a re-render of the page to update the file listing
            window.location.reload()
        }
    };

    const handleClearData = async () => {
        setExtracting(true);
        setExtractionStatus("Clearing data");
          try {
              const response = await fetch(`http://localhost:5001/clear_data/${filename}`, {
                  method: 'POST',
              });
              
              if (response.ok) {
                const errorData = await response.json();
                setExtractionStatus(`Clear data failed with error: ${errorData.error}`);
                setTablesFileExists(false);
                setKeywordsFileExists(false);
            } else {
                  const errorData = await response.json();
                  setExtractionStatus(`Clear data failed with error: ${errorData.error}`);
                  throw new Error(`Extraction failed with status: ${response.status}`);
              }
          } catch (error) {
               setError(error);
              setExtractionStatus(`Clear data failed with error: ${error.message}`);
          } finally {
              setExtracting(false);
          }
     }

    const handleOpenConfirmation = () => {
        setOpenConfirmation(true);
    };
    const handleCloseConfirmation = (confirmed) => {
        setOpenConfirmation(false);
        if (confirmed) {
            setExtracting(true);
            // Call the extraction endpoint and update tables and keywords list.
            handleClearData();
            handleStartExtraction();
        }
    };

    const handleReload = () => {
        navigate(0); // Reload the current page
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
                file.uploaded ? (
                    <>
                        <Typography>Filename: {file.filename}</Typography>
                        <Typography>Size: {file.size} bytes</Typography>
                        <Button variant="contained" color="secondary" onClick={handleOpenConfirmation} disabled={extracting}>
                            {extracting ? 'Extracting...' : 'Start Extraction'}
                        </Button>
                        {extractionStatus && (
                            <Box>
                                <Typography variant="body2">{extractionStatus}</Typography>
                                {extractionStatus.startsWith('Extraction Complete') && (
                                    <Button variant="contained" color="primary" onClick={handleReload}>
                                        Reload Page
                                    </Button>
                                )}
                            </Box>
                        )}

                        <Grid2 container spacing={2}>
                            <Grid2 item xs={12} md={6}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6">Tables</Typography>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleGenerateTablesFile}
                                        disabled={tablesFileGenerating || tablesFileExists}
                                    >
                                        {tablesFileGenerating ? 'Generating...' : 'Generate Tables File'}
                                    </Button>
                                    {tablesDownloadUrl && (
                                        <Button
                                            component="a"
                                            href={tablesDownloadUrl}
                                            download
                                            variant="contained"
                                            color="success"
                                        >
                                            Download Tables
                                        </Button>
                                    )}
                                </Box>
                                <div style={{ height: 300, width: '100%' }}>
                                    <DataGrid
                                        rows={tables}
                                        columns={tablesColumns}
                                        getRowId={(row) => row.tableTitle}  // Adjust to a unique identifier
                                    />
                                </div>
                            </Grid2>
                            <Grid2 item xs={12} md={6}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6">Keyword Query Results</Typography>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleGenerateKeywordsFile}
                                        disabled={keywordsFileGenerating || keywordsFileExists}
                                    >
                                        {keywordsFileGenerating ? 'Generating...' : 'Generate Keywords File'}
                                    </Button>
                                    {keywordsFileExists && (
                                        <Button
                                            component="a"
                                            href={keywordsDownloadUrl}
                                            download
                                            variant="contained"
                                            color="success"
                                        >
                                            Download Keywords
                                        </Button>
                                    )}
                                </Box>
                                <div style={{ height: 300, width: '100%' }}>
                                    <DataGrid
                                        rows={keywords}
                                        columns={keywordsColumns}
                                        getRowId={(row) => row.keyword}  // Adjust to a unique identifier
                                    />
                                </div>
                            </Grid2>
                            <Grid2 item xs={12} md={6}>
                                <Typography variant="h6">Sections</Typography>
                                <div style={{ height: 300, width: '100%' }}>
                                    <DataGrid
                                        rows={sections}
                                        columns={sectionsColumns}
                                        getRowId={(row) => row.sectionTitle}  // Adjust to a unique identifier
                                    />
                                </div>
                            </Grid2>
                        </Grid2>
                        <Dialog
                            open={openConfirmation}
                            onClose={() => handleCloseConfirmation(false)}
                            aria-labelledby="alert-dialog-title"
                            aria-describedby="alert-dialog-description"
                        >
                         <DialogTitle id="alert-dialog-title">
                             {"Overwrite Existing Data?"}
                         </DialogTitle>
                         <DialogContent>
                             <DialogContentText id="alert-dialog-description">
                                 Are you sure you want to start extraction? All existing data for this file will be deleted.
                             </DialogContentText>
                         </DialogContent>
                         <DialogActions>
                             <Button onClick={() => handleCloseConfirmation(false)} color="primary">
                                 No
                             </Button>
                             <Button onClick={() => handleCloseConfirmation(true)} color="primary" autoFocus>
                                 Yes
                             </Button>
                         </DialogActions>
                      </Dialog>
                    </>
                ) : (
                    <Box>
                        <Typography>File "{file.filename}" not found.</Typography>
                        <Button component={Link} to="/upload" variant="contained" color="primary">
                            Upload File
                        </Button>
                    </Box>
                )
            ) : (
                <Typography>No file information available.</Typography>
            )}
        </Box>
    );
}

export default FileDetail;