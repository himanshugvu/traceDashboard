ALTER TABLE trace_record
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) AFTER app_name,
  ADD COLUMN IF NOT EXISTS request_payload LONGTEXT AFTER app_name,
  ADD COLUMN IF NOT EXISTS request_received_latency_ms INT AFTER channel_response,
  ADD COLUMN IF NOT EXISTS external_latency_ms INT AFTER request_received_latency_ms,
  ADD COLUMN IF NOT EXISTS total_latency_ms INT AFTER external_latency_ms;

CREATE INDEX IF NOT EXISTS idx_trace_record_requesttimestamp_status
  ON trace_record (requesttimestamp, status);

CREATE INDEX IF NOT EXISTS idx_trace_record_scope_status
  ON trace_record (requesttimestamp, app_name, api_name, status);
