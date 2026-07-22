// Lightweight, dependency-free charts rendered as CSS bars. Server components.

export function ColumnChart({
  data,
  color = "#2c3038",
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="col-chart">
      {data.map((d, i) => (
        <div className="col" key={i}>
          <div className="col-bar-wrap">
            {d.value > 0 ? <div className="col-val">{d.value}</div> : null}
            <div
              className="col-bar"
              style={{
                height: `${(d.value / max) * 100}%`,
                background: color,
              }}
            />
          </div>
          <div className="col-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export function BarList({
  data,
  color = "#2c3038",
}: {
  data: { label: string; sub?: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return <p className="muted">No usage recorded yet.</p>;
  }
  return (
    <div className="hbars">
      {data.map((d, i) => (
        <div className="hbar-row" key={i}>
          <div className="hbar-label">
            {d.label}
            {d.sub ? <span className="muted"> · {d.sub}</span> : null}
          </div>
          <div className="hbar-track">
            <div
              className="hbar-fill"
              style={{ width: `${(d.value / max) * 100}%`, background: color }}
            />
          </div>
          <div className="hbar-val">{d.value}</div>
        </div>
      ))}
    </div>
  );
}
