import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from urllib.parse import unquote  # Import unquote
import json
import logging
import logging.config
import os
from pydantic import BaseModel
from typing import Any, List 
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, Request, UploadFile, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from services.file_processing import process_file, call_pdfdocintel_extraction, \
    clear_files, get_filename_prefix, get_files_from_s3 , get_file_metadata_from_s3, \
        call_pdfdocintel_get_tables_file_s3, call_pdfdocintel_get_keywords_file_s3
from services.data_service import get_document_sections, get_keyword_query_results, get_document_tables
from models.file_metadata import FileMetadata
from models.section import Section
from models.table import Table
from models.keyword_query_result import KeywordQueryResult
from pdfdocintel import strip_non_alphanumeric, get_filename_no_extension, FILE_STORAGE, \
    FILE_EXTENTION_PROCESSED, find_file_in_bucket_by_prefix, upload_to_s3


# Load logging configuration from file
# Create a logs directory if it doesn't exist
if not os.path.exists("logs"):
    os.makedirs("logs")

# Define a logging configuration dictionary
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "access": {
            "format": "%(asctime)s - %(client_addr)s - '%(request_line)s' - %(status_code)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "level": "DEBUG",  # Set the console log level
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "default",
            "filename": "logs/app.log",  # Log file path
            "maxBytes": 1024 * 1024 * 5,  # 5MB
            "backupCount": 2,  # Keep 2 old log files
            "level": "INFO",  # Set the file log level
        },
        "access_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "access",
            "filename": "logs/access.log",  # Log file path
            "maxBytes": 1024 * 1024 * 5,  # 5MB
            "backupCount": 2,  # Keep 2 old log files
            "level": "INFO",  # Set the file log level
        },
    },
    "loggers": {
        "knowledge_pipeline_webui_logger": {
            "handlers": ["console", "file"],
            "level": "DEBUG",  # Set the logger level
            "propagate": False,
        },
        "uvicorn.access": {
            "handlers": ["access_file"],
            "level": "INFO",
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "WARNING",  # Default log level for everything else
    },
}

logging.config.dictConfig(LOGGING_CONFIG)

# Get the logger instance
logger = logging.getLogger("knowledge_pipeline_webui_logger")


app = FastAPI()

# --- CORS Configuration ---
# Best practice: Make origins configurable via environment variables

# Default origins for local development
ALLOWED_ORIGINS_STR = os.getenv("ALLOWED_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")

# Split the string into a list, stripping whitespace
origins = [origin.strip() for origin in ALLOWED_ORIGINS_STR.split(",")]

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
DATA_FOLDER = "output/"
UPLOAD_FOLDER = "uploads/"

CSV_FOLDER = os.path.join(DATA_FOLDER,"csv/")
JSON_FOLDER = os.path.join(DATA_FOLDER,"json/")

PROCESSED_FOLDER = os.path.join(DATA_FOLDER,"processed/")
QRY_RESULTS_FOLDER = os.path.join(DATA_FOLDER,"query_results/")
EMBEDDINGS_FOLDER =  os.path.join(DATA_FOLDER,"embeddings/")
TXT_FOLDER = os.path.join(DATA_FOLDER,"text/")



TABLES_DIR = os.path.join(DATA_FOLDER, "tables")
if not os.path.exists(TABLES_DIR):
    os.makedirs(TABLES_DIR)

KEYWORDS_DIR = os.path.join(DATA_FOLDER, "query_results")
if not os.path.exists(KEYWORDS_DIR):
    os.makedirs(KEYWORDS_DIR)


if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Define a secure botocore configuration
secure_config = Config(
    retries={'max_attempts': 5},
    connect_timeout=3,
    read_timeout=5,
    signature_version='s3v4',  # Enforces AWS Signature Version 4
    user_agent_extra='SecureWebAppClient/1.0'
)

region = FILE_STORAGE['cloud_config']['region_name']
ssl_flag = FILE_STORAGE['cloud_config']['use_ssl']
s3_client = boto3.client("s3", region_name=region,
                        config=secure_config,
                        use_ssl=ssl_flag  # 🔒 Ensures HTTPS requests
    )

#s3://next9bucket01/uploads/
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
    
# Add middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status code: {response.status_code}")
    return response

        
