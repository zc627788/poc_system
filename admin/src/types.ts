export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type SiteSettingsData = {
  site_name: string;
  site_subtitle: string;
  logo_url?: string | null;
  footer_text: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  icp_no?: string | null;
};

export type BannerItem = {
  id: number;
  title: string;
  subtitle: string;
  highlight_title: string;
  description: string;
  image_url: string;
  action_type: string;
  action_value?: string | null;
  sort_order: number;
  is_published: number;
};

export type ArticleItem = {
  id: number;
  category: {
    id: number;
    code: string;
    name: string;
  };
  title: string;
  summary: string;
  link_type: string;
  external_url?: string | null;
  publish_at: string;
  source_name?: string | null;
  is_top: boolean;
  is_published: number;
  sort_order: number;
};

export type ServiceItem = {
  id: number;
  module_key: string;
  title: string;
  summary: string;
  icon?: string | null;
  target_type: string;
  target_value?: string | null;
  sort_order: number;
  is_published: number;
};

export type PageSection = {
  id: number;
  page_key: string;
  section_key: string;
  title: string;
  subtitle?: string | null;
  content: string;
  extra_json?: string | null;
  sort_order: number;
  is_published: number;
};

export type ResourceCategory = {
  id: number;
  code: string;
  name: string;
  resource_type: string;
  group_key?: string | null;
  description: string;
  icon?: string | null;
  image_url?: string | null;
  display_template: string;
  action_type: string;
  action_value?: string | null;
  button_text?: string | null;
  show_on_home: number;
  sort_order: number;
  is_published: number;
};

export type ResourceItem = {
  id: number;
  resource_type: string;
  category: ResourceCategory;
  title: string;
  summary: string;
  icon?: string | null;
  image_url?: string | null;
  badge_text?: string | null;
  price?: string | null;
  unit_label?: string | null;
  status_text?: string | null;
  link_type: string;
  link_value?: string | null;
  primary_button_text?: string | null;
  secondary_link_type: string;
  secondary_link_value?: string | null;
  secondary_button_text?: string | null;
  tags_json?: string | null;
  meta_json?: string | null;
  show_on_home: number;
  sort_order: number;
  is_published: number;
};

