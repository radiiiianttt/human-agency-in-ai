import test from 'node:test';
import assert from 'node:assert/strict';
import { InterpretationSchema, constructProposal } from './interpretation.ts';
import { createExampleWorld } from '../engine/fixtures.ts';
import { Runtime } from './runtime.ts';
const world=createExampleWorld().snapshot();
const output={status:'proposed',summary:'Edit report',question:'',action:{type:'edit_document',targetId:'private-report',title:null,content:'Updated',folder:null,channel:null,permanent:null,item:null},consequence:'moderate',authorization:'explicit',materialContextMissing:false,rationale:'Requested edit'};
test('undo and external impact derive from world, not model',()=>{const p=constructProposal(output,world,'v1');assert.equal(p.assessment.undoVerifiedAvailable,true);const q=constructProposal({...output,action:{...output.action,targetId:'team-plan'}},world,'v2');assert.equal(q.assessment.undoVerifiedAvailable,false);assert.equal(q.assessment.externalImpact,'direct');});
test('unknown targets and incomplete actions cannot construct executable proposals',()=>{assert.throws(()=>constructProposal({...output,action:{...output.action,targetId:'invented'}},world,'v1'));assert.throws(()=>constructProposal({...output,action:{...output.action,content:null}},world,'v1'));assert.throws(()=>constructProposal({...output,status:'clarify'},world,'v1'));});
test('model cannot emit prior authorization or approval records',()=>{assert.equal(InterpretationSchema.safeParse({...output,authorization:'prior_in_scope'}).success,false);assert.equal(InterpretationSchema.safeParse({...output,approval:{actionRevision:'v1'}}).success,false);});
test('list item interpretation resolves a real list without inventing undo',()=>{const p=constructProposal({...output,summary:'Add bananas',action:{...output.action,type:'add_list_item',targetId:'grocery-list',content:null,item:'bananas'},consequence:'low'},world,'v-list');assert.deepEqual(p.action,{type:'add_list_item',listId:'grocery-list',item:'bananas'});assert.equal(p.assessment.reversibility,'easy');assert.equal(p.assessment.undoVerifiedAvailable,false);});
test('cancelled interpretation ignores late model response',async()=>{const original=globalThis.fetch;let resolve;globalThis.fetch=()=>new Promise(r=>resolve=r);try{const r=new Runtime();const before=r.world.snapshot();const pending=r.interpret('Edit report');r.cancelInterpretation();resolve(Response.json(output));await pending;assert.equal(r.state,'Cancelled');assert.equal(r.action,null);assert.deepEqual(r.world.snapshot(),before);}finally{globalThis.fetch=original;}});
test('natural clarification does not execute until a valid new interpretation',async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({...output,status:'clarify',action:null,question:'Which report?'});try{const r=new Runtime();const before=r.world.snapshot();await r.interpret('Edit report');assert.equal(r.state,'Awaiting clarification');assert.equal(r.action,null);assert.deepEqual(r.world.snapshot(),before);}finally{globalThis.fetch=original;}});
test('natural-language trace records structured interpretation and constructed assessment',async()=>{
  const original=globalThis.fetch;globalThis.fetch=async()=>Response.json(output);
  try {
    const r=new Runtime();await r.interpret('Edit report');r.assess();
    assert.ok(r.trace.some(entry=>entry.event==='interpretation.completed'&&entry.source==='model'));
    assert.ok(r.trace.some(entry=>entry.event==='action.constructed'));
    assert.ok(r.trace.some(entry=>entry.event==='assessment.constructed'));
    assert.ok(r.trace.some(entry=>entry.event==='policy.evaluated'));
  } finally {globalThis.fetch=original;}
});
