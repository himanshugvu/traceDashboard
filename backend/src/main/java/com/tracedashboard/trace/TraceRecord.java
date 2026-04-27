package com.tracedashboard.trace;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "trace_record")
public class TraceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "correlation_id")
    private String correlationId;

    @Column(name = "channel_id")
    private String channelId;

    @Column(name = "api_name")
    private String apiName;

    @Column(name = "app_name")
    private String appName;

    @Column(name = "status")
    private String status;

    @Column(name = "http_series")
    private String httpSeries;

    @Column(name = "http_status_code")
    private Integer httpStatusCode;

    @Column(name = "request_payload", columnDefinition = "LONGTEXT")
    private String requestPayload;

    @Column(name = "channel_payload", columnDefinition = "LONGTEXT")
    private String channelPayload;

    @Column(name = "core_payload", columnDefinition = "LONGTEXT")
    private String corePayload;

    @Column(name = "core_response", columnDefinition = "LONGTEXT")
    private String coreResponse;

    @Column(name = "channel_response", columnDefinition = "LONGTEXT")
    private String channelResponse;

    @Column(name = "requesttimestamp")
    private LocalDateTime requestTimestamp;

    @Column(name = "request_received_latency_ms")
    private Integer requestReceivedLatencyMs;

    @Column(name = "external_latency_ms")
    private Integer externalLatencyMs;

    @Column(name = "total_latency_ms")
    private Integer totalLatencyMs;

    protected TraceRecord() {
    }

    public Long getId() {
        return id;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public String getChannelId() {
        return channelId;
    }

    public String getApiName() {
        return apiName;
    }

    public String getAppName() {
        return appName;
    }

    public String getStatus() {
        return status;
    }

    public String getHttpSeries() {
        return httpSeries;
    }

    public Integer getHttpStatusCode() {
        return httpStatusCode;
    }

    public String getRequestPayload() {
        return requestPayload;
    }

    public String getChannelPayload() {
        return channelPayload;
    }

    public String getCorePayload() {
        return corePayload;
    }

    public String getCoreResponse() {
        return coreResponse;
    }

    public String getChannelResponse() {
        return channelResponse;
    }

    public LocalDateTime getRequestTimestamp() {
        return requestTimestamp;
    }

    public Integer getRequestReceivedLatencyMs() {
        return requestReceivedLatencyMs;
    }

    public Integer getExternalLatencyMs() {
        return externalLatencyMs;
    }

    public Integer getTotalLatencyMs() {
        return totalLatencyMs;
    }
}
