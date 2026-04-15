# Bundle generated: 2026-04-15 20:45:55
# Root: C:\Users\himan\Project\codexWin\traceDashboard

====================================================================================================
FILE: .\db\01-trace-schema.sql
====================================================================================================

CREATE TABLE IF NOT EXISTS trace_record (
  id BIGINT NOT NULL AUTO_INCREMENT,
  correlation_id VARCHAR(255),
  channel_id VARCHAR(255),
  api_name VARCHAR(255),
  app_name VARCHAR(255),
  status VARCHAR(20),
  http_series VARCHAR(3),
  request_payload LONGTEXT,
  channel_payload LONGTEXT,
  core_payload LONGTEXT,
  core_response LONGTEXT,
  channel_response LONGTEXT,
  request_received_latency_ms INT,
  external_latency_ms INT,
  total_latency_ms INT,
  requesttimestamp DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_trace_record_requesttimestamp (requesttimestamp),
  KEY idx_trace_record_requesttimestamp_status (requesttimestamp, status),
  KEY idx_trace_record_requesttimestamp_http_series (requesttimestamp, http_series),
  KEY idx_trace_record_scope_status (requesttimestamp, app_name, api_name, status),
  KEY idx_trace_record_scope_http_series (requesttimestamp, app_name, api_name, http_series),
  KEY idx_trace_record_api_name (api_name),
  KEY idx_trace_record_app_name (app_name),
  KEY idx_trace_record_correlation_id (correlation_id),
  KEY idx_trace_record_channel_id (channel_id)
);


====================================================================================================
FILE: .\db\02-trace-seed.sql
====================================================================================================

