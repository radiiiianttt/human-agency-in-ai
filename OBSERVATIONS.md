## Observations

The deterministic policy behaved consistently with predefined scenarios because those actions and their dimensions were already structured. All ten scenario-conformance tests passed.

Problems appeared when free-text requests were introduced through an LLM. For example, “Add bananas to my grocery list” was initially interpreted as a document action because the simulated system only supported documents and messages. This led to adding an explicit action ontology and capability layer so natural-language requests map to supported actions before the policy evaluates them.

The interface itself was also hiding the experiment: the policy decision and action dimensions were below the fold, while raw logs and workspace information competed for attention. The presentation was redesigned around:

**Request → Interpretation → Assessment → Policy → State → Result**

## Unexpected behavior

I initially assumed the main problem would be deciding when the AI should ask permission. Instead, an earlier problem appeared: before a policy can govern an action, the system needs a reliable way to represent what the user asked for and determine whether that capability actually exists.

## Policy failures

- **External impact is too coarse by itself.** “Send Alex that I’m five minutes late” and “Send my boss the draft” both affect another person, but relationship, content, commitment, and context can produce very different consequences.
- **The policy depends on a trustworthy assessment it does not create.** Policy v0 is deterministic after classification; it cannot detect a mistaken consequence or authorization estimate.
- **Prior permission can become stale or overbroad.** The prototype models one in-scope case but has no durable permission record, expiry, revocation, or conflict handling.
- **Reversibility can be falsely reassuring.** Restoring bytes does not reverse someone seeing a message, a team being disrupted, or newer work being overwritten.
- **A passing fixture can hide classification disagreement.** The ten scenario tests prove implementation conformance, not that people agree with the assigned dimensions or resulting behavior.

## Emerging insights

Agency is governed at two boundaries: first the system must represent and assess an action; then the policy decides whether to act, clarify, confirm, or offer recovery. A strong decision function cannot compensate for a weak action model.

## Questions for the next iteration

What information does an AI system need before it can safely decide whether to act, ask, clarify, or offer undo?

How should uncertainty in consequence and authorization be surfaced without turning every action into a permission prompt?

## Limitations

- Actions run only in an in-memory simulated world; no real messages, files, accounts, or calendars are changed.
- Preset scenarios use authored assessments, so they do not test natural-language classification accuracy.
- Free-text interpretation depends on an LLM and may misclassify intent, consequence, or authorization.
- The five dimensions omit durable user preferences, relationship context, organizational rules, cumulative effects, and domain-specific risk.
- The prototype supports one action at a time and does not handle plans, dependencies, partial completion, retries, or uncertain tool outcomes.
- The evaluation measures conformance across ten designed scenarios, not user trust, perceived control, or production safety.
