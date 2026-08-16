from app.features.application_form.schemas.submit_request import ApplicationFormSubmitRequest


def payload_to_dict(payload: ApplicationFormSubmitRequest) -> dict:
    return payload.model_dump()


def get_field_value(payload: ApplicationFormSubmitRequest, fkey: str) -> str:
    for section in payload.sections:
        for field in section.fields:
            if field.fkey == fkey:
                return (field.value or "").strip()
    return ""
