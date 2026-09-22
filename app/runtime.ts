import { InterpretationSchema, constructProposal } from './interpretation.ts';
import { createExampleWorld } from '../engine/fixtures.ts';
import { evaluatePolicy } from '../engine/policy.ts';
import type { Assessment, PolicyDecision } from '../engine/policy.ts';
import type { Action, ToolResult } from '../engine/world.ts';

export type State = 'Ready' | 'Interpreting' | 'Assessing' | 'Awaiting clarification' | 'Awaiting approval' | 'Executing' | 'Completed' | 'Cancelled' | 'Undoing' | 'Undone' | 'Undo blocked' | 'Execution stopped';
export type TraceSource = 'user' | 'model' | 'runtime' | 'policy' | 'tool' | 'world';
export interface TraceEntry {
  id: number;
  at: string;
  source: TraceSource;
  event: string;
  summary: string;
  data?: unknown;
}
export const examples = [
  ['note', 'Create a private note', 'Add a note called Ideas.'],
  ['ambiguous', 'Delete the old draft', 'Two documents match this request.'],
  ['send', 'Tell Alex I’m running late', 'Send “I’m five minutes late.” via chat.'],
  ['permission', 'Send the email draft', 'Sending goes beyond the original drafting request.'],
  ['edit', 'Edit a private report', 'Replace a section, with verified undo.'],
  ['no-undo', 'Edit without version history', 'Restoration would require manual work.'],
  ['thesis', 'Delete the only thesis copy', 'Permanent deletion. No copy will remain.'],
  ['shared', 'Change the team plan', 'A serious disruption, even if the file is restored.'],
  ['prior', 'Create a meeting note', 'A private note covered by prior permission.'],
] as const;
export type ExampleId = typeof examples[number][0];
export class Runtime {
  world = createExampleWorld();
  state: State = 'Ready';
  decision: PolicyDecision | null = null;
  assessment: Assessment | null = null;
  action: Action | null = null;
  result: ToolResult | null = null;
  message = 'Choose an action to begin.';
  title = 'Your next action';
  selected: ExampleId | null = null;
  path: State[] = [];
  trace: TraceEntry[] = [];
  inputRequest = '';
  clarification: {question:string;answer:string}[] = [];
  naturalLanguage = false;
  private sequence = 0;
  private interpretationSequence = 0;
  private traceSequence = 0;
  private record(source: TraceSource, event: string, summary: string, data?: unknown) {
    this.trace.push({ id: ++this.traceSequence, at: new Date().toISOString(), source, event, summary, ...(data === undefined ? {} : { data }) });
  }
  private beginTrace(summary: string, data: unknown) {
    this.trace = [];
    this.traceSequence = 0;
    this.record('user', 'request.received', summary, data);
  }
  async interpret(request: string, answer?: string) {
    if (answer === undefined && this.busy) return;
    if (answer !== undefined && this.state !== 'Awaiting clarification') return;
    const ticket = ++this.interpretationSequence;
    if (answer === undefined) {
      this.inputRequest=request; this.clarification=[]; this.path=[];
      this.beginTrace('Natural-language request received', { request });
    } else {
      this.record('user', 'clarification.answered', 'User answered the clarification question', { question:this.message, answer });
      this.clarification.push({question:this.message,answer});
    }
    this.naturalLanguage=true;this.selected=null;this.action=null;this.assessment=null;this.result=null;this.decision=null;
    this.title=this.inputRequest;this.message='Interpreting your request…';this.move('Interpreting');
    try {
      const snapshot=this.world.snapshot();
      const started=Date.now();
      this.record('runtime', 'interpretation.requested', 'Sent request and simulated context for structured interpretation', {
        clarificationTurns:this.clarification.length, documents:snapshot.documents.length, contacts:snapshot.contacts.length, lists:snapshot.lists.length,
      });
      const response=await fetch('/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({request:this.inputRequest,clarification:this.clarification,world:{documents:snapshot.documents,contacts:snapshot.contacts,lists:snapshot.lists}})});
      const data=await response.json();
      if(ticket!==this.interpretationSequence) {
        this.record('runtime', 'interpretation.discarded', 'Ignored a late interpretation response after cancellation');
        return;
      }
      if(!response.ok) throw new Error(data.error||'Interpretation failed.');
      const output=InterpretationSchema.parse(data);
      this.record('model', 'interpretation.completed', `Model returned ${output.status}`, {
        durationMs:Date.now()-started,
        status:output.status,
        summary:output.summary,
        question:output.question || undefined,
        proposedAction:output.action,
        estimatedConsequence:output.consequence,
        estimatedAuthorization:output.authorization,
        materialContextMissing:output.materialContextMissing,
        rationale:output.rationale,
      });
      this.message=output.summary;
      if(output.status==='unsupported') {this.record('runtime','request.unsupported','No supported action was constructed');this.move('Execution stopped');return;}
      if(output.status==='clarify') {
        this.message=output.question||'Please clarify your request.';
        this.record('runtime','clarification.requested','Execution paused for missing or ambiguous context',{question:this.message});
        this.move('Awaiting clarification');return;
      }
      const proposal=constructProposal(output,this.world.snapshot(),`action-${++this.sequence}`);
      this.action=proposal.action;this.assessment=proposal.assessment;
      this.record('runtime','action.constructed','Validated a concrete action against the current simulated world',proposal.action);
      this.record('runtime','assessment.constructed','Combined model estimates with deterministic world properties',proposal.assessment);
      this.move('Assessing');
    } catch(error) {
      if(ticket!==this.interpretationSequence) return;
      this.message=error instanceof Error?error.message:'Interpretation failed. Nothing was executed.';this.move('Execution stopped');
      this.record('runtime','interpretation.failed','Interpretation stopped without executing a tool',{message:this.message});
    }
  }
  cancelInterpretation() {
    this.interpretationSequence++;
    this.record('user','request.cancelled','User cancelled the pending request');
    this.move('Cancelled');this.message='Request cancelled. Nothing was executed.';
  }

  get busy() { return ['Interpreting','Assessing','Executing','Undoing','Awaiting clarification','Awaiting approval'].includes(this.state); }
  private move(state: State) {
    const previous=this.state;
    this.state = state; this.path.push(state);
    this.record('runtime','state.transition',`${previous} → ${state}`,{from:previous,to:state});
  }
  prepare(id: ExampleId) {
    if (this.busy) return;
    const item = examples.find(x => x[0] === id)!;
    this.beginTrace('Example request selected', { exampleId:id, request:item[2] });
    this.naturalLanguage=false;this.selected = id; this.title = item[1]; this.message = item[2];
    this.result = null; this.path = []; this.decision = null;
    const a: Assessment = { actionRevision: `action-${++this.sequence}`, ambiguity: 'clear', materialContextMissing: false,
      consequence: 'low', reversibility: 'easy', undoVerifiedAvailable: true, externalImpact: 'user_only', authorization: 'explicit' };
    const docId = id === 'no-undo' ? 'no-history' : id === 'shared' ? 'team-plan' : id === 'thesis' ? 'thesis' : 'private-report';
    const doc = this.world.snapshot().documents.find(d => d.id === docId);
    switch(id) {
      case 'note': case 'prior':
        this.action = { type: 'create_document', title: id === 'prior' ? 'Meeting notes' : 'Ideas', content: 'A new private note.', folder: id === 'prior' ? 'meeting-notes' : 'private' };
        if (id === 'prior') a.authorization = 'prior_in_scope';
        break;
      case 'ambiguous': a.ambiguity = 'material'; this.action = null; this.message = 'Which old draft do you mean?'; break;
      case 'send': case 'permission':
        this.action = { type: 'send_message', recipientId: 'alex', channel: 'chat', content: id === 'send' ? 'I’m five minutes late.' : 'Here is the draft for review.' };
        a.externalImpact = 'direct'; a.reversibility = 'irreversible'; a.undoVerifiedAvailable = false;
        if (id === 'permission') a.authorization = 'missing';
        break;
      default:
        this.action = id === 'thesis' ? { type: 'delete_document', documentId: docId, expectedVersion: doc?.version ?? -1, permanent: true }
          : { type: 'edit_document', documentId: docId, expectedVersion: doc?.version ?? -1, content: 'Revised section from the Human Agency in AI experiment.' };
        a.consequence = id === 'thesis' || id === 'shared' ? 'serious' : 'moderate';
        a.reversibility = id === 'thesis' || id === 'shared' ? 'irreversible' : id === 'no-undo' ? 'difficult' : 'easy';
        a.undoVerifiedAvailable = id === 'edit'; a.externalImpact = id === 'shared' ? 'direct' : 'user_only';
    }
    this.assessment = a;
    this.record('runtime','action.constructed',this.action?'Constructed the preset action':'No action constructed until clarification',this.action);
    this.record('runtime','assessment.constructed','Loaded the preset assessment',a);
    this.move('Assessing');
  }
  assess() {
    if (this.state !== 'Assessing' || !this.assessment) return;
    this.decision = evaluatePolicy(this.assessment);
    this.record('policy','policy.evaluated',`Policy v0 chose ${this.decision.type}`,{assessment:this.assessment,decision:this.decision});
    if (this.decision.type === 'clarify') this.move('Awaiting clarification');
    else if (this.decision.type === 'execute') this.move('Executing');
    else this.move('Awaiting approval');
  }
  clarify(id: string) {
    if (this.state !== 'Awaiting clarification' || !this.assessment) return;
    const doc = this.world.snapshot().documents.find(d => d.id === id && !d.deleted);
    if (!doc) return;
    this.record('user','clarification.answered','User selected a concrete document target',{documentId:id});
    this.action = { type: 'delete_document', documentId: id, expectedVersion: doc.version, permanent: false };
    this.assessment = { ...this.assessment, actionRevision: `action-${++this.sequence}`, ambiguity: 'clear' };
    this.message = `Move ${doc.title} (${doc.id}) to trash.`;
    this.record('runtime','action.constructed','Constructed a trash action from the clarified target',this.action);
    this.record('runtime','assessment.revised','Revised the assessment after clarification',this.assessment);
    this.move('Assessing');
  }
  approve() {
    if (this.state !== 'Awaiting approval' || !this.assessment || !this.action) return;
    this.record('user','approval.granted','User approved the exact reviewed action',{actionRevision:this.assessment.actionRevision});
    // Recheck version before accepting approval of a stale proposal.
    if ('documentId' in this.action) {
      const targetId = this.action.documentId;
      const doc = this.world.snapshot().documents.find(d => d.id === targetId);
      if (!doc || doc.deleted || doc.version !== this.action.expectedVersion) {
        this.message = 'The document changed. Start a new action to review its current state.';
        this.record('runtime','execution.blocked','Approved action became stale before execution',{documentId:targetId,expectedVersion:this.action.expectedVersion,currentVersion:doc?.version});
        this.move('Execution stopped'); return;
      }
    }
    this.decision = evaluatePolicy(this.assessment, { actionRevision: this.assessment.actionRevision });
    this.record('policy','policy.evaluated',`Policy v0 chose ${this.decision.type} after approval`,{assessment:this.assessment,approval:{actionRevision:this.assessment.actionRevision},decision:this.decision});
    if (this.decision.type === 'execute') this.move('Executing');
  }
  decline() {
    if (this.state !== 'Awaiting approval') return;
    this.record('user','approval.declined','User declined the reviewed action');
    this.move('Cancelled'); this.message = 'Action cancelled. Nothing was changed.';
  }
  execute() {
    if (this.state !== 'Executing' || !this.action) return;
    this.record('tool','tool.called',`Calling simulated ${this.action.type}`,this.action);
    try {
      this.result = this.world.execute(this.action); this.message = this.result.summary;
      this.record('tool','tool.succeeded',this.result.summary,{resourceId:this.result.resourceId,undoAvailable:Boolean(this.result.undoToken)});
      this.move('Completed');
    }
    catch (error) {
      this.message = error instanceof Error ? error.message : 'Execution could not complete';
      this.record('tool','tool.failed','Simulated tool did not complete',{message:this.message});
      this.move('Execution stopped');
    }
  }
  beginUndo() {
    if (this.state !== 'Completed' || !this.result?.undoToken) return;
    const check = this.world.checkUndo(this.result.undoToken);
    this.record('world','undo.checked',check.available?'Undo is still safe':'Undo is no longer safe',{available:check.available,reason:check.reason});
    if (!check.available) { this.message = check.reason ?? 'Undo is no longer safe'; this.move('Undo blocked'); }
    else this.move('Undoing');
  }
  undo() {
    if (this.state !== 'Undoing' || !this.result?.undoToken) return;
    this.record('tool','undo.called','Calling simulated undo',{resourceId:this.result.resourceId});
    const result = this.world.undo(this.result.undoToken);
    this.message = result.status === 'undone' ? 'The previous state has been restored.' : result.reason;
    this.record('tool',result.status==='undone'?'undo.succeeded':'undo.blocked',this.message,result);
    this.move(result.status === 'undone' ? 'Undone' : 'Undo blocked');
  }
  simulateEdit() {
    if (this.state !== 'Completed' || !this.result?.undoToken) return;
    this.world.simulateExternalEdit(this.result.resourceId, 'A collaborator’s newer work.');
    this.message = 'A subsequent edit is now present. Try undo to check recovery.';
    this.record('world','world.changed','Simulated a newer edit after execution',{resourceId:this.result.resourceId});
  }
}
