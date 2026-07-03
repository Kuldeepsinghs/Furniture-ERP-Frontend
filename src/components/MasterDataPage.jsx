import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import api from "../api/axios";
import DataTable from "./DataTable";
import LoadingSpinner from "./LoadingSpinner";
import MainLayout from "../layouts/MainLayout";
import { useNotification } from "../hooks/useNotification";
import { canMutateData } from "../utils/auth";
import { getErrorMessage } from "../utils/errors";
import { asArray, formatCurrency, getName } from "../utils/format";

function MasterDataPage({
  title,
  description,
  endpoint,
  fields,
  columns,
  defaultValues,
  dependencies = [],
  buildPayload,
  successMessage,
  failureMessage,
  validate,
  infoBanner,
  recordToForm,
}) {
  const notification = useNotification();
  const [records, setRecords] = useState([]);
  const [dependencyData, setDependencyData] = useState({});
  const [form, setForm] = useState(defaultValues);
  const [editingRecord, setEditingRecord] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canEdit = canMutateData();

  const loadData = useCallback(async () => {
    try {
      const [recordsRes, ...dependencyResponses] = await Promise.all([
        api.get(endpoint),
        ...dependencies.map((dependency) => api.get(dependency.endpoint)),
      ]);

      setRecords(asArray(recordsRes.data));

      const nextDependencyData = {};
      dependencies.forEach((dependency, index) => {
        nextDependencyData[dependency.key] = asArray(dependencyResponses[index].data);
      });
      setDependencyData(nextDependencyData);
    } catch (error) {
      notification.error(getErrorMessage(error, "Unable to load data."));
    } finally {
      setLoading(false);
    }
  }, [dependencies, endpoint, notification]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const filteredRecords = useMemo(() => {
    const term = search.toLowerCase();

    return records.filter((record) =>
      JSON.stringify(record).toLowerCase().includes(term)
    );
  }, [records, search]);

  const submit = async (event) => {
    event.preventDefault();

    const validationMessage = validate?.(form, { records, dependencyData, editingRecord });

    if (validationMessage) {
      notification.warning(validationMessage);
      return;
    }

    setSaving(true);

    try {
      const payload = buildPayload ? buildPayload(form) : form;

      if (editingRecord) {
        await api.put(`${endpoint}/${editingRecord.id}`, payload);
      } else {
        await api.post(endpoint, payload);
      }

      setForm(defaultValues);
      setEditingRecord(null);
      await loadData();
      notification.success(editingRecord ? "Updated Successfully" : successMessage ?? `${title} saved successfully.`);
    } catch (error) {
      notification.error(getErrorMessage(error, editingRecord ? "Unable to Update" : failureMessage ?? `Failed to save ${title.toLowerCase()}.`));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (record) => {
    setEditingRecord(record);
    setForm(recordToForm ? recordToForm(record) : { ...defaultValues, ...record });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingRecord(null);
    setForm(defaultValues);
  };

  const deleteRecord = async (record) => {
    if (!window.confirm(`Delete ${title.slice(0, -1) || title}?`)) return;

    try {
      await api.delete(`${endpoint}/${record.id}`);
      await loadData();
      notification.success("Deleted Successfully");
    } catch (error) {
      notification.error(getErrorMessage(error, "Unable to Delete"));
    }
  };

  const renderField = (field) => {
    if (field.type === "select") {
      const options = dependencyData[field.optionsKey] ?? field.options ?? [];

      return (
        <select
          className="field-input"
          value={form[field.name]}
          onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
          required={field.required}
        >
          <option value="">{field.placeholder ?? `Select ${field.label}`}</option>
          {options.map((option) => (
            <option key={option.id ?? option.value} value={option.id ?? option.value}>
              {field.optionLabel ? field.optionLabel(option) : getName(option)}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type ?? "text"}
        min={field.min}
        step={field.step}
        className="field-input"
        value={form[field.name]}
        onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
        placeholder={field.placeholder}
        required={field.required}
      />
    );
  };

  return (
    <MainLayout>
      <div className="page-stack">
        <section className="section-card">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="page-heading">{title}</h3>
              <p className="muted-text mt-1">{description}</p>
            </div>
            <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
              {records.length} records
            </div>
          </div>

          {canEdit && (
            <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {fields.map((field) => (
                <label key={field.name} className={field.span ? field.span : undefined}>
                  <span className="field-label">{field.label}</span>
                  {renderField(field)}
                </label>
              ))}
              <div className="flex items-end">
                <button type="submit" disabled={saving} className="primary-button w-full">
                  {saving ? "Saving..." : editingRecord ? `Update ${title}` : `Add ${title}`}
                </button>
              </div>
              {editingRecord && (
                <div className="flex items-end">
                  <button type="button" onClick={cancelEdit} className="secondary-button flex w-full items-center justify-center gap-2">
                    <X size={16} />
                    Cancel Edit
                  </button>
                </div>
              )}
            </form>
          )}

          {infoBanner && (
            <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
              {infoBanner}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">{title} List</h3>
              <p className="text-sm text-slate-500">Search, review, and use master data across operations.</p>
            </div>
            <input
              className="field-input mt-0 sm:max-w-xs"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${title.toLowerCase()}`}
            />
          </div>

          {loading ? (
            <LoadingSpinner label={`Loading ${title.toLowerCase()}`} />
          ) : (
            <DataTable
              columns={[
                ...columns.map((column) =>
                  column.currency
                    ? {
                        ...column,
                        render: (row) => formatCurrency(row[column.key]),
                      }
                    : column
                ),
                ...(canEdit
                  ? [
                      {
                        key: "actions",
                        header: "Actions",
                        render: (row) => (
                          <div className="flex items-center justify-end gap-2 md:justify-start">
                            <button
                              type="button"
                              onClick={() => startEdit(row)}
                              className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteRecord(row)}
                              className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
              data={filteredRecords}
              emptyMessage={`No ${title.toLowerCase()} found.`}
            />
          )}
        </section>
      </div>
    </MainLayout>
  );
}

export default MasterDataPage;
