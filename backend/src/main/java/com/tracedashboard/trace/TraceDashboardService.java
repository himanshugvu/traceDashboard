package com.tracedashboard.trace;

import com.tracedashboard.api.TraceDtos;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;

@Service
public class TraceDashboardService {

    private final TraceDashboardRepository repository;
    private final TraceOverviewCacheService overviewCacheService;

    public TraceDashboardService(TraceDashboardRepository repository, TraceOverviewCacheService overviewCacheService) {
        this.repository = repository;
        this.overviewCacheService = overviewCacheService;
    }

    public TraceDtos.DashboardResponse getDashboard(LocalDate day) {
        var start = day.atStartOfDay();
        var end = day.plusDays(1).atStartOfDay();
        var records = repository.findAll(TraceSpecifications.requestTimestampBetween(start, end));
        var grouped = records.stream()
            .collect(java.util.stream.Collectors.groupingBy(record -> new ApiKey(record.getApiName(), record.getAppName())));

        var rows = grouped.entrySet().stream()
            .map((entry) -> toApiSummaryRow(entry.getKey(), entry.getValue()))
            .sorted(Comparator.comparingLong(TraceDtos.ApiSummaryRow::traceCount).reversed()
                .thenComparing(TraceDtos.ApiSummaryRow::apiName, Comparator.nullsLast(String::compareTo))
                .thenComparing(TraceDtos.ApiSummaryRow::appName, Comparator.nullsLast(String::compareTo)))
            .toList();

        long totalTraces = rows.stream().mapToLong(TraceDtos.ApiSummaryRow::traceCount).sum();
        long uniqueApis = rows.stream().map(TraceDtos.ApiSummaryRow::apiName).filter(Objects::nonNull).distinct().count();
        long uniqueApps = rows.stream().map(TraceDtos.ApiSummaryRow::appName).filter(Objects::nonNull).distinct().count();
        var latest = rows.stream()
            .map(TraceDtos.ApiSummaryRow::latestRequestTimestamp)
            .filter(Objects::nonNull)
            .max(Comparator.naturalOrder())
            .orElse(null);

        return new TraceDtos.DashboardResponse(
            day.toString(),
            Instant.now().toString(),
            new TraceDtos.DashboardKpis(totalTraces, uniqueApis, uniqueApps, latest),
            rows
        );
    }

    public TraceDtos.TraceFiltersResponse getFilters(LocalDate day, String apiName, String appName) {
        var start = day.atStartOfDay();
        var end = day.plusDays(1).atStartOfDay();
        return new TraceDtos.TraceFiltersResponse(
            repository.findDistinctApiNames(start, end),
            repository.findDistinctAppNames(start, end, normalizeBlank(apiName)),
            repository.findDistinctChannelIds(start, end, normalizeBlank(apiName), normalizeBlank(appName))
        );
    }

    public TraceDtos.TraceOverviewResponse getTraceOverview(LocalDate day, String apiName, String appName) {
        return overviewCacheService.getOverview(day, appName, apiName);
    }

