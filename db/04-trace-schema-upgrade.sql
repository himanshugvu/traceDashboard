ALTER TABLE trace_record
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) AFTER app_name,
  ADD COLUMN IF NOT EXISTS http_series VARCHAR(3) AFTER status,
  ADD COLUMN IF NOT EXISTS request_payload LONGTEXT AFTER app_name,
  ADD COLUMN IF NOT EXISTS request_received_latency_ms INT AFTER channel_response,
  ADD COLUMN IF NOT EXISTS external_latency_ms INT AFTER request_received_latency_ms,
  ADD COLUMN IF NOT EXISTS total_latency_ms INT AFTER external_latency_ms;

CREATE INDEX IF NOT EXISTS idx_trace_record_requesttimestamp_status
  ON trace_record (requesttimestamp, status);

CREATE INDEX IF NOT EXISTS idx_trace_record_requesttimestamp_http_series
  ON trace_record (requesttimestamp, http_series);

CREATE INDEX IF NOT EXISTS idx_trace_record_scope_status
  ON trace_record (requesttimestamp, app_name, api_name, status);

CREATE INDEX IF NOT EXISTS idx_trace_record_scope_http_series
  ON trace_record (requesttimestamp, app_name, api_name, http_series);

UPDATE trace_record
SET http_series = CASE
  WHEN UPPER(COALESCE(status, '')) = 'SUCCESS' THEN '200'
  WHEN LOWER(COALESCE(core_response, '')) LIKE '%timeout%'
    OR LOWER(COALESCE(channel_response, '')) LIKE '%timeout%'
    OR LOWER(COALESCE(core_response, '')) LIKE '%unavailable%'
    OR LOWER(COALESCE(channel_response, '')) LIKE '%unavailable%'
    OR LOWER(COALESCE(core_response, '')) LIKE '%system%'
    OR LOWER(COALESCE(channel_response, '')) LIKE '%system%'
  THEN '500'
  ELSE '400'
END
WHERE http_series IS NULL OR http_series = '';
