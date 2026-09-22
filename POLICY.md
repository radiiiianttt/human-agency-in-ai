## Policy purpose

Preserve meaningful user control while avoiding redundant permission requests. Permission depends on properties of the action, not simply whether the assistant uses a tool.

## Action dimensions

| Action dimension | What it assesses |
|---|---|
| Ambiguity | How uncertain is the assistant about the user’s intended action, target, or scope? |
| Consequence | How significant could the effects be if the action is taken, especially incorrectly? |
| Reversibility | How fully and easily can the effects be undone? |
| External impact | Does the action affect other people or shared systems? |
| Authorization | Is the action covered by the user’s explicit instruction or an applicable prior permission? |

## Scoring model

Policy v0 applies the action dimensions as separate checks; it does not use an additive score.

### Consequence boundaries

| Level | Definition |
|---|---|
| Low | A mistake causes only minor inconvenience, with no meaningful loss, exposure of private information, or commitment. |
| Moderate | A mistake causes meaningful but limited disruption, without major loss or a binding commitment. |
| Serious | Potential major loss, exposure of sensitive information, binding commitments, or substantial harm to someone's work or reputation. This remains serious even when some effects can be reversed. |

If missing context could change the consequence classification enough to change the decision, resolve that uncertainty before acting. Check available information first, then ask a focused question if needed.

### Easy undo

Easy undo requires a verified, reliable way to restore the previous state with minimal effort and without leaving meaningful effects behind. Make this option available when execution relies on it.

Restoring a private file may qualify. Deleting a sent message that someone already read does not undo its effects.

If undo cannot be verified as available and reliable, treat the action as lacking easy undo. Difficult recovery and irreversible effects both fall outside easy undo for the confirmation rule below.

## Policy v0

Apply the checks in this order:

1. Resolve material ambiguity about the action, target, or scope before execution. Clarification establishes what the user means; it does not substitute for permission.
2. Check authorization. Ask before acting outside explicit instructions or applicable prior permission. Prior permission applies only within its established scope.
3. Check consequence and reversibility using the table below.
4. Execute after the required checks and provide undo when the decision depends on it.

| Consequence | Reversibility | Behavior once intent is clear and authorization is established |
|---|---|---|
| Low | Any | Proceed without another confirmation. |
| Moderate | Easy undo is verified and available | Proceed without another confirmation, with undo available. |
| Moderate | Easy undo is unavailable or unverified | Ask for one final confirmation before execution. |
| Serious | Any | Ask for one final confirmation before execution, even when explicitly requested or covered by prior permission. |

External impact alone does not require another confirmation. A clearly authorized, routine message to an identified recipient can be sent directly; consequence and reversibility checks still apply.

One confirmation can establish authorization and explain consequences together. Once the user confirms that exact action, execute without asking again unless its scope or consequences change. For a serious action explicitly commanded by the user, the original command and the final confirmation form two gates—not two additional prompts.

## Decision types

- Clarify: resolve material uncertainty before execution.
- Request authorization: ask permission for an action outside established authorization.
- Confirm: obtain a final confirmation when consequence and reversibility require it; combine with an authorization request when both are needed.
- Execute: perform the authorized action after required checks, with undo available when the decision relies on it.

## Assumptions

These are working rules for Policy v0, not validated findings. Consequence depends on context, and reversibility does not reduce a serious consequence to a lower category.

## Open questions

- Do evaluation scenarios expose inconsistent interpretations of low, moderate, or serious consequences?
- Do users experience the resulting confirmations as meaningful control or unnecessary friction?
- Does the available undo actually restore the prior state without meaningful residual effects?
