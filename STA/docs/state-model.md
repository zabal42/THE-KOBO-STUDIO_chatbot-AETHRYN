# State Model

**Applies to:** ShapingTheAxe `0.2.0-beta.2`  
**Authority:** Derived from `SHAPING_THE_AXE_BRAIN_SPEC.md`  
**Purpose:** Define unambiguous states, guards, and transitions without
requiring an executable state engine.

## 1. State-model rules

1. Different objects use different state machines. A claim state is not an
   execution state, and a capability scope is not its operational status.
2. A transition MUST retain its trigger, responsible actor, affected evidence,
   and time or sequence position when material.
3. A required guard cannot be bypassed by renaming the state.
4. A state MAY move backward when new evidence invalidates readiness.
5. Terminal execution status does not make every claim `VERIFIED`.
6. State transitions are recorded proportionately: compact for `MICRO`, full
   for `DEEP` and `CRITICAL`.

## 2. Execution lifecycle

### 2.1 States

| State | Meaning | Exit guard |
|---|---|---|
| `RECEIVED` | Task exists but scope and authority are not classified | Task capsule captured |
| `CLASSIFIED` | Work type, domain, state, intervention mode, initial risk, and budget are recorded | Research targets identified |
| `INSPECTING` | Relevant evidence is being collected | Relevant sources reach current sufficiency or a blocking access gap is known |
| `DISCOVERING` | Gaps, contradictions, and material questions are being resolved | Material gaps are resolved, controlled, accepted, or blocking |
| `UNDERSTANDING_READY` | Grounded understanding exists | Required understanding gate satisfied or correctly not required |
| `PLANNING` | Executable and verifiable path is being produced | Plan meets budget-specific contract |
| `PLAN_READY` | Plan is complete for the current budget | Required plan gate satisfied or correctly not required |
| `READY_TO_EXECUTE` | Context, authority, risk controls, permissions, and plan permit action | Execution begins inside authorized mode |
| `EXECUTING` | Approved or autonomous Level 1 work is in progress | Planned output produced, material deviation detected, or failure blocks progress |
| `VERIFYING` | Actual results are compared with requirements and risk controls | Required verification evidence exists or a limitation is established |
| `CLOSING` | Final status, residual risk, handoff, and learning candidates are recorded | Closure contract satisfied |
| `PAUSED` | Progress is intentionally suspended pending a material event or decision | Pause reason resolved or converted to blocker |
| `BLOCKED` | Required progress cannot continue under current authority or environment | Terminal, or a new run/reopen event is authorized |
| `FAILED` | Execution or verification failed and no acceptable bounded result is delivered | Terminal, or explicit recovery creates a new run/reopen event |
| `PARTIALLY_COMPLETED` | A useful bounded subset is verified; required remainder is explicit | Terminal |
| `COMPLETED` | Intent, contract, and evidence converge | Terminal |

### 2.2 Primary transitions

```text
RECEIVED
  → CLASSIFIED
  → INSPECTING
  → DISCOVERING
  → UNDERSTANDING_READY
  → PLANNING
  → PLAN_READY
  → READY_TO_EXECUTE
  → EXECUTING
  → VERIFYING
  → CLOSING
  → COMPLETED | PARTIALLY_COMPLETED | BLOCKED | FAILED
```

`UNDERSTANDING_READY` and `PLAN_READY` do not imply a human interruption. They
mean the applicable gate was evaluated and satisfied. For low-risk Level 1
work, the evidence record itself may satisfy the gate.

### 2.3 Return transitions

| From | To | Trigger |
|---|---|---|
| Any active state | `CLASSIFIED` | Work type, intervention mode, or task identity materially changed |
| `DISCOVERING` or later | `INSPECTING` | New source is needed to resolve a material claim |
| `UNDERSTANDING_READY` or later | `DISCOVERING` | New material unknown or contradiction |
| `PLAN_READY` or later | `PLANNING` | Reversible strategy detail changes materially but intent remains stable |
| `READY_TO_EXECUTE` or `EXECUTING` | `PAUSED` | Required user decision, permission, sensitive access, or risk acceptance |
| `EXECUTING` | `VERIFYING` | Planned outputs produced |
| `VERIFYING` | `EXECUTING` | Verification finds a bounded defect covered by the approved plan |
| `VERIFYING` | `DISCOVERING` | Failure reveals a new material assumption or architecture question |
| `PAUSED` | Previous active state | Pause condition resolved without changing the contract |

