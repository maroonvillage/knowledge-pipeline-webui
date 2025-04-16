// src/components/FileDetail.js (MODIFIED)
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useParams, useNavigate } from 'react-router-dom'; // Removed Link for now
import {
    Typography,
    Box,
    CircularProgress,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    List, // For Side Nav
    ListItem, // For Side Nav
    ListItemButton, // For Side Nav
    ListItemText, // For Side Nav
    Paper, // To contain the side nav
    Divider // To separate nav items
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import logger from '../utils/logger'; // Import the logger

// Define views
const VIEWS = {
    OVERVIEW: 'Overview',
    SECTIONS: 'Sections',
    TABLES: 'Tables',
    KEYWORDS: 'Keywords',
};

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
    const [tablesDownloadUrl, setTablesDownloadUrl] = useState(null);
    const [keywordsDownloadUrl, setKeywordsDownloadUrl] = useState(null);
    const [openConfirmation, setOpenConfirmation] = useState(false);
    const [activeView, setActiveView] = useState(VIEWS.OVERVIEW); // State for active view

    // --- Data Fetching (Modified slightly for efficiency) ---
    useEffect(() => {
        let isMounted = true; // Prevent state updates on unmounted component
        const fetchData = async () => {
            setLoading(true);
            setError(null); // Reset error on new fetch
            setExtractionStatus(''); // Reset status

            try {
                const encodedFileName = encodeURIComponent(filename);
                const fileResponse = await fetch(`http://localhost:5001/get_file/${encodedFileName}`);
                if (!fileResponse.ok) throw new Error(`HTTP error! status: ${fileResponse.status}`);
                const fileData = await fileResponse.json();

                if (!isMounted) return;
                setFile(fileData);

                if (fileData?.processed) {
                    // Fetch details only if processed
                    const [sectionsRes, tablesRes, keywordsRes, tablesCheckRes, keywordsCheckRes] = await Promise.allSettled([
                        fetch(`http://localhost:5001/sections/${encodedFileName}`),
                        fetch(`http://localhost:5001/tables/${encodedFileName}`),
                        fetch(`http://localhost:5001/query_results/${encodedFileName}`),
                        fetch(`http://localhost:5001/check_tables_file/${encodedFileName}`),
                        fetch(`http://localhost:5001/check_keywords_file/${encodedFileName}`),
                    ]);

                    if (!isMounted) return;

                    setSections(sectionsRes.status === 'fulfilled' && sectionsRes.value.ok ? await sectionsRes.value.json() : []);
                    setTables(tablesRes.status === 'fulfilled' && tablesRes.value.ok ? await tablesRes.value.json() : []);
                    setKeywords(keywordsRes.status === 'fulfilled' && keywordsRes.value.ok ? await keywordsRes.value.json() : []);

                    if (tablesCheckRes.status === 'fulfilled' && tablesCheckRes.value.ok) {
                        const data = await tablesCheckRes.value.json();
                        setTablesDownloadUrl(`http://localhost:5001/download/tables/${data.tables_file}`);
                    } else {
                        setTablesDownloadUrl(null);
                    }

                    if (keywordsCheckRes.status === 'fulfilled' && keywordsCheckRes.value.ok) {
                        const data = await keywordsCheckRes.value.json();
                        setKeywordsDownloadUrl(`http://localhost:5001/download/keywords/${data.keywords_file}`);
                    } else {
                        setKeywordsDownloadUrl(null);
                    }

                } else {
                    // Reset if not processed
                    setSections([]);
                    setTables([]);
                    setKeywords([]);
                    setTablesDownloadUrl(null);
                    setKeywordsDownloadUrl(null);
                }

            } catch (err) {
                if (isMounted) setError(err);
                logger.error("Failed to fetch file details:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => { isMounted = false; }; // Cleanup function
    }, [filename]); // Rerun only when filename changes

    // Re-check file status after actions instead of full page reload
    const refreshFileStatus = async () => {
         try {
            const encodedFileName = encodeURIComponent(filename);
             const [tablesCheckRes, keywordsCheckRes] = await Promise.allSettled([
                 fetch(`http://localhost:5001/check_tables_file/${encodedFileName}`),
                 fetch(`http://localhost:5001/check_keywords_file/${encodedFileName}`),
             ]);

             if (tablesCheckRes.status === 'fulfilled' && tablesCheckRes.value.ok) {
                 const data = await tablesCheckRes.value.json();
                 setTablesDownloadUrl(`http://localhost:5001/download/tables/${data.tables_file}`);
             } else {
                 setTablesDownloadUrl(null);
             }

             if (keywordsCheckRes.status === 'fulfilled' && keywordsCheckRes.value.ok) {
                 const data = await keywordsCheckRes.value.json();
                 setKeywordsDownloadUrl(`http://localhost:5001/download/keywords/${data.keywords_file}`);
             } else {
                 setKeywordsDownloadUrl(null);
             }
         } catch (err) {
            logger.error("Failed to refresh file status:", err);
            // Optionally set an error state here
         }
    }

    // --- Handlers (Modified to refresh status instead of reload) ---
    const handleStartExtraction = async () => {
        setExtracting(true);
        setExtractionStatus("Starting Extraction...");
        try {
            logger.debug(`Starting extraction for: ${filename}`);
            const response = await fetch(`http://localhost:5001/extract/${encodeURIComponent(filename)}`, { method: 'POST' });

            const data = await response.json(); // Read response body for both success/error
            if (response.ok) {
                setExtractionStatus(`${data.message} - Refreshing data...`);
                // Trigger a refetch of all data after extraction completes
                 navigate(0); // Temporary: Keep reload until full state management is better
                // TODO: Replace reload with a call to a function that refetches *all* data (file, sections, tables, keywords)
            } else {
                setExtractionStatus(`Extraction failed: ${data.error || response.statusText}`);
                throw new Error(`Extraction failed: ${data.error || response.statusText}`);
            }
        } catch (error) {
            setError(error);
            setExtractionStatus(`Extraction error: ${error.message}`);
            logger.error("Extraction failed:", error);
        } finally {
            setExtracting(false);
        }
    };

    const handleGenerateTablesFile = async () => {
        setTablesFileGenerating(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:5001/generate_tables_file/${encodeURIComponent(filename)}`, { method: 'POST' });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || 'Failed to generate tables file');
            }
            await refreshFileStatus(); // Refresh download link status
        } catch (error) {
            setError(error);
            logger.error("Generate Tables File failed:", error);
        } finally {
            setTablesFileGenerating(false);
        }
    };

    const handleGenerateKeywordsFile = async () => {
        setKeywordsFileGenerating(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:5001/generate_keywords_file/${encodeURIComponent(filename)}`, { method: 'POST' });
             if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || 'Failed to generate keywords file');
             }
            await refreshFileStatus(); // Refresh download link status
        } catch (error) {
            setError(error);
            logger.error("Generate Keywords File failed:", error);
        } finally {
            setKeywordsFileGenerating(false);
        }
    };

    const handleClearData = async () => {
        setExtracting(true); // Reuse extracting state for indication
        setExtractionStatus("Clearing data...");
        setError(null);
        try {
            const response = await fetch(`http://localhost:5001/clear_data/${encodeURIComponent(filename)}`, { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                setExtractionStatus(`${data.message}`);
                setSections([]); // Clear data locally
                setTables([]);
                setKeywords([]);
                setTablesDownloadUrl(null);
                setKeywordsDownloadUrl(null);
                setFile(prev => prev ? { ...prev, processed: false } : null); // Mark as not processed
                return true; // Indicate success
            } else {
                setExtractionStatus(`Clear data failed: ${data.error || response.statusText}`);
                throw new Error(`Clear data failed: ${data.error || response.statusText}`);
            }
        } catch (error) {
            setError(error);
            setExtractionStatus(`Clear data error: ${error.message}`);
            logger.error("Clear data failed:", error);
            return false; // Indicate failure
        } finally {
             // Don't set extracting to false here if called before handleStartExtraction
        }
    };


    const handleOpenConfirmation = () => setOpenConfirmation(true);

    const handleCloseConfirmation = async (confirmed) => {
        setOpenConfirmation(false);
        if (confirmed) {
            setExtracting(true); // Show loading indicator immediately
            const cleared = await handleClearData();
            if (cleared) {
                // Only start extraction if clearing was successful
                await handleStartExtraction();
            } else {
                // If clearing failed, stop the process
                setExtracting(false);
            }
        }
    };

    // --- Columns Definition (Memoize for performance) ---
    // IMPORTANT: Ensure your API provides unique IDs or generate stable ones.
    // Using index as fallback here, but it's risky if data order changes.
    const sectionsColumns = useMemo(() => [
        { field: 'sectionTitle', headerName: 'Section Title', flex: 1, minWidth: 250 },
        { field: 'sectionContent', headerName: 'Section Content', flex: 2, minWidth: 400 },
    ], []);

    const tablesColumns = useMemo(() => [
        { field: 'tableTitle', headerName: 'Table Title', flex: 1, minWidth: 250 },
        { field: 'columns', headerName: 'Columns', flex: 1, minWidth: 150 },
        { field: 'rows', headerName: 'Rows', flex: 1, minWidth: 100, type: 'number' }, // Specify type if numeric
    ], []);

    const keywordsColumns = useMemo(() => [
        { field: 'keyword', headerName: 'Keyword', flex: 1, minWidth: 150 },
        { field: 'relevantContent', headerName: 'Relevant Content', flex: 3, minWidth: 400 },
    ], []);

    // --- Rendering Logic ---
    if (loading) {
        return <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px"><CircularProgress /></Box>;
    }

    // Dedicated error display
    if (error && !file) { // Show error prominently if file loading failed entirely
        return <Typography color="error">Error loading file details: {error.message}</Typography>;
    }

    // File not found or not uploaded state
    if (!file?.uploaded) {
         return (
            <Box>
                <Typography>File "{decodeURIComponent(filename)}" not found or not uploaded.</Typography>
                {/* Consider linking back or to upload */}
            </Box>
         );
    }

    // Main component structure
    return (
        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
            {/* Left Side Navigation */}
            <Paper sx={{ width: 200, flexShrink: 0 }}>
                <List dense> {/* dense makes items smaller */}
                    {Object.values(VIEWS).map((view) => (
                        <ListItem key={view} disablePadding>
                            <ListItemButton
                                selected={activeView === view}
                                onClick={() => setActiveView(view)}
                            >
                                <ListItemText primary={view} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {/* Right Side Content Area */}
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                 {/* Display general errors here */}
                 {error && <Typography color="error" paragraph>Operation failed: {error.message}</Typography>}

                {/* Overview Section */}
                {activeView === VIEWS.OVERVIEW && (
                    <Box>
                        <Typography variant="h5" gutterBottom>Overview</Typography>
                        <Typography>Filename: {file.filename}</Typography>
                        <Typography>Size: {file.size} bytes</Typography>
                        <Typography>Processed: {file.processed ? 'Yes' : 'No'}</Typography>
                        <Typography>Last Modified: {file.time || 'N/A'}</Typography> {/* Assuming 'time' is last modified */}
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                             <Button variant="contained" color="secondary" onClick={handleStartExtraction} disabled={extracting}>
                                 {extracting ? 'Processing...' : (file.processed ? 'Re-Extract Data' : 'Start Extraction')}
                             </Button>
                             {/* Add clear button separately if needed */}
                             {/* <Button variant="outlined" color="error" onClick={handleClearData} disabled={extracting || !file.processed}>
                                Clear Processed Data
                             </Button> */}
                        </Box>
                        {extractionStatus && (
                             <Typography variant="body2" sx={{ mt: 1, color: extractionStatus.includes('failed') || extractionStatus.includes('error') ? 'error.main' : 'text.secondary' }}>
                                 Status: {extractionStatus}
                             </Typography>
                        )}
                        {/* Display general file info and extraction controls */}
                    </Box>
                )}

                {/* Sections Grid */}
                {activeView === VIEWS.SECTIONS && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Sections</Typography>
                         { !file.processed ? <Typography>Extract data first to view sections.</Typography> :
                            <Box sx={{ height: 500, width: '100%' }}>
                                <DataGrid
                                    rows={sections}
                                    columns={sectionsColumns}
                                    getRowId={(row) => row.id || row.sectionTitle} // ** Use a real ID from API if available! **
                                    density="compact"
                                    pageSizeOptions={[10, 25, 50]}
                                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                                />
                             </Box>
                         }
                    </Box>
                )}

                {/* Tables Grid */}
                 {activeView === VIEWS.TABLES && (
                     <Box>
                         <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
                             <Typography variant="h6">Tables</Typography>
                             <Box display="flex" gap={1}>
                             {!tablesDownloadUrl && (<Button
                                     variant="contained"
                                     color="primary"
                                     onClick={handleGenerateTablesFile}
                                     disabled={tablesFileGenerating || !file.processed || extracting}
                                     size="small"
                                 >
                                     {tablesFileGenerating ? 'Generating...' : 'Generate Excel'}
                                 </Button>
                                 )}
                                 {tablesDownloadUrl && (
                                     <Button
                                         component="a"
                                         href={tablesDownloadUrl}
                                         download // Let browser handle filename
                                         variant="contained"
                                         color="success"
                                         disabled={extracting}
                                         size="small"
                                     >
                                         Download Excel
                                     </Button>
                                 )}
                             </Box>
                         </Box>
                          { !file.processed ? <Typography>Extract data first to view tables.</Typography> :
                             <Box sx={{ height: 500, width: '100%' }}>
                                 <DataGrid
                                     rows={tables}
                                     columns={tablesColumns}
                                     getRowId={(row) => row.id || row.tableTitle} // ** Use a real ID from API if available! **
                                     density="compact"
                                     pageSizeOptions={[10, 25, 50]}
                                     initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                                 />
                              </Box>
                          }
                     </Box>
                 )}


                {/* Keywords Grid */}
                 {activeView === VIEWS.KEYWORDS && (
                     <Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
                             <Typography variant="h6">Keyword Query Results</Typography>
                              <Box display="flex" gap={1}>
                              {!keywordsDownloadUrl && (<Button
                                     variant="contained"
                                     color="primary"
                                     onClick={handleGenerateKeywordsFile}
                                     disabled={keywordsFileGenerating || !file.processed || extracting}
                                     size="small"
                                 >
                                     {keywordsFileGenerating ? 'Generating...' : 'Generate Excel'}
                                 </Button>
                                    )}
                                 {keywordsDownloadUrl && (
                                     <Button
                                         component="a"
                                         href={keywordsDownloadUrl}
                                         download // Let browser handle filename
                                         variant="contained"
                                         color="success"
                                         disabled={extracting}
                                         size="small"
                                     >
                                         Download Excel
                                     </Button>
                                 )}
                             </Box>
                         </Box>
                         { !file.processed ? <Typography>Extract data first to view keyword results.</Typography> :
                             <Box sx={{ height: 500, width: '100%' }}>
                                 <DataGrid
                                     rows={keywords}
                                     columns={keywordsColumns}
                                     getRowId={(row) => row.id || row.keyword} // ** Use a real ID from API if available! **
                                     density="compact"
                                     pageSizeOptions={[10, 25, 50]}
                                     initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                                 />
                             </Box>
                         }
                     </Box>
                 )}

            </Box>

             {/* Confirmation Dialog (keep as is) */}
             <Dialog
                 open={openConfirmation}
                 onClose={() => handleCloseConfirmation(false)}
                 aria-labelledby="alert-dialog-title"
                 aria-describedby="alert-dialog-description"
             >
                 <DialogTitle id="alert-dialog-title">
                     {"Confirm Re-Extraction"}
                 </DialogTitle>
                 <DialogContent>
                     <DialogContentText id="alert-dialog-description">
                         Are you sure you want to start extraction? This will delete any existing processed data (sections, tables, keywords) for this file before starting.
                     </DialogContentText>
                 </DialogContent>
                 <DialogActions>
                     <Button onClick={() => handleCloseConfirmation(false)} color="primary">
                         Cancel
                     </Button>
                     <Button onClick={() => handleCloseConfirmation(true)} color="secondary" autoFocus>
                         Yes, Delete and Extract
                     </Button>
                 </DialogActions>
             </Dialog>
        </Box>
    );
}

export default FileDetail;