'use client';
import {useEffect,useRef,useState} from 'react';
import type {Assessment,PolicyDecision} from '../../engine/policy';
import type {Action} from '../../engine/world';
import {Runtime,examples} from '../runtime';
import type {ExampleId,State,TraceEntry} from '../runtime';

type Drawer='trace'|'world'|null;
type Tone='idle'|'working'|'execute'|'clarify'|'confirm'|'stopped';
type Snapshot=ReturnType<Runtime['world']['snapshot']>;
type IconName='ambiguity'|'consequence'|'reversibility'|'external'|'authorization'|'create_document'|'edit_document'|'delete_document'|'send_message'|'add_list_item'|'policy';
const featured:ExampleId[]=['note','send','edit','ambiguous','thesis'];
const traceJson=(v:unknown)=>JSON.stringify(v,(k,x)=>/api.?key|authorization.?header|secret|credential/i.test(k)?'[redacted]':x,2);

function firstDecision(trace:TraceEntry[],current:PolicyDecision|null){
  const event=trace.find(e=>e.event==='policy.evaluated');
  return ((event?.data as {decision?:PolicyDecision}|undefined)?.decision)??current;
}
function presentDecision(d:PolicyDecision|null,state:State):{label:string;tone:Tone}{
  if(!d){
    if(state==='Interpreting'||state==='Assessing')return{label:'Evaluating action',tone:'working'};
    if(state==='Awaiting clarification')return{label:'Clarify',tone:'clarify'};
    if(state==='Execution stopped'||state==='Undo blocked')return{label:'Action stopped',tone:'stopped'};
    return{label:'Awaiting request',tone:'idle'};
  }
  if(d.type==='clarify')return{label:'Clarify',tone:'clarify'};
  if(d.type==='request_authorization'||d.type==='confirm')return{label:'Confirm',tone:'confirm'};
  if(d.offerUndo)return{label:'Execute + undo',tone:'execute'};
  return{label:'Execute',tone:'execute'};
}
function reasons(d:PolicyDecision|null,a:Assessment|null){
  if(!a)return['waiting for an assessed action'];
  if(!d)return a.ambiguity==='material'?['target or scope is ambiguous']:['assessment is in progress'];
  if(d.type==='clarify')return[d.reason==='material_ambiguity'?'request is materially ambiguous':d.reason==='material_context_missing'?'material context is missing':'authorization scope is unclear'];
  if(d.type==='request_authorization')return['authorization is missing',...(d.consequenceConfirmationRequired?['consequence requires review']:[])];
  if(d.type==='confirm')return[d.reason==='serious_consequence'?'consequence is serious':'undo is not verified'];
  const list=[a.ambiguity==='clear'?'request is clear':'ambiguity is resolved'];
  if(a.consequence==='low')list.push('consequence is low');
  if(a.authorization==='explicit')list.push('explicitly authorized');
  if(a.authorization==='prior_in_scope')list.push('within prior permission');
  if(d.offerUndo)list.push('verified undo is available');
  if(d.reason==='approved_action')list.push('exact action approved');
  return list.slice(0,3);
}
function actionData(action:Action|null,trace:TraceEntry[],r:Runtime):Record<string,unknown>{
  if(!action){
    const e=[...trace].reverse().find(x=>x.event==='interpretation.completed');
    const d=e?.data as {status?:string;summary?:string;question?:string}|undefined;
    return d?{status:d.status??'unknown',summary:d.summary??'No action constructed',...(d.question?{missing_detail:d.question}:{})}:{status:'no_action'};
  }
  const w=r.world.snapshot();
  if(action.type==='create_document')return{intent:action.type,target:action.title,scope:'private / '+action.folder,content:action.content};
  if(action.type==='send_message')return{intent:action.type,target:w.contacts.find(x=>x.id===action.recipientId)?.name??action.recipientId,channel:action.channel,content:action.content};
  if(action.type==='add_list_item')return{intent:action.type,target:w.lists.find(x=>x.id===action.listId)?.name??action.listId,item:action.item};
  if(action.type==='edit_document')return{intent:action.type,target:w.documents.find(x=>x.id===action.documentId)?.title??action.documentId,version:action.expectedVersion,replacement:action.content};
  return{intent:action.type,target:w.documents.find(x=>x.id===action.documentId)?.title??action.documentId,mode:action.permanent?'permanent':'trash'};
}
function resultText(r:Runtime){
  const map:Partial<Record<State,[string,string]>>={Ready:['Nothing has happened','No tool has been called.'],Interpreting:['Interpreting request','No tool has been called.'],Assessing:['Assessing proposed action','No tool has been called.'],'Awaiting clarification':['Waiting for clarification','No action has occurred.'],'Awaiting approval':['Waiting for approval','No action has occurred.'],Executing:['Calling simulated tool','Execution is in progress.'],Cancelled:['Action cancelled','Nothing was changed.'],Undoing:['Restoring previous state','Undo is in progress.'],Undone:['Previous state restored','The action was reversed.'],'Undo blocked':['Undo blocked','Newer work was preserved.'],'Execution stopped':['Execution stopped',r.message]};
  if(r.state==='Completed')return[r.result?.summary??'Action completed',r.result?.undoToken?'Undo is available.':'No undo is available.'] as const;
  return map[r.state]??['Unknown state',''];
}
function resultContext(action:Action|null,before:Snapshot,after:Snapshot,r:Runtime){
  if(!action)return{before:'No action constructed',after:r.state==='Awaiting clarification'?'Waiting for a material detail':'No world change'};
  if(action.type==='send_message')return{before:'Outbox · '+before.messages.length+' messages',after:r.result?'+ Message → '+(after.contacts.find(c=>c.id===action.recipientId)?.name??action.recipientId):'No message sent'};
  if(action.type==='add_list_item'){const old=before.lists.find(l=>l.id===action.listId),next=after.lists.find(l=>l.id===action.listId);return{before:(old?.name??'List')+' · '+(old?.items.length??0)+' items',after:r.result?'+ '+action.item+' · '+(next?.items.length??0)+' items':'No list change'};}
  if(action.type==='create_document')return{before:'Documents · '+before.documents.length,after:r.result?'+ '+action.title:'No document created'};
  const old=before.documents.find(d=>d.id===action.documentId),next=after.documents.find(d=>d.id===action.documentId);
  if(action.type==='edit_document')return{before:(old?.title??action.documentId)+' · v'+(old?.version??action.expectedVersion),after:r.result?'Edited · v'+(next?.version??action.expectedVersion+1):'Original preserved'};
  return{before:(old?.title??action.documentId)+' · available',after:r.result?(action.permanent?'Permanently deleted':'Moved to trash'):'Document preserved'};
}