### 2.4 Terminal selection

| Status | Required condition |
|---|---|
| `COMPLETED` | Every required success claim has actual evidence; residual items are explicitly non-blocking |
| `PARTIALLY_COMPLETED` | A useful subset is verified, but part of the approved Definition of Done is unmet |
| `BLOCKED` | A required dependency, permission, decision, or environment prevents continuation; no execution failure is misrepresented |
| `FAILED` | Attempted execution or verification failed and the Definition of Done was not met |

## 3. Knowledge claims

### 3.1 States

| State | Meaning | Permitted use |
|---|---|---|
| `UNKNOWN` | No sufficient answer is available | Cannot justify a decision |
| `PARTIAL` | Some relevant evidence exists but material coverage is incomplete | May guide research; cannot close a critical claim |
| `PROVISIONAL` | Supported inference or temporary answer with an explicit validity boundary | May support bounded, reversible progress if non-blocking |
| `VERIFIED` | Grounded in current authoritative evidence or explicit responsible decision | May justify decisions within its validity boundary |
| `CONFLICTED` | Relevant sources disagree materially | Cannot justify affected readiness until controlled or resolved |
| `NOT_APPLICABLE` | Claim does not apply, with an evidence-based reason | Excluded from closure calculation |

### 3.2 Transitions

```text
UNKNOWN → PARTIAL → PROVISIONAL → VERIFIED
UNKNOWN | PARTIAL | PROVISIONAL | VERIFIED → CONFLICTED
CONFLICTED → PARTIAL | PROVISIONAL | VERIFIED
ANY NON-CONFLICTED STATE → NOT_APPLICABLE
VERIFIED → PARTIAL | UNKNOWN
```

The final transition represents invalidation: a source changed, expired, lost
authority, or no longer applies to the current snapshot. Invalidation MUST name
the affected decisions and context layers.

## 4. Context-layer readiness

Context layers use derived readiness, not a competing claim taxonomy.

| Readiness | Meaning |
|---|---|
| `OPEN` | At least one material required claim is `UNKNOWN`, `PARTIAL`, or uncontrolled `CONFLICTED` |
| `CONTROLLED` | Remaining non-verified claims are explicitly bounded and cannot materially change the current decision |
| `READY` | All material required claims are `VERIFIED` or validly `NOT_APPLICABLE` |
| `INVALIDATED` | Previously usable layer was affected by changed evidence and requires reassessment |

`CONTROLLED` may support execution only when risk, decision level, and the
claim's validity boundary allow it.

## 5. Gaps and contradictions

### 5.1 States

- `IDENTIFIED`
- `INVESTIGATING`
- `CONTROLLED`
- `RESOLVED`
- `ACCEPTANCE_REQUIRED`
- `ACCEPTED`
- `BLOCKING`

### 5.2 Transition rules

```text
IDENTIFIED → INVESTIGATING
IDENTIFIED | INVESTIGATING → CONTROLLED | RESOLVED | ACCEPTANCE_REQUIRED | BLOCKING
ACCEPTANCE_REQUIRED → ACCEPTED | INVESTIGATING | BLOCKING
CONTROLLED → INVESTIGATING | RESOLVED | BLOCKING
```

A material contradiction MUST NOT transition directly to `ACCEPTED` without
recording the responsible authority and the consequences. `CONTROLLED` means
the affected work is bounded so the gap cannot silently contaminate it; it does
not mean the contradiction disappeared.

## 6. Risk

### 6.1 Run-level assessment states

- `UNASSESSED`
- `ASSESSED`
- `CONTROLS_REQUIRED`
- `CONTROLLED`
- `ACCEPTANCE_REQUIRED`
- `ACCEPTED`
- `REALIZED`
- `CLOSED`

### 6.2 Transitions

