# ADR-003: Propose moving Grid Telemetry from VM to AKS

- **Status:** Proposed
- **Decision owner:** Grid Platform Operations / service owner

## Context

The workload modernization change proposes replacing a Linux VM running the Grid Telemetry service under `systemd` with an AKS-hosted container. The central documentation change updates the example operational checks from VM and `systemd` commands to Kubernetes commands.

This is a fictional workload demo. The pull requests describe repository changes only; they do not establish that Azure resources were deployed, that a cutover occurred, or that the proposal was approved.

## Evidence and declared changes

- [Workload modernization PR #1](https://github.com/gitpavleenbali/dac-workload-modernization/pull/1/files) removes the workload VM declaration and `systemd` unit, and adds AKS, Azure Container Registry (ACR), and Kubernetes workload manifests.
- [Central documentation PR #1](https://github.com/gitpavleenbali/dac-central-platform-docs/pull/1/files) changes the administrator guide's example operational checks from VM/`systemd` operations to Kubernetes operations.

These are statements about the contents of the proposed repository changes, not evidence of running infrastructure.

## Potential benefits and trade-offs to validate

The following are hypotheses, not established reasons for the change or measured outcomes:

- **Potential benefits:** container packaging and Kubernetes deployment primitives may make releases more repeatable; Kubernetes health checks and rollout controls may improve deployment operations; cluster scheduling may offer more flexible scaling than a single VM.
- **Potential trade-offs:** AKS may add cluster and node-pool cost and operational complexity; container image, registry, cluster, and Kubernetes access require new lifecycle and support practices; troubleshooting and rollback may be more involved than restarting a `systemd` service.

The service owner and platform team should validate these against workload requirements and measured cost, reliability, and operational needs before deciding.

## Questions requiring owner answers

### Cutover

- What is the approved migration sequence, and what readiness, health, and service-level criteria must pass before shifting production traffic?
- How will traffic be shifted and observed, and what is the acceptable interruption or coexistence period?
- What data, queued messages, credentials, DNS, and dependent integrations need migration or coordination?
- Who authorizes the cutover, and what change window and communications are required?

### Rollback

- What conditions trigger rollback, who has authority to initiate it, and how quickly must service be restored?
- Will the VM and its deployment artifacts remain available during a rollback window, and for how long?
- How will traffic and any state written during AKS operation be reconciled if service returns to the VM?
- Which last-known-good container image and infrastructure revision will be retained, and how will rollback be exercised before cutover?

### Approval

- Has the service owner approved the hosting change and its operational ownership, support model, and cost?
- Have security, platform, and service owners reviewed the AKS/ACR access model and the cutover and rollback plans?

## Proposal

Keep this change **Proposed** until the owner answers the questions above and records an explicit approval. No deployment, cutover, or successful rollback is asserted by this ADR.
