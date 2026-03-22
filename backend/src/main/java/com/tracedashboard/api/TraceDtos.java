package com.tracedashboard.api;

import java.time.LocalDateTime;
import java.util.List;

public final class TraceDtos {

    private TraceDtos() {
    }

    public record DashboardResponse(
        String day,
        String generatedAt,
        DashboardKpis kpis,
        List<ApiSummaryRow> rows
    ) {
    }

    public record DashboardKpis(
        long totalTraces,
        long uniqueApis,
        long uniqueApps,
        LocalDateTime latestRequestTimestamp
    ) {
    }

    public record ApiSummaryRow(
        String apiName,
        String appName,
        long traceCount,
        long successCount,
        long failureCount,
        long retriableCount,
        double successRate,
        String status,
        Double avgLatencyMs,
        long uniqueChannels,
        long uniqueCorrelations,
        LocalDateTime latestRequestTimestamp
    ) {
    }

    public record TraceFiltersResponse(
        List<String> apiNames,
        List<String> appNames,
        List<String> channelIds
    ) {
    }

    public record TraceScopeOption(
        String appName,
        String apiName
    ) {
    }

    public record TraceOverviewResponse(
        String day,
        String generatedAt,
        String appName,
        String apiName,
        long totalRequests,
        long successCount,
        long failureCount,
        Double averageReceivedLatencyMs,
        Integer maxReceivedLatencyMs,
        Double averageExternalLatencyMs,
        Integer maxExternalLatencyMs,
        Double averageTotalLatencyMs,
        Integer maxTotalLatencyMs,
        List<TraceScopeOption> scopeOptions
    ) {
    }

    public record TraceSearchResponse(
        String day,
        String generatedAt,
        long totalRequests,
        long successCount,
        long failureCount,
        Double averageReceivedLatencyMs,
        Integer maxReceivedLatencyMs,
        Double averageExternalLatencyMs,
        Integer maxExternalLatencyMs,
        Double averageTotalLatencyMs,
        Integer maxTotalLatencyMs,
        long totalElements,
        int totalPages,
        int page,
        int size,
        List<TraceRow> rows
    ) {
    }

    public record TraceRow(
        Long id,
        String correlationId,
        String channelId,
        String apiName,
        String appName,
        LocalDateTime requestTimestamp,
        String status,
        Integer requestReceivedLatencyMs,
        Integer externalLatencyMs,
        Integer totalLatencyMs
    ) {
    }

    public record TraceDetailResponse(
        Long id,
        String correlationId,
        String channelId,
        String apiName,
        String appName,
        String requestPayload,
        String channelPayload,
        String corePayload,
        String coreResponse,
        String channelResponse,
        LocalDateTime requestTimestamp,
        String status,
        Integer requestReceivedLatencyMs,
        Integer externalLatencyMs,
        Integer totalLatencyMs
    ) {
    }
}
