from pydantic import BaseModel
class Section(BaseModel):
    sectionTitle: str
    sectionContent: str
    