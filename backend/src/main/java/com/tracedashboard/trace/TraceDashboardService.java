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
import java.util.List;
import java.util.Locale;

@Service
public class TraceDashboardService {

    private final TraceDashboardRepository repository;
    private final TraceOverviewCacheService overviewCacheService;

    public TraceDashboardService(TraceDashboardRepository repository, TraceOverviewCacheService overviewCacheService) {
        this.repository = repository;
        this.overviewCacheService = overviewCacheService;
    }

    public record DateRange(LocalDate from, LocalDate to) {
    }

    public DateRange resolveDateRange(LocalDate date, LocalDate dateFrom, LocalDate dateTo) {
        if (dateFrom != null || dateTo != null) {
            if (dateFrom == null || dateTo == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dateFrom and dateTo must be provided together");
            }
            if (dateTo.isBefore(dateFrom)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dateTo must be >= dateFrom");
            }
            return new DateRange(dateFrom, dateTo);
        }
        if (date == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "date is required");
        }
        return new DateRange(date, date);
    }

    private LocalDateTime rangeStart(LocalDate from) {
        return from.atStartOfDay();
    }

    private LocalDateTime rangeEndExclusive(LocalDate to) {
        return to.plusDays(1).atStartOfDay();
    }

    public TraceDtos.DashboardResponse getDashboard(LocalDate day, int page, int size) {
        return getDashboard(day, day, page, size);
    }

    public TraceDtos.DashboardResponse getDashboard(LocalDate fromDay, LocalDate toDay, int page, int size) {
        var start = rangeStart(fromDay);
        var end = rangeEndExclusive(toDay);
        var pageable = PageRequest.of(
            Math.max(page, 0),
            Math.max(1, Math.min(size, 200))
        );
        var kpis = repository.findDailyDashboardKpis(start, end);
        var summaryPage = repository.findDailyApiSummaries(start, end, pageable);
        var rows = summaryPage.getContent().stream()
            .map(this::toApiSummaryRow)
            .toList();

        return new TraceDtos.DashboardResponse(
            fromDay.toString(),
            Instant.now().toString(),
            new TraceDtos.DashboardKpis(
                kpis == null ? 0L : longValue(kpis.getTotalRequests()),
                kpis == null ? 0L : longValue(kpis.getUniqueApis()),
                kpis == null ? 0L : longValue(kpis.getUniqueApps()),
                kpis == null ? null : kpis.getLatestRequestTimestamp()
            ),
            summaryPage.getTotalElements(),
            summaryPage.getTotalPages(),
            summaryPage.getNumber(),
            summaryPage.getSize(),
            rows
        );
    }

    public TraceDtos.TraceFiltersResponse getFilters(LocalDate day, String apiName, String appName) {
        return getFilters(day, day, apiName, appName);
    }

    public TraceDtos.TraceFiltersResponse getFilters(LocalDate fromDay, LocalDate toDay, String apiName, String appName) {
        var start = rangeStart(fromDay);
        var end = rangeEndExclusive(toDay);
        return new TraceDtos.TraceFiltersResponse(
            repository.findDistinctApiNames(start, end),
            repository.findDistinctAppNames(start, end, normalizeBlank(apiName)),
            repository.findDistinctChannelIds(start, end, normalizeBlank(apiName), normalizeBlank(appName))
        );
    }

    public TraceDtos.TraceOverviewResponse getTraceOverview(LocalDate day, String apiName, String appName) {
        return getTraceOverview(day, day, apiName, appName);
    }

    public TraceDtos.TraceOverviewResponse getTraceOverview(LocalDate fromDay, LocalDate toDay, String apiName, String appName) {
        if (fromDay.equals(toDay)) {
            return overviewCacheService.getOverview(fromDay, appName, apiName);
        }
        var start = rangeStart(fromDay);
        var end = rangeEndExclusive(toDay);
        var normalizedAppName = normalizeBlank(appName);
        var normalizedApiName = normalizeBlank(apiName);
        var overview = repository.findScopedOverview(start, end, normalizedAppName, normalizedApiName);
        if (overview == null) {
            return new TraceDtos.TraceOverviewResponse(
                fromDay.toString(),
                Instant.now().toString(),
                normalizedAppName == null ? "" : normalizedAppName,
                normalizedApiName == null ? "" : normalizedApiName,
                0L,
                0L,
                0L,
                0.0,
                0,
                0.0,
                0,
                0.0,
                0
            );
        }
        return new TraceDtos.TraceOverviewResponse(
            fromDay.toString(),
            Instant.now().toString(),
            normalizedAppName == null ? "" : normalizedAppName,
            normalizedApiName == null ? "" : normalizedApiName,
            longValue(overview.getTotalRequests()),
            longValue(overview.getSuccessCount()),
            longValue(overview.getFailureCount()),
            round2(overview.getAverageReceivedLatencyMs()),
            overview.getMaxReceivedLatencyMs() == null ? 0 : overview.getMaxReceivedLatencyMs(),
            round2(overview.getAverageExternalLatencyMs()),
            overview.getMaxExternalLatencyMs() == null ? 0 : overview.getMaxExternalLatencyMs(),
            round2(overview.getAverageTotalLatencyMs()),
            overview.getMaxTotalLatencyMs() == null ? 0 : overview.getMaxTotalLatencyMs()
        );
    }

    public TraceDtos.TraceScopeSearchResponse searchScopeOptions(
        LocalDate day,
        String query,
        int page,
        int size
    ) {
        return searchScopeOptions(day, day, query, page, size);
    }

    public TraceDtos.TraceScopeSearchResponse searchScopeOptions(
        LocalDate fromDay,
        LocalDate toDay,
        String query,
        int page,
        int size
    ) {
        var start = rangeStart(fromDay);
        var end = rangeEndExclusive(toDay);
        var pageable = PageRequest.of(
            Math.max(page, 0),
            Math.max(1, Math.min(size, 50)),
            Sort.by(Sort.Order.asc("appName"), Sort.Order.asc("apiName"))
        );
        var optionPage = repository.findScopeOptions(start, end, normalizeLikeQuery(query), pageable);
        var rows = optionPage.getContent().stream()
            .map(option -> new TraceDtos.TraceScopeOption(option.getAppName(), option.getApiName()))
            .toList();
        return new TraceDtos.TraceScopeSearchResponse(
            fromDay.toString(),
            Instant.now().toString(),
            optionPage.getTotalElements(),
            optionPage.getTotalPages(),
            optionPage.getNumber(),
            optionPage.getSize(),
            rows
        );
    }

    public TraceDtos.TraceSearchResponse search(
        LocalDate day,
        String apiName,
        String appName,
        String status,
        String httpSeries,
        Integer minTotalLatencyMs,
        Integer maxTotalLatencyMs,
        Integer exactTotalLatencyMs,
        String correlationId,
        String channelId,
        String accountQuery,
        String customerQuery,
        String payloadQuery,
        String globalQuery,
        LocalDateTime from,
        LocalDateTime to,
        int page,
        int size
    ) {
        return search(day, day, apiName, appName, status, httpSeries, minTotalLatencyMs, maxTotalLatencyMs, exactTotalLatencyMs, correlationId, channelId, accountQuery, customerQuery, payloadQuery, globalQuery, from, to, page, size);
    }

    public TraceDtos.TraceSearchResponse search(
        LocalDate fromDay,
        LocalDate toDay,
        String apiName,
        String appName,
        String status,
        String httpSeries,
        Integer minTotalLatencyMs,
        Integer maxTotalLatencyMs,
        Integer exactTotalLatencyMs,
        String correlationId,
        String channelId,
        String accountQuery,
        String customerQuery,
        String payloadQuery,
        String globalQuery,
        LocalDateTime from,
        LocalDateTime to,
        int page,
        int size
    ) {
        var baseSpecification = buildSearchSpecification(fromDay, toDay, apiName, appName, minTotalLatencyMs, maxTotalLatencyMs, exactTotalLatencyMs, correlationId, channelId, accountQuery, customerQuery, payloadQuery, globalQuery, from, to);
        var querySpecification = andIfPresent(baseSpecification, TraceSpecifications.statusEquals(status));
        querySpecification = andIfPresent(querySpecification, TraceSpecifications.httpSeriesEquals(httpSeries));
        var cachedOverview = canUseCachedOverview(fromDay, toDay, apiName, appName, correlationId, channelId, payloadQuery, globalQuery, from, to)
            ? overviewCacheService.findCachedOverview(fromDay, appName, apiName)
            : null;

        var pageable = PageRequest.of(
            Math.max(page, 0),
            Math.max(1, Math.min(size, 200)),
            Sort.by(Sort.Order.desc("requestTimestamp"), Sort.Order.desc("id"))
        );
        var tracePage = repository.findAll(querySpecification, pageable);
        var rows = tracePage.getContent().stream().map(this::toTraceRow).toList();

        return new TraceDtos.TraceSearchResponse(
            fromDay.toString(),
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
            record.getAccountNumber(),
            record.getApiName(),
            record.getAppName(),
            record.getRequestPayload(),
            record.getChannelPayload(),
            record.getCorePayload(),
            record.getCoreResponse(),
            record.getChannelResponse(),
            record.getRequestTimestamp(),
            determineStatus(record),
            determineHttpSeries(record),
            determineHttpStatusCode(record),
            record.getRequestReceivedLatencyMs(),
            record.getExternalLatencyMs(),
            record.getTotalLatencyMs()
        );
    }

    private Specification<TraceRecord> buildSearchSpecification(
        LocalDate day,
        String apiName,
        String appName,
        Integer minTotalLatencyMs,
        Integer maxTotalLatencyMs,
        Integer exactTotalLatencyMs,
        String correlationId,
        String channelId,
        String accountQuery,
        String customerQuery,
        String payloadQuery,
        String globalQuery,
        LocalDateTime from,
        LocalDateTime to
    ) {
        return buildSearchSpecification(day, day, apiName, appName, minTotalLatencyMs, maxTotalLatencyMs, exactTotalLatencyMs, correlationId, channelId, accountQuery, customerQuery, payloadQuery, globalQuery, from, to);
    }

    private Specification<TraceRecord> buildSearchSpecification(
        LocalDate fromDay,
        LocalDate toDay,
        String apiName,
        String appName,
        Integer minTotalLatencyMs,
        Integer maxTotalLatencyMs,
        Integer exactTotalLatencyMs,
        String correlationId,
        String channelId,
        String accountQuery,
        String customerQuery,
        String payloadQuery,
        String globalQuery,
        LocalDateTime from,
        LocalDateTime to
    ) {
        var dayStart = rangeStart(fromDay);
        var dayEnd = rangeEndExclusive(toDay);
        var specification = Specification.where(TraceSpecifications.requestTimestampBetween(dayStart, dayEnd));

        specification = andIfPresent(specification, TraceSpecifications.apiNameEquals(apiName));
        specification = andIfPresent(specification, TraceSpecifications.appNameEquals(appName));
        specification = andIfPresent(specification, TraceSpecifications.totalLatencyOnOrAbove(minTotalLatencyMs));
        specification = andIfPresent(specification, TraceSpecifications.totalLatencyOnOrBelow(maxTotalLatencyMs));
        specification = andIfPresent(specification, TraceSpecifications.totalLatencyEquals(exactTotalLatencyMs));
        specification = andIfPresent(specification, TraceSpecifications.correlationIdContains(correlationId));
        specification = andIfPresent(specification, TraceSpecifications.channelIdContains(channelId));
        specification = andIfPresent(specification, TraceSpecifications.accountContains(accountQuery));
        specification = andIfPresent(specification, TraceSpecifications.customerContains(customerQuery));
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

    private TraceDtos.ApiSummaryRow toApiSummaryRow(TraceDashboardRepository.DailyApiSummaryProjection row) {
        long total = row.getTraceCount();
        long success = row.getSuccessCount();
        long failures = row.getFailureCount();
        long retriable = row.getRetriableCount();
        double successRate = total == 0 ? 0.0 : round2((success * 100.0) / total);
        return new TraceDtos.ApiSummaryRow(
            row.getApiName(),
            row.getAppName(),
            total,
            success,
            failures,
            retriable,
            successRate,
            determineApiStatus(total, failures),
            round2(row.getAverageTotalLatencyMs()),
            row.getUniqueChannels(),
            row.getUniqueCorrelations(),
            row.getLatestRequestTimestamp()
        );
    }

    private TraceDtos.TraceRow toTraceRow(TraceRecord record) {
        return new TraceDtos.TraceRow(
            record.getId(),
            record.getCorrelationId(),
            record.getChannelId(),
            record.getAccountNumber(),
            record.getApiName(),
            record.getAppName(),
            record.getRequestTimestamp(),
            determineStatus(record),
            determineHttpSeries(record),
            determineHttpStatusCode(record),
            record.getRequestReceivedLatencyMs(),
            record.getExternalLatencyMs(),
            record.getTotalLatencyMs()
        );
    }

    private String normalizeBlank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeLikeQuery(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return "%" + value.trim().toLowerCase(Locale.ROOT) + "%";
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

    private String determineHttpSeries(TraceRecord record) {
        if (record.getHttpSeries() != null && !record.getHttpSeries().isBlank()) {
            return record.getHttpSeries().trim();
        }
        if ("SUCCESS".equals(determineStatus(record))) {
            return "200";
        }
        var response = ((record.getCoreResponse() == null ? "" : record.getCoreResponse()) + " "
            + (record.getChannelResponse() == null ? "" : record.getChannelResponse())).toLowerCase(Locale.ROOT);
        if (containsAny(response, "timeout", "unavailable", "system", "gateway", "downstream")) {
            return "500";
        }
        return "400";
    }

    private Integer determineHttpStatusCode(TraceRecord record) {
        if (record.getHttpStatusCode() != null) {
            return record.getHttpStatusCode();
        }
        var response = ((record.getCoreResponse() == null ? "" : record.getCoreResponse()) + " "
            + (record.getChannelResponse() == null ? "" : record.getChannelResponse())).toLowerCase(Locale.ROOT);
        if (matchesStatusCode(response, 503)) {
            return 503;
        }
        if (matchesStatusCode(response, 502)) {
            return 502;
        }
        if (matchesStatusCode(response, 500)) {
            return 500;
        }
        if (matchesStatusCode(response, 404)) {
            return 404;
        }
        if (matchesStatusCode(response, 403)) {
            return 403;
        }
        if (matchesStatusCode(response, 401)) {
            return 401;
        }
        if (matchesStatusCode(response, 400)) {
            return 400;
        }
        return switch (determineHttpSeries(record)) {
            case "500" -> 500;
            case "400" -> 404;
            default -> 200;
        };
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

    private boolean containsAny(String value, String... needles) {
        for (var needle : needles) {
            if (value.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private boolean matchesStatusCode(String value, int statusCode) {
        return value.matches(".*(^|[^0-9])" + statusCode + "([^0-9]|$).*");
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private Double round2(Double value) {
        return value == null ? 0.0 : round2(value.doubleValue());
    }

    private boolean canUseCachedOverview(
        LocalDate fromDay,
        LocalDate toDay,
        String apiName,
        String appName,
        String correlationId,
        String channelId,
        String payloadQuery,
        String globalQuery,
        LocalDateTime from,
        LocalDateTime to
    ) {
        return fromDay.equals(toDay)
            && isBlank(correlationId)
            && isBlank(channelId)
            && isBlank(payloadQuery)
            && isBlank(globalQuery)
            && withinDayBounds(fromDay, from, to);
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

    private long longValue(Long value) {
        return value == null ? 0L : value;
    }
}
