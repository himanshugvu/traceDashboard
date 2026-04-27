import { useEffect, useState } from "react";
import { fetchJson } from "../api";
import { KpiCard } from "../components/KpiCard";
import type { DashboardResponse } from "../types";

type DashboardScreenProps = {
  day: string;
  onDayChange: (day: string) => void;
  onOpenLogs: (appName: string, apiName: string) => void;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat().format(value ?? 0);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "--";
  }
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function exportCsv(rows: DashboardResponse["rows"], day: string) {
  const csvLines = [
    ["App Name", "API Name", "Total", "Success", "Failures"].join(","),
    ...rows.map((row) =>
      [row.appName, row.apiName, row.traceCount, row.successCount, row.failureCount]
        .map((value) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`)
        .join(",")
    )
  ];

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `trace-breakdown-${day}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function DashboardScreen({ day, onDayChange, onOpenLogs }: DashboardScreenProps) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [day]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchJson<DashboardResponse>(`/api/v1/dashboard?date=${day}&page=${page}&size=25&refreshToken=${refreshToken}`, controller.signal)
      .then(setData)
      .catch((nextError) => {
        if (!controller.signal.aborted) {
          setError(nextError instanceof Error ? nextError.message : String(nextError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [day, page, refreshToken]);

  const rows = data?.rows ?? [];
  const totalPages = data?.totalPages ?? 0;
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;
  const totalSuccess = rows.reduce((sum, row) => sum + (row.successCount ?? 0), 0);
  const totalFailures = rows.reduce((sum, row) => sum + (row.failureCount ?? 0), 0);
  const successRate = (data?.kpis.totalTraces ?? 0) === 0 ? 0 : (totalSuccess * 100) / (data?.kpis.totalTraces ?? 0);

  return (
    <section className="screen-shell">
      <div className="trace-toolbar">
        <div className="trace-toolbar-left">
          <div className="brand trace-toolbar-brand">
            <div className="brand-mark">TD</div>
          </div>

          <div className="trace-toolbar-title">
            <strong>Dashboard</strong>
          </div>
        </div>

        <div className="trace-toolbar-actions">
          <div className="day-toggle">
            <span>Day:</span>
            <button
              className={day === todayIso() ? "chip-button active" : "chip-button"}
              type="button"
              onClick={() => onDayChange(todayIso())}
            >
              Today
            </button>
            <button
              className={day === yesterdayIso() ? "chip-button active" : "chip-button"}
              type="button"
              onClick={() => onDayChange(yesterdayIso())}
            >
              Yesterday
            </button>
          </div>
          <label className="trace-toolbar-field">
            <input type="date" value={day} onChange={(event) => onDayChange(event.target.value)} />
          </label>
          <button className="trace-toolbar-chip" type="button" onClick={() => setRefreshToken((value) => value + 1)}>
            Refresh
          </button>
          <span className="updated-text">
            Updated {data?.generatedAt ? formatDateTime(data.generatedAt) : "--"}
          </span>
        </div>
      </div>

      {error ? <div className="banner error">{error}</div> : null}

      <div className="kpi-grid">
        <KpiCard label="Total Requests" value={formatNumber(data?.kpis.totalTraces)} icon="total" />
        <KpiCard label="Success" value={formatNumber(totalSuccess)} icon="success" />
        <KpiCard label="Failures" value={formatNumber(totalFailures)} tone="danger" icon="failure" />
        <KpiCard label="Success Rate" value={`${successRate.toFixed(2)}%`} icon="rate" />
        <KpiCard label="Unique Apps" value={formatNumber(data?.kpis.uniqueApps)} icon="apps" />
        <KpiCard label="Unique APIs" value={formatNumber(data?.kpis.uniqueApis)} icon="apis" />
      </div>

      <div className="panel panel-breakdown">
        <div className="panel-header panel-header-breakdown">
          <div>
            <h3>All App Breakdown</h3>
          </div>
          <button
            className="link-action"
            type="button"
            onClick={() => exportCsv(rows, day)}
            disabled={rows.length === 0}
          >
            Export
          </button>
        </div>

        <div className="table-wrap">
          <table className="breakdown-table">
            <thead>
              <tr>
                <th>App</th>
                <th>API</th>
                <th>Total</th>
                <th>Success</th>
                <th>Failures</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    {loading ? "Loading dashboard..." : "No trace data found for this date."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={`${row.apiName}-${row.appName}`}
                    className="clickable"
                    onClick={() => onOpenLogs(row.appName, row.apiName)}
                  >
                    <td>
                      <div className="event-name">{row.appName || "--"}</div>
                    </td>
                    <td>
                      <div className="event-name">{row.apiName || "--"}</div>
                    </td>
                    <td className="mono">{formatNumber(row.traceCount)}</td>
                    <td className="mono">{formatNumber(row.successCount)}</td>
                    <td className="mono failure-text">{formatNumber(row.failureCount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="trace-observability-footer">
          <span>
            {loading
              ? "Refreshing dashboard..."
              : `Showing ${rows.length} rows on this page | ${formatNumber(data?.totalElements ?? 0)} total scope rows`}
          </span>
          <div className="trace-footer-pager">
            <button className="trace-page-button" type="button" onClick={() => setPage(0)} disabled={!canPrev}>
              First
            </button>
            <button className="trace-page-button" type="button" onClick={() => setPage((value) => value - 1)} disabled={!canPrev}>
              Prev
            </button>
            <span className="trace-page-indicator">{Math.min((data?.page ?? 0) + 1, Math.max(totalPages, 1))}</span>
            <button className="trace-page-button" type="button" onClick={() => setPage((value) => value + 1)} disabled={!canNext}>
              Next
            </button>
            <button className="trace-page-button" type="button" onClick={() => setPage(Math.max(totalPages - 1, 0))} disabled={!canNext}>
              Last
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
