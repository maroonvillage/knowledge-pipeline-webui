import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    loading: false,
    uploading: false,
    extractedData: null,
    tableData: null,
    progress: 0,
    error: null,
};

const extractionSlice = createSlice({
    name: 'extraction',
    initialState,
    reducers: {
       setLoading: (state, action) => {
        state.loading = action.payload;
       },
       setUploading: (state, action) => {
         state.uploading = action.payload;
       },
       setExtractedData: (state, action) => {
        state.extractedData = action.payload
       },
      setTableData: (state, action) => {
        state.tableData = action.payload
       },
      setProgress: (state, action) => {
        state.progress = action.payload
      },
       setError: (state, action) => {
         state.error = action.payload
      }
    },
});

export const { setLoading, setUploading, setExtractedData, setTableData, setProgress, setError } = extractionSlice.actions;

export default extractionSlice.reducer;