    public TraceDtos.TraceSearchResponse search(
        LocalDate day,
        String apiName,
        String appName,
        String status,
        String correlationId,
        String channelId,
        String payloadQuery,
        String globalQuery,
        LocalDateTime from,
        LocalDateTime to,
        int page,
        int size
    ) {
        var baseSpecification = buildSearchSpecification(day, apiName, appName, correlationId, channelId, payloadQuery, globalQuery, from, to);
        var querySpecification = andIfPresent(baseSpecification, TraceSpecifications.statusEquals(status));
        var cachedOverview = canUseCachedOverview(day, apiName, appName, correlationId, channelId, payloadQuery, globalQuery, from, to)
            ? overviewCacheService.findCachedOverview(day, appName, apiName)
            : null;

        var pageable = PageRequest.of(
            Math.max(page, 0),
            Math.max(1, Math.min(size, 200)),
            Sort.by(Sort.Order.desc("requestTimestamp"), Sort.Order.desc("id"))
        );
        var tracePage = repository.findAll(querySpecification, pageable);
        var rows = tracePage.getContent().stream().map(this::toTraceRow).toList();

        return new TraceDtos.TraceSearchResponse(
            day.toString(),
            Instant.now().toString(),
            cachedOverview == null ? 0 : cachedOverview.totalRequests(),
            cachedOverview == null ? 0 : cachedOverview.successCount(),
            cachedOverview == null ? 0 : cachedOverview.failureCount(),
            cachedOverview == null ? null : cachedOverview.averageReceivedLatencyMs(),
            cachedOverview == null ? null : cachedOverview.maxReceivedLatencyMs(),
            cachedOverview == null ? null : cachedOverview.averageExternalLatencyMs(),
            cachedOverview == null ? null : cachedOverview.maxExternalLatencyMs(),
            cachedOverview == null ? null : cachedOverview.averageTotalLatencyMs(),
            cachedOverview == null ? null : cachedOverview.maxTotalLatencyMs(),
            tracePage.getTotalElements(),
            tracePage.getTotalPages(),
            tracePage.getNumber(),
            tracePage.getSize(),
            rows
        );
    }

    public TraceDtos.TraceDetailResponse getTraceDetail(long id) {
        var record = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trace not found"));

        return new TraceDtos.TraceDetailResponse(
            record.getId(),
            record.getCorrelationId(),
            record.getChannelId(),
            record.getApiName(),
            record.getAppName(),
            record.getRequestPayload(),
            record.getChannelPayload(),
            record.getCorePayload(),
            record.getCoreResponse(),
            record.getChannelResponse(),
            record.getRequestTimestamp(),
            determineStatus(record),
            record.getRequestReceivedLatencyMs(),
            record.getExternalLatencyMs(),
            record.getTotalLatencyMs()
        );
    }

    private Specification<TraceRecord> buildSearchSpecification(
        LocalDate day,
        String apiName,
        String appName,
        String correlationId,
        String channelId,
        String payloadQuery,
        String globalQuery,
        LocalDateTime from,
        LocalDateTime to
    ) {
        var dayStart = day.atStartOfDay();
        var dayEnd = day.plusDays(1).atStartOfDay();
        var specification = Specification.where(TraceSpecifications.requestTimestampBetween(dayStart, dayEnd));

        specification = andIfPresent(specification, TraceSpecifications.apiNameEquals(apiName));
        specification = andIfPresent(specification, TraceSpecifications.appNameEquals(appName));
        specification = andIfPresent(specification, TraceSpecifications.correlationIdContains(correlationId));
        specification = andIfPresent(specification, TraceSpecifications.channelIdContains(channelId));
        specification = andIfPresent(specification, TraceSpecifications.payloadContains(payloadQuery));
        specification = andIfPresent(specification, TraceSpecifications.anyFieldContains(globalQuery));

        if (from != null) {
            specification = andIfPresent(specification, TraceSpecifications.requestTimestampOnOrAfter(from));
        }
        if (to != null) {
            specification = andIfPresent(specification, TraceSpecifications.requestTimestampOnOrBefore(to));
        }

        return specification;
    }

    private TraceDtos.ApiSummaryRow toApiSummaryRow(ApiKey key, List<TraceRecord> records) {
        long total = records.size();
        long failures = records.stream().filter(this::isFailure).count();
        long success = total - failures;
        long retriable = records.stream().filter(this::isRetriable).count();
        double successRate = total == 0 ? 0.0 : round2((success * 100.0) / total);
        var latest = records.stream()
            .map(TraceRecord::getRequestTimestamp)
            .filter(Objects::nonNull)
            .max(Comparator.naturalOrder())
            .orElse(null);
        Set<String> channels = new TreeSet<>();
        Set<String> correlations = new TreeSet<>();
        for (var record : records) {
            if (record.getChannelId() != null && !record.getChannelId().isBlank()) {
                channels.add(record.getChannelId());
            }
            if (record.getCorrelationId() != null && !record.getCorrelationId().isBlank()) {
                correlations.add(record.getCorrelationId());
            }
        }
        return new TraceDtos.ApiSummaryRow(
            key.apiName(),
            key.appName(),
            total,
            success,
            failures,
            retriable,
            successRate,
            determineApiStatus(total, failures),
            averageLatency(records),
            channels.size(),
            correlations.size(),
            latest
        );
    }

