import { configureStore } from '@reduxjs/toolkit';
import extractionReducer from './extractionSlice';

const store = configureStore({
    reducer: {
        extraction: extractionReducer, // Add reducers here
    },
});

export default store;