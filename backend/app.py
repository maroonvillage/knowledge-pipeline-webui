import asyncio
import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
import json
import os
from pydantic import BaseModel
from typing import Any, List
from fastapi.middleware.cors import CORSMiddleware
from services.file_processing import process_file, get_files_from_dir, call_pdfdocintel_extraction, \
    get_file_metadata, check_file, get_file_path, call_pdfdocintel_get_tables_file, \
        call_pdfdocintel_get_keywords_file,clear_files, get_filename_prefix
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

FILENAME_SEGMENT_TABLES = "_tables"
FILENAME_SEGMENT_QRY_RESULTS = "_qry_results"


FILE_PREFIX_LENGTH = 0
DATA_FOLDER = "./files/output"
UPLOAD_FOLDER = "./files/uploads"

CSV_FOLDER = os.path.join(DATA_FOLDER,"csv")
JSON_FOLDER = os.path.join(DATA_FOLDER,"json")

PROCESSED_FOLDER = os.path.join(DATA_FOLDER,"processed")
QRY_RESULTS_FOLDER = os.path.join(DATA_FOLDER,"query_results")
EMBEDDINGS_FOLDER =  os.path.join(DATA_FOLDER,"embeddings")
TXT_FOLDER = os.path.join(DATA_FOLDER,"text")



TABLES_DIR = os.path.join(DATA_FOLDER, "tables")
if not os.path.exists(TABLES_DIR):
    os.makedirs(TABLES_DIR)

KEYWORDS_DIR = os.path.join(DATA_FOLDER, "_qry_results")
if not os.path.exists(KEYWORDS_DIR):
    os.makedirs(KEYWORDS_DIR)


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
        file_name_wo_ext, extension = os.path.splitext(filename)
        processed_file = os.path.join(PROCESSED_FOLDER, f'{file_name_wo_ext}{PROCESSED_EXT}')
        if(await check_file(processed_file)):
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
        #TODO: Make calls to remove existing files from folders ...
        
        await call_pdfdocintel_extraction(filename)
        
        return '{"message": "Extraction completed successfully"}'

@app.post("/clear_data/{filename}")
async def clear_data(filename: str):
    try:
      #clear your output files here
      # For example you can delete all contents of the file to perform the extraction again from a blank slate.
      print("Clearing data")
      base_filename = os.path.splitext(filename)[0]
      
      pdf_prefix = await get_filename_prefix(filename, FILE_PREFIX_LENGTH)
        # Define patterns for files to delete
      files_to_delete = [
            os.path.join(PROCESSED_FOLDER, f"{base_filename}{PROCESSED_EXT}")
        ]
      
      patterns = [
          CSV_FOLDER,
          JSON_FOLDER,
          EMBEDDINGS_FOLDER,
          QRY_RESULTS_FOLDER,
          TXT_FOLDER
          
      ]
      await clear_files(pdf_prefix, files_to_delete, patterns)
      
    except Exception as e:
      raise HTTPException(status_code=500, detail="Error during data clearing")
  
  
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

@app.get("/check_tables_file/{filename}")
async def check_tables_file(filename: str):
    
    prefix = await get_filename_prefix(filename, FILE_PREFIX_LENGTH)
    filename_segment = f'{prefix}{FILENAME_SEGMENT_TABLES}'
    for filename in os.listdir(CSV_FOLDER):
        if(filename.startswith(filename_segment) and filename.endswith('.csv')):
            return {"tables_file": filename}
        
        #raise HTTPException(status_code=404, detail="File does not exist")
        
    return {"tables_files": None}

@app.get("/check_keywords_file/{filename}")
async def check_keywords_file(filename: str):
    
    prefix = await get_filename_prefix(filename, FILE_PREFIX_LENGTH)
    filename_segment = f'{prefix}{FILENAME_SEGMENT_QRY_RESULTS}'
    for filename in os.listdir(CSV_FOLDER):
         if(filename.startswith(filename_segment) and filename.endswith('.csv')):
            return {"keywords_file": filename}
        
         #raise HTTPException(status_code=404, detail="File does not exist")

    #raise HTTPException(status_code=404, detail="Path does not exist")
    return {"keywords_file": None}

