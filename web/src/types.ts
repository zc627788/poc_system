export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type SiteSettings = {
  site_name: string;
  site_subtitle: string;
  logo_url?: string | null;
  footer_text: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  icp_no?: string | null;
};

export type NavigationItem = {
  id: number;
  label: string;
  path: string;
  target_type: string;
  target_value: string;
  sort_order: number;
};

export type Banner = {
  id: number;
  title: string;
  subtitle: string;
  highlight_title: string;
  description: string;
  image_url: string;
  action_type: string;
  action_value?: string | null;
  sort_order: number;
};

export type Article = {
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
};

export type ResourceItem = {
  id: number;
  category: ResourceCategory;
  resource_type: string;
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
  tags: string[];
  meta: Record<string, unknown>;
  show_on_home: number;
  sort_order: number;
};

export type HomeMarketplaceGroup = {
  key: string;
  section?: PageSection | null;
  categories: ResourceCategory[];
  items: ResourceItem[];
};

export type HomeMarketplaceSummary = {
  summary?: PageSection | null;
  groups: HomeMarketplaceGroup[];
};

export type FeedbackSubmitPayload = {
  subject: string;
  content: string;
  phone: string;
  attachment_name?: string | null;
  attachment_url?: string | null;
};

export type FeedbackSubmitResult = {
  id: number;
  status: string;
};

export type SiteUserProfile = {
  id: number;
  name: string;
  phone: string;
  real_name?: string | null;
  mobile_fuzzy?: string | null;
  auth_source?: string;
  status: number;
  created_at: string;
  last_login_at?: string | null;
};

export type SiteUserAuthResult = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: SiteUserProfile;
};

export type TrustedDataspaceStatus =
  | "SUBMITTING"
  | "PENDING"
  | "COMPLETED"
  | "REJECTED"
  | "SUBMIT_FAILED"
  | "SUBMISSION_UNKNOWN";

