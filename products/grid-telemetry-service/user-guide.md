# Grid Telemetry & Dispatch Service — Service Consumer & User Guide

The tables describe the interface declared at the [source revision](./dac-provenance.json). Endpoints and service-level objectives are not evidence of a reachable service or measured availability. The [workshop's file comparison](https://gitpavleenbali.github.io/dac-workload-modernization/#file-comparison) shows these declarations before and after the proposed change.

## Service Overview & Access Posture

<!-- BEGIN DAC:user-service-overview source="gitpavleenbali/dac-workload-modernization@c710df3ba7f7faacfcbbacf47fdcb6852238c969" irHash="9d0955415321" -->
| Consumer Property | Declared Configuration |
| :--- | :--- |
| **Service Name** | **Grid Telemetry & Dispatch Service** |
| **Gateway / Entrypoint** | `agw-grid-waf` (Azure Application Gateway (WAF v2)) |
| **Runtime Scaling & Availability** | Kubernetes Rolling Updates (4 (HPA 4-24 pods)) • Target SLO 99.95% |
| **Async Event Buffering** | Enabled via Azure Service Bus (`sb-grid-telemetry`) |
| **Hot-State Read Cache** | Sub-millisecond substation state cache via `redis-grid-hotstate` (Premium) |
| **Exposure & Security** | HTTPS telemetry.grid.internal (azure-application-gateway) |
<!-- END DAC:user-service-overview -->

## API Endpoints Catalog

<!-- BEGIN DAC:user-endpoints-catalog source="gitpavleenbali/dac-workload-modernization@c710df3ba7f7faacfcbbacf47fdcb6852238c969" irHash="9d0955415321" -->
| HTTP Method | Endpoint Path | Capability Summary |
| :--- | :--- | :--- |
| `GET` | `/healthz` | Kubernetes liveness and readiness probe returning pod runtime mode and buffer depth |
| `GET` | `/v1/grid/status` | Retrieve current regional grid nominal frequency, active frequency-deviation alerts, and latest substation reading |
| `POST` | `/v1/telemetry` | Idempotently ingest single substation voltage and frequency telemetry reading |
| `POST` | `/v1/telemetry/batch` | Asynchronously enqueue high-frequency substation telemetry batch via Azure Service Bus Premium |
| `POST` | `/v1/dispatch/curtailment` | Issue automated substation load-curtailment dispatch command during grid frequency excursion |
| `GET` | `/v1/telemetry/recent` | List most recent 25 telemetry readings in the active window |
<!-- END DAC:user-endpoints-catalog -->

## Consumer Onboarding, Rate Limits & Support

- **Authentication:** Internal platform consumers authenticate using Entra ID App Roles (`Telemetry.Read`, `Telemetry.Ingest`) issued under tenant policy `POL-GRID-API`.
- **Standard Rate Quota:** Up to 2,500 requests/minute per consumer client ID; request burst exemptions via the Cloud Platform intake portal.
- **Support Channel:** Raise non-urgent integration requests in `#grid-telemetry-support` or open an issue in this documentation repository.
