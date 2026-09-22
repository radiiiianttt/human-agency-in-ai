import { createWorld } from './world.ts';
import type { Document } from './world.ts';

/** Fresh fixtures each time; all people, files, messages and lists are simulated. */
export function createExampleWorld() {
  const doc = (
    id: string,
    title: string,
    extra: Partial<Document> = {}
  ): Document => ({
    id,
    title,
    content: `Original content of ${title}`,
    folder: 'private',
    shared: false,
    historyEnabled: true,
    version: 1,
    deleted: false,
    ...extra,
  });

  return createWorld({
    documents: [
      doc('draft-a', 'Old draft'),
      doc('draft-b', 'Old draft'),
      doc('private-report', 'Private report'),
      doc('no-history', 'Document without history', {
        historyEnabled: false,
      }),
      doc('thesis', 'Only thesis copy', {
        historyEnabled: false,
      }),
      doc('team-plan', 'Team project plan', {
        shared: true,
        folder: 'shared',
      }),
    ],

    contacts: [
      {
        id: 'alex',
        name: 'Alex',
        channel: 'chat',
      },
    ],

    lists: [
      {
        id: 'grocery-list',
        name: 'Grocery List',
        items: ['milk', 'eggs'],
      },
    ],
  });
}