    private TraceDtos.TraceRow toTraceRow(TraceRecord record) {
        return new TraceDtos.TraceRow(
            record.getId(),
            record.getCorrelationId(),
            record.getChannelId(),
            record.getApiName(),
            record.getAppName(),
            record.getRequestTimestamp(),
            determineStatus(record),
            record.getRequestReceivedLatencyMs(),
            record.getExternalLatencyMs(),
            record.getTotalLatencyMs()
        );
    }

    private String normalizeBlank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Specification<TraceRecord> andIfPresent(
        Specification<TraceRecord> base,
        Specification<TraceRecord> other
    ) {
        return other == null ? base : base.and(other);
    }

    private String determineStatus(TraceRecord record) {
        if (record.getStatus() != null && !record.getStatus().isBlank()) {
            return record.getStatus().trim().toUpperCase(Locale.ROOT);
        }
        return isLegacyFailure(record) ? "FAILURE" : "SUCCESS";
    }

    private boolean isFailure(TraceRecord record) {
        return "FAILURE".equals(determineStatus(record));
    }

    private boolean isRetriable(TraceRecord record) {
        var response = ((record.getCoreResponse() == null ? "" : record.getCoreResponse()) + " "
            + (record.getChannelResponse() == null ? "" : record.getChannelResponse())).toLowerCase(Locale.ROOT);
        return containsAny(response, "timeout", "limit", "retry", "temporar");
    }

    private boolean isLegacyFailure(TraceRecord record) {
        var response = ((record.getCoreResponse() == null ? "" : record.getCoreResponse()) + " "
            + (record.getChannelResponse() == null ? "" : record.getChannelResponse())).toLowerCase(Locale.ROOT);
        return containsAny(response, "error", "failed", "invalid", "reject", "declin");
    }

    private String determineApiStatus(long total, long failures) {
        if (total == 0) {
            return "WARNING";
        }
        if (failures == 0) {
            return "HEALTHY";
        }
        if (failures < total) {
            return "WARNING";
        }
        return "CRITICAL";
    }

    private Double averageLatency(List<TraceRecord> records) {
        return records.stream()
            .map(TraceRecord::getTotalLatencyMs)
            .filter(Objects::nonNull)
            .mapToInt(Integer::intValue)
            .average()
            .stream()
            .map(this::round2)
            .boxed()
            .findFirst()
            .orElse(0.0);
    }

    private boolean containsAny(String value, String... needles) {
        for (var needle : needles) {
            if (value.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private boolean canUseCachedOverview(
        LocalDate day,
        String apiName,
        String appName,
        String correlationId,
        String channelId,
        String payloadQuery,
        String globalQuery,
        LocalDateTime from,
        LocalDateTime to
    ) {
        return isBlank(correlationId)
            && isBlank(channelId)
            && isBlank(payloadQuery)
            && isBlank(globalQuery)
            && withinDayBounds(day, from, to);
    }

    private boolean withinDayBounds(LocalDate day, LocalDateTime from, LocalDateTime to) {
        var expectedFrom = day.atStartOfDay();
        var expectedTo = day.atTime(23, 59);
        return (from == null || from.equals(expectedFrom))
            && (to == null || to.equals(expectedTo));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record ApiKey(String apiName, String appName) {
    }
}
