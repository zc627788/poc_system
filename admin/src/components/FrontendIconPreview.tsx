import type { CSSProperties } from "react";
import {
  Banknote,
  Briefcase,
  Building,
  Building2,
  Coins,
  Droplets,
  FileBadge2,
  FileCheck,
  FileText,
  Home,
  MapPin,
  Monitor,
  Receipt,
  ScrollText,
  Shield,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  User,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

type PreviewProps = {
  name?: string | null;
  size?: number;
  strokeWidth?: number;
  color?: string;
  background?: string;
  wrapperSize?: number;
  borderRadius?: number;
  shadow?: string;
};

type SupportCardLike = {
  icon?: string | null;
  title?: string | null;
  action_value?: string | null;
};

const commonCircleStyle: CSSProperties = {
  alignItems: "center",
  display: "inline-flex",
  justifyContent: "center",
};

const contentIconMap: Record<string, LucideIcon> = {
  Banknote,
  Briefcase,
  Building,
  Building2,
  Coins,
  Droplets,
  FileBadge2,
  FileCheck,
  FileText,
  Home,
  MapPin,
  Monitor,
  Receipt,
  Shield,
  Sparkles,
  Stamp: ScrollText,
  Ticket,
  TrendingUp,
  User,
  UserCheck,
  Users,
};

const communityRequirementIconMap: Record<string, LucideIcon> = {
  Users,
  Sparkles,
  FileBadge2,
  Building2,
  ShieldCheck,
  UserCheck,
};

export const communityRequirementIconOptions = [
  { label: "个人创业者 / 微型团队", value: "Users" },
  { label: "AI 相关领域开发", value: "Sparkles" },
  { label: "有效证件实名认证", value: "FileBadge2" },
  { label: "办公场地 / 主体机构", value: "Building2" },
  { label: "通过社区资质审核", value: "ShieldCheck" },
  { label: "身份核验通过", value: "UserCheck" },
];

export const serviceSupportIconOptions = [
  { label: "工商注册", value: "FileCheck" },
  { label: "安居落户", value: "Home" },
  { label: "融资对接", value: "Coins" },
  { label: "通用服务", value: "Briefcase" },
];

export const settlementCardIconOptions = [
  { label: "安居服务", value: "Home" },
  { label: "人才认证", value: "UserCheck" },
  { label: "办公楼宇", value: "Building" },
  { label: "票券权益", value: "Ticket" },
  { label: "资金补贴", value: "Banknote" },
  { label: "通用服务", value: "Briefcase" },
  { label: "办公场地 / 主体机构", value: "Building2" },
  { label: "资质保障", value: "Shield" },
];

export const financingCardIconOptions = [
  { label: "融资对接", value: "Coins" },
  { label: "基金增长", value: "TrendingUp" },
  { label: "滴灌基金", value: "Droplets" },
  { label: "资金补贴", value: "Banknote" },
  { label: "票券权益", value: "Ticket" },
  { label: "人才认证", value: "UserCheck" },
  { label: "办公楼宇", value: "Building" },
  { label: "通用服务", value: "Briefcase" },
];

export function resolveSupportCardIconName(item: SupportCardLike) {
  const actionValue = item.action_value?.trim().replace(/\/$/, "");
  const title = item.title?.trim() || "";

  if (actionValue === "/setup" || title.includes("工商")) {
    return "FileCheck";
  }

  if (actionValue === "/settlement" || title.includes("安居") || title.includes("落户")) {
    return "Home";
  }

  if (actionValue === "/financing" || title.includes("融资")) {
    return "Coins";
  }

  return item.icon?.trim() || "Briefcase";
}

export function normalizeCommunityRequirementIcon(item: { text?: string | null; icon?: string | null }) {
  const text = item.text?.trim() || "";
  const icon = item.icon?.trim() || "";

  if (text.includes("实名") || text.includes("证件")) {
    return icon === "Building2" || !icon ? "FileBadge2" : icon;
  }

  if (text.includes("审核")) {
    return icon || "ShieldCheck";
  }

  if (text.includes("AI")) {
    return icon || "Sparkles";
  }

  if (text.includes("团队") || text.includes("创业者")) {
    return icon || "Users";
  }

  return icon || "Sparkles";
}

export function FrontendContentIconPreview({
  name,
  size = 18,
  strokeWidth = 1.9,
  color = "#0052d9",
  background = "#eef4ff",
  wrapperSize = 36,
  borderRadius = 999,
  shadow = "none",
}: PreviewProps) {
  const Icon = contentIconMap[name || ""] || FileText;

  return (
    <span
      style={{
        ...commonCircleStyle,
        background,
        borderRadius,
        boxShadow: shadow,
        color,
        height: wrapperSize,
        width: wrapperSize,
      }}
    >
      <Icon size={size} strokeWidth={strokeWidth} />
    </span>
  );
}

export function FrontendCommunityRequirementIconPreview({
  name,
  size = 17,
  strokeWidth = 2,
  color = "#ffffff",
  background = "linear-gradient(180deg,#2b95ff 0%,#0f67e7 100%)",
  wrapperSize = 36,
  borderRadius = 999,
  shadow = "0 8px 18px rgba(15,103,231,0.18)",
}: PreviewProps) {
  const Icon = communityRequirementIconMap[name || ""] || Sparkles;

  return (
    <span
      style={{
        ...commonCircleStyle,
        background,
        borderRadius,
        boxShadow: shadow,
        color,
        height: wrapperSize,
        width: wrapperSize,
      }}
    >
      <Icon size={size} strokeWidth={strokeWidth} />
    </span>
  );
}
