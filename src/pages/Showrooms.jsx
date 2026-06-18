import { useEffect, useState } from "react";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import MainLayout from "../layouts/MainLayout";
import { useNotification } from "../hooks/useNotification";
import { getErrorMessage } from "../utils/errors";

const Showrooms = () => {
  const notification = useNotification();
  const [showrooms, setShowrooms] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadShowrooms = async () => {
    try {
      const response = await api.get("/showrooms");
      setShowrooms(response.data);
    } catch (error) {
      notification.error(getErrorMessage(error, "Unable to load showrooms."));
    } finally {
      setLoading(false);
    }
  };

  const filteredShowrooms = showrooms.filter((showroom) =>
    [showroom.name, showroom.phone, showroom.address]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadShowrooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addShowroom = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await api.post("/showrooms", form);
      setForm({ name: "", phone: "", address: "" });
      await loadShowrooms();
      notification.success("Showroom Added Successfully");
    } catch (error) {
      notification.error(getErrorMessage(error, "Failed to save showroom."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <h3 className="text-lg font-bold text-slate-950">Add Showroom</h3>
          <form onSubmit={addShowroom} className="mt-5 grid gap-4 lg:grid-cols-4">
            <label>
              <span className="field-label">Name</span>
              <input
                className="field-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Showroom name"
                required
              />
            </label>
            <label>
              <span className="field-label">Phone</span>
              <input
                className="field-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Contact number"
              />
            </label>
            <label className="lg:col-span-2">
              <span className="field-label">Address</span>
              <input
                className="field-input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Showroom address"
              />
            </label>
            <div className="lg:col-span-4">
              <button type="submit" disabled={saving} className="primary-button">
                {saving ? "Adding..." : "Add Showroom"}
              </button>
            </div>
          </form>
        </section>

        {loading ? (
          <LoadingSpinner label="Loading showrooms" />
        ) : (
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Showroom Directory</h3>
                <p className="text-sm text-slate-500">{filteredShowrooms.length} showrooms shown</p>
              </div>
              <input
                className="field-input mt-0 sm:max-w-xs"
                placeholder="Search showrooms"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredShowrooms.map((showroom) => (
                <article key={showroom.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">{showroom.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{showroom.phone || "No phone added"}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Showroom</span>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-slate-600">{showroom.address || "Address not provided"}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default Showrooms;