@app.post("/upload", response_model = FileMetadata)
async def upload_file(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file selected")

    try:
        file_metadata:FileMetadata = await process_file(file, UPLOAD_FOLDER, FILE_STORAGE['cloud_config']['bucket_name'])
        return file_metadata
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/generate-presigned-url/{filepath:path}")
async def generate_presigned_url(
    request: Request,
    filepath: str,
    content_type: str = 'application/octet-stream'):
    """
    Generates a presigned URL for uploading a file directly to S3.
    """
    scheme = request.headers.get("X-Forwarded-Proto", "https")
    host = request.headers.get("host", request.client.host)
    base_url = f"{scheme}://{host}"
    logger.info(f"Base URL: {base_url}/api")  # Log the base URL
    
    decoded_filename = unquote(filepath)  # Decode the filename
    decoded_content_type = unquote(content_type)  # Decode the content type
    
    bucket_name = FILE_STORAGE['cloud_config']['bucket_name']
    if not bucket_name:
        raise HTTPException(status_code=500, detail="S3 bucket name not configured on server.")

    # Generate a unique object key for S3
    # You might want a different strategy, e.g., include user ID, timestamp, etc.
    # Sanitize filename to prevent path traversal or unwanted characters
    sanitized_filename = "".join(c if c.isalnum() or c in ['.', '-', '_'] else '_' for c in decoded_filename)
    #object_key = f"uploads/{uuid.uuid4()}/{sanitized_filename}"
    object_key = f"uploads/{decoded_filename}"
    try:
        presigned_url_response = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': object_key,
                'ContentType': decoded_content_type
                # You can add other parameters like 'Metadata'
            },
            ExpiresIn=3600  # URL expires in 1 hour (3600 seconds)
        )
        # Replace protocol in generated URL if needed
        presigned_url_response = presigned_url_response.replace("http://", "https://")
    except ClientError as e:
        print(f"Error generating presigned URL: {e}")
        raise HTTPException(status_code=500, detail="Could not generate upload URL.")
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


    return JSONResponse(content={"uploadUrl": presigned_url_response, "objectKey": object_key, "content_type": decoded_content_type})


@app.get("/get_files", response_model=List[Any])
async def get_files():
    logger.info(f"Getting files from S3 bucket: {FILE_STORAGE['cloud_config']['bucket_name']}")  # Log the bucket name
    
    files_from_s3_bucket = await get_files_from_s3(FILE_STORAGE['cloud_config']['bucket_name'], extension='.pdf')
    
    logger.debug(f"Files retrieved from S3 bucket: {files_from_s3_bucket}")  # Log the retrieved files
    files_list = []
    id = 1
    for file in files_from_s3_bucket:
        #full_path = os.path.join(UPLOAD_FOLDER, file)
        #fm = await get_file_metadata(full_path)
        # Convert creation time to a human-readable date          
        
        #creation_date = datetime.datetime.fromtimestamp(fm.time)
        key = file['Key'] if 'Key' in file else None
        if not key:
            print(f"Skipping file with no key: {file}")
            continue  # Skip files without a key

        file_data = {
            "id": id,
            "filename": file['Key'],  # S3 Key is the filename
            "size": file['Size'],
            "time": file['LastModified']
        }
        id += 1
        files_list.append(file_data)
    return files_list

