# Completion Report — {{task_name}}

**Final status:** `COMPLETED | PARTIALLY_COMPLETED | BLOCKED | FAILED`  
**Approved plan:** {{reference}}  
**Framework / kernel:** {{exact_versions}}  
**Prepared by:** {{actor}}  
**Date:** {{date}}

## 1. Outcome

{{concise_evidence_based_result}}

## 2. Delivered changes

| Change | Files / systems | Planned? | Actual result |
|---|---|---:|---|
| {{change}} | {{targets}} | Yes / No | {{result}} |

## 3. Requirements traceability

| Requirement / success criterion | Authority | Implementation | Actual verification | Status |
|---|---|---|---|---|
| {{requirement}} | {{source}} | {{change}} | {{evidence}} | `PASS / FAIL / BLOCKED / NOT_RUN` |

## 4. Verification evidence

Record actual results, not intended commands.

| Check | Method | Actual result | Status |
|---|---|---|---|
| {{check}} | `{{method}}` | {{result}} | `PASS / FAIL / BLOCKED / NOT_RUN` |

## 5. Deviations and state invalidations

| Deviation / new evidence | Affected claim, gate, or plan | Authority / resolution | Impact |
|---|---|---|---|
| {{item_or_none}} | {{affected_state}} | {{reference}} | {{impact}} |

## 6. Failure and recovery record

| Failure | Diagnosis | Retry hypothesis / substitute | Result | Scope degradation |
|---|---|---|---|---|
| {{failure_or_none}} | {{cause}} | {{action}} | {{result}} | {{degradation}} |

## 7. Edge cases, limitations, and residual risk

- **Covered:** {{edge_cases_and_evidence}}
- **Known limitation:** {{limitation_or_none}}
- **Residual risk:** {{risk_state_owner_and_acceptance_or_none}}
- **Ideal versus viable result:** {{difference_or_same}}

## 8. Capability usage ledger

| Platform / provider / adapter | Capability and version | Selected / rejected / blocked | Permissions | Actual utility / failure | Retention recommendation |
|---|---|---|---|---|---|
| {{identity}} | {{capability}} | {{decision}} | {{permissions}} | {{result}} | {{recommendation}} |

## 9. Remaining work and handoff

| Item | Blocking? | Owner | Next action | Required decision |
|---|---:|---|---|---|
| {{item_or_none}} | Yes / No | {{owner}} | {{action}} | {{decision_or_none}} |

## 10. Learning candidates

| Observation | Evidence | Scope | Private data removed? | Proposed post-close state |
|---|---|---|---:|---|
| {{candidate_or_none}} | {{evidence}} | Problem / Process / Capability / Decision / Project | Yes / No | `CANDIDATE / DEFERRED / REJECTED` |

Runtime MUST NOT promote these candidates or modify the core.

## 11. Final review

- [ ] Intent, contract, and actual evidence converge for the selected status.
- [ ] Required checks were executed or honestly marked otherwise.
- [ ] Scope, style, architecture, and permissions were respected.
- [ ] Deviations and invalidations are recorded with authority.
- [ ] Relevant edge cases and residual risks are explicit.
- [ ] Documentation and handoff are sufficient for the budget.
- [ ] Exact versions and snapshot are retained.
- [ ] No runtime core or shared-learning mutation occurred.

## 12. Final decision

- **Status:** `COMPLETED / PARTIALLY_COMPLETED / BLOCKED / FAILED`
- **Reason:** {{intent_contract_evidence_reason}}
- **Closure depth:** `LIGHT / STANDARD / COMPLETE`
- **Independent evaluation / handoff:** {{result_or_not_required}}