export type FeedbackItem = {
  id: number;
  site_user_id?: number | null;
  submitter_name?: string | null;
  subject: string;
  content: string;
  phone: string;
  attachment_name?: string | null;
  attachment_url?: string | null;
  status: "pending" | "processing" | "resolved" | "rejected";
  admin_reply?: string | null;
  handled_by?: string | null;
  handled_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type SiteUserItem = {
  id: number;
  name: string;
  real_name?: string | null;
  phone: string;
  mobile_fuzzy?: string | null;
  auth_source?: string;
  external_open_id?: string | null;
  status: number;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type CommunityJoinMaterialFile = {
  id: number;
  application_id: number;
  original_file_name: string;
  storage_path: string;
  file_type: string;
  file_size: number;
  is_deleted: boolean;
  uploaded_at: string;
};

export type CommunityJoinActionLog = {
  id: number;
  action_type: string;
  action_summary: string;
  action_detail?: string | null;
  operated_by_name?: string | null;
  operated_at: string;
};

export type CommunityJoinApplicationListItem = {
  id: number;
  site_user_id: number;
  site_user_name?: string | null;
  site_user_phone?: string | null;
  target_campus: string;
  status: string;
  material_count: number;
  submitted_at: string;
  updated_at: string;
};

export type CommunityJoinApplicationListData = {
  items: CommunityJoinApplicationListItem[];
  total: number;
  page: number;
  page_size: number;
};

export type CommunityJoinApplicationDetail = {
  id: number;
  site_user_id: number;
  site_user_name?: string | null;
  site_user_phone?: string | null;
  target_campus: string;
  status: string;
  submitted_at: string;
  updated_at: string;
  materials: CommunityJoinMaterialFile[];
  action_logs: CommunityJoinActionLog[];
};

export type OpcApplicationListItem = {
  id: number;
  application_no: string;
  site_user_id: number;
  site_user_name?: string | null;
  site_user_phone?: string | null;
  service_type: string;
  company_name: string;
  registered_capital: string;
  business_scope: string;
  submit_content: string;
  status: string;
  mailing_status: string;
  mailing_contact_info?: string | null;
  is_missing_materials: boolean;
  reject_reason_summary?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  updated_at: string;
};

export type OpcApplicationListData = {
  items: OpcApplicationListItem[];
  total: number;
  page: number;
  page_size: number;
};

export type OpcReviewFormValues = {
  status: string;
  reject_reason?: string;
  user_visible_note?: string;
  internal_note?: string;
};

export type OpcApplicationExportRow = {
  application_no: string;
  submitter_name?: string | null;
  submitter_phone?: string | null;
  company_name: string;
  status: string;
  is_missing_materials: string;
  latest_updated_at: string;
  created_at: string;
  form_fields: Record<string, string | null>;
};

export type OpcMaterialItem = {
  id: number;
  application_id?: number | null;
  site_user_id: number;
  material_category: string;
  original_file_name: string;
  storage_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  is_deleted: boolean;
};

export type OpcReviewRecordItem = {
  id: number;
  previous_status?: string | null;
  current_status: string;
  reject_reason?: string | null;
  user_visible_note?: string | null;
  internal_note?: string | null;
  operated_by_admin_user_id: number;
  operated_by_name?: string | null;
  operated_at: string;
};

export type OpcActionLogItem = {
  id: number;
  material_file_id?: number | null;
  action_type: string;
  action_target?: string | null;
  action_summary: string;
  action_detail?: string | null;
  operated_by_admin_user_id?: number | null;
  operated_by_site_user_id?: number | null;
  operated_by_name?: string | null;
  operated_at: string;
};

export type OpcApplicationDetailItem = {
  id: number;
  application_no: string;
  site_user_id: number;
  site_user_name?: string | null;
  site_user_phone?: string | null;
  source_module: string;
  status: string;
  is_missing_materials: boolean;
  submitted_at: string;
  reviewed_at?: string | null;
  latest_status_at: string;
  company_name: string;
  company_name_note?: string | null;
  registered_capital: string;
  currency: string;
  business_scope: string;
  shareholder_one_type?: string | null;
  shareholder_one_name?: string | null;
  shareholder_one_id_no?: string | null;
  shareholder_one_subscribed_capital?: string | null;
  shareholder_one_equity_ratio?: string | null;
  shareholder_one_address?: string | null;
  shareholder_one_phone?: string | null;
  shareholder_one_valid_until?: string | null;
  shareholder_two_type?: string | null;
  shareholder_two_name?: string | null;
  shareholder_two_id_no?: string | null;
  shareholder_two_subscribed_capital?: string | null;
  shareholder_two_equity_ratio?: string | null;
  shareholder_two_address?: string | null;
  shareholder_two_phone?: string | null;
  shareholder_two_valid_until?: string | null;
  legal_representative_name?: string | null;
  legal_representative_phone?: string | null;
  legal_representative_id_no?: string | null;
  legal_representative_address?: string | null;
  manager_name?: string | null;
  finance_leader_name?: string | null;
  supervisor_name?: string | null;
  industrial_contact_name?: string | null;
  mailing_status: string;
  form_snapshot_json?: string | null;
  premises_source_json?: string | null;
  materials: OpcMaterialItem[];
  review_records: OpcReviewRecordItem[];
  action_logs: OpcActionLogItem[];
  created_at: string;
  updated_at: string;
};

export type BillingMode = "MONTHLY" | "PREPAID";
export type BillingProductStatus = "ON_SALE" | "OFF_SALE";

export type BillingProduct = {
  id: number;
  product_code: string;
  service_code: string;
  service_name: string;
  supplier_name: string;
  name: string;
  description?: string | null;
  billing_mode: BillingMode;
  price: string;
  currency: "CNY";
  sort_order: number;
  status: BillingProductStatus;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
};

export type BillingProductListData = {
  items: BillingProduct[];
  total: number;
  page: number;
  page_size: number;
};

export type BillingOrderStatus = "PENDING_PAYMENT" | "PAID" | "CANCELED" | "PAYMENT_FAILED";
export type PaymentProvider = "MOCK";
export type PaymentTransactionStatus = "CREATED" | "PENDING" | "SUCCESS" | "FAILED" | "CLOSED";
export type PaymentReconciliationResult = "MATCHED" | "AMOUNT_MISMATCH" | "STATUS_MISMATCH" | "SYSTEM_ONLY" | "PROVIDER_ONLY";

export type PaymentTransaction = {
  id: number;
  payment_no: string;
  provider: PaymentProvider;
  provider_transaction_no?: string | null;
  amount: string;
  currency: "CNY";
  status: PaymentTransactionStatus;
  checkout_url?: string | null;
  provider_completed_at?: string | null;
  failure_code?: string | null;
  failure_message?: string | null;
  created_at: string;
  updated_at: string;
};

export type BillingOrder = {
  id: number;
  order_no: string;
  site_user_id: number;
  user_name: string;
  user_phone_masked: string;
  product_id: number;
  product_code: string;
  product_name: string;
  service_code: string;
  service_name: string;
  supplier_name: string;
  billing_mode: BillingMode;
  unit_price: string;
  month_count?: number | null;
  order_amount: string;
  currency: "CNY";
  service_start_date?: string | null;
  service_end_date?: string | null;
  status: BillingOrderStatus;
  payment_channel?: "EXTERNAL" | "WALLET" | null;
  paid_at?: string | null;
  canceled_at?: string | null;
  payment_transactions: PaymentTransaction[];
  created_at: string;
  updated_at: string;
};

export type BillingOrderListData = {
  items: BillingOrder[];
  total: number;
  page: number;
  page_size: number;
};

export type PaymentReconciliationBatch = {
  id: number;
  provider: PaymentProvider;
  statement_date: string;
  run_status: "SUCCESS" | "FAILED";
  provider_total_count: number;
  provider_total_amount: string;
  system_total_count: number;
  system_total_amount: string;
  matched_count: number;
  amount_mismatch_count: number;
  status_mismatch_count: number;
  system_only_count: number;
  provider_only_count: number;
  executed_by_admin_user_id: number;
  executed_at: string;
  created_at: string;
  updated_at: string;
};

export type PaymentReconciliationItem = {
  id: number;
  payment_transaction_id?: number | null;
  payment_no?: string | null;
  provider_transaction_no?: string | null;
  order_no?: string | null;
  system_amount?: string | null;
  provider_amount?: string | null;
  system_status?: PaymentTransactionStatus | null;
  provider_status?: PaymentTransactionStatus | null;
  result: PaymentReconciliationResult;
  difference_message?: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentReconciliationBatchListData = {
  items: PaymentReconciliationBatch[];
  total: number;
  page: number;
  page_size: number;
};

export type PaymentReconciliationBatchDetailData = {
  batch: PaymentReconciliationBatch;
  items: PaymentReconciliationItem[];
  total: number;
  page: number;
  page_size: number;
};

export type ConsumptionImportBatchStatus = "PARSING" | "PREVIEWED" | "IMPORTING" | "COMPLETED" | "EXPIRED" | "FAILED";
export type ConsumptionImportRowStatus = "VALID" | "INVALID" | "IMPORTED";

export type BillingBalanceSummary = {
  site_user_id: number;
  user_name: string;
  user_phone_masked: string;
  service_code: string;
  service_name: string;
  total_recharged: string;
  total_consumed: string;
  remaining_balance: string;
  insufficient: boolean;
  last_updated_at?: string | null;
};

export type BillingBalanceListData = {
  items: BillingBalanceSummary[];
  total: number;
  page: number;
  page_size: number;
};

export type BillingConsumption = {
  id: number;
  supplier_name: string;
  supplier_record_no: string;
  site_user_id: number;
  user_name?: string | null;
  user_phone_masked?: string | null;
  service_code: string;
  service_name: string;
  order_id?: number | null;
  order_no?: string | null;
  consumed_at: string;
  item_name: string;
  quantity?: string | null;
  unit?: string | null;
  amount: string;
  currency: "CNY";
  remark?: string | null;
  created_at: string;
};

export type BillingConsumptionListData = {
  items: BillingConsumption[];
  total: number;
  page: number;
  page_size: number;
  summary: {
    total_amount: string;
  };
};

export type WalletLedgerSourceType = "PAID_ORDER" | "CONSUMPTION" | "RECHARGE_ORDER" | "ORDER_PAYMENT";

export type AdminWalletLedgerItem = {
  id: number;
  site_user_id: number;
  user_name: string;
  user_phone_masked: string;
  entry_type: "CREDIT" | "DEBIT";
  amount: string;
  source_type: WalletLedgerSourceType;
  source_id: number;
  title: string;
  service_code?: string | null;
  service_name?: string | null;
  reference_no?: string | null;
  order_id?: number | null;
  occurred_at: string;
  created_at: string;
};

export type AdminWalletLedgerListData = {
  items: AdminWalletLedgerItem[];
  total: number;
  page: number;
  page_size: number;
};

export type AdminWalletRechargeItem = {
  id: number;
  recharge_no: string;
  site_user_id: number;
  user_name: string;
  user_phone_masked: string;
  amount: string;
  currency: "CNY";
  payment_method: "ALIPAY" | "WECHAT";
  status: BillingOrderStatus;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminWalletRechargeListData = {
  items: AdminWalletRechargeItem[];
  total: number;
  page: number;
  page_size: number;
};

export type TrustedDataspaceStatus = "SUBMITTING" | "PENDING" | "COMPLETED" | "REJECTED" | "SUBMIT_FAILED" | "SUBMISSION_UNKNOWN";

export type AdminTrustedDataspaceRegistration = {
  id: number;
  site_user_id: number;
  site_user_name: string;
  site_user_phone_masked: string;
  status: TrustedDataspaceStatus;
  dept_name: string;
  credit_code_masked: string;
  legal_person_name: string;
  legal_person_id_card_masked: string;
  legal_person_phone_masked: string;
  account: string;
  seq_no?: string | null;
  provider_message?: string | null;
  last_error_message?: string | null;
  can_retry: boolean;
  portal_url: string;
  submitted_at?: string | null;
  completed_at?: string | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminTrustedDataspaceRegistrationListData = {
  items: AdminTrustedDataspaceRegistration[];
  total: number;
  page: number;
  page_size: number;
  sync_warning?: string | null;
};

export type ConsumptionImportRow = {
  id: number;
  row_no: number;
  record_source: string;
  supplier_record_no?: string | null;
  consumed_at?: string | null;
  user_phone?: string | null;
  service_code?: string | null;
  supplier_name?: string | null;
  item_name?: string | null;
  quantity?: string | null;
  unit?: string | null;
  amount?: string | null;
  order_no?: string | null;
  remark?: string | null;
  site_user_id?: number | null;
  service_name?: string | null;
  order_id?: number | null;
  row_status: ConsumptionImportRowStatus;
  error_message?: string | null;
  raw_values: Record<string, string | null>;
};

export type ConsumptionImportBatch = {
  id: number;
  batch_no: string;
  record_source: string;
  file_name: string;
  file_sha256: string;
  status: ConsumptionImportBatchStatus;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  imported_rows: number;
  uploaded_by: number;
  confirmed_by?: number | null;
  uploaded_at: string;
  confirmed_at?: string | null;
  expires_at: string;
  error_message?: string | null;
};

export type ConsumptionImportBatchDetailData = {
  batch: ConsumptionImportBatch;
  items: ConsumptionImportRow[];
  total: number;
  page: number;
  page_size: number;
};
