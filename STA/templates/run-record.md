# Compact Run Record — {{task_name}}

**Framework / kernel:** {{exact_versions}}  
**Status:** `RECEIVED | ... | COMPLETED | PARTIALLY_COMPLETED | BLOCKED | FAILED`  
**Prepared by:** {{actor}}  
**Date:** {{date}}  
**Snapshot / target:** {{identity}}

Use this compact contract for `MICRO` and bounded `STANDARD` work. Expand only
the fields material to the task. A compact record cannot bypass a required
gate; use the full artifacts when the budget, audit, or handoff requires them.

## 1. Task capsule

- **Outcome:** {{desired_result}}
- **Why:** {{purpose}}
- **Definition of Done:** {{observable_success}}
- **Work type / domain / state:** {{classification}}
- **Authorized intervention:** {{mode}}
- **In scope:** {{scope}}
- **Out of scope:** {{exclusions}}

## 2. Risk and budget

- **Impact:** {{assessment}}
- **Reversibility:** {{assessment}}
- **Uncertainty:** {{assessment}}
- **Scope:** {{assessment}}
- **Sensitivity:** {{assessment}}
- **Recovery cost:** {{assessment}}
- **Budget:** `MICRO | STANDARD | DEEP | CRITICAL`
- **Reason:** {{qualitative_rationale}}

If `DEEP` or `CRITICAL`, stop using the compact-only form and create the full
artifacts.

## 3. Context readiness

| Layer | `OPEN / CONTROLLED / READY / INVALIDATED` | Key evidence or gap |
|---|---|---|
| Intention | {{state}} | {{evidence}} |
| Contract | {{state}} | {{evidence}} |
| Operation | {{state}} | {{evidence}} |
| Domain | {{state}} | {{evidence}} |
| Human | {{state}} | {{evidence}} |
| History | {{state}} | {{evidence}} |

## 4. Critical claims and contradictions

| Claim | State | Source and authority | Validity | Effect |
|---|---|---|---|---|
| {{claim}} | `UNKNOWN / PARTIAL / PROVISIONAL / VERIFIED / CONFLICTED / NOT_APPLICABLE` | {{source}} | {{boundary}} | {{decision}} |

**Material contradiction:** {{none_or_record_and_resolution}}

## 5. Decisions and gates

| Decision / gate | Level or state | Evidence / approval | Effect |
|---|---|---|---|
| {{decision}} | `LEVEL_1_AUTONOMOUS / LEVEL_2_RECOMMENDED / LEVEL_3_USER_RESERVED` | {{basis}} | {{effect}} |
| Understanding | `NOT_REQUIRED / SATISFIED_BY_EVIDENCE / APPROVED / PENDING / REJECTED / INVALIDATED` | {{basis}} | {{effect}} |
| Plan | {{state}} | {{basis}} | {{effect}} |
| Permission / risk | {{state}} | {{basis}} | {{effect}} |

## 6. Compact plan

| Action | Reason | Output | Verification | Stop / replan condition | Dependency |
|---|---|---|---|---|---|
| {{action}} | {{reason}} | {{output}} | {{check}} | {{condition}} | {{dependency}} |

## 7. Capability ledger

- **Platform / provider / adapter:** {{identity_or_none}}
- **Selected:** {{capability_and_reason}}
- **Rejected or blocked:** {{capability_and_reason_or_none}}
- **Permissions:** {{minimum_permissions}}
- **Actual utility / failure:** {{observed_result}}

## 8. Actual verification

| Claim checked | Method | Actual result | Status |
|---|---|---|---|
| {{claim}} | `{{method}}` | {{actual_result}} | `PASS / FAIL / BLOCKED / NOT_RUN` |

## 9. Closure

- **Final status:** `COMPLETED / PARTIALLY_COMPLETED / BLOCKED / FAILED`
- **Reason:** {{intent_contract_evidence_convergence}}
- **Deviation or residual risk:** {{none_or_details}}
- **Relevant pending item:** {{none_or_item}}
- **Learning candidate:** {{none_or_evidence_bounded_candidate}}
- **Core or shared library modified during runtime:** `No`

