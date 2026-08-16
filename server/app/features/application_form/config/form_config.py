REQUIRED_GROUPS = [
    {
        "key": "company_basic",
        "label": "公司基本信息",
        "required": True,
        "fields": [
            {"fkey": "company_name", "label": "公司名称（拟）"},
            {"fkey": "name_combination_mode", "label": "名称组合方式"},
            {"fkey": "registered_capital", "label": "注册资本"},
            {"fkey": "currency", "label": "币种"},
        ],
    },
    {
        "key": "business_scope",
        "label": "经营范围（或者拟经营的主要业务）",
        "required": True,
        "fields": [{"fkey": "business_scope", "label": "经营范围"}],
    },
    {
        "key": "premises",
        "label": "住所/经营场所",
        "required": True,
        "fields": [
            {"fkey": "premises_area", "label": "住所面积"},
            {"fkey": "property_owner", "label": "产权人"},
            {"fkey": "property_contact_phone", "label": "联系手机"},
        ],
    },
    {
        "key": "legal_representative",
        "label": "执行董事（法定代表人）",
        "required": True,
        "fields": [
            {"fkey": "legal_representative_name", "label": "姓名"},
            {"fkey": "legal_representative_phone", "label": "手机号"},
            {"fkey": "legal_representative_id_no", "label": "身份证"},
            {"fkey": "legal_representative_address", "label": "证件住址"},
        ],
    },
    {
        "key": "finance_leader",
        "label": "财务负责人",
        "required": True,
        "fields": [
            {"fkey": "finance_leader_name", "label": "姓名"},
            {"fkey": "finance_leader_phone", "label": "手机号"},
            {"fkey": "finance_leader_id_no", "label": "身份证"},
            {"fkey": "finance_leader_address", "label": "证件住址"},
        ],
    },
    {
        "key": "industrial_contact",
        "label": "工商联络人",
        "required": True,
        "fields": [
            {"fkey": "industrial_contact_name", "label": "姓名"},
            {"fkey": "industrial_contact_phone", "label": "手机号"},
            {"fkey": "industrial_contact_id_no", "label": "身份证"},
            {"fkey": "industrial_contact_address", "label": "证件住址"},
        ],
    },
]

SHAREHOLDER_REQUIRED_FIELDS = [
    {"fkey": "name", "label": "姓名"},
    {"fkey": "id_no", "label": "证件号"},
    {"fkey": "subscribed_capital", "label": "认缴额"},
    {"fkey": "equity_ratio", "label": "认缴比例"},
    {"fkey": "address", "label": "证件住址"},
    {"fkey": "phone", "label": "手机"},
    {"fkey": "valid_until", "label": "证件有效期"},
]

IMAGE_GROUPS = [
    {"key": "自然人股东身份证", "label": "自然人股东身份证 / 港澳台通行证", "required": True},
    {"key": "法人股东营业执照副本复印件加盖公章", "label": "法人股东营业执照副本复印件加盖公章", "required": True},
    {"key": "住所/经营场所租赁合同", "label": "住所/经营场所租赁合同", "required": True},
    {"key": "政府要求其他文件", "label": "政府要求其他文件", "required": False},
]
