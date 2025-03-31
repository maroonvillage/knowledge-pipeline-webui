import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
//import { render } from '@testing-library/react';



function FileListGrid() {

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await fetch('http://localhost:5001/get_files');
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setFiles(data);
          } catch (error) {
            setError(error);
          } finally {
            setLoading(false);
          }
        };
    
        fetchData();
      }, []);

      const columns = [
        { field: 'filename', headerName: 'Document Title', flex: 1.5, minWidth: 200,
          renderCell: (params) => (
              <Typography component={Link} to={`/file/${encodeURIComponent(params.row.filename)}`} variant="body2" sx={{ textDecoration: 'none', color: 'inherit' }}>
                  {params.value}
              </Typography>
          ), },
        {
          field: 'size',
          headerName: 'Size',
          headerAlign: 'right',
          align: 'right',
          flex: 1,
          minWidth: 80,
        },
        {
          field: 'time',
          headerName: 'Upload Date',
          headerAlign: 'right',
          align: 'right',
          flex: 1,
          minWidth: 100,
        }
      ];
    
      if (loading) {
        return <div>Loading files...</div>;
      }
    
      if (error) {
        return <div>Error: {error.message}</div>;
      }

  return (
    <DataGrid
      checkboxSelection
      rows={files}
      columns={columns}
      getRowClassName={(params) =>
        params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
      }
      initialState={{
        pagination: { paginationModel: { pageSize: 20 } },
      }}
      pageSizeOptions={[10, 20, 50]}
      disableColumnResize
      density="compact"
      slotProps={{
        filterPanel: {
          filterFormProps: {
            logicOperatorInputProps: {
              variant: 'outlined',
              size: 'small',
            },
            columnInputProps: {
              variant: 'outlined',
              size: 'small',
              sx: { mt: 'auto' },
            },
            operatorInputProps: {
              variant: 'outlined',
              size: 'small',
              sx: { mt: 'auto' },
            },
            valueInputProps: {
              InputComponentProps: {
                variant: 'outlined',
                size: 'small',
              },
            },
          },
        },
      }}
    />
  );
}

export default FileListGrid;