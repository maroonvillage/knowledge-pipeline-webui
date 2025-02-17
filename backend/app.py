import asyncio
import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import json
import os
from pydantic import BaseModel
from typing import Any, List
from fastapi.middleware.cors import CORSMiddleware
from services.file_processing import process_file, get_files_from_dir, call_pdfdocintel_extraction, \
    get_file_metadata, check_file
from services.data_service import get_document_sections, get_keyword_query_results, get_document_tables
from models.file_metadata import FileMetadata
from models.section import Section
from models.table import Table
from models.keyword_query_result import KeywordQueryResult
from pdfdocintel import find_file_by_prefix, strip_non_alphanumeric


app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:3000",  # Add your React app's URL here
    "http://127.0.0.1:3000",  # Add this as well if you use 127.0.0.1 instead
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JSON_FOLDER = "./files/output/json"
UPLOAD_FOLDER = "./files/uploads"
PROCESSED_FOLDER = "./files/output/processed"
QRY_RESULTS_FOLDER = "./files/output/query_results"

PROCESSED_EXT = ".processed"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)



def load_mock_data(filename: str, data_model: BaseModel):
    """Loads mock data from a JSON file."""
    try:
        with open(f"files/output/{filename}", 'r') as f:
           data = json.load(f)
           return [data_model(**item) for item in data]
    except FileNotFoundError:
        return []  # Return an empty list if file is not found
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return []  # Return an empty list if there is an error loading.
    
    
    

@app.post("/upload", response_model = FileMetadata)
async def upload_file(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file selected")

    try:
        file_metadata:FileMetadata = await process_file(file, UPLOAD_FOLDER)
        return file_metadata
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get_files", response_model=List[Any])
async def get_files():
    files_from_dir = await get_files_from_dir(UPLOAD_FOLDER, extension='.pdf')
    files_list = []
    id = 1
    for file in files_from_dir:
        full_path = os.path.join(UPLOAD_FOLDER, file)
        fm = await get_file_metadata(full_path)
        # Convert creation time to a human-readable date
        creation_date = datetime.datetime.fromtimestamp(fm.time)
        file_data = {
            "id": id,
            "filename": os.path.basename(fm.filename),
            "size": fm.size,
            "time": creation_date
        }
        id += 1
        files_list.append(file_data)
    return files_list

@app.get("/get_file/{filename}", response_model=FileMetadata)
async def get_file(filename: str):
    
    try:
        #Make call to the service layer to check 'processed' folder
        #if a file is present that corresponds to the filename clicked in the UI
        #  display details related to the file
        # if not, display a button to start the extraction process
        file_name, extension = os.path.splitext(filename)
        process_file = os.path.join(PROCESSED_FOLDER, f'{file_name}{PROCESSED_EXT}')
        if(await check_file(process_file)):
            full_path = os.path.join(UPLOAD_FOLDER, filename)
            fm = await get_file_metadata(full_path)
            # Convert creation time to a human-readable date
            creation_date = datetime.datetime.fromtimestamp(fm.time)
            fm.found = True
            return fm
        else:
            return FileMetadata(filename=filename, size=0, time=0)
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found") 
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract/{filename}")
async def start_extraction(filename: str):
        #return JSONResponse(content={"message": "Extraction process started on ", "filename": filename}, status_code=200)
        await call_pdfdocintel_extraction(filename)
        
        return '{"message": "Extraction completed successfully"}'

@app.get("/sections/{filename}", response_model=List[Section])
async def get_sections(filename: str):
    
    #await asyncio.sleep(1)
    #return load_mock_data("sections.json", Section)
    fn = os.path.basename(filename) #get just file name from path
    name, extention = os.path.splitext(fn) # get just file name without extension
    fn = strip_non_alphanumeric(name) #strip non-alpha numberic characters from file name
    fn = find_file_by_prefix(JSON_FOLDER, f'{fn}_pdf_content')

    return await get_document_sections(fn)

@app.get("/tables/{filename}", response_model=List[Table])
async def get_tables(filename: str):
    print(f'in get_tables {filename}')
    fn = os.path.basename(filename) #get just file name from path
    name, extention = os.path.splitext(fn) # get just file name without extension
    fn = strip_non_alphanumeric(name) #strip non-alpha numberic characters from file name
    fn = find_file_by_prefix(JSON_FOLDER, f'{fn}_tables')

    return await get_document_tables(fn)


@app.get("/query_results/{filename}", response_model=List[KeywordQueryResult])
async def get_query_results(filename: str):
    # Simulate a delay for the sake of example
    #await asyncio.sleep(1)
    #return load_mock_data("keywords.json", KeywordQueryResult)
    #folder = os.path.dirname(filename)
    fn = os.path.basename(filename) #get just file name from path
    name, extention = os.path.splitext(fn) # get just file name without extension
    fn = strip_non_alphanumeric(name) #strip non-alpha numberic characters from file name
    prefix = f'{fn}_qry_results'

    return await get_keyword_query_results(QRY_RESULTS_FOLDER,prefix)



async def main(filename: str):
     await call_pdfdocintel_extraction(filename)


if __name__ == "__main__":
    print("Starting FastAPI server...")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)

    
    #asyncio.run(main("AI_Risk_Management-NIST.AI.100-1.pdf"))
    
    
    
   