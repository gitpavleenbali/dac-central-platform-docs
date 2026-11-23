# Grid Telemetry & Dispatch Service — Administrator & SRE Operations Guide

These commands are reference procedures for the declared architecture, not workshop steps to run against a live service. The [workshop comparison](https://gitpavleenbali.github.io/dac-workload-modernization/#file-comparison) shows how the example changes from checking the VM service with `systemctl` to checking Kubernetes with `kubectl`.

## Active Operational Posture

<!-- BEGIN DAC:admin-ops-posture source="gitpavleenbali/dac-workload-modernization@c710df3ba7f7faacfcbbacf47fdcb6852238c969" irHash="9d0955415321" -->
- **Control Plane & Cluster Access:** Private AKS cluster `aks-grid-telemetry-prod` (K8s 1.32, Workload Identity, Private Cluster, azure (overlay)). Direct SSH and Azure Bastion are **decommissioned**; administrators authenticate exclusively with Microsoft Entra ID RBAC.
- **Workload Scaling & Node Pools:** System pool plus dedicated workload node pool `workload` (`Standard_D16ds_v5`, Cluster Autoscaler 4-20 nodes) paired with Kubernetes `4 (HPA 4-24 pods)`.
- **Secrets & Identity Management:** Pod-level OIDC Workload Identity mounts secrets from `kv-grid-telemetry` via the Azure Key Vault CSI Driver—zero static credentials on nodes.
- **Stateful & Messaging Resilience:** PostgreSQL `psql-grid-telemetry` (`GP_Standard_D4ds_v5`, HA: ZoneRedundant), Azure Managed Redis `redis-grid-hotstate` (`Premium`), and Service Bus `sb-grid-telemetry` (`Premium`) isolated over Private Link.
- **Observability:** Container logs, Prometheus scrape metrics, and control-plane diagnostics stream to Log Analytics `law-grid-ops`.
<!-- END DAC:admin-ops-posture -->

## Day-2 Operational Runbook

<!-- BEGIN DAC:admin-day2-runbook source="gitpavleenbali/dac-workload-modernization@c710df3ba7f7faacfcbbacf47fdcb6852238c969" irHash="9d0955415321" -->
```bash
# 1. Authenticate to Private AKS Cluster via Entra ID
az aks get-credentials --resource-group rg-grid-telemetry-prod --name aks-grid-telemetry-prod --overwrite-existing
kubelogin convert-kubeconfig -l azurecli

# 2. Inspect Pod Health, HPA Scaling & Ingress
kubectl get pods,svc,ingress,hpa -n grid-telemetry -o wide
kubectl rollout status deployment/grid-telemetry-api -n grid-telemetry

# 3. Check Key Vault CSI Mounted Secrets & Workload Identity Token
kubectl get secretproviderclass -n grid-telemetry

# 4. Inspect Azure Service Bus (sb-grid-telemetry) Queue & Dead-Letter Depth
az servicebus queue show --resource-group rg-grid-telemetry-prod --namespace-name sb-grid-telemetry --name telemetry-events --query countDetails

# 5. Inspect Azure Managed Redis (redis-grid-hotstate) TLS & Cluster Health
az redis show --resource-group rg-grid-telemetry-prod --name redis-grid-hotstate --query "{provisioningState:provisioningState,sku:sku.name,tls:minimumTlsVersion}"
```
<!-- END DAC:admin-day2-runbook -->

## Monitored Infrastructure Inventory

<!-- BEGIN DAC:admin-observability-table source="gitpavleenbali/dac-workload-modernization@c710df3ba7f7faacfcbbacf47fdcb6852238c969" irHash="9d0955415321" -->
| Azure Resource Name | Architectural Type | Category | SKU / Sizing | Subnet / Scope | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `agw-grid-waf` | Azure Application Gateway (WAF v2) | `ingress` | `WAF_v2` | `snet-ingress-waf` | TLS / Layer-7 Ingress |
| `acrgridtelemetryprod` | Azure Container Registry (ACR) | `containers` | `Premium` | `snet-data-pe` | Private Endpoint |
| `id-grid-telemetry-workload` | User-Assigned Managed Identity | `security` | `Standard` | `rg-grid-telemetry-prod` | Standard |
| `aks-grid-telemetry-prod` | Azure Kubernetes Service (AKS) | `compute` | `Standard (Standard_D4ds_v5)` | `snet-aks-nodes` | K8s 1.32, Workload Identity, Private Cluster, azure (overlay) |
| `workload` | AKS Workload Node Pool | `compute` | `Standard_D16ds_v5` | `snet-aks-nodes` | Autoscale 4-20 |
| `sb-grid-telemetry` | Azure Service Bus | `messaging` | `Premium` | `snet-data-pe` | 2 Messaging Units, Private Endpoint |
| `redis-grid-hotstate` | Azure Managed Redis | `data` | `Premium` | `snet-data-pe` | TLS 1.2, ZoneRedundant, Private Endpoint |
| `psql-grid-telemetry` | Azure Database for PostgreSQL | `data` | `GP_Standard_D4ds_v5` | `snet-data-pe` | PG v16, HA: ZoneRedundant, Private Endpoint |
| `kv-grid-telemetry` | Azure Key Vault | `security` | `standard` | `snet-data-pe` | Private Endpoint |
| `law-grid-ops` | Log Analytics Workspace | `observability` | `PerGB2018` | `rg-grid-telemetry-prod` | Standard |
<!-- END DAC:admin-observability-table -->

## Incident Escalation Matrix & Maintenance Windows

- **Primary On-Call Owner:** Grid Platform Operations (`@gitpavleenbali`) — PagerDuty schedule `PD-GRID-OPS-EU`.
- **Change Freeze Windows:** Grid settlement peak hours (07:00–09:00 CET and 17:00–20:00 CET) disallow disruptive database or network changes without VP Infrastructure sign-off.
- **RPO / RTO Policy:** Production telemetry store targets RPO <= 5 minutes and RTO <= 15 minutes.
