import test from 'node:test';
import assert from 'node:assert/strict';
import { createExampleWorld } from './fixtures.ts';
const edit = (documentId = 'private-report', expectedVersion = 1) => ({ type: 'edit_document', documentId, expectedVersion, content: 'New content' });

test('fresh worlds and snapshots are isolated', () => {
  const a = createExampleWorld(), b = createExampleWorld();
  a.snapshot().documents[0].content = 'tampered';
  a.execute(edit());
  assert.equal(b.snapshot().documents.find(d => d.id === 'private-report').version, 1);
  assert.notEqual(a.snapshot().documents[0].content, 'tampered');
});
test('creation never overwrites matching titles; undo removes only the new note', () => {
  const w = createExampleWorld();
  const r = w.execute({ type: 'create_document', title: 'Old draft', content: '', folder: 'notes' });
  assert.equal(w.snapshot().documents.filter(d => d.title === 'Old draft').length, 3);
  assert.equal(w.undo(r.undoToken).status, 'undone');
  assert.equal(w.snapshot().documents.filter(d => d.title === 'Old draft').length, 2);
  assert.equal(w.undo(r.undoToken).status, 'blocked');
});
test('private edit restores content and advances version', () => {
  const w = createExampleWorld();
  const before = w.snapshot().documents.find(d => d.id === 'private-report');
  const r = w.execute(edit());
  assert.equal(w.checkUndo(r.undoToken).available, true);
  assert.equal(w.undo(r.undoToken).status, 'undone');
  const after = w.snapshot().documents.find(d => d.id === before.id);
  assert.equal(after.content, before.content);
  assert.equal(after.version, 3);
});
test('subsequent external edit blocks undo without mutating anything', () => {
  const w = createExampleWorld(), r = w.execute(edit());
  w.simulateExternalEdit('private-report', 'Someone else’s work');
  const before = w.snapshot();
  assert.equal(w.undo(r.undoToken).status, 'blocked');
  assert.deepEqual(w.snapshot(), before);
});
test('stale edit is rejected before mutation', () => {
  const w = createExampleWorld();
  w.execute(edit());
  const before = w.snapshot();
  assert.throws(() => w.execute(edit()), /changed/);
  assert.deepEqual(w.snapshot(), before);
});
test('shared and history-free edits do not claim easy undo', () => {
  const w = createExampleWorld();
  assert.equal(w.execute(edit('team-plan')).undoToken, undefined);
  assert.equal(w.execute(edit('no-history')).undoToken, undefined);
});
test('trash restores; permanent deletion invalidates earlier undo records', () => {
  const w = createExampleWorld();
  const r = w.execute({ type: 'delete_document', documentId: 'draft-a', expectedVersion: 1, permanent: false });
  assert.equal(w.undo(r.undoToken).status, 'undone');
  const e = w.execute(edit());
  const d = w.execute({ type: 'delete_document', documentId: 'private-report', expectedVersion: 2, permanent: true });
  assert.equal(d.undoToken, undefined);
  assert.equal(w.undo(e.undoToken).status, 'blocked');
  assert.equal(w.snapshot().documents.some(d => d.id === 'private-report'), false);
});
test('message sends only to simulated outbox with exact recipient and channel', () => {
  const w = createExampleWorld();
  assert.throws(() => w.execute({ type: 'send_message', recipientId: 'alex', channel: 'email', content: 'Hi' }));
  assert.equal(w.snapshot().messages.length, 0);
  const r = w.execute({ type: 'send_message', recipientId: 'alex', channel: 'chat', content: 'I’m five minutes late.' });
  assert.equal(r.undoToken, undefined);
  assert.equal(w.snapshot().messages.length, 1);
});
test('list item action mutates only the requested simulated list', () => {
  const w = createExampleWorld();
  const before = w.snapshot();
  const result = w.execute({ type: 'add_list_item', listId: 'grocery-list', item: 'bananas' });
  assert.equal(result.summary, 'bananas added to Grocery List');
  assert.equal(result.undoToken, undefined);
  assert.deepEqual(w.snapshot().lists[0].items, [...before.lists[0].items, 'bananas']);
  assert.deepEqual(w.snapshot().documents, before.documents);
  assert.deepEqual(w.snapshot().messages, before.messages);
});
