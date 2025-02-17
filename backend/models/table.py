from pydantic import BaseModel
class Table(BaseModel):
    tableTitle: str
    columns: int
    rows: int