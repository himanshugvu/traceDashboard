ALTER TABLE trace_record
  ADD COLUMN IF NOT EXISTS account_number VARCHAR(255) AFTER app_name;

CREATE INDEX IF NOT EXISTS idx_trace_record_account_number
  ON trace_record (account_number);

UPDATE trace_record
SET account_number = COALESCE(
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(request_payload, '$.account_number')), ''),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(request_payload, '$.account')), ''),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(request_payload, '$.accountId')), ''),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(request_payload, '$.requestPayload.accountId')), ''),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(request_payload, '$.requestPayload.account')), ''),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(core_payload, '$.account_number')), ''),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(core_payload, '$.account')), ''),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(core_payload, '$.accountId')), ''),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(core_payload, '$.coreRequest.accountId')), ''),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(core_payload, '$.coreRequest.account')), '')
)
WHERE account_number IS NULL OR account_number = '' OR account_number = '{';
