import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-brand">404</p>
      <h1 className="mt-6 text-4xl font-bold text-slate-900">页面不存在</h1>
      <p className="mt-4 max-w-2xl text-base leading-8 text-slate-500">
        当前地址没有对应的页面。如果你是在验收阶段 2，这很可能意味着该页面还没有进入本轮开发范围。
      </p>
      <Link
        className="mt-8 inline-flex items-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white"
        href="/"
      >
        返回首页
      </Link>
    </div>
  );
}
