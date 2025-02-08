import asyncio
import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import os
from typing import Dict, Any, List
from fastapi.middleware.cors import CORSMiddleware
from services.file_processing import process_file, get_files_from_dir, call_pdfdocintel, \
    get_file_metadata, check_file
from models.file_metadata import FileMetadata

#import pdfdocintel as pdf


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


UPLOAD_FOLDER = "./files/uploads"
PROCESSED_FOLDER = "./files/output/processed"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


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
        process_file = os.path.join(PROCESSED_FOLDER, filename)
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

@app.post("/")
async def start_extraction(filename: str):
        return JSONResponse(content={"message": "Extraction process started on ", "filename": filename}, status_code=200)

async def main(filename: str):
     await call_pdfdocintel(filename)


if __name__ == "__main__":
    print("Starting FastAPI server...")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)

    
    #asyncio.run(main("AI_Risk_Management-NIST.AI.100-1.pdf"))
    
    
    
   