@app.get("/get_file/{filepath:path}", response_model=FileMetadata)
async def get_file(filepath: str):
    filename = unquote(filepath)  # Decode the filename
    print(f"Received filename: {filename}") # Check the decoded filename
    
    try:
        #Make call to the service layer to check 'processed' folder
        #if a file is present that corresponds to the filename clicked in the UI
        #  display details related to the file
        # if not, display a button to start the extraction process
        folder, file_name = os.path.split(filename)
        file_name_wo_ext, extension = os.path.splitext(file_name)

        bucket_name = FILE_STORAGE['cloud_config']['bucket_name']
        metadata_dict = await get_file_metadata_from_s3(bucket_name,filename)
        

        if(metadata_dict):

            fm = FileMetadata(
                filename =  metadata_dict['Key'],  # S3 Key is the filename
                size = metadata_dict['Size'],  # Size of the file in bytes
                time = metadata_dict['LastModified'],  # Last modified time in timestamp format
                processed = False,
                uploaded = False,
                found = False
            )
            metadata_dict = {}
            processed_file = os.path.join(PROCESSED_FOLDER, f'{file_name_wo_ext}{FILE_EXTENTION_PROCESSED}')
            metadata_dict = await get_file_metadata_from_s3(bucket_name,processed_file)
        
            
            if(metadata_dict):
                fm.uploaded = True
                fm.found = True
                fm.processed = True
            else:
                fm.uploaded = True
                fm.found = True
                fm.processed = False
        else:
            # File not found in the upload folder
            fm = FileMetadata(
            filename = filename,
            size = 0,
            time = 0,
            processed = False,
            uploaded = False,
            found = False
            )
                 
        return fm
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found") 
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract/{filepath:path}")
async def start_extraction(filepath: str):
    filename = unquote(filepath)
    print(f"Starting extraction for: {filename}")
    #TODO: Make calls to remove existing files from folders ...
    try:
        await call_pdfdocintel_extraction(filename, FILE_STORAGE['cloud_config']['bucket_name'])
        
        return JSONResponse(content={"message": "Extraction completed successfully!"}, status_code=200)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found") 
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error during extraction: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/clear_data/{filepath:path}")
async def clear_data(filepath: str):
    try:
      #clear your output files here
      # For example you can delete all contents of the file to perform the extraction again from a blank slate.
      print("Clearing data ...")
      file_no_ext = get_filename_no_extension(filepath)
      #base_filename = os.path.splitext(filename)[0]
      print(f"base_filename: {file_no_ext}")
      pdf_prefix = await get_filename_prefix(filepath, FILE_PREFIX_LENGTH)
        # Define patterns for files to delete
      files_to_delete = [
            os.path.join(PROCESSED_FOLDER, f"{file_no_ext}{FILE_EXTENTION_PROCESSED}")
        ]
      
      patterns = [
          CSV_FOLDER,
          JSON_FOLDER,
          EMBEDDINGS_FOLDER,
          QRY_RESULTS_FOLDER,
          TXT_FOLDER
          
      ]
      print(f"Clearing data for {pdf_prefix} ...")
      print(f'Patterns: {patterns}')
      await clear_files(pdf_prefix, files_to_delete, patterns)
      
      
      return JSONResponse(content={"message": "Files cleared!"}, status_code=200)
      
    except Exception as e:
      raise HTTPException(status_code=500, detail="Error during data clearing")
  
@app.get("/sections/{filepath:path}", response_model=List[Section])
async def get_sections(filepath: str):
    filename = unquote(filepath)
    
    try:
        fn = os.path.basename(filename) #get just file name from path
        name, extention = os.path.splitext(fn) # get just file name without extension
        print(f"Getting sections for file: {filename}, stripped name: {name}, extension: {extention}")
        fn = strip_non_alphanumeric(name) #strip non-alpha numberic characters from file name
        print(f"Stripped filename: {fn}")
        fn = find_file_in_bucket_by_prefix(
            FILE_STORAGE['cloud_config']['bucket_name'],
            JSON_FOLDER,
            f'{fn}_pdf_content'
        )
        s3_key = f'{JSON_FOLDER}{fn}'
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Sections file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
   
    
    return await get_document_sections(s3_key,FILE_STORAGE['cloud_config']['bucket_name'])

@app.get("/tables/{filepath:path}", response_model=List[Table])
async def get_tables(filepath: str):
    filename = unquote(filepath)
    
    try:
        fn = os.path.basename(filename) #get just file name from path
        name, extention = os.path.splitext(fn) # get just file name without extension
        fn = strip_non_alphanumeric(name) #strip non-alpha numberic characters from file name
        fn = find_file_in_bucket_by_prefix(
            FILE_STORAGE['cloud_config']['bucket_name'],
            JSON_FOLDER,
            f'{fn}_tables'
        )
        s3_key = f'{JSON_FOLDER}{fn}'
        return await get_document_tables(s3_key,FILE_STORAGE['cloud_config']['bucket_name'])
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Sections file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/query_results/{filepath:path}", response_model=List[KeywordQueryResult])
async def get_query_results(filepath: str):
    filename = unquote(filepath)
    prefix = ""
    try:
        fn = os.path.basename(filename) #get just file name from path
        name, extention = os.path.splitext(fn) # get just file name without extension
        fn = strip_non_alphanumeric(name) #strip non-alpha numberic characters from file name
        prefix = f"{QRY_RESULTS_FOLDER}{fn}_qry_results"

        query_results =  await get_keyword_query_results(QRY_RESULTS_FOLDER, prefix, FILE_STORAGE['cloud_config']['bucket_name'])
        print(f"Query results for file: {filename}, prefix: {prefix} found {len(query_results)} results")
        return query_results
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Sections file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))    
    
    

