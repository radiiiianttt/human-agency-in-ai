/** In-memory test world. Tools are primitives; the future runtime gates their use. */

export interface Document {
  id: string;
  title: string;
  content: string;
  folder: string;
  shared: boolean;
  historyEnabled: boolean;
  version: number;
  deleted: boolean;
}

export interface Contact {
  id: string;
  name: string;
  channel: string;
}

export interface Message {
  id: string;
  recipientId: string;
  channel: string;
  content: string;
}

export interface List {
  id: string;
  name: string;
  items: string[];
}

export type Action =
  | {
      type: 'create_document';
      title: string;
      content: string;
      folder: string;
    }
  | {
      type: 'edit_document';
      documentId: string;
      expectedVersion: number;
      content: string;
    }
  | {
      type: 'delete_document';
      documentId: string;
      expectedVersion: number;
      permanent: boolean;
    }
  | {
      type: 'send_message';
      recipientId: string;
      channel: string;
      content: string;
    }
  | {
      type: 'add_list_item';
      listId: string;
      item: string;
    };

export interface ToolResult {
  resourceId: string;
  summary: string;
  undoToken?: string;
}

export type UndoResult =
  | { status: 'undone' }
  | { status: 'blocked'; reason: string };

interface UndoRecord {
  id: string;
  expectedVersion: number;
  before: Document | null;
}

export function createWorld(seed: {
  documents: Document[];
  contacts: Contact[];
  lists: List[];
}) {
  const documents = new Map(
    seed.documents.map(document => [
      document.id,
      structuredClone(document),
    ])
  );

  const contacts = new Map(
    seed.contacts.map(contact => [
      contact.id,
      structuredClone(contact),
    ])
  );

  const lists = new Map(
    seed.lists.map(list => [
      list.id,
      structuredClone(list),
    ])
  );

  const messages: Message[] = [];

  const undoRecords = new Map<string, UndoRecord>();

  if (
    documents.size !== seed.documents.length ||
    contacts.size !== seed.contacts.length ||
    lists.size !== seed.lists.length
  ) {
    throw new Error('Duplicate seed IDs');
  }

  let sequence = 0;

  const nextId = (prefix: string) => {
    let id: string;

    do {
      id = `${prefix}-${++sequence}`;
    } while (
      documents.has(id) ||
      contacts.has(id) ||
      lists.has(id)
    );

    return id;
  };

  const getDocument = (
    id: string,
    version: number
  ) => {
    const doc = documents.get(id);

    if (!doc || doc.deleted) {
      throw new Error('Document unavailable');
    }

    if (doc.version !== version) {
      throw new Error(
        'Document changed; reassess before execution'
      );
    }

    return doc;
  };

  const registerUndo = (
    doc: Document,
    before: Document | null
  ) => {
    const token = nextId('undo');

    undoRecords.set(token, {
      id: doc.id,
      expectedVersion: doc.version,
      before,
    });

    return token;
  };

  const undoProblem = (
    token: string
  ): string | undefined => {
    const record = undoRecords.get(token);

    if (!record) {
      return 'Undo unavailable or already used';
    }

    const current = documents.get(record.id);

    if (
      !current ||
      current.version !== record.expectedVersion
    ) {
      return 'Document changed since this action';
    }

    if (current.shared) {
      return 'Restoration cannot undo effects on other people';
    }
  };

  return {
    snapshot() {
      return structuredClone({
        documents: [...documents.values()],
        contacts: [...contacts.values()],
        lists: [...lists.values()],
        messages,
      });
    },

    execute(action: Action): ToolResult {
      switch (action.type) {
        case 'create_document': {
          const doc: Document = {
            id: nextId('doc'),
            title: action.title,
            content: action.content,
            folder: action.folder,
            shared: false,
            historyEnabled: true,
            version: 1,
            deleted: false,
          };

          documents.set(doc.id, doc);

          return {
            resourceId: doc.id,
            summary: 'Private document created',
            undoToken: registerUndo(doc, null),
          };
        }

        case 'edit_document': {
          const doc = getDocument(
            action.documentId,
            action.expectedVersion
          );

          const before = structuredClone(doc);

          doc.content = action.content;
          doc.version++;

          return {
            resourceId: doc.id,
            summary: 'Document edited',
            ...(doc.historyEnabled && !doc.shared
              ? {
                  undoToken: registerUndo(
                    doc,
                    before
                  ),
                }
              : {}),
          };
        }

        case 'delete_document': {
          const doc = getDocument(
            action.documentId,
            action.expectedVersion
          );

          if (action.permanent) {
            documents.delete(doc.id);

            for (const [
              token,
              record,
            ] of undoRecords) {
              if (record.id === doc.id) {
                undoRecords.delete(token);
              }
            }

            return {
              resourceId: doc.id,
              summary:
                'Document permanently deleted',
            };
          }

          const before = structuredClone(doc);

          doc.deleted = true;
          doc.version++;

          return {
            resourceId: doc.id,
            summary: 'Document moved to trash',
            ...(!doc.shared
              ? {
                  undoToken: registerUndo(
                    doc,
                    before
                  ),
                }
              : {}),
          };
        }

        case 'send_message': {
          const contact = contacts.get(
            action.recipientId
          );

          if (
            !contact ||
            contact.channel !== action.channel
          ) {
            throw new Error(
              'Recipient or channel unavailable'
            );
          }

          const message: Message = {
            id: nextId('message'),
            recipientId: contact.id,
            channel: action.channel,
            content: action.content,
          };

          messages.push(message);

          return {
            resourceId: message.id,
            summary:
              'Message added to simulated outbox',
          };
        }

        case 'add_list_item': {
          const list = lists.get(action.listId);

          if (!list) {
            throw new Error('List unavailable');
          }

          list.items.push(action.item);

          return {
            resourceId: list.id,
            summary: `${action.item} added to ${list.name}`,
          };
        }

        default: {
          throw new Error('Unsupported action');
        }
      }
    },

    checkUndo(token: string) {
      const reason = undoProblem(token);

      return reason
        ? {
            available: false,
            reason,
          }
        : {
            available: true,
          };
    },

    undo(token: string): UndoResult {
      // Recheck at execution time, not just when the button is displayed.
      const reason = undoProblem(token);

      if (reason) {
        return {
          status: 'blocked',
          reason,
        };
      }

      const record = undoRecords.get(token)!;
      const current = documents.get(record.id)!;

      if (record.before === null) {
        documents.delete(record.id);
      } else {
        documents.set(record.id, {
          ...structuredClone(record.before),
          version: current.version + 1,
        });
      }

      undoRecords.delete(token);

      return {
        status: 'undone',
      };
    },

    /** Test fixture operation to simulate a collaborator editing after execution. */
    simulateExternalEdit(
      documentId: string,
      content: string
    ) {
      const doc = documents.get(documentId);

      if (!doc || doc.deleted) {
        throw new Error('Document unavailable');
      }

      doc.content = content;
      doc.version++;
    },
  };
}