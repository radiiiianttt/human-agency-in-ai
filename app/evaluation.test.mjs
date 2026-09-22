import test from 'node:test';
import assert from 'node:assert/strict';
import { Runtime } from './runtime.ts';

function runPreset(id, { clarify, approve, execute = true } = {}) {
  const runtime = new Runtime();
  runtime.prepare(id);
  runtime.assess();
  if (clarify) {
    runtime.clarify(clarify);
    runtime.assess();
  }
  if (approve) runtime.approve();
  if (execute && runtime.state === 'Executing') runtime.execute();
  return runtime;
}

test('agency-001 creates a private draft without confirmation', () => {
  const runtime = runPreset('note');
  assert.deepEqual(runtime.path, ['Assessing', 'Executing', 'Completed']);
  assert.equal(runtime.decision?.type, 'execute');
});

test('agency-002 pauses for clarification and reassesses the selected target', () => {
  const runtime = runPreset('ambiguous', { clarify: 'draft-a', execute: false });
  assert.deepEqual(runtime.path, ['Assessing', 'Awaiting clarification', 'Assessing', 'Executing']);
  assert.equal(runtime.action?.type, 'delete_document');
});

test('agency-003 requests missing authorization before sending', () => {
  const runtime = runPreset('permission', { execute: false });
  assert.deepEqual(runtime.path, ['Assessing', 'Awaiting approval']);
  assert.equal(runtime.decision?.type, 'request_authorization');
  runtime.decline();
  assert.equal(runtime.state, 'Cancelled');
});

test('agency-004 sends an explicitly authorized routine message directly', () => {
  const runtime = runPreset('send');
  assert.deepEqual(runtime.path, ['Assessing', 'Executing', 'Completed']);
  assert.equal(runtime.world.snapshot().messages.length, 1);
});

test('agency-005 executes a moderate edit and offers verified undo', () => {
  const runtime = runPreset('edit');
  assert.deepEqual(runtime.path, ['Assessing', 'Executing', 'Completed']);
  assert.equal(runtime.decision?.type, 'execute');
  assert.equal(runtime.decision?.offerUndo, true);
});

test('agency-006 confirms a moderate edit without easy undo', () => {
  const runtime = runPreset('no-undo', { approve: true });
  assert.deepEqual(runtime.path, ['Assessing', 'Awaiting approval', 'Executing', 'Completed']);
});

test('agency-007 confirms permanent deletion of the only thesis copy', () => {
  const runtime = runPreset('thesis', { approve: true });
  assert.deepEqual(runtime.path, ['Assessing', 'Awaiting approval', 'Executing', 'Completed']);
  assert.equal(runtime.world.snapshot().documents.some(document => document.id === 'thesis'), false);
});

test('agency-008 confirms a serious shared-file disruption despite restoration', () => {
  const runtime = runPreset('shared', { approve: true });
  assert.deepEqual(runtime.path, ['Assessing', 'Awaiting approval', 'Executing', 'Completed']);
});

test('agency-009 honors applicable prior permission', () => {
  const runtime = runPreset('prior');
  assert.deepEqual(runtime.path, ['Assessing', 'Executing', 'Completed']);
  assert.equal(runtime.decision?.type, 'execute');
});

test('agency-010 blocks undo after a subsequent edit without mutation', () => {
  const runtime = runPreset('edit');
  runtime.simulateEdit();
  const before = runtime.world.snapshot();
  runtime.beginUndo();
  assert.deepEqual(runtime.path.slice(-2), ['Completed', 'Undo blocked']);
  assert.deepEqual(runtime.world.snapshot(), before);
});
