import test from 'node:test';
import assert from 'node:assert/strict';
import { Runtime } from './runtime.ts';
function start(id) { const r=new Runtime(); r.prepare(id); r.assess(); return r; }
test('low consequence request executes once',()=>{const r=start('note');assert.equal(r.state,'Executing');r.execute();const n=r.world.snapshot().documents.length;r.execute();assert.equal(r.world.snapshot().documents.length,n);assert.equal(r.state,'Completed');});
test('serious deletion waits; decline preserves world',()=>{const r=start('thesis');assert.equal(r.state,'Awaiting approval');const before=r.world.snapshot();r.execute();r.decline();r.approve();assert.equal(r.state,'Cancelled');assert.deepEqual(r.world.snapshot(),before);});
test('approval executes exactly the reviewed action',()=>{const r=start('thesis');r.approve();r.execute();assert.equal(r.state,'Completed');assert.equal(r.world.snapshot().documents.some(d=>d.id==='thesis'),false);});
test('clarification reassesses and deletes only the selected draft',()=>{const r=start('ambiguous');assert.equal(r.state,'Awaiting clarification');r.clarify('draft-b');assert.equal(r.state,'Assessing');r.assess();r.execute();assert.equal(r.world.snapshot().documents.find(d=>d.id==='draft-b').deleted,true);assert.equal(r.world.snapshot().documents.find(d=>d.id==='draft-a').deleted,false);});
test('intervening edit blocks undo and preserves newer work',()=>{const r=start('edit');r.execute();r.simulateEdit();const before=r.world.snapshot();r.beginUndo();r.undo();assert.equal(r.state,'Undo blocked');assert.deepEqual(r.world.snapshot(),before);});
test('unchanged private edit can be undone',()=>{const r=start('edit');r.execute();r.beginUndo();r.undo();assert.equal(r.state,'Undone');});
test('stale approval cannot mutate a changed document',()=>{const r=start('shared');r.world.simulateExternalEdit('team-plan','New state');const before=r.world.snapshot();r.approve();assert.equal(r.state,'Execution stopped');assert.deepEqual(r.world.snapshot(),before);});
test('missing permission gates simulated message',()=>{const r=start('permission');assert.equal(r.state,'Awaiting approval');assert.equal(r.world.snapshot().messages.length,0);r.approve();r.execute();assert.equal(r.world.snapshot().messages.length,1);});
test('trace orders request, policy decision, tool call and result',()=>{
  const r=start('note');r.execute();
  const events=r.trace.map(entry=>entry.event);
  assert.ok(events.indexOf('request.received')<events.indexOf('policy.evaluated'));
  assert.ok(events.indexOf('policy.evaluated')<events.indexOf('tool.called'));
  assert.ok(events.indexOf('tool.called')<events.indexOf('tool.succeeded'));
  assert.equal(events.at(-1),'state.transition');
  assert.equal(JSON.stringify(r.trace).includes('OPENAI_API_KEY'),false);
  assert.equal(JSON.stringify(r.trace).includes('Bearer '),false);
});
test('declined approval is observable and never records a tool call',()=>{
  const r=start('thesis');r.decline();
  assert.ok(r.trace.some(entry=>entry.event==='approval.declined'));
  assert.equal(r.trace.some(entry=>entry.event==='tool.called'),false);
});
