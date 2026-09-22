/** Structured input from the future assessment layer, not raw user text. */
export interface Assessment {
  /** A trusted caller changes this whenever scope, target or consequences change. */
  actionRevision: string;
  ambiguity: 'clear' | 'minor' | 'material';
  /** True when missing context could change the policy decision. */
  materialContextMissing: boolean;
  consequence: 'low' | 'moderate' | 'serious';
  reversibility: 'easy' | 'difficult' | 'irreversible' | 'unknown';
  /** Verified restoration with minimal effort and no meaningful residual effects. */
  undoVerifiedAvailable: boolean;
  externalImpact: 'user_only' | 'indirect' | 'direct';
  authorization: 'explicit' | 'prior_in_scope' | 'unclear_scope' | 'missing';
}

/** Supplied by trusted interaction state only after explicit user confirmation.
 * The prompt must have covered the action and its assessed consequences.
 * Never construct this from model output or the initial command alone.
 */
export interface Approval {
  actionRevision: string;
}

export type PolicyDecision =
  | { type: 'clarify'; reason: 'material_ambiguity' | 'material_context_missing' | 'authorization_scope_unclear' }
  | { type: 'request_authorization'; reason: 'authorization_missing'; consequenceConfirmationRequired: boolean }
  | { type: 'confirm'; reason: 'serious_consequence' | 'moderate_without_easy_undo' }
  | { type: 'execute'; reason: 'approved_action' | 'authorized_low_consequence' | 'moderate_with_easy_undo'; offerUndo: boolean };

/** Pure Policy v0 decision function. Does not call tools or mutate the world. */
export function evaluatePolicy(assessment: Assessment, approval?: Approval): PolicyDecision {
  if (!assessment.actionRevision.trim()) throw new Error('actionRevision must be nonempty');
  if (assessment.ambiguity === 'material') {
    return { type: 'clarify', reason: 'material_ambiguity' };
  }
  if (assessment.materialContextMissing) {
    return { type: 'clarify', reason: 'material_context_missing' };
  }
  if (assessment.authorization === 'unclear_scope') {
    return { type: 'clarify', reason: 'authorization_scope_unclear' };
  }

  const easyUndo = assessment.reversibility === 'easy' && assessment.undoVerifiedAvailable;
  const confirmationReason = assessment.consequence === 'serious'
    ? 'serious_consequence'
    : assessment.consequence === 'moderate' && !easyUndo
      ? 'moderate_without_easy_undo'
      : undefined;
  const approved = approval?.actionRevision === assessment.actionRevision;

  if (assessment.authorization === 'missing' && !approved) {
    return { type: 'request_authorization', reason: 'authorization_missing',
      consequenceConfirmationRequired: confirmationReason !== undefined };
  }
  if (confirmationReason && !approved) {
    return { type: 'confirm', reason: confirmationReason };
  }
  return { type: 'execute', offerUndo: easyUndo,
    reason: approved ? 'approved_action' : assessment.consequence === 'moderate'
      ? 'moderate_with_easy_undo' : 'authorized_low_consequence' };
}