```text
UNASSESSED → ASSESSED
ASSESSED → CONTROLLED | CONTROLS_REQUIRED | ACCEPTANCE_REQUIRED
CONTROLS_REQUIRED → CONTROLLED | ACCEPTANCE_REQUIRED | REALIZED
ACCEPTANCE_REQUIRED → ACCEPTED | CONTROLS_REQUIRED
CONTROLLED | ACCEPTED → REALIZED | CLOSED
REALIZED → CONTROLS_REQUIRED | ACCEPTANCE_REQUIRED | CLOSED
```

Risk acceptance is Level 3 and requires the responsible user or authority. A
risk that remains `ACCEPTANCE_REQUIRED` may transition the execution to
`BLOCKED`; `BLOCKED` is an execution state, not a risk state. A
risk may be `CLOSED` because it was eliminated, the exposure ended, or the
run closed with its residual state explicitly recorded.

## 7. Preparation budget

### 7.1 States

- `UNSET`
- `MICRO`
- `STANDARD`
- `DEEP`
- `CRITICAL`

### 7.2 Selection anchors

| Budget | Anchors |
|---|---|
| `MICRO` | low impact, local, reversible, known contract, cheap recovery, no sensitive expansion |
| `STANDARD` | bounded ordinary work, moderate dependencies, normal tests can establish correctness |
| `DEEP` | material architecture or handoff, broad scope, significant uncertainty, important external constraints |
| `CRITICAL` | severe impact, hard reversibility, restricted data, production, legal/safety exposure, explicit risk acceptance |

### 7.3 Transitions

Any budget MAY move to another after reassessment. A transition record MUST
contain:

- new evidence;
- changed risk dimension;
- old and new budget;
- changed gates, artifacts, verification, and permissions.

Downgrading the budget cannot retroactively remove evidence or approval already
required by a material event.

## 8. Decision authority and gates

### 8.1 Decision levels

- `LEVEL_1_AUTONOMOUS`
- `LEVEL_2_RECOMMENDED`
- `LEVEL_3_USER_RESERVED`

### 8.2 Gate states

- `NOT_REQUIRED`
- `PENDING`
- `SATISFIED_BY_EVIDENCE`
- `APPROVED`
- `REJECTED`
- `INVALIDATED`

### 8.3 Gate matrix

| Condition | Understanding gate | Plan gate | Execution/risk gate |
|---|---|---|---|
| `MICRO`, Level 1, clear intent | Evidence may satisfy | Compact internal plan | Existing authorization |
| `STANDARD`, Level 1, clear intent | Evidence may satisfy | Internal executable plan | Existing authorization |
| Any Level 2 decision | Explicit confirmation | Explicit approval when it affects action | Approval for selected consequence |
| Any Level 3 decision | Explicit confirmation | Explicit approval | Responsible user authority |
| `DEEP` | Explicit confirmation | Explicit approval | Explicit permission for material actions |
| `CRITICAL` | Explicit confirmation | Explicit approval | Explicit authority, risk acceptance, and independent evaluation |

An approved gate becomes `INVALIDATED` if the underlying intent, contract,
architecture, material risk, or permission changes.

## 9. Capabilities

### 9.1 Selection state

- `DISCOVERED`
- `CONSIDERED`
- `SELECTED`
- `REJECTED`
- `BLOCKED`
- `USED`
- `FAILED`
- `REPLACED`

Selection follows `DISCOVER → REUSE → COMPOSE → SYNTHESIZE`. A capability can
be `REJECTED` because it is unnecessary, unsuitable, too costly, too risky, or
not permitted.

### 9.2 Governance scope

```text
EPHEMERAL → PROJECT → SHARED → CORE_CANDIDATE → CORE
```

Backward transitions are allowed for degradation or containment. Promotion
guards are defined in the Brain Specification.

### 9.3 Operational status

```text
CANDIDATE → ACTIVE → DORMANT → DEPRECATED → ARCHIVED
```

`DORMANT` may return to `ACTIVE` after validation. `DEPRECATED` may remain
available for rollback but SHOULD NOT be selected for new work. `ARCHIVED` is
not runtime-selectable.

## 10. Learning

### 10.1 States

- `OBSERVED`
- `CANDIDATE`
- `EVALUATING`
- `RETAINED_PROJECT`
- `PROPOSED_SHARED`
- `RETAINED_SHARED`
- `DEFERRED`
- `REJECTED`
- `PRUNED`

