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
  action_type: string;
  action_value?: string | null;
  button_text?: string | null;
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
  tags: string[];
  meta: Record<string, unknown>;
  sort_order: number;
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

export type SiteUserLoginPayload = {
  phone: string;
  password: string;
};

export type SiteUserRegisterPayload = {
  name: string;
  phone: string;
  password: string;
};
