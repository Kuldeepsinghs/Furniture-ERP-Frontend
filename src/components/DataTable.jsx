function DataTable({
  columns,
  data,
  emptyMessage = "No records found.",
  compact = false,
}) {
  return (
    <div>
      <div className="space-y-3 md:hidden">
        {data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
            {emptyMessage}
          </div>
        ) : (
          data.map((row, index) => (
            <article
              key={row.id ?? index}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70"
            >
              <div className="space-y-3">
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {column.header}
                    </span>
                    <span className="max-w-[58%] text-right text-sm font-medium text-slate-800">
                      {column.render ? column.render(row) : row[column.key] ?? "-"}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60 md:block">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${compact ? "px-4 py-2.5" : "px-5 py-3"} text-left text-xs font-bold uppercase tracking-wide text-slate-500`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={row.id ?? index} className="transition hover:bg-blue-50/40">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`${compact ? "px-4 py-3" : "px-5 py-4"} whitespace-nowrap text-sm text-slate-700`}
                    >
                      {column.render ? column.render(row) : row[column.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
