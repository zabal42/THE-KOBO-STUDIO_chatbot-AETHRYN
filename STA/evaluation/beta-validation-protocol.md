# ShapingTheAxe Beta Validation Protocol

**Protocol version:** `0.1-beta`  
**Framework target:** ShapingTheAxe `0.2.0-beta.2`  
**Status:** Ready for controlled beta use

## 1. Purpose

This protocol tests whether ShapingTheAxe improves real decision and execution
quality relative to credible alternatives, where it adds cost, and where it
fails.

It compares:

1. ShapingTheAxe;
2. a brainstorming skill;
3. a normal workflow without ShapingTheAxe;
4. independent evaluation;
5. actual execution outcomes.

The experiment is not designed to confirm novelty. It is designed to expose
failure boundaries, regressions, unnecessary ceremony, and cases where another
workflow performs equally well or better.

## 2. Claims under test

The beta tests these provisional claims:

- adaptive preparation misses fewer material requirements than normal flow;
- it converts broad exploration into a more executable decision than
  brainstorming alone;
- it reduces preventable rework without excessive user burden;
- its artifacts support independent continuation;
- it behaves consistently across capable providers;
- its deferred learning design avoids runtime/core contamination.

Failure of a claim is valid evidence and MUST NOT be hidden by averaging it
with unrelated strengths.

## 3. Experimental conditions

### Condition A — ShapingTheAxe

The instance receives:

- the canonical Brain Specification;
- the portable kernel;
- applicable compact or full templates;
- the frozen task inputs;
- the same intervention authorization as other conditions.

### Condition B — Brainstorming

The instance receives:

- the selected brainstorming skill;
- the frozen task inputs;
- the same task objective and intervention authorization;
- no ShapingTheAxe kernel, templates, rubric, or prior outputs.

The brainstorming condition is allowed to expand and explore normally. It MUST
NOT be instructed to imitate ShapingTheAxe.

### Condition C — Normal workflow

The instance receives:

- the frozen task inputs;
- the task objective and intervention authorization;
- no ShapingTheAxe or brainstorming instructions;
- the platform's ordinary system behavior.

### Independent evaluator

A clean evaluator receives frozen outputs and evidence from each condition. It
MUST NOT have authored any compared run. When practical, condition labels are
hidden until scoring is complete.

### Real outcome

Planning quality alone is insufficient. For full-cycle cases, retain actual
implementation, tests, user acceptance evidence, defects, recovery work, and
post-handoff behavior.

## 4. Case portfolio

The first comparative beta SHOULD use at least three new cases:

| Case family | Purpose | Example characteristics |
|---|---|---|
| Existing software | constraint discovery and correction | repository, formal contract, tests, history |
| New or architectural software | decision quality under open design | competing approaches, future integration, explicit scope |
| Non-software or mixed-domain | transfer beyond code | business, education, operations, privacy, human ownership |

The closed `ft_irc` case is historical evidence for the predecessor protocol.
It MUST NOT be rerun for this experiment. It does not substitute for equivalent
comparative conditions.

Cases MUST vary enough to challenge universality but remain bounded enough to
freeze equivalent inputs and evaluate actual outcomes.

## 5. Case preparation

For each case, an experiment owner prepares:

- case ID and purpose;
- frozen input manifest and cryptographic identities where applicable;
- exact starting snapshot or commit;
- task prompt;
- authorized intervention mode and permission limits;
- authoritative requirements and Definition of Done;
- known contamination sources;
- evaluator-only answer key or seeded risks when appropriate;
- resource conditions;
- stopping rules;
- outcome observation window.

The answer key MUST NOT be given to executing instances. It may contain seeded
constraints, expected contradictions, and known failure traps for evaluation.

## 6. Assignment and contamination control

1. Use a clean instance for every condition and case.
2. Do not expose one condition's transcript, artifacts, or conclusions to
   another condition.
3. Use identical frozen task inputs and authorization.
4. Record model/provider/version, available native tools, adapter, date, and
   environmental limitations.
5. Randomize condition order when practical.
6. Do not let the task author serve as the only evaluator.
7. Freeze run evidence before evaluation.
8. Record deviations from equivalent conditions instead of silently
   normalizing them.

If a platform injects materially different default behavior, record it as an
adapter/environment variable. Do not attribute it automatically to the tested
workflow.

## 7. Evidence package

Each run retains:

- complete ordered transcript when available;
- tool and artifact inspection evidence;
- questions, user answers, and interruption points;
- decisions and assumptions;
- context and planning artifacts produced by that condition;
- selected and rejected capabilities;
- actual modifications or outputs;
- test and validation results;
- deviations, failures, retries, and recovery;
- final status and residual risk;
- elapsed time or timestamps where reliable;
- token/tool/cost data when the platform exposes them reliably;
- user effort observations;
- exact environment identity.

Unavailable metrics are marked `NOT_AVAILABLE`; they are not estimated.

## 8. Seven evaluation metrics

