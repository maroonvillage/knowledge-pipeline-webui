# backend/services/file_processing.py
import os, glob
import shutil
import json
from fastapi import UploadFile
from models.file_metadata import FileMetadata
import datetime
from pdfdocintel import main, ParmConfig, Logger, json_to_csv_table_layout,json_to_csv_with_max_score, \
                            get_filename_no_extension,generate_filename, strip_non_alphanumeric;


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

async def check_file(filename:str) -> bool:
    
    return os.path.exists(filename)

async def get_files_from_dir(directory,extension='.json'):

    files =  os.listdir(directory)
    if(extension!=None):
        # Filter the list to include only JSON files 
        filtered_files = [f for f in files if f.endswith(extension)]
    else:
         # Filter the list to include only JSON files 
        filtered_files = [f for f in files]

    return filtered_files

async def get_file_path(directory, filename, prefix_length, segment, extension) -> str:
    """ DEPRECATED"""
    base_filename =  os.path.splitext(filename)[0]  # Remove the original extension
    filename_prefix = get_filename_prefix(base_filename, file_prefix_length=prefix_length)
    generated_filename = f'{filename_prefix}{segment}.{extension}'
    file_path = os.path.join(directory, base_filename)
    return file_path

async def clear_files(filename_prefix: str, files_to_delete: list, patterns: list):
    logger = Logger(__name__)
    try:

        # Add a pattern for the table and keyword files to delete
        # Loop through files in TABLES_DIR and KEYWORDS_DIR, deleting only those associated with filename
        for directory in patterns:
            if(os.path.exists(directory)):
                files =  os.listdir(directory)
                for file in files:
                    if(file.startswith(filename_prefix)):
                        if os.path.isfile(file):
                            os.remove(file)

        # Delete specific files
        for file_path in files_to_delete:
             if os.path.exists(file_path) and os.path.isfile(file_path):
                os.remove(file_path)

    except Exception as e:
        logger.error(f"An unexpected error occurred: {e} when clearing files. Error: {e}")
  
  
async def call_pdfdocintel_extraction(filename:str):
    
    #parm_config = ParmConfig()
    parm_config = ParmConfig(input_dir="files/uploads", output_dir="files/output", json_dir="json", text_dir="text", 
                             csv_dir="csv", downloads_dir="files/downloads/api_responses", query_dir="query_results",
                             processed_dir="processed", embeddings_dir="embeddings")
        
    # Load the PDF file
    main(filename,parm_config)

async def call_pdfdocintel_get_tables_file(pdf_filename: str, filename_segment: str, file_prefix_length: int=0):
    
    logger = Logger(__name__)
    
    logger.debug("Inside call_pdfdocintel_get_tables_file ... ")
    parm_config = ParmConfig(input_dir="files/uploads", output_dir="files/output", json_dir="json", text_dir="text", 
                             csv_dir="csv", downloads_dir="files/downloads/api_responses", query_dir="query_results")
        
    #Create the prefix of the file ...
    pdf_prefix = await get_filename_prefix(pdf_filename, file_prefix_length)
    
    logger.debug(f'File prefix: {pdf_prefix}')
     # Get the current date and time
    #now = datetime.now()
    # Format the date and time as a string (e.g., '2023-04-06_14-30-00')
    #timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")
    # Combine the base name, timestamp, and extension to form the file name
    #output_file = f"{pdf_prefix}{filename_segment}_{timestamp}.csv"
    output_file = generate_filename(f"{pdf_prefix}{filename_segment}",timestamp=False, extension="csv")
    
    logger.debug(f'output file: {output_file}')
    
    full_output_path = os.path.join(parm_config.get_output_csv_dir(), output_file)
    
    logger.debug(f'Full output path: {full_output_path}')
    
    first_file = True
    try:
       
        for filename in os.listdir(parm_config.get_output_json_dir()):
            if filename_segment in filename and filename.endswith('.json'):
                 json_file_path = os.path.join(parm_config.get_output_json_dir(), filename)
                 logger.info(f"Processing file: {json_file_path}")
                 json_data = {}
                 try:
                    with open(json_file_path, 'r') as f:
                        json_data = json.load(f)
                        json_to_csv_table_layout(json_data, full_output_path)
                        first_file = False
                 except FileNotFoundError as e:
                     logger.error(f"File not found: {json_file_path}. Error: {e}")
                 except json.JSONDecodeError as e:
                     logger.error(f"JSONDecodeError: {e} when loading file: {json_file_path}. Error: {e}")
                 except Exception as e:
                     logger.error(f"An unexpected error occurred: {e} when processing file: {json_file_path}. Error: {e}")
                     
    except FileNotFoundError as e:
         logger.error(f"FileNotFoundError: {e} when listing files in folder: {parm_config.get_output_csv_dir()}. Error: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e} when processing files in folder: {parm_config.get_output_csv_dir()}. Error: {e}")
    return None

async def get_filename_prefix(pdf_filename, file_prefix_length) -> str:
    
    pdf_prefix = ""
    file_name_no_extension = ''
    if(file_prefix_length == 0):
        file_name_no_extension = get_filename_no_extension(pdf_filename)
        pdf_prefix = strip_non_alphanumeric(file_name_no_extension)
    else:
        ext_len = file_prefix_length
        file_name_no_extension = strip_non_alphanumeric(pdf_filename)
        pdf_prefix = file_name_no_extension[:ext_len]
    return pdf_prefix

async def call_pdfdocintel_get_keywords_file(pdf_filename: str, filename_segment: str, file_prefix_length: int=0):
    
    logger = Logger(__name__)
     
    parm_config = ParmConfig(input_dir="files/uploads", output_dir="files/output", json_dir="json", text_dir="text", 
                             csv_dir="csv", downloads_dir="files/downloads/api_responses", query_dir="query_results")
    
    #Create the prefix of the file ...
    pdf_prefix = await get_filename_prefix(pdf_filename, file_prefix_length)
    
    # Create a timestamp for the output file name
    #now = datetime.now()
    # Format the date and time as a string (e.g., '2023-04-06_14-30-00')
    #timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")
    # Combine the base name, timestamp, and extension to form the file name
    #output_file = f"{pdf_prefix}{filename_segment}_{timestamp}.csv"
    output_file = generate_filename(f"{pdf_prefix}{filename_segment}",timestamp=False,extension="csv")
    # Create the full output path
    full_output_path = os.path.join(parm_config.get_output_csv_dir(), output_file)
    
    first_file = True
    try:
       
        for filename in os.listdir(parm_config.get_output_query_dir()):
            #logger.debug(f"Processing file: {filename}")
            if filename_segment in filename and filename.endswith('.json'):
                 json_file_path = os.path.join(parm_config.get_output_query_dir(), filename)
                 logger.info(f"Processing file: {json_file_path}")
                 json_data = {}
                 try:
                    with open(json_file_path, 'r') as f:
                        json_data = json.load(f)
                        json_to_csv_with_max_score(json_data, full_output_path, write_header=first_file)
                        first_file = False
                 except FileNotFoundError as e:
                     logger.error(f"File not found: {json_file_path}. Error: {e}")
                 except json.JSONDecodeError as e:
                     logger.error(f"JSONDecodeError: {e} when loading file: {json_file_path}. Error: {e}")
                 except Exception as e:
                     logger.error(f"An unexpected error occurred: {e} when processing file: {json_file_path}. Error: {e}")
    except FileNotFoundError as e:
        logger.error(f"FileNotFoundError: {e} when listing files in folder: {parm_config.get_output_query_dir()}. Error: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e} when processing files in folder: {parm_config.get_output_query_dir()}. Error: {e}")
    return None