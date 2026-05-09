export type DashboardKpis = {
  totalTraces: number;
  uniqueApis: number;
  uniqueApps: number;
  latestRequestTimestamp: string | null;
};

export type ApiSummaryRow = {
  apiName: string;
  appName: string;
  traceCount: number;
  successCount: number;
  failureCount: number;
  retriableCount: number;
  successRate: number;
  status: string;
  avgLatencyMs: number | null;
  uniqueChannels: number;
  uniqueCorrelations: number;
  latestRequestTimestamp: string | null;
};

export type DashboardResponse = {
  day: string;
  generatedAt: string;
  kpis: DashboardKpis;
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  rows: ApiSummaryRow[];
};

export type TraceFiltersResponse = {
  apiNames: string[];
  appNames: string[];
  channelIds: string[];
};

export type TraceScopeOption = {
  appName: string;
  apiName: string;
};

export type TraceOverviewResponse = {
  day: string;
  generatedAt: string;
  appName: string;
  apiName: string;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  averageReceivedLatencyMs: number | null;
  maxReceivedLatencyMs: number | null;
  averageExternalLatencyMs: number | null;
  maxExternalLatencyMs: number | null;
  averageTotalLatencyMs: number | null;
  maxTotalLatencyMs: number | null;
};

export type TraceScopeSearchResponse = {
  day: string;
  generatedAt: string;
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  rows: TraceScopeOption[];
};

export type TraceRow = {
  id: number;
  correlationId: string | null;
  channelId: string | null;
  accountNumber: string | null;
  apiName: string | null;
  appName: string | null;
  requestTimestamp: string | null;
  status: string | null;
  httpSeries: string | null;
  httpStatusCode: number | null;
  requestReceivedLatencyMs: number | null;
  externalLatencyMs: number | null;
  totalLatencyMs: number | null;
};

export type TraceSearchResponse = {
  day: string;
  generatedAt: string;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  averageReceivedLatencyMs: number | null;
  maxReceivedLatencyMs: number | null;
  averageExternalLatencyMs: number | null;
  maxExternalLatencyMs: number | null;
  averageTotalLatencyMs: number | null;
  maxTotalLatencyMs: number | null;
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  rows: TraceRow[];
};

export type TraceDetailResponse = {
  id: number;
  correlationId: string | null;
  channelId: string | null;
  accountNumber: string | null;
  apiName: string | null;
  appName: string | null;
  requestPayload: string | null;
  channelPayload: string | null;
  corePayload: string | null;
  coreResponse: string | null;
  channelResponse: string | null;
  requestTimestamp: string | null;
  status: string | null;
  httpSeries: string | null;
  httpStatusCode: number | null;
  requestReceivedLatencyMs: number | null;
  externalLatencyMs: number | null;
  totalLatencyMs: number | null;
};

export type TraceFiltersState = {
  apiName: string;
  appName: string;
  correlationId: string;
  channelId: string;
  accountQuery: string;
  customerQuery: string;
  payloadQuery: string;
  globalQuery: string;
  minTotalLatencyMs: number | null;
  maxTotalLatencyMs: number | null;
  exactTotalLatencyMs: number | null;
  from: string;
  to: string;
};
