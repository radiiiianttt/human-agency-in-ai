# Policy engine — Step 6

`policy.ts` implements the approved rules in `../POLICY.md` as a pure function:

```ts
const decision = evaluatePolicy(assessment, approval);
```

It consumes a structured `Assessment` and returns `clarify`, `request_authorization`, `confirm`, or `execute`, with a reason. Execution decisions indicate whether verified easy undo should be offered. An authorization request indicates whether its prompt must also cover consequence confirmation, avoiding duplicate prompts.

The assessment producer must establish consequence, scope, external effects, and undo availability. This engine does not infer these facts from natural language. `materialContextMissing` means unresolved context could change the policy decision; `minor` ambiguity must not affect the action, target, scope, or decision.

## Approval contract

The future runtime must give each proposed action a nonempty, unique revision and change it whenever target, scope, or assessed consequences change. Only trusted interaction state may supply `Approval`, after the user explicitly approves that exact action and its consequences. The initial command is authorization, not final confirmation. The runtime must discard declined or invalidated approvals and prevent duplicate execution. Matching approval allows an otherwise confirmable action to proceed without another prompt; it does not bypass unresolved ambiguity.

## Run focused tests

With Node.js 24 (native TypeScript stripping):

```sh
node --test experiments/human-agency-in-ai/engine/policy.test.mjs
```

Run from the Invisible Lab repository root. No dependencies or application initialization are required. Native TypeScript stripping runs the tests but does not perform static type checking; the app now supplies a TypeScript compiler check covering the engine (`npm run typecheck` from `../app`).

Inputs are a typed, trusted internal contract. Runtime validation of external/model-produced data belongs at the future structured-interpretation boundary and is not implemented here.

These are policy unit tests, not executions of the ten end-to-end evaluation scenarios. The basic UI and single-action runtime are now in `../app`; LLM interpretation remains later work. In particular, unsafe undo is a state-machine concern; an `execute` policy decision does not perform or guarantee execution. No failure/retry behavior is implemented.


## Fake tools and world — Step 7

`world.ts` provides in-memory tool primitives; `fixtures.ts` creates an isolated example world. Nothing is persisted to disk or sent over a network. The fixtures include two ambiguous drafts, a private versioned document, a document without history, a thesis, a shared project file, Alex as a simulated contact, and a private grocery list.

Supported actions: create a private document, edit a document, move a document to trash, permanently delete a document, send a message to the simulated outbox, and add one item to an existing simulated list. Editing and deletion require an exact document ID and expected version. Stale versions fail before mutation. Sending requires an exact contact ID and channel. List additions require an exact list ID; list undo is not implemented.

Undo tokens are returned for private creation, private trash deletion, and private edits with history enabled. Undo checks the current version again at execution time. Shared edits do not advertise easy undo because restoring a file cannot erase effects on others. Permanent deletion invalidates retained undo records for that document. Undo restores content with a new version, preventing older tokens from appearing current again.

`simulateExternalEdit` is a test fixture helper for intervening edits. `snapshot` returns detached copies so readers cannot mutate internal state. Each new example world starts fresh.

These primitives do not enforce policy themselves. The app runtime assesses preset actions, obtains required approval, and only then calls `execute`. Tool exceptions do not establish a retry policy. Consequence, intent, and authorization are not inferred by these tools. Persistent permissions, natural-language interpretation, and multi-action orchestration are not implemented.

Run both policy and tool tests from the repository root:

```sh
node --test experiments/human-agency-in-ai/engine/*.test.mjs
```

The ten research scenarios are exercised through `../app/evaluation.test.mjs`; results are recorded in `../evaluation/results.md`.
