
from typing import List
import json
import os

from pdfdocintel import Logger

async def get_document_sections(filename:str) -> List[str]:
    """
    Extracts section titles and paragraph content from a JSON file.

    Args:
        json_file_path: Path to the JSON file.

    Returns:
        A list of dictionaries, where each dictionary has "sectionTitle" and "sectionContent" keys. Returns an empty list if there are errors.
    """
    logger = Logger(__name__)
    try:
        logger.debug(f'This is the filename passed into get_document_sections {filename}')
        with open(filename, 'r') as f:
            data = json.load(f)

        sections = []
        for section in data["sections"]:
            section_title = section["heading"]
            # Extract the section content by concatenating all of the paragraph elements
            section_content = "\n".join(section.get("paragraphs", []))

            sections.append({
                "sectionTitle": section_title,
                "sectionContent": section_content
            })
        return sections
    except FileNotFoundError:
        print(f"File not found: {filename}")
        return []
    except json.JSONDecodeError:
        print(f"Invalid JSON format in: {filename}")
        return []
    except Exception as e:
        print(f"Error processing {filename}: {e}")
        return []

async def get_document_tables(filename:str) -> List[str]:
    """
    Extracts table meta-data from a JSON file.

    Args:
        json_file_path: Path to the JSON file.

    Returns:
        A list of dictionaries, where each dictionary has "table title", "row count and "column count" keys. Returns an empty list if there are errors.
    """
    logger = Logger(__name__)
    try:
        logger.debug(f'This is the filename passed into get_document_sections {filename}')
        with open(filename, 'r') as f:
            data = json.load(f)

        tables = []
        row_count = 0
        column_count = 0
        count = 0
        for table in data:
            table_title = table.get("title","Untitled Table")
            row_count = len(table.get("rows",[]))
            for row in table.get("rows",[]):
                if isinstance(row, dict):
                    for key in row:
                        if isinstance(key, str) and key.startswith("Column "):
                            column_count += 1
                    if column_count >= 2:
                        count += 1


            tables.append({
                "tableTitle": table_title,
                "columns": column_count,
                "rows": row_count
            })
            row_count = 0
            column_count = 0
            count = 0
        return tables
    except FileNotFoundError:
        print(f"File not found: {filename}")
        return []
    except json.JSONDecodeError:
        print(f"Invalid JSON format in: {filename}")
        return []
    except Exception as e:
        print(f"Error processing {filename}: {e}")
        return []

async def get_keyword_query_results(folder_path:str, prefix:str) -> List[str]:
    # Replace with your logic to extract keyword query results from the document
    # For now, just return a list of dummy keyword query results
    logger = Logger(__name__)
    data = {}
    try:
        #logger.debug(f'This is the filename passed into get_keyword_query_results {folder_path} prefix: {prefix}')
        list_of_files = os.listdir(folder_path)
        filtered_files = [file for file in list_of_files if file.startswith(prefix)]
        #logger.debug(f'this is the list of files: {filtered_files}')
        results = []
        for filename in filtered_files:
            
            if(prefix in filename):
                try:
                    full_path = os.path.join(folder_path,filename)
                    with open(full_path, 'r') as f:
                        data = json.load(f)
                            
                    logger.debug(f'Opened file: {filename}')
                    title = data["title"]
                    section_content = ""
                    best_content = ""
                    max_score = 0
                    
                    for section in data["sections"]:
                        section_content = section.get("content","")
                        score = section.get("score", 0)
                        score = score * 100
                        if score > max_score and score <= 100:
                            max_score = score
                            best_content = section_content
                                
                    results.append({
                        "keyword": title,
                        "relevantContent": best_content
                    })
                    
                except FileNotFoundError as e:
                    logger.error(f"Folder not found: {folder_path}, error: {e}")
        return results
    except json.JSONDecodeError:
        print(f"Invalid JSON format in: {filename}")
        return []
    except Exception as e:
        print(f"Error processing {filename}: {e}")
        return []
