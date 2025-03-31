# backend/models/file_metadata.py
from pydantic import BaseModel, ValidationError
from typing import Optional
class FileMetadata(BaseModel):
     filename: str
     size: int
     time: str
     processed: Optional[bool] = False
     uploaded: Optional[bool] = False
     found: Optional[bool] = False

try:
    FileMetadata()
except ValidationError as exc:
    print(repr(exc.errors()[0]['type']))
    #> 'missing'