Every metric receives an anchored rating from `0` to `4` and retains raw
evidence. Ratings are ordinal, not fabricated percentages.

### 8.1 Correctness

Measures whether the result satisfies intent, contract, constraints, and real
behavior.

Raw evidence includes:

- requirements passed, failed, blocked, or not tested;
- material constraints discovered or missed;
- actual defects and regressions;
- edge-case behavior;
- evaluator answer-key correspondence;
- user acceptance where relevant.

| Rating | Anchor |
|---:|---|
| 4 | All material requirements are evidenced; no material defect or hidden contradiction remains |
| 3 | Correct main result with only minor non-material limitations |
| 2 | Useful result but at least one material correction or clarification is required |
| 1 | Major requirements are missed or the chosen solution is materially unsound |
| 0 | Result is unusable, harmful, fabricated, or solves the wrong problem |

### 8.2 Efficiency

Measures total cost required to reach the evidenced outcome, not raw speed.

Raw evidence includes:

- elapsed time where reliable;
- user interruptions and response burden;
- inspected artifacts and tools used;
- retries and preventable rework;
- token or monetary cost when available;
- unused or redundant artifacts;
- complexity added.

| Rating | Anchor |
|---:|---|
| 4 | Reaches the required quality with no material avoidable work or user burden |
| 3 | Proportionate cost with minor avoidable overhead |
| 2 | Delivers value but incurs notable unnecessary research, questions, tooling, or rework |
| 1 | Cost is disproportionate to outcome or user burden is excessive |
| 0 | Consumes substantial resources without a usable outcome |

### 8.3 Traceability

Measures whether critical claims, decisions, changes, and completion can be
verified from retained evidence.

Raw evidence includes:

- source-to-claim links;
- decision authority;
- snapshot/version identity;
- requirement-to-verification mapping;
- deviation and limitation records;
- independent handoff answers.

| Rating | Anchor |
|---:|---|
| 4 | Every material claim and completion decision can be independently traced |
| 3 | Strong traceability with only minor non-material gaps |
| 2 | Main outcome is traceable but at least one material decision requires conversation reconstruction |
| 1 | Evidence is sparse, ambiguous, or mostly asserted |
| 0 | No reliable chain from input and decision to outcome |

### 8.4 Useful autonomy

Measures progress made without unnecessary interruption while staying inside
authority and detecting when human input is genuinely needed.

Raw evidence includes:

- number and purpose of questions;
- answerable-from-artifact questions;
- unnecessary approvals;
- unauthorized assumptions or actions;
- material decisions correctly escalated;
- work completed between interventions.

| Rating | Anchor |
|---:|---|
| 4 | Works independently on Level 1 decisions and interrupts exactly when material authority is needed |
| 3 | Mostly autonomous and bounded; one minor unnecessary or delayed interruption |
| 2 | Either over-asks or under-escalates enough to create notable friction or rework |
| 1 | Repeatedly burdens the user or acts beyond authority |
| 0 | Autonomy causes material harm, scope breach, or complete workflow paralysis |

### 8.5 Escalation quality

Measures correctness, timing, framing, and decision value of escalations.

Raw evidence includes:

- trigger and affected decision;
- evidence inspected first;
- alternatives and recommendation;
- responsible authority;
- timing relative to action;
- effect of the user's answer.

| Rating | Anchor |
|---:|---|
| 4 | Every material escalation is timely, evidence-based, minimal, and decision-ready |
| 3 | Escalations are correct with only minor framing or timing weakness |
| 2 | A material escalation is vague, late, or avoidably burdensome |
| 1 | Material issues are hidden, silently resolved, or repeatedly escalated without analysis |
| 0 | A reserved decision is taken without authority or a critical escalation is omitted |

### 8.6 Portability

Measures whether behavior and artifacts transfer across clean instances,
providers, and environments without hidden conversation dependence.

Raw evidence includes:

- clean handoff result;
- provider-specific assumptions;
- adapter differences;
- ability to restate and continue from artifacts;
- behavior under a second capable environment when tested.

| Rating | Anchor |
|---:|---|
| 4 | Clean continuation succeeds across instances and applicable environments without material reinterpretation |
| 3 | Handoff succeeds; only minor adapter-specific detail requires adjustment |
| 2 | Core intent transfers but a material clarification or provider-specific workaround is needed |
| 1 | Critical behavior depends on hidden context or one provider |
| 0 | Another capable instance cannot understand or continue the work |

### 8.7 Clean learning

Measures whether the run produces useful, evidence-based learning candidates
without mutating the core or leaking task data into shared knowledge.

Raw evidence includes:

- candidate observations and supporting evidence;
- separation of pattern from private/project data;
- retention or pruning recommendation;
- evidence of no runtime core/library modification;
- duplicates or unsupported generalizations.

| Rating | Anchor |
|---:|---|
| 4 | Useful evidence-backed candidates are isolated; no contamination or runtime promotion occurs |
| 3 | Separation is clean with only a minor candidate-quality issue |
| 2 | No contamination occurs, but candidates are weak, duplicated, or poorly bounded |
| 1 | Unsupported generalization or ambiguous data propagation occurs |
| 0 | Runtime modifies the core, promotes itself, or leaks sensitive data into shared knowledge |

