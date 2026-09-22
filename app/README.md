# Human Agency in AI interface

Local Next.js + TypeScript interface for the Invisible Lab experiment. All actions affect only an in-memory fake world. Reloading or resetting discards it.

## Run

From this directory, with Node.js 24:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000.

No API key is required for the primary preset-scenario demo. To enable optional free-text interpretation, copy `.env.example` to `.env.local`, set `OPENAI_API_KEY`, and restart the server.

## Checks

```sh
npm run typecheck
npm run build
node --test evaluation.test.mjs interpretation.test.mjs runtime.test.mjs ../engine/*.test.mjs
```

## Interaction

Enter a natural-language request or choose a compact scenario pill. The primary canvas shows the causal chain from structured interpretation through the five action dimensions, Policy v0, the runtime state path, and the precise result. The policy decision is the visual focus because the experiment studies when the system acts, clarifies, or waits for approval.

The raw system trace and simulated workspace open as secondary drawers. They preserve the evidence and fake-world consequences without competing with the behavioral model. All nine preset scenarios remain available through the featured pills and the compact scenario menu.

After a private edit, use Undo, or simulate a subsequent edit and then try Undo to see recovery blocked. Nine request presets plus this follow-up cover the ten evaluation records. Their automated conformance tests and recorded results are in `evaluation.test.mjs` and `../evaluation/results.md`.

The assessment values are fixture assumptions, not inferred judgments. The preset path uses no model call. Step 9 adds free-text interpretation as described below. Real message delivery, persistent storage, and multi-action orchestration are not implemented. The email-draft example is represented by the existing fake messaging tool and a fixed text payload, not an attachment integration.

`runtime.ts` connects policy decisions to fake tools for one action at a time. Explicit approval applies only to the current action; document versions are checked before execution. Duplicate execution calls are ignored outside the Executing state. Reset cancels the session and creates a fresh world.

## Recovery scope

- Ambiguous targets: wait for a selection, then reassess.
- Approval: wait without mutation; decline cancels.
- Unsafe undo: explain and preserve newer work.
- Tool errors or stale approved documents: show an “Execution stopped” diagnostic with no automatic retry. This is a prototype containment state, not a newly agreed research recovery policy. Full failure, retry, and uncertain-outcome behavior remains unresolved.

The brief state transition delay lets the browser render progress; it does not simulate model reasoning. Action dimensions and the current state path are visible for basic inspection; a full developer/system trace remains Step 10.

## Structured interpretation — Step 9

This path is optional. Set `OPENAI_API_KEY` in `.env.local` (ignored by Git). Optional `OPENAI_MODEL` defaults to `gpt-4.1-mini`. Restart the dev server after changing configuration if it does not reload automatically.

The New request form calls the server-only `/api/interpret` endpoint. Only the request, clarification exchanges, and simulated documents, contacts, and lists are sent to OpenAI; no real files are read. The server uses Responses API strict JSON-schema output with `store: false`, then validates the result with Zod. The browser validates it again. No key is exposed in the client bundle.

The model proposes one supported action and estimates consequence/authorization from context. Code resolves exact IDs and current versions, derives external impact and undo properties from the fake world, and passes the assessment to Policy v0. The model cannot provide an approval record or invoke tools. Clarification replies are reinterpreted before assessment. Unsupported multi-action or unsupported-tool requests stop without mutation. Cancelling interpretation invalidates late responses.

Consequence and authorization estimates are still fallible model judgments, not guaranteed facts. Prior-permission memory is not implemented for free text. The scenario pills and scenario menu continue to use fixture assessments without a model call.

Authentication failures, refusals, invalid output, and timeouts display an error without executing a tool or automatically retrying. These are interpretation-boundary errors; the research policy for uncertain tool outcomes remains unresolved.

Run all focused tests:

```sh
node --test interpretation.test.mjs runtime.test.mjs ../engine/*.test.mjs
```

Reference: https://developers.openai.com/api/docs/guides/structured-outputs

Live structured interpretation was verified: a private-note request produced a `create_document` proposal, while an ambiguous deletion request produced a focused clarification question.

## Developer/system trace — Step 10

The trace drawer records the observable runtime sequence for the current request: user input, structured interpretation, validated action construction, combined assessment, Policy v0 decisions, state transitions, approvals, simulated tool calls, world changes, and undo checks. Each entry includes a short summary and expandable structured data.

The trace deliberately excludes the API key, authorization headers, approval tokens, and hidden model reasoning. The model-provided `rationale` is a short evidence-based justification from the structured output, not a chain-of-thought transcript. UI serialization also redacts credential-like fields defensively. The trace is opened with **Inspect trace** rather than occupying a permanent column.

Interpretation latency appears on the completed model event. Failures and cancellations produce explicit close-state events, and a late model response after cancellation is marked as discarded. Resetting the workspace begins a new runtime and clears its trace.

Validation: 33 focused tests, static TypeScript checking, and production build passed after adding the trace.

## Behavioral presentation — Step 10.5

The presentation layer now follows **User request → Interpret → Assess → Policy → State → Result**. Structured intent and target data, all five assessment dimensions, the deterministic policy explanation, the state path, and the execution result fit in the primary desktop viewport. Confirmation, clarification, cancellation, undo, and blocked-undo controls remain attached to the policy or result state where they become relevant.

Policy explanations are derived from the existing `PolicyDecision`, assessment, and runtime state. The interface does not call a second model or expose hidden reasoning. “Action stopped” is a presentation of the existing execution/recovery containment states; it is not a new Policy v0 decision.

Validation status and scenario evidence are maintained in `../evaluation/results.md`.
