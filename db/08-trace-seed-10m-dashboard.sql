INSERT INTO trace_record (
  correlation_id,
  channel_id,
  api_name,
  app_name,
  status,
  http_series,
  http_status_code,
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
  CONCAT('CORR-20260428-', LPAD(seq.n + 1, 8, '0')) AS correlation_id,
  CONCAT(
    CASE MOD(seq.n, 5)
      WHEN 0 THEN 'WEB'
      WHEN 1 THEN 'MOB'
      WHEN 2 THEN 'ATM'
      WHEN 3 THEN 'BRN'
      ELSE 'API'
    END,
    '-',
    LPAD(MOD(seq.n, 500) + 1, 3, '0')
  ) AS channel_id,
  CONCAT('Api', LPAD(MOD(seq.n, 400) + 1, 3, '0')) AS api_name,
  CONCAT('App', LPAD(MOD(seq.n, 80) + 1, 2, '0')) AS app_name,
  CASE
    WHEN MOD(seq.n, 97) = 0 THEN 'FAILURE'
    WHEN MOD(seq.n, 31) = 0 THEN 'FAILURE'
    ELSE 'SUCCESS'
  END AS status,
  CASE
    WHEN MOD(seq.n, 97) = 0 THEN '500'
    WHEN MOD(seq.n, 31) = 0 THEN '400'
    ELSE '200'
  END AS http_series,
  CASE
    WHEN MOD(seq.n, 194) = 0 THEN 503
    WHEN MOD(seq.n, 97) = 0 THEN 500
    WHEN MOD(seq.n, 62) = 0 THEN 429
    WHEN MOD(seq.n, 31) = 0 THEN 404
    ELSE 200
  END AS http_status_code,
  CONCAT('{"cid":"', LPAD(seq.n + 1, 8, '0'), '","kind":"request"}') AS request_payload,
  CONCAT('{"ch":"', CASE MOD(seq.n, 5)
      WHEN 0 THEN 'WEB'
      WHEN 1 THEN 'MOBILE'
      WHEN 2 THEN 'ATM'
      WHEN 3 THEN 'BRANCH'
      ELSE 'PARTNER'
    END, '"}') AS channel_payload,
  CONCAT('{"svc":"core","api":"Api', LPAD(MOD(seq.n, 400) + 1, 3, '0'), '"}') AS core_payload,
  CASE
    WHEN MOD(seq.n, 194) = 0 THEN '{"status":"FAILED","code":503,"message":"Service unavailable"}'
    WHEN MOD(seq.n, 97) = 0 THEN '{"status":"FAILED","code":500,"message":"Core timeout"}'
    WHEN MOD(seq.n, 62) = 0 THEN '{"status":"FAILED","code":429,"message":"Rate limit"}'
    WHEN MOD(seq.n, 31) = 0 THEN '{"status":"FAILED","code":404,"message":"Not found"}'
    ELSE '{"status":"OK","code":200}'
  END AS core_response,
  CASE
    WHEN MOD(seq.n, 194) = 0 THEN '{"status":"ERROR","code":503}'
    WHEN MOD(seq.n, 97) = 0 THEN '{"status":"ERROR","code":500}'
    WHEN MOD(seq.n, 62) = 0 THEN '{"status":"ERROR","code":429}'
    WHEN MOD(seq.n, 31) = 0 THEN '{"status":"ERROR","code":404}'
    ELSE '{"status":"SUCCESS","code":200}'
  END AS channel_response,
  5 + MOD(seq.n, 40) AS request_received_latency_ms,
  CASE
    WHEN MOD(seq.n, 194) = 0 THEN 700 + MOD(seq.n, 250)
    WHEN MOD(seq.n, 97) = 0 THEN 450 + MOD(seq.n, 180)
    WHEN MOD(seq.n, 62) = 0 THEN 220 + MOD(seq.n, 90)
    WHEN MOD(seq.n, 31) = 0 THEN 80 + MOD(seq.n, 60)
    ELSE 20 + MOD(seq.n * 3, 150)
  END AS external_latency_ms,
  CASE
    WHEN MOD(seq.n, 194) = 0 THEN 740 + MOD(seq.n, 280)
    WHEN MOD(seq.n, 97) = 0 THEN 490 + MOD(seq.n, 220)
    WHEN MOD(seq.n, 62) = 0 THEN 250 + MOD(seq.n, 110)
    WHEN MOD(seq.n, 31) = 0 THEN 95 + MOD(seq.n, 75)
    ELSE 35 + MOD(seq.n, 40) + MOD(seq.n * 3, 150)
  END AS total_latency_ms,
  TIMESTAMP('2026-04-28 00:00:00') + INTERVAL MOD(seq.n * 17, 86400) SECOND AS requesttimestamp
FROM (
  SELECT
    d0.d
    + d1.d * 10
    + d2.d * 100
    + d3.d * 1000
    + d4.d * 10000
    + d5.d * 100000
    + d6.d * 1000000 AS n
  FROM
    (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d0
    CROSS JOIN (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d1
    CROSS JOIN (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d2
    CROSS JOIN (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d3
    CROSS JOIN (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d4
    CROSS JOIN (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d5
    CROSS JOIN (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d6
) seq
ORDER BY seq.n;
