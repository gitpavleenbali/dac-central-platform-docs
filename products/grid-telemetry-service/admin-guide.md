# Grid Telemetry & Dispatch Service — Administrator & SRE Operations Guide

## Active Operational Posture

<!-- BEGIN DAC:admin-ops-posture source="gitpavleenbali/dac-workload-modernization@70ac7177abe6360d4f1b606913c840111c708fb7" irHash="e8147f08f46c" -->
- **Host Management & Administrative Access:** Workload runs as `systemd` unit `grid-telemetry.service` on Linux VM `vm-grid-telemetry-01` (`Standard_D4s_v5`). Direct public SSH is blocked; administrators connect through Azure Bastion `bas-grid-ops`.
- **Traffic & Availability Posture:** Layer-4 TCP distribution via `lb-grid-telemetry` (`Azure Standard Load Balancer`). OS patching requires coordinated maintenance windows.
- **Secrets & Identity Management:** VM System-Assigned Managed Identity retrieves runtime secrets from `kv-grid-telemetry` over Private Endpoint.
- **Database Tier:** PostgreSQL Flexible Server `psql-grid-telemetry` (`GP_Standard_D2ds_v5`) in `snet-data-pe`.
- **Observability:** Azure Monitor Linux Agent forwards syslog and VM performance counters to `law-grid-ops`.
<!-- END DAC:admin-ops-posture -->

## Day-2 Operational Runbook

<!-- BEGIN DAC:admin-day2-runbook source="gitpavleenbali/dac-workload-modernization@70ac7177abe6360d4f1b606913c840111c708fb7" irHash="e8147f08f46c" -->
```bash
# 1. Connect to Linux VM (vm-grid-telemetry-01) via Azure Bastion
VM_ID=$(az vm show -g rg-grid-telemetry-prod -n vm-grid-telemetry-01 --query id -o tsv)
az network bastion ssh --name bas-grid-ops --resource-group rg-grid-telemetry-prod --target-resource-id "$VM_ID" --auth-type AAD

# 2. Check systemd Service Health & Recent Journal Logs
sudo systemctl status grid-telemetry.service
sudo journalctl -u grid-telemetry.service -n 100 --no-pager

# 3. Restart Service After Configuration or OS Patching
sudo systemctl restart grid-telemetry.service && curl -fsS http://localhost:8080/healthz
```
<!-- END DAC:admin-day2-runbook -->

## Monitored Infrastructure Inventory

<!-- BEGIN DAC:admin-observability-table source="gitpavleenbali/dac-workload-modernization@70ac7177abe6360d4f1b606913c840111c708fb7" irHash="e8147f08f46c" -->
| Azure Resource Name | Architectural Type | Category | SKU / Sizing | Subnet / Scope | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `bas-grid-ops` | Azure Bastion | `security` | `Standard` | `AzureBastionSubnet` | Standard |
| `lb-grid-telemetry` | Azure Standard Load Balancer | `ingress` | `Standard` | `snet-vm-app` | Standard |
| `vm-grid-telemetry-01` | Azure Linux VM | `compute` | `Standard_D4s_v5` | `snet-vm-app` | System Managed Identity |
| `psql-grid-telemetry` | Azure Database for PostgreSQL | `data` | `GP_Standard_D2ds_v5` | `snet-data-pe` | PG v16, Private Endpoint |
| `kv-grid-telemetry` | Azure Key Vault | `security` | `standard` | `snet-data-pe` | Private Endpoint |
| `law-grid-ops` | Log Analytics Workspace | `observability` | `PerGB2018` | `rg-grid-telemetry-prod` | Standard |
<!-- END DAC:admin-observability-table -->

## Incident Escalation Matrix & Maintenance Windows

- **Primary On-Call Owner:** Grid Platform Operations (`@gitpavleenbali`) — PagerDuty schedule `PD-GRID-OPS-EU`.
- **Change Freeze Windows:** Grid settlement peak hours (07:00–09:00 CET and 17:00–20:00 CET) disallow disruptive database or network changes without VP Infrastructure sign-off.
- **RPO / RTO Policy:** Production telemetry store targets RPO <= 5 minutes and RTO <= 15 minutes.
