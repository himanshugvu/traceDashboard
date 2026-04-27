import { useEffect, useMemo, useRef, useState } from "react";
import { fetchJson } from "../api";
import { PayloadPanel } from "../components/PayloadPanel";
import type {
  TraceDetailResponse,
  TraceFiltersState,
  TraceOverviewResponse,
  TraceScopeSearchResponse,
  TraceSearchResponse
} from "../types";

type TraceLogsScreenProps = {
  day: string;
  initialAppName: string;
  initialApiName: string;
  onBack: () => void;
  onScopeChange: (appName: string, apiName: string) => void;
  onDayChange: (day: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  embedded?: boolean;
};

type HttpSeriesFilter = "2xx" | "4xx" | "5xx";
type RowTone = "success" | "warning" | "failure";
type QueryField = "correlation" | "channel" | "account" | "customer" | "latency";
type QueryOperator = "=" | ">" | "<" | "all";
type FilterPreset = "correlation" | "correlationChannel" | "account" | "customer";
type QueryClause = {
  field: QueryField;
  operator: QueryOperator;
  value: string;
};

const FILTER_PRESET_OPTIONS: Array<{ value: FilterPreset; label: string }> = [
  { value: "correlation", label: "Correlation ID" },
  { value: "correlationChannel", label: "Correlation + Channel" },
  { value: "account", label: "Account Number" },
  { value: "customer", label: "Customer ID" }
];

const PAGE_SIZE = 50;
const SCOPE_PAGE_SIZE = 25;

function defaultOperator(field: QueryField): QueryOperator {
  return field === "latency" ? "all" : "=";
}

function createQueryClause(field: QueryField = "correlation"): QueryClause {
  return {
    field,
    operator: defaultOperator(field),
    value: ""
  };
}

function createClausesForPreset(preset: FilterPreset): QueryClause[] {
  if (preset === "correlationChannel") {
    return [createQueryClause("correlation"), createQueryClause("channel")];
  }
  if (preset === "account") {
    return [createQueryClause("account")];
  }
  if (preset === "customer") {
    return [createQueryClause("customer")];
  }
  return [createQueryClause("correlation")];
}

function presetFields(preset: FilterPreset): QueryField[] {
  if (preset === "correlationChannel") {
    return ["correlation", "channel"];
  }
  if (preset === "account") {
    return ["account"];
  }
  if (preset === "customer") {
    return ["customer"];
  }
  return ["correlation"];
}

function fieldPlaceholder(field: QueryField) {
  if (field === "latency") {
    return "0-1000 ms";
  }
  if (field === "correlation") {
    return "Correlation ID";
  }
  if (field === "channel") {
    return "Channel ID";
  }
  if (field === "account") {
    return "Account Number";
  }
  return "Customer ID";
}

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
    accountQuery: "",
    customerQuery: "",
    payloadQuery: "",
    globalQuery: "",
    minTotalLatencyMs: null,
    maxTotalLatencyMs: null,
    exactTotalLatencyMs: null,
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

function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0
  }).format(value);
}

function formatLatency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "--";
  }
  return `${Math.round(value)}ms`;
}

function formatLatencyValue(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "--";
  }
  return String(Math.round(value));
}

function clampLatency(value: number | null | undefined) {
  return value === null || value === undefined ? 0 : Math.max(Math.round(value), 0);
}

