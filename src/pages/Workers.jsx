import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import MainLayout from "../layouts/MainLayout";
import { useNotification } from "../hooks/useNotification";
import { getErrorMessage } from "../utils/errors";

function Workers() {
  const notification = useNotification();
  const [workers, setWorkers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    role: "CARPENTER",
    joiningDate: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadWorkers() {
    try {
      const response = await api.get("/workers");
      setWorkers(response.data);
    } catch (error) {
      notification.error(getErrorMessage(error, "Unable to load workers."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addWorker = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await api.post("/workers", form);
      setForm({
        name: "",
        phone: "",
        role: "CARPENTER",
        joiningDate: new Date().toISOString().slice(0, 10),
      });
      await loadWorkers();
      notification.success("Worker Added Successfully");
    } catch (error) {
      notification.error(getErrorMessage(error, "Failed to save worker."));
    } finally {
      setSaving(false);
    }
  };

  const filteredWorkers = workers.filter((worker) =>
    [worker.name, worker.phone, worker.role]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (worker) => (
        <Link to={`/workers/${worker.id}`} className="font-semibold text-blue-700 hover:text-blue-900">
          {worker.name}
        </Link>
      ),
    },
    { key: "phone", header: "Phone" },
    { key: "role", header: "Role" },
    {
      key: "status",
      header: "Status",
      render: (worker) => {
        const active = worker.active ?? worker.status !== "INACTIVE";

        return (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {active ? "Active" : "Inactive"}
          </span>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Add Worker</h3>
              <p className="mt-1 text-sm text-slate-500">Register production staff and assign their role.</p>
            </div>
          </div>

          <form onSubmit={addWorker} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label>
              <span className="field-label">Name</span>
              <input
                className="field-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Worker name"
                required
              />
            </label>
            <label>
              <span className="field-label">Phone</span>
              <input
                className="field-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
              />
            </label>
            <label>
              <span className="field-label">Role</span>
              <select
                className="field-input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="CARPENTER">Carpenter</option>
                <option value="POLISHER">Polisher</option>
                <option value="HELPER">Helper</option>
              </select>
            </label>
            <label>
              <span className="field-label">Joining Date</span>
              <input
                type="date"
                className="field-input"
                value={form.joiningDate}
                onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
              />
            </label>
            <div className="flex items-end">
              <button type="submit" disabled={saving} className="primary-button w-full">
                {saving ? "Adding..." : "Add Worker"}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Workers Directory</h3>
              <p className="text-sm text-slate-500">{filteredWorkers.length} workers shown</p>
            </div>
            <input
              className="field-input mt-0 sm:max-w-xs"
              placeholder="Search workers"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading ? (
            <LoadingSpinner label="Loading workers" />
          ) : (
            <DataTable columns={columns} data={filteredWorkers} emptyMessage="No workers match your search." />
          )}
        </section>
      </div>
    </MainLayout>
  );
}

export default Workers;