INSERT INTO trace_record (
  correlation_id,
  channel_id,
  api_name,
  app_name,
  status,
  http_series,
  channel_payload,
  core_payload,
  core_response,
  channel_response,
  requesttimestamp
) VALUES
  ('CORR-20260322-0001', 'WEB-01', 'CustomerSearch', 'RetailPortal', 'SUCCESS', '200', '{"customerId":"10001","request":"search"}', '{"coreRequest":"customer lookup","customerId":"10001"}', '{"status":"OK","records":1}', '{"status":"SUCCESS","message":"Customer found"}', '2026-03-22 08:05:11'),
  ('CORR-20260322-0002', 'WEB-02', 'CustomerSearch', 'RetailPortal', 'SUCCESS', '200', '{"customerId":"10002","request":"search"}', '{"coreRequest":"customer lookup","customerId":"10002"}', '{"status":"OK","records":1}', '{"status":"SUCCESS","message":"Customer found"}', '2026-03-22 08:17:45'),
  ('CORR-20260322-0003', 'MOB-01', 'CustomerSearch', 'MobileBanking', 'SUCCESS', '200', '{"customerId":"10003","request":"search"}', '{"coreRequest":"customer lookup","customerId":"10003"}', '{"status":"OK","records":0}', '{"status":"SUCCESS","message":"No customer found"}', '2026-03-22 08:30:29'),
  ('CORR-20260322-0004', 'WEB-01', 'BalanceInquiry', 'RetailPortal', 'SUCCESS', '200', '{"account":"ACC-1001"}', '{"coreRequest":"balance inquiry","account":"ACC-1001"}', '{"status":"OK","balance":2550.22}', '{"status":"SUCCESS","balance":2550.22}', '2026-03-22 09:01:14'),
  ('CORR-20260322-0005', 'WEB-03', 'BalanceInquiry', 'RetailPortal', 'SUCCESS', '200', '{"account":"ACC-1002"}', '{"coreRequest":"balance inquiry","account":"ACC-1002"}', '{"status":"OK","balance":980.11}', '{"status":"SUCCESS","balance":980.11}', '2026-03-22 09:12:03'),
  ('CORR-20260322-0006', 'MOB-02', 'BalanceInquiry', 'MobileBanking', 'SUCCESS', '200', '{"account":"ACC-1003"}', '{"coreRequest":"balance inquiry","account":"ACC-1003"}', '{"status":"OK","balance":12500.00}', '{"status":"SUCCESS","balance":12500.00}', '2026-03-22 09:40:54'),
  ('CORR-20260322-0007', 'ATM-01', 'FundTransfer', 'ATMNetwork', 'SUCCESS', '200', '{"from":"ACC-2001","to":"ACC-3001","amount":120.00}', '{"coreRequest":"fund transfer","amount":120.00}', '{"status":"OK","txnId":"TXN-9001"}', '{"status":"SUCCESS","txnId":"TXN-9001"}', '2026-03-22 10:08:37'),
  ('CORR-20260322-0008', 'MOB-03', 'FundTransfer', 'MobileBanking', 'SUCCESS', '200', '{"from":"ACC-2002","to":"ACC-3002","amount":450.00}', '{"coreRequest":"fund transfer","amount":450.00}', '{"status":"OK","txnId":"TXN-9002"}', '{"status":"SUCCESS","txnId":"TXN-9002"}', '2026-03-22 10:11:10'),
  ('CORR-20260322-0009', 'WEB-04', 'FundTransfer', 'RetailPortal', 'FAILURE', '400', '{"from":"ACC-2003","to":"ACC-3003","amount":89.20}', '{"coreRequest":"fund transfer","amount":89.20}', '{"status":"FAILED","code":"LIMIT"}', '{"status":"ERROR","message":"Transfer limit exceeded"}', '2026-03-22 10:18:55'),
  ('CORR-20260322-0010', 'BRN-01', 'LoanStatus', 'BranchDesk', 'SUCCESS', '200', '{"loanId":"LN-4401"}', '{"coreRequest":"loan status","loanId":"LN-4401"}', '{"status":"OK","stage":"APPROVED"}', '{"status":"SUCCESS","stage":"APPROVED"}', '2026-03-22 10:42:22'),
  ('CORR-20260322-0011', 'WEB-05', 'LoanStatus', 'RetailPortal', 'SUCCESS', '200', '{"loanId":"LN-4402"}', '{"coreRequest":"loan status","loanId":"LN-4402"}', '{"status":"OK","stage":"PENDING"}', '{"status":"SUCCESS","stage":"PENDING"}', '2026-03-22 11:02:17'),
  ('CORR-20260322-0012', 'MOB-04', 'CardActivation', 'MobileBanking', 'SUCCESS', '200', '{"card":"CARD-1201"}', '{"coreRequest":"activate card","card":"CARD-1201"}', '{"status":"OK","activated":true}', '{"status":"SUCCESS","activated":true}', '2026-03-22 11:15:46'),
  ('CORR-20260322-0013', 'WEB-06', 'CardActivation', 'RetailPortal', 'FAILURE', '400', '{"card":"CARD-1202"}', '{"coreRequest":"activate card","card":"CARD-1202"}', '{"status":"FAILED","code":"INVALID"}', '{"status":"ERROR","message":"Invalid card state"}', '2026-03-22 11:35:02'),
  ('CORR-20260322-0014', 'API-01', 'StatementDownload', 'PartnerGateway', 'SUCCESS', '200', '{"account":"ACC-4001","month":"2026-02"}', '{"coreRequest":"statement download","account":"ACC-4001"}', '{"status":"OK","pages":12}', '{"status":"SUCCESS","file":"statement-4001.pdf"}', '2026-03-22 12:04:40'),
  ('CORR-20260322-0015', 'API-02', 'StatementDownload', 'PartnerGateway', 'SUCCESS', '200', '{"account":"ACC-4002","month":"2026-02"}', '{"coreRequest":"statement download","account":"ACC-4002"}', '{"status":"OK","pages":8}', '{"status":"SUCCESS","file":"statement-4002.pdf"}', '2026-03-22 12:20:15'),
  ('CORR-20260322-0016', 'WEB-07', 'CustomerSearch', 'RetailPortal', 'SUCCESS', '200', '{"customerId":"10004","request":"search"}', '{"coreRequest":"customer lookup","customerId":"10004"}', '{"status":"OK","records":2}', '{"status":"SUCCESS","message":"Multiple records"}', '2026-03-22 12:44:09'),
  ('CORR-20260322-0017', 'MOB-05', 'BalanceInquiry', 'MobileBanking', 'SUCCESS', '200', '{"account":"ACC-1004"}', '{"coreRequest":"balance inquiry","account":"ACC-1004"}', '{"status":"OK","balance":775.55}', '{"status":"SUCCESS","balance":775.55}', '2026-03-22 13:03:28'),
  ('CORR-20260322-0018', 'WEB-08', 'FundTransfer', 'RetailPortal', 'SUCCESS', '200', '{"from":"ACC-2004","to":"ACC-3004","amount":999.99}', '{"coreRequest":"fund transfer","amount":999.99}', '{"status":"OK","txnId":"TXN-9003"}', '{"status":"SUCCESS","txnId":"TXN-9003"}', '2026-03-22 13:19:44'),
  ('CORR-20260322-0019', 'API-03', 'LoanStatus', 'PartnerGateway', 'SUCCESS', '200', '{"loanId":"LN-4403"}', '{"coreRequest":"loan status","loanId":"LN-4403"}', '{"status":"OK","stage":"DISBURSED"}', '{"status":"SUCCESS","stage":"DISBURSED"}', '2026-03-22 13:48:01'),
  ('CORR-20260322-0020', 'BRN-02', 'CardActivation', 'BranchDesk', 'SUCCESS', '200', '{"card":"CARD-1203"}', '{"coreRequest":"activate card","card":"CARD-1203"}', '{"status":"OK","activated":true}', '{"status":"SUCCESS","activated":true}', '2026-03-22 14:07:36'),
  ('CORR-20260321-0001', 'WEB-01', 'CustomerSearch', 'RetailPortal', 'SUCCESS', '200', '{"customerId":"9001","request":"search"}', '{"coreRequest":"customer lookup","customerId":"9001"}', '{"status":"OK","records":1}', '{"status":"SUCCESS","message":"Customer found"}', '2026-03-21 08:11:11'),
  ('CORR-20260321-0002', 'MOB-01', 'BalanceInquiry', 'MobileBanking', 'SUCCESS', '200', '{"account":"ACC-7001"}', '{"coreRequest":"balance inquiry","account":"ACC-7001"}', '{"status":"OK","balance":125.01}', '{"status":"SUCCESS","balance":125.01}', '2026-03-21 09:45:05'),
  ('CORR-20260321-0003', 'WEB-03', 'FundTransfer', 'RetailPortal', 'SUCCESS', '200', '{"from":"ACC-7101","to":"ACC-7201","amount":10.00}', '{"coreRequest":"fund transfer","amount":10.00}', '{"status":"OK","txnId":"TXN-8801"}', '{"status":"SUCCESS","txnId":"TXN-8801"}', '2026-03-21 10:30:55'),
  ('CORR-20260321-0004', 'API-09', 'StatementDownload', 'PartnerGateway', 'SUCCESS', '200', '{"account":"ACC-7301","month":"2026-01"}', '{"coreRequest":"statement download","account":"ACC-7301"}', '{"status":"OK","pages":4}', '{"status":"SUCCESS","file":"statement-7301.pdf"}', '2026-03-21 11:50:42');