function parsePayloadValue(value: string | null | undefined) {
  if (!value || !value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function displayAppName(value: string) {
  return value.trim() ? value : "All Apps";
}

function displayApiName(value: string) {
  return value.trim() ? value : "All APIs";
}

function formatApiRoute(value: string | null | undefined) {
  if (!value || !value.trim()) {
    return "--";
  }
  return `/${value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase()}`;
}

function normalizeLatencyFilter(value: string) {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.max(0, Math.min(1000, Math.round(parsed)));
}

function buildFilters(day: string, apiName: string, appName: string, clauses: QueryClause[]) {
  const next = buildDefaultFilters(day, apiName, appName);

  for (const clause of clauses) {
    const value = clause.value.trim();

    if (clause.field === "correlation") {
      next.correlationId = value;
      continue;
    }
    if (clause.field === "channel") {
      next.channelId = value;
      continue;
    }
    if (clause.field === "account") {
      next.accountQuery = value;
      continue;
    }
    if (clause.field === "customer") {
      next.customerQuery = value;
      continue;
    }

    const latencyValue = normalizeLatencyFilter(value);
    if (clause.operator === "all" || latencyValue === null) {
      continue;
    }
    if (clause.operator === ">") {
      next.minTotalLatencyMs = latencyValue;
    } else if (clause.operator === "<") {
      next.maxTotalLatencyMs = latencyValue;
    } else {
      next.exactTotalLatencyMs = latencyValue;
    }
  }

  return next;
}

function toQueryString(filters: TraceFiltersState, page: number, httpSeries: HttpSeriesFilter) {
  const params = new URLSearchParams();
  params.set("date", filters.from.slice(0, 10));
  params.set("page", String(page));
  params.set("size", String(PAGE_SIZE));
  params.set("httpSeries", httpSeries);

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
  if (filters.accountQuery.trim()) {
    params.set("accountQuery", filters.accountQuery.trim());
  }
  if (filters.customerQuery.trim()) {
    params.set("customerQuery", filters.customerQuery.trim());
  }
  if (filters.payloadQuery.trim()) {
    params.set("payloadQuery", filters.payloadQuery.trim());
  }
  if (filters.globalQuery.trim()) {
    params.set("globalQuery", filters.globalQuery.trim());
  }
  if (filters.minTotalLatencyMs !== null) {
    params.set("minTotalLatencyMs", String(filters.minTotalLatencyMs));
  }
  if (filters.maxTotalLatencyMs !== null) {
    params.set("maxTotalLatencyMs", String(filters.maxTotalLatencyMs));
  }
  if (filters.exactTotalLatencyMs !== null) {
    params.set("exactTotalLatencyMs", String(filters.exactTotalLatencyMs));
  }
  if (filters.from) {
    params.set("from", filters.from);
  }
  if (filters.to) {
    params.set("to", filters.to);
  }

  return params.toString();
}

function getRowTone(httpSeries: string | null | undefined): RowTone {
  const normalized = httpSeries?.trim();
  if (normalized === "500") {
    return "failure";
  }
  if (normalized === "400") {
    return "warning";
  }
  return "success";
}

function getStatusLabel(httpStatusCode: number | null | undefined, httpSeries: string | null | undefined) {
  if (httpStatusCode !== null && httpStatusCode !== undefined) {
    return String(httpStatusCode);
  }
  if (httpSeries === "500") {
    return "500";
  }
  if (httpSeries === "400") {
    return "404";
  }
  return "200";
}

export function TraceLogsScreen({
  day,
  initialAppName,
  initialApiName,
  onBack,
  onScopeChange,
  onDayChange,
  theme,
  onToggleTheme
}: TraceLogsScreenProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const scopeMenuRef = useRef<HTMLDivElement | null>(null);
  const [errorType, setErrorType] = useState<HttpSeriesFilter>("2xx");
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const [scopeQuery, setScopeQuery] = useState("");
  const [scopePage, setScopePage] = useState(0);
  const [filterPreset, setFilterPreset] = useState<FilterPreset>("correlation");
  const [filterClauses, setFilterClauses] = useState<QueryClause[]>(() => createClausesForPreset("correlation"));
  const [page, setPage] = useState(0);
  const [refreshToken, setRefreshToken] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState<TraceFiltersState>(() =>
    buildDefaultFilters(day, initialApiName, initialAppName)
  );
  const [overviewData, setOverviewData] = useState<TraceOverviewResponse | null>(null);
  const [scopeData, setScopeData] = useState<TraceScopeSearchResponse | null>(null);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [searchData, setSearchData] = useState<TraceSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTraceId, setSelectedTraceId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TraceDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    setAppliedFilters(buildDefaultFilters(day, initialApiName, initialAppName));
    setFilterPreset("correlation");
    setFilterClauses(createClausesForPreset("correlation"));
    setErrorType("2xx");
    setScopeMenuOpen(false);
    setScopeQuery("");
    setScopePage(0);
    setPage(0);
  }, [day, initialApiName, initialAppName]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!scopeMenuRef.current?.contains(event.target as Node)) {
        setScopeMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setScopeMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
    if (!scopeMenuOpen) {
      return;
    }

    const controller = new AbortController();
    setScopeLoading(true);

    const params = new URLSearchParams();
    params.set("date", day);
    params.set("page", String(scopePage));
    params.set("size", String(SCOPE_PAGE_SIZE));
    if (scopeQuery.trim()) {
      params.set("query", scopeQuery.trim());
    }

    fetchJson<TraceScopeSearchResponse>(`/api/v1/traces/scopes?${params.toString()}`, controller.signal)
      .then(setScopeData)
      .catch(() => {
        if (!controller.signal.aborted) {
          setScopeData(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setScopeLoading(false);
        }
      });

    return () => controller.abort();
  }, [day, refreshToken, scopeMenuOpen, scopePage, scopeQuery]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchJson<TraceSearchResponse>(
      `/api/v1/traces?${toQueryString(appliedFilters, page, errorType)}&refreshToken=${refreshToken}`,
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
  }, [appliedFilters, errorType, page, refreshToken]);

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

  const totalPages = searchData?.totalPages ?? 0;
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;
  const totalRequests = overviewData?.totalRequests ?? searchData?.totalRequests ?? 0;
  const successCount = overviewData?.successCount ?? searchData?.successCount ?? 0;
  const failureCount = overviewData?.failureCount ?? searchData?.failureCount ?? 0;
  const successRate = totalRequests === 0 ? 0 : (successCount * 100) / totalRequests;
  const scopeLabel = `${displayAppName(initialAppName)} / ${displayApiName(initialApiName)}`;
  const filteredScopeOptions = useMemo(() => {
    const allOption = { appName: "", apiName: "" };
    const rows = (scopeData?.rows ?? []).filter((option) => option.appName.trim() || option.apiName.trim());
    return scopePage === 0 ? [allOption, ...rows] : rows;
  }, [scopeData?.rows, scopePage]);
  const canLoadMoreScopeOptions = (scopeData?.page ?? 0) + 1 < (scopeData?.totalPages ?? 0);
  const warningCount = errorType === "4xx" ? searchData?.totalElements ?? 0 : 0;
  const visibleRows = searchData?.rows ?? [];
  const filterTotal = searchData?.totalElements ?? 0;
  const isCustomDay = day !== todayIso() && day !== yesterdayIso();

  function openDatePicker() {
    const input = dateInputRef.current;
    if (!input) {
      return;
    }
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
  }

  function applyFilters() {
    setAppliedFilters(buildFilters(day, initialApiName, initialAppName, filterClauses));
    setPage(0);
  }

  function resetFilters() {
    setFilterPreset("correlation");
    setFilterClauses(createClausesForPreset("correlation"));
    setErrorType("2xx");
    setAppliedFilters(buildDefaultFilters(day, initialApiName, initialAppName));
    setPage(0);
  }

  function updateClause(index: number, next: QueryClause) {
    setFilterClauses((current) => current.map((clause, clauseIndex) => (clauseIndex === index ? next : clause)));
  }

  function applyPreset(nextPreset: FilterPreset) {
    setFilterPreset(nextPreset);
    setFilterClauses(createClausesForPreset(nextPreset));
  }

  function downloadAllPayloads() {
    if (!detail) {
      return;
    }

    const payloadBundle = {
      traceId: detail.id,
      correlationId: detail.correlationId,
      appName: detail.appName,
      apiName: detail.apiName,
      requestPayload: parsePayloadValue(detail.requestPayload),
      corePayload: parsePayloadValue(detail.corePayload),
      coreResponse: parsePayloadValue(detail.coreResponse),
      channelResponse: parsePayloadValue(detail.channelResponse)
    };

    const blob = new Blob([JSON.stringify(payloadBundle, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `trace-${detail.id}-payloads.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <section className="screen-shell trace-explorer-screen" ref={sectionRef}>
      <div className="trace-observability-shell">
        <header className="trace-observability-header">
          <div className="trace-observability-topbar">
            <div className="trace-header-core">
              <button className={`trace-header-badge ${theme === "light" ? "light" : "dark"}`} type="button" onDoubleClick={onToggleTheme}>
                TD
              </button>
              <div className="trace-header-path">
                <button className="trace-header-link" type="button" onClick={onBack}>
                  Dashboard
                </button>
                <span>/</span>
                <strong>{displayAppName(initialAppName)}</strong>
                <span>/</span>
                <strong>{displayApiName(initialApiName)}</strong>
              </div>
            </div>

            <div className="trace-header-controls">
              <span className="trace-header-control-label">Day:</span>
              <div className="trace-header-day-toggle">
                <button
                  className={day === todayIso() ? "trace-header-day-button active" : "trace-header-day-button"}
                  type="button"
                  onClick={() => onDayChange(todayIso())}
                >
                  Today
                </button>
                <button
                  className={day === yesterdayIso() ? "trace-header-day-button active" : "trace-header-day-button"}
                  type="button"
                  onClick={() => onDayChange(yesterdayIso())}
                >
                  Yesterday
                </button>
                <button
                  className={isCustomDay ? "trace-header-day-button active" : "trace-header-day-button"}
                  type="button"
                  onClick={openDatePicker}
                >
                  Custom
                </button>
              </div>

              <div className="trace-header-date-field">
                <button className="trace-header-chip" type="button" onClick={openDatePicker}>
                  {day.split("-").reverse().join("/")}
                </button>
                <label className="trace-toolbar-date-input">
                  <input ref={dateInputRef} type="date" value={day} onChange={(event) => onDayChange(event.target.value)} />
                </label>
              </div>
              <div className="scope-field trace-header-scope-field" ref={scopeMenuRef}>
                <button
                  className="trace-header-chip trace-header-scope-chip scope-select-button"
                  type="button"
                  onClick={() =>
                    setScopeMenuOpen((value) => {
                      if (!value) {
                        setScopePage(0);
                      }
                      return !value;
                    })
                  }
                >
                  <span>{scopeLabel}</span>
                  <span className="scope-select-arrow" aria-hidden="true" />
                </button>
                {scopeMenuOpen ? (
                  <div className="scope-select-menu trace-scope-select-menu">
                    <div className="scope-search trace-scope-search">
                      <input
                        autoFocus
                        value={scopeQuery}
                        onChange={(event) => {
                          setScopeQuery(event.target.value);
                          setScopePage(0);
                        }}
                        placeholder="Search app or API"
                      />
                    </div>
                    {scopeLoading && filteredScopeOptions.length === 0 ? (
                      <div className="scope-empty">Loading app/API options...</div>
                    ) : filteredScopeOptions.length === 0 ? (
                      <div className="scope-empty">No app/API matches.</div>
                    ) : (
                      <>
                        {filteredScopeOptions.map((option) => {
                          const optionLabel = `${displayAppName(option.appName)} / ${displayApiName(option.apiName)}`;
                          const isActive = option.appName === initialAppName && option.apiName === initialApiName;
                          return (
                            <button
                              key={`${option.appName}-${option.apiName}`}
                              className={isActive ? "scope-option active" : "scope-option"}
                              type="button"
                              onClick={() => {
                                onScopeChange(option.appName, option.apiName);
                                setScopeMenuOpen(false);
                                setScopeQuery("");
                                setScopePage(0);
                              }}
                            >
                              {optionLabel}
                            </button>
                          );
                        })}
                        {canLoadMoreScopeOptions ? (
                          <button className="scope-option scope-option-more" type="button" onClick={() => setScopePage((value) => value + 1)}>
                            {scopeLoading ? "Loading more..." : "Load more"}
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : null}
              </div>
              <button className="trace-header-chip trace-header-refresh" type="button" onClick={() => setRefreshToken((value) => value + 1)}>
                Refresh
              </button>
              <button
                className={`trace-theme-switch ${theme === "light" ? "light" : "dark"}`}
                type="button"
                onClick={onToggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                <span className="trace-theme-switch-track">
                  <span className="trace-theme-switch-thumb" />
                </span>
                <span className="trace-theme-switch-cord" />
              </button>
              <span className="trace-header-updated">
                Updated {searchData?.generatedAt ? formatDateTime(searchData.generatedAt) : "--"}
              </span>
            </div>
          </div>
        </header>

        <div className="trace-observability-kpis">
          <article className="trace-observability-kpi accent">
            <span>Total Requests</span>
            <div className="trace-observability-kpi-value-row">
              <strong>{formatCompactNumber(totalRequests)}</strong>
              <small>{warningCount > 0 ? `${((warningCount / Math.max(totalRequests, 1)) * 100).toFixed(1)}%` : "0.0%"}</small>
            </div>
          </article>
          <article className="trace-observability-kpi">
            <span>Success</span>
            <div className="trace-observability-kpi-value-row">
              <strong>{formatCompactNumber(successCount)}</strong>
            </div>
          </article>
          <article className="trace-observability-kpi danger">
            <span>Failures</span>
            <div className="trace-observability-kpi-value-row">
              <strong>{formatCompactNumber(failureCount)}</strong>
              <small>{failureCount > 0 ? `${((failureCount / Math.max(totalRequests, 1)) * 100).toFixed(1)}%` : "0.0%"}</small>
            </div>
          </article>
          <article className="trace-observability-kpi success">
            <span>Success Rate</span>
            <div className="trace-observability-kpi-value-row">
              <strong>{successRate.toFixed(2)}%</strong>
            </div>
          </article>
          <article className="trace-observability-kpi">
            <span>Recv Latency</span>
            <div className="trace-observability-kpi-value-row">
              <strong>{formatLatency(overviewData?.averageReceivedLatencyMs ?? searchData?.averageReceivedLatencyMs)}</strong>
            </div>
          </article>
          <article className="trace-observability-kpi">
            <span>Ext Latency</span>
            <div className="trace-observability-kpi-value-row">
              <strong>{formatLatency(overviewData?.averageExternalLatencyMs ?? searchData?.averageExternalLatencyMs)}</strong>
            </div>
          </article>
          <article className="trace-observability-kpi">
            <span>Latency</span>
            <div className="trace-observability-kpi-value-row">
              <strong>{formatLatency(overviewData?.averageTotalLatencyMs ?? searchData?.averageTotalLatencyMs)}</strong>
            </div>
          </article>
        </div>

        <div className="trace-observability-filterbar">
          <div className="trace-filter-block trace-filter-status-block">
            <div className="trace-status-toggle">
              <button
                className={errorType === "2xx" ? "trace-status-button active success" : "trace-status-button"}
                type="button"
                onClick={() => {
                  setErrorType("2xx");
                  setPage(0);
                }}
              >
                2xx
              </button>
              <button
                className={errorType === "4xx" ? "trace-status-button active warning" : "trace-status-button"}
                type="button"
                onClick={() => {
                  setErrorType("4xx");
                  setPage(0);
                }}
              >
                4xx
              </button>
              <button
                className={errorType === "5xx" ? "trace-status-button active danger" : "trace-status-button"}
                type="button"
                onClick={() => {
                  setErrorType("5xx");
                  setPage(0);
                }}
              >
                5xx
              </button>
            </div>
          </div>

          <div className="trace-filter-builder-block">
            <div className="trace-filter-builder">
              <label className="trace-filter-mode-select">
                <span>Filter by</span>
                <select
                  className="trace-query-select trace-filter-mode-input"
                  value={filterPreset}
                  onChange={(event) => applyPreset(event.target.value as FilterPreset)}
                >
                  {FILTER_PRESET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className={`trace-filter-inputs preset-${filterPreset}`}>
                {presetFields(filterPreset).map((field, index) => {
                  const clause = filterClauses[index] ?? createQueryClause(field);
                  return (
                    <label key={`${field}-${index}`} className="trace-filter-inline-field">
                      <span>{fieldPlaceholder(field)}</span>
                      <div className="trace-query-clause compact">
                        <input
                          className="trace-query-input"
                          type="text"
                          value={clause.value}
                          onChange={(event) =>
                            updateClause(index, {
                              field,
                              operator: "=",
                              value: event.target.value
                            })
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              applyFilters();
                            }
                          }}
                          placeholder={fieldPlaceholder(field)}
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="trace-inline-actions">
            <button className="trace-action-button search" type="button" onClick={applyFilters} aria-label="Search" title="Search">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="trace-action-icon">
                <circle cx="11" cy="11" r="5.5" />
                <path d="M16 16L20 20" />
              </svg>
            </button>
            <button className="trace-action-button clear" type="button" onClick={resetFilters} aria-label="Clear filters" title="Clear filters">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="trace-action-icon">
                <path d="M6 6L18 18M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        {error ? <div className="banner error">{error}</div> : null}

        <div className="trace-observability-table panel">
          <div className="table-wrap trace-table-wrap">
            <table className="trace-results-table trace-results-table-compact">
              <thead>
                <tr>
                  <th>App Name</th>
                  <th>URL</th>
                  <th>Trace ID</th>
                  <th>Channel ID</th>
                  <th>Timestamp</th>
                  <th>Latency Breakdown</th>
                  <th className="table-center">HTTP Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      {loading ? "Loading traces..." : "No traces match the current filters."}
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => {
                    const tone = getRowTone(row.httpSeries);
                    const entryLatency = clampLatency(row.requestReceivedLatencyMs);
                    const totalLatency = clampLatency(row.totalLatencyMs);
                    const coreLatency = Math.max(totalLatency - entryLatency, 0);
                    const safeTotal = Math.max(totalLatency, 1);
                    const entryWidth = tone === "failure" ? 88 : Math.min((entryLatency / safeTotal) * 100, 100);
                    const coreWidth = tone === "failure" ? 12 : Math.min((coreLatency / safeTotal) * 100, 100 - entryWidth);
                    return (
                      <tr
                        key={row.id}
                        className={`clickable trace-row trace-row-compact ${tone}`}
                        onClick={() => {
                          setScopeMenuOpen(false);
                          setSelectedTraceId(row.id);
                          setDetail(null);
                        }}
                      >
                        <td className="trace-app-cell">{row.appName || "--"}</td>
                        <td>
                          <div className="trace-api-cell">
                            <span>{formatApiRoute(row.apiName)}</span>
                          </div>
                        </td>
                        <td>
                          <button
                            className="trace-id-link"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setScopeMenuOpen(false);
                              setSelectedTraceId(row.id);
                              setDetail(null);
                            }}
                          >
                            {row.correlationId || `tr-${row.id}`}
                          </button>
                        </td>
                        <td className="mono trace-channel-cell">{row.channelId || "--"}</td>
                        <td className="mono trace-timestamp-cell">{formatDateTime(row.requestTimestamp)}</td>
                        <td>
                          <div className={`trace-latency-breakdown ${tone}`}>
                            <div className="trace-latency-bar">
                              <span className="trace-latency-segment entry" style={{ width: `${entryWidth}%` }} />
                              <span className="trace-latency-segment core" style={{ width: `${coreWidth}%` }} />
                            </div>
                            <div className="trace-latency-values">
                              <span>{formatLatencyValue(row.requestReceivedLatencyMs)}ms</span>
                              <span>/</span>
                              <span>{formatLatencyValue(coreLatency)}ms</span>
                              <span>/</span>
                              <strong>{formatLatencyValue(row.totalLatencyMs)}ms</strong>
                            </div>
                          </div>
                        </td>
                        <td className="table-center">
                          <span className={`status-badge ${tone}`}>{getStatusLabel(row.httpStatusCode, row.httpSeries)}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="trace-observability-footer">
            <span>
              {loading
                ? "Refreshing trace feed..."
                : `Showing ${visibleRows.length} traces on this page | ${formatNumber(filterTotal)} in active filter`}
            </span>
            <div className="trace-footer-pager">
              <button className="trace-page-button" type="button" onClick={() => setPage(0)} disabled={!canPrev}>
                First
              </button>
              <button className="trace-page-button" type="button" onClick={() => setPage((value) => value - 1)} disabled={!canPrev}>
                Prev
              </button>
              <span className="trace-page-indicator">
                {Math.min((searchData?.page ?? 0) + 1, Math.max(totalPages, 1))}
              </span>
              <button className="trace-page-button" type="button" onClick={() => setPage((value) => value + 1)} disabled={!canNext}>
                Next
              </button>
              <button className="trace-page-button" type="button" onClick={() => setPage(Math.max(totalPages - 1, 0))} disabled={!canNext}>
                Last
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
                <p className="eyebrow">End-to-end trace</p>
                <h3>Record #{selectedTraceId}</h3>
                <p className="drawer-subtitle">{`${detail?.appName || "--"} / ${detail?.apiName || "--"}`}</p>
              </div>
              <button className="icon-close" type="button" onClick={() => setSelectedTraceId(null)}>
                Close
              </button>
            </div>

            {detailError ? <div className="banner error">{detailError}</div> : null}

            {detailLoading || !detail ? (
              <div className="detail-loading">{detailLoading ? "Loading trace detail..." : "No trace selected."}</div>
            ) : (
              <>
                <div className="drawer-section">
                  <div className="drawer-section-head">
                    <p className="eyebrow">Summary</p>
                  </div>

                  <div className="detail-grid">
                    <div className="detail-card">
                      <span>Status</span>
                      <strong>{detail.status || "--"}</strong>
                    </div>
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
                      <span>Request received latency</span>
                      <strong>{formatLatency(detail.requestReceivedLatencyMs)}</strong>
                    </div>
                    <div className="trace-stage-card">
                      <span>External latency</span>
                      <strong>{formatLatency(detail.externalLatencyMs)}</strong>
                    </div>
                    <div className="trace-stage-card">
                      <span>Total latency</span>
                      <strong>{formatLatency(detail.totalLatencyMs)}</strong>
                    </div>
                  </div>
                </div>

                <div className="drawer-section">
                  <div className="drawer-section-head">
                    <h3 className="payload-section-title">Transaction Payloads</h3>
                    <button className="payload-download-button" type="button" onClick={downloadAllPayloads}>
                      Download All
                    </button>
                  </div>
                  <div className="payload-grid e2e">
                    <PayloadPanel eyebrow="Payload 01" title="Entry Request" value={detail.requestPayload} className="payload-tone-cyan" />
                    <PayloadPanel eyebrow="Payload 02" title="Core Payload" value={detail.corePayload} className="payload-tone-blue" />
                    <PayloadPanel eyebrow="Payload 03" title="Core Response" value={detail.coreResponse} className="payload-tone-slate" />
                    <PayloadPanel eyebrow="Payload 04" title="Response Egress" value={detail.channelResponse} className="payload-tone-teal" />
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
