import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BadgeDollarSign,
  BarChart3,
  Boxes,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  Package,
  Palette,
  Settings,
  Store,
  Tags,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";

const sections = [
  {
    title: "Dashboard",
    items: [{ name: "Dashboard", path: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Masters",
    items: [
      { name: "Workers", path: "/workers", icon: Users },
      { name: "Categories", path: "/masters/categories", icon: Tags },
      { name: "Designs", path: "/masters/designs", icon: Palette },
      { name: "Rate Types", path: "/masters/rate-types", icon: Settings },
      { name: "Product Rates", path: "/masters/product-rates", icon: BadgeDollarSign },
      { name: "Showrooms", path: "/showrooms", icon: Store },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Work Entries", path: "/work-entries", icon: ClipboardList },
      { name: "Payments", path: "/payments", icon: Wallet },
      { name: "Ready Stock", path: "/ready-stock", icon: Package },
      { name: "Shipments", path: "/shipments", icon: Truck },
    ],
  },
  {
    title: "Reports",
    items: [
      { name: "Worker Statements", path: "/reports/worker-statements", icon: BarChart3 },
      { name: "Worker Summary", path: "/reports/worker-summary", icon: Users },
      { name: "Payment Summary", path: "/reports/payment-summary", icon: Wallet },
      { name: "Production Report", path: "/reports/production", icon: FileBarChart },
      { name: "Shipment Report", path: "/reports/shipments", icon: Truck },
      {
        name: "Showroom Shipment History",
        path: "/reports/showroom-shipments",
        icon: Boxes,
      },
    ],
  },
];

function SidebarSection({ section, open, onToggle, onClose }) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
      >
        <span>{section.title}</span>
        <span className="text-base leading-none">{open ? "-" : "+"}</span>
      </button>

      {open && (
        <div className="mt-1 space-y-1">
          {section.items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10">
                  <Icon size={17} strokeWidth={2.2} />
                </span>
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Sidebar({ open, onClose }) {
  const location = useLocation();
  const initialOpen = useMemo(() => {
    const state = {};

    sections.forEach((section) => {
      state[section.title] = section.items.some((item) =>
        location.pathname.startsWith(item.path)
      );
    });

    return state;
  }, [location.pathname]);

  const [openSections, setOpenSections] = useState({
    Dashboard: true,
    Masters: true,
    Operations: true,
    Reports: true,
    ...initialOpen,
  });

  const toggleSection = (title) => {
    setOpenSections((current) => ({
      ...current,
      [title]: !current[title],
    }));
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/50 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[min(20rem,88vw)] transform bg-slate-950 text-white shadow-2xl shadow-slate-950/40 transition-transform duration-200 lg:static lg:w-80 lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
                  Factory ERP
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight">
                  Furniture Works
                </h1>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Production, inventory, payroll, and dispatch control.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-5">
            {sections.map((section) => (
              <SidebarSection
                key={section.title}
                section={section}
                open={openSections[section.title]}
                onToggle={() => toggleSection(section.title)}
                onClose={onClose}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
