package com.tracedashboard.trace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TraceDashboardRepository extends JpaRepository<TraceRecord, Long>, JpaSpecificationExecutor<TraceRecord> {

    @Query("""
        select t.apiName as apiName,
               t.appName as appName,
               count(t) as traceCount,
               count(distinct t.channelId) as uniqueChannels,
               count(distinct t.correlationId) as uniqueCorrelations,
               max(t.requestTimestamp) as latestRequestTimestamp
        from TraceRecord t
        where t.requestTimestamp >= :start and t.requestTimestamp < :end
        group by t.apiName, t.appName
        order by count(t) desc, t.apiName asc, t.appName asc
        """)
    List<DailyApiSummaryProjection> findDailyApiSummaries(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );

    @Query("""
        select distinct t.apiName
        from TraceRecord t
        where t.requestTimestamp >= :start and t.requestTimestamp < :end
        order by t.apiName asc
        """)
    List<String> findDistinctApiNames(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("""
        select distinct t.appName
        from TraceRecord t
        where t.requestTimestamp >= :start
          and t.requestTimestamp < :end
          and (:apiName is null or t.apiName = :apiName)
        order by t.appName asc
        """)
    List<String> findDistinctAppNames(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        @Param("apiName") String apiName
    );

    @Query("""
        select distinct t.channelId
        from TraceRecord t
        where t.requestTimestamp >= :start
          and t.requestTimestamp < :end
          and (:apiName is null or t.apiName = :apiName)
          and (:appName is null or t.appName = :appName)
        order by t.channelId asc
        """)
    List<String> findDistinctChannelIds(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        @Param("apiName") String apiName,
        @Param("appName") String appName
    );

    @Query("""
        select t.appName as appName,
               t.apiName as apiName,
               count(t) as totalRequests,
               sum(case when t.status = 'SUCCESS' then 1 else 0 end) as successCount,
               sum(case when t.status = 'FAILURE' then 1 else 0 end) as failureCount,
               avg(t.requestReceivedLatencyMs) as averageReceivedLatencyMs,
               max(t.requestReceivedLatencyMs) as maxReceivedLatencyMs,
               avg(t.externalLatencyMs) as averageExternalLatencyMs,
               max(t.externalLatencyMs) as maxExternalLatencyMs,
               avg(t.totalLatencyMs) as averageTotalLatencyMs,
               max(t.totalLatencyMs) as maxTotalLatencyMs
        from TraceRecord t
        where t.requestTimestamp >= :start and t.requestTimestamp < :end
        group by t.appName, t.apiName
        order by t.appName asc, t.apiName asc
        """)
    List<DailyScopeOverviewProjection> findDailyScopeOverviews(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );

    @Query("""
        select count(t) as totalRequests,
               sum(case when t.status = 'SUCCESS' then 1 else 0 end) as successCount,
               sum(case when t.status = 'FAILURE' then 1 else 0 end) as failureCount,
               avg(t.requestReceivedLatencyMs) as averageReceivedLatencyMs,
               max(t.requestReceivedLatencyMs) as maxReceivedLatencyMs,
               avg(t.externalLatencyMs) as averageExternalLatencyMs,
               max(t.externalLatencyMs) as maxExternalLatencyMs,
               avg(t.totalLatencyMs) as averageTotalLatencyMs,
               max(t.totalLatencyMs) as maxTotalLatencyMs
        from TraceRecord t
        where t.requestTimestamp >= :start and t.requestTimestamp < :end
        """)
    OverallOverviewProjection findDailyOverallOverview(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );

    interface DailyApiSummaryProjection {
        String getApiName();

        String getAppName();

        long getTraceCount();

        long getUniqueChannels();

        long getUniqueCorrelations();

        LocalDateTime getLatestRequestTimestamp();
    }

    interface DailyScopeOverviewProjection {
        String getAppName();

        String getApiName();

        Long getTotalRequests();

        Long getSuccessCount();

        Long getFailureCount();

        Double getAverageReceivedLatencyMs();

        Integer getMaxReceivedLatencyMs();

        Double getAverageExternalLatencyMs();

        Integer getMaxExternalLatencyMs();

        Double getAverageTotalLatencyMs();

        Integer getMaxTotalLatencyMs();
    }

    interface OverallOverviewProjection {
        Long getTotalRequests();

        Long getSuccessCount();

        Long getFailureCount();

        Double getAverageReceivedLatencyMs();

        Integer getMaxReceivedLatencyMs();

        Double getAverageExternalLatencyMs();

        Integer getMaxExternalLatencyMs();

        Double getAverageTotalLatencyMs();

        Integer getMaxTotalLatencyMs();
    }
}
