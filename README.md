# Enterprise Platform Documentation Hub (`dac-central-platform-docs`)

This repository contains the shared catalog and guides for the Grid Telemetry example. The default branch documents the application hosted on Azure virtual machines (VMs). [Central docs PR #1](https://github.com/gitpavleenbali/dac-central-platform-docs/pull/1/files) shows how the existing guides change when the team proposes running the same application in containers on Azure Kubernetes Service (AKS). The pull request documents a proposal, not a live deployment.

**[Open the interactive Doc as Code workshop](https://gitpavleenbali.github.io/dac-workload-modernization/).** The [workload-to-platform overview](https://gitpavleenbali.github.io/dac-workload-modernization/#cross-team-flow) shows how one change reaches two review teams. The Why, What, and [How](https://gitpavleenbali.github.io/dac-workload-modernization/#how-story) comics lead into zoomable diagrams, [before/after guides](https://gitpavleenbali.github.io/dac-workload-modernization/#file-comparison), and a short [slide on commit IDs and architecture hashes](https://gitpavleenbali.github.io/dac-workload-modernization/#fingerprints). The [Evidence & Links tour](https://gitpavleenbali.github.io/dac-workload-modernization/#evidence-tour) points to the GitHub records.

## Documented service and landing zone catalog

The catalog reflects source declarations at the revision shown. It is not a live inventory.

<!-- BEGIN DAC:catalog-index source="gitpavleenbali/dac-workload-modernization@c710df3ba7f7faacfcbbacf47fdcb6852238c969" irHash="9d0955415321" -->
| Product / Service | Landing Zone | Declared Hosting Model | Region | Owner | Source Provenance | Guides |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Grid Telemetry & Dispatch Service** | `alz-energy-ops-prod` | **Azure Kubernetes Service (Cloud-Native Containers)** | `westeurope` | `@gitpavleenbali` | `gitpavleenbali/dac-workload-modernization@c710df3` (`9d095541`) | [Architecture](./products/grid-telemetry-service/architecture.md) · [Admin](./products/grid-telemetry-service/admin-guide.md) · [User](./products/grid-telemetry-service/user-guide.md) · [Contributor](./products/grid-telemetry-service/contributor-guide.md) |
<!-- END DAC:catalog-index -->

## What changes and who reviews it

The [workload repository](https://github.com/gitpavleenbali/dac-workload-modernization) owns the source and its local docs. It uses the same portable Node.js translator whether the checkout comes from GitHub, Azure DevOps, or Bitbucket. This example verifies the GitHub publishing and hosted agent paths; other providers need their own pipeline and publishing integration.

The authorized GitHub sync updates the existing catalog and four guides in a rolling pull request. Generated content lives between `BEGIN DAC` and `END DAC` markers. Owners maintain decisions, maintenance policies, and escalation instructions outside those sections. The [central quality gate](./.github/workflows/validate-docs.yml) checks Mermaid, Markdown links, markers, and source provenance. Reviewers still decide whether to merge.

| Path | What reaches this repository | Evidence |
| --- | --- | --- |
| **1 · Deterministic translator** | Proposed updates to the existing architecture, operator, consumer, and contributor guides, plus the catalog and the source receipt. No AI is required. | [Workload PR #1](https://github.com/gitpavleenbali/dac-workload-modernization/pull/1/files) → [central docs PR #1](https://github.com/gitpavleenbali/dac-central-platform-docs/pull/1/files). [Workload sync](https://github.com/gitpavleenbali/dac-workload-modernization/actions/runs/44972624473) and [central check](https://github.com/gitpavleenbali/dac-central-platform-docs/actions/runs/44972674206). |
| **2A · Spec-driven local Copilot** | No direct central edit. Copilot follows the spec, runs the translator, and leaves file changes for local review. | [Local spec](https://github.com/gitpavleenbali/dac-workload-modernization/blob/main/specs/doc-as-code/refresh-workload-docs.md) and [recorded workshop example](https://gitpavleenbali.github.io/dac-workload-modernization/#option-two-local). |
| **2B · GitHub cloud agentic delivery** | Two GitHub-hosted paths: Agentic Workflows attach verified, unapplied architecture-review patches; a Copilot Cloud Agent session creates one proposed ADR in a separate draft PR. Generated diagrams and synchronized guides remain owned by Option 1. | [Workload Agentic Workflow run](https://github.com/gitpavleenbali/dac-workload-modernization/actions/runs/44971666753) → [central run](https://github.com/gitpavleenbali/dac-central-platform-docs/actions/runs/44972101526); [Cloud Agent issue #2](https://github.com/gitpavleenbali/dac-central-platform-docs/issues/2) → [draft PR #3](https://github.com/gitpavleenbali/dac-central-platform-docs/pull/3/files) → [validation](https://github.com/gitpavleenbali/dac-central-platform-docs/actions/runs/44890039831). |

The Option 2B Agentic Workflow path uses GitHub OpenID Connect (OIDC) for Azure AI Foundry inference without a static inference token or API key. The [agentic workflow](./.github/workflows/dac-agentic-review.md) and [proposal verifier](./scripts/verify-agent-proposal.mjs) define the bounded safe output. A change to the workflow source requires recompiling its lock file with `gh aw compile dac-agentic-review --validate` and reviewing the pinned caller revision in the workload repository. The Option 2B Cloud Agent path is a separate on-demand repository session governed by [`dac-central-curator`](./.github/agents/dac-central-curator.agent.md); it creates only ADR-003 in a draft PR.