@app.get("/check_tables_file/{filepath:path}")
async def check_tables_file(filepath: str):
    
    filename = unquote(filepath)
    
    try:
        
        prefix = await get_filename_prefix(filename, FILE_PREFIX_LENGTH,FILE_STORAGE['cloud_config']['bucket_name'])
        tables_file_segment = f'{prefix}{FILENAME_SEGMENT_TABLES}'
        tables_file = f'{tables_file_segment}.csv'
        tables_file_path = os.path.join(CSV_FOLDER,tables_file)
    
        bucket_name = FILE_STORAGE['cloud_config']['bucket_name']
        metadata_dict = await get_file_metadata_from_s3(bucket_name,tables_file_path)
        if(metadata_dict):
            filename =  metadata_dict['Key'],  # S3 Key is the filename
            return {"tables_file": filename}

        else:
            raise HTTPException(status_code=404, detail="File does not exist")
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found") 
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/check_keywords_file/{filepath:path}")
async def check_keywords_file(filepath: str):
    
    filename = unquote(filepath)
    try:
        prefix = await get_filename_prefix(filename, FILE_PREFIX_LENGTH,FILE_STORAGE['cloud_config']['bucket_name'])
        filename_segment = f'{prefix}{FILENAME_SEGMENT_QRY_RESULTS}'
        keywords_file = f'{filename_segment}.csv'
        keywords_file_path = os.path.join(CSV_FOLDER,keywords_file)
                                      

        bucket_name = FILE_STORAGE['cloud_config']['bucket_name']
        metadata_dict = await get_file_metadata_from_s3(bucket_name,keywords_file_path)
        if(metadata_dict):
            filename =  metadata_dict['Key'],  # S3 Key is the filename
            return {"keywords_file": filename}

        else:
            raise HTTPException(status_code=404, detail="File does not exist")
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found") 
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/generate_tables_file/{filepath:path}")
async def generate_tables_file(filepath: str):
    filename = unquote(filepath)
    try:
        #Call PDFDOCINTEL to generate CSV file ...
       await call_pdfdocintel_get_tables_file_s3(FILE_STORAGE['cloud_config']['bucket_name'], filename,FILENAME_SEGMENT_TABLES, FILE_PREFIX_LENGTH)
       return {"success": True, "message": "Tables file generated successfully"}
    except Exception as e:
       raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_keywords_file/{filepath:path}")
async def generate_keywords_file(filepath: str):
    filename = unquote(filepath)
    try:
       #Call PDFDOCINTEL to generate CSV file ...
       await call_pdfdocintel_get_keywords_file_s3(FILE_STORAGE['cloud_config']['bucket_name'],filename,FILENAME_SEGMENT_QRY_RESULTS, FILE_PREFIX_LENGTH)
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
        return FileResponse(download_file, filename=filename, media_type='text/csv')
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
        #return await get_file_metadata(download_file)
        return FileResponse(download_file, filename=filename, media_type='text/csv')
    else:        
        raise HTTPException(status_code=404, detail="Query results file not found")

async def main(filename: str):
     await call_pdfdocintel_extraction(filename)

import asyncio
if __name__ == "__main__":
    
    async def main():
        print("Starting FastAPI server...")
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000, proxy_headers=True, forwarded_allow_ips="*")
        
    #     # Example test values
    #     test_filepath = "test.pdf"
    #     test_content_type = "application/pdf"
        
    #     # Call the endpoint function directly
    #     result = await generate_presigned_url(
    #         filepath=test_filepath,
    #         content_type=test_content_type
    #     )
    #     print(result)
    
    # asyncio.run(main())
    
   