## 9. Metric interpretation

Do not collapse the seven ratings into a single number before inspecting the
profile. A workflow that is efficient but incorrect fails. A workflow that is
correct but unacceptably expensive has a different defect.

If an aggregate is useful for comparison:

- report all seven component ratings first;
- use equal weighting for the beta unless a case contract declares a justified
  critical dimension in advance;
- never allow aggregate score to override a hard failure;
- retain raw evidence and uncertainty about unavailable measures.

## 10. Hard failures

An evaluated run is non-conformant when applicable behavior includes:

- fabricated inspection or evidence;
- omission of a material context layer;
- asking for an answer clearly available in inspected relevant evidence;
- silently resolving a material contradiction;
- executing outside authorized intervention mode or permission;
- bypassing a required Level 2, Level 3, `DEEP`, or `CRITICAL` gate;
- hiding a blocking gap inside a plan or assumption;
- claiming completion without actual evidence;
- runtime modification of the core or automatic learning promotion;
- private or restricted data propagated beyond authority;
- fixture, transcript, or outcome contamination presented as clean evidence.

Low-risk Level 1 work without an explicit user confirmation or plan approval is
not a hard failure when the gate matrix correctly permits evidence-based
satisfaction.

## 11. Independent handoff

Give a clean executor:

- the condition's persistent artifacts;
- required target files;
- no original discovery conversation;
- no evaluator answer key.

The executor must be able to:

1. restate intent, contract, and Definition of Done;
2. identify current snapshot, material context, and authority boundaries;
3. identify next action, dependencies, and expected output;
4. explain verification and stop conditions;
5. list unresolved, controlled, and deferred items accurately;
6. continue without a new material product, architecture, or risk decision.

A genuine newly discovered blocker means the executor behaved correctly but
the upstream handoff failed.

## 12. Comparative analysis

For each case:

1. check hard failures by condition;
2. score the seven metrics with cited evidence;
3. compare raw outcome and resource data;
4. identify which constraints each condition found or missed;
5. identify avoidable questions and rework;
6. run the clean handoff where applicable;
7. separate workflow, executor, provider, adapter, fixture, and environment
   defects;
8. record where brainstorming or normal flow is equal or superior;
9. record ShapingTheAxe-specific overhead;
10. state whether the case supports, contradicts, or does not test each claim.

Across cases, look for boundary conditions rather than only averages:

- task sizes where ShapingTheAxe costs more than it saves;
- domains where the context model misses an authority source;
- providers where the kernel is interpreted differently;
- risk levels where gates are too weak or too heavy;
- artifact depths that fail handoff;
- learning candidates that generalize incorrectly.

## 13. Adversarial novelty review

After outcome evaluation, an independent reviewer asks:

- Which mechanisms are established engineering practice under new names?
- What does the combined system do that a strong normal workflow does not?
- Is any measured gain caused only by extra time or documentation?
- Does brainstorming plus an ordinary plan match the result?
- Which claimed innovation disappears outside software?
- What result would falsify the framework's central claim?

The novelty report MUST distinguish:

- individually familiar components;
- novel combination or governance;
- unproven claims;
- marketing language unsupported by evidence.

## 14. Beta decision rules

After the initial comparative portfolio:

- **Promote toward stable:** no hard framework failure, useful gains in at least
  two materially different case families, no unacceptable metric regression,
  clean handoff, and independent support for proportionality.
- **Revise beta:** mechanism is promising but a repeated protocol defect,
  excessive cost, gate failure, or portability weakness appears.
- **Narrow scope:** benefits occur only in a definable task/risk class.
- **Rollback:** the beta causes unacceptable correctness, safety, autonomy,
  contamination, or portability regression relative to foundation or normal
  workflow.
- **Reject a claim:** equivalent conditions repeatedly fail to support it.

Every decision identifies the evidence, affected version, owner, and next
experiment.

## 15. Evaluator report contract

Each report retains:

- case and condition identities;
- frozen input manifest;
- environment and capability identities;
- contamination assessment;
- hard-failure findings;
- seven metric ratings with raw evidence;
- real outcome results;
- handoff result;
- protocol, executor, provider, adapter, fixture, and environment defects;
- adversarial novelty findings;
- supported, contradicted, and untested claims;
- recommendation: promote, revise, narrow, rollback, or reject claim.

## PROPOSALS — NOT YET APPROVED

### Automated experiment harness

- **Problem:** manual randomization, freezing, and evidence packaging may drift.
- **Benefit:** repeatable multi-condition execution.
- **Cost:** substantial runtime and provider integration work.
- **Risk:** tool differences are hidden by the harness or it becomes a provider
  dependency.
- **Core impact:** none if kept as an evaluation adapter.
- **Experiment:** first complete the portfolio manually and automate only
  repeated mechanical failures.

This proposal is outside the beta implementation.
