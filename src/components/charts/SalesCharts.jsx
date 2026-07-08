
import { formatCurrency } from "../../utils/format";

const PALETTE = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
];

function ChartCard({ title, subtitle, empty, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h4 className="text-base font-bold text-slate-950">{title}</h4>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {empty ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">
          No data for this period.
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * Revenue trend as a simple bar chart, one bar per day.
 */
export function RevenueTrendChart({ data }) {
  const points = data ?? [];
  const empty = points.length === 0;
  const max = Math.max(1, ...points.map((point) => point.revenue));
  const width = 700;
  const height = 220;
  const paddingLeft = 8;
  const paddingBottom = 28;
  const chartHeight = height - paddingBottom;
  const barGap = 8;
  const barWidth = points.length
    ? Math.max(6, (width - paddingLeft * 2) / points.length - barGap)
    : 0;

  return (
    <ChartCard title="Revenue Trend" subtitle="Daily revenue for the selected period" empty={empty}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Revenue trend chart">
        <line x1={paddingLeft} y1={chartHeight} x2={width} y2={chartHeight} stroke="#e2e8f0" strokeWidth="1" />
        {points.map((point, index) => {
          const barHeight = (point.revenue / max) * (chartHeight - 20);
          const x = paddingLeft + index * (barWidth + barGap);
          const y = chartHeight - barHeight;

          return (
            <g key={point.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx={4}
                fill="#2563eb"
                className="transition-opacity hover:opacity-80"
              >
                <title>{`${point.label}: ${formatCurrency(point.revenue)}`}</title>
              </rect>
              {points.length <= 14 && (
                <text
                  x={x + barWidth / 2}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748b"
                >
                  {point.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </ChartCard>
  );
}

/**
 * Category / location revenue breakdown as a donut chart with a legend.
 */
export function BreakdownDonutChart({ title, subtitle, data }) {
  const entries = data ?? [];
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  const empty = entries.length === 0 || total <= 0;

  const size = 180;
  const radius = 70;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;

  return (
    <ChartCard title={title} subtitle={subtitle} empty={empty}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title}>
          <g transform={`translate(${size / 2}, ${size / 2}) rotate(-90)`}>
            <circle r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
            {entries.reduce(
              (acc, entry, index) => {
                const fraction = entry.value / total;
                const dash = fraction * circumference;
                const segmentOffset = acc.offset;

                acc.offset += dash;
                acc.nodes.push(
                  <circle
                    key={entry.label}
                    r={radius}
                    fill="none"
                    stroke={PALETTE[index % PALETTE.length]}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-segmentOffset}
                  >
                    <title>{`${entry.label}: ${formatCurrency(entry.value)}`}</title>
                  </circle>,
                );

                return acc;
              },
              { offset: 0, nodes: [] },
            ).nodes}
          </g>
          <text
            x="50%"
            y="47%"
            textAnchor="middle"
            fontSize="11"
            fill="#94a3b8"
            fontWeight="600"
          >
            TOTAL
          </text>
          <text x="50%" y="60%" textAnchor="middle" fontSize="13" fill="#0f172a" fontWeight="700">
            {formatCurrency(total)}
          </text>
        </svg>

        <ul className="flex-1 space-y-2 text-sm">
          {entries.map((entry, index) => (
            <li key={entry.label} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-slate-700">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
                />
                {entry.label}
              </span>
              <span className="font-semibold text-slate-900">{formatCurrency(entry.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}

/**
 * Horizontal bar chart, useful for location / category comparisons with more entries.
 */
export function HorizontalBarChart({ title, subtitle, data }) {
  const entries = data ?? [];
  const empty = entries.length === 0;
  const max = Math.max(1, ...entries.map((entry) => entry.value));

  return (
    <ChartCard title={title} subtitle={subtitle} empty={empty}>
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div key={entry.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{entry.label}</span>
              <span className="text-slate-500">{formatCurrency(entry.value)}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(entry.value / max) * 100}%`,
                  backgroundColor: PALETTE[index % PALETTE.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}