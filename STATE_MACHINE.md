## Purpose

Describe the approved main flow for an individual action, using [Policy v0](POLICY.md) to determine whether to clarify, request approval, or execute. This is a conceptual draft; failure handling and uncertain outcomes remain unresolved.

## Runtime loop (conceptual)

```text
                       User request
                            ↓
                 Parse / construct action
                            ↓
                        Assessing ◄──────────────┐
                            ↓                    │
           Policy v0 evaluates action dimensions │
                            ↓                    │
          ┌─────────────────┼─────────────────┐  │
          ↓                 ↓                 ↓  │
       Clarify       Request approval      Execute
          ↓                 ↓                 ↓
    Wait for answer  Wait for decision    Side effect
          ↓                 ↓                 ↓
    Update context   Approved + unchanged  On success
          ↓                 ↓                 ↓
       Reassess          Execute          Completed
          │                 ↓
          │            Side effect
          │                 ↓
          │            On success
          │                 ↓
          │             Completed
          └──────────────────────────────────────┘

    Approval declined → Cancelled
    Scope or consequences change before execution → Assessing
```

Clarification returns to Assessing with updated context. Approval permits execution of the exact reviewed action; changed scope or consequences require reassessment before execution. Silence leaves the action waiting. Both execution paths reach Completed only on success.

```text
                    Completed
                        ↓
          Show changes + available undo
                        ↓
              User selects undo
                        ↓
              Is undo still safe?
                ┌───────┴───────┐
               Yes              No
                ↓               ↓
             Undoing        Undo blocked
                ↓               ↓
           On success     Explain and pause
                ↓
              Undone
```

This is a visual description, not executable runtime code. Parsing constructs the proposed action; policy evaluation occurs during Assessing. Failure handling, uncertain outcomes, and retries remain unresolved.

## States

| State | Meaning |
|---|---|
| Assessing | Evaluate the action dimensions and determine the next path. |
| Awaiting clarification | Pause the action while waiting for information needed to reassess. |
| Awaiting approval | Pause until the user explicitly approves or declines the reviewed action. |
| Executing | Perform the action after required checks. |
| Completed | Show what changed and offer undo when available. |
| Undoing | Restore the previous state when undo is still safe. |
| Undo blocked | Explain why undo is no longer safe; make no further changes. |
| Undone | Report that restoration succeeded. |
| Cancelled | Do not execute or repeat the approval request. |

## Events

- Request received.
- Assessment determines clarification, approval, or execution is needed.
- User answers a clarification question.
- User explicitly approves or declines the reviewed action.
- Scope or consequences change before execution.
- Execution succeeds.
- User selects undo; undo is checked for continued safety.
- Undo succeeds.

Failure and uncertain-outcome events are not defined yet.

## Transitions

| From | Event or condition | To |
|---|---|---|
| Entry | Request received | Assessing |
| Assessing | Material ambiguity requires clarification | Awaiting clarification |
| Assessing | Policy requires authorization or confirmation | Awaiting approval |
| Assessing | Required checks are satisfied | Executing |
| Awaiting clarification | User answers | Assessing |
| Awaiting approval | User approves the exact reviewed action and scope and consequences remain unchanged | Executing |
| Awaiting approval | User declines | Cancelled |
| Awaiting approval | Scope or consequences change before execution | Assessing |
| Executing | Execution succeeds | Completed |
| Completed | User selects undo and undo is still safe | Undoing |
| Completed | User selects undo but undo is no longer safe | Undo blocked |
| Undoing | Restoration succeeds | Undone |

Silence leaves the action waiting; it is never approval. If scope or consequences change after approval but before execution, reassess before acting.

## Clarification path

Assessing → Awaiting clarification → Assessing.

The answer may change the action's scope or consequences. Reassess instead of treating clarification as permission.

## Confirmation path

Assessing → Awaiting approval → Executing or Cancelled.

Approval applies to the exact action reviewed. Combine authorization and consequence confirmation when both are required, as defined in Policy v0. Do not ask again for the unchanged, approved action. A refusal cancels the action without repeated requests.

## Execution path

Assessing or Awaiting approval → Executing → Completed.

Assess the action dimensions before execution. Context gathering can support assessment. After successful execution, show what changed and offer undo when available.

## Failure and recovery path

Approved undo path:

Completed → Undoing → Undone, when the user selects undo and it still meets the policy's safety conditions. No additional confirmation is needed.

Completed → Undo blocked, when undo is no longer safe. Explain the issue before any further changes. For example, another person's subsequent edit may make restoring the prior file unsafe.

Execution failures, uncertain outcomes, retries, and undo failures remain unresolved. No behavior for these cases is established by this draft.

## Open questions

- How should execution failures and uncertain outcomes be handled?
- When, if ever, should a failed action be retried?
- What happens if undo fails or its outcome is uncertain?
- How should the flow continue after undo is blocked?
