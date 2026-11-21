# Enterprise Platform Documentation Hub (`dac-central-platform-docs`)

Centralized, governed Docs-as-Code repository for Cloud & Landing Zone workloads. Each product folder under [`products/`](./products/) maintains four audience-tailored guides synchronized from application and Infrastructure-as-Code (IaC) repositories across **GitHub** and **Azure DevOps**:

1. **`architecture.md`** — Landing Zone network topology & runtime Mermaid diagrams, subnet CIDR matrix, Azure SKU inventory, RBAC/Private Link flows, and human-authored **Architectural Decision Records (ADRs)**.
2. **`admin-guide.md`** — Day-2 SRE & operations runbooks, access procedures, observability, and incident escalation windows.
3. **`user-guide.md`** — Service consumer integration overview, gateway entrypoint, SLOs, and OpenAPI endpoint catalog.
4. **`contributor-guide.md`** — Engineering build/release pipeline flow, IaC/manifest contracts, and review standards.

## Active Service & Landing Zone Catalog

<!-- BEGIN DAC:catalog-index source="gitpavleenbali/dac-workload-modernization@70ac7177abe6360d4f1b606913c840111c708fb7" irHash="e8147f08f46c" -->
| Product / Service | Landing Zone | Active Hosting Model | Region | Owner | Source Provenance | Guides |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Grid Telemetry & Dispatch Service** | `alz-energy-ops-prod` | **Azure Virtual Machines (IaaS)** | `westeurope` | `@gitpavleenbali` | `gitpavleenbali/dac-workload-modernization@70ac717` (`e8147f08`) | [Architecture](./products/grid-telemetry-service/architecture.md) · [Admin](./products/grid-telemetry-service/admin-guide.md) · [User](./products/grid-telemetry-service/user-guide.md) · [Contributor](./products/grid-telemetry-service/contributor-guide.md) |
<!-- END DAC:catalog-index -->

## Governance & Non-Destructive Sync Model

- **Machine-Managed Facts (`<!-- BEGIN DAC:... -->`):** Resource inventories, Mermaid topology diagrams, subnet CIDRs, RBAC matrices, and operational CLI commands are updated via automated Pull Requests whenever source IaC or deployment manifests change.
- **Human-Curated Sections:** Business context, ADRs, maintenance freeze policies, and escalation contacts live outside managed markers and are **preserved byte-for-byte** by deterministic sync gates.
- **Automated Quality Gate ([`validate-docs.yml`](./.github/workflows/validate-docs.yml)):** Every PR validates Mermaid diagram syntax, relative Markdown links, balanced managed-block tags, and `dac-provenance.json` commit traceability before `CODEOWNERS` merge to `main`.
