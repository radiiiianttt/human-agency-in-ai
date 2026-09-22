import { z } from 'zod';
import type { Action } from '../engine/world.ts';
import type { Assessment } from '../engine/policy.ts';

const text = z.string().max(12000);

export const WorldSchema = z.object({
  documents: z
    .array(
      z.object({
        id: z.string(),
        title: text,
        content: text,
        folder: text,
        shared: z.boolean(),
        historyEnabled: z.boolean(),
        version: z.number().int().positive(),
        deleted: z.boolean(),
      })
    )
    .max(100),

  contacts: z
    .array(
      z.object({
        id: z.string(),
        name: text,
        channel: text,
      })
    )
    .max(100),

  lists: z
    .array(
      z.object({
        id: z.string(),
        name: text,
        items: z.array(text).max(200),
      })
    )
    .max(100),
});

export const InputSchema = z.object({
  request: z.string().trim().min(1).max(2000),

  world: WorldSchema,

  clarification: z
    .array(
      z.object({
        question: z.string().max(2000),
        answer: z.string().max(2000),
      })
    )
    .max(8)
    .default([]),
});

export const InterpretationSchema = z
  .object({
    status: z.enum([
      'proposed',
      'clarify',
      'unsupported',
    ]),

    summary: text,

    question: text,

    action: z
      .object({
        type: z.enum([
          'create_document',
          'edit_document',
          'delete_document',
          'send_message',
          'add_list_item',
        ]),

        targetId: z.string().nullable(),

        title: text.nullable(),

        content: text.nullable(),

        folder: text.nullable(),

        channel: text.nullable(),

        permanent: z.boolean().nullable(),

        item: text.nullable(),
      })
      .nullable(),

    consequence: z.enum([
      'low',
      'moderate',
      'serious',
    ]),

    authorization: z.enum([
      'explicit',
      'missing',
      'unclear_scope',
    ]),

    materialContextMissing: z.boolean(),

    rationale: text,
  })
  .strict();

export type Interpretation = z.infer<
  typeof InterpretationSchema
>;

export type InterpretationInput = z.infer<
  typeof InputSchema
>;

export function constructProposal(
  output: Interpretation,
  world: InterpretationInput['world'],
  revision: string
): {
  action: Action;
  assessment: Assessment;
} {
  if (
    output.status !== 'proposed' ||
    !output.action ||
    output.materialContextMissing
  ) {
    throw new Error(
      'Interpretation is not ready for execution'
    );
  }

  const p = output.action;

  const need = (value: string | null) => {
    if (value === null) {
      throw new Error('Missing action field');
    }

    return value;
  };

  let action: Action;

  let easy = false;

  let external: Assessment['externalImpact'] =
    'user_only';

  let reversal: Assessment['reversibility'] =
    'irreversible';

  if (p.type === 'create_document') {
    action = {
      type: p.type,
      title: need(p.title),
      content: need(p.content),
      folder: need(p.folder),
    };

    easy = true;
    reversal = 'easy';
  }

  else if (p.type === 'send_message') {
    const recipient = world.contacts.find(
      contact =>
        contact.id === p.targetId &&
        contact.channel === p.channel
    );

    if (!recipient) {
      throw new Error(
        'Unknown recipient or channel'
      );
    }

    action = {
      type: p.type,
      recipientId: recipient.id,
      channel: recipient.channel,
      content: need(p.content),
    };

    external = 'direct';
  }

  else if (p.type === 'add_list_item') {
    const list = world.lists.find(
      list => list.id === p.targetId
    );

    if (!list) {
      throw new Error(
        'Unknown or unavailable list'
      );
    }

    action = {
      type: p.type,
      listId: list.id,
      item: need(p.item),
    };

    // Adding a list item is conceptually easy to reverse,
    // but list undo has not been implemented yet.
    reversal = 'easy';
    easy = false;
    external = 'user_only';
  }

  else {
    const doc = world.documents.find(
      document =>
        document.id === p.targetId &&
        !document.deleted
    );

    if (!doc) {
      throw new Error(
        'Unknown or unavailable document'
      );
    }

    external = doc.shared
      ? 'direct'
      : 'user_only';

    if (p.type === 'edit_document') {
      action = {
        type: p.type,
        documentId: doc.id,
        expectedVersion: doc.version,
        content: need(p.content),
      };

      easy =
        doc.historyEnabled &&
        !doc.shared;

      reversal = easy
        ? 'easy'
        : doc.shared
          ? 'irreversible'
          : 'difficult';
    }

    else {
      if (p.permanent === null) {
        throw new Error(
          'Deletion mode is missing'
        );
      }

      action = {
        type: p.type,
        documentId: doc.id,
        expectedVersion: doc.version,
        permanent: p.permanent,
      };

      easy =
        !p.permanent &&
        !doc.shared;

      reversal = easy
        ? 'easy'
        : 'irreversible';
    }
  }

  return {
    action,

    assessment: {
      actionRevision: revision,
      ambiguity: 'clear',
      materialContextMissing: false,
      consequence: output.consequence,
      authorization: output.authorization,
      externalImpact: external,
      reversibility: reversal,
      undoVerifiedAvailable: easy,
    },
  };
}