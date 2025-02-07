import asyncio
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import os
from typing import Dict, Any
from fastapi.middleware.cors import CORSMiddleware
from services.file_processing import process_file, get_files_from_dir, call_pdfdocintel
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


UPLOAD_FOLDER = "./uploads"
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

@app.get("/get_file_metadata")
async def get_file_metadata():
    files_from_dir = await get_files_from_dir(UPLOAD_FOLDER, extension='.pdf')
    files_list = []
    for file in files_from_dir:
        fm = get_file_metadata(file.filename)
        
        file_data = {
            "filename": fm.filename,
            "size": fm.size,
            "time": fm.time
        }
        files_list.append(file_data)
    return JSONResponse(content={files_list})
    #return JSONResponse(content={"message": f"File Metatdata - There are {len(files_from_dir)} file(s) in the uploads folder."}, status_code=200)


@app.post("/")
async def start_extraction(filename: str):
        return JSONResponse(content={"message": "Extraction process started on ", "filename": filename}, status_code=200)

async def main(filename: str):
     await call_pdfdocintel(filename)


if __name__ == "__main__":
    print("Starting FastAPI server...")
    #import uvicorn
    #uvicorn.run(app, host="0.0.0.0", port=5001)
    #import sys
    #print(sys.path)
    
    
    asyncio.run(main("AI_Risk_Management-NIST.AI.100-1.pdf"))
    
    
    
   