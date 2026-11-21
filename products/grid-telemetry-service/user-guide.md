# Grid Telemetry & Dispatch Service — Service Consumer & User Guide

## Service Overview & Access Posture

<!-- BEGIN DAC:user-service-overview source="gitpavleenbali/dac-workload-modernization@70ac7177abe6360d4f1b606913c840111c708fb7" irHash="e8147f08f46c" -->
| Consumer Property | Active Production Configuration |
| :--- | :--- |
| **Service Name** | **Grid Telemetry & Dispatch Service** |
| **Gateway / Entrypoint** | `lb-grid-telemetry` (Azure Standard Load Balancer) |
| **Runtime Scaling & Availability** | Single-Region VM Host (Standard_D4s_v5) • Target SLO 99.95% |
| **Async Event Buffering** | Not enabled (synchronous database write path) |
| **Exposure & Security** | TCP 8080 via Azure Standard Load Balancer |
<!-- END DAC:user-service-overview -->

## API Endpoints Catalog

<!-- BEGIN DAC:user-endpoints-catalog source="gitpavleenbali/dac-workload-modernization@70ac7177abe6360d4f1b606913c840111c708fb7" irHash="e8147f08f46c" -->
| HTTP Method | Endpoint Path | Capability Summary |
| :--- | :--- | :--- |
| `GET` | `/healthz` | Liveness and readiness probe returning active runtime mode and buffer depth |
| `GET` | `/v1/grid/status` | Retrieve current regional grid nominal frequency, active frequency-deviation alerts, and latest substation reading |
| `POST` | `/v1/telemetry` | Idempotently ingest substation voltage and frequency telemetry reading |
| `GET` | `/v1/telemetry/recent` | List most recent 25 telemetry readings in the active window |
<!-- END DAC:user-endpoints-catalog -->

## Consumer Onboarding, Rate Limits & Support

- **Authentication:** Internal platform consumers authenticate using Entra ID App Roles (`Telemetry.Read`, `Telemetry.Ingest`) issued under tenant policy `POL-GRID-API`.
- **Standard Rate Quota:** Up to 2,500 requests/minute per consumer client ID; request burst exemptions via the Cloud Platform intake portal.
- **Support Channel:** Raise non-urgent integration requests in `#grid-telemetry-support` or open an issue in this documentation repository.
