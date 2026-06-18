function DashboardCard({ title, value, helper, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-green-50 text-green-700 ring-green-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{value ?? 0}</p>
        </div>
        <span
          className={`rounded-lg px-3 py-2 text-xs font-bold ring-1 ${tones[tone]}`}
        >
          KPI
        </span>
      </div>
      {helper && <p className="mt-4 text-sm text-slate-500">{helper}</p>}
    </div>
  );
}

export default DashboardCard;
