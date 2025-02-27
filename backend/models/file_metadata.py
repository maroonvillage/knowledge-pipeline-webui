# backend/models/file_metadata.py
from pydantic import BaseModel

class FileMetadata(BaseModel):
     filename: str
     size: int
     time: float
     processed: bool = False
     uploaded: bool = False
     found: bool = False
     