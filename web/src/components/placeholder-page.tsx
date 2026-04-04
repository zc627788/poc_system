export function PlaceholderPage({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-14">
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="bg-[linear-gradient(90deg,#0052d9_0%,#3b82f6_100%)] px-8 py-10 text-white">
          <p className="text-[12px] uppercase tracking-[0.32em] text-white/70">Coming Next</p>
          <h1 className="mt-4 text-[30px] font-bold">{title}</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-white/85">{description}</p>
        </div>
        <div className="px-8 py-10 text-[15px] leading-8 text-slate-600">
          当前页面暂未纳入本轮交付范围，现阶段保留导航入口和说明占位，后续会按资源模块和反馈闭环的节奏继续补齐。
        </div>
      </div>
    </div>
  );
}
