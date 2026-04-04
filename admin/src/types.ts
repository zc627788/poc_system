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
  action_type: string;
  action_value?: string | null;
  button_text?: string | null;
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
  tags_json?: string | null;
  meta_json?: string | null;
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
  phone: string;
  status: number;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
};
