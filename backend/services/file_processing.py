# backend/services/file_processing.py
import os
import json
from fastapi import UploadFile
from models.file_metadata import FileMetadata
from typing import Any;
from pdfdocintel import main, ParmConfig, Logger, json_to_csv_table_layout,json_to_csv_with_max_score, \
                            json_to_csv_table_layout_s3, json_to_csv_with_max_score_s3, \
                            get_filename_no_extension,generate_filename, strip_non_alphanumeric, \
                                list_s3_objects, get_s3_object_metadata, get_s3_object,process_s3_json_to_csv, \
                                    upload_to_s3;


async def process_file(file: UploadFile, upload_folder:str, bucket_name:str=None) -> FileMetadata:
    
    file_metadata = FileMetadata(filename=file.filename, size=0, time=0)
    try:
        if bucket_name is not None:
            # Upload the file to S3
            key = upload_to_s3(bucket_name, upload_folder, file)
            meta_data = get_file_metadata_from_s3(bucket_name, key)
            
            file_metadata.size = meta_data['size']
            file_metadata.time = meta_data['time']
            file_metadata.filename = meta_data['filename']
            file_metadata.uploaded = True
            file_metadata.found = True
            return file_metadata
            
        else:
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

async def get_files_from_s3(bucket_name, prefix='', extension='.json'):
    """
    List files in an S3 bucket with a specific prefix and extension.
    :param
    - bucket_name: The name of the S3 bucket.
    - prefix: The prefix to filter files by (optional).
    - extension: The file extension to filter by (optional, default is '.json').
    :return: A list of file names that match the prefix and extension.
    """
    # List all objects in the S3 bucket with the specified prefix
    try:
        files = list_s3_objects(bucket_name, prefix)
        if not files:
            return []

        # Filter the list to include only files with the specified extension
        filtered_files = [file for file in files if file['Key'].endswith(extension)]
        
        return filtered_files
    except Exception as e:
        raise e

async def get_file_metadata_from_s3(bucket_name, key):
    """
    Get file metadata for files in an S3 bucket with a specific prefix and extension.
    :param
    - bucket_name: The name of the S3 bucket.
    - key: The key of the file in the S3 bucket.
    :return: A list of FileMetadata objects for files that match the prefix and extension.
    """
    try:
        print(f"Getting metadata for file in S3 bucket: {bucket_name}, key: {key}")
        file_metadata = get_s3_object_metadata(bucket_name, key)
        if not file_metadata:
            return {}

        return file_metadata
    except Exception as e:
        print(f"An error occurred while getting file metadata from S3: {e}")
        raise e
        
async def get_file_path(directory, filename, prefix_length, segment, extension) -> str:
    """ DEPRECATED"""
    base_filename =  os.path.splitext(filename)[0]  # Remove the original extension
    filename_prefix = get_filename_prefix(base_filename, file_prefix_length=prefix_length)
    generated_filename = f'{filename_prefix}{segment}.{extension}'
    file_path = os.path.join(directory, base_filename)
    return file_path

async def clear_files(filename_prefix: str, files_to_delete: list, patterns: list):
    logger = Logger(f'{__name__}.clear_files')
    try:

        logger.info(f"Preparing to delete files in folders  with prefix {filename_prefix} ...")
        # Add a pattern for the table and keyword files to delete
        # Loop through files in TABLES_DIR and KEYWORDS_DIR, deleting only those associated with filenameS
        for directory in patterns:
            if(os.path.exists(directory)):
                files =  os.listdir(directory)
                for file in files:
                    if(file.startswith(filename_prefix)):
                        full_path = os.path.join(directory, file)
                        if os.path.isfile(full_path):
                            logger.info(f'Deleting file: {file}')
                            os.remove(full_path)

        
        logger.info(f"Preparing to delete specific files ... {files_to_delete}")
        # Delete specific files
        for file_path in files_to_delete:
             if os.path.exists(file_path) and os.path.isfile(file_path):
                os.remove(file_path)

    except Exception as e:
        logger.error(f"An unexpected error occurred: {e} when clearing files. Error: {e}")
    
