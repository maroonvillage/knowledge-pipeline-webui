from pydantic import BaseModel
class KeywordQueryResult(BaseModel):
    keyword: str
    relevantContent: str