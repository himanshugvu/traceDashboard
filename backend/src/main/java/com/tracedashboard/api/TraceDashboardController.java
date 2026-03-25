package com.tracedashboard.api;

import com.tracedashboard.trace.TraceDashboardService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Validated
@RestController
@RequestMapping("/api/v1")
public class TraceDashboardController {

    private final TraceDashboardService service;

    public TraceDashboardController(TraceDashboardService service) {
        this.service = service;
    }

    @GetMapping("/dashboard")
    public TraceDtos.DashboardResponse getDashboard(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return service.getDashboard(date);
    }

    @GetMapping("/traces/filters")
    public TraceDtos.TraceFiltersResponse getFilters(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestParam(required = false) String apiName,
        @RequestParam(required = false) String appName
    ) {
        return service.getFilters(date, apiName, appName);
    }

    @GetMapping("/traces/overview")
    public TraceDtos.TraceOverviewResponse getTraceOverview(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestParam(required = false) String apiName,
        @RequestParam(required = false) String appName
    ) {
        return service.getTraceOverview(date, apiName, appName);
    }

    @GetMapping("/traces")
    public TraceDtos.TraceSearchResponse searchTraces(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestParam(required = false) String apiName,
        @RequestParam(required = false) String appName,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String httpSeries,
        @RequestParam(required = false) @Min(0) Integer minTotalLatencyMs,
        @RequestParam(required = false) @Min(0) Integer maxTotalLatencyMs,
        @RequestParam(required = false) @Min(0) Integer exactTotalLatencyMs,
        @RequestParam(required = false) String correlationId,
        @RequestParam(required = false) String channelId,
        @RequestParam(required = false) String accountQuery,
        @RequestParam(required = false) String customerQuery,
        @RequestParam(required = false) String payloadQuery,
        @RequestParam(required = false) String globalQuery,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "50") @Min(1) @Max(200) int size
    ) {
        return service.search(date, apiName, appName, status, httpSeries, minTotalLatencyMs, maxTotalLatencyMs, exactTotalLatencyMs, correlationId, channelId, accountQuery, customerQuery, payloadQuery, globalQuery, from, to, page, size);
    }

    @GetMapping("/traces/{id}")
    public TraceDtos.TraceDetailResponse getTraceDetail(@PathVariable long id) {
        return service.getTraceDetail(id);
    }
}