async def call_pdfdocintel_extraction(filename:str, bucket_name: str):
    
    try:
        if not filename:
            raise ValueError("Filename cannot be empty.")
        if not bucket_name:
            raise ValueError("Bucket name cannot be empty.")
    
        # Split the path into folder and file name
        folder, file_name = os.path.split(filename)
        if(not folder or not file_name):
            raise ValueError("Invalid filename: Folder or file name is missing.")
        
        parm_config = ParmConfig(input_dir=f"{folder}/", output_dir="output/", json_dir="json/", text_dir="text/", 
                                csv_dir="csv/", downloads_dir="downloads/api_responses/", query_dir="query_results/",
                                processed_dir="processed/", embeddings_dir="embeddings/") 
            
        # Load the PDF file
        main(file_name,bucket_name, parm_config)
    except ValueError as ve:
        raise ve

async def get_filename_prefix(pdf_filename, file_prefix_length, bucket_name: str = None) -> str:
    #get_s3_object_metadata
    
    pdf_prefix = ""
    file_name_no_extension = ""
    just_filename = ""
    if bucket_name and bucket_name.strip():
        # If a bucket name is provided, get the metadata from S3
        metadata = get_s3_object_metadata(bucket_name, pdf_filename)
        if metadata and 'Key' in metadata:
            folder, just_filename = os.path.split(metadata['Key'])
        else:
            raise ValueError("Could not retrieve file metadata from S3.")
    else:
        just_filename = pdf_filename
        
    if(file_prefix_length == 0):
        file_name_no_extension = get_filename_no_extension(just_filename)
        pdf_prefix = strip_non_alphanumeric(file_name_no_extension)
    else:
        ext_len = file_prefix_length
        file_name_no_extension = strip_non_alphanumeric(just_filename)
        pdf_prefix = file_name_no_extension[:ext_len]
        
    return pdf_prefix
    
async def call_pdfdocintel_get_tables_file(pdf_filename: str, filename_segment: str, file_prefix_length: int=0):
    
    logger = Logger(f'{__name__}.call_pdfdocintel_get_tables_file')
    
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

async def call_pdfdocintel_get_tables_file_s3(bucket_name: str, pdf_filename: str, filename_segment: str, file_prefix_length: int=0):
    
    logger = Logger(f'{__name__}.call_pdfdocintel_get_tables_file_s3')
    
    logger.debug("Inside call_pdfdocintel_get_tables_file_s3 ... ")
    try:
        if not pdf_filename:
            raise ValueError("Filename cannot be empty.")
        
        if not bucket_name:
            raise ValueError("Bucket name cannot be empty.")
        
        # Split the path into folder and file name
        folder, file_name = os.path.split(pdf_filename)
            
        parm_config = ParmConfig(input_dir=f"{folder}/", output_dir="output/", json_dir="json/", text_dir="text/", 
                                    csv_dir="csv/", downloads_dir="downloads/api_responses/", query_dir="query_results/",
                                    processed_dir="processed/", embeddings_dir="embeddings/")
        
        #Create the prefix of the file ...
        json_prefix = await get_filename_prefix(pdf_filename, file_prefix_length, bucket_name)
        json_prefix = f"{json_prefix}{filename_segment}"
        logger.debug(f'File prefix: {json_prefix}')
        #####################################   
        output_file = generate_filename(json_prefix,timestamp=False, extension="csv")
        
        logger.debug(f'output file: {output_file}')
        
        full_output_path = os.path.join(parm_config.get_output_csv_dir(), output_file)
        
        logger.debug(f'Full output path: {full_output_path}')
        
        #TODO: Get a list of files from S3 by prefix
        json_prefix_key = f"{parm_config.get_output_json_dir()}{json_prefix}"
        logger.debug(f'json_prefix_key: {json_prefix_key}')
        filtered_files = await get_files_from_s3(bucket_name, prefix=json_prefix_key, extension='.json')
        # first_file = True
        for file in filtered_files:
            object_key = file['Key']
            filename = os.path.basename(object_key)
            json_file_path = os.path.join(parm_config.get_output_json_dir(), filename)
            logger.info(f"Processing file: {json_file_path}")
            json_data = {}
            #Open the file from S3
            json_data = get_s3_object(bucket_name,json_file_path)
            json_dict = json.loads(json_data)
            await json_to_csv_table_layout_s3(json_dict, bucket_name, full_output_path)
        
    except json.JSONDecodeError as e:
        logger.error(f"JSONDecodeError: {e} when loading file: {json_file_path}. Error: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e} when processing file: {json_file_path}. Error: {e}")
    except FileNotFoundError as e:
      logger.error(f"FileNotFoundError: {e} when listing files in folder: {parm_config.get_output_csv_dir()}. Error: {e}")
    except Exception as e:
     logger.error(f"An unexpected error occurred: {e} when processing files in folder: {parm_config.get_output_csv_dir()}. Error: {e}")
     return None

