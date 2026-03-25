TRUNCATE TABLE trace_record;

INSERT INTO trace_record (
  correlation_id,
  channel_id,
  api_name,
  app_name,
  status,
  http_series,
  request_payload,
  channel_payload,
  core_payload,
  core_response,
  channel_response,
  request_received_latency_ms,
  external_latency_ms,
  total_latency_ms,
  requesttimestamp
)
SELECT
  CONCAT('CORR-20260322-', LPAD(seq.n + 1, 6, '0')) AS correlation_id,
  CONCAT(
    CASE MOD(seq.n, 5)
      WHEN 0 THEN 'WEB'
      WHEN 1 THEN 'MOB'
      WHEN 2 THEN 'ATM'
      WHEN 3 THEN 'BRN'
      ELSE 'API'
    END,
    '-',
    LPAD(MOD(seq.n, 40) + 1, 2, '0')
  ) AS channel_id,
  CONCAT('Api', LPAD(MOD(seq.n, 100) + 1, 3, '0')) AS api_name,
  CONCAT('App', LPAD(FLOOR(MOD(seq.n, 100) / 10) + 1, 2, '0')) AS app_name,
  CASE
    WHEN MOD(seq.n, 20) = 0 THEN 'FAILURE'
    WHEN MOD(seq.n, 13) = 0 THEN 'FAILURE'
    ELSE 'SUCCESS'
  END AS status,
  CASE
    WHEN MOD(seq.n, 20) = 0 THEN '500'
    WHEN MOD(seq.n, 13) = 0 THEN '400'
    ELSE '200'
  END AS http_series,
  CONCAT(
    '{"requestPayload":{"operatorId":"OP-',
    LPAD(MOD(seq.n, 9000) + 1, 4, '0'),
    '","customerId":"CUST-',
    LPAD(MOD(seq.n * 7, 999999) + 1, 6, '0'),
    '","accountId":"ACC-',
    LPAD(MOD(seq.n * 11, 999999) + 1, 6, '0'),
    '","api":"Api',
    LPAD(MOD(seq.n, 100) + 1, 3, '0'),
    '","channel":"',
    CASE MOD(seq.n, 5)
      WHEN 0 THEN 'WEB'
      WHEN 1 THEN 'MOBILE'
      WHEN 2 THEN 'ATM'
      WHEN 3 THEN 'BRANCH'
      ELSE 'PARTNER'
    END,
    '","requestHeaders":{"x-correlation-id":"CORR-20260322-',
    LPAD(seq.n + 1, 6, '0'),
    '","x-operator":"OP-',
    LPAD(MOD(seq.n, 5000) + 1, 4, '0'),
    '"},"filters":{"region":"SG","segment":"',
    CASE MOD(seq.n, 4)
      WHEN 0 THEN 'PREMIUM'
      WHEN 1 THEN 'MASS'
      WHEN 2 THEN 'SME'
      ELSE 'STAFF'
    END,
    '"},"notes":"',
    REPEAT(CONCAT('channel-segment-', LPAD(MOD(seq.n, 99), 2, '0'), '-'), 10),
    '"}}'
  ) AS request_payload,
  CONCAT(
    '{"channelPayload":{"gateway":"CHANNEL-EDGE","canonicalRequest":{"operatorId":"OP-',
    LPAD(MOD(seq.n, 9000) + 1, 4, '0'),
    '","customerRef":"CUST-',
    LPAD(MOD(seq.n * 7, 999999) + 1, 6, '0'),
    '","accountRef":"ACC-',
    LPAD(MOD(seq.n * 11, 999999) + 1, 6, '0'),
    '","api":"Api',
    LPAD(MOD(seq.n, 100) + 1, 3, '0'),
    '","route":"',
    CASE MOD(seq.n, 5)
      WHEN 0 THEN 'web-bff'
      WHEN 1 THEN 'mobile-gw'
      WHEN 2 THEN 'atm-switch'
      WHEN 3 THEN 'branch-edge'
      ELSE 'partner-edge'
    END,
    '","compliance":{"aml":"CLEARED","kyc":"VERIFIED"},"traceHints":"',
    REPEAT(CONCAT('trace-hop-', LPAD(MOD(seq.n, 41), 2, '0'), '-'), 8),
    '"}}}'
  ) AS channel_payload,
  CONCAT(
    '{"coreRequest":{"service":"CoreBanking","messageType":"SYNC","operator":"OP-',
    LPAD(MOD(seq.n, 5000) + 1, 4, '0'),
    '","api":"Api',
    LPAD(MOD(seq.n, 100) + 1, 3, '0'),
    '","account":"ACC-',
    LPAD(MOD(seq.n * 11, 999999) + 1, 6, '0'),
    '","routing":{"branch":"',
    LPAD(MOD(seq.n, 300) + 1, 3, '0'),
    '","host":"CORE-',
    LPAD(MOD(seq.n, 12) + 1, 2, '0'),
    '"},"body":"',
    REPEAT(CONCAT('core-payload-', LPAD(MOD(seq.n * 3, 97), 2, '0'), '-'), 12),
    '"}}'
  ) AS core_payload,
  CASE
    WHEN MOD(seq.n, 20) = 0 THEN CONCAT(
      '{"status":"FAILED","errorType":"TIMEOUT","message":"External system timeout for operator OP-',
      LPAD(MOD(seq.n, 5000) + 1, 4, '0'),
      '","diagnostics":"',
      REPEAT('timeout-hop-', 10),
      '"}'
    )
    WHEN MOD(seq.n, 13) = 0 THEN CONCAT(
      '{"status":"FAILED","errorType":"VALIDATION","message":"Operator payload validation failed","code":"VAL-',
      LPAD(MOD(seq.n, 200) + 1, 3, '0'),
      '"}'
    )
    ELSE CONCAT(
      '{"status":"OK","records":',
      MOD(seq.n, 7) + 1,
      ',"host":"CORE-',
      LPAD(MOD(seq.n, 12) + 1, 2, '0'),
      '","bookings":"',
      REPEAT(CONCAT('book-', LPAD(MOD(seq.n, 31), 2, '0'), '-'), 8),
      '"}'
    )
  END AS core_response,
  CASE
    WHEN MOD(seq.n, 20) = 0 THEN CONCAT(
      '{"status":"ERROR","channelMessage":"Request timeout","operatorMessage":"Retry later","trace":"',
      REPEAT('gw-timeout-', 8),
      '"}'
    )
    WHEN MOD(seq.n, 13) = 0 THEN CONCAT(
      '{"status":"ERROR","channelMessage":"Invalid request payload","operatorMessage":"Correct the request and retry","validationRef":"VR-',
      LPAD(MOD(seq.n, 1000) + 1, 4, '0'),
      '"}'
    )
    ELSE CONCAT(
      '{"status":"SUCCESS","message":"Processed successfully","reference":"REF-',
      LPAD(seq.n + 1, 8, '0'),
      '","channelResponse":"',
      REPEAT(CONCAT('channel-ok-', LPAD(MOD(seq.n, 37), 2, '0'), '-'), 8),
      '"}'
    )
  END AS channel_response,
  5 + MOD(seq.n, 65) AS request_received_latency_ms,
  45 + MOD(seq.n * 3, 420) AS external_latency_ms,
  60 + MOD(seq.n, 65) + MOD(seq.n * 3, 420) + MOD(seq.n, 55) AS total_latency_ms,
  TIMESTAMP('2026-03-22 00:00:00') + INTERVAL MOD(seq.n * 37, 86400) SECOND AS requesttimestamp
FROM (
  SELECT
    ones.d
    + tens.d * 10
    + hundreds.d * 100
    + thousands.d * 1000
    + ten_thousands.d * 10000 AS n
  FROM
    (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) ones
    CROSS JOIN (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) tens
    CROSS JOIN (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) hundreds
    CROSS JOIN (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) thousands
    CROSS JOIN (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) ten_thousands
) seq
ORDER BY seq.n;