@app.post("/generate_tables_file/{filename}")
async def generate_tables_file(filename: str):
    #file_prefix = await get_filename_prefix(filename, FILE_PREFIX_LENGTH)
    #tables_file = await get_file_path(CSV_FOLDER, file_prefix, FILENAME_SEGMENT_TABLES, "csv")
    #print("Writing: ", tables_file)
    try:
        #Call PDFDOCINTEL to generate CSV file ...
       await call_pdfdocintel_get_tables_file(filename,FILENAME_SEGMENT_TABLES, FILE_PREFIX_LENGTH)
       return {"success": True, "message": "Tables file generated successfully"}
    except Exception as e:
       raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_keywords_file/{filename}")
async def generate_keywords_file(filename: str):
    #keywords_file = await get_file_path(KEYWORDS_DIR, filename, FILENAME_SEGMENT_TABLES, "csv")
    try:
       #Call PDFDOCINTEL to generate CSV file ...
       await call_pdfdocintel_get_keywords_file(filename,FILENAME_SEGMENT_QRY_RESULTS, FILE_PREFIX_LENGTH)
       return {"success": True, "message": "Keywords file generated successfully"}
    except Exception as e:
       raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/tables/{filename}")
async def download_tables_file(filename: str):
    # base_filename =  os.path.splitext(filename)[0]  # Remove the original extension
    # filename_prefix = await get_filename_prefix(base_filename, file_prefix_length=FILE_PREFIX_LENGTH)
    # generated_filename = f'{filename_prefix}{FILENAME_SEGMENT_TABLES}'
    # files =  os.listdir(CSV_FOLDER)
    # for file in files:
    #     if(file.startswith(generated_filename) and file.endswith('.csv')):
    #         return FileResponse(file, filename=file, media_type='text/csv')
        
    download_file = os.path.join(CSV_FOLDER, filename)
    if(os.path.isfile(download_file)):
     return await get_file_metadata(download_file)
    else:
        raise HTTPException(status_code=404, detail="Tables file not found")      
            
            

@app.get("/download/keywords/{filename}")
async def download_keywords_file(filename: str):
    # base_filename =  os.path.splitext(filename)[0]  # Remove the original extension
    # filename_prefix = await get_filename_prefix(base_filename, file_prefix_length=FILE_PREFIX_LENGTH)
    # generated_filename = f'{filename_prefix}{FILENAME_SEGMENT_QRY_RESULTS}'
    # files =  os.listdir(CSV_FOLDER)
    # for file in files:
    #     if(file.startswith(generated_filename) and file.endswith('.csv')):
    #          return FileResponse(file, filename=file, media_type='text/csv')
                
    download_file = os.path.join(CSV_FOLDER, filename)
    if(os.path.isfile(download_file)):
     return await get_file_metadata(download_file)
    else:        
        raise HTTPException(status_code=404, detail="Query results file not found")

async def main(filename: str):
     await call_pdfdocintel_extraction(filename)


if __name__ == "__main__":
    print("Starting FastAPI server...")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
    # filename = './files/uploads/AI_Risk_Management-NIST.AI.100-1.pdf'
    # prefix =  asyncio.run(get_filename_prefix(filename, FILE_PREFIX_LENGTH))
    # print(prefix)
    # filename_segment = f'{prefix}{FILENAME_SEGMENT_QRY_RESULTS}'
    # print(filename_segment)
    # for filename in os.listdir(CSV_FOLDER):
    #      if(filename.startswith(filename_segment) and filename.endswith('.csv')):
    #         print("file exists")
    #         break
        
    #      print("file does NOT exist.")
    #asyncio.run(main("AI_Risk_Management-NIST.AI.100-1.pdf"))


    
    
    
   