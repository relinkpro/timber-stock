import Link from "next/link";
import { getServiceClient, InventoryItem } from "@/lib/supabase";
import { statusOf, STATUS_META, type StockLevel } from "@/lib/stockStatus";
import { ColumnChart, BarList } from "./Charts";

export const dynamic = "force-dynamic";

type Movement = { item_id: string; change_amount: number; created_at: string };

const DAY = 86400000;

export default async function DashboardPage() {
  const supabase = getServiceClient();

  const now = new Date();
  const since = new Date(now.getTime() - 180 * DAY).toISOString();

  const [
    { data: itemsData, error: itemsErr },
    { data: movesData, error: movesErr },
  ] = await Promise.all([
    supabase.from("inventory_items").select("*").eq("archived", false),
    supabase
      .from("stock_movements")
      .select("item_id, change_amount, created_at")
      .gte("created_at", since),
  ]);

  const loadError = itemsErr?.message || movesErr?.message || null;
  const items = (itemsData ?? []) as InventoryItem[];
  const moves = (movesData ?? []) as Movement[];
  const itemName = new Map(items.map((i) => [i.id, i.name]));

  // ---- traffic lights ----
  const counts: Record<StockLevel, number> = { red: 0, amber: 0, green: 0, none: 0 };
  for (const it of items) counts[statusOf(it)]++;

  const reorder = items
    .map((it) => ({ it, s: statusOf(it) }))
    .filter((x) => x.s === "red" || x.s === "amber")
    .sort(
      (a, b) =>
        STATUS_META[a.s].rank - STATUS_META[b.s].rank ||
        a.it.quantity - a.it.min_level - (b.it.quantity - b.it.min_level)
    );

  // ---- usage (units taken out = negative movements) ----
  const out = (m: Movement) => (m.change_amount < 0 ? -m.change_amount : 0);
  const cutoff30 = now.getTime() - 30 * DAY;

  const used30 = moves
    .filter((m) => new Date(m.created_at).getTime() >= cutoff30)
    .reduce((s, m) => s + out(m), 0);

  // most-used parts (30 days)
  const byItem = new Map<string, number>();
  for (const m of moves) {
    if (new Date(m.created_at).getTime() < cutoff30) continue;
    const u = out(m);
    if (u) byItem.set(m.item_id, (byItem.get(m.item_id) || 0) + u);
  }
  const topParts = [...byItem.entries()]
    .map(([id, value]) => ({ label: itemName.get(id) || "Unknown", value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // daily (last 14 days)
  const daily: { label: string; value: number }[] = [];
  for (let d = 13; d >= 0; d--) {
    const day = new Date(now.getTime() - d * DAY);
    const key = day.toISOString().slice(0, 10);
    const value = moves
      .filter((m) => m.created_at.slice(0, 10) === key)
      .reduce((s, m) => s + out(m), 0);
    daily.push({ label: `${day.getDate()}/${day.getMonth() + 1}`, value });
  }

  // monthly (last 6 months)
  const monthly: { label: string; value: number }[] = [];
  for (let mo = 5; mo >= 0; mo--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - mo, 1);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const value = moves
      .filter((m) => m.created_at.slice(0, 7) === key)
      .reduce((s, m) => s + out(m), 0);
    monthly.push({
      label: dt.toLocaleDateString("en-IE", { month: "short" }),
      value,
    });
  }

  const kpis = [
    { key: "red" as const, n: counts.red },
    { key: "amber" as const, n: counts.amber },
    { key: "green" as const, n: counts.green },
  ];

  return (
    <>
      <div className="brand-header">
        <Link href="/admin/items" aria-label="Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/byrne-logo.png" alt="Byrne Trailers" />
        </Link>
        <div style={{ lineHeight: 1.1 }}>
          <div className="brand-eyebrow">Stock Control</div>
          <div className="brand-title">Dashboard</div>
        </div>
      </div>

      <div className="wrap">
        <p className="muted">
          <Link href="/admin/items">← Products</Link> ·{" "}
          <Link href="/jobs">Jobs</Link>
        </p>

        {loadError ? (
          <p className="error">Couldn’t load data: {loadError}</p>
        ) : null}

        {/* KPI tiles */}
        <div className="kpi-row">
          {kpis.map((k) => {
            const meta = STATUS_META[k.key];
            return (
              <div className="kpi" key={k.key} style={{ background: meta.bg }}>
                <div className="kpi-num" style={{ color: meta.color }}>
                  {k.n}
                </div>
                <div className="kpi-label" style={{ color: meta.color }}>
                  {meta.label}
                </div>
              </div>
            );
          })}
          <div className="kpi" style={{ background: "#eef0f3" }}>
            <div className="kpi-num" style={{ color: "#14161a" }}>
              {used30}
            </div>
            <div className="kpi-label muted">Used · 30d</div>
          </div>
        </div>

        {/* Reorder list — the actionable part */}
        <div className="card">
          <div className="card-title" style={{ fontSize: 16, marginBottom: 8 }}>
            To reorder
          </div>
          {reorder.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              ✅ Nothing low. Everything with levels set is stocked.
            </p>
          ) : (
            <div className="reorder-list">
              {reorder.map(({ it, s }) => {
                const meta = STATUS_META[s];
                return (
                  <div className="reorder-row" key={it.id}>
                    <span
                      className="status-dot"
                      style={{ background: meta.color }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{it.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {it.location ? `${it.location} · ` : ""}
                        have {it.quantity} · min {it.min_level} · max{" "}
                        {it.max_level}
                      </div>
                    </div>
                    <span
                      style={{ color: meta.color, fontWeight: 700, fontSize: 13 }}
                    >
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Most-used parts */}
        <div className="card">
          <div className="card-title" style={{ fontSize: 16, marginBottom: 10 }}>
            Most used · last 30 days
          </div>
          <BarList data={topParts} color="#bb1620" />
        </div>

        {/* Daily */}
        <div className="card">
          <div className="card-title" style={{ fontSize: 16, marginBottom: 10 }}>
            Parts used per day · last 14 days
          </div>
          <ColumnChart data={daily} />
        </div>

        {/* Monthly */}
        <div className="card">
          <div className="card-title" style={{ fontSize: 16, marginBottom: 10 }}>
            Parts used per month · last 6 months
          </div>
          <ColumnChart data={monthly} color="#bb1620" />
        </div>

        <div className="footer-note">Byrne Trailers · Stock Control</div>
      </div>
    </>
  );
}
