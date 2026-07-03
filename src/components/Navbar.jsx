import { useLocation, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";

const titles = {
  "/dashboard": "Dashboard",
  "/workers": "Workers",
  "/masters/categories": "Categories",
  "/masters/designs": "Designs",
  "/masters/rate-types": "Rate Types",
  "/masters/product-rates": "Product Rates",
  "/work-entries": "Work Entries",
  "/payments": "Payments",
  "/ready-stock": "Ready Stock",
  "/showrooms": "Showrooms",
  "/shipments": "Shipments",
  "/reports": "Reports",
  "/reports/worker-statements": "Worker Statements",
  "/reports/worker-summary": "Worker Summary",
  "/reports/payment-summary": "Payment Summary",
  "/reports/production": "Production Report",
  "/reports/shipments": "Shipment Report",
  "/reports/showroom-shipments": "Showroom Shipment History",
  "/sales/dashboard": "Sales Dashboard",
  "/sales": "Sales History",
  "/sales/add": "Add Sale",
  "/sales/reports": "Sales Reports",
};

function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-950 sm:text-xl">
              {titles[location.pathname] || "Furniture ERP"}
            </h2>
            <p className="hidden text-sm text-slate-500 sm:block">
              Manage daily factory operations from one workspace.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 sm:px-4"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
