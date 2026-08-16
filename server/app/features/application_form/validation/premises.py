from sqlalchemy.orm import Session

from app.features.application_form.schemas.submit_request import ApplicationFormSubmitRequest
from app.models.opc_application_material_file import OpcApplicationMaterialFile
from app.repositories.community_join import get_community_join_application_by_id


def validate_premises_source(
    db: Session,
    site_user_id: int,
    payload: ApplicationFormSubmitRequest,
    files: list[OpcApplicationMaterialFile],
) -> None:
    source = payload.premises_source
    if source is None:
        raise ValueError("请选择住所来源")
    if source.type == "lease_material":
        return
    if source.type == "rental_community":
        if not source.community_id:
            raise ValueError("请先完成租赁社区入驻申请")
        try:
            community_id = int(source.community_id)
        except (TypeError, ValueError):
            raise ValueError("租赁社区入驻申请不合法") from None
        application = get_community_join_application_by_id(db, community_id)
        if application is None or application.site_user_id != site_user_id:
            raise ValueError("租赁社区入驻申请不存在")
        if application.status not in {"未上传", "已上传"}:
            raise ValueError("租赁社区入驻申请状态无效")
        return
    raise ValueError("住所来源不合法")
