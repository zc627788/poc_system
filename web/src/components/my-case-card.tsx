import type { ReactNode } from "react";
import type { OpcApplicationDetailResponse, OpcApplicationListItem } from "@/types";

const statusBadgeMap: Record<string, { label: string; className: string; textClassName?: string }> = {
  待审核: {
    label: "审核中",
    className: "bg-[#0052FF] text-white",
  },
  审核通过: {
    label: "审核通过",
    className: "bg-[#BEEC00] text-[#333333]",
    textClassName: "font-normal",
  },
  审核不通过: {
    label: "审核失败",
    className: "bg-[#FF5F57] text-white",
  },
  办理完成: {
    label: "办理完成",
    className: "bg-[#31A24C] text-[#111111]",
  },
};

function empty(value?: string | null) {
  return value && value.trim() ? value : "-";
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-2 border-b border-slate-100 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
      <div className="text-[13px] font-medium text-slate-500">{label}</div>
      <div className="text-[14px] leading-7 text-slate-800 break-all">{empty(value)}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6 rounded-[20px] border border-slate-200 bg-white p-5">
      <h3 className="text-[18px] font-bold text-slate-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ShareholdersTable({ shareholders }: { shareholders?: OpcApplicationDetailResponse["shareholders"] }) {
  if (!shareholders || shareholders.length === 0) {
    return <div className="rounded-[18px] border border-dashed border-slate-200 px-4 py-8 text-center text-[14px] text-slate-500">暂无股东信息</div>;
  }

  return (
    <div className="overflow-x-auto rounded-[8px] border border-slate-200">
      <table className="min-w-[960px] w-full border-collapse bg-white text-[13px]">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {["股东", "姓名", "证件号", "认缴额", "股权比例", "证件住址", "手机", "证件有效期"].map((title) => (
              <th className="border-b border-slate-200 px-3 py-3 text-left font-medium" key={title}>
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shareholders.map((item, index) => (
            <tr className="border-b border-slate-100 last:border-b-0" key={`${item.name || "shareholder"}-${index}`}>
              <td className="px-3 py-3">{empty(item.type)}</td>
              <td className="px-3 py-3">{empty(item.name)}</td>
              <td className="px-3 py-3">{empty(item.id_no)}</td>
              <td className="px-3 py-3">{empty(item.subscribed_capital)}</td>
              <td className="px-3 py-3">{empty(item.equity_ratio)}</td>
              <td className="px-3 py-3">{empty(item.address)}</td>
              <td className="px-3 py-3">{empty(item.phone)}</td>
              <td className="px-3 py-3">{empty(item.valid_until)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

export function MyCaseCard({
  item,
  detail,
  expanded,
  loading,
  onToggle,
}: {
  item: OpcApplicationListItem;
  detail?: OpcApplicationDetailResponse | null;
  expanded: boolean;
  loading: boolean;
  onToggle: (id: number) => void;
}) {
  const statusBadge = statusBadgeMap[item.status] || {
    label: item.status,
    className: "bg-[#FF5F57] text-white",
    textClassName: "",
  };

  void detail;
  void expanded;
  void loading;
  void onToggle;

  return (
    <div className="overflow-hidden rounded-[8px] border border-[#ECECEC] bg-[#FFFFFF]">
      <div className="w-full px-6 py-5 text-left">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className={`flex h-[25px] w-[72px] shrink-0 items-center justify-center rounded-[6px] text-[12px] font-semibold leading-none ${statusBadge.className} ${statusBadge.textClassName ?? ""}`}>
                {statusBadge.label}
              </div>
              <div className="text-[18px] font-bold text-[#222222]">OPC工商注册资料登记</div>
              <div className="ml-auto text-[14px] text-[#333333]">提交时间：{item.submitted_at}</div>
            </div>
          </div>
        </div>

        {item.reject_reason_summary ? (
          <div className="mt-5">
            <div className="text-[14px] text-[#333333]">审核不通过原因：</div>
            <div className="mt-2 text-[14px] leading-6 text-[#FF5F57]">{item.reject_reason_summary}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