====================================================================================================
FILE: .\db\03-trace-seed-100k.sql
====================================================================================================

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


====================================================================================================
FILE: .\db\04-trace-schema-upgrade.sql
====================================================================================================

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


====================================================================================================
FILE: .\db\05-trace-seed-apr-2026.sql
====================================================================================================

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
) VALUES
  ('CORR-20260414-1401', 'WEB-APR-01', 'CustomerSearch', 'RetailPortal', 'SUCCESS', '200', '{"customerId":"CUST-1401","query":"search"}', '{"entryChannel":"WEB","device":"desktop"}', '{"coreRequest":"customer lookup","customerId":"CUST-1401"}', '{"status":"OK","records":1}', '{"status":"SUCCESS","message":"Customer found"}', 14, 38, 52, '2026-04-14 08:12:18'),
  ('CORR-20260414-1402', 'MOB-APR-02', 'BalanceInquiry', 'MobileBanking', 'SUCCESS', '200', '{"accountId":"ACC-1402","request":"balance"}', '{"entryChannel":"MOBILE","device":"ios"}', '{"coreRequest":"balance inquiry","accountId":"ACC-1402"}', '{"status":"OK","balance":1850.44}', '{"status":"SUCCESS","balance":1850.44}', 12, 61, 73, '2026-04-14 08:43:11'),
  ('CORR-20260414-1403', 'API-APR-03', 'FundTransfer', 'PartnerGateway', 'FAILURE', '400', '{"from":"ACC-1403","to":"ACC-2403","amount":950.00}', '{"entryChannel":"PARTNER","partner":"sg-wallet"}', '{"coreRequest":"fund transfer","amount":950.00}', '{"status":"FAILED","code":"LIMIT_EXCEEDED"}', '{"status":"ERROR","message":"Transfer limit exceeded"}', 21, 184, 205, '2026-04-14 09:05:27'),
  ('CORR-20260414-1404', 'ATM-APR-04', 'CardActivation', 'ATMNetwork', 'SUCCESS', '200', '{"cardId":"CARD-1404","request":"activate"}', '{"entryChannel":"ATM","terminal":"ATM-044"}', '{"coreRequest":"card activation","cardId":"CARD-1404"}', '{"status":"OK","activated":true}', '{"status":"SUCCESS","activated":true}', 18, 92, 110, '2026-04-14 09:26:49'),
  ('CORR-20260414-1405', 'WEB-APR-05', 'LoanStatus', 'RetailPortal', 'SUCCESS', '200', '{"loanId":"LN-1405"}', '{"entryChannel":"WEB","device":"desktop"}', '{"coreRequest":"loan status","loanId":"LN-1405"}', '{"status":"OK","stage":"PENDING"}', '{"status":"SUCCESS","stage":"PENDING"}', 15, 66, 81, '2026-04-14 10:02:33'),
  ('CORR-20260414-1406', 'MOB-APR-06', 'StatementDownload', 'MobileBanking', 'FAILURE', '500', '{"accountId":"ACC-1406","month":"2026-03"}', '{"entryChannel":"MOBILE","device":"android"}', '{"coreRequest":"statement generation","accountId":"ACC-1406"}', '{"status":"FAILED","code":"DOWNSTREAM_TIMEOUT"}', '{"status":"ERROR","message":"Statement service timeout"}', 27, 641, 668, '2026-04-14 10:44:15'),
  ('CORR-20260414-1407', 'BRN-APR-07', 'CustomerSearch', 'BranchDesk', 'SUCCESS', '200', '{"customerId":"CUST-1407","query":"search"}', '{"entryChannel":"BRANCH","operator":"OP-1407"}', '{"coreRequest":"customer lookup","customerId":"CUST-1407"}', '{"status":"OK","records":2}', '{"status":"SUCCESS","message":"Multiple matches"}', 11, 41, 52, '2026-04-14 11:17:05'),
  ('CORR-20260414-1408', 'API-APR-08', 'PaymentValidation', 'PartnerGateway', 'FAILURE', '400', '{"paymentId":"PAY-1408","amount":88.10}', '{"entryChannel":"PARTNER","partner":"biller-x"}', '{"coreRequest":"payment validation","paymentId":"PAY-1408"}', '{"status":"FAILED","code":"INVALID_ACCOUNT"}', '{"status":"ERROR","message":"Destination account invalid"}', 19, 133, 152, '2026-04-14 11:56:22'),
  ('CORR-20260415-1501', 'WEB-APR-11', 'CustomerSearch', 'RetailPortal', 'SUCCESS', '200', '{"customerId":"CUST-1501","query":"search"}', '{"entryChannel":"WEB","device":"desktop"}', '{"coreRequest":"customer lookup","customerId":"CUST-1501"}', '{"status":"OK","records":1}', '{"status":"SUCCESS","message":"Customer found"}', 13, 29, 42, '2026-04-15 08:09:14'),
  ('CORR-20260415-1502', 'MOB-APR-12', 'BalanceInquiry', 'MobileBanking', 'SUCCESS', '200', '{"accountId":"ACC-1502","request":"balance"}', '{"entryChannel":"MOBILE","device":"ios"}', '{"coreRequest":"balance inquiry","accountId":"ACC-1502"}', '{"status":"OK","balance":225.90}', '{"status":"SUCCESS","balance":225.90}', 10, 48, 58, '2026-04-15 08:36:41'),
  ('CORR-20260415-1503', 'API-APR-13', 'FundTransfer', 'PartnerGateway', 'SUCCESS', '200', '{"from":"ACC-1503","to":"ACC-2503","amount":120.75}', '{"entryChannel":"PARTNER","partner":"wallet-plus"}', '{"coreRequest":"fund transfer","amount":120.75}', '{"status":"OK","txnId":"TXN-1503"}', '{"status":"SUCCESS","txnId":"TXN-1503"}', 24, 127, 151, '2026-04-15 09:01:05'),
  ('CORR-20260415-1504', 'ATM-APR-14', 'CardActivation', 'ATMNetwork', 'FAILURE', '400', '{"cardId":"CARD-1504","request":"activate"}', '{"entryChannel":"ATM","terminal":"ATM-054"}', '{"coreRequest":"card activation","cardId":"CARD-1504"}', '{"status":"FAILED","code":"CARD_LOCKED"}', '{"status":"ERROR","message":"Card locked"}', 16, 88, 104, '2026-04-15 09:28:57'),
  ('CORR-20260415-1505', 'WEB-APR-15', 'LoanStatus', 'RetailPortal', 'SUCCESS', '200', '{"loanId":"LN-1505"}', '{"entryChannel":"WEB","device":"desktop"}', '{"coreRequest":"loan status","loanId":"LN-1505"}', '{"status":"OK","stage":"APPROVED"}', '{"status":"SUCCESS","stage":"APPROVED"}', 17, 57, 74, '2026-04-15 10:11:20'),
  ('CORR-20260415-1506', 'MOB-APR-16', 'StatementDownload', 'MobileBanking', 'SUCCESS', '200', '{"accountId":"ACC-1506","month":"2026-03"}', '{"entryChannel":"MOBILE","device":"android"}', '{"coreRequest":"statement generation","accountId":"ACC-1506"}', '{"status":"OK","pages":6}', '{"status":"SUCCESS","file":"statement-1506.pdf"}', 28, 302, 330, '2026-04-15 10:43:18'),
  ('CORR-20260415-1507', 'BRN-APR-17', 'CustomerProfileUpdate', 'BranchDesk', 'FAILURE', '500', '{"customerId":"CUST-1507","segment":"PRIORITY"}', '{"entryChannel":"BRANCH","operator":"OP-1507"}', '{"coreRequest":"profile update","customerId":"CUST-1507"}', '{"status":"FAILED","code":"CORE_UNAVAILABLE"}', '{"status":"ERROR","message":"Core profile service unavailable"}', 22, 812, 834, '2026-04-15 11:07:44'),
  ('CORR-20260415-1508', 'API-APR-18', 'PaymentValidation', 'PartnerGateway', 'SUCCESS', '200', '{"paymentId":"PAY-1508","amount":48.55}', '{"entryChannel":"PARTNER","partner":"biller-y"}', '{"coreRequest":"payment validation","paymentId":"PAY-1508"}', '{"status":"OK","validated":true}', '{"status":"SUCCESS","message":"Payment accepted"}', 14, 71, 85, '2026-04-15 11:33:59');