### 10.2 Transitions

```text
OBSERVED → CANDIDATE
CANDIDATE → EVALUATING | DEFERRED | REJECTED
EVALUATING → RETAINED_PROJECT | PROPOSED_SHARED | DEFERRED | REJECTED
PROPOSED_SHARED → RETAINED_SHARED | RETAINED_PROJECT | REJECTED
RETAINED_PROJECT | RETAINED_SHARED → PRUNED
```

The runtime may transition only `OBSERVED → CANDIDATE`. Every later transition
belongs to the post-close evolution plane.

## 11. Versions

### 11.1 States

- `DRAFT`
- `CANDIDATE`
- `VALIDATING`
- `STABLE`
- `DEPRECATED`
- `ARCHIVED`

### 11.2 Transitions

```text
DRAFT → CANDIDATE → VALIDATING → STABLE
CANDIDATE | VALIDATING → DRAFT | ARCHIVED
STABLE → DEPRECATED → ARCHIVED
DEPRECATED → STABLE
```

The last transition is operational rollback. Analytical rollback is an event
that compares two exact configurations and identifies a regression; it does
not require changing version state.

A stable version requires applicable reference cases, no unacceptable
regression, independent evaluation, provider independence, and a rollback
path.

## 12. Artifact depth

Artifact output uses:

- `COMPACT`: one run record containing the task capsule, key claims, plan,
  verification, and closure;
- `FULL`: separate context brief, implementation plan, and completion report;
- `FULL_WITH_HANDOFF`: full artifacts plus frozen inputs, version identity,
  independent prompt/rubric, and evidence manifest.

Default mapping:

| Budget | Default artifact depth |
|---|---|
| `MICRO` | `COMPACT` |
| `STANDARD` | `COMPACT` or `FULL` according to handoff and risk |
| `DEEP` | `FULL` |
| `CRITICAL` | `FULL_WITH_HANDOFF` |

The mapping may increase when a collaborator, audit, regulated decision, or
independent evaluation requires stronger traceability.

## 13. Closure depth

- `LIGHT`: outcome, verification, relevant pending item.
- `STANDARD`: outcome, evidence, deviations, residual risks, capabilities.
- `COMPLETE`: reproducible evidence, decisions, deviations, residual risks,
  exact versions, learning candidates, and handoff.

Closure depth does not change the truth conditions for terminal status. A light
report cannot call a partial result complete.

## 14. Artifact contract states

Artifact states describe the validity of a persistent contract, not the whole
execution.

### Context brief

```text
DRAFT → AWAITING_CONFIRMATION → CONFIRMED
CONFIRMED → INVALIDATED
INVALIDATED → DRAFT
```

### Implementation plan

```text
DRAFT → AWAITING_APPROVAL → APPROVED
APPROVED → INVALIDATED
INVALIDATED → DRAFT
```

A brief or plan is invalidated when its governing intent, contract,
architecture, material risk, permission, or snapshot changes. A corrected
artifact returns to `DRAFT`; it does not silently reuse prior confirmation.

The completion report uses the execution's four terminal statuses rather than
a separate artifact lifecycle.

## 15. Verification-check states

Individual checks use:

- `PASS`: actual evidence satisfies the checked claim;
- `FAIL`: actual evidence contradicts or does not satisfy the claim;
- `BLOCKED`: the check cannot run because a named dependency or permission is
  unavailable;
- `NOT_RUN`: the check was not executed, with an explicit reason.

`NOT_RUN` is never equivalent to `PASS`. A blocked check may force execution
status `BLOCKED` or `PARTIALLY_COMPLETED` depending on whether the unchecked
claim is required by the Definition of Done.

## 16. Translation synchronization states

- `DRAFT`: translation is incomplete or not yet semantically reviewed;
- `CURRENT`: translation was compared with its declared canonical source
  version and no material mismatch remains;
- `STALE`: canonical source changed or a material mismatch was found.

```text
DRAFT → CURRENT
CURRENT → STALE
STALE → DRAFT → CURRENT
```

Translation state never changes normative authority: the declared English
source remains canonical.
