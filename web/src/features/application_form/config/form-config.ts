export type ApplicationFormInputType = "text" | "number" | "select";

export type ApplicationFormFieldConfig = {
  fkey: string;
  label: string;
  required: boolean;
  inputType?: ApplicationFormInputType;
};

export type ApplicationFormSectionConfig = {
  key: string;
  label: string;
  required: boolean;
  starTarget: "field-label" | "section-title" | "row-label" | "material-title";
  fields: ApplicationFormFieldConfig[];
};

export type ApplicationFormImageConfig = {
  key: string;
  label: string;
  required: boolean;
};

export const applicationFormSections: ApplicationFormSectionConfig[] = [
  {
    key: "company_basic",
    label: "公司基本信息",
    required: true,
    starTarget: "field-label",
    fields: [
      { fkey: "company_name", label: "公司名称（拟）", required: true, inputType: "text" },
      { fkey: "company_name_alternative_one", label: "公司备选名称", required: false, inputType: "text" },
      { fkey: "company_name_alternative_two", label: "公司备选名称", required: false, inputType: "text" },
      { fkey: "name_combination_mode", label: "名称组合方式", required: true, inputType: "select" },
      { fkey: "registered_capital", label: "注册资本", required: true, inputType: "number" },
      { fkey: "currency", label: "币种", required: true, inputType: "select" },
    ],
  },
  {
    key: "business_scope",
    label: "经营范围（或者拟经营的主要业务）",
    required: true,
    starTarget: "section-title",
    fields: [{ fkey: "business_scope", label: "经营范围", required: true, inputType: "text" }],
  },
  {
    key: "premises",
    label: "住所/经营场所",
    required: true,
    starTarget: "field-label",
    fields: [
      { fkey: "premises_area", label: "住所面积", required: true, inputType: "number" },
      { fkey: "property_owner", label: "产权人", required: true, inputType: "text" },
      { fkey: "property_contact_phone", label: "联系手机", required: true, inputType: "text" },
    ],
  },
  {
    key: "legal_representative",
    label: "执行董事（法定代表人）",
    required: true,
    starTarget: "row-label",
    fields: [
      { fkey: "legal_representative_name", label: "姓名", required: true, inputType: "text" },
      { fkey: "legal_representative_phone", label: "手机号", required: true, inputType: "text" },
      { fkey: "legal_representative_id_no", label: "身份证", required: true, inputType: "text" },
      { fkey: "legal_representative_address", label: "证件住址", required: true, inputType: "text" },
    ],
  },
  {
    key: "manager",
    label: "经理",
    required: false,
    starTarget: "row-label",
    fields: [
      { fkey: "manager_name", label: "姓名", required: false, inputType: "text" },
      { fkey: "manager_phone", label: "手机号", required: false, inputType: "text" },
      { fkey: "manager_id_no", label: "身份证", required: false, inputType: "text" },
      { fkey: "manager_address", label: "证件住址", required: false, inputType: "text" },
    ],
  },
  {
    key: "finance_leader",
    label: "财务负责人",
    required: true,
    starTarget: "row-label",
    fields: [
      { fkey: "finance_leader_name", label: "姓名", required: true, inputType: "text" },
      { fkey: "finance_leader_phone", label: "手机号", required: true, inputType: "text" },
      { fkey: "finance_leader_id_no", label: "身份证", required: true, inputType: "text" },
      { fkey: "finance_leader_address", label: "证件住址", required: true, inputType: "text" },
    ],
  },
  {
    key: "supervisor",
    label: "监事",
    required: false,
    starTarget: "row-label",
    fields: [
      { fkey: "supervisor_name", label: "姓名", required: false, inputType: "text" },
      { fkey: "supervisor_phone", label: "手机号", required: false, inputType: "text" },
      { fkey: "supervisor_id_no", label: "身份证", required: false, inputType: "text" },
      { fkey: "supervisor_address", label: "证件住址", required: false, inputType: "text" },
    ],
  },
  {
    key: "industrial_contact",
    label: "工商联络人",
    required: true,
    starTarget: "row-label",
    fields: [
      { fkey: "industrial_contact_name", label: "姓名", required: true, inputType: "text" },
      { fkey: "industrial_contact_phone", label: "手机号", required: true, inputType: "text" },
      { fkey: "industrial_contact_id_no", label: "身份证", required: true, inputType: "text" },
      { fkey: "industrial_contact_address", label: "证件住址", required: true, inputType: "text" },
    ],
  },
];

export const applicationFormShareholderFields: ApplicationFormFieldConfig[] = [
  { fkey: "name", label: "姓名", required: true, inputType: "text" },
  { fkey: "id_no", label: "证件号", required: true, inputType: "text" },
  { fkey: "subscribed_capital", label: "认缴额", required: true, inputType: "number" },
  { fkey: "equity_ratio", label: "认缴比例", required: true, inputType: "number" },
  { fkey: "address", label: "证件住址", required: true, inputType: "text" },
  { fkey: "phone", label: "手机", required: true, inputType: "text" },
  { fkey: "valid_until", label: "证件有效期", required: true, inputType: "text" },
];

export const applicationFormImages: ApplicationFormImageConfig[] = [
  { key: "自然人股东身份证", label: "自然人股东身份证 / 港澳台通行证", required: true },
  { key: "法人股东营业执照副本复印件加盖公章", label: "法人股东营业执照副本复印件加盖公章", required: true },
  { key: "住所/经营场所租赁合同", label: "住所/经营场所租赁合同", required: true },
  { key: "政府要求其他文件", label: "政府要求其他文件", required: false },
];