export type TrustedDataspaceRegistration = {
  id: number;
  status: TrustedDataspaceStatus;
  dept_name: string;
  credit_code: string;
  credit_code_masked: string;
  legal_person_name: string;
  legal_person_id_card_masked: string;
  legal_person_phone: string;
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

export type TrustedDataspaceRegistrationSubmitPayload = {
  dept_name: string;
  credit_code: string;
  legal_person_name: string;
  legal_person_id_card: string;
  legal_person_phone: string;
  account: string;
  privacy_consent: boolean;
};

export type OpcMaterialUploadItem = {
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

export type OpcApplicationDraftPayload = {
  form: Record<string, unknown>;
  shareholders: Record<string, unknown>[];
  materials: Record<string, Array<{ id: number }>>;
};

export type OpcApplicationDraftData = {
  form: Record<string, unknown>;
  shareholders: Record<string, unknown>[];
  materials: Record<string, OpcMaterialUploadItem[]>;
  updated_at: string;
};

export type OpcApplicationDraftResponse = {
  draft: OpcApplicationDraftData | null;
};

export type OpcApplicationDraftSaveResponse = {
  ok: boolean;
  updated_at?: string | null;
};

export type OpcApplicationReviewRecord = {
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

export type OpcApplicationActionLog = {
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

export type OpcApplicationListItem = {
  id: number;
  application_no: string;
  site_user_id: number;
  site_user_name?: string | null;
  site_user_phone?: string | null;
  service_type: string;
  company_name: string;
  registered_capital: string;
  status: string;
  is_missing_materials: boolean;
  reject_reason_summary?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  updated_at: string;
};

export type OpcApplicationListResponse = {
  items: OpcApplicationListItem[];
  total: number;
  page: number;
  page_size: number;
};

export type OpcApplicationDetailResponse = {
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
  company_name_alternative_one?: string | null;
  company_name_alternative_two?: string | null;
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
  shareholders_json?: string | null;
  shareholders?: OpcApplicationShareholder[];
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
  materials: OpcMaterialUploadItem[];
  review_records: OpcApplicationReviewRecord[];
  action_logs: OpcApplicationActionLog[];
  created_at: string;
  updated_at: string;
};

export type OpcApplicationShareholder = {
  type?: string | null;
  name?: string | null;
  id_no?: string | null;
  subscribed_capital?: string | null;
  equity_ratio?: string | null;
  address?: string | null;
  phone?: string | null;
  valid_until?: string | null;
};

export type SiteUserLoginPayload = {
  phone: string;
  password: string;
};

export type SiteUserRegisterPayload = {
  name: string;
  phone: string;
  password: string;
};

export type BillingMode = "MONTHLY" | "PREPAID";

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
};

export type BillingOrderStatus = "PENDING_PAYMENT" | "PAID" | "CANCELED" | "PAYMENT_FAILED";
export type PaymentProvider = "MOCK";
export type PaymentTransactionStatus = "CREATED" | "PENDING" | "SUCCESS" | "FAILED" | "CLOSED";

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
  expires_at?: string | null;
  payment_transactions: PaymentTransaction[];
  created_at: string;
  updated_at: string;
};

export type BillingOrderList = {
  items: BillingOrder[];
  total: number;
  page: number;
  page_size: number;
};

export type OrderPaymentMethod = "EXTERNAL" | "WALLET";

export type PaymentLaunchResponse = {
  payment_no: string;
  provider: string;
  status: PaymentTransactionStatus;
  checkout_url: string;
  payment_method?: OrderPaymentMethod;
  order_id?: number | null;
  order_status?: BillingOrderStatus | null;
};

export type BillingOrderPaymentStatus = {
  order_id: number;
  order_no: string;
  order_status: BillingOrderStatus;
  payment_channel?: "EXTERNAL" | "WALLET" | null;
  paid_at?: string | null;
  latest_payment?: PaymentTransaction | null;
};

export type BillingBalance = {
  service_code: string;
  service_name: string;
  total_recharged: string;
  total_consumed: string;
  remaining_balance: string;
  insufficient: boolean;
  last_updated_at?: string | null;
};

export type BillingConsumption = {
  id: number;
  supplier_name: string;
  supplier_record_no: string;
  site_user_id: number;
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

export type BillingConsumptionList = {
  items: BillingConsumption[];
  total: number;
  page: number;
  page_size: number;
  summary: {
    total_amount: string;
  };
};

export type WalletPaymentMethod = "ALIPAY" | "WECHAT";
export type WalletEntryType = "CREDIT" | "DEBIT";
export type WalletLedgerSourceType = "PAID_ORDER" | "CONSUMPTION" | "RECHARGE_ORDER" | "ORDER_PAYMENT";

export type WalletSummary = {
  current_balance: string;
  total_recharged: string;
  total_consumed: string;
  last_updated_at?: string | null;
};

export type WalletLedgerRecord = {
  id: number;
  entry_type: WalletEntryType;
  amount: string;
  source_type: WalletLedgerSourceType;
  source_id: number;
  title: string;
  service_code?: string | null;
  service_name?: string | null;
  occurred_at: string;
  created_at: string;
};

export type WalletLedgerList = {
  items: WalletLedgerRecord[];
  total: number;
  page: number;
  page_size: number;
};

export type WalletTransactionType = "RECHARGE" | "ORDER_PAYMENT" | "PREPAID_CREDIT" | "CONSUMPTION" | "DIRECT_PURCHASE";

export type WalletTransaction = {
  id: string;
  transaction_type: WalletTransactionType;
  amount: string;
  title: string;
  occurred_at: string;
  reference_no?: string | null;
  order_id?: number | null;
  order_no?: string | null;
  service_code?: string | null;
  service_name?: string | null;
  payment_method?: WalletPaymentMethod | null;
};

export type WalletTransactionList = {
  items: WalletTransaction[];
  total: number;
  page: number;
  page_size: number;
};

export type WalletRechargeOrder = {
  id: number;
  recharge_no: string;
  amount: string;
  currency: "CNY";
  payment_method: WalletPaymentMethod;
  status: BillingOrderStatus;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type WalletPaymentTransaction = {
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

export type WalletRechargeLaunchResponse = {
  recharge: WalletRechargeOrder;
  payment: WalletPaymentTransaction;
  checkout_url: string;
};

export type WalletRechargePaymentStatus = {
  recharge_id: number;
  recharge_no: string;
  recharge_status: BillingOrderStatus;
  payment_method: WalletPaymentMethod;
  amount: string;
  paid_at?: string | null;
  latest_payment?: WalletPaymentTransaction | null;
};
