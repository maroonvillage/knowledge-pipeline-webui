# backend/services/file_processing.py
import os
from fastapi import UploadFile
from models.file_metadata import FileMetadata
from typing import List
import pdfdocintel


async def process_file(file: UploadFile, upload_folder:str) -> FileMetadata:
    try:
        filename = os.path.join(upload_folder, file.filename)
        with open(filename, "wb") as f:
          while contents := await file.read(1024):
              f.write(contents)
        file_metadata = await get_file_metadata(filename)
        return file_metadata
    except Exception as e:
        raise e

async def get_file_metadata(filename:str) -> FileMetadata:
    # Replace with your file processing logic here
    # For now, just return the file name
    file_size = os.path.getsize(filename)
    file_date = os.path.getctime(filename)
    return FileMetadata(filename=filename, size=file_size, time=file_date)

async def get_files_from_dir(directory,extension='.json'):

    files =  os.listdir(directory)
    if(extension!=None):
        # Filter the list to include only JSON files 
        filtered_files = [f for f in files if f.endswith(extension)]
    else:
         # Filter the list to include only JSON files 
        filtered_files = [f for f in files]

    return filtered_files