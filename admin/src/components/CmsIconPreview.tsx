import type { CSSProperties, ReactNode } from "react";

type IconProps = {
  name?: string | null;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const baseSvgStyle: CSSProperties = {
  display: "block",
  flexShrink: 0,
};

function SvgIcon({
  children,
  size = 20,
  color = "currentColor",
  strokeWidth = 2,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      fill="none"
      height={size}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      style={baseSvgStyle}
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  );
}

function HomeIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 10.8V20h14v-9.2" />
      <path d="M10 20v-5h4v5" />
    </SvgIcon>
  );
}

function FileCheckIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M8 3h6l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M14 3v5h5" />
      <path d="M9.5 14.5l1.8 1.8 3.7-3.8" />
    </SvgIcon>
  );
}

function CoinsIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M8 9.5c0-1.9 2-3.5 4.5-3.5S17 7.6 17 9.5 15 13 12.5 13 8 11.4 8 9.5z" />
      <path d="M17 9.5V14c0 1.9-2 3.5-4.5 3.5S8 15.9 8 14V9.5" />
      <path d="M5 13c0-1.3 1-2.4 2.6-3" />
      <path d="M5 13v3c0 1.6 1.7 3 4 3" />
    </SvgIcon>
  );
}

function DatabaseIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </SvgIcon>
  );
}

function WorkflowIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="3" y="4" width="6" height="6" rx="1.5" />
      <rect x="15" y="4" width="6" height="6" rx="1.5" />
      <rect x="9" y="14" width="6" height="6" rx="1.5" />
      <path d="M9 7h6" />
      <path d="M12 10v4" />
    </SvgIcon>
  );
}

function BotIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="5" y="7" width="14" height="10" rx="3" />
      <path d="M12 3v4" />
      <path d="M9 20h6" />
      <circle cx="10" cy="12" r="1" fill={props.color || "currentColor"} stroke="none" />
      <circle cx="14" cy="12" r="1" fill={props.color || "currentColor"} stroke="none" />
      <path d="M9.5 15c.8.6 1.7.9 2.5.9s1.7-.3 2.5-.9" />
    </SvgIcon>
  );
}

function CpuIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <rect x="10" y="10" width="4" height="4" rx="0.8" />
      <path d="M10 3v2" />
      <path d="M14 3v2" />
      <path d="M10 19v2" />
      <path d="M14 19v2" />
      <path d="M3 10h2" />
      <path d="M3 14h2" />
      <path d="M19 10h2" />
      <path d="M19 14h2" />
    </SvgIcon>
  );
}

function CableIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h1A1.5 1.5 0 0 1 12 5.5V9" />
      <path d="M12 9V5.5A1.5 1.5 0 0 1 13.5 4h1A1.5 1.5 0 0 1 16 5.5V7" />
      <path d="M8 7h8v4a4 4 0 0 1-4 4h0a4 4 0 0 0-4 4v1" />
      <path d="M6 20h4" />
    </SvgIcon>
  );
}

function ZapIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M13 3L6 13h5l-1 8 8-11h-5l0-7z" />
    </SvgIcon>
  );
}

function BriefcaseIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M4 9.5A2.5 2.5 0 0 1 6.5 7h11A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
      <path d="M4 12.5c2.2 1.5 4.7 2.2 8 2.2s5.8-.7 8-2.2" />
    </SvgIcon>
  );
}

function UsersIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M16.5 19v-1.3A3.7 3.7 0 0 0 12.8 14h-1.6a3.7 3.7 0 0 0-3.7 3.7V19" />
      <path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M18.5 18.5v-1a3 3 0 0 0-2.3-2.9" />
      <path d="M16.5 5.7a2.7 2.7 0 0 1 0 5.1" />
    </SvgIcon>
  );
}

function SparklesIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
      <path d="M18.5 3.5l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z" />
      <path d="M5.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </SvgIcon>
  );
}

function FileBadge2Icon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M8 3h6l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M14 3v5h5" />
      <circle cx="12" cy="14" r="2.6" />
      <path d="M10.8 16.3L10 18l2-.8 2 .8-.8-1.7" />
    </SvgIcon>
  );
}

function ShieldCheckIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3l7 3v5c0 4.1-2.6 7.8-7 10-4.4-2.2-7-5.9-7-10V6z" />
      <path d="M9.5 12.5l1.7 1.7 3.5-3.7" />
    </SvgIcon>
  );
}

function Building2Icon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 20V6.5A1.5 1.5 0 0 1 5.5 5H12v15" />
      <path d="M12 20V3.5A1.5 1.5 0 0 1 13.5 2H18.5A1.5 1.5 0 0 1 20 3.5V20" />
      <path d="M7 8h2" />
      <path d="M7 11h2" />
      <path d="M7 14h2" />
      <path d="M15 7h2" />
      <path d="M15 10h2" />
      <path d="M15 13h2" />
      <path d="M10 20h4" />
    </SvgIcon>
  );
}

function UserCheckIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M15 19v-1.1a3.9 3.9 0 0 0-3.9-3.9H9.9A3.9 3.9 0 0 0 6 17.9V19" />
      <path d="M10.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M16.5 10.5l1.5 1.5 3-3" />
    </SvgIcon>
  );
}

function BanknoteIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect height="12" rx="2" ry="2" width="18" x="3" y="6" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9.5h.01" />
      <path d="M18 14.5h.01" />
    </SvgIcon>
  );
}

function TicketIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 9a2 2 0 0 0 0 6v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-6V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z" />
      <path d="M9 7v10" />
      <path d="M15 7v10" />
    </SvgIcon>
  );
}

const iconMap: Record<string, (props: IconProps) => JSX.Element> = {
  Banknote: BanknoteIcon,
  Bot: BotIcon,
  Briefcase: BriefcaseIcon,
  Building2: Building2Icon,
  Cable: CableIcon,
  Coins: CoinsIcon,
  Cpu: CpuIcon,
  Database: DatabaseIcon,
  FileBadge2: FileBadge2Icon,
  FileCheck: FileCheckIcon,
  Home: HomeIcon,
  ShieldCheck: ShieldCheckIcon,
  Sparkles: SparklesIcon,
  Ticket: TicketIcon,
  UserCheck: UserCheckIcon,
  Users: UsersIcon,
  Workflow: WorkflowIcon,
  Zap: ZapIcon,
};

export function CmsIconPreview({ name, size = 20, color = "currentColor", strokeWidth = 2 }: IconProps) {
  const Icon = (name && iconMap[name]) || BriefcaseIcon;
  return <Icon color={color} size={size} strokeWidth={strokeWidth} />;
}

export function CmsIconBadge({
  name,
  size = 18,
  strokeWidth = 2,
  background = "linear-gradient(180deg,#2b95ff 0%,#0f67e7 100%)",
  color = "#fff",
  wrapperSize = 36,
}: IconProps & {
  background?: string;
  wrapperSize?: number;
}) {
  return (
    <span
      style={{
        alignItems: "center",
        background,
        borderRadius: 999,
        boxShadow: "0 8px 18px rgba(15,103,231,0.18)",
        color,
        display: "inline-flex",
        height: wrapperSize,
        justifyContent: "center",
        width: wrapperSize,
      }}
    >
      <CmsIconPreview color={color} name={name} size={size} strokeWidth={strokeWidth} />
    </span>
  );
}
