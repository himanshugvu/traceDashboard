package com.tracedashboard.trace;

import com.tracedashboard.api.TraceDtos;
import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TraceOverviewCacheService {

    private final TraceDashboardRepository repository;
    private final Map<OverviewKey, TraceDtos.TraceOverviewResponse> overviewCache = new ConcurrentHashMap<>();
    private final Map<LocalDate, List<TraceDtos.TraceScopeOption>> scopeOptionsCache = new ConcurrentHashMap<>();
    private final Set<LocalDate> trackedDays = ConcurrentHashMap.newKeySet();

    public TraceOverviewCacheService(TraceDashboardRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void warmCache() {
        trackedDays.add(LocalDate.now());
        trackedDays.add(LocalDate.now().minusDays(1));
        refreshTrackedDays();
    }

    @Scheduled(fixedDelay = 60000L, initialDelay = 60000L)
    public void refreshTrackedDays() {
        trackedDays.forEach(this::refreshDay);
    }

    public TraceDtos.TraceOverviewResponse getOverview(LocalDate day, String appName, String apiName) {
        trackedDays.add(day);
        if (!scopeOptionsCache.containsKey(day)) {
            refreshDay(day);
        }

        var key = new OverviewKey(day, normalize(appName), normalize(apiName));
        var cached = overviewCache.get(key);
        if (cached != null) {
            return cached;
        }

        refreshDay(day);
        return overviewCache.getOrDefault(
            key,
            emptyOverview(day, normalize(appName), normalize(apiName), scopeOptionsCache.getOrDefault(day, List.of()))
        );
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

    private void refreshDay(LocalDate day) {
        var start = day.atStartOfDay();
        var end = day.plusDays(1).atStartOfDay();
        var scopeRows = repository.findDailyScopeOverviews(start, end);
        var scopeOptions = scopeRows.stream()
            .map(row -> new TraceDtos.TraceScopeOption(row.getAppName(), row.getApiName()))
            .sorted(Comparator.comparing(TraceDtos.TraceScopeOption::appName, Comparator.nullsLast(String::compareTo))
                .thenComparing(TraceDtos.TraceScopeOption::apiName, Comparator.nullsLast(String::compareTo)))
            .toList();
        scopeOptionsCache.put(day, scopeOptions);

        var generatedAt = Instant.now().toString();
        overviewCache.put(
            new OverviewKey(day, "", ""),
            toOverview(day, "", "", repository.findDailyOverallOverview(start, end), scopeOptions, generatedAt)
        );

        for (var row : scopeRows) {
            overviewCache.put(
                new OverviewKey(day, normalize(row.getAppName()), normalize(row.getApiName())),
                new TraceDtos.TraceOverviewResponse(
                    day.toString(),
                    generatedAt,
                    row.getAppName(),
                    row.getApiName(),
                    longValue(row.getTotalRequests()),
                    longValue(row.getSuccessCount()),
                    longValue(row.getFailureCount()),
                    round2(row.getAverageReceivedLatencyMs()),
                    intValue(row.getMaxReceivedLatencyMs()),
                    round2(row.getAverageExternalLatencyMs()),
                    intValue(row.getMaxExternalLatencyMs()),
                    round2(row.getAverageTotalLatencyMs()),
                    intValue(row.getMaxTotalLatencyMs()),
                    scopeOptions
                )
            );
        }
    }

    private TraceDtos.TraceOverviewResponse toOverview(
        LocalDate day,
        String appName,
        String apiName,
        TraceDashboardRepository.OverallOverviewProjection row,
        List<TraceDtos.TraceScopeOption> scopeOptions,
        String generatedAt
    ) {
        return new TraceDtos.TraceOverviewResponse(
            day.toString(),
            generatedAt,
            appName,
            apiName,
            row == null ? 0 : longValue(row.getTotalRequests()),
            row == null ? 0 : longValue(row.getSuccessCount()),
            row == null ? 0 : longValue(row.getFailureCount()),
            row == null ? 0.0 : round2(row.getAverageReceivedLatencyMs()),
            row == null ? 0 : intValue(row.getMaxReceivedLatencyMs()),
            row == null ? 0.0 : round2(row.getAverageExternalLatencyMs()),
            row == null ? 0 : intValue(row.getMaxExternalLatencyMs()),
            row == null ? 0.0 : round2(row.getAverageTotalLatencyMs()),
            row == null ? 0 : intValue(row.getMaxTotalLatencyMs()),
            scopeOptions
        );
    }

    private TraceDtos.TraceOverviewResponse emptyOverview(
        LocalDate day,
        String appName,
        String apiName,
        List<TraceDtos.TraceScopeOption> scopeOptions
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
            0,
            scopeOptions
        );
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
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
