# backend/models/file_metadata.py
from pydantic import BaseModel

class FileMetadata(BaseModel):
     filename: str
     size: int
     time: float