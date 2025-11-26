/**
 * Utilities for converting between Tiptap JSON and plain text.
 *
 * Since the campaign backend stores notes as plain text,
 * we need to convert Tiptap's JSON structure to/from plain text.
 */

interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string }>;
}

interface TiptapDocument {
  type: 'doc';
  content: TiptapNode[];
}

/**
 * Convert plain text to Tiptap JSON document structure.
 * Preserves line breaks as separate paragraphs.
 */
export function plainTextToTiptap(text: string | null | undefined): TiptapDocument {
  if (!text || text.trim() === '') {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    };
  }

  // Split by newlines and create paragraphs
  const lines = text.split('\n');
  const content: TiptapNode[] = lines.map((line) => {
    if (line.trim() === '') {
      return { type: 'paragraph' };
    }
    return {
      type: 'paragraph',
      content: [{ type: 'text', text: line }],
    };
  });

  return {
    type: 'doc',
    content,
  };
}

/**
 * Convert Tiptap JSON document to plain text.
 * Handles headings, paragraphs, lists, and text formatting.
 */
export function tiptapToPlainText(doc: TiptapDocument | null | undefined): string {
  if (!doc || !doc.content) {
    return '';
  }

  const extractText = (nodes: TiptapNode[]): string[] => {
    const lines: string[] = [];

    for (const node of nodes) {
      switch (node.type) {
        case 'paragraph':
        case 'heading': {
          const text = node.content ? extractTextFromInline(node.content) : '';
          lines.push(text);
          break;
        }
        case 'bulletList':
        case 'orderedList': {
          if (node.content) {
            let index = 1;
            for (const item of node.content) {
              if (item.type === 'listItem' && item.content) {
                const itemText = extractText(item.content).join('\n');
                const prefix = node.type === 'orderedList' ? `${index}. ` : '- ';
                lines.push(prefix + itemText);
                index++;
              }
            }
          }
          break;
        }
        case 'listItem': {
          if (node.content) {
            lines.push(...extractText(node.content));
          }
          break;
        }
        case 'text': {
          // Standalone text node (shouldn't happen at top level, but handle it)
          if (node.text) {
            lines.push(node.text);
          }
          break;
        }
        default:
          // For other node types, try to extract nested content
          if (node.content) {
            lines.push(...extractText(node.content));
          }
      }
    }

    return lines;
  };

  const extractTextFromInline = (nodes: TiptapNode[]): string => {
    return nodes
      .map((node) => {
        if (node.type === 'text') {
          return node.text || '';
        }
        if (node.content) {
          return extractTextFromInline(node.content);
        }
        return '';
      })
      .join('');
  };

  return extractText(doc.content).join('\n');
}

/**
 * Check if a Tiptap document is empty (no real content).
 */
export function isTiptapEmpty(doc: TiptapDocument | null | undefined): boolean {
  if (!doc || !doc.content) return true;

  const checkEmpty = (nodes: TiptapNode[]): boolean => {
    for (const node of nodes) {
      if (node.type === 'text' && node.text && node.text.trim() !== '') {
        return false;
      }
      if (node.content && !checkEmpty(node.content)) {
        return false;
      }
    }
    return true;
  };

  return checkEmpty(doc.content);
}
