# Grid Telemetry & Dispatch Service — Service Consumer & User Guide

The tables describe the interface declared at the [source revision](./dac-provenance.json). Endpoints and service-level objectives are not evidence of a reachable service or measured availability. The [workshop's file comparison](https://gitpavleenbali.github.io/dac-workload-modernization/#file-comparison) shows these declarations before and after the proposed change.

## Service Overview & Access Posture

<!-- BEGIN DAC:user-service-overview source="gitpavleenbali/dac-workload-modernization@9e573d092dd96a87c7ffd631218d41d0717e7261" irHash="e8147f08f46c" -->
| Consumer Property | Declared Configuration |
| :--- | :--- |
| **Service Name** | **Grid Telemetry & Dispatch Service** |
| **Gateway / Entrypoint** | `lb-grid-telemetry` (Azure Standard Load Balancer) |
| **Runtime Scaling & Availability** | Single-Region VM Host (Standard_D4s_v5) • Target SLO 99.95% |
| **Async Event Buffering** | Not enabled (synchronous database write path) |
| **Exposure & Security** | TCP 8080 via Azure Standard Load Balancer |
<!-- END DAC:user-service-overview -->

## API Endpoints Catalog

<!-- BEGIN DAC:user-endpoints-catalog source="gitpavleenbali/dac-workload-modernization@9e573d092dd96a87c7ffd631218d41d0717e7261" irHash="e8147f08f46c" -->
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
