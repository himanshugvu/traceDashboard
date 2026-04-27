package com.tracedashboard.trace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TraceDashboardRepository extends JpaRepository<TraceRecord, Long>, JpaSpecificationExecutor<TraceRecord> {

    @Query(
        value = """
            select
              t.api_name as apiName,
              t.app_name as appName,
              count(*) as traceCount,
              sum(case when upper(coalesce(t.status, '')) = 'SUCCESS' then 1 else 0 end) as successCount,
              sum(case when upper(coalesce(t.status, '')) = 'FAILURE' then 1 else 0 end) as failureCount,
              sum(case when t.http_series = '500' then 1 else 0 end) as retriableCount,
              avg(t.total_latency_ms) as averageTotalLatencyMs,
              count(distinct t.channel_id) as uniqueChannels,
              count(distinct t.correlation_id) as uniqueCorrelations,
              max(t.requesttimestamp) as latestRequestTimestamp
            from trace_record t
            where t.requesttimestamp >= :start and t.requesttimestamp < :end
            group by t.api_name, t.app_name
            order by count(*) desc, t.api_name asc, t.app_name asc
            """,
        countQuery = """
            select count(*)
            from (
              select 1
              from trace_record t
              where t.requesttimestamp >= :start and t.requesttimestamp < :end
              group by t.api_name, t.app_name
            ) grouped
            """,
        nativeQuery = true
    )
    Page<DailyApiSummaryProjection> findDailyApiSummaries(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        Pageable pageable
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
               count(distinct t.apiName) as uniqueApis,
               count(distinct t.appName) as uniqueApps,
               max(t.requestTimestamp) as latestRequestTimestamp
        from TraceRecord t
        where t.requestTimestamp >= :start and t.requestTimestamp < :end
        """)
    DailyDashboardKpisProjection findDailyDashboardKpis(
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
        where t.requestTimestamp >= :start
          and t.requestTimestamp < :end
          and (:appName is null or t.appName = :appName)
          and (:apiName is null or t.apiName = :apiName)
        """)
    OverallOverviewProjection findScopedOverview(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        @Param("appName") String appName,
        @Param("apiName") String apiName
    );

    @Query(
        value = """
            select
              t.app_name as appName,
              t.api_name as apiName
            from trace_record t
            where t.requesttimestamp >= :start
              and t.requesttimestamp < :end
              and (
                :query is null
                or lower(coalesce(t.app_name, '')) like :query
                or lower(coalesce(t.api_name, '')) like :query
              )
            group by t.app_name, t.api_name
            order by t.app_name asc, t.api_name asc
            """,
        countQuery = """
            select count(*)
            from (
              select 1
              from trace_record t
              where t.requesttimestamp >= :start
                and t.requesttimestamp < :end
                and (
                  :query is null
                  or lower(coalesce(t.app_name, '')) like :query
                  or lower(coalesce(t.api_name, '')) like :query
                )
              group by t.app_name, t.api_name
            ) scoped
            """,
        nativeQuery = true
    )
    Page<TraceScopeOptionProjection> findScopeOptions(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end,
        @Param("query") String query,
        Pageable pageable
    );

    interface DailyApiSummaryProjection {
        String getApiName();

        String getAppName();

        long getTraceCount();

        long getSuccessCount();

        long getFailureCount();

        long getRetriableCount();

        Double getAverageTotalLatencyMs();

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

    interface DailyDashboardKpisProjection {
        Long getTotalRequests();

        Long getUniqueApis();

        Long getUniqueApps();

        LocalDateTime getLatestRequestTimestamp();
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

    interface TraceScopeOptionProjection {
        String getAppName();

        String getApiName();
    }
}
