# Trace Dashboard

Full-stack trace monitoring application with:

- React 19 + Vite frontend
- Spring Boot 4.0.3 backend on Java 21
- MariaDB persistence

## Structure

- `backend` - REST API for daily summaries, trace search, and detail lookup
- `frontend` - dashboard, trace list, and detail drawer UI

## Backend setup

Set the database connection before running the API:

```powershell
$env:TRACE_DB_URL="jdbc:mariadb://localhost:3306/trace_db"
$env:TRACE_DB_USERNAME="trace_user"
$env:TRACE_DB_PASSWORD="trace_password"
```

Run the backend:

```powershell
cd C:\Users\himan\Project\codexWin\traceDashboard\backend
mvn spring-boot:run
```

Start a local MariaDB with the included schema if needed:

```powershell
cd C:\Users\himan\Project\codexWin\traceDashboard
docker compose up -d
```

Default assumptions:

- table name: `trace_record`
- columns:
  - `id`
  - `correlation_id`
  - `channel_id`
  - `api_name`
  - `app_name`
  - `channel_payload`
  - `core_payload`
  - `core_response`
  - `channel_response`
  - `requesttimestamp`

If your table or column names differ, update the JPA mapping in `backend/src/main/java/com/tracedashboard/trace/TraceRecord.java`.
The sample DDL and indexes are in `db/01-trace-schema.sql`.

## Frontend setup

```powershell
cd C:\Users\himan\Project\codexWin\traceDashboard\frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:8080`.

## MariaDB helper

A local MariaDB service is included in `docker-compose.yml` for convenience.
