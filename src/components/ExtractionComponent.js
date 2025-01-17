import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setLoading } from '../store/extractionSlice';
import { Button, Typography } from '@mui/material';

function ExtractionComponent() {
   const loading = useSelector((state) => state.extraction.loading);
   const dispatch = useDispatch();

   const handleLoading = () => {
       dispatch(setLoading(true));
   };

   return (
     <div>
       <Typography variant="h4" component="h1">
           Extraction Options
       </Typography>
       <Button variant="contained" color="primary" onClick={handleLoading}>
           Start Loading
       </Button>
       {loading && (
          <Typography variant="body1" color="textSecondary">
              Loading...
          </Typography>
       )}
      </div>
  );
}

export default ExtractionComponent;