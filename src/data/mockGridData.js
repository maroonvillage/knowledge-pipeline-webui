import * as React from 'react';


export const columns = [
  { field: 'docTitle', headerName: 'Document Title', flex: 1.5, minWidth: 200 },
  {
    field: 'size',
    headerName: 'Size',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 80,
  },
  {
    field: 'uploadDate',
    headerName: 'Upload Date',
    headerAlign: 'right',
    align: 'right',
    flex: 1,
    minWidth: 100,
  }
];

export const rows = [
  {
    id: 1,
    docTitle: 'AI Compliance Document 1',
    size: '1.5 MB',
    uploadDate: '12/15/2025'
   
  },
  {
    id: 2,
    docTitle: 'AI Compliance Document 2',
    size: '1.8 MB',
    uploadDate: '1/11/2025'
   
  },
];