async def call_pdfdocintel_get_keywords_file(pdf_filename: str, filename_segment: str, file_prefix_length: int=0):
    
    logger = Logger(f'{__name__}.call_pdfdocintel_get_keywords_file')
     
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

async def call_pdfdocintel_get_keywords_file_s3(bucket_name: str, pdf_filename: str, filename_segment: str, file_prefix_length: int=0):
    
    logger = Logger(f'{__name__}.call_pdfdocintel_get_keywords_file_s3')
    
    logger.debug("Inside call_pdfdocintel_get_keywords_file_s3 ... ")
    try:
        if not pdf_filename:
            raise ValueError("Filename cannot be empty.")
        
        if not bucket_name:
            raise ValueError("Bucket name cannot be empty.")
        
        # Split the path into folder and file name
        folder, file_name = os.path.split(pdf_filename)
            
        parm_config = ParmConfig(input_dir=f"{folder}/", output_dir="output/", json_dir="json/", text_dir="text/", 
                                    csv_dir="csv/", downloads_dir="downloads/api_responses/", query_dir="query_results/",
                                    processed_dir="processed/", embeddings_dir="embeddings/")
        
        #Create the prefix of the file ...
        json_prefix = await get_filename_prefix(pdf_filename, file_prefix_length, bucket_name)
        json_prefix = f"{json_prefix}{filename_segment}"
        logger.debug(f'File prefix: {json_prefix}')
        
        #####################################   
        output_file = generate_filename(json_prefix,timestamp=False, extension="csv")
        
        logger.debug(f'output file: {output_file}')
        
        full_output_path = os.path.join(parm_config.get_output_csv_dir(), output_file)
        
        logger.debug(f'Full output path: {full_output_path}')
        
        #TODO: Get a list of files from S3 by prefix
        json_prefix_key = f"{parm_config.get_output_query_dir()}{json_prefix}"
        logger.debug(f'json_prefix_key: {json_prefix_key}')
        
        #await json_to_csv_with_max_score_s3(bucket_name, full_output_path, json_prefix_key)
        process_s3_json_to_csv(bucket_name, json_prefix_key, full_output_path)
        # filtered_files = await get_files_from_s3(bucket_name, prefix=json_prefix_key, extension='.json')
        # first_file = True
        # logger.debug(f'filtered_files: {filtered_files}')
        # for file in filtered_files:
        #     #object_key = file['Key']
        #     #filename = os.path.basename(object_key)
        #     #json_file_path = os.path.join(parm_config.get_output_query_dir(), filename)
        #     json_file_path = file['Key']
        #     logger.info(f"Processing file: {json_file_path}")
        #     json_data = {}
        #     #Open the file from S3
        #     json_data = get_s3_object(bucket_name,json_file_path)
        #     json_dict = json.loads(json_data)
        #     logger.debug(f'json_dict: {json_dict}')
        #     await json_to_csv_with_max_score_s3(json_dict, bucket_name, full_output_path, write_header=first_file)
        #     first_file = False
        
    except json.JSONDecodeError as e:
        logger.error(f"JSONDecodeError: {e} when loading file: {full_output_path}. Error: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e} when processing file: {full_output_path}. Error: {e}")
    except FileNotFoundError as e:
      logger.error(f"FileNotFoundError: {e} when listing files in folder: {parm_config.get_output_csv_dir()}. Error: {e}")
    except Exception as e:
     logger.error(f"An unexpected error occurred: {e} when processing files in folder: {parm_config.get_output_csv_dir()}. Error: {e}")
     return None