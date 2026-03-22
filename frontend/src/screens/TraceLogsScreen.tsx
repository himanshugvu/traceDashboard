import { useEffect, useMemo, useRef, useState } from "react";
import { fetchJson } from "../api";
import { KpiCard } from "../components/KpiCard";
import { PayloadPanel } from "../components/PayloadPanel";
import type {
  TraceDetailResponse,
  TraceFiltersState,
  TraceOverviewResponse,
  TraceSearchResponse
} from "../types";

type TraceLogsScreenProps = {
  day: string;
  initialAppName: string;
  initialApiName: string;
  onBack: () => void;
  onScopeChange: (appName: string, apiName: string) => void;
  onDayChange: (day: string) => void;
  embedded?: boolean;
};

type SearchField = "all" | "correlationId" | "channelId" | "appName" | "payload";
type TabMode = "success" | "failure";

const PAGE_SIZE = 50;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function buildDefaultFilters(day: string, apiName: string, appName: string): TraceFiltersState {
  return {
    apiName,
    appName,
    correlationId: "",
    channelId: "",
    payloadQuery: "",
    globalQuery: "",
    from: `${day}T00:00`,
    to: `${day}T23:59`
  };
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

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatLatency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "--";
  }
  return `${Math.round(value)}ms`;
}

function displayAppName(value: string) {
  return value.trim() ? value : "All Apps";
}

function displayApiName(value: string) {
  return value.trim() ? value : "All APIs";
}

function buildFilters(
  day: string,
  apiName: string,
  appName: string,
  searchField: SearchField,
  searchValue: string,
  from: string,
  to: string
) {
  const next = buildDefaultFilters(day, apiName, appName);
  next.from = from;
  next.to = to;

  const trimmed = searchValue.trim();
  if (!trimmed) {
    return next;
  }

  if (searchField === "correlationId") {
    next.correlationId = trimmed;
  } else if (searchField === "channelId") {
    next.channelId = trimmed;
  } else if (searchField === "appName") {
    next.appName = trimmed;
  } else if (searchField === "payload") {
    next.payloadQuery = trimmed;
  } else {
    next.globalQuery = trimmed;
  }

  return next;
}

function toQueryString(filters: TraceFiltersState, page: number, tab: TabMode) {
  const params = new URLSearchParams();
  params.set("date", filters.from.slice(0, 10));
  params.set("page", String(page));
  params.set("size", String(PAGE_SIZE));
  params.set("status", tab.toUpperCase());

  if (filters.apiName.trim()) {
    params.set("apiName", filters.apiName.trim());
  }
  if (filters.appName.trim()) {
    params.set("appName", filters.appName.trim());
  }
  if (filters.correlationId.trim()) {
    params.set("correlationId", filters.correlationId.trim());
  }
  if (filters.channelId.trim()) {
    params.set("channelId", filters.channelId.trim());
  }
  if (filters.payloadQuery.trim()) {
    params.set("payloadQuery", filters.payloadQuery.trim());
  }
  if (filters.globalQuery.trim()) {
    params.set("globalQuery", filters.globalQuery.trim());
  }
  if (filters.from) {
    params.set("from", filters.from);
  }
  if (filters.to) {
    params.set("to", filters.to);
  }

  return params.toString();
}

export function TraceLogsScreen({
  day,
  initialAppName,
  initialApiName,
  onBack,
  onScopeChange,
  onDayChange,
  embedded = false
}: TraceLogsScreenProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const scopeMenuRef = useRef<HTMLDivElement | null>(null);
  const [searchField, setSearchField] = useState<SearchField>("all");
  const [searchValue, setSearchValue] = useState("");
  const [from, setFrom] = useState(`${day}T00:00`);
  const [to, setTo] = useState(`${day}T23:59`);
  const [tab, setTab] = useState<TabMode>("success");
  const [page, setPage] = useState(0);
  const [refreshToken, setRefreshToken] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState<TraceFiltersState>(() =>
    buildDefaultFilters(day, initialApiName, initialAppName)
  );
  const [overviewData, setOverviewData] = useState<TraceOverviewResponse | null>(null);
  const [searchData, setSearchData] = useState<TraceSearchResponse | null>(null);
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const [scopeQuery, setScopeQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTraceId, setSelectedTraceId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TraceDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const nextFilters = buildDefaultFilters(day, initialApiName, initialAppName);
    setAppliedFilters(nextFilters);
    setSearchField("all");
    setSearchValue("");
    setFrom(`${day}T00:00`);
    setTo(`${day}T23:59`);
    setTab("success");
    setPage(0);
    setScopeMenuOpen(false);
    setScopeQuery("");
  }, [day, initialApiName, initialAppName]);

  useEffect(() => {
    if (!scopeMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!scopeMenuRef.current?.contains(target)) {
        setScopeMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setScopeMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [scopeMenuOpen]);

  useEffect(() => {
    if (!embedded || (!initialApiName && !initialAppName)) {
      return;
    }
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [embedded, initialApiName, initialAppName]);

  useEffect(() => {
    const controller = new AbortController();

    fetchJson<TraceOverviewResponse>(
      `/api/v1/traces/overview?date=${day}&appName=${encodeURIComponent(initialAppName)}&apiName=${encodeURIComponent(initialApiName)}`,
      controller.signal
    )
      .then(setOverviewData)
      .catch(() => {
        if (!controller.signal.aborted) {
          setOverviewData(null);
        }
      });

    return () => controller.abort();
  }, [day, initialAppName, initialApiName, refreshToken]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchJson<TraceSearchResponse>(
      `/api/v1/traces?${toQueryString(appliedFilters, page, tab)}&refreshToken=${refreshToken}`,
      controller.signal
    )
      .then(setSearchData)
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
  }, [appliedFilters, page, refreshToken, tab]);

  useEffect(() => {
    if (selectedTraceId === null) {
      return;
    }

    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError(null);

    fetchJson<TraceDetailResponse>(`/api/v1/traces/${selectedTraceId}`, controller.signal)
      .then(setDetail)
      .catch((nextError) => {
        if (!controller.signal.aborted) {
          setDetailError(nextError instanceof Error ? nextError.message : String(nextError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDetailLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedTraceId]);

  const filteredScopeOptions = useMemo(() => {
    const query = scopeQuery.trim().toLowerCase();
    const options = overviewData?.scopeOptions ?? [];
    if (!query) {
      return options;
    }
    return options.filter((option) =>
      `${option.appName} ${option.apiName}`.toLowerCase().includes(query)
    );
  }, [overviewData?.scopeOptions, scopeQuery]);

  const totalPages = searchData?.totalPages ?? 0;
  const totalElements = searchData?.totalElements ?? 0;
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;
  const totalRequests = overviewData?.totalRequests ?? searchData?.totalRequests ?? 0;
  const successCount = overviewData?.successCount ?? searchData?.successCount ?? 0;
  const failureCount = overviewData?.failureCount ?? searchData?.failureCount ?? 0;
  const successRate = totalRequests === 0 ? 0 : (successCount * 100) / totalRequests;
  const visibleRows = searchData?.rows ?? [];
  const pageStart = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const pageEnd = totalElements === 0 ? 0 : Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <section className="screen-shell" ref={sectionRef}>
      <div className="trace-toolbar">
        <div className="trace-toolbar-left">
          <div className="brand trace-toolbar-brand">
            <div className="brand-mark">TD</div>
          </div>

          <div className="trace-toolbar-title">
            <button className="trace-breadcrumb" type="button" onClick={onBack}>
              Dashboard
            </button>
            <span>/</span>
            <strong>{`${displayAppName(initialAppName)} / ${displayApiName(initialApiName)}`}</strong>
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
          <div className="trace-toolbar-field trace-toolbar-select" ref={scopeMenuRef}>
            <button
              className="trace-toolbar-select-button"
              type="button"
              onClick={() => {
                setScopeQuery("");
                setScopeMenuOpen((value) => !value);
              }}
              aria-haspopup="listbox"
              aria-expanded={scopeMenuOpen}
            >
              <span>{`${displayAppName(initialAppName)} / ${displayApiName(initialApiName)}`}</span>
              <span className="trace-toolbar-select-arrow">{scopeMenuOpen ? "^" : "v"}</span>
            </button>

            {scopeMenuOpen ? (
              <div className="trace-toolbar-select-menu" role="listbox" aria-label="App and API names">
                <div className="trace-toolbar-search">
                  <input
                    value={scopeQuery}
                    onChange={(event) => setScopeQuery(event.target.value)}
                    placeholder="Search app or API"
                    autoFocus
                  />
                </div>
                <button
                  className={!initialAppName && !initialApiName ? "trace-toolbar-option active" : "trace-toolbar-option"}
                  type="button"
                  role="option"
                  aria-selected={!initialAppName && !initialApiName}
                  onClick={() => {
                    setScopeMenuOpen(false);
                    onScopeChange("", "");
                  }}
                >
                  All Apps / All APIs
                </button>
                {filteredScopeOptions.map((option) => {
                  const selected = option.appName === initialAppName && option.apiName === initialApiName;
                  return (
                    <button
                      key={`${option.appName}-${option.apiName}`}
                      className={selected ? "trace-toolbar-option active" : "trace-toolbar-option"}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setScopeMenuOpen(false);
                        onScopeChange(option.appName, option.apiName);
                      }}
                    >
                      {`${displayAppName(option.appName)} / ${displayApiName(option.apiName)}`}
                    </button>
                  );
                })}
                {filteredScopeOptions.length === 0 ? (
                  <div className="trace-toolbar-empty">No matching app/API</div>
                ) : null}
              </div>
            ) : null}
          </div>
          <button className="trace-toolbar-chip" type="button" onClick={() => setRefreshToken((value) => value + 1)}>
            Refresh
          </button>
          {embedded && (initialApiName || initialAppName) ? (
            <button className="trace-toolbar-chip subtle" type="button" onClick={onBack}>
              Clear
            </button>
          ) : null}
          <span className="updated-text">
            Updated {searchData?.generatedAt ? formatDateTime(searchData.generatedAt) : "--"}
          </span>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Total Requests" value={formatNumber(totalRequests)} icon="total" />
        <KpiCard label="Success" value={formatNumber(successCount)} icon="success" />
        <KpiCard label="Failures" value={formatNumber(failureCount)} tone="danger" icon="failure" />
        <KpiCard label="Success Rate" value={`${successRate.toFixed(2)}%`} icon="rate" />
        <KpiCard
          label="Received Latency"
          value={`Avg ${formatLatency(overviewData?.averageReceivedLatencyMs ?? searchData?.averageReceivedLatencyMs)}`}
          subvalue={`MAX ${formatLatency(overviewData?.maxReceivedLatencyMs ?? searchData?.maxReceivedLatencyMs)}`}
          icon="received"
        />
        <KpiCard
          label="External Latency"
          value={`Avg ${formatLatency(overviewData?.averageExternalLatencyMs ?? searchData?.averageExternalLatencyMs)}`}
          subvalue={`MAX ${formatLatency(overviewData?.maxExternalLatencyMs ?? searchData?.maxExternalLatencyMs)}`}
          icon="external"
        />
        <KpiCard
          label="Latency"
          value={`Avg ${formatLatency(overviewData?.averageTotalLatencyMs ?? searchData?.averageTotalLatencyMs)}`}
          subvalue={`MAX ${formatLatency(overviewData?.maxTotalLatencyMs ?? searchData?.maxTotalLatencyMs)}`}
          icon="latency"
        />
      </div>

      <div className="panel trace-workspace">
        <div className="trace-tabs">
          <button
            className={tab === "success" ? "trace-tab active" : "trace-tab"}
            type="button"
            onClick={() => {
              setTab("success");
              setPage(0);
            }}
          >
            Success
            <span className="trace-tab-count">{formatNumber(successCount)}</span>
          </button>
          <button
            className={tab === "failure" ? "trace-tab active" : "trace-tab"}
            type="button"
            onClick={() => {
              setTab("failure");
              setPage(0);
            }}
          >
            Failures
            <span className="trace-tab-count failure">{formatNumber(failureCount)}</span>
          </button>
        </div>

        <div className="trace-filter-bar">
          <label className="field">
            <span>Search by</span>
            <select value={searchField} onChange={(event) => setSearchField(event.target.value as SearchField)}>
              <option value="all">Select filter</option>
              <option value="correlationId">Correlation ID</option>
              <option value="channelId">Channel ID</option>
              <option value="appName">App name</option>
              <option value="payload">Payload</option>
            </select>
          </label>
          <label className="field trace-filter-value">
            <span>Value</span>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Select a filter"
            />
          </label>
          <label className="field">
            <span>From</span>
            <input type="datetime-local" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="field">
            <span>To</span>
            <input type="datetime-local" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <div className="trace-filter-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setSearchField("all");
                setSearchValue("");
                setFrom(`${day}T00:00`);
                setTo(`${day}T23:59`);
                setAppliedFilters(buildDefaultFilters(day, initialApiName, initialAppName));
                setPage(0);
              }}
            >
              Clear
            </button>
            <button
              className="primary-button danger-button"
              type="button"
              onClick={() => {
                setAppliedFilters(buildFilters(day, initialApiName, initialAppName, searchField, searchValue, from, to));
                setPage(0);
              }}
            >
              Apply
            </button>
          </div>
        </div>

        {error ? <div className="banner error">{error}</div> : null}

        <div className="table-wrap">
          <table className="trace-results-table">
            <colgroup>
              <col className="col-event-time" />
              <col className="col-trace-id" />
              <col className="col-channel-id" />
              <col className="col-api-name" />
              <col className="col-app-name" />
              <col className="col-latency" />
              <col className="col-latency" />
              <col className="col-latency" />
            </colgroup>
            <thead>
              <tr>
                <th>Event Time</th>
                <th>Trace ID</th>
                <th>Channel ID</th>
                <th>API Name</th>
                <th>App Name</th>
                <th>Received</th>
                <th>External</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    {loading ? `Loading ${tab} rows...` : `No ${tab} rows match the current filters.`}
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr
                    key={row.id}
                    className="clickable"
                    onClick={() => {
                      setSelectedTraceId(row.id);
                      setDetail(null);
                    }}
                  >
                    <td className="mono">{formatDateTime(row.requestTimestamp)}</td>
                    <td className="mono">{row.correlationId || "--"}</td>
                    <td className="mono">{row.channelId || "--"}</td>
                    <td className="cell-ellipsis">{row.apiName || "--"}</td>
                    <td className="cell-ellipsis">{row.appName || "--"}</td>
                    <td className="mono">{formatLatency(row.requestReceivedLatencyMs)}</td>
                    <td className="mono">{formatLatency(row.externalLatencyMs)}</td>
                    <td className="mono">{formatLatency(row.totalLatencyMs)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="trace-footer">
          <span>
            {totalElements === 0
              ? `No ${tab} results`
              : `Showing ${formatNumber(pageStart)}-${formatNumber(pageEnd)} of ${formatNumber(totalElements)} ${tab} traces`}
          </span>
          <div className="pager">
            <span>
              Page {Math.min((searchData?.page ?? 0) + 1, Math.max(totalPages, 1))} of {Math.max(totalPages, 1)}
            </span>
            <div className="pager-actions">
              <button className="secondary-button" type="button" disabled={!canPrev} onClick={() => setPage((value) => value - 1)}>
                Previous
              </button>
              <button className="secondary-button" type="button" disabled={!canNext} onClick={() => setPage((value) => value + 1)}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedTraceId !== null ? (
        <div className="drawer-shell" role="dialog" aria-modal="true">
          <div className="drawer-backdrop" onClick={() => setSelectedTraceId(null)} />
          <aside className="drawer-card">
            <div className="drawer-header">
              <div className="drawer-title-block">
                <p className="eyebrow">End-To-End Trace</p>
                <h3>Record #{selectedTraceId}</h3>
                <p className="drawer-subtitle">
                  {`${detail?.appName || "--"} / ${detail?.apiName || "--"}`}
                </p>
              </div>
              <button className="icon-close" type="button" onClick={() => setSelectedTraceId(null)}>
                Close
              </button>
            </div>

            {detailError ? <div className="banner error">{detailError}</div> : null}

            {detailLoading || !detail ? (
              <div className="detail-loading">
                {detailLoading ? "Loading trace detail..." : "No trace selected."}
              </div>
            ) : (
              <>
                <div className="drawer-section">
                  <div className="drawer-section-head">
                    <p className="eyebrow">Summary</p>
                  </div>

                <div className="detail-grid">
                  <div className="detail-card">
                    <span>API name</span>
                    <strong>{detail.apiName || "--"}</strong>
                  </div>
                  <div className="detail-card">
                    <span>App name</span>
                    <strong>{detail.appName || "--"}</strong>
                  </div>
                  <div className="detail-card">
                    <span>Correlation ID</span>
                    <strong className="mono">{detail.correlationId || "--"}</strong>
                  </div>
                  <div className="detail-card">
                    <span>Channel ID</span>
                    <strong className="mono">{detail.channelId || "--"}</strong>
                  </div>
                  <div className="detail-card">
                    <span>Request timestamp</span>
                    <strong className="mono">{formatDateTime(detail.requestTimestamp)}</strong>
                  </div>
                </div>
                </div>

                <div className="drawer-section">
                  <div className="drawer-section-head">
                    <p className="eyebrow">Latency</p>
                  </div>
                <div className="trace-stage-strip">
                  <div className="trace-stage-card">
                    <span>Request Received Latency</span>
                    <strong>{formatLatency(detail.requestReceivedLatencyMs)}</strong>
                  </div>
                  <div className="trace-stage-card">
                    <span>External Latency</span>
                    <strong>{formatLatency(detail.externalLatencyMs)}</strong>
                  </div>
                  <div className="trace-stage-card">
                    <span>Total Latency</span>
                    <strong>{formatLatency(detail.totalLatencyMs)}</strong>
                  </div>
                </div>
                </div>

                <div className="drawer-section">
                  <div className="drawer-section-head">
                    <p className="eyebrow">Payload Flow</p>
                  </div>
                <div className="payload-grid e2e">
                  <PayloadPanel title="1. Request Payload" value={detail.requestPayload} />
                  <PayloadPanel title="2. Core Payload" value={detail.corePayload} />
                  <PayloadPanel title="3. Core Response" value={detail.coreResponse} />
                  <PayloadPanel title="4. Channel Response" value={detail.channelResponse} />
                </div>
                </div>
              </>
            )}
          </aside>
        </div>
      ) : null}
    </section>
  );
}
