package com.tracedashboard.trace;

import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.Locale;

public final class TraceSpecifications {

    private TraceSpecifications() {
    }

    public static Specification<TraceRecord> requestTimestampBetween(LocalDateTime from, LocalDateTime toExclusive) {
        return (root, query, builder) -> builder.and(
            builder.greaterThanOrEqualTo(root.get("requestTimestamp"), from),
            builder.lessThan(root.get("requestTimestamp"), toExclusive)
        );
    }

    public static Specification<TraceRecord> requestTimestampOnOrAfter(LocalDateTime from) {
        return (root, query, builder) -> builder.greaterThanOrEqualTo(root.get("requestTimestamp"), from);
    }

    public static Specification<TraceRecord> requestTimestampOnOrBefore(LocalDateTime to) {
        return (root, query, builder) -> builder.lessThanOrEqualTo(root.get("requestTimestamp"), to);
    }

    public static Specification<TraceRecord> apiNameEquals(String value) {
        if (isBlank(value)) {
            return null;
        }
        return (root, query, builder) -> builder.equal(root.get("apiName"), value.trim());
    }

    public static Specification<TraceRecord> appNameEquals(String value) {
        if (isBlank(value)) {
            return null;
        }
        return (root, query, builder) -> builder.equal(root.get("appName"), value.trim());
    }

    public static Specification<TraceRecord> channelIdContains(String value) {
        return containsIgnoreCase("channelId", value);
    }

    public static Specification<TraceRecord> correlationIdContains(String value) {
        return containsIgnoreCase("correlationId", value);
    }

    public static Specification<TraceRecord> payloadContains(String value) {
        if (isBlank(value)) {
            return null;
        }
        var needle = "%" + value.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, builder) -> builder.or(
            builder.like(builder.lower(root.get("requestPayload")), needle),
            builder.like(builder.lower(root.get("channelPayload")), needle),
            builder.like(builder.lower(root.get("corePayload")), needle),
            builder.like(builder.lower(root.get("coreResponse")), needle),
            builder.like(builder.lower(root.get("channelResponse")), needle)
        );
    }

    public static Specification<TraceRecord> anyFieldContains(String value) {
        if (isBlank(value)) {
            return null;
        }
        var needle = "%" + value.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, builder) -> builder.or(
            builder.like(builder.lower(root.get("correlationId")), needle),
            builder.like(builder.lower(root.get("channelId")), needle),
            builder.like(builder.lower(root.get("apiName")), needle),
            builder.like(builder.lower(root.get("appName")), needle),
            builder.like(builder.lower(root.get("requestPayload")), needle),
            builder.like(builder.lower(root.get("channelPayload")), needle),
            builder.like(builder.lower(root.get("corePayload")), needle),
            builder.like(builder.lower(root.get("coreResponse")), needle),
            builder.like(builder.lower(root.get("channelResponse")), needle)
        );
    }

    public static Specification<TraceRecord> statusEquals(String value) {
        if (isBlank(value)) {
            return null;
        }
        var normalized = value.trim().toUpperCase(Locale.ROOT);
        return (root, query, builder) -> builder.equal(builder.upper(root.get("status")), normalized);
    }

    private static Specification<TraceRecord> containsIgnoreCase(String fieldName, String value) {
        if (isBlank(value)) {
            return null;
        }
        var needle = "%" + value.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, builder) -> builder.like(builder.lower(root.get(fieldName)), needle);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
