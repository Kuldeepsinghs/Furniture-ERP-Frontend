/**
 * Converts an array of row objects into a CSV file and triggers a browser
 * download. Works entirely client-side, no dependencies.
 *
 * @param {string} filename - e.g. "sales-history.csv"
 * @param {{ key: string, header: string }[]} columns - which fields to export and their column headers
 * @param {object[]} rows - the data rows; each row's value for a column is read via `row[column.key]`,
 *                           or via `column.value(row)` if provided for computed fields
 */
export function exportToCsv(filename, columns, rows) {
  const escapeCell = (value) => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);

    // Quote any cell containing a comma, quote, or newline, and escape inner quotes.
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const headerRow = columns.map((column) => escapeCell(column.header)).join(",");

  const dataRows = rows.map((row) =>
    columns
      .map((column) => escapeCell(column.value ? column.value(row) : row[column.key]))
      .join(","),
  );

  const csvContent = [headerRow, ...dataRows].join("\r\n");

  // Prefix with a BOM so Excel correctly detects UTF-8 (important for the
  // rupee symbol and any non-ASCII customer names).
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}