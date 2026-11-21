# Enterprise Platform Documentation Hub (`dac-central-platform-docs`)

This GitHub docs hub shows how one workload's infrastructure and deployment changes reach its central documentation. The demo compares declared VM hosting with an AKS proposal, not a live Azure deployment. Each product folder under [`products/`](./products/) has four guides:

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

- **Machine-Managed Facts (`<!-- BEGIN DAC:... -->`):** The DAC Translator puts diagrams, inventories, and operational references in a GitHub pull request on a requested sync or an opted-in workload PR.
- **Human-Curated Sections:** Business context, ADRs, maintenance freeze policies, and escalation contacts live outside managed markers and are **preserved byte-for-byte** by deterministic sync gates.
- **Automated Quality Gate ([`validate-docs.yml`](./.github/workflows/validate-docs.yml)):** Checks Mermaid structure, relative Markdown links, managed-block markers, and provenance fields. A maintainer still reviews and merges; `CODEOWNERS` identifies the reviewers.

## GitHub demo

1. **Option 1 — DAC Translator.** Compare the [VM baseline](./products/grid-telemetry-service/architecture.md#azure-landing-zone--network-topology) with [central docs PR #1](https://github.com/gitpavleenbali/dac-central-platform-docs/pull/1/files), generated from the [source VM-to-AKS migration](https://github.com/gitpavleenbali/dac-workload-modernization/pull/1/files). The existing ADRs and policies stay as written.
2. **Option 2 — Copilot in CI.** When the workload run requests agentic review, the synchronized central PR runs the quality gate first. A [reusable Agentic Workflow](./.github/workflows/dac-agentic-review.md) then uses the validated source commit and cluster name to draft a short migration note for the existing architecture page. The run summary shows the proposal; the `dac-central-architecture-proposal-*` artifact contains the checked Markdown patch. It doesn't change the PR branch, Mermaid, or existing ADRs.
3. **Option 2 — Copilot Cloud Agent on demand.** Open [issue #2](https://github.com/gitpavleenbali/dac-central-platform-docs/issues/2) and [its draft PR](https://github.com/gitpavleenbali/dac-central-platform-docs/pull/3/files). To start a fresh session, ask Copilot using the `dac-central-curator` profile and base `main`. This agent proposes a standalone ADR, not a rewrite of the rolling docs PR.

Copilot in CI requires `COPILOT_GITHUB_TOKEN` in both personal repositories. This [fine-grained inference credential](https://github.github.com/gh-aw/reference/auth/#copilot_github_token) is separate from the workload's central PR publishing credential. When changing the workflow, recompile it with `gh aw compile dac-agentic-review` using `gh-aw` v1.2.2 and update the pinned revision in the workload caller.
