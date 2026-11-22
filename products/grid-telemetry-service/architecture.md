# Grid Telemetry & Dispatch Service — Architecture & Landing Zone Design

> **Centralized Platform Documentation** • Managed sections are synchronized from source IaC via Docs-as-Code PRs; Architectural Decision Records (ADRs) below remain human-curated by @gitpavleenbali.

This guide describes an intended design at the recorded [workload revision](./dac-provenance.json). Diagram paths are not proof of deployment, network reachability, or monitoring. The [workshop topology comparison](https://gitpavleenbali.github.io/dac-workload-modernization/#topology-comparison) separates the VM baseline from the proposed AKS design.

## Executive Topology Summary

<!-- BEGIN DAC:arch-executive-summary source="gitpavleenbali/dac-workload-modernization@9e573d092dd96a87c7ffd631218d41d0717e7261" irHash="e8147f08f46c" -->
| Architecture Dimension | Current State (Synced from Source IaC) |
| :--- | :--- |
| **Product / Service** | **Grid Telemetry & Dispatch Service** (`grid-telemetry-service`) |
| **Landing Zone** | `alz-energy-ops-prod` (`rg-grid-telemetry-prod` in `westeurope`) |
| **Compute Hosting Model** | **Azure Virtual Machines (IaaS)** |
| **Spoke VNet & Hub Peering** | `vnet-grid-prod` (10.40.0.0/16) peered to `vnet-hub-connectivity-eu` |
| **Ingress Entrypoint** | `lb-grid-telemetry` (Azure Standard Load Balancer, `Standard`) |
| **Stateful & Messaging Tier** | `psql-grid-telemetry` (GP_Standard_D2ds_v5) |
| **Source Provenance** | `gitpavleenbali/dac-workload-modernization@9e573d092dd96a87c7ffd631218d41d0717e7261` • IR Hash `e8147f08f46c` |
<!-- END DAC:arch-executive-summary -->

## Azure Landing Zone & Network Topology

<!-- BEGIN DAC:arch-topology-diagram source="gitpavleenbali/dac-workload-modernization@9e573d092dd96a87c7ffd631218d41d0717e7261" irHash="e8147f08f46c" -->
```mermaid
flowchart TB
  ext_clients(["External Consumers & Grid Sensors"])
  subgraph sg_hub["Hub Connectivity Landing Zone"]
    hub_vnet["Hub VNet & Central Firewall<br/>vnet-hub-connectivity-eu"]
  end
  subgraph sg_rg["Landing Zone: alz-energy-ops-prod (rg-grid-telemetry-prod - westeurope)"]
    subgraph sg_vnet["Spoke VNet: vnet-grid-prod (10.40.0.0/16)"]
      subgraph sg_snet_vm_app["Subnet: snet-vm-app (10.40.1.0/24 • NSG: nsg-vm-grid-app)"]
        load_balancer_ingress_lb["Azure Standard Load Balancer<br/>lb-grid-telemetry (Standard)"]
        vm_app_vm["Azure Linux VM<br/>vm-grid-telemetry-01 (Standard_D4s_v5)<br/>System Managed Identity"]
      end
      subgraph sg_AzureBastionSubnet["Subnet: AzureBastionSubnet (10.40.0.0/26)"]
        bastion_ops_bastion["Azure Bastion<br/>bas-grid-ops (Standard)"]
      end
      subgraph sg_snet_data_pe["Subnet: snet-data-pe (10.40.2.0/24)"]
        postgresql_db[("Azure Database for PostgreSQL<br/>psql-grid-telemetry (GP_Standard_D2ds_v5)<br/>PG v16 • Private Endpoint")]
        key_vault_kv["Azure Key Vault<br/>kv-grid-telemetry (standard)<br/>Private Endpoint"]
      end
    end
    subgraph sg_platform["Control Plane, Identity & Observability"]
      log_analytics_law["Log Analytics Workspace<br/>law-grid-ops (PerGB2018)"]
    end
  end
  vm_app_vm -.->|"VNet Peering / Egress"| hub_vnet
  vm_app_vm -->|"Private Link"| postgresql_db
  vm_app_vm -.->|"Private Link + RBAC: Key Vault Secrets User"| key_vault_kv
  ext_clients -->|"HTTPS (443)"| load_balancer_ingress_lb
  load_balancer_ingress_lb -->|"Backend Pool (8080)"| vm_app_vm
  bastion_ops_bastion -->|"Admin SSH (22)"| vm_app_vm
  vm_app_vm -.->|"Azure Monitor Agent (VM Insights)"| log_analytics_law
  classDef compute fill:#e8f4fd,stroke:#0078d4,stroke-width:2px,color:#0f172a;
  classDef ingress fill:#eef2ff,stroke:#4f46e5,stroke-width:2px,color:#0f172a;
  classDef containers fill:#f0fdf4,stroke:#15803d,stroke-width:2px,color:#0f172a;
  classDef data fill:#fffbeb,stroke:#d97706,stroke-width:2px,color:#0f172a;
  classDef messaging fill:#fdf4ff,stroke:#a21caf,stroke-width:2px,color:#0f172a;
  classDef security fill:#fef2f2,stroke:#dc2626,stroke-width:1.5px,color:#0f172a;
  classDef observability fill:#f1f5f9,stroke:#475569,stroke-width:1.5px,color:#0f172a;
  class bastion_ops_bastion security;
  class load_balancer_ingress_lb ingress;
  class vm_app_vm compute;
  class postgresql_db data;
  class key_vault_kv security;
  class log_analytics_law observability;
```
<!-- END DAC:arch-topology-diagram -->

## Runtime Traffic & Delivery Architecture

<!-- BEGIN DAC:arch-runtime-diagram source="gitpavleenbali/dac-workload-modernization@9e573d092dd96a87c7ffd631218d41d0717e7261" irHash="e8147f08f46c" -->
```mermaid
flowchart LR
  subgraph sg_cicd["Engineering & CI/CD Delivery"]
    dev_commit["Git PR / Commit<br/>Node Bundle + systemd + IaC"]
    ci_build["CI Pipeline<br/>Artifact Tarball & cloud-init"]
    dev_commit --> ci_build
  end
  subgraph sg_runtime["Production Runtime Execution"]
    api_caller(["API Consumers"])
    rt_ingress["lb-grid-telemetry"]
    rt_compute["VM systemd: grid-telemetry<br/>vm-grid-telemetry-01 (Standard_D4s_v5)"]
    api_caller -->|"TCP 443"| rt_ingress -->|"Port 8080"| rt_compute
    ci_build -.->|"VM Extension / SSH Deploy"| rt_compute
    rt_db[("psql-grid-telemetry<br/>GP_Standard_D2ds_v5")]
    rt_compute -->|"Private Link :5432"| rt_db
    rt_kv["kv-grid-telemetry<br/>Key Vault"]
    rt_compute -.->|"System MI IMDS"| rt_kv
  end
```
<!-- END DAC:arch-runtime-diagram -->

## Virtual Network & Subnet Allocation

<!-- BEGIN DAC:arch-network-table source="gitpavleenbali/dac-workload-modernization@9e573d092dd96a87c7ffd631218d41d0717e7261" irHash="e8147f08f46c" -->
| Subnet Name | CIDR Prefix | Attached NSG | Service Delegation | Hosted / Connected Resources |
| :--- | :--- | :--- | :--- | :--- |
| `snet-vm-app` | `10.40.1.0/24` | `nsg-vm-grid-app` | `None` | `lb-grid-telemetry`, `vm-grid-telemetry-01` |
| `AzureBastionSubnet` | `10.40.0.0/26` | `Platform Default` | `None` | `bas-grid-ops` |
| `snet-data-pe` | `10.40.2.0/24` | `Platform Default` | `None` | `psql-grid-telemetry`, `kv-grid-telemetry` |
<!-- END DAC:arch-network-table -->

## Azure Resource & SKU Inventory

<!-- BEGIN DAC:arch-resource-inventory source="gitpavleenbali/dac-workload-modernization@9e573d092dd96a87c7ffd631218d41d0717e7261" irHash="e8147f08f46c" -->
| Azure Resource Name | Architectural Type | Category | SKU / Sizing | Subnet / Scope | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `bas-grid-ops` | Azure Bastion | `security` | `Standard` | `AzureBastionSubnet` | Standard |
| `lb-grid-telemetry` | Azure Standard Load Balancer | `ingress` | `Standard` | `snet-vm-app` | Standard |
| `vm-grid-telemetry-01` | Azure Linux VM | `compute` | `Standard_D4s_v5` | `snet-vm-app` | System Managed Identity |
| `psql-grid-telemetry` | Azure Database for PostgreSQL | `data` | `GP_Standard_D2ds_v5` | `snet-data-pe` | PG v16, Private Endpoint |
| `kv-grid-telemetry` | Azure Key Vault | `security` | `standard` | `snet-data-pe` | Private Endpoint |
| `law-grid-ops` | Log Analytics Workspace | `observability` | `PerGB2018` | `rg-grid-telemetry-prod` | Standard |
<!-- END DAC:arch-resource-inventory -->

## Identity, RBAC & Private Connectivity Matrix

<!-- BEGIN DAC:arch-security-rbac source="gitpavleenbali/dac-workload-modernization@9e573d092dd96a87c7ffd631218d41d0717e7261" irHash="e8147f08f46c" -->
| Source Principal / Origin | Target Resource | Access Type | Mechanism / Protocol |
| :--- | :--- | :--- | :--- |
| `vm-grid-telemetry-01` | `psql-grid-telemetry` | Private Link | `TLS/TCP` |
| `vm-grid-telemetry-01` | `kv-grid-telemetry` | Private Link | `TLS/TCP` |
| `vm-grid-telemetry-01` | `kv-grid-telemetry` | RBAC: Key Vault Secrets User | `Entra ID MI` |
| `External API Consumers` | `lb-grid-telemetry` | HTTPS (443) | `HTTPS` |
| `lb-grid-telemetry` | `vm-grid-telemetry-01` | Backend Pool (8080) | `HTTP/TLS` |
| `bas-grid-ops` | `vm-grid-telemetry-01` | Admin SSH (22) | `SSH` |
| `vm-grid-telemetry-01` | `law-grid-ops` | Azure Monitor Agent (VM Insights) | `HTTPS` |
<!-- END DAC:arch-security-rbac -->

## Architectural Decision Records (ADRs) & Design Rationale

### ADR-001: Hub-and-Spoke Network Isolation & Private Endpoints
All stateful data stores (`psql-grid-telemetry`) and secret vaults (`kv-grid-telemetry`) must disallow public network ingress and bind exclusively to `snet-data-pe` via Azure Private Link, with egress inspected through the central Hub Firewall.

### ADR-002: Compute Hosting Posture
The baseline deployment originated on regional Linux Virtual Machines to accelerate initial SCADA/grid sensor migration from on-premises hypervisors. Platform engineering tracks compute density and patching toil quarterly to evaluate containerization.
