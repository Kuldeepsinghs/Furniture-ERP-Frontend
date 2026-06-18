import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

const Reports = () => {
  const reports = [
    { title: "Worker Statements", path: "/reports/worker-statements", description: "Detailed worker ledger for a selected worker." },
    { title: "Worker Summary", path: "/reports/worker-summary", description: "Balances and totals across the workforce." },
    { title: "Payment Summary", path: "/reports/payment-summary", description: "Payout totals and payment history." },
    { title: "Production Report", path: "/reports/production", description: "Searchable production output and values." },
    { title: "Shipment Report", path: "/reports/shipments", description: "Dispatch history with items and quantities." },
  ];

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <h3 className="page-heading">Reports</h3>
          <p className="muted-text mt-1">Choose a focused report screen from the cards below.</p>
        </section>
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <Link
              key={report.path}
              to={report.path}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
            >
              <h3 className="text-lg font-bold text-slate-950">{report.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{report.description}</p>
              <p className="mt-5 text-sm font-semibold text-blue-700">Open report</p>
            </Link>
          ))}
        </section>
      </div>
    </MainLayout>
  );
};

export default Reports;
