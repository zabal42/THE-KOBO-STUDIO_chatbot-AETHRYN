# Context Brief — {{task_name}}

**Status:** `DRAFT | AWAITING_CONFIRMATION | CONFIRMED | INVALIDATED`  
**Framework / kernel:** {{exact_versions}}  
**Prepared by:** {{actor}}  
**Date:** {{date}}  
**Target snapshot:** {{target_identity}}  
**Budget:** `DEEP | CRITICAL`

## 1. Task capsule

- **Outcome:** {{desired_result}}
- **Why:** {{purpose_and_value}}
- **Definition of Done:** {{observable_success}}
- **Work type / domain / state:** {{classification}}
- **Authorized intervention:** {{mode}}
- **In scope:** {{scope}}
- **Out of scope:** {{exclusions}}

## 2. Risk and preparation

| Dimension | Assessment | Evidence | Effect on budget or controls |
|---|---|---|---|
| Impact | {{assessment}} | {{evidence}} | {{effect}} |
| Reversibility | {{assessment}} | {{evidence}} | {{effect}} |
| Uncertainty | {{assessment}} | {{evidence}} | {{effect}} |
| Scope | {{assessment}} | {{evidence}} | {{effect}} |
| Sensitivity | {{assessment}} | {{evidence}} | {{effect}} |
| Recovery cost | {{assessment}} | {{evidence}} | {{effect}} |

**Selected budget and reason:** {{budget_rationale}}

## 3. Artifact inventory

Record only what was actually available and inspected.

| Artifact | Identity / location | Inspected? | Relevant evidence | Validity |
|---|---|---:|---|---|
| {{artifact}} | {{identity}} | Yes / No | {{finding}} | {{boundary}} |

## 4. Six-layer context map

| Layer | Readiness | Critical evidence or decision | Remaining gap | Blocking? |
|---|---|---|---|---:|
| Intention | `OPEN / CONTROLLED / READY / INVALIDATED` | {{evidence}} | {{gap}} | Yes / No |
| Contract | {{state}} | {{evidence}} | {{gap}} | Yes / No |
| Operation | {{state}} | {{evidence}} | {{gap}} | Yes / No |
| Domain | {{state}} | {{evidence}} | {{gap}} | Yes / No |
| Human | {{state}} | {{evidence}} | {{gap}} | Yes / No |
| History | {{state}} | {{evidence}} | {{gap}} | Yes / No |

## 5. Critical claim ledger

| Claim | State | Source | Authority | Validity | Affected decision |
|---|---|---|---|---|---|
| {{claim}} | `UNKNOWN / PARTIAL / PROVISIONAL / VERIFIED / CONFLICTED / NOT_APPLICABLE` | {{source}} | {{authority}} | {{boundary}} | {{decision}} |

## 6. Questions and decisions

Include only questions that inspection could not answer better.

| # | Material uncertainty | Why user authority was needed | Answer / decision | Level | Impact |
|---:|---|---|---|---|---|
| 1 | {{uncertainty}} | {{reason}} | {{answer}} | `LEVEL_2_RECOMMENDED / LEVEL_3_USER_RESERVED` | {{impact}} |

## 7. Confirmed understanding

Summarize intent, contract, current reality, architecture/domain, human
boundaries, history, scope, risks, and success evidence in language the
responsible user can verify.

{{understanding}}

## 8. Gap and contradiction control

| Type | Gap or conflict | Evidence | Impact | Owner | State | Resolution / boundary |
|---|---|---|---|---|---|---|
| Unknown / Contradiction / Missing dependency / Ambiguity / Risk / Debt / Hidden assumption | {{item}} | {{evidence}} | {{impact}} | {{owner}} | `IDENTIFIED / INVESTIGATING / CONTROLLED / RESOLVED / ACCEPTANCE_REQUIRED / ACCEPTED / BLOCKING` | {{resolution}} |

## 9. Gate result

- [ ] Relevant evidence was inspected before asking answerable questions.
- [ ] Every context layer is `READY`, validly `CONTROLLED`, or evidence-based
      `NOT_APPLICABLE` at claim level.
- [ ] Material contradictions are visible and controlled or resolved.
- [ ] Scope, authority, permissions, and Definition of Done are explicit.
- [ ] Budget and verification independence are justified.
- [ ] The responsible user confirmed the understanding.

**Gate state:** `PENDING | APPROVED | REJECTED | INVALIDATED`  
**Confirmation evidence:** {{reference}}  
**Confirmed at:** {{date_or_pending}}

Do not finalize a `DEEP` or `CRITICAL` plan while this gate is pending or
invalidated.