export default function Page(){
  const runtime=useRef<Runtime|null>(null);if(!runtime.current||!Array.isArray(runtime.current.trace))runtime.current=new Runtime();const r=runtime.current;
  const[,refresh]=useState(0),[input,setInput]=useState(''),[answer,setAnswer]=useState(''),[drawer,setDrawer]=useState<Drawer>(null),[worldTab,setWorldTab]=useState<'documents'|'lists'|'messages'>('documents'),[before,setBefore]=useState<Snapshot>(()=>r.world.snapshot());
  const update=()=>refresh(n=>n+1);
  useEffect(()=>{const ops:Partial<Record<State,()=>void>>={Assessing:()=>r.assess(),Executing:()=>r.execute(),Undoing:()=>r.undo()};const op=ops[r.state];if(!op)return;const timer=setTimeout(()=>{op();update()},180);return()=>clearTimeout(timer)},[r,r.state]);
  useEffect(()=>{if(!drawer)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setDrawer(null)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[drawer]);
  const submit=async(clarifying=false)=>{if(!clarifying)setBefore(r.world.snapshot());const p=r.interpret(clarifying?r.inputRequest:input,clarifying?answer:undefined);update();await p;if(runtime.current===r)update();setAnswer('')};
  const select=(id:ExampleId)=>{setBefore(r.world.snapshot());setInput('');r.prepare(id);update()};
  const snapshot=r.world.snapshot(),assessment=r.assessment,raw=firstDecision(r.trace,r.decision),decision=presentDecision(raw,r.state),result=resultText(r),delta=resultContext(r.action,before,snapshot,r);
  const request=r.naturalLanguage?r.inputRequest:examples.find(x=>x[0]===r.selected)?.[2]??'No request yet';
  return <main>
    <header className="lab-header"><div className="identity"><strong>Human Agency in AI</strong><span>Invisible Lab</span></div><p>How can AI preserve user agency without asking permission for everything?</p><div className="inspect-controls"><button onClick={()=>setDrawer('trace')}>Trace <span>{r.trace.length}</span></button><button onClick={()=>setDrawer('world')}>Workspace</button></div></header>
    <section className="request-zone" aria-labelledby="request-label"><div className="request-heading"><span className="step-label" id="request-label">USER REQUEST</span><p>{request}</p></div><form className="request-composer" onSubmit={e=>{e.preventDefault();void submit()}}><label className="sr-only" htmlFor="request">Describe an action</label><textarea id="request" value={input} onChange={e=>setInput(e.target.value)} maxLength={2000} placeholder="Describe an action…" disabled={r.busy}/><button className="run-button" disabled={r.busy||!input.trim()}>Run <span>→</span></button></form><div className="scenario-row" aria-label="Example scenarios"><span>TRY</span>{featured.map(id=>{const x=examples.find(e=>e[0]===id)!;return <button key={id} className={r.selected===id?'active':''} disabled={r.busy} onClick={()=>select(id)}>{x[1]}</button>})}<label className="scenario-select">More <select value="" disabled={r.busy} onChange={e=>{if(e.target.value)select(e.target.value as ExampleId)}}><option value="">scenarios</option>{examples.filter(x=>!featured.includes(x[0])).map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select></label></div></section>
    <section className="behavior-board" aria-label="Behavioral decision chain">
      <article className="stage interpretation-stage"><StageHeading n="01" title="INTERPRET"/><pre className="action-code">{JSON.stringify(actionData(r.action,r.trace,r),null,2)}</pre></article>
      <article className="stage assessment-stage"><StageHeading n="02" title="ASSESS"/><div className="dimension-list"><Dimension icon="ambiguity" label="Ambiguity" value={assessment?.ambiguity} options={[['clear','Clear'],['minor','Unclear'],['material','Ambiguous']]}/><Dimension icon="consequence" label="Consequence" value={assessment?.consequence} options={[['low','Low'],['moderate','Moderate'],['serious','Serious']]}/><Dimension icon="reversibility" label="Reversibility" value={assessment?.reversibility} options={[['easy','Easy'],['difficult','Difficult'],['irreversible','Irreversible']]}/><Dimension icon="external" label="External impact" value={assessment?.externalImpact} options={[['user_only','User only'],['indirect','Indirect'],['direct','Direct']]}/><Dimension icon="authorization" label="Authorization" value={assessment?.authorization} options={[['missing','Missing'],['unclear_scope','Unclear'],['prior_in_scope','Prior'],['explicit','Explicit']]}/></div></article>
      <article className={'stage policy-stage tone-'+decision.tone} aria-live="polite"><StageHeading n="03" title="POLICY"/><Icon name={(r.action?.type??'policy') as IconName}/><h1>{decision.label}</h1><div className="why"><span>Why this decision?</span><ul>{reasons(raw,assessment).map(x=><li key={x}>{x}</li>)}</ul></div>
        {r.state==='Awaiting approval'&&<div className="decision-actions"><button className="primary" onClick={()=>{r.approve();update()}}>Confirm action</button><button onClick={()=>{r.decline();update()}}>Cancel</button></div>}
        {r.state==='Awaiting clarification'&&!r.naturalLanguage&&<div className="clarification-choices">{snapshot.documents.filter(d=>d.title==='Old draft'&&!d.deleted).map(d=><button key={d.id} onClick={()=>{r.clarify(d.id);update()}}>{d.id} · version {d.version}</button>)}</div>}
        {r.state==='Awaiting clarification'&&r.naturalLanguage&&<form className="clarification-form" onSubmit={e=>{e.preventDefault();void submit(true)}}><input aria-label="Clarification answer" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Add the missing detail"/><button className="primary" disabled={!answer.trim()}>Continue</button></form>}
        {(r.state==='Interpreting'||(r.naturalLanguage&&r.state==='Awaiting clarification'))&&<button className="text-button" onClick={()=>{r.cancelInterpretation();update()}}>Cancel request</button>}
        {r.state==='Completed'&&r.result?.undoToken&&<div className="decision-actions"><button className="primary" onClick={()=>{r.beginUndo();update()}}>Undo action</button><button onClick={()=>{r.simulateEdit();update()}}>Simulate subsequent edit</button></div>}
      </article>
      <article className="stage state-stage"><StageHeading n="04" title="STATE"/><Lifecycle state={r.state}/></article>
      <article className="stage result-stage"><StageHeading n="05" title="RESULT"/><div className="world-delta"><div><span>BEFORE</span><strong>{delta.before}</strong></div><i>→</i><div><span>AFTER</span><strong>{delta.after}</strong><small>{result[0]}</small></div></div>{(r.state==='Execution stopped'||r.state==='Undo blocked')&&<p className="containment">{result[1]}</p>}</article>
    </section>
    {drawer&&<div className="drawer-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setDrawer(null)}}><aside className={'drawer '+(drawer==='trace'?'trace-drawer':'')} role="dialog" aria-modal="true" aria-labelledby="drawer-title"><div className="drawer-header"><div><span className="step-label">SECONDARY VIEW</span><h2 id="drawer-title">{drawer==='trace'?'System trace':'Simulated workspace'}</h2></div><button className="close-button" onClick={()=>setDrawer(null)} aria-label="Close panel">×</button></div>{drawer==='trace'?<div className="trace-list">{r.trace.length?r.trace.map(entry=><details className={'trace-entry source-'+entry.source} key={entry.id}><summary><span>{String(entry.id).padStart(2,'0')}</span><div><strong>{entry.event}</strong><small>{entry.source} · {new Date(entry.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</small></div></summary><p>{entry.summary}</p>{entry.data!==undefined&&<pre>{traceJson(entry.data)}</pre>}</details>):<p className="drawer-empty">Run a request to create a trace.</p>}</div>:<><div className="drawer-tabs"><button aria-pressed={worldTab==='documents'} onClick={()=>setWorldTab('documents')}>Documents ({snapshot.documents.length})</button><button aria-pressed={worldTab==='lists'} onClick={()=>setWorldTab('lists')}>Lists ({snapshot.lists.length})</button><button aria-pressed={worldTab==='messages'} onClick={()=>setWorldTab('messages')}>Outbox ({snapshot.messages.length})</button></div><div className="resources">{worldTab==='documents'?snapshot.documents.map(d=><article key={d.id} className={d.deleted?'trashed':''}><div><span>{d.shared?'SHARED':'PRIVATE'} · V{d.version}</span>{d.deleted&&<span>IN TRASH</span>}</div><h3>{d.title}</h3><p>{d.content}</p><small>{d.id} · {d.historyEnabled?'History available':'No version history'}</small></article>):worldTab==='lists'?snapshot.lists.map(l=><article key={l.id}><div><span>PRIVATE LIST</span><span>{l.items.length} ITEMS</span></div><h3>{l.name}</h3><p>{l.items.join(' · ')}</p><small>{l.id}</small></article>):snapshot.messages.length?snapshot.messages.map(m=><article key={m.id}><div><span>TO {m.recipientId.toUpperCase()} · {m.channel.toUpperCase()}</span></div><h3>Simulated message</h3><p>{m.content}</p></article>):<p className="drawer-empty">No messages have been sent.</p>}</div><button className="reset-button" disabled={r.busy&&r.state!=='Awaiting clarification'&&r.state!=='Awaiting approval'} onClick={()=>{runtime.current=new Runtime();setBefore(runtime.current.world.snapshot());setDrawer(null);update()}}>Reset simulated workspace</button></>}</aside></div>}
  </main>
}
function StageHeading({n,title}:{n:string;title:string}){return <div className="stage-heading"><span>{n}</span><b>{title}</b></div>}
function Dimension({icon,label,value,options}:{icon:IconName;label:string;value?:string;options:[string,string][]}){return <div className="dimension"><div className="dimension-name"><Icon name={icon}/><span>{label}</span></div><div className="semantic-scale">{options.map(([key,text])=><span key={key} className={value===key?'selected':''}>{text}</span>)}</div></div>}
function Lifecycle({state}:{state:State}){const steps=['Interpreting','Assessing','Deciding','Executing','Completed'],index:Record<State,number>={Ready:-1,Interpreting:0,Assessing:1,'Awaiting clarification':2,'Awaiting approval':2,Executing:3,Completed:4,Cancelled:2,Undoing:4,Undone:4,'Undo blocked':4,'Execution stopped':4},current=index[state];return <div className="lifecycle">{steps.map((step,i)=><div key={step} className={i<current?'done':i===current?'current':''}><i/><span>{step}</span></div>)}</div>}
function Icon({name}:{name:IconName}){const p:Record<IconName,React.ReactNode>={
  ambiguity:<><circle cx="12" cy="12" r="8"/><path d="M9.8 9a2.3 2.3 0 1 1 3.3 2.1c-.8.4-1.1.9-1.1 1.9M12 16.7h.01"/></>,consequence:<><path d="M12 3 3.8 19h16.4L12 3Z"/><path d="M12 9v4M12 16h.01"/></>,reversibility:<><path d="M8 7H4v-4M4.5 7A8 8 0 1 1 4 15"/></>,external:<><circle cx="8" cy="9" r="3"/><circle cx="17" cy="8" r="2"/><path d="M3 20c.4-4 2-6 5-6s4.6 2 5 6M14 13c3 0 5 2 5 5"/></>,authorization:<><rect x="5" y="10" width="14" height="10" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/></>,create_document:<><path d="M6 3h8l4 4v14H6zM14 3v5h4M9 14h6M12 11v6"/></>,edit_document:<><path d="M5 20h4l10-10-4-4L5 16v4ZM13.5 7.5l4 4M5 4h6"/></>,delete_document:<><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,send_message:<><path d="m3 11 18-8-7 18-3-7-8-3Z"/><path d="m11 14 10-11"/></>,add_list_item:<><path d="M10 6h10M10 12h10M10 18h10M4 6h1M4 12h1M4 18h1"/></>,policy:<><path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4Z"/><path d="m9 12 2 2 4-5"/></>
};return <svg className="outline-icon" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{p[name]}</svg>}
