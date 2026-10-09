# Implementation Plan — {{task_name}}

**Status:** `DRAFT | AWAITING_APPROVAL | APPROVED | INVALIDATED`  
**Context brief:** {{reference}}  
**Framework / kernel:** {{exact_versions}}  
**Prepared by:** {{actor}}  
**Date:** {{date}}

## 1. Outcome and boundaries

- **Outcome:** {{result}}
- **In scope:** {{scope}}
- **Out of scope:** {{exclusions}}
- **Constraints and sources:** {{constraints}}
- **Authorized intervention and permissions:** {{mode_and_permissions}}

## 2. Architecture

{{components_responsibilities_interfaces_and_decisions}}

## 3. Implementation order

{{why_this_order_controls_dependencies_risk_and_reversibility}}

## 4. Tasks

Repeat for every independently verifiable task.

### Task {{n}} — {{title}}

- **Objective:** {{what}}
- **Reason:** {{why}}
- **Expected output:** {{observable_output}}
- **Files / systems:** {{affected_targets}}
- **Verification:** `{{command_or_method}}` → {{expected_result}}
- **Stop or replan condition:** {{material_trigger}}
- **Dependencies:** {{dependencies_or_none}}
- **Risks and controls:** {{risk_and_control}}
- **Decision level:** `LEVEL_1_AUTONOMOUS / LEVEL_2_RECOMMENDED / LEVEL_3_USER_RESERVED`

## 5. Testing and validation

| Requirement / risk | Method | Expected evidence | Independence level |
|---|---|---|---|
| {{claim}} | `{{method}}` | {{evidence}} | Internal / Actual checks / Cross-verification / Independent evaluation |

## 6. Capability and permission plan

| Need | Capability / adapter | Why selected | Permissions | Cost / risk | Validation |
|---|---|---|---|---|---|
| {{need}} | {{capability}} | {{reason}} | {{permissions}} | {{cost_risk}} | {{check}} |

## 7. Alternatives and trade-offs

| Approach | Advantages | Costs / risks | Decision and authority |
|---|---|---|---|
| {{approach}} | {{advantages}} | {{costs}} | Chosen / Rejected / Deferred — {{authority}} |

## 8. Failure recovery and rollback

- **Likely failure modes:** {{failures}}
- **Diagnostic evidence:** {{evidence}}
- **Substitution or degradation path:** {{path}}
- **Operational rollback:** {{rollback}}
- **Escalation trigger:** {{trigger}}

## 9. Complexity and preparation budget

- **Budget:** `DEEP | CRITICAL`
- **Complexity:** Low / Medium / High
- **Drivers:** {{drivers}}
- **Budget-change trigger:** {{trigger}}

Complexity is not an elapsed-time promise.

## 10. Approval gate

- [ ] Plan matches the confirmed context brief and Definition of Done.
- [ ] Every task has objective, reason, output, verification, stop condition,
      and dependencies.
- [ ] Material decisions have the correct authority level.
- [ ] Required permissions and risk acceptance are explicit.
- [ ] Tests, project validation, recovery, and rollback are covered.
- [ ] No blocking gap is hidden inside a task.
- [ ] The responsible user approved the plan.

**Gate state:** `PENDING | APPROVED | REJECTED | INVALIDATED`  
**Approval evidence:** {{reference}}  
**Approved at:** {{date_or_pending}}

Do not modify or act externally while a required plan gate is pending or
invalidated.

