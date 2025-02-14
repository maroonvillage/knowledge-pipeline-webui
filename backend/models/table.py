from pydantic import BaseModel
class Table(BaseModel):
    tableTitle: str
    columns: str
    rows: str