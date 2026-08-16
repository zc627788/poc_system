from pydantic import BaseModel, Field


class PageFieldValue(BaseModel):
    fkey: str
    label: str
    value: str | None = None


class PageSectionValue(BaseModel):
    key: str
    label: str
    fields: list[PageFieldValue] = Field(default_factory=list)


class PageShareholderSection(PageSectionValue):
    id: str


class PageUploadedImage(BaseModel):
    key: str
    label: str
    file_id: int
    name: str


class PageImageValue(BaseModel):
    key: str
    label: str
    files: list[PageUploadedImage] = Field(default_factory=list)


class PremisesSource(BaseModel):
    type: str
    community_id: str | None = None


class ApplicationFormSubmitRequest(BaseModel):
    version: int = 1
    sections: list[PageSectionValue] = Field(default_factory=list)
    shareholder_sections: list[PageShareholderSection] = Field(default_factory=list)
    images: list[PageImageValue] = Field(default_factory=list)
    premises_source: PremisesSource | None = None


ApplicationFormDraftRequest = ApplicationFormSubmitRequest


class ApplicationFormSubmitResponse(BaseModel):
    id: int
    application_no: str
    status: str
    submitted_at: str


class ApplicationFormDraftResponse(BaseModel):
    draft: ApplicationFormDraftRequest | None = None


class ApplicationFormDraftSaveResponse(BaseModel):
    ok: bool
    updated_at: str


class ApplicationFormDraftClearResponse(BaseModel):
    ok: bool


class ApplicationFormImageDeleteRequest(BaseModel):
    file_id: int
