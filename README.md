# Enterprise Platform Documentation Hub (`dac-central-platform-docs`)

This repository contains the shared catalog and audience guides for the Grid Telemetry example. The default branch documents the virtual machine (VM) baseline. The proposed move to Azure Kubernetes Service (AKS) is in [central docs PR #1](https://github.com/gitpavleenbali/dac-central-platform-docs/pull/1/files), not a live Azure deployment.

**[Open the interactive Doc as Code workshop](https://gitpavleenbali.github.io/dac-workload-modernization/#why).** It includes two comics, presentation-ready slides, zoomable diagrams, and [before/after guides](https://gitpavleenbali.github.io/dac-workload-modernization/#file-comparison). The [Evidence & Links tour](https://gitpavleenbali.github.io/dac-workload-modernization/#evidence-tour) connects the examples to the public GitHub records.

## Documented service and landing zone catalog

The catalog reflects source declarations at the revision shown. It is not a live inventory.

<!-- BEGIN DAC:catalog-index source="gitpavleenbali/dac-workload-modernization@9e573d092dd96a87c7ffd631218d41d0717e7261" irHash="e8147f08f46c" -->
| Product / Service | Landing Zone | Declared Hosting Model | Region | Owner | Source Provenance | Guides |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Grid Telemetry & Dispatch Service** | `alz-energy-ops-prod` | **Azure Virtual Machines (IaaS)** | `westeurope` | `@gitpavleenbali` | `gitpavleenbali/dac-workload-modernization@9e573d0` (`e8147f08`) | [Architecture](./products/grid-telemetry-service/architecture.md) · [Admin](./products/grid-telemetry-service/admin-guide.md) · [User](./products/grid-telemetry-service/user-guide.md) · [Contributor](./products/grid-telemetry-service/contributor-guide.md) |
<!-- END DAC:catalog-index -->

## What changes and who reviews it

The [workload repository](https://github.com/gitpavleenbali/dac-workload-modernization) owns the source and its local docs. It uses the same portable Node.js translator whether the checkout comes from GitHub, Azure DevOps, or Bitbucket. This example verifies the GitHub publishing and hosted agent paths; other providers need their own pipeline and publishing integration.

The authorized GitHub sync updates the existing catalog and four guides in a rolling pull request. Generated content lives between `BEGIN DAC` and `END DAC` markers. Owners maintain decisions, maintenance policies, and escalation instructions outside those sections. The [central quality gate](./.github/workflows/validate-docs.yml) checks Mermaid, Markdown links, markers, and source provenance. Reviewers still decide whether to merge.

| Path | What reaches this repository | Evidence |
| --- | --- | --- |
| **1 · Deterministic translator** | Proposed updates to the existing architecture, operator, consumer, and contributor guides, plus the catalog and the source receipt. No AI is required. | [Workload PR #1](https://github.com/gitpavleenbali/dac-workload-modernization/pull/1/files) → [central docs PR #1](https://github.com/gitpavleenbali/dac-central-platform-docs/pull/1/files). [Workload sync](https://github.com/gitpavleenbali/dac-workload-modernization/actions/runs/44972624473) and [central check](https://github.com/gitpavleenbali/dac-central-platform-docs/actions/runs/44972674206). |
| **2A · Spec-driven local Copilot** | No direct central edit. Copilot follows the spec, runs the translator, and leaves file changes for local review. | [Local spec](https://github.com/gitpavleenbali/dac-workload-modernization/blob/main/specs/doc-as-code/refresh-workload-docs.md) and [recorded workshop example](https://gitpavleenbali.github.io/dac-workload-modernization/#option-two-local). |
| **2B · Copilot in GitHub Actions** | A verified, unapplied review patch. The deterministic sync and central checks still run separately from the agent's proposed text. | [Workload run](https://github.com/gitpavleenbali/dac-workload-modernization/actions/runs/44971666753), [central run](https://github.com/gitpavleenbali/dac-central-platform-docs/actions/runs/44972101526), and [inline patches](https://gitpavleenbali.github.io/dac-workload-modernization/#agentic-ci). |
| **2C · Cloud agent on demand** | A separate draft decision record. It neither updates the rolling sync nor regenerates a diagram. | [Issue #2](https://github.com/gitpavleenbali/dac-central-platform-docs/issues/2) → [draft PR #3](https://github.com/gitpavleenbali/dac-central-platform-docs/pull/3/files) and its [validation](https://github.com/gitpavleenbali/dac-central-platform-docs/actions/runs/44890039831). |

Option 2B uses GitHub OpenID Connect (OIDC) for Azure AI Foundry inference without a static inference token or API key. The GitHub publisher uses separate scoped repository access. The [agentic workflow](./.github/workflows/dac-agentic-review.md) and [proposal verifier](./scripts/verify-agent-proposal.mjs) define what the agent may propose. A change to the workflow source requires recompiling its lock file with `gh aw compile dac-agentic-review --validate` and reviewing the pinned caller revision in the workload repository.
