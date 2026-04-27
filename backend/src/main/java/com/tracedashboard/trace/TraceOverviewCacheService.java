package com.tracedashboard.trace;

import com.tracedashboard.api.TraceDtos;
import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TraceOverviewCacheService {

    private final TraceDashboardRepository repository;
    private final Map<OverviewKey, TraceDtos.TraceOverviewResponse> overviewCache = new ConcurrentHashMap<>();
    private final Set<OverviewKey> trackedKeys = ConcurrentHashMap.newKeySet();

    public TraceOverviewCacheService(TraceDashboardRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void warmCache() {
        trackedKeys.add(new OverviewKey(LocalDate.now(), "", ""));
        trackedKeys.add(new OverviewKey(LocalDate.now().minusDays(1), "", ""));
        refreshTrackedKeys();
    }

    @Scheduled(fixedDelay = 60000L, initialDelay = 60000L)
    public void refreshTrackedKeys() {
        trackedKeys.forEach(this::refreshKey);
    }

    public TraceDtos.TraceOverviewResponse getOverview(LocalDate day, String appName, String apiName) {
        var key = new OverviewKey(day, normalize(appName), normalize(apiName));
        trackedKeys.add(key);
        var cached = overviewCache.get(key);
        if (cached != null) {
            return cached;
        }

        refreshKey(key);
        return overviewCache.getOrDefault(key, emptyOverview(day, normalize(appName), normalize(apiName)));
    }

    public TraceOverviewSnapshot findCachedOverview(LocalDate day, String appName, String apiName) {
        var normalizedApp = normalize(appName);
        var normalizedApi = normalize(apiName);
        var cached = overviewCache.get(new OverviewKey(day, normalizedApp, normalizedApi));
        if (cached == null) {
            return null;
        }
        return new TraceOverviewSnapshot(
            cached.totalRequests(),
            cached.successCount(),
            cached.failureCount(),
            cached.averageReceivedLatencyMs(),
            cached.maxReceivedLatencyMs(),
            cached.averageExternalLatencyMs(),
            cached.maxExternalLatencyMs(),
            cached.averageTotalLatencyMs(),
            cached.maxTotalLatencyMs()
        );
    }

    private void refreshKey(OverviewKey key) {
        var start = key.day().atStartOfDay();
        var end = key.day().plusDays(1).atStartOfDay();
        var generatedAt = Instant.now().toString();
        var projection = repository.findScopedOverview(
            start,
            end,
            emptyToNull(key.appName()),
            emptyToNull(key.apiName())
        );
        overviewCache.put(key, toOverview(key, projection, generatedAt));
    }

    private TraceDtos.TraceOverviewResponse toOverview(
        OverviewKey key,
        TraceDashboardRepository.OverallOverviewProjection row,
        String generatedAt
    ) {
        return new TraceDtos.TraceOverviewResponse(
            key.day().toString(),
            generatedAt,
            key.appName(),
            key.apiName(),
            row == null ? 0 : longValue(row.getTotalRequests()),
            row == null ? 0 : longValue(row.getSuccessCount()),
            row == null ? 0 : longValue(row.getFailureCount()),
            row == null ? 0.0 : round2(row.getAverageReceivedLatencyMs()),
            row == null ? 0 : intValue(row.getMaxReceivedLatencyMs()),
            row == null ? 0.0 : round2(row.getAverageExternalLatencyMs()),
            row == null ? 0 : intValue(row.getMaxExternalLatencyMs()),
            row == null ? 0.0 : round2(row.getAverageTotalLatencyMs()),
            row == null ? 0 : intValue(row.getMaxTotalLatencyMs())
        );
    }

    private TraceDtos.TraceOverviewResponse emptyOverview(
        LocalDate day,
        String appName,
        String apiName
    ) {
        return new TraceDtos.TraceOverviewResponse(
            day.toString(),
            Instant.now().toString(),
            appName,
            apiName,
            0,
            0,
            0,
            0.0,
            0,
            0.0,
            0,
            0.0,
            0
        );
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private Double round2(Double value) {
        if (value == null) {
            return 0.0;
        }
        return Math.round(value * 100.0) / 100.0;
    }

    private long longValue(Long value) {
        return value == null ? 0L : value;
    }

    private int intValue(Integer value) {
        return value == null ? 0 : value;
    }

    private record OverviewKey(LocalDate day, String appName, String apiName) {
    }

    public record TraceOverviewSnapshot(
        long totalRequests,
        long successCount,
        long failureCount,
        Double averageReceivedLatencyMs,
        Integer maxReceivedLatencyMs,
        Double averageExternalLatencyMs,
        Integer maxExternalLatencyMs,
        Double averageTotalLatencyMs,
        Integer maxTotalLatencyMs
    ) {
    }
}
