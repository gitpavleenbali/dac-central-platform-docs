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

## GitHub demo & Interactive Workshop

- **Interactive Workshop Presentation (GitHub Pages):** [`https://gitpavleenbali.github.io/dac-workload-modernization/`](https://gitpavleenbali.github.io/dac-workload-modernization/) — Full interactive slide-by-slide **Why → What → How** walkthrough, 3D translator map, before/after diagrams and guides, **Facilitator mode** (120-minute run of show), and guided evidence tour.

1. **Option 1 — Deterministic DAC Translator (`0` LLM calls):** Compare the [VM baseline](./products/grid-telemetry-service/architecture.md#azure-landing-zone--network-topology) with [Central Docs PR #1](https://github.com/gitpavleenbali/dac-central-platform-docs/pull/1/files), synchronized from [Workload PR #1 (`VM → AKS`)](https://github.com/gitpavleenbali/dac-workload-modernization/pull/1/files). Existing human ADRs and maintenance policies remain preserved byte-for-byte.
2. **Option 2A — Spec-Driven Local Copilot (`.github/` specs, skill, prompt & custom agent):** In [`dac-workload-modernization`](https://github.com/gitpavleenbali/dac-workload-modernization), developers run `@dac-architecture-guardian` or `/refresh-workload-docs` against [`specs/doc-as-code/refresh-workload-docs.md`](https://github.com/gitpavleenbali/dac-workload-modernization/blob/main/specs/doc-as-code/refresh-workload-docs.md) to refresh and verify local diagrams and Markdown before pushing.
3. **Option 2B — Automated Copilot in CI (`gh-aw` + Keyless Azure OIDC):** When the workload workflow opts into agentic review, the synchronized Central Docs PR runs [`validate-docs.yml`](./.github/workflows/validate-docs.yml) first, then calls the compiled [GitHub Agentic Workflow](./.github/workflows/dac-agentic-review.md) (`gh-aw` v1.2.2) using **keyless GitHub OIDC** (`id-token: write`, zero static PATs or API keys). Copilot reads bounded verified facts and submits one migration note and one cutover/rollback reviewer question via `safeoutputs`; [`verify-agent-proposal.mjs`](./scripts/verify-agent-proposal.mjs) builds a checked `dac-central-architecture-proposal-*` patch artifact without modifying the PR branch, Mermaid blocks, or owner ADRs.
4. **Option 2C — On-Demand GitHub Copilot Cloud Agent (`dac-central-curator`):** Open [Issue #2](https://github.com/gitpavleenbali/dac-central-platform-docs/issues/2) and [Draft PR #3](https://github.com/gitpavleenbali/dac-central-platform-docs/pull/3/files) ([Cloud Agent run](https://github.com/gitpavleenbali/dac-central-platform-docs/actions/runs/44889944409), [green validation gate](https://github.com/gitpavleenbali/dac-central-platform-docs/actions/runs/44890039831)). Using [`.github/agents/dac-central-curator.agent.md`](./.github/agents/dac-central-curator.agent.md), the Cloud Agent proposes standalone `ADR-003` in its own draft PR without touching the rolling deterministic sync PR.

When modifying [`dac-agentic-review.md`](./.github/workflows/dac-agentic-review.md), recompile `.lock.yml` with `gh aw compile dac-agentic-review --validate` (`gh-aw` v1.2.2) and update the pinned commit SHA in `dac-workload-modernization/.github/workflows/dac-translator-sync.yml`.
