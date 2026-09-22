import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePolicy } from './policy.ts';

const base = {
  actionRevision: 'action-1:v1', ambiguity: 'clear', materialContextMissing: false,
  consequence: 'low', reversibility: 'easy', undoVerifiedAvailable: true,
  externalImpact: 'user_only', authorization: 'explicit',
};
const decide = (changes = {}, approval) => evaluatePolicy({ ...base, ...changes }, approval);

test('low consequence can execute across all reversal and external-impact levels', () => {
  for (const reversibility of ['easy', 'difficult', 'irreversible', 'unknown']) {
    for (const externalImpact of ['user_only', 'indirect', 'direct']) {
      assert.equal(decide({ reversibility, externalImpact }).type, 'execute');
    }
  }
});
test('material ambiguity and missing context block even an approved action', () => {
  const approval = { actionRevision: base.actionRevision };
  assert.equal(decide({ ambiguity: 'material' }, approval).reason, 'material_ambiguity');
  assert.equal(decide({ materialContextMissing: true }, approval).reason, 'material_context_missing');
  assert.equal(decide({ ambiguity: 'minor' }).type, 'execute');
});
test('unclear scope requires clarification; prior in-scope authorization applies', () => {
  assert.equal(decide({ authorization: 'unclear_scope' }).type, 'clarify');
  assert.equal(decide({ authorization: 'prior_in_scope' }).type, 'execute');
});
test('missing authorization combines permission and serious consequence confirmation', () => {
  assert.deepEqual(decide({ authorization: 'missing', consequence: 'serious' }), {
    type: 'request_authorization', reason: 'authorization_missing', consequenceConfirmationRequired: true,
  });
  assert.equal(decide({ authorization: 'missing' }).consequenceConfirmationRequired, false);
  assert.equal(decide({ authorization: 'missing', consequence: 'serious' },
    { actionRevision: base.actionRevision }).type, 'execute');
});
test('moderate actions execute only with verified easy undo', () => {
  for (const reversibility of ['easy', 'difficult', 'irreversible', 'unknown']) {
    for (const undoVerifiedAvailable of [true, false]) {
      const d = decide({ consequence: 'moderate', reversibility, undoVerifiedAvailable });
      const safe = reversibility === 'easy' && undoVerifiedAvailable;
      assert.equal(d.type, safe ? 'execute' : 'confirm');
      if (safe) assert.equal(d.offerUndo, true);
    }
  }
});
test('serious consequences require confirmation regardless of reversal or prior permission', () => {
  for (const reversibility of ['easy', 'difficult', 'irreversible', 'unknown']) {
    for (const authorization of ['explicit', 'prior_in_scope']) {
      assert.equal(decide({ consequence: 'serious', reversibility, authorization }).type, 'confirm');
    }
  }
});
test('matching confirmation avoids a loop; changed action invalidates it', () => {
  const approval = { actionRevision: base.actionRevision };
  assert.equal(decide({ consequence: 'serious' }, approval).type, 'execute');
  assert.equal(decide({ consequence: 'serious', actionRevision: 'action-1:v2' }, approval).type, 'confirm');
  assert.equal(decide({ authorization: 'missing', actionRevision: 'another-action:v1' }, approval).type, 'request_authorization');
});
test('undo is never offered without verified easy restoration', () => {
  assert.equal(decide({ undoVerifiedAvailable: false }).offerUndo, false);
  assert.equal(decide({ reversibility: 'irreversible' }).offerUndo, false);
});
test('empty action revisions are rejected', () => {
  assert.throws(() => decide({ actionRevision: ' ' }), /nonempty